# AI Compute Cloud Platform - System Architecture & Progress Analysis (Explain.md)

This document provides a comprehensive breakdown of the **AI Compute Management Platform (Mini NVIDIA DGX Cloud)** based on `Idea (1).md`, the latest updates, and current project state.

---

## 1. What Work We Need to Do vs. What We Already Done

### 1.1. Overall Roadmap & Status

| Phase | Description | Status | Details |
| :--- | :--- | :--- | :--- |
| **Phase 0: Frontend UI** | Web Dashboard (React + Vite + TS + Tailwind) | **DONE** | 10 pages built (DGX dark mode, GPU monitoring, mock data, charts, deposit modal). |
| **Phase 1: Foundation & Infra** | Backend Scaffolding, Solution Setup, Docker, DB Init Scripts, Kafka Messaging Abstractions | **DONE (Latest Update)** | Solution (`AIComputePlatform.sln`), 9 projects scaffolded, 6 Postgres init scripts, Kafka topic creation script, Docker Compose, Shared event models. |
| **Phase 2: Core Auth & Gateway** | AuthService, UserService, Gateway Routing & JWT Validation | **NOT DONE (Next Step)** | Implement EF Core entities, Migrations, Register/Login endpoints, JWT generation & validation, BCrypt password hashing, Redis blacklist. |
| **Phase 3: Projects & Resources** | ProjectService & ResourceService | **NOT DONE** | Project CRUD, Dataset metadata, GPU node tracking, GPU allocation & Redis distributed locks. |
| **Phase 4: Job Service & Worker** | Job Submission, Worker Simulation & Kafka Workflow | **NOT DONE** | Job queueing via Kafka, Worker execution engine simulating GPU training, progress reporting, SSE real-time log streaming. |
| **Phase 5: Payment & Billing** | Wallet, Metering & Payment Gateway | **NOT DONE** | Double-entry ledger, VietQR/VNPay webhook integration, balance deduction per GPU minute/hour. |
| **Phase 6: Observability & Resilience** | Monitoring, Logging, Tracing | **NOT DONE** | Serilog structured logging, Prometheus metrics, Grafana dashboards, OpenTelemetry distributed tracing. |

---

## 2. What the Update Just Did (Latest Pull Breakdown)

The latest pull brought the project from a pure UI prototype into a structured microservices backend architecture:

1. **Backend Guide Added (`Backend_Coding_Agent_Guide.md`)**:
   - Comprehensive technical design document specifying ports, endpoints, database schemas, Kafka events, and implementation contracts for all microservices.

2. **Backend Solution Scaffolding (`AIComputePlatform.sln`)**:
   - Created .NET 9 solution tying together **9 projects**:
     - `ApiGateway` (Port 5000)
     - `AuthService` (Port 5001)
     - `UserService` (Port 5002)
     - `ProjectService` (Port 5003)
     - `JobService` (Port 5004)
     - `ResourceService` (Port 5005)
     - `PaymentService` (Port 5006)
     - `WorkerService` (Port 5007)
     - `Shared` (Class Library for events, constants, models)

3. **Infrastructure as Code (Docker & SQL)**:
   - `docker-compose.yml` & `docker-compose.override.yml`: Orchestrates 6 PostgreSQL instances, Redis, Zookeeper, Kafka, and the microservices.
   - `backend/infra/init-scripts/`: 6 SQL scripts (`01-auth-db.sql` to `06-payment-db.sql`) defining initial relational database schemas for each isolated service.
   - `backend/infra/kafka/create-topics.sh`: Script defining all Kafka event streams (`job.created`, `job.assigned`, `job.progress`, `job.completed`, `job.failed`, `resource.updated`, `payment.completed`).

4. **Shared Messaging & Domain Models (`backend/src/Shared`)**:
   - Kafka Producer (`KafkaProducer.cs`) and abstract Consumer base class (`KafkaConsumerBase.cs`).
   - Strongly-typed Kafka event records: `JobCreatedEvent`, `JobAssignedEvent`, `JobProgressEvent`, `JobCompletedEvent`, `JobFailedEvent`, `ResourceUpdatedEvent`, `PaymentCompletedEvent`.
   - Unified API response models: `ApiResponse<T>` and `PaginatedResult<T>`.

---

## 3. What We Have NOT Done / Missing / Need to Finish

Although the skeleton and infrastructure files exist, the **business logic and runtime code are still empty skeletons** (they have only default `Program.cs` files). Here is what needs to be implemented:

1. **Service Implementations (Business Logic & Endpoints)**:
   - **AuthService**: Database models, EF Core DbContext, user registration, login, JWT token issuance, refresh token rotation, password hashing with BCrypt.
   - **UserService**: User profile endpoints, organization management, quota checking.
   - **ProjectService**: AI project CRUD, dataset management, associating projects with user accounts.
   - **JobService**: Job submission API, queueing jobs into Kafka, SSE endpoint for streaming logs to frontend.
   - **ResourceService**: GPU node registration, GPU health check, allocation logic with Redis distributed lock.
   - **PaymentService & Wallet**: Deposit flow, QR code generation, mock bank webhooks, double-entry ledger calculation, deducting balance on usage.
   - **WorkerService**: Background worker consuming Kafka `job.created` events, simulating GPU execution, reporting real-time metrics/logs via `job.progress` and `job.completed`.

2. **Frontend-to-Backend Integration**:
   - Currently, the frontend uses `mockData.ts`. We must replace mock API calls with real HTTP/REST and SSE calls to the API Gateway (`http://localhost:5000`).

3. **Security & Production Hardening**:
   - Rate limiting in Ocelot Gateway.
   - Idempotency key handling for payments.
   - Centralized error handling and validation middleware (FluentValidation).

4. **Observability**:
   - Prometheus endpoints and Grafana dashboard provisioning.
   - OpenTelemetry integration for distributed tracing across services.

---

## 4. Deep-Dive: How Each Part Works, Why We Need It, and Connection Flows

### 4.1. The Microservices Breakdown

```text
[Frontend (React)]
       │ (HTTP / SSE)
       ▼
[API Gateway (Ocelot :5000)]
   ├── /api/auth/*     ──> [Auth Service :5001]
   ├── /api/users/*    ──> [User Service :5002]
   ├── /api/projects/* ──> [Project Service :5003]
   ├── /api/jobs/*     ──> [Job Service :5004] ──┐
   ├── /api/resources/*──> [Resource Service :5005]│
   └── /api/payments/* ──> [Payment Service :5006]│ (Kafka Events)
                                                  ▼
                                          [Kafka Broker :9092]
                                                  ▲
                                                  │
                                          [Worker Service :5007]
```

#### 1. API Gateway (Ocelot - Port 5000)
- **What it is**: Single entry point for all frontend traffic.
- **Why we need it**: Without a gateway, the frontend would need to know the IP and port of 7 different services and handle cross-cutting concerns (authentication, CORS, SSL, rate limiting) in each service individually.
- **How it works**: Inspects incoming request URLs (e.g. `/api/jobs`) and routes them to the appropriate internal microservice (e.g. `http://job-service:5004/api/jobs`). It also validates JWT tokens before forwarding the request.

#### 2. Auth & User Services (Ports 5001 & 5002)
- **What it is**: Identity management, registration, login, JWT token issuance, and user profiles.
- **Why we need it**: Protects GPU resources from unauthorized usage and manages multi-tenant isolation (each user sees only their projects and jobs).
- **How it works**:
  - User submits email/password.
  - AuthService hashes password using BCrypt, verifies against `auth_db`, and returns JWT access + refresh tokens.
  - Downstream services read claims (e.g. `UserId`, `Role`) from the JWT header.

#### 3. Job Service & Worker Service (Ports 5004 & 5007)
- **What it is**: Job lifecycle management and asynchronous task execution engine.
- **Why we need it**: AI/GPU workloads are long-running (minutes to hours). A standard HTTP request cannot remain open waiting for a model to finish training.
- **How it works (Event-Driven Workflow)**:
  1. **User Request**: User sends `POST /api/jobs` with Docker image, GPU type (`NVIDIA_A100`), dataset, and hyperparameters.
  2. **Validation**: JobService checks user wallet balance with PaymentService.
  3. **Event Publication**: JobService saves job as `QUEUED` in `job_db` and publishes a `JobCreatedEvent` to Kafka topic `job.created`. It immediately responds `202 Accepted` to frontend with `jobId`.
  4. **Worker Processing**: WorkerService (Kafka Consumer) picks up `JobCreatedEvent`, claims an available GPU from ResourceService, and updates state to `RUNNING`.
  5. **Progress & Logs**: Worker emits `JobProgressEvent` (epoch, loss, GPU temp, VRAM usage) periodically to Kafka.
  6. **SSE Streaming**: JobService consumes progress events and pushes real-time updates to the frontend via Server-Sent Events (SSE).
  7. **Completion**: Worker emits `JobCompletedEvent`, releasing the GPU and notifying PaymentService to finalize billing.

#### 4. Resource Service (Port 5005)
- **What it is**: Tracks GPU nodes (A100, H100, RTX 4090), cluster health, VRAM, and availability.
- **Why we need it**: Prevents over-subscription and race conditions (two users claiming the same GPU simultaneously).
- **How it works**: Uses **Redis Distributed Locks** (`RedLock`) when assigning GPU nodes to ensure atomic scheduling.

#### 5. Payment & Billing Service (Port 5006)
- **What it is**: Wallet balance management, deposit processing (VietQR/VNPay), and usage metering.
- **Why we need it**: Cloud GPU compute is expensive; the platform must charge users accurately based on compute duration and GPU tier.
- **How it works**:
  - **Double-entry Ledger**: Every balance change has a transaction record (Credit for Deposit, Debit for GPU Usage).
  - **Pre-flight Check**: Before starting a job, verify `Wallet Balance >= Minimum Threshold`.
  - **Usage Deduction**: When `JobCompletedEvent` arrives, calculate `Cost = (DurationInSeconds / 3600) * PricePerHour` and deduct from wallet.

---

## 5. Why Do We Need Docker to Run All Services?

In this project, Docker is critical for the following reasons:

1. **Microservices Multiplicity (10+ Components)**:
   - The platform has **6 isolated PostgreSQL databases**, **1 Redis cache**, **1 Kafka broker**, **1 Zookeeper**, and **8 .NET services**.
   - Without Docker, a developer would have to manually install, configure, and manage 6 database instances on different ports, install Java and Kafka locally, configure Redis, and open 8 separate terminal windows to run each service.
   - With `docker-compose up`, the entire cloud infrastructure boots in **one command**.

2. **Database Isolation (Database-per-Service Pattern)**:
   - Clean microservices require independent databases (`auth_db`, `job_db`, `payment_db`, etc.) so services cannot directly query each other's tables. Docker Compose spins up PostgreSQL with automatic execution of initialization scripts (`/docker-entrypoint-initdb.d`).

3. **Consistent Environment & Zero "Works on My Machine" Issues**:
   - All network connections, environment variables, dependencies (.NET 9 runtime, libgdi, native Kafka libraries) are containerized, ensuring identical behavior across Windows, Linux, and macOS.

4. **Realistic Cloud Simulation**:
   - In production (e.g. Kubernetes/AKS), each microservice runs as an independent container. Using Docker Compose simulates the real-world deployment topology of NVIDIA DGX Cloud or AWS SageMaker.

---

## 6. Summary: Next Immediate Step

The immediate focus is **Phase 2**:
- Implement **AuthService** & **UserService** with PostgreSQL & EF Core.
- Configure **ApiGateway** routing and test authentication flow from frontend to backend.
