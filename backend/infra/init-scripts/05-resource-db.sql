CREATE DATABASE resource_db;

\c resource_db;

CREATE TABLE IF NOT EXISTS gpu_nodes (
    id                  VARCHAR(100) PRIMARY KEY,
    name                VARCHAR(255) NOT NULL,
    gpu_model           VARCHAR(100) NOT NULL,
    total_memory_gb     INT NOT NULL,
    used_memory_gb      INT NOT NULL DEFAULT 0,
    gpu_util_percent    DECIMAL(5,2) NOT NULL DEFAULT 0,
    cpu_util_percent    DECIMAL(5,2) NOT NULL DEFAULT 0,
    temperature_c       INT NOT NULL DEFAULT 35,
    status              VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',   -- AVAILABLE | BUSY | MAINTENANCE
    current_job_id      VARCHAR(100),
    current_job_name    VARCHAR(255),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed data matching frontend mock nodes
INSERT INTO gpu_nodes VALUES
    ('node-h100-01', 'DGX-H100-NODE-01', 'NVIDIA H100 (80GB)', 320, 0, 0, 5, 38, 'AVAILABLE', NULL, NULL, NOW()),
    ('node-a100-01', 'DGX-A100-NODE-01', 'NVIDIA A100 (80GB)', 160, 0, 0, 5, 38, 'AVAILABLE', NULL, NULL, NOW()),
    ('node-a100-02', 'DGX-A100-NODE-02', 'NVIDIA A100 (80GB)', 160, 0, 0, 5, 38, 'AVAILABLE', NULL, NULL, NOW()),
    ('node-4090-01', 'CLUSTER-RTX4090-01', 'NVIDIA RTX 4090 (24GB)', 96, 0, 0, 8, 41, 'AVAILABLE', NULL, NULL, NOW()),
    ('node-l40s-01', 'DGX-L40S-NODE-01', 'NVIDIA L40S (48GB)', 192, 0, 0, 0, 35, 'MAINTENANCE', NULL, NULL, NOW())
ON CONFLICT (id) DO NOTHING;
