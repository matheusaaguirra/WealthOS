CREATE TABLE users (
 id text PRIMARY KEY,
 email text NOT NULL UNIQUE,
 name text NOT NULL,
 provider text NOT NULL CHECK (provider IN ('email','google')),
 password_hash text,
 google_sub text UNIQUE,
 created_at integer NOT NULL,
 CONSTRAINT users_provider_credentials CHECK (
   (provider = 'email' AND password_hash IS NOT NULL AND google_sub IS NULL) OR
   (provider = 'google' AND google_sub IS NOT NULL AND password_hash IS NULL)
 )
);
CREATE TABLE sessions (
 token_hash text PRIMARY KEY,
 user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 created_at integer NOT NULL,
 expires_at integer NOT NULL
);
CREATE INDEX sessions_user_idx ON sessions(user_id);
CREATE INDEX sessions_expiry_idx ON sessions(expires_at);
CREATE TABLE auth_rate_limits (
 key text PRIMARY KEY,
 requests integer NOT NULL,
 expires_at integer NOT NULL
);
CREATE INDEX auth_rate_limits_expiry_idx ON auth_rate_limits(expires_at);
CREATE TABLE holdings (
 user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 ticker text NOT NULL,
 id text NOT NULL,
 quantity integer NOT NULL CHECK (quantity > 0 AND quantity <= 1000000),
 average_price_cents integer CHECK (average_price_cents >= 1 AND average_price_cents <= 1000000000),
 updated_at integer NOT NULL,
 PRIMARY KEY(user_id,ticker),
 UNIQUE(user_id,id)
);
