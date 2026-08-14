CREATE DATABASE auth_db;

\c auth_db;

CREATE TABLE IF NOT EXISTS users_auth (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(512) NOT NULL,
    role            VARCHAR(20) NOT NULL DEFAULT 'USER',   -- USER | ADMIN | ENGINEER
    refresh_token   VARCHAR(512),
    refresh_expiry  TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_email ON users_auth(email);
