# 2-Person Parallel Execution & Work Distribution Plan

## Executive Feasibility: Can We Work in Parallel?
**YES, absolutely.** 
Because Phase 1 already scaffolded the `Shared` library, database schemas (`init-scripts/`), and Kafka event contracts (`JobCreatedEvent`, etc.), both developers have clear, decoupled interface boundaries (API Contracts + Kafka Events).

---

## 1. Work Split & Ownership

```text
                  ┌──────────────────────────────────────────────┐
                  │              PHASE 1 (COMPLETED)             │
                  │   Infra, Docker, DB Schemas, Shared Events   │
                  └──────────────────────┬───────────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
   ┌───────────────────────────┐                   ┌───────────────────────────┐
   │         PERSON A          │                   │         PERSON B          │
   │  "Identity & Resources"   │                   │  "Compute & Monetization" │
   ├───────────────────────────┤                   ├───────────────────────────┤
   │ Phase 2:                  │                   │ Phase 4:                  │
   │ • AuthService             │                   │ • JobService              │
   │ • UserService             │                   │ • WorkerService (Kafka)   │
   │ • ApiGateway (Ocelot)     │                   │ • SSE Live Log Streaming  │
   │                           │                   │                           │
   │ Phase 3:                  │                   │ Phase 5:                  │
   │ • ProjectService          │                   │ • PaymentService (Wallet) │
   │ • ResourceService (Redis) │                   │ • Billing & Usage Metering│
   └─────────────┬─────────────┘                   └─────────────┬─────────────┘
                 │                                               │
                 └───────────────────────┬───────────────────────┘
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │             INTEGRATION (PHASE 6)            │
                  │   E2E Testing, Frontend Hookup, Monitoring   │
                  └──────────────────────────────────────────────┘
```

---

## 2. Detailed Task Breakdown

### 👤 Person A: Identity, Resources & Gateway (Phases 2 & 3)
*Role: Core Platform & Infrastructure Architect*

#### Milestones:
1. **Phase 2: Auth & Gateway (Days 1 - 3)**
   - **AuthService**: EF Core models, Register/Login API, JWT creation with Claims (`UserId`, `Email`, `Role`), Refresh Token rotation, BCrypt hashing.
   - **UserService**: Profile retrieval/updating, organization metadata.
   - **ApiGateway**: Configure Ocelot routing rules for `/api/auth/*`, `/api/users/*`, JWT Bearer token validation middleware, CORS policy for `localhost:5173`.
2. **Phase 3: Projects & Resources (Days 4 - 6)**
   - **ProjectService**: Project CRUD, dataset metadata registration, linking projects to `UserId`.
   - **ResourceService**: GPU node inventory (A100, H100, RTX 4090), cluster status endpoints, **Redis Distributed Lock** (`RedLock.net`) for atomic GPU allocation.

---

### 👤 Person B: Compute Engine, Messaging & Billing (Phases 4 & 5)
*Role: Distributed Systems & Monetization Engineer*

#### Milestones:
1. **Phase 4: Job & Worker Engine (Days 1 - 3)**
   - **JobService**: `POST /api/jobs` endpoint, job state tracking in `job_db` (`QUEUED`, `RUNNING`, `COMPLETED`, `FAILED`), publishing `JobCreatedEvent` to Kafka `job.created`.
   - **WorkerService**: Kafka consumer for `job.created`, GPU execution simulation (iterating epochs, generating loss/telemetry), publishing `JobProgressEvent` and `JobCompletedEvent`.
   - **Real-Time Logs**: SSE (Server-Sent Events) endpoint on JobService streaming live telemetry to UI.
2. **Phase 5: Payment & Billing (Days 4 - 6)**
   - **PaymentService**: Wallet balance management (`payment_db`), VietQR deposit simulation/sandbox webhook, transaction history.
   - **Ledger & Metering**: Double-entry ledger (`LedgerEntry`), Kafka consumer for `JobCompletedEvent` to calculate compute hours and deduct user wallet automatically.

---

## 3. How to Avoid Conflicts While Working in Parallel

| Potential Conflict | How to Prevent / Resolve |
| :--- | :--- |
| **Auth Dependency in Phase 4/5** | Person B does **not** need to wait for AuthService. Use a mock `UserId: 11111111-1111-1111-1111-111111111111` or hardcoded JWT in development headers. |
| **Git Merge Conflicts** | Each person works in isolated project directories. Person A modifies `AuthService/`, `UserService/`, `ProjectService/`, `ResourceService/`, `ApiGateway/`. Person B modifies `JobService/`, `WorkerService/`, `PaymentService/`. They only touch `Shared/` if discussing contract updates together. |
| **Database Ports** | Docker Compose already assigns isolated DBs (`auth_db:5432`, `job_db:5432`, etc.). No database conflict. |
| **Local Testing** | Both can run `docker-compose up postgres redis kafka` locally to test individual services. |

---

## 4. Integration & Handshake (Day 7)

Once both developers finish their modules, combine in Phase 6:
1. **Connect Gateway**: Person A adds Ocelot routes for `/api/jobs/*` and `/api/payments/*` into `ApiGateway`.
2. **E2E Flow Test**:
   - User Registers (Person A Auth)
   - User Deposits 500,000 VND (Person B Payment)
   - User Creates Project & Allocates GPU (Person A Project + Resource)
   - User Submits Job (Person B Job + Worker)
   - Job Runs -> Progress Streamed -> Job Completes -> Wallet Deducted (Combined E2E)
3. **Connect Frontend**: Replace `frontend/src/data/mockData.ts` with real API calls.
