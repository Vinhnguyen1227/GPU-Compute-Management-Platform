# 🚀 GPU Compute Management Platform

A high-performance, modern web application for managing distributed GPU clusters, submitting deep learning training jobs, monitoring real-time metrics, managing billing & wallet transactions, and organizing multi-tenant workspace projects.

---

## 📁 Project Structure

```text
GPU-Compute-Management-Platform/
├── frontend/                       # Frontend React Application
│   ├── public/                     # Static assets
│   ├── src/
│   │   ├── components/             # Reusable UI Components
│   │   │   ├── common/             # Cards, Badges, Modals, Buttons, Inputs
│   │   │   └── layout/             # Shell, Sidebar, Header, Navigation
│   │   ├── data/                   # Mock Data (Clusters, Jobs, Users, Transactions)
│   │   ├── pages/                  # Application Pages / Views
│   │   │   ├── AdminConsole.tsx    # Node maintenance & admin controls
│   │   │   ├── Auth.tsx            # Sign in / Register view
│   │   │   ├── BillingWallet.tsx   # Top-up wallet & transaction history
│   │   │   ├── Dashboard.tsx       # Main analytics & cluster stats overview
│   │   │   ├── JobMonitor.tsx      # Real-time metrics & container logs
│   │   │   ├── JobsList.tsx        # Filterable training jobs table
│   │   │   ├── ProjectDetail.tsx   # Detailed project details & associated jobs
│   │   │   ├── Projects.tsx        # Workspaces and project management
│   │   │   ├── ResourceCluster.tsx # GPU Cluster nodes status & specs
│   │   │   └── SubmitJob.tsx       # Multi-step job submission workflow
│   │   ├── types/                  # TypeScript Data Models & Type Interfaces
│   │   ├── App.tsx                 # Root Router & Global State Management
│   │   ├── main.tsx                # React DOM render entry point
│   │   └── index.css               # Global Tailwind CSS imports & custom styles
│   ├── index.html                  # HTML entry template
│   ├── package.json                # Project dependencies and scripts
│   ├── postcss.config.js           # PostCSS configuration
│   ├── tailwind.config.js          # Tailwind CSS design system theme configuration
│   ├── tsconfig.json               # TypeScript compiler config
│   └── vite.config.ts              # Vite bundle configuration
├── memory-bank/                    # Context memory & system design specs
├── AI_Compute_Cloud_Platform_Coding_Agent_Guide.md
├── Idea (1).md                     # Product requirements & feature roadmap
└── README.md                       # Documentation overview (This file)
```

---

## 💻 Tech Stack & Architecture

- **Core Framework:** React 18 with TypeScript
- **Build Tool:** Vite 6
- **Styling & UI:** Tailwind CSS v3, Custom Glassmorphism Theme
- **Icons:** Lucide React (`lucide-react`)
- **Data Visualization:** Recharts (`recharts`)

---

## 🖥️ Pages & Features Breakdown

| Page | Path | Key Functionalities & Features |
| :--- | :--- | :--- |
| **Authentication** | `Auth` | Login and register portal with password visibility toggles and mock authentication setup. |
| **Dashboard** | `/dashboard` | Main overview displaying active cluster health, total GPU usage, active jobs, balance metrics, cost trends, and quick access actions. |
| **Projects & Workspaces** | `/projects` | Manage user projects/workspaces, search & filter projects, and create new compute projects with custom budgets. |
| **Project Detail** | `/projects/:id` | View detailed workspace information, total spend, resource allocation, and associated training jobs. |
| **Jobs List** | `/jobs` | Comprehensive list of training jobs across states (`QUEUED`, `RUNNING`, `COMPLETED`, `FAILED`), with search, filtering, and duration metrics. |
| **Submit Job** | `/jobs/new` | Multi-step job configuration wizard: Select PyTorch/TensorFlow framework, docker container image, compute hardware specs (NVIDIA H100/A100/RTX4090), node quantity, estimation cost calculator, and pre-authorization validation. |
| **Job Monitor** | `/jobs/:id` | Real-time monitoring of running jobs with GPU memory utilization charts, temperature metrics, live streaming stdout/stderr container logs, checkpoint management, and job cancellation. |
| **Resource Cluster** | `/resources` | View GPU node cluster topology, node availability, memory capacity, architecture details, and node status. |
| **Billing & Wallet** | `/billing` | Wallet balance top-up supporting VietQR, VNPay, and MoMo gateways, with full transaction history and deposit reference tracking. |
| **Admin Console** | `/admin` | Infrastructure administration panel for toggling node maintenance modes, inspecting system logs, and cluster node controls. |

---

## ⚡ Getting Started & Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- [npm](https://www.npmjs.com/) or `yarn`

### Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Vinhnguyen1227/GPU-Compute-Management-Platform.git
   cd GPU-Compute-Management-Platform
   ```

2. **Navigate into the frontend directory:**
   ```bash
   cd frontend
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173` to explore the application!

---

## 🛠️ Build & Scripts

- **`npm run dev`**: Start the Vite local development server.
- **`npm run build`**: Compile TypeScript and produce production build bundle in `dist/`.
- **`npm run preview`**: Locally preview the production build.
- **`npm run lint`**: Execute ESLint checks across source code.
