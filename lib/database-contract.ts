export type SqlValue = string | number | null;
export interface AuthStatement {
  bind(...values: SqlValue[]): AuthStatement;
  first<T = Record<string, unknown>>(column?: string): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{results: T[]}>;
  run(): Promise<unknown>;
}
export interface AuthDatabase {
  prepare(sql: string): AuthStatement;
  batch(statements: AuthStatement[], userId?: string): Promise<unknown[]>;
}
