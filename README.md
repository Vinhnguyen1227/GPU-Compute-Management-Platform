# 🚀 DGX Compute Cloud — GPU Compute Management Platform

[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite%206%20%7C%20Tailwind-61DAFB?style=for-the-badge&logo=react)](frontend/)
[![Backend](https://img.shields.io/badge/Backend-.NET%209%20Microservices-512BD4?style=for-the-badge&logo=dotnet)](backend/)
[![i18n](https://img.shields.io/badge/i18n-Vietnamese%20%F0%9F%87%BB%F0%9F%87%B3%20%7C%20English%20%F0%9F%87%AC%F0%9F%87%A7-green?style=for-the-badge)](frontend/src/locales/)
[![Currency](https://img.shields.io/badge/Currency-100%25%20VND%20(%E2%82%AB)-yellow?style=for-the-badge)](frontend/src/pages/BillingWallet.tsx)
[![Docker](https://img.shields.io/badge/Docker-Compose%20Ready-2496ED?style=for-the-badge&logo=docker)](backend/docker-compose.yml)

A high-performance, enterprise-grade AI Cloud & GPU Compute Orchestration platform. Features distributed GPU allocation, deep learning training job scheduling, real-time telemetry streaming, a **Pay-As-You-Go Dynamic GPU Lease Engine**, native **Vietnamese / English bilingual i18n**, **Universal VND & VietQR billing**, and a **Super Admin Governance Console**.

---

## 🌟 Key Platform Features

### 1. 🇻🇳 🇬🇧 Native Bilingual Internationalization (i18n)
- **Default Language**: **Vietnamese (`vi`)** 🇻🇳 as primary, with **English (`en`)** 🇬🇧 for global developers.
- **Instant Reactive Switcher**: `VI | EN` header and auth toggles switch all metrics, navigation, modals, and charts in real-time without reloading.
- **Persistent Choice**: Stored in `localStorage` across browser restarts.

### 2. 💰 100% VND Currency & VietQR / PayOS Banking
- **All Prices in VND**: NVIDIA H100 (`112.500 ₫/hr`), A100 (`50.000 ₫/hr`), RTX 4090 (`20.000 ₫/hr`), L40S (`37.500 ₫/hr`).
- **MB Bank VietQR Generation**: Automatic QR code image generation with exact amount and unique 5-letter transfer reference code.
- **Deposit Limits & Presets**: `50K`, `100K`, `500K`, `1M`, `5M`, `10M` VND (Min `50.000 ₫`, Max `10.000.000 ₫`).

### 3. ⚡ Pay-As-You-Go GPU Lease & Dynamic Runtime Metering
- **Pre-Authorization Threshold**: Estimated duration determines the **Minimum Required Balance** ($Balance \ge HourlyRate \times Hours$). No full upfront fee is deducted.
- **Continuous Live Execution**: Workloads run continuously with a **Live Elapsed Timer** and **Live Accumulating Cost Counter**.
- **Stop & Release GPU**: Terminate at any time; the platform charges only the exact elapsed runtime and frees the GPU node back to `AVAILABLE`.
- **Out-of-Funds Circuit Breaker**: Auto-stops running jobs if wallet balance reaches `0₫` to eliminate overdraft debt.

### 4. 🔐 Authentication, Registration & RBAC
- **User Registration**: Password validation + **+100.000₫ Welcome Promo Bonus** credit.
- **1-Click Quick Demo Buttons**: **`🔑 Đăng Nhập Admin`** and **`👤 Đăng Nhập User`** for instant test evaluations.
- **Role Hierarchy**:
  - `USER`: Clean developer workspace (Admin Console is strictly hidden).
  - `ENGINEER`: Cluster operator with Prometheus metrics and node drainage.
  - `ADMIN`: Super Admin with glowing `👑 SUPER` badge and full governance access.

### 5. 👑 Super Admin Governance Console (4 Power Tabs)
- **🖥️ Tab 1 — Node Governance & Live Pricing Config**: Toggle node maintenance drain and **edit hourly GPU rates in VND live**.
- **👥 Tab 2 — User Management**: Search user directory, promote/demote roles, **add/deduct manual wallet credit (+ / -)**, and ban/unban accounts.
- **⚡ Tab 3 — Global Cluster Jobs**: Monitor all running/queued cluster workloads + emergency **Buộc Dừng Khẩn Cấp (Force Kill)**.
- **💰 Tab 4 — Revenue Analytics**: Real-time platform deposits, compute fees billed, and gross margin breakdown.

---

## 🏗️ Architecture & Project Structure

```text
GPU-Compute-Management-Platform/
├── frontend/                                # React 18 + Vite 6 + Tailwind CSS
│   ├── src/
│   │   ├── i18n.ts                          # i18next configuration & detector
│   │   ├── locales/                         # vi.json & en.json translation dictionaries
│   │   ├── components/layout/               # Shell, Header (VI|EN toggle, VND balance), Sidebar
│   │   ├── pages/
│   │   │   ├── Auth.tsx                     # Login/Register with 1-click demo shortcuts
│   │   │   ├── AdminConsole.tsx             # 4-Tab Super Admin Governance Dashboard
│   │   │   ├── SubmitJob.tsx                # Pay-As-You-Go minimum balance pre-auth form
│   │   │   ├── JobMonitor.tsx               # Live timer, cost accumulator & Stop button
│   │   │   ├── JobsList.tsx                 # Jobs table with Pay-As-You-Go status badges
│   │   │   ├── BillingWallet.tsx            # MB Bank VietQR deposit modal & transaction ledger
│   │   │   ├── Dashboard.tsx                # Cluster telemetry & active jobs
│   │   │   ├── Projects.tsx                 # Multi-tenant AI project workspaces
│   │   │   └── ResourceCluster.tsx          # Cluster node topology & distributed locks
│   │   ├── types/                           # User, Role, TrainingJob, GPUNode, Transaction models
│   │   ├── data/mockData.ts                 # Seeded accounts, cluster nodes, and initial pricing
│   │   └── App.tsx                          # Auth, RBAC guards, and Pay-As-You-Go billing state
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                                 # .NET 9 Microservices + Docker + Kafka + PostgreSQL
│   ├── AIComputePlatform.sln                # Root C# Solution file
│   ├── docker-compose.yml                   # Infrastructure & microservices composition
│   ├── src/
│   │   ├── ApiGateway/                      # Ocelot Gateway with JWT Auth (:5000)
│   │   ├── AuthService/                     # Authentication & JWT Token Management (:5001)
│   │   ├── UserService/                     # User Profiles & Admin Directory (:5002)
│   │   ├── ProjectService/                  # Project Workspaces & Datasets (:5003)
│   │   ├── JobService/                      # Job Scheduling & PAYG Cancellation (:5004)
│   │   ├── ResourceService/                 # GPU Node Allocation & Pricing Engine (:5005)
│   │   ├── PaymentService/                  # Double-Entry Ledger, VietQR & PayOS (:5006)
│   │   ├── WorkerService/                   # Background Kafka Worker & GPU Simulator (:5007)
│   │   └── Shared/                          # Shared Kafka Events, DTOs, & Models
│   └── infra/
│       ├── init-scripts/                    # PostgreSQL init scripts (6 isolated DBs)
│       └── kafka/                           # Topic auto-provisioning
│
├── Phase6_Auth_i18n_PAYG_Admin_Agent_Guide.md # Comprehensive Team & Agent Guide
├── Phase4_Phase5_Agent_Guide.md             # Job Lifecycle & Payment Guide
└── README.md                                # Platform documentation
```

---

## 🔑 Default Test Accounts

| Account | Email | Password | Role | Permissions |
|---|---|---|:---:|---|
| **👑 Super Admin** | `admin@dgx-compute.io` | `Admin@2026!` | `ADMIN` | Full Governance & 4-Tab Admin Console |
| **👤 Developer User** | `developer@ai-cloud.io` | `User@2026!` | `USER` | Standard Workspace (Admin hidden) |
| **🔧 Cluster Engineer** | `duc.tm@nlp-lab.vn` | `Engineer@2026!` | `ENGINEER` | Cluster Operator Access |

---

## 🚀 Getting Started & Installation

### 1. Prerequisites
- **Node.js**: `v18.0.0+` (v20+ recommended)
- **.NET SDK**: `.NET 9.0 SDK`
- **Docker Desktop**: `v24.0.0+`

---

### 2. Frontend Setup (React 18 + Vite)

```bash
# Clone the repository
git clone https://github.com/Vinhnguyen1227/GPU-Compute-Management-Platform.git
cd GPU-Compute-Management-Platform/frontend

# Install dependencies (react-i18next, recharts, lucide-react, tailwindcss)
npm install

# Start local development server (http://localhost:3000)
npm run dev

# Run TypeScript compilation and build production bundle
npm run build
```

---

### 3. Backend Setup (.NET 9 + Docker)

Make sure Docker Desktop is running:

```bash
cd GPU-Compute-Management-Platform/backend

# Option A: Start Infrastructure only (PostgreSQL, Redis, Kafka, Zookeeper)
docker compose up -d postgres redis kafka zookeeper kafka-init

# Option B: Start Full Stack (Infrastructure + All 8 Microservices)
docker compose up --build

# Option C: Build .NET Solution locally
dotnet build AIComputePlatform.sln
```

---

## 🌐 Microservices Port Allocation

| Service | Port | Description |
|---|---|---|
| **Frontend Web App** | `:3000` | React 18 + Vite 6 Dashboard |
| **API Gateway** | `:5000` | Ocelot Gateway with JWT Validation |
| **AuthService** | `:5001` | Auth, Registration, Token Rotation |
| **UserService** | `:5002` | User Profiles & Admin User Directory |
| **ProjectService** | `:5003` | Multi-Tenant Workspaces & Datasets |
| **JobService** | `:5004` | Job Submissions, Scheduling & Logs |
| **ResourceService** | `:5005` | GPU Node Topology & Pricing Config |
| **PaymentService** | `:5006` | Double-Entry Ledger, VietQR & PayOS Webhook |
| **WorkerService** | `:5007` | Kafka Consumer, GPU Simulator & Telemetry |

---

*Authored for the GPU Compute Management Platform Team • 2026*
