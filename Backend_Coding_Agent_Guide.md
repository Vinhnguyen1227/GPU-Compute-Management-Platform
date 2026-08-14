# AI Compute Cloud Platform — Backend Coding Agent Guide

## Project Overview

Production-grade mini cloud computing platform inspired by NVIDIA DGX Cloud, AWS SageMaker, and Google Cloud AI Infrastructure.

The platform allows users to:

- Create accounts & manage profiles
- Create AI projects with datasets
- Submit AI training jobs requesting GPU resources
- Monitor job execution in real-time (progress, logs, telemetry)
- Pay based on resource consumption (wallet + billing engine)
- Manage wallet balance via VietQR / VNPay payment gateways

The frontend (React + Vite + TypeScript + Tailwind CSS) is **complete** — 10 pages with NVIDIA DGX dark-mode glassmorphism UI, simulated telemetry, and VietQR deposit modal. All data currently comes from `frontend/src/data/mockData.ts`. The backend replaces those mocks.

---

## Resolved Design Decisions

| Decision                  | Choice                                                         |
| :------------------------ | :------------------------------------------------------------- |
| Backend scope             | **.NET only** (Phase 1). Java Spring Boot services deferred.   |
| Cloud target              | **Azure** (AKS, Azure Database for PostgreSQL, Azure Cache for Redis, Azure Key Vault) |
| API Gateway               | **Ocelot** (.NET, code-based config)                           |
| Payment integration       | **Simulated gateway** with VietQR/VNPay **sandbox configs** prepped |
| API base URL              | `api.ai-cloud.io` (production), `localhost:5000` (dev)         |
| Frontend type contracts   | `frontend/src/types/index.ts` is the **source of truth** for all API response shapes |

---

## Main Architecture

```
                  [ Web Client (React + Vite + TS) ]
                       https://ai-cloud.io
                                |
                                v
                    [ API Gateway (.NET + Ocelot) ]
                       https://api.ai-cloud.io
                                |
    +---------------------------+---------------------------+
    |                           |                           |
[Auth Service]          [User Service]            [Payment Service]
   (.NET)                  (.NET)                    (.NET)
   :5001                   :5002                     :5006
    |                           |                           |
    +---------------------------+---------------------------+
    |                           |                           |
[Project Service]        [Job Service]           [Resource Service]
   (.NET)                  (.NET)                    (.NET)
   :5003                   :5004                     :5005
                                |
                            [Kafka]
                             :9092
                                |
    +---------------------------+---------------------------+
    |                           |                           |
[Worker Service]         (Job Events)             (Payment Events)
   (.NET Background)
   :5007

Infrastructure:
    PostgreSQL :5432   (6 isolated databases)
    Redis      :6379   (cache, locks, JWT blacklist)
    Kafka      :9092   (event-driven messaging)
    Zookeeper  :2181   (Kafka coordination)
```

---

## Technology Stack

### Backend (.NET 9)

All services use ASP.NET Core 9 Web API.

| Service               | Port  | Responsibilities                                              |
| :-------------------- | :---- | :------------------------------------------------------------ |
| API Gateway           | 5000  | Routing, JWT validation, rate limiting, CORS, request logging |
| Auth Service          | 5001  | Register, login, JWT tokens, refresh tokens, role management  |
| User Service          | 5002  | Profile CRUD, permissions, account info                       |
| Project Service       | 5003  | AI project management, dataset metadata                       |
| Job Service           | 5004  | Job submission, status tracking, SSE log streaming            |
| Resource Service      | 5005  | GPU node management, simplified scheduler, cluster metrics    |
| Payment Service       | 5006  | Wallet, deposits, transactions, billing engine, webhooks      |
| Worker Service        | 5007  | Kafka consumer, GPU execution simulation, progress reporting  |

### NuGet Packages (Per Service)

```xml
<!-- Core -->
<PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" />
<PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" />
<PackageReference Include="FluentValidation.AspNetCore" />

<!-- Messaging -->
<PackageReference Include="Confluent.Kafka" />

<!-- Caching & Locks -->
<PackageReference Include="StackExchange.Redis" />

<!-- Logging -->
<PackageReference Include="Serilog.AspNetCore" />
<PackageReference Include="Serilog.Sinks.Console" />
<PackageReference Include="Serilog.Sinks.Seq" />

<!-- API Docs -->
<PackageReference Include="Swashbuckle.AspNetCore" />

<!-- Auth -->
<PackageReference Include="BCrypt.Net-Next" />

<!-- Rate Limiting (Gateway only) -->
<PackageReference Include="AspNetCoreRateLimit" />

<!-- Gateway (Gateway only) -->
<PackageReference Include="Ocelot" />

<!-- Validation -->
<PackageReference Include="FluentValidation.AspNetCore" />
```

### Infrastructure

| Component     | Technology              | Port  |
| :------------ | :---------------------- | :---- |
| Database      | PostgreSQL 16           | 5432  |
| Cache & Lock  | Redis 7                 | 6379  |
| Messaging     | Apache Kafka 3.7        | 9092  |
| Coordination  | Zookeeper               | 2181  |

### Future (Deferred)

| Component             | Technology              | Notes                           |
| :-------------------- | :---------------------- | :------------------------------ |
| Job Scheduler         | Java Spring Boot 3      | Replace simplified .NET scheduler |
| Resource Manager      | Java Spring Boot 3      | Advanced GPU management         |
| Project Service       | Java Spring Boot 3      | Optional migration from .NET    |
| Observability         | Prometheus + Grafana    | Metrics dashboards              |
| Tracing               | OpenTelemetry + Jaeger  | Distributed request tracing     |
| Log Aggregation       | ELK Stack               | Centralized logging             |
| Cloud Deployment      | Azure AKS + Helm        | Kubernetes orchestration        |

---

## Repository Structure

```
GPU Compute Management Platform/
├── frontend/                            # COMPLETE — React + Vite + TS + Tailwind
│
├── backend/
│   ├── docker-compose.yml
│   ├── docker-compose.override.yml      # local dev overrides
│   ├── .env.example
│   │
│   ├── src/
│   │   ├── ApiGateway/                  # Ocelot gateway
│   │   │   ├── ApiGateway.csproj
│   │   │   ├── Program.cs
│   │   │   ├── ocelot.json              # route definitions for all downstream services
│   │   │   ├── ocelot.Development.json  # dev overrides (localhost ports)
│   │   │   └── Dockerfile
│   │   │
│   │   ├── AuthService/
│   │   │   ├── AuthService.csproj
│   │   │   ├── Program.cs
│   │   │   ├── Controllers/
│   │   │   │   └── AuthController.cs
│   │   │   ├── Models/
│   │   │   │   ├── RegisterRequest.cs
│   │   │   │   ├── LoginRequest.cs
│   │   │   │   ├── AuthResponse.cs
│   │   │   │   └── UserAuth.cs          # EF Core entity
│   │   │   ├── Services/
│   │   │   │   ├── IAuthService.cs
│   │   │   │   ├── AuthService.cs
│   │   │   │   └── JwtTokenService.cs
│   │   │   ├── Validators/
│   │   │   │   ├── RegisterRequestValidator.cs
│   │   │   │   └── LoginRequestValidator.cs
│   │   │   ├── Data/
│   │   │   │   ├── AuthDbContext.cs
│   │   │   │   └── Migrations/
│   │   │   └── Dockerfile
│   │   │
│   │   ├── UserService/
│   │   │   ├── UserService.csproj
│   │   │   ├── Program.cs
│   │   │   ├── Controllers/
│   │   │   │   └── UsersController.cs
│   │   │   ├── Models/
│   │   │   │   ├── UserProfile.cs       # EF Core entity
│   │   │   │   └── UpdateProfileRequest.cs
│   │   │   ├── Services/
│   │   │   │   ├── IUserService.cs
│   │   │   │   └── UserService.cs
│   │   │   ├── Data/
│   │   │   │   ├── UserDbContext.cs
│   │   │   │   └── Migrations/
│   │   │   └── Dockerfile
│   │   │
│   │   ├── ProjectService/
│   │   │   ├── ProjectService.csproj
│   │   │   ├── Program.cs
│   │   │   ├── Controllers/
│   │   │   │   └── ProjectsController.cs
│   │   │   ├── Models/
│   │   │   │   ├── Project.cs
│   │   │   │   └── CreateProjectRequest.cs
│   │   │   ├── Services/
│   │   │   │   ├── IProjectService.cs
│   │   │   │   └── ProjectService.cs
│   │   │   ├── Data/
│   │   │   │   ├── ProjectDbContext.cs
│   │   │   │   └── Migrations/
│   │   │   └── Dockerfile
│   │   │
│   │   ├── JobService/
│   │   │   ├── JobService.csproj
│   │   │   ├── Program.cs
│   │   │   ├── Controllers/
│   │   │   │   └── JobsController.cs
│   │   │   ├── Models/
│   │   │   │   ├── TrainingJob.cs
│   │   │   │   └── SubmitJobRequest.cs
│   │   │   ├── Services/
│   │   │   │   ├── IJobService.cs
│   │   │   │   └── JobService.cs
│   │   │   ├── Events/                  # Kafka producers
│   │   │   │   └── JobEventProducer.cs
│   │   │   ├── Consumers/               # Kafka consumers
│   │   │   │   ├── JobAssignedConsumer.cs
│   │   │   │   ├── JobProgressConsumer.cs
│   │   │   │   └── JobCompletedConsumer.cs
│   │   │   ├── Data/
│   │   │   │   ├── JobDbContext.cs
│   │   │   │   └── Migrations/
│   │   │   └── Dockerfile
│   │   │
│   │   ├── ResourceService/
│   │   │   ├── ResourceService.csproj
│   │   │   ├── Program.cs
│   │   │   ├── Controllers/
│   │   │   │   ├── GpuNodesController.cs
│   │   │   │   └── ClusterMetricsController.cs
│   │   │   ├── Models/
│   │   │   │   ├── GpuNode.cs
│   │   │   │   └── ClusterMetrics.cs
│   │   │   ├── Services/
│   │   │   │   ├── IGpuNodeService.cs
│   │   │   │   ├── GpuNodeService.cs
│   │   │   │   └── SchedulerService.cs  # simplified scheduler (until Java migration)
│   │   │   ├── Consumers/
│   │   │   │   ├── JobCreatedConsumer.cs # auto-assign GPU
│   │   │   │   └── JobCompletedConsumer.cs # release GPU
│   │   │   ├── Data/
│   │   │   │   ├── ResourceDbContext.cs
│   │   │   │   └── Migrations/
│   │   │   └── Dockerfile
│   │   │
│   │   ├── PaymentService/
│   │   │   ├── PaymentService.csproj
│   │   │   ├── Program.cs
│   │   │   ├── Controllers/
│   │   │   │   ├── WalletController.cs
│   │   │   │   ├── PaymentController.cs
│   │   │   │   ├── TransactionsController.cs
│   │   │   │   └── WebhookController.cs
│   │   │   ├── Models/
│   │   │   │   ├── Wallet.cs
│   │   │   │   ├── PaymentTransaction.cs
│   │   │   │   ├── ResourceUsage.cs
│   │   │   │   ├── ResourcePricing.cs
│   │   │   │   ├── DepositRequest.cs
│   │   │   │   └── WebhookPayload.cs
│   │   │   ├── Services/
│   │   │   │   ├── IWalletService.cs
│   │   │   │   ├── WalletService.cs
│   │   │   │   ├── IBillingEngine.cs
│   │   │   │   ├── BillingEngine.cs
│   │   │   │   ├── IPaymentGateway.cs
│   │   │   │   └── SimulatedPaymentGateway.cs  # VietQR/VNPay sandbox config
│   │   │   ├── Consumers/
│   │   │   │   └── JobCompletedConsumer.cs      # auto-deduct wallet on completion
│   │   │   ├── Config/
│   │   │   │   ├── VietQRSettings.cs            # sandbox config model
│   │   │   │   └── VNPaySettings.cs             # sandbox config model
│   │   │   ├── Data/
│   │   │   │   ├── PaymentDbContext.cs
│   │   │   │   └── Migrations/
│   │   │   └── Dockerfile
│   │   │
│   │   ├── WorkerService/
│   │   │   ├── WorkerService.csproj
│   │   │   ├── Program.cs
│   │   │   ├── Workers/
│   │   │   │   └── GpuJobWorker.cs              # BackgroundService — Kafka consumer + GPU simulator
│   │   │   ├── Services/
│   │   │   │   └── GpuSimulator.cs              # Simulates training progress 0→100
│   │   │   └── Dockerfile
│   │   │
│   │   └── Shared/
│   │       ├── Shared.csproj
│   │       ├── Events/                          # Kafka event DTOs
│   │       │   ├── JobCreatedEvent.cs
│   │       │   ├── JobAssignedEvent.cs
│   │       │   ├── JobProgressEvent.cs
│   │       │   ├── JobCompletedEvent.cs
│   │       │   ├── JobFailedEvent.cs
│   │       │   ├── ResourceUpdatedEvent.cs
│   │       │   └── PaymentCompletedEvent.cs
│   │       ├── Auth/
│   │       │   └── JwtSettings.cs
│   │       ├── Messaging/
│   │       │   ├── IKafkaProducer.cs
│   │       │   ├── KafkaProducer.cs
│   │       │   └── KafkaConsumerBase.cs
│   │       ├── Models/
│   │       │   ├── ApiResponse.cs               # Standardized { data, error, message }
│   │       │   └── PaginatedResult.cs
│   │       └── Constants/
│   │           └── KafkaTopics.cs               # Topic name constants
│   │
│   ├── tests/
│   │   ├── AuthService.Tests/
│   │   │   └── AuthService.Tests.csproj
│   │   ├── JobService.Tests/
│   │   │   └── JobService.Tests.csproj
│   │   ├── PaymentService.Tests/
│   │   │   └── PaymentService.Tests.csproj
│   │   └── ResourceService.Tests/
│   │       └── ResourceService.Tests.csproj
│   │
│   └── infra/
│       ├── init-scripts/                        # PostgreSQL init — creates 6 databases
│       │   ├── 01-auth-db.sql
│       │   ├── 02-user-db.sql
│       │   ├── 03-project-db.sql
│       │   ├── 04-job-db.sql
│       │   ├── 05-resource-db.sql
│       │   └── 06-payment-db.sql
│       └── kafka/
│           └── create-topics.sh                 # Auto-create Kafka topics on startup
│
├── infra/
│   ├── kubernetes/                              # Azure AKS manifests (Phase 7+)
│   │   ├── namespace.yaml
│   │   ├── gateway-deployment.yaml
│   │   ├── auth-deployment.yaml
│   │   └── ...
│   └── helm/                                    # Helm charts (Phase 7+)
│
├── docs/
│   ├── architecture.md
│   ├── api-design.md
│   └── database-design.md
│
└── memory-bank/                                 # ADK Memory Bank
```

---

## Database Design (Per-Service Isolation)

Each microservice owns its own PostgreSQL database. Never share databases across services. Cross-service data access happens via HTTP or Kafka events only.

### Auth DB (`auth_db`)

```sql
CREATE DATABASE auth_db;

CREATE TABLE users_auth (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(512) NOT NULL,
    role            VARCHAR(20) NOT NULL DEFAULT 'USER',   -- USER | ADMIN | ENGINEER
    refresh_token   VARCHAR(512),
    refresh_expiry  TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_auth_email ON users_auth(email);
```

### User DB (`user_db`)

```sql
CREATE DATABASE user_db;

CREATE TABLE user_profiles (
    id          UUID PRIMARY KEY,        -- same UUID as auth user ID
    name        VARCHAR(255) NOT NULL,
    email       VARCHAR(255) NOT NULL,
    role        VARCHAR(20) NOT NULL,
    avatar_url  VARCHAR(512),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Project DB (`project_db`)

```sql
CREATE DATABASE project_db;

CREATE TABLE projects (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id        UUID NOT NULL,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    dataset_name    VARCHAR(255),
    dataset_size    VARCHAR(50),
    job_count       INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_owner ON projects(owner_id);
```

### Job DB (`job_db`)

```sql
CREATE DATABASE job_db;

CREATE TABLE training_jobs (
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

CREATE INDEX idx_jobs_status ON training_jobs(status);
CREATE INDEX idx_jobs_project ON training_jobs(project_id);
```

### Resource DB (`resource_db`)

```sql
CREATE DATABASE resource_db;

CREATE TABLE gpu_nodes (
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
    ('node-l40s-01', 'DGX-L40S-NODE-01', 'NVIDIA L40S (48GB)', 192, 0, 0, 0, 35, 'MAINTENANCE', NULL, NULL, NOW());
```

### Payment DB (`payment_db`)

```sql
CREATE DATABASE payment_db;

CREATE TABLE wallets (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID UNIQUE NOT NULL,
    balance     DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    currency    VARCHAR(10) NOT NULL DEFAULT 'USD',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE payment_transactions (
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

CREATE TABLE resource_usage (
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

CREATE TABLE resource_pricing (
    resource_type   VARCHAR(50) PRIMARY KEY,
    price_per_hour  DECIMAL(10,2) NOT NULL
);

-- Seed pricing matching frontend cost_per_hour
INSERT INTO resource_pricing VALUES
    ('NVIDIA A100 (80GB)', 2.00),
    ('NVIDIA H100 (80GB)', 4.50),
    ('NVIDIA RTX 4090 (24GB)', 0.80),
    ('NVIDIA L40S (48GB)', 1.50);

CREATE TABLE ledger_entries (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL,
    debit       DECIMAL(18,2) DEFAULT 0,
    credit      DECIMAL(18,2) DEFAULT 0,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tx_user ON payment_transactions(user_id);
CREATE INDEX idx_tx_ref ON payment_transactions(reference_code);
CREATE INDEX idx_usage_user ON resource_usage(user_id);
CREATE INDEX idx_ledger_user ON ledger_entries(user_id);
```

---

## Kafka Topics & Event Flow

### Topics

| Topic                | Producer(s)        | Consumer(s)                                        |
| :------------------- | :----------------- | :------------------------------------------------- |
| `job.created`        | Job Service        | Resource Service (auto-assign GPU)                 |
| `job.assigned`       | Resource Service   | Worker Service (start execution), Job Service (update status) |
| `job.progress`       | Worker Service     | Job Service (update progress %)                    |
| `job.completed`      | Worker Service     | Job Service, Resource Service (release GPU), Payment Service (deduct) |
| `job.failed`         | Worker Service     | Job Service, Resource Service (release GPU), Payment Service (refund) |
| `resource.updated`   | Resource Service   | (Dashboard SSE / future)                           |
| `payment.completed`  | Payment Service    | (Notification / future)                            |

### Event Flow Diagram

```
User submits job
       |
       v
  Job Service
       |
       | Kafka: job.created
       v
  Resource Service
       |
       | SELECT FOR UPDATE (race condition safe)
       | Assign GPU node
       |
       | Kafka: job.assigned
       v
  Worker Service
       |
       | Simulate GPU execution
       | Kafka: job.progress (every 10% or 30 seconds)
       |
       | On 100%: Kafka: job.completed
       | On error: Kafka: job.failed
       v
  [Multiple consumers]
       |
       +---> Job Service      (update status/progress/timestamps)
       +---> Resource Service (release GPU, set AVAILABLE)
       +---> Payment Service  (calculate final cost, deduct wallet)
```

### Saga Pattern (Job Submission with Compensation)

```
1. Create Job         → job_db (status: CREATED)
2. Reserve GPU        → resource_db (SELECT FOR UPDATE, status: BUSY)
3. Pre-authorize cost → payment_db (deduct estimated total_cost from wallet)
4. Start execution    → Kafka: job.created → Worker

Compensation (any step fails):
   - Release GPU      → resource_db (status: AVAILABLE)
   - Refund wallet    → payment_db (credit back, create REFUND transaction)
   - Mark job FAILED  → job_db (status: FAILED)
```

---

## API Endpoints

All routes go through the API Gateway at `https://api.ai-cloud.io` (production) or `http://localhost:5000` (dev).

### Auth Service (`:5001`)

| Method | Endpoint              | Request Body                                                | Response                                      |
| :----- | :-------------------- | :---------------------------------------------------------- | :-------------------------------------------- |
| POST   | `/api/auth/register`  | `{ name, email, password, role? }`                          | `{ id, accessToken, refreshToken }`           |
| POST   | `/api/auth/login`     | `{ email, password }`                                       | `{ id, accessToken, refreshToken }`           |
| POST   | `/api/auth/refresh`   | `{ refreshToken }`                                          | `{ accessToken, refreshToken }`               |
| POST   | `/api/auth/logout`    | Header: `Authorization: Bearer <token>`                     | `204 No Content`                              |

### User Service (`:5002`)

| Method | Endpoint           | Description                                                          |
| :----- | :----------------- | :------------------------------------------------------------------- |
| GET    | `/api/users/me`    | Returns `User` shape: `{ id, name, email, role, avatarUrl, balance, currency }` |
| PUT    | `/api/users/me`    | Update own profile (name, avatar)                                    |
| GET    | `/api/users/{id}`  | Admin only: get any user profile                                     |

Note: `balance` and `currency` are fetched via internal HTTP call to Payment Service.

### Project Service (`:5003`)

| Method | Endpoint                  | Description                                    |
| :----- | :------------------------ | :--------------------------------------------- |
| GET    | `/api/projects`           | List user's projects (filter by `owner_id` from JWT) |
| POST   | `/api/projects`           | Create project: `{ name, description, datasetName, datasetSize }` |
| GET    | `/api/projects/{id}`      | Get single project                             |
| PUT    | `/api/projects/{id}`      | Update project                                 |
| DELETE | `/api/projects/{id}`      | Soft delete                                    |

### Job Service (`:5004`)

| Method | Endpoint                  | Description                                                  |
| :----- | :------------------------ | :----------------------------------------------------------- |
| GET    | `/api/jobs`               | List jobs (filter by user, project, status)                  |
| POST   | `/api/jobs`               | Submit job → publishes `job.created` to Kafka                |
| GET    | `/api/jobs/{id}`          | Get job with current progress                                |
| POST   | `/api/jobs/{id}/cancel`   | Cancel running/queued job → publishes `job.failed`           |
| GET    | `/api/jobs/{id}/logs`     | SSE stream of simulated training log lines                   |

Submit Job Request:
```json
{
    "name": "Llama-3-70B-epoch-3",
    "projectId": "proj-01",
    "projectName": "Llama 3 70B Fine-Tuning",
    "gpuType": "NVIDIA H100 (80GB)",
    "gpuCount": 4,
    "durationHours": 6.5,
    "costPerHour": 4.50,
    "totalCost": 29.25,
    "command": "torchrun --nproc_per_node=4 train.py",
    "framework": "PyTorch 2.4 + CUDA 12.4"
}
```

### Resource Service (`:5005`)

| Method | Endpoint                        | Description                                    |
| :----- | :------------------------------ | :--------------------------------------------- |
| GET    | `/api/gpu-nodes`                | List all GPU nodes with status + telemetry     |
| GET    | `/api/gpu-nodes/{id}`           | Single node with full telemetry                |
| PUT    | `/api/gpu-nodes/{id}/status`    | Admin: toggle AVAILABLE ↔ MAINTENANCE          |
| GET    | `/api/cluster/metrics`          | Aggregated `ClusterMetrics` shape              |

ClusterMetrics Response:
```json
{
    "activeJobs": 2,
    "queuedJobs": 1,
    "totalGpus": 16,
    "availableGpus": 6,
    "avgGpuUtilization": 68.4,
    "totalComputeHours": 1482.5,
    "systemKafkaLag": 0.04
}
```

### Payment Service (`:5006`)

| Method | Endpoint                           | Description                                           |
| :----- | :--------------------------------- | :---------------------------------------------------- |
| GET    | `/api/wallet`                      | `{ balance, currency }`                               |
| POST   | `/api/wallet/deposit`              | Create deposit → `{ transactionId, qrCodeUrl, amount }` |
| POST   | `/api/webhook/payment-callback`    | Simulated gateway webhook → updates wallet balance    |
| GET    | `/api/transactions`                | User's transaction history (paginated)                |
| GET    | `/api/billing/usage`               | User's resource usage records                         |

Deposit Request:
```json
{
    "amount": 100.00,
    "paymentMethod": "VietQR"
}
```

Deposit Response:
```json
{
    "transactionId": "tx-1009",
    "qrCodeUrl": "https://img.vietqr.io/image/BANK-ACCOUNT-compact.png?amount=100&addInfo=TX1009",
    "amount": 100.00,
    "status": "PENDING"
}
```

---

## Payment Gateway — VietQR / VNPay Sandbox Configuration

The Payment Service uses a `IPaymentGateway` interface with a `SimulatedPaymentGateway` implementation. Sandbox configs are prepped for swap to real gateways.

### VietQR Sandbox Settings (`appsettings.json`)

```json
{
    "VietQR": {
        "Enabled": true,
        "ApiBaseUrl": "https://api.vietqr.io/v2",
        "BankId": "970422",
        "AccountNo": "1234567890",
        "AccountName": "AI CLOUD PLATFORM",
        "Template": "compact",
        "WebhookSecret": "vietqr_sandbox_secret_key",
        "SimulateCallback": true,
        "SimulateDelayMs": 5000
    }
}
```

### VNPay Sandbox Settings (`appsettings.json`)

```json
{
    "VNPay": {
        "Enabled": true,
        "TmnCode": "SANDBOX_TMN",
        "HashSecret": "sandbox_hash_secret",
        "PaymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
        "ReturnUrl": "https://api.ai-cloud.io/api/webhook/vnpay-return",
        "IpnUrl": "https://api.ai-cloud.io/api/webhook/vnpay-ipn",
        "ApiUrl": "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction",
        "SimulateCallback": true,
        "SimulateDelayMs": 5000
    }
}
```

When `SimulateCallback: true`, the gateway fires a delayed self-webhook (via `Hangfire` or `Task.Delay`) to simulate the bank confirming payment. Set to `false` + provide real credentials for production.

---

## Security Design

### JWT Authentication

- **Access Token**: 15 minutes expiry, signed RS256
- **Refresh Token**: 30 days expiry, stored in `users_auth.refresh_token`, rotated on each use
- **JWT Claims**: `sub` (userId), `email`, `role`, `iat`, `exp`

### Password Security

- BCrypt hashing via `BCrypt.Net-Next` (work factor 12)
- Never store plaintext passwords

### Rate Limiting (API Gateway)

- Free/unauthenticated: 100 requests/minute
- Authenticated users: 1000 requests/minute
- Implementation: `AspNetCoreRateLimit` + Redis counter

### Redis JWT Blacklist

- On logout: add token JTI to Redis with TTL = remaining token lifetime
- Gateway middleware checks blacklist before forwarding

### CORS

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "https://ai-cloud.io")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});
```

### Roles & Authorization

| Role       | Capabilities                                              |
| :--------- | :-------------------------------------------------------- |
| `USER`     | CRUD own projects, submit/cancel own jobs, manage wallet  |
| `ENGINEER` | Same as USER + view all GPU node telemetry                |
| `ADMIN`    | Everything + toggle node maintenance, view all users      |

### Secret Management

- **Local dev**: `.env` file + `docker-compose` environment variables
- **Production**: Azure Key Vault (secrets referenced in AKS pod specs)

---

## Concurrency & Production Patterns

### GPU Allocation — Race Condition Prevention

```sql
-- ResourceService: Atomic GPU reservation
BEGIN;

SELECT * FROM gpu_nodes
WHERE gpu_model = @gpuType
  AND status = 'AVAILABLE'
FOR UPDATE SKIP LOCKED
LIMIT 1;

-- If no row returned → no GPU available → reject / queue

UPDATE gpu_nodes
SET status = 'BUSY',
    current_job_id = @jobId,
    current_job_name = @jobName,
    updated_at = NOW()
WHERE id = @nodeId;

COMMIT;
```

`FOR UPDATE SKIP LOCKED` ensures:
- Only one transaction locks a given GPU row
- Other concurrent transactions skip already-locked rows (no deadlocks)

### Redis Distributed Lock (Advanced)

```
SET gpu:{nodeId}:lock {requestId} NX EX 30
```

- `NX`: only set if key doesn't exist
- `EX 30`: auto-expire after 30 seconds (prevents dead locks)

### Payment Idempotency

- Every transaction has `reference_code UNIQUE` constraint
- Duplicate webhook callbacks → `409 Conflict` (no double-credit)
- Pattern: check `reference_code` existence before processing

### Connection Pooling

```json
// appsettings.json per service
{
    "ConnectionStrings": {
        "DefaultConnection": "Host=postgres;Database=job_db;Username=postgres;Password=xxx;Maximum Pool Size=100;Minimum Pool Size=10"
    }
}
```

### Back Pressure

- Kafka consumer group per service with configurable `max.poll.records`
- If GPU workers are saturated, jobs stay in QUEUED status
- API returns `503 Service Unavailable` when queue exceeds threshold

---

## Docker Compose Configuration

```yaml
# backend/docker-compose.yml
version: '3.8'

services:
  # --- Infrastructure ---
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-devpassword}
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./infra/init-scripts:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  zookeeper:
    image: confluentinc/cp-zookeeper:7.7.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
    ports:
      - "2181:2181"

  kafka:
    image: confluentinc/cp-kafka:7.7.0
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:29092,PLAINTEXT_HOST://localhost:9092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
    healthcheck:
      test: ["CMD", "kafka-broker-api-versions", "--bootstrap-server", "localhost:9092"]
      interval: 10s
      timeout: 10s
      retries: 10

  kafka-init:
    image: confluentinc/cp-kafka:7.7.0
    depends_on:
      kafka:
        condition: service_healthy
    entrypoint: ["/bin/bash", "/scripts/create-topics.sh"]
    volumes:
      - ./infra/kafka:/scripts

  # --- Microservices ---
  gateway:
    build: ./src/ApiGateway
    ports:
      - "5000:8080"
    depends_on:
      - redis
    environment:
      - ASPNETCORE_ENVIRONMENT=Development

  auth-service:
    build: ./src/AuthService
    ports:
      - "5001:8080"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  user-service:
    build: ./src/UserService
    ports:
      - "5002:8080"
    depends_on:
      postgres:
        condition: service_healthy

  project-service:
    build: ./src/ProjectService
    ports:
      - "5003:8080"
    depends_on:
      postgres:
        condition: service_healthy

  job-service:
    build: ./src/JobService
    ports:
      - "5004:8080"
    depends_on:
      postgres:
        condition: service_healthy
      kafka:
        condition: service_healthy

  resource-service:
    build: ./src/ResourceService
    ports:
      - "5005:8080"
    depends_on:
      postgres:
        condition: service_healthy
      kafka:
        condition: service_healthy
      redis:
        condition: service_healthy

  payment-service:
    build: ./src/PaymentService
    ports:
      - "5006:8080"
    depends_on:
      postgres:
        condition: service_healthy
      kafka:
        condition: service_healthy

  worker-service:
    build: ./src/WorkerService
    ports:
      - "5007:8080"
    depends_on:
      kafka:
        condition: service_healthy

volumes:
  postgres-data:
  redis-data:
```

---

## Environment Variables (`.env.example`)

```env
# PostgreSQL
POSTGRES_PASSWORD=devpassword

# JWT
JWT_SECRET_KEY=your-256-bit-secret-key-for-dev
JWT_ISSUER=ai-cloud-platform
JWT_AUDIENCE=ai-cloud-clients
JWT_ACCESS_TOKEN_EXPIRY_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRY_DAYS=30

# Kafka
KAFKA_BOOTSTRAP_SERVERS=kafka:29092

# Redis
REDIS_CONNECTION=redis:6379

# VietQR Sandbox
VIETQR_BANK_ID=970422
VIETQR_ACCOUNT_NO=1234567890
VIETQR_ACCOUNT_NAME=AI CLOUD PLATFORM
VIETQR_WEBHOOK_SECRET=vietqr_sandbox_secret_key

# VNPay Sandbox
VNPAY_TMN_CODE=SANDBOX_TMN
VNPAY_HASH_SECRET=sandbox_hash_secret

# Azure (Production only)
# AZURE_KEY_VAULT_URI=https://ai-cloud-vault.vault.azure.net/
```

---

## Development & Test Commands

```bash
# Start all infrastructure + services
cd backend && docker compose up --build

# Start infrastructure only (for local debugging)
cd backend && docker compose up postgres redis kafka zookeeper kafka-init

# Run individual service locally (outside Docker)
cd backend/src/AuthService && dotnet run

# Run unit tests
dotnet test backend/tests/AuthService.Tests/
dotnet test backend/tests/JobService.Tests/
dotnet test backend/tests/PaymentService.Tests/
dotnet test backend/tests/ResourceService.Tests/

# Run integration tests (requires Docker)
dotnet test backend/tests/ --filter "Category=Integration"

# EF Core migrations
cd backend/src/AuthService && dotnet ef migrations add InitialCreate
cd backend/src/AuthService && dotnet ef database update

# Check Kafka topics
docker exec -it backend-kafka-1 kafka-topics --bootstrap-server localhost:9092 --list

# Frontend dev server
cd frontend && npm run dev
```

---

## Phased Delivery Roadmap

### Phase 1 — Foundation & Infrastructure ✅ COMPLETE

**Goal**: Docker environment running, shared project scaffolded, empty service skeletons compiling

- [x] Create `backend/` directory with full folder structure
- [x] Write `docker-compose.yml` (PostgreSQL, Redis, Kafka, Zookeeper)
- [x] Write 6 DB init SQL scripts (one per service database)
- [x] Write `create-topics.sh` for Kafka topic auto-creation
- [x] Create `Shared.csproj` with Kafka wrappers, event DTOs, JWT settings, API response models
- [x] Create `.env.example` with all config keys
- [x] Scaffold all 8 service `.csproj` files with minimal `Program.cs`
- [x] **Verify**: `dotnet build AIComputePlatform.sln` → 0 errors, 0 warnings

---

### Phase 2 — Auth + User + Gateway

**Goal**: Login/register flow works end-to-end through the API Gateway

- [ ] Implement Auth Service (register, login, JWT generation, refresh token rotation, logout + Redis blacklist)
- [ ] Implement User Service (profile CRUD, `GET /me` with wallet balance from internal call to Payment Service)
- [ ] Configure Ocelot API Gateway (`ocelot.json` routes, JWT validation middleware, CORS for localhost:3000, rate limiting)
- [ ] Dockerize all 3 services with proper health checks
- [ ] Add FluentValidation for register/login request models
- [ ] **Verify**: `POST /api/auth/register` → JWT → `GET /api/users/me` returns user profile through Gateway

---

### Phase 3 — Project + Job + Resource Services

**Goal**: Create projects, submit jobs, view GPU nodes, Kafka events flow

- [ ] Implement Project Service (CRUD filtered by `owner_id` from JWT claims)
- [ ] Implement Job Service (create, list, get, cancel; Kafka producer for `job.created`)
- [ ] Implement Resource Service (GPU node list, single node, cluster metrics aggregate, simplified scheduler as Kafka consumer)
- [ ] Implement Kafka consumer in Resource Service: on `job.created` → find available GPU → `SELECT FOR UPDATE SKIP LOCKED` → assign → publish `job.assigned`
- [ ] Add Ocelot routes for all 3 new services
- [ ] **Verify**: Submit job via API → Kafka `job.created` → GPU auto-assigned → job status updated to QUEUED/RUNNING

---

### Phase 4 — Worker Service & Full Job Lifecycle

**Goal**: Jobs run to completion (simulated), progress updates flow through Kafka

- [ ] Implement Worker Service as .NET `BackgroundService` (Kafka consumer for `job.assigned`)
- [ ] Build GPU simulator: progress 0→100 over configurable duration, publish `job.progress` events every 10% or 30 seconds
- [ ] Publish `job.completed` on success, `job.failed` on simulated error
- [ ] Job Service: consume `job.assigned`, `job.progress`, `job.completed/failed` → update DB
- [ ] Resource Service: consume `job.completed/failed` → release GPU (set AVAILABLE, clear `current_job_id`)
- [ ] Implement SSE endpoint `GET /api/jobs/{id}/logs` for real-time training log streaming
- [ ] **Verify**: Full lifecycle: Submit job → CREATED → QUEUED → RUNNING (progress increments) → COMPLETED → GPU released

---

### Phase 5 — Payment, Wallet & Billing

**Goal**: Deposits, QR code generation, wallet deductions, billing engine, transaction history

- [ ] Implement Wallet Service (get balance, create wallet on user registration)
- [ ] Implement `SimulatedPaymentGateway` with VietQR/VNPay sandbox config (QR URL generation, delayed self-callback)
- [ ] Implement deposit flow: `POST /api/wallet/deposit` → `PENDING` transaction → simulate callback → `SUCCESS` → credit wallet
- [ ] Implement webhook endpoint with HMAC signature verification + idempotency (reference_code UNIQUE)
- [ ] Implement Transaction Service (list user history, filter by type/status)
- [ ] Implement Billing Engine: on `job.completed` Kafka event → calculate `cost = duration × price_per_hour` → deduct wallet → create `GPU_USAGE` transaction → record in `resource_usage`
- [ ] Implement refund flow: on `job.failed` → partial refund based on actual usage → create `REFUND` transaction
- [ ] **Verify**: Deposit → balance increases; Job completes → balance deducted; Failed job → partial refund; Transaction history correct; Duplicate webhook → 409

---

### Phase 6 — Production Hardening & Observability

**Goal**: Logging, health checks, validation, testing, monitoring, distributed tracing

- [ ] Add Serilog structured logging (JSON format, correlation IDs) across all services
- [ ] Add `/health` endpoints (ASP.NET Health Checks: DB, Redis, Kafka connectivity)
- [ ] Add FluentValidation on all remaining request models
- [ ] Write unit tests (xUnit + Moq) for: AuthService JWT, SchedulerService allocation, BillingEngine cost calculation, payment idempotency
- [ ] Write integration tests with Testcontainers (PostgreSQL + Kafka)
- [ ] Add OpenTelemetry tracing (Gateway → Service → Kafka → Worker span propagation)
- [ ] Add Prometheus metrics endpoint (`/metrics`) per service
- [ ] Replace simple PG lock with Redis distributed lock for GPU allocation
- [ ] Add Swagger/OpenAPI documentation for all endpoints
- [ ] **Verify**: All tests pass, `docker compose up` → full stack operational, Swagger UI accessible per service

---

### Phase 7 — Azure Cloud Deployment (Future)

**Goal**: Deploy to Azure AKS with managed services

- [ ] Create Azure AKS cluster
- [ ] Create Azure Database for PostgreSQL (Flexible Server)
- [ ] Create Azure Cache for Redis
- [ ] Configure Azure Key Vault for secrets
- [ ] Write Kubernetes manifests (Deployments, Services, Ingress, ConfigMaps, Secrets)
- [ ] Write Helm charts for templated deployments
- [ ] Configure GitHub Actions CI/CD pipeline: test → build → push ACR → deploy AKS
- [ ] DNS: point `api.ai-cloud.io` to AKS Ingress
- [ ] **Verify**: Full stack running on Azure, accessible via `api.ai-cloud.io`

---

### Phase 8 — Java Services Migration (Future)

**Goal**: Migrate scheduler and resource management to Spring Boot for polyglot demonstration

- [ ] Create Java Spring Boot 3 Scheduler Service (advanced scheduling algorithms, priority queues)
- [ ] Create Java Spring Boot 3 Resource Manager (GPU heartbeat, health monitoring)
- [ ] Optional: Migrate Project Service to Java
- [ ] Configure inter-service communication (Kafka + REST)
- [ ] **Verify**: Java scheduler correctly replaces simplified .NET scheduler

---

## Frontend Integration Notes (Tracked for Awareness)

When backend is ready, the frontend needs:

- Replace `mockData.ts` imports with `fetch()` calls to `http://localhost:5000/api/*` (dev) or `https://api.ai-cloud.io/api/*` (prod)
- Add JWT token storage (httpOnly cookie preferred, localStorage fallback)
- Add React auth context provider + protected route wrapper
- Wire SSE `EventSource` for real-time job progress on `/api/jobs/{id}/logs`
- Add loading states, error boundaries, and toast notifications
- Update `User` type to include JWT token management

---

## Testing Strategy

### Unit Tests (xUnit + Moq)

Test critical business logic in isolation:

- **AuthService**: JWT generation, password hashing, refresh token rotation
- **SchedulerService**: GPU matching algorithm, race condition scenarios
- **BillingEngine**: Cost calculation accuracy, pricing lookup
- **WalletService**: Balance operations, idempotency checks
- **SimulatedPaymentGateway**: QR URL generation, callback simulation

### Integration Tests (Testcontainers)

Spin up real PostgreSQL + Kafka in Docker for end-to-end flow tests:

- Register → Login → Create Project → Submit Job → Verify Kafka event published
- Payment webhook → Wallet balance updated → Transaction recorded
- Concurrent GPU allocation → Only one job gets the GPU

### Manual Verification Checklist

- [ ] `docker compose up` → all 8 services + 4 infra containers start clean
- [ ] Swagger UI accessible at `http://localhost:500X/swagger` per service
- [ ] Full happy path: Register → Login → Create Project → Submit Job → Watch progress → Job completes → Balance deducted → Transaction logged
- [ ] Race condition: 2 simultaneous job submissions for same GPU type → only 1 assigned
- [ ] Idempotency: duplicate payment webhook → 409, no double credit
- [ ] Rate limiting: burst 200 requests → 429 after limit
