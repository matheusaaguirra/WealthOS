import { Pool } from 'pg';
import type { AuthDatabase, AuthStatement, SqlValue } from './database-contract';

interface QueryResult {rows: Record<string, unknown>[]}
export interface QueryExecutor {query(sql: string, values?: SqlValue[]): Promise<QueryResult>}
export interface Connection extends QueryExecutor {release(): void}
export interface ConnectionPool extends QueryExecutor {connect(): Promise<Connection>}

// AuthCore uses fixed, authored SQL only. Values always travel as bound parameters.
function parameters(sql: string): string {
  let index=0;
  return sql.replace(/\?/g,()=>`$${++index}`);
}
class Statement implements AuthStatement {
  constructor(readonly owner: PostgresDatabase, readonly sql: string, readonly values: SqlValue[]=[]){}
  bind(...values: SqlValue[]): Statement {return new Statement(this.owner,this.sql,values);}
  async first<T=Record<string,unknown>>(column?: string): Promise<T|null> {
    const {rows}=await this.owner.pool.query(parameters(this.sql),this.values);
    return rows.length ? (column ? rows[0][column] : rows[0]) as T : null;
  }
  async all<T=Record<string,unknown>>(): Promise<{results: T[]}> {
    const {rows}=await this.owner.pool.query(parameters(this.sql),this.values);
    return {results:rows as T[]};
  }
  async run(): Promise<QueryResult> {return this.owner.pool.query(parameters(this.sql),this.values);}
}
export class PostgresDatabase implements AuthDatabase {
  constructor(readonly pool: ConnectionPool){}
  prepare(sql: string): AuthStatement {return new Statement(this,sql);}
  async batch(statements: AuthStatement[], userId?: string): Promise<unknown[]> {
    if(statements.some(statement=>!(statement instanceof Statement)||statement.owner!==this))throw new Error('Invalid database batch');
    const client=await this.pool.connect();
    try {
      await client.query('BEGIN');
      // Serialize concurrent full-portfolio replacements for the same user.
      if(userId)await client.query('SELECT id FROM users WHERE id = $1 FOR UPDATE',[userId]);
      const results=[];
      for(const statement of statements as Statement[])results.push(await client.query(parameters(statement.sql),statement.values));
      await client.query('COMMIT');
      return results;
    }catch(error){
      try {await client.query('ROLLBACK');}catch{/* Preserve the original error. */}
      throw error;
    }finally{client.release();}
  }
}
let current: PostgresDatabase|undefined;
export function database(): PostgresDatabase|undefined {
  if(!process.env.DATABASE_URL?.trim())return undefined;
  current??=new PostgresDatabase(new Pool({connectionString:process.env.DATABASE_URL,max:3,idleTimeoutMillis:10000,connectionTimeoutMillis:10000,allowExitOnIdle:true}));
  return current;
}
