CREATE DATABASE user_db;

\c user_db;

CREATE TABLE IF NOT EXISTS user_profiles (
    id          UUID PRIMARY KEY,        -- same UUID as auth user ID
    name        VARCHAR(255) NOT NULL,
    email       VARCHAR(255) NOT NULL,
    role        VARCHAR(20) NOT NULL,
    avatar_url  VARCHAR(512),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
