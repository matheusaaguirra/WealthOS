import { Pool } from 'pg';
import { readdir, readFile } from 'node:fs/promises';
if(!process.env.DATABASE_URL)throw new Error('Configure DATABASE_URL before migrating.');
const pool=new Pool({connectionString:process.env.DATABASE_URL,max:1,connectionTimeoutMillis:10000});
const client=await pool.connect();
try {
  await client.query('BEGIN');
  await client.query("SELECT pg_advisory_xact_lock(hashtext('wealthos:migrations'))");
  await client.query('CREATE TABLE IF NOT EXISTS wealthos_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
  const directory=new URL('../db/postgres/',import.meta.url);
  for(const name of (await readdir(directory)).filter(name=>name.endsWith('.sql')).sort()){
    if((await client.query('SELECT name FROM wealthos_migrations WHERE name=$1',[name])).rowCount)continue;
    await client.query(await readFile(new URL(name,directory),'utf8'));
    await client.query('INSERT INTO wealthos_migrations(name) VALUES ($1)',[name]);
    console.log(`Applied ${name}`);
  }
  await client.query('COMMIT');
}catch(error){await client.query('ROLLBACK');console.error('Database migration failed. No schema changes were committed.');process.exitCode=1;}
finally{client.release();await pool.end();}
