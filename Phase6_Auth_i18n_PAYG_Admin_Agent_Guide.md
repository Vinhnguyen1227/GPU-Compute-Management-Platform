# Phase 6 — Coding Agent & Team Guide
# Authentication, RBAC, Bilingual i18n, VND Currency & Pay-As-You-Go GPU Lease

> **Audience**: Developers, Teammates, and Coding Agents working on the GPU Compute Platform.  
> **Scope**: Full-stack architecture covering Authentication (JWT + OAuth), Role-Based Access Control (`USER` vs `ENGINEER` vs `ADMIN`), Bilingual Localization (`react-i18next`), Universal VND Migration, Pay-As-You-Go Dynamic GPU Lease Engine, and the 4-Tab Super Admin Governance Console.  
> **Repository**: `GPU-Compute-Management-Platform`  
> **Date**: August 2026

---

## TABLE OF CONTENTS

1. [Big Picture & Architecture Overview](#1-big-picture)
2. [Bilingual Internationalization (i18n) Engine](#2-bilingual-i18n)
3. [VND Currency & VietQR / PayOS Integration](#3-currency-and-payments)
4. [Pay-As-You-Go GPU Lease & Dynamic Runtime Metering](#4-pay-as-you-go-gpu-lease)
5. [Authentication, User Registration & RBAC](#5-auth-and-rbac)
6. [Super Admin Governance Console (4 Power Tabs)](#6-super-admin-console)
7. [Frontend Architecture & Key Components](#7-frontend-architecture)
8. [Backend Microservices Integration Points](#8-backend-integration)
9. [Pre-Seeded Credentials & Testing Guide](#9-testing-guide)

---

## 1. BIG PICTURE & ARCHITECTURE OVERVIEW

```text
+-----------------------------------------------------------------------------------------+
|                                    REACT 18 FRONTEND                                    |
|                                                                                         |
|   +-------------------+  +--------------------+  +------------------+  +-------------+  |
|   | Auth (Login/Reg)  |  | Shell (RBAC/i18n)  |  | Pay-As-You-Go    |  | Super Admin |  |
|   | 1-Click Shortcuts |  | VI|EN Lang Switch  |  | Min Balance Pre  |  | 4-Tab Power |  |
|   | +100k Promo Credit|  | VND Balance Pill   |  | Live Real-time   |  | Control Hub |  |
|   +-------------------+  +--------------------+  +------------------+  +-------------+  |
+--------------------------------------------|--------------------------------------------+
                                             | HTTP / REST & SSE
                                             v
+-----------------------------------------------------------------------------------------+
|                                 .NET 9 API GATEWAY (:5000)                               |
|                                    (Ocelot + JWT Auth)                                  |
+----+--------------------+---------------------+--------------------+--------------------+
     |                    |                     |                    |
     v                    v                     v                    v
+---------------+  +---------------+  +--------------------+  +--------------------+
|  AuthService  |  |  UserService  |  |    JobService      |  |   PaymentService   |
|    (:5001)    |  |    (:5002)    |  |     (:5004)        |  |      (:5006)       |
| - Login/Reg   |  | - Profiles    |  | - Create/Assign    |  | - Double Ledger    |
| - JWT/Refresh |  | - User CRUD   |  | - PAYG Runtime     |  | - VietQR / PayOS   |
| - RBAC Guard  |  | - Admin List  |  | - Force Kill Hook  |  | - Out-of-funds Stop|
+---------------+  +---------------+  +--------------------+  +--------------------+
                                                |                       ^
                                                +------- Kafka Topic ---+
                                                       job.completed /
                                                       job.stopped (actual_runtime)
```

---

## 2. BILINGUAL INTERNATIONALIZATION (i18n)

### A. Core Architecture
- **Libraries**: `i18next`, `react-i18next`, `i18next-browser-languagedetector`.
- **Default Language**: **Vietnamese (`vi`)** 🇻🇳.
- **Secondary Language**: **English (`en`)** 🇬🇧.
- **Language Detection & Persistence**:
  1. Reads from `localStorage.getItem('lang')`.
  2. Falls back to browser navigator settings.
  3. Default fallback is `vi`.

### B. Master Translation Dictionaries
- `frontend/src/locales/vi.json`: Master Vietnamese translations.
- `frontend/src/locales/en.json`: Master English translations.

### C. Technical Rule for Hardware/Tech Terms
Do **NOT** translate technical, machine learning, or hardware specifications:
- `NVIDIA H100 (80GB)`, `NVIDIA A100 (80GB)`, `NVIDIA RTX 4090 (24GB)`
- `PyTorch 2.4 + CUDA 12.4`, `Kafka`, `Redis`, `Prometheus`
- Status tokens: `RUNNING`, `QUEUED`, `COMPLETED`, `FAILED`, `MAINTENANCE`

---

## 3. VND CURRENCY & VIETQR / PAYOS INTEGRATION

### A. Universal VND Conversion Schedule
All pricing is 100% in **Vietnamese Đồng (`₫` / `VND`)**:

```ts
export const gpuPricing: Record<GPUType, number> = {
  'NVIDIA H100 (80GB)': 112500,  // 112.500 ₫/hr
  'NVIDIA A100 (80GB)': 50000,   // 50.000 ₫/hr
  'NVIDIA RTX 4090 (24GB)': 20000, // 20.000 ₫/hr
  'NVIDIA L40S (48GB)': 37500,   // 37.500 ₫/hr
};
```

### B. Wallet Deposit Limits & Presets
- **Quick-Fill Buttons**: `50K`, `100K`, `500K`, `1M`, `5M`, `10M` VND.
- **Enforced Limits**: Minimum `50.000 ₫` — Maximum `10.000.000 ₫`.
- **VietQR URL Standard**:
  ```
  https://img.vietqr.io/image/970422-0932296788-compact2.png?amount={AMOUNT}&addInfo={TRANSFER_CODE}&accountName=HOANG%20ANH%20TUAN
  ```

---

## 4. PAY-AS-YOU-GO GPU LEASE & DYNAMIC RUNTIME METERING

### A. Core Workflow
1. **Pre-Authorization Check (No Upfront Drain)**:
   - User inputs estimated duration (e.g. 5 hours on RTX 4090 = `100.000₫`).
   - System checks: `user.balance >= min_required_balance (100.000₫)`.
   - If satisfied, GPU launches **without draining the 100.000₫ upfront**.
2. **Continuous Execution**:
   - Workload runs indefinitely on the allocated node with `⚡ Pay-As-You-Go` badge.
   - Job Monitor shows real-time **Elapsed Timer** (`00:02:15`) and **Live Accumulating Cost** (`3.500₫`).
3. **Stop Condition 1 — User Manual Termination**:
   - User clicks **"Dừng & Giải Phóng GPU" (Stop & Release GPU)**.
   - Calculates exact elapsed runtime (ActualCost = ActualHours * HourlyRate).
   - Deducts exact amount from wallet and frees the node back to `AVAILABLE`.
4. **Stop Condition 2 — Out-of-Funds Circuit Breaker**:
   - If user balance hits `0₫`, the system auto-terminates running jobs with status `STOPPED (Hết số dư ví)`, preventing negative balances.

---

## 5. AUTHENTICATION, USER REGISTRATION & RBAC

### A. Role Hierarchy
```ts
export type Role = 'USER' | 'ENGINEER' | 'ADMIN';
```

- **`USER` (Customer)**:
  - Personal project workspace, submit GPU jobs up to wallet balance, VietQR deposits.
  - **Admin Console is strictly hidden from the navigation sidebar**.
- **`ENGINEER` (Operator)**:
  - Same as User + access to Prometheus node metrics and node drainage.
- **`ADMIN` (Super Admin)**:
  - Full governance access with glowing `👑 SUPER` badge and access to the **4-Tab Super Admin Console**.

### B. User Registration Rules
- Users register with Name, Email, Password, Confirm Password.
- Role is automatically locked to `USER` upon registration.
- Every new user is gifted a **+100.000₫ Welcome Promo Bonus** in their initial wallet.

---

## 6. SUPER ADMIN GOVERNANCE CONSOLE (4 POWER TABS)

Exclusively accessible to users where `user.role === 'ADMIN'`:

### 🖥️ Tab 1: Node Governance & Live GPU Pricing Editor
- Inspect live cluster hardware (Temperature, VRAM, GPU Load).
- Toggle nodes into `MAINTENANCE` drain mode.
- **Live Hourly Pricing Editor**: Edit and save hourly rates in VND for all GPU types live.

### 👥 Tab 2: User Management & Balance Adjustments
- Searchable user table (ID, Name, Email, Role, Balance, Status, Joined Date).
- **Role Elevation**: Change user role (`USER` <-> `ENGINEER` <-> `ADMIN`).
- **Manual Wallet Adjustments (+ / -)**: Modal to credit promo bonuses or manual refunds with ledger entries.
- **Account Ban / Unban**: Freeze or activate user accounts.

### ⚡ Tab 3: Global Cluster Jobs Inspector
- View all active and queued jobs across all users in the cluster.
- **Emergency Force Kill**: Red button to immediately abort rogue or runaway jobs.

### 💰 Tab 4: Platform Revenue & Financial Analytics
- Total platform revenue deposited through VietQR, VNPay, and MoMo.
- Total GPU compute fees billed.
- Gross margin and escrow balance.

---

## 7. FRONTEND ARCHITECTURE & KEY COMPONENTS

```text
frontend/src/
├── i18n.ts                  # i18next initialization & detector
├── locales/
│   ├── vi.json              # Vietnamese translations
│   └── en.json              # English translations
├── types/
│   └── index.ts             # User, Role, TrainingJob, GPUNode, Transaction types
├── data/
│   └── mockData.ts          # Seeded accounts, cluster nodes, and initial pricing
├── components/layout/
│   └── Shell.tsx            # Header with VI|EN toggle, VND balance, and RBAC sidebar
├── pages/
│   ├── Auth.tsx             # Login/Register tabs with 1-click demo buttons
│   ├── AdminConsole.tsx     # 4-Tab Super Admin Governance Dashboard
│   ├── SubmitJob.tsx        # Pay-As-You-Go minimum balance pre-auth form
│   ├── JobMonitor.tsx       # Live elapsed timer, cost accumulator & Stop button
│   ├── JobsList.tsx         # Jobs table with Pay-As-You-Go badges & direct stop
│   ├── BillingWallet.tsx    # VietQR MB Bank deposit modal & transaction ledger
│   ├── Dashboard.tsx        # Cluster telemetry & active jobs overview
│   ├── Projects.tsx         # AI Projects Workspace
│   └── ResourceCluster.tsx  # Cluster node topology & distributed locks
└── App.tsx                  # Root state coordinating auth, RBAC guards, and PAYG billing
```

---

## 8. BACKEND MICROSERVICES INTEGRATION POINTS

| Service | Port | Key Endpoints / Contracts |
|---|---|---|
| **ApiGateway** | `:5000` | Routes `/api/auth`, `/api/users`, `/api/jobs`, `/api/gpu-nodes`, `/api/wallet` |
| **AuthService** | `:5001` | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh` |
| **UserService** | `:5002` | `GET /api/users/me`, `GET /api/users` (Admin), `PUT /api/users/{id}/role` (Admin) |
| **JobService** | `:5004` | `POST /api/jobs`, `POST /api/jobs/{id}/cancel` (Trigger actual elapsed billing) |
| **PaymentService** | `:5006` | `GET /api/wallet`, `POST /api/wallet/deposit`, `POST /api/wallet/admin/credit` |
| **WorkerService** | `:5007` | Consumes `job.created`, streams logs, listens for `job.cancel` to stop |

---

## 9. PRE-SEEDED CREDENTIALS & TESTING GUIDE

### A. Credentials
| Account | Email | Password | Role | Permissions |
|---|---|---|:---:|---|
| **👑 Super Admin** | `admin@dgx-compute.io` | `Admin@2026!` | `ADMIN` | Full Platform & Admin Console Access |
| **👤 Developer User** | `developer@ai-cloud.io` | `User@2026!` | `USER` | Standard Workspace (Admin hidden) |
| **🔧 Cluster Engineer** | `duc.tm@nlp-lab.vn` | `Engineer@2026!` | `ENGINEER` | Cluster Operator Access |

### B. Quick Verification Workflow
1. Open `http://localhost:3000`.
2. Click **"🔑 Đăng Nhập Admin"** to access the Super Admin Console.
3. Modify GPU pricing in Tab 1, or adjust user balances in Tab 2.
4. Click Logout, then click **"👤 Đăng Nhập User"** to confirm that regular users cannot see the Admin Console.
5. Launch a job on the Submit Job page and verify the Pay-As-You-Go minimum balance pre-auth flow.

---

*Authored for the GPU Compute Management Platform Team • 2026*
