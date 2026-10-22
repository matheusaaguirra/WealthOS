import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, primaryKey, uniqueIndex, index, check } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  name: text('name').notNull(),
  provider: text('provider', {enum:['email','google']}).notNull(),
  passwordHash: text('password_hash'),
  googleSub: text('google_sub'),
  createdAt: integer('created_at').notNull(),
}, table => [
  uniqueIndex('users_email_unique').on(table.email),
  uniqueIndex('users_google_sub_unique').on(table.googleSub),
  check('users_provider_valid',sql`${table.provider} IN ('email','google')`),
  check('users_provider_credentials',sql`(${table.provider} = 'email' AND ${table.passwordHash} IS NOT NULL AND ${table.googleSub} IS NULL) OR (${table.provider} = 'google' AND ${table.googleSub} IS NOT NULL AND ${table.passwordHash} IS NULL)`),
]);
export const sessions = sqliteTable('sessions', {
  tokenHash: text('token_hash').primaryKey(),
  userId: text('user_id').notNull().references(()=>users.id,{onDelete:'cascade'}),
  createdAt: integer('created_at').notNull(),
  expiresAt: integer('expires_at').notNull(),
}, table => [index('sessions_user_idx').on(table.userId),index('sessions_expiry_idx').on(table.expiresAt)]);
export const authRateLimits = sqliteTable('auth_rate_limits', {
  key: text('key').primaryKey(),
  requests: integer('requests').notNull(),
  expiresAt: integer('expires_at').notNull(),
}, table=>[index('auth_rate_limits_expiry_idx').on(table.expiresAt)]);
export const holdings = sqliteTable('holdings', {
  userId: text('user_id').notNull().references(()=>users.id,{onDelete:'cascade'}),
  ticker: text('ticker').notNull(),
  id: text('id').notNull(),
  quantity: integer('quantity').notNull(),
  averagePriceCents: integer('average_price_cents'),
  updatedAt: integer('updated_at').notNull(),
}, table => [
  primaryKey({columns:[table.userId,table.ticker]}),
  uniqueIndex('holdings_user_id_unique').on(table.userId,table.id),
  check('holdings_quantity_valid',sql`${table.quantity} > 0 AND ${table.quantity} <= 1000000`),
  check('holdings_average_price_valid',sql`${table.averagePriceCents} IS NULL OR (${table.averagePriceCents} >= 1 AND ${table.averagePriceCents} <= 1000000000)`),
]);
