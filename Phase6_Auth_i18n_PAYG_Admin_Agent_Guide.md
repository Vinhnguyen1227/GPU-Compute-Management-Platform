# Phase 6 — Coding Agent & Team Guide
# Real Database Connections, Authentication, RBAC, Bilingual i18n, VND Currency & Pay-As-You-Go GPU Lease

> **Audience**: Developers, Teammates, and Coding Agents working on the GPU Compute Platform.  
> **Scope**: Full-stack architecture covering Real Database Connections across all microservices (`auth_db`, `user_db`, `job_db`, `resource_db`, `payment_db`), Authentication (BCrypt + JWT + OAuth), Role-Based Access Control (`USER` vs `ENGINEER` vs `ADMIN`), Bilingual Localization (`react-i18next`), Universal VND Migration, Pay-As-You-Go Dynamic GPU Lease Engine, and the 4-Tab Super Admin Governance Console.  
> **Repository**: `GPU-Compute-Management-Platform`  
> **Date**: August 2026

---

## TABLE OF CONTENTS

1. [Big Picture & Real Database Architecture](#1-big-picture)
2. [Database Connection & Entity Framework Mappings](#2-database-connections)
3. [Bilingual Internationalization (i18n) Engine](#3-bilingual-i18n)
4. [VND Currency & VietQR / PayOS Integration](#4-currency-and-payments)
5. [Pay-As-You-Go GPU Lease & Dynamic Runtime Metering](#5-pay-as-you-go-gpu-lease)
6. [Authentication, User Registration & RBAC](#6-auth-and-rbac)
7. [Super Admin Governance Console (4 Power Tabs)](#7-super-admin-console)
8. [Backend Microservices & REST API Contracts](#8-backend-microservices)
9. [Pre-Seeded Credentials & Verification Guide](#9-testing-guide)

---

## 1. BIG PICTURE & REAL DATABASE ARCHITECTURE

Every microservice in the platform connects to its own isolated PostgreSQL database on port `5432` with Docker and Entity Framework Core:

```text
+-------------------------------------------------------------------------------------------------------+
|                                           REACT 18 FRONTEND                                           |
|                                                                                                       |
|   +---------------------+  +--------------------+  +--------------------+  +----------------------+   |
|   | Auth (Login/Reg)    |  | Shell (RBAC/i18n)  |  | Pay-As-You-Go Lease|  | Super Admin Console  |   |
|   | 1-Click Quick Demo  |  | VI|EN Lang Switch  |  | Min Balance Pre-Auth| | 4-Tab Governance Hub|   |
|   | +100k Welcome Promo |  | VND Balance Pill   |  | Live Real-time Rate| | Pricing & User Cr.   |   |
|   +---------------------+  +--------------------+  +--------------------+  +----------------------+   |
+---------------------------------------------------|---------------------------------------------------+
                                                    | HTTP / REST & SSE
                                                    v
+-------------------------------------------------------------------------------------------------------+
|                                        .NET 9 API GATEWAY (:5000)                                     |
|                                           (Ocelot + JWT Auth)                                         |
+----+--------------------+-------------------------+-------------------------+--------------------+----+
     |                    |                         |                         |                    |
     v                    v                         v                         v                    v
+---------------+  +---------------+  +--------------------------+  +--------------------+  +---------------+
|  AuthService  |  |  UserService  |  |       JobService         |  |   PaymentService   |  |ResourceService|
|    (:5001)    |  |    (:5002)    |  |        (:5004)           |  |      (:5006)       |  |    (:5005)    |
| - BCrypt Hash |  | - Profile CRUD|  | - Pre-auth Min Balance   |  | - Double Ledger    |  | - Node Topology|
| - JWT/Refresh |  | - Admin Users |  | - Actual Runtime (PAYG)  |  | - VietQR / PayOS   |  | - Live Pricing|
| - Seed Admin  |  | - Role Change |  | - Cancel/Force-Kill Hook |  | - Out-of-Funds Stop|  | - Drain Mode  |
+-------+-------+  +-------+-------+  +-------------+------------+  +---------+----------+  +-------+-------+
        |                  |                        |                         |                     |
        v                  v                        v                         v                     v
   [ auth_db ]        [ user_db ]              [ job_db ]                [ payment_db ]       [ resource_db ]
   - users_auth       - user_profiles          - training_jobs           - wallets            - gpu_nodes
                                               - job_logs                - payment_tx
                                               - job_telemetry           - ledger_entries
                                                                         - resource_pricing
```

---

## 2. DATABASE CONNECTION & ENTITY FRAMEWORK MAPPINGS

### A. PostgreSQL Databases (Port 5432)
The platform uses 6 isolated databases provisioned via `backend/infra/init-scripts/`:

| Database | Service | DbContext | Key Tables |
|---|---|---|---|
| `auth_db` | `AuthService` | `AuthDbContext` | `users_auth` |
| `user_db` | `UserService` | `UserDbContext` | `user_profiles` |
| `job_db` | `JobService` | `JobDbContext` | `training_jobs`, `job_logs`, `job_telemetry` |
| `resource_db` | `ResourceService` | `ResourceDbContext` | `gpu_nodes` |
| `payment_db` | `PaymentService` | `PaymentDbContext` | `wallets`, `payment_transactions`, `ledger_entries`, `resource_pricing` |
| `project_db` | `ProjectService` | `ProjectDbContext` | `projects`, `datasets` |

### B. Connection String Format
Each service configures its DbContext in `Program.cs`:
```csharp
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Host=postgres;Port=5432;Database=payment_db;Username=postgres;Password=devpassword";

builder.Services.AddDbContext<PaymentDbContext>(options =>
    options.UseNpgsql(connectionString));
```

---

## 3. BILINGUAL INTERNATIONALIZATION (i18n)

- **Libraries**: `i18next`, `react-i18next`, `i18next-browser-languagedetector`.
- **Default Language**: **Vietnamese (`vi`)** 🇻🇳.
- **Secondary Language**: **English (`en`)** 🇬🇧.
- **Persistent Storage**: Saved in `localStorage.getItem('lang')`.
- **Translation Files**:
  - `frontend/src/locales/vi.json` (Master Vietnamese dictionary)
  - `frontend/src/locales/en.json` (Master English dictionary)

---

## 4. VND CURRENCY & VIETQR / PAYOS INTEGRATION

### A. GPU Hourly Pricing Schedule (in VND)
- **NVIDIA H100 (80GB)**: `112.500 ₫/giờ`
- **NVIDIA A100 (80GB)**: `50.000 ₫/giờ`
- **NVIDIA RTX 4090 (24GB)**: `20.000 ₫/giờ`
- **NVIDIA L40S (48GB)**: `37.500 ₫/giờ`

### B. MB Bank VietQR Standard
```text
https://img.vietqr.io/image/970422-0932296788-compact2.png?amount={AMOUNT}&addInfo={TRANSFER_CODE}&accountName=HOANG%20ANH%20TUAN
```
- **Bank**: MB Bank (BIN `970422`)
- **Account Number**: `0932296788`
- **Account Name**: `HOANG ANH TUAN`
- **Limits**: Minimum `50.000 ₫` — Maximum `10.000.000 ₫`.

---

## 5. PAY-AS-YOU-GO GPU LEASE & DYNAMIC RUNTIME METERING

1. **Pre-Authorization Check (No Upfront Drain)**:
   - When launching a GPU with estimated hours, the system verifies:
     $$\text{Balance} \ge \text{HourlyRate} \times \text{Hours}$$
   - The balance is **not** deducted upfront.
2. **Indefinite Live Execution**:
   - Workloads run continuously with live elapsed time and cost counters.
3. **Stop & Release GPU**:
   - When the user cancels/stops the job, `JobService` computes:
     $$\text{ActualCost} = \text{ActualElapsedHours} \times \text{HourlyRate} \times \text{GpuCount}$$
   - Emits `job.completed` with `ActualDurationHours` to Kafka.
   - `PaymentService.BillingEngine` deducts only the exact actual runtime in VND and writes an audit `LedgerEntry`.
4. **Out-of-Funds Circuit Breaker**:
   - If balance hits `0₫`, active jobs are auto-terminated to prevent negative debt.

---

## 6. AUTHENTICATION, USER REGISTRATION & RBAC

### A. Pre-Seeded Accounts in `auth_db`
- **Super Admin**: `admin@dgx-compute.io` / `Admin@2026!` (Role: `ADMIN`)
- **Developer User**: `developer@ai-cloud.io` / `User@2026!` (Role: `USER`)

### B. Registration Flow
1. User submits Name, Email, Password, Confirm Password.
2. `AuthService` hashes password with BCrypt (`workFactor: 12`) and saves to `users_auth`.
3. Calls `UserService` to create `user_profiles` record.
4. Calls `PaymentService` (`POST /api/wallet/internal/init`) to create `wallets` record with **+100.000₫ Welcome Promo Bonus**!
5. Issues JWT token with role claims (`ADMIN`, `USER`, or `ENGINEER`).

---

## 7. SUPER ADMIN GOVERNANCE CONSOLE (4 POWER TABS)

Exclusively accessible to users where `user.role === 'ADMIN'`:

- **🖥️ Tab 1 — Node Governance & Live Pricing Config**:
  - Inspect live hardware telemetry (Temp, VRAM, Load).
  - Node maintenance drain.
  - **Live GPU Rate Editor**: Update hourly pricing in VND live.
- **👥 Tab 2 — User Management**:
  - Search user directory, promote/demote roles (`USER` $\leftrightarrow$ `ENGINEER` $\leftrightarrow$ `ADMIN`).
  - **Manual Wallet Credit (+ / -)**: Add promo bonuses or manual refunds.
  - Ban / Unban accounts.
- **⚡ Tab 3 — Global Cluster Jobs**:
  - Monitor all running/queued cluster workloads + emergency **Buộc Dừng Khẩn Cấp (Force Kill)**.
- **💰 Tab 4 — Revenue Analytics**:
  - Real-time platform deposits, compute fees billed, and gross margin.

---

## 8. BACKEND MICROSERVICES & REST API CONTRACTS

| Microservice | Port | Key REST Endpoints |
|---|---|---|
| **ApiGateway** | `:5000` | Routes `/api/auth`, `/api/users`, `/api/jobs`, `/api/gpu-nodes`, `/api/wallet` |
| **AuthService** | `:5001` | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh` |
| **UserService** | `:5002` | `GET /api/users/me`, `GET /api/users` (Admin), `PUT /api/users/{id}/role` (Admin) |
| **JobService** | `:5004` | `POST /api/jobs`, `POST /api/jobs/{id}/cancel` (PAYG calculation) |
| **PaymentService** | `:5006` | `GET /api/wallet`, `POST /api/wallet/admin/credit`, `GET /api/billing/analytics` |
| **ResourceService** | `:5005` | `GET /api/gpu-nodes`, `PUT /api/gpu-nodes/pricing`, `POST /api/gpu-nodes/{id}/toggle-maintenance` |
| **WorkerService** | `:5007` | Consumes `job.created`, streams logs, continuous execution until canceled |

---

## 9. PRE-SEEDED CREDENTIALS & VERIFICATION GUIDE

### Credentials
| Account | Email | Password | Role | Permissions |
|---|---|---|:---:|---|
| **👑 Super Admin** | `admin@dgx-compute.io` | `Admin@2026!` | `ADMIN` | Full Governance & 4-Tab Admin Console |
| **👤 Developer User** | `developer@ai-cloud.io` | `User@2026!` | `USER` | Standard Workspace (Admin hidden) |
| **🔧 Cluster Engineer** | `duc.tm@nlp-lab.vn` | `Engineer@2026!` | `ENGINEER` | Cluster Operator Access |

---

*Authored for the GPU Compute Management Platform Team • 2026*
