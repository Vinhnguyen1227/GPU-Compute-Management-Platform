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

## 💻 Tech Stack & Architecture

### Frontend
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite 6
- **Styling & UI:** Tailwind CSS v3, Custom NVIDIA DGX Glassmorphism Theme
- **Icons:** Lucide React (`lucide-react`)
- **Data Visualization:** Recharts (`recharts`)

### Backend
- **Framework:** .NET 9 ASP.NET Core Web API
- **API Gateway:** Ocelot Gateway
- **Databases:** PostgreSQL 16 (6 isolated per-service databases)
- **Cache & Locks:** Redis 7
- **Message Broker:** Apache Kafka 3.7 + Zookeeper 2181
- **Containerization:** Docker & Docker Compose

---

## 🖥️ Pages & Features Breakdown

| Page | Path | Key Functionalities & Features |
| :--- | :--- | :--- |
| **Authentication** | `Auth` | Login and register portal with JWT token authentication. |
| **Dashboard** | `/dashboard` | Main overview displaying active cluster health, GPU usage, active jobs, balance metrics, and cost trends. |
| **Projects & Workspaces** | `/projects` | Manage user projects/workspaces, search & filter projects, and create new compute projects. |
| **Project Detail** | `/projects/:id` | View workspace details, total spend, resource allocation, and associated training jobs. |
| **Jobs List** | `/jobs` | Comprehensive list of training jobs (`QUEUED`, `RUNNING`, `COMPLETED`, `FAILED`). |
| **Submit Job** | `/jobs/new` | Multi-step job wizard: Select PyTorch/TensorFlow framework, hardware specs (H100/A100/RTX4090), and cost calculator. |
| **Job Monitor** | `/jobs/:id` | Real-time monitoring of running jobs with GPU memory utilization, temperature metrics, and live streaming logs. |
| **Resource Cluster** | `/resources` | View GPU node cluster topology, node availability, memory capacity, and hardware specs. |
| **Billing & Wallet** | `/billing` | Wallet balance top-up supporting VietQR and VNPay sandbox payment gateways with transaction history. |
| **Admin Console** | `/admin` | Infrastructure panel for toggling node maintenance modes and cluster controls. |

---

## ⚡ Prerequisites & System Dependencies

Before running the platform, ensure the following dependencies are installed on your system:

| Dependency | Required Version | Purpose | Installation Guide / Command |
| :--- | :--- | :--- | :--- |
| **Node.js** | `v18.0.0+` (v20+ recommended) | Frontend runtime environment | [nodejs.org](https://nodejs.org/) or `winget install OpenJS.NodeJS` |
| **npm** | `v9.0.0+` | Package manager for frontend dependencies | Bundled with Node.js |
| **.NET SDK** | `.NET 9.0 SDK` | Backend C# microservices compilation & runtime | [dotnet.microsoft.com](https://dotnet.microsoft.com/) or `winget install Microsoft.DotNet.SDK.9` |
| **Docker Desktop** | `v24.0.0+` | Container runtime for PostgreSQL, Redis, Kafka, & Services | [docker.com](https://www.docker.com/products/docker-desktop/) |
| **PowerShell / Bash** | Modern shell | Terminal execution environment | Built-in on Windows / Linux / macOS |

---

## 🚀 Getting Started & Local Setup

### 1. Clone the Repository
```bash
git clone https://github.com/Vinhnguyen1227/GPU-Compute-Management-Platform.git
cd GPU-Compute-Management-Platform
```

### 2. Run the Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) (or `http://localhost:5173`) in your browser.

### 3. Run the Backend Infrastructure & Microservices (.NET 9 + Docker)
Make sure **Docker Desktop** is running.

```bash
cd backend

# Option A: Start Infrastructure only (PostgreSQL, Redis, Kafka, Zookeeper) for local C# debugging
docker compose up -d postgres redis kafka zookeeper kafka-init

# Option B: Start Full Backend Stack (Infrastructure + All 8 Microservices)
docker compose up --build
```

#### Build Backend Solution Locally (Outside Docker):
```bash
cd backend
dotnet build AIComputePlatform.sln
```

---

## 🛠️ Project Scripts & Verification

- **`cd frontend && npm run dev`**: Start frontend development server.
- **`cd frontend && npm run build`**: Production build of frontend app.
- **`cd backend && dotnet build AIComputePlatform.sln`**: Compile all 9 C# backend projects.
- **`cd backend && docker compose up --build`**: Spin up containerized microservices and databases.
