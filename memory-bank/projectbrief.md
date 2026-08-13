# Project Brief: AI Compute Cloud Platform (Mini DGX Cloud)

## Core Requirements & Scope
- Production-grade distributed AI compute orchestration platform inspired by NVIDIA DGX Cloud, AWS SageMaker, and Google Cloud AI.
- Full-stack system architecture combining .NET microservices (Gateway, Auth, User, Payment, Wallet, Billing, Worker) and Java Spring Boot microservices (Job Scheduler, Resource Manager, Project Service).
- High-density, state-of-the-art frontend web interface for managing AI jobs, monitoring GPU cluster telemetry, streaming live job logs, and managing deposit wallets with VietQR/VNPay integration.

## Goals & Constraints
- Support multi-role access (USER, ADMIN, ENGINEER).
- Provide real-time GPU cluster visualization (NVIDIA A100, RTX 4090).
- Deliver interactive terminal emulator & telemetry charts for job execution.
- Maintain high token efficiency (Caveman mode) & ADK Memory Bank lifecycle sync across development sessions.
