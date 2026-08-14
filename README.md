# 🚀 GPU Compute Management Platform

A high-performance, modern web application and microservices platform for managing distributed GPU clusters, submitting deep learning training jobs, monitoring real-time metrics, managing billing & wallet transactions, and organizing multi-tenant workspace projects.

---

## 📁 Project Structure

```text
GPU-Compute-Management-Platform/
├── frontend/                       # Frontend React Application (React + Vite + TS + Tailwind)
│   ├── public/                     # Static assets
│   ├── src/
│   │   ├── components/             # Reusable UI Components (Cards, Modals, Shell, Navigation)
│   │   ├── data/                   # Mock Data & Telemetry fallbacks
│   │   ├── pages/                  # Application Pages (Dashboard, Jobs, Wallet, Admin, etc.)
│   │   └── types/                  # TypeScript Data Models & Response Shapes
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                        # Backend Microservices (.NET 9 + Docker + Kafka + PostgreSQL)
│   ├── AIComputePlatform.sln       # Root C# Solution file
│   ├── docker-compose.yml          # Local infrastructure & service stack composition
│   ├── docker-compose.override.yml # Local development environment overrides
│   ├── .env.example                # Template for environment secrets & ports
│   │
│   ├── src/
│   │   ├── ApiGateway/             # Ocelot API Gateway (:5000)
│   │   ├── AuthService/            # Authentication & JWT Token Management (:5001)
│   │   ├── UserService/            # User Profiles & Account Management (:5002)
│   │   ├── ProjectService/         # Project Workspaces & Datasets (:5003)
│   │   ├── JobService/             # Job Submissions & Log Streaming (:5004)
│   │   ├── ResourceService/        # GPU Node Allocation & Cluster Metrics (:5005)
│   │   ├── PaymentService/         # Wallet, VietQR/VNPay Sandbox & Billing Engine (:5006)
│   │   ├── WorkerService/          # Background Kafka Worker & GPU Simulator (:5007)
│   │   └── Shared/                 # Shared Event DTOs, Kafka wrappers, & Models
│   │
│   └── infra/
│       ├── init-scripts/           # PostgreSQL DB init scripts (6 isolated databases)
│       └── kafka/                  # Kafka topic auto-creation script
│
├── memory-bank/                    # ADK Memory Bank & system design specs
├── Backend_Coding_Agent_Guide.md   # Architectural reference guide
└── README.md                       # Documentation overview
```

---

## 💻 Tech Stack & Dependencies

### Frontend Stack & Libraries (`frontend/package.json`)

All frontend packages are automatically managed via `npm install` inside the `frontend/` folder:

| Package | Version | Category | Purpose |
| :--- | :--- | :--- | :--- |
| **`react`** | `^18.3.1` | Core Framework | UI component rendering engine |
| **`react-dom`** | `^18.3.1` | Core Framework | DOM rendering adapter |
| **`lucide-react`** | `^0.468.0` | UI Icons | NVIDIA DGX themed icons & action controls |
| **`recharts`** | `^2.15.0` | Analytics | Real-time GPU telemetry, temperature, & cost trend charts |
| **`clsx`** | `^2.1.1` | UI Utility | Conditional classname concatenation |
| **`tailwind-merge`** | `^2.5.5` | UI Utility | Conflict-free Tailwind CSS class merging |
| **`vite`** | `^6.0.3` | Build Tool | Next-gen dev server & lightning-fast bundler |
| **`typescript`** | `^5.6.3` | Type System | Type safety & IDE autocomplete |
| **`tailwindcss`** | `^3.4.16` | Styling Engine | Utility-first glassmorphism design system |
| **`postcss` & `autoprefixer`** | `^8.4.49` / `^10.4.20` | CSS Processor | Vendor prefixing & CSS transformation |

---

### Backend Stack & Infrastructure (.NET 9 + Docker)
- **Framework:** .NET 9 ASP.NET Core Web API
- **API Gateway:** Ocelot Gateway
- **Databases:** PostgreSQL 16 (6 isolated per-service databases)
- **Cache & Locks:** Redis 7
- **Message Broker:** Apache Kafka 3.7 + Zookeeper 2181
- **Containerization:** Docker & Docker Compose

---

## ⚡ System Prerequisites

Before running the platform, ensure the following tools are installed on your machine:

| Requirement | Minimum Version | Installation Guide / Command |
| :--- | :--- | :--- |
| **Node.js** | `v18.0.0+` (v20+ recommended) | [nodejs.org](https://nodejs.org/) or `winget install OpenJS.NodeJS` |
| **npm** | `v9.0.0+` | Included automatically with Node.js |
| **.NET SDK** | `.NET 9.0 SDK` | [dotnet.microsoft.com](https://dotnet.microsoft.com/) or `winget install Microsoft.DotNet.SDK.9` |
| **Docker Desktop** | `v24.0.0+` | [docker.com](https://www.docker.com/products/docker-desktop/) |

---

## 🚀 Getting Started & Installation Guide

### 1. Clone the Repository
```bash
git clone https://github.com/Vinhnguyen1227/GPU-Compute-Management-Platform.git
cd GPU-Compute-Management-Platform
```

---

### 2. Frontend Installation & Setup Guide

To install all frontend dependencies (`react`, `recharts`, `lucide-react`, `tailwindcss`, `vite`, etc.):

```bash
# Navigate to the frontend directory
cd frontend

# Install all npm dependencies listed in package.json
npm install
```

#### Running & Building the Frontend:
```bash
# Start local development server (with hot reload at http://localhost:3000 or :5173)
npm run dev

# Run TypeScript check & build production assets to dist/
npm run build

# Preview production build locally
npm run preview

# Run ESLint linter across source files
npm run lint
```

> [!TIP]
> **Troubleshooting Clean Install:** If you experience any dependency mismatch or node module caching issues, run:
> ```bash
> rm -rf node_modules package-lock.json
> npm install
> ```

---

### 3. Backend Setup Guide (.NET 9 + Docker)

Make sure **Docker Desktop** is running on your computer.

```bash
cd backend

# Option A: Start Infrastructure services only (PostgreSQL, Redis, Kafka, Zookeeper)
docker compose up -d postgres redis kafka zookeeper kafka-init

# Option B: Start Full Backend Stack (Infrastructure + All 8 Microservices)
docker compose up --build
```

#### Building Backend C# Solution Locally (Outside Docker):
```bash
cd backend
dotnet build AIComputePlatform.sln
```
