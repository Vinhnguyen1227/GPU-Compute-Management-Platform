# Phase 4 & 5 — Coding Agent Guide
# Job Lifecycle, Worker Engine, Payment, Wallet & Billing

> **Audience**: A Gemini coding agent that will implement the actual C# code.
> **Scope**: 3 backend services — **JobService**, **WorkerService**, **PaymentService**.
> **Prerequisites**: Phase 1 (scaffolding) is DONE. Phase 2/3 are being built in parallel by another developer. Auth is NOT available yet; use a hardcoded test `UserId` for now.

---

## TABLE OF CONTENTS

1. [Big Picture — What Services We Build](#1-big-picture)
2. [Frontend Pages That Depend on Phase 4 & 5](#2-frontend-pages)
3. [Phase 4 — JobService & WorkerService](#3-phase-4)
4. [Phase 5 — PaymentService](#4-phase-5)
5. [Shared Code Already Available](#5-shared-code)
6. [File-by-File Creation Checklist](#6-file-checklist)
7. [Environment & Configuration](#7-configuration)
8. [Verification Plan](#8-verification)

---

## 1. BIG PICTURE — WHAT SERVICES WE BUILD

```text
PHASE 4 SERVICES:

  JobService (:5004)              WorkerService (:5007)
  +----------------------+        +------------------------+
  | POST /api/jobs       |-Kafka--| GpuJobWorker            |
  | GET  /api/jobs       |  --->  | (BackgroundService)     |
  | GET  /api/jobs/{id}  |        |                         |
  | POST /api/jobs/cancel|<-Kafka-| GpuSimulator             |
  | GET  /api/jobs/logs  |  <---  | (fake training progress) |
  +----------------------+        +------------------------+

PHASE 5 SERVICE:

  PaymentService (:5006)
  +--------------------------------------+
  | GET  /api/wallet         (balance)    |
  | POST /api/wallet/deposit (QR+pending) |
  | POST /api/webhook/payment-callback   |
  | GET  /api/transactions   (history)   |
  | GET  /api/billing/usage  (metering)  |
  |                                       |
  | Kafka Consumer: job.completed         |
  |   -> BillingEngine -> Deduct wallet   |
  | Kafka Consumer: job.failed            |
  |   -> Partial refund                   |
  +--------------------------------------+
```

---

## 2. FRONTEND PAGES THAT DEPEND ON PHASE 4 & 5

### Phase 4 Frontend Pages (Job Lifecycle)

| Frontend Page | File | What Backend API It Calls | Notes |
|:---|:---|:---|:---|
| **Submit Job** | `frontend/src/pages/SubmitJob.tsx` | `POST /api/jobs` | User fills form: job name, project, GPU type, GPU count, command, framework. Backend validates, saves to `job_db`, publishes `job.created` to Kafka. Returns `202 Accepted` with job ID. |
| **Jobs List** | `frontend/src/pages/JobsList.tsx` | `GET /api/jobs` | Displays all user jobs in a table. Filterable by status (QUEUED, RUNNING, COMPLETED, FAILED). Shows progress bar for RUNNING jobs. |
| **Job Monitor** | `frontend/src/pages/JobMonitor.tsx` | `GET /api/jobs/{id}` + `GET /api/jobs/{id}/logs` (SSE) | Real-time training dashboard. Shows epoch progress, loss curve, GPU temperature, VRAM usage. Uses SSE to stream live log lines. |
| **Dashboard** | `frontend/src/pages/Dashboard.tsx` | `GET /api/cluster/metrics` + `GET /api/jobs` (recent) | Overview cards: active jobs, queued jobs, GPU utilization. |

### Phase 5 Frontend Pages (Payments & Billing)

| Frontend Page | File | What Backend API It Calls | Notes |
|:---|:---|:---|:---|
| **Billing & Wallet** | `frontend/src/pages/BillingWallet.tsx` | `GET /api/wallet` + `POST /api/wallet/deposit` + `GET /api/transactions` | Shows wallet balance, deposit button (generates VietQR code), and transaction history table. |
| **Dashboard** | `frontend/src/pages/Dashboard.tsx` | `GET /api/wallet` (balance in header) | Dashboard shows balance in user card. |

---

## 3. PHASE 4 — JOBSERVICE & WORKERSERVICE

### 3.1 JobService API Endpoints (Port 5004)

All responses must use `ApiResponse<T>` wrapper from `Shared.Models`.

#### `POST /api/jobs` — Submit a new training job

**Request Body** (SubmitJobRequest):
```json
{
    "name": "Llama-3-70B-epoch-3",
    "projectId": "guid-here",
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

**Response** (202 Accepted):
```json
{
    "success": true,
    "data": {
        "id": "uuid",
        "name": "Llama-3-70B-epoch-3",
        "status": "CREATED",
        "progress": 0,
        "createdAt": "2026-08-15T10:00:00Z"
    }
}
```

**Side Effects**:
1. Save job to `job_db` with `status=CREATED`
2. Publish `JobCreatedEvent` to Kafka topic `job.created`
3. (Phase 3 ResourceService will consume `job.created`, find GPU, publish `job.assigned`)

#### `GET /api/jobs` — List jobs

Query params: `?status=RUNNING&projectId=xxx&page=1&pageSize=20`
Response: `ApiResponse<PaginatedResult<TrainingJob>>`
Must match frontend TrainingJob type shape exactly.

#### `GET /api/jobs/{id}` — Get single job

Response: `ApiResponse<TrainingJob>`

#### `POST /api/jobs/{id}/cancel` — Cancel a job

Response: `ApiResponse<TrainingJob>` (with status=FAILED)

Side Effects:
1. Update job status to FAILED in DB
2. Publish `JobFailedEvent` to Kafka topic `job.failed` with Reason="Cancelled by user"

#### `GET /api/jobs/{id}/logs` — SSE real-time log stream

Response: `text/event-stream`

Each event line:
```
data: {"timestamp":"2026-08-15T10:05:00Z","level":"INFO","message":"[Epoch 3/10] Loss: 0.042, LR: 1.2e-5, GPU Temp: 72C, VRAM: 68.2/80 GB"}
```

How SSE works:
- Frontend opens `EventSource("http://localhost:5000/api/jobs/{id}/logs")`
- Backend keeps HTTP connection open
- Backend writes `data: {...}\n\n` lines as they arrive from Kafka progress events
- Frontend `onmessage` callback receives each line and appends to log view
- Connection closes when job completes/fails

Implementation:
- Use `Response.ContentType = "text/event-stream"`
- Use `Response.Body.WriteAsync()` in a loop
- Read from an in-memory `ConcurrentDictionary<Guid, Channel<string>>` populated by `JobProgressConsumer`

### 3.2 JobService Database & EF Core

**Database**: `job_db` (already initialized by `04-job-db.sql`)

**EF Core Entity** — `Models/TrainingJob.cs`:
```csharp
public class TrainingJob
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string GpuType { get; set; } = string.Empty;
    public int GpuCount { get; set; } = 1;
    public string Status { get; set; } = "CREATED"; // CREATED | QUEUED | RUNNING | COMPLETED | FAILED
    public int Progress { get; set; } = 0;
    public decimal? DurationHours { get; set; }
    public decimal CostPerHour { get; set; }
    public decimal TotalCost { get; set; }
    public string? AssignedNodeId { get; set; }
    public string? Command { get; set; }
    public string? Framework { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}
```

**DbContext** — `Data/JobDbContext.cs`: Map all properties to snake_case columns using `HasColumnName()`. Table = `training_jobs`.

**Connection string**: `Host=localhost;Port=5432;Database=job_db;Username=postgres;Password=devpassword`

### 3.3 JobService Kafka Producers

**File**: `Events/JobEventProducer.cs`

- On job submit: Publish `JobCreatedEvent` to `job.created`
- On job cancel: Publish `JobFailedEvent` to `job.failed` with Reason="Cancelled by user"

### 3.4 JobService Kafka Consumers

| Consumer Class | Kafka Topic | What It Does |
|:---|:---|:---|
| `JobAssignedConsumer` | `job.assigned` | Update job: status=RUNNING, assignedNodeId, startedAt |
| `JobProgressConsumer` | `job.progress` | Update job: progress=X%. Push log to SSE Channel. |
| `JobCompletedConsumer` | `job.completed` | Update job: status=COMPLETED, progress=100, completedAt |
| `JobFailedConsumer` | `job.failed` | Update job: status=FAILED, completedAt |

Each consumer extends `KafkaConsumerBase<T>`. Use `IServiceScopeFactory` for scoped DbContext.

### 3.5 JobService SSE Endpoint

Use `System.Threading.Channels` for in-memory event routing:

1. Register `JobLogBroadcaster` as **Singleton** in DI
2. `JobLogBroadcaster` holds `ConcurrentDictionary<Guid, List<ChannelWriter<string>>>`
3. SSE controller endpoint creates a `Channel`, subscribes to broadcaster, writes `data: {...}\n\n`
4. `JobProgressConsumer` pushes log lines to broadcaster
5. Connection closes when job completes/fails or client disconnects

### 3.6 WorkerService — GPU Simulation Engine

.NET Worker Service (NO web API). Pure Kafka consumer.

```
WorkerService/
  Program.cs
  Workers/GpuJobWorker.cs    -- consumes job.assigned, runs simulator
  Services/GpuSimulator.cs   -- 10 epochs, 6-12s each, 5% CUDA OOM chance
```

**GpuJobWorker**: `KafkaConsumerBase<JobAssignedEvent>`, group=`worker-gpu-group`
**GpuSimulator**: 10 epochs, publishes `JobProgressEvent` + `ResourceUpdatedEvent` each epoch

### 3.7 Full Kafka Event Flow

```text
STEP 1:  User -> POST /api/jobs -> JobService
STEP 2:  JobService -> Kafka job.created
STEP 3:  ResourceService (Phase 3) -> Kafka job.assigned
STEP 4:  JobService consumes job.assigned -> DB status=RUNNING
STEP 5:  WorkerService consumes job.assigned -> GpuSimulator
STEP 6:  Worker -> Kafka job.progress -> JobService -> SSE -> Frontend
STEP 7:  Worker -> Kafka job.completed
STEP 8:  JobService -> DB status=COMPLETED
STEP 9:  ResourceService -> release GPU
STEP 10: PaymentService -> deduct wallet
```

> **NOTE**: Steps 3/9 (ResourceService) built by other dev. For local testing, make WorkerService consume `job.created` directly.

---

## 4. PHASE 5 — PAYMENTSERVICE

### 4.1 PaymentService API Endpoints (Port 5006)

| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/wallet` | Get user wallet balance |
| `POST` | `/api/wallet/deposit` | Create deposit, generate QR |
| `POST` | `/api/webhook/payment-callback` | Bank callback |
| `GET` | `/api/transactions` | Transaction history |
| `GET` | `/api/billing/usage` | GPU usage records |

### 4.2 PaymentService Database

**Database**: `payment_db` (init by `06-payment-db.sql`)

Tables: `wallets`, `payment_transactions`, `resource_usage`, `resource_pricing` (pre-seeded), `ledger_entries`

### 4.3 Wallet Operations

Auto-create wallet on first access. Return `{ balance, currency }`.

### 4.4 Deposit & Simulated Payment Gateway

1. Create PENDING transaction with reference code `VQR-{date}-{random}`
2. Generate VietQR URL: `https://img.vietqr.io/image/{bankId}-{accountNo}-compact.png?amount={amount}&addInfo={ref}`
3. Return `{ transactionId, qrCodeUrl, amount, status: "PENDING" }`
4. Fire-and-forget: After 5s delay, gateway calls own webhook

### 4.5 Webhook & Idempotency

1. Verify HMAC signature
2. Find transaction by reference_code
3. If already SUCCESS -> 409 Conflict
4. Update to SUCCESS, credit wallet, create ledger entry
5. Publish PaymentCompletedEvent

### 4.6 Billing Engine (job.completed consumer)

1. Lookup pricing by GpuType
2. cost = ActualDurationHours * PricePerHour
3. Deduct wallet, create GPU_USAGE transaction, resource_usage record, ledger debit

### 4.7 Refund Flow (job.failed consumer)

If PartialDurationHours > 0: credit wallet, create REFUND transaction, ledger credit

### 4.8 Transaction History

`GET /api/transactions?page=1&pageSize=20&type=DEPOSIT`
Map DB `created_at` to frontend `timestamp` field.

---

## 5. SHARED CODE ALREADY AVAILABLE

DO NOT MODIFY. All in `backend/src/Shared/`:

- `Messaging/IKafkaProducer.cs`, `KafkaProducer.cs`, `KafkaConsumerBase.cs`
- `Constants/KafkaTopics.cs`
- `Events/` — All 7 event DTOs
- `Models/ApiResponse.cs`, `PaginatedResult.cs`
- `Auth/JwtSettings.cs`

---

## 6. FILE-BY-FILE CREATION CHECKLIST

### JobService (16 files)

- Models/TrainingJob.cs, SubmitJobRequest.cs
- Data/JobDbContext.cs
- Services/IJobService.cs, JobService.cs, JobLogBroadcaster.cs
- Events/JobEventProducer.cs
- Consumers/JobAssignedConsumer.cs, JobProgressConsumer.cs, JobCompletedConsumer.cs, JobFailedConsumer.cs
- Controllers/JobsController.cs
- Validators/SubmitJobRequestValidator.cs
- Program.cs (OVERWRITE), appsettings.json, appsettings.Development.json

### WorkerService (5 files)

- Workers/GpuJobWorker.cs
- Services/GpuSimulator.cs
- Program.cs (OVERWRITE), appsettings.json, appsettings.Development.json

### PaymentService (26 files)

- Models/Wallet.cs, PaymentTransaction.cs, ResourceUsage.cs, ResourcePricing.cs, LedgerEntry.cs, DepositRequest.cs, DepositResponse.cs, WebhookPayload.cs
- Data/PaymentDbContext.cs
- Services/IWalletService.cs, WalletService.cs, IBillingEngine.cs, BillingEngine.cs, IPaymentGateway.cs, SimulatedPaymentGateway.cs
- Consumers/JobCompletedConsumer.cs, JobFailedConsumer.cs
- Controllers/WalletController.cs, WebhookController.cs, TransactionsController.cs, BillingController.cs
- Config/VietQRSettings.cs, VNPaySettings.cs
- Validators/DepositRequestValidator.cs
- Program.cs (OVERWRITE), appsettings.json, appsettings.Development.json

---

## 7. ENVIRONMENT & CONFIGURATION

```bash
# Start infra only:
docker compose up postgres redis kafka zookeeper kafka-init -d

# Run services locally:
cd src/JobService && dotnet run
cd src/WorkerService && dotnet run
cd src/PaymentService && dotnet run
```

### Temporary Auth Bypass

```csharp
private Guid GetUserId()
{
    var claim = User.FindFirst("sub")?.Value;
    if (Guid.TryParse(claim, out var userId)) return userId;
    return Guid.Parse("11111111-1111-1111-1111-111111111111"); // Test user
}
```

---

## 8. VERIFICATION PLAN

### Phase 4 (Jobs)

1. `POST /api/jobs` -> 202, status=CREATED
2. `GET /api/jobs` -> job list
3. `GET /api/jobs/{id}/logs` -> SSE stream during processing
4. `GET /api/jobs/{id}` -> status=COMPLETED, progress=100

### Phase 5 (Payments)

1. `GET /api/wallet` -> balance=0
2. `POST /api/wallet/deposit` -> QR URL, status=PENDING
3. Wait 5s -> `GET /api/wallet` -> balance=100
4. `GET /api/transactions` -> 1 DEPOSIT SUCCESS
5. After job completes -> balance reduced
6. Duplicate webhook -> 409 Conflict

---

## IMPORTANT REMINDERS

1. **DO NOT modify Shared/** — contracts are finalized
2. **Match frontend types** — check `frontend/src/types/index.ts`
3. **snake_case DB columns**, camelCase C# properties, `HasColumnName()` mapping
4. **Register consumers as HostedServices** via `AddHostedService<T>()`
5. **KafkaProducer = Singleton**, DbContext = Scoped (use `IServiceScopeFactory` in consumers)
6. **WorkerService = `Microsoft.NET.Sdk.Worker`** (no controllers)
7. **JobService & PaymentService = `Microsoft.NET.Sdk.Web`** (with controllers)
