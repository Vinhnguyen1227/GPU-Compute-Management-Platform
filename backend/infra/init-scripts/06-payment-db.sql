CREATE DATABASE payment_db;

\c payment_db;

CREATE TABLE IF NOT EXISTS wallets (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID UNIQUE NOT NULL,
    balance     DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    currency    VARCHAR(10) NOT NULL DEFAULT 'USD',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_transactions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL,
    transaction_type    VARCHAR(50) NOT NULL,        -- DEPOSIT | GPU_USAGE | REFUND
    amount              DECIMAL(18,2) NOT NULL,
    currency            VARCHAR(10) NOT NULL DEFAULT 'USD',
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',   -- PENDING | SUCCESS | FAILED
    payment_method      VARCHAR(50),                 -- VietQR | VNPay | MoMo | System
    reference_code      VARCHAR(100) UNIQUE,
    description         TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resource_usage (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL,
    job_id              UUID NOT NULL,
    resource_type       VARCHAR(50) NOT NULL,         -- NVIDIA A100 (80GB) | NVIDIA H100 (80GB) | ...
    resource_id         VARCHAR(100) NOT NULL,
    start_time          TIMESTAMPTZ NOT NULL,
    end_time            TIMESTAMPTZ,
    duration_minutes    INT,
    cost                DECIMAL(18,4)
);

CREATE TABLE IF NOT EXISTS resource_pricing (
    resource_type   VARCHAR(50) PRIMARY KEY,
    price_per_hour  DECIMAL(10,2) NOT NULL
);

-- Seed pricing matching frontend cost_per_hour
INSERT INTO resource_pricing VALUES
    ('NVIDIA A100 (80GB)', 2.00),
    ('NVIDIA H100 (80GB)', 4.50),
    ('NVIDIA RTX 4090 (24GB)', 0.80),
    ('NVIDIA L40S (48GB)', 1.50)
ON CONFLICT (resource_type) DO NOTHING;

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
