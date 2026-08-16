CREATE DATABASE payment_db;

\c payment_db;

CREATE TABLE IF NOT EXISTS wallets (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID UNIQUE NOT NULL,
    balance     DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    currency    VARCHAR(10) NOT NULL DEFAULT 'VND',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_transactions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL,
    transaction_type    VARCHAR(50) NOT NULL,
    amount              DECIMAL(18,2) NOT NULL,
    currency            VARCHAR(10) NOT NULL DEFAULT 'VND',
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    payment_method      VARCHAR(50),
    reference_code      VARCHAR(100) UNIQUE,
    description         TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resource_usage (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL,
    job_id              UUID NOT NULL,
    resource_type       VARCHAR(50) NOT NULL,
    resource_id         VARCHAR(100) NOT NULL,
    start_time          TIMESTAMPTZ NOT NULL,
    end_time            TIMESTAMPTZ,
    duration_minutes    INT,
    cost                DECIMAL(18,4)
);

CREATE TABLE IF NOT EXISTS resource_pricing (
    resource_type   VARCHAR(50) PRIMARY KEY,
    price_per_hour  DECIMAL(18,2) NOT NULL
);

INSERT INTO resource_pricing VALUES
    ('NVIDIA A100 (80GB)', 50000.00),
    ('NVIDIA H100 (80GB)', 112500.00),
    ('NVIDIA RTX 4090 (24GB)', 20000.00),
    ('NVIDIA L40S (48GB)', 37500.00)
ON CONFLICT (resource_type) DO UPDATE SET price_per_hour = EXCLUDED.price_per_hour;

CREATE TABLE IF NOT EXISTS ledger_entries (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL,
    debit       DECIMAL(18,2) DEFAULT 0,
    credit      DECIMAL(18,2) DEFAULT 0,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tx_user ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_tx_ref ON payment_transactions(reference_code);
CREATE INDEX IF NOT EXISTS idx_usage_user ON resource_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ledger_user ON ledger_entries(user_id);
