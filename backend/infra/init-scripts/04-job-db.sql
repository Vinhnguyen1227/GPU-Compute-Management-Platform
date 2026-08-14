CREATE DATABASE job_db;

\c job_db;

CREATE TABLE IF NOT EXISTS training_jobs (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id       UUID NOT NULL,
    project_name     VARCHAR(255) NOT NULL,
    name             VARCHAR(255) NOT NULL,
    gpu_type         VARCHAR(100) NOT NULL,
    gpu_count        INT NOT NULL DEFAULT 1,
    status           VARCHAR(20) NOT NULL DEFAULT 'CREATED',   -- CREATED | QUEUED | RUNNING | COMPLETED | FAILED
    progress         INT NOT NULL DEFAULT 0,                   -- 0 to 100
    duration_hours   DECIMAL(10,2),
    cost_per_hour    DECIMAL(10,2) NOT NULL,
    total_cost       DECIMAL(10,2) NOT NULL DEFAULT 0,
    assigned_node_id VARCHAR(100),
    command          TEXT,
    framework        VARCHAR(100),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at       TIMESTAMPTZ,
    completed_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON training_jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_project ON training_jobs(project_id);
