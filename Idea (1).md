If you are applying for a **Junior Backend Developer** role, you do **not** need to build a Google/NVIDIA-scale system. What you need is a project that **demonstrates you understand how large systems are designed**: APIs, databases, distributed systems, messaging, caching, authentication, observability, deployment, testing, and cloud.

A good portfolio project should make an interviewer think:

> "This candidate is junior, but they understand production backend engineering."

I will suggest a project that is ambitious enough to show **Google/NVIDIA-level engineering concepts**, but realistic enough for one developer.

# Project Idea: **AI Compute Cloud Platform (Mini NVIDIA DGX Cloud)**

## Topic

### **GPU Compute Management Platform**

A cloud platform where users can:

* Register accounts
* Submit AI workloads
* Request GPU resources
* Upload models/datasets
* Run training jobs
* Monitor job status
* Receive results
* Pay based on resource usage

Think:

* Mini NVIDIA DGX Cloud
* Mini Google Kubernetes Engine
* Mini AWS SageMaker

The project demonstrates:

* Distributed systems
* Microservices
* Cloud architecture
* Job scheduling
* Event-driven architecture
* AI infrastructure concepts

This is much stronger than a normal CRUD project.

---

# High-Level Architecture

```text
                    Client
                      |
                      |
              API Gateway
                      |
        ----------------------------
        |            |             |
   Auth Service  User Service  Project Service
        |
        |
 -------------------------------
 |             |                |
Job Service  Resource Service  Billing Service
 |
 |
Message Broker
(Kafka/RabbitMQ)
 |
 |
Worker Services
 |
 |
GPU Simulator Nodes
 |
 |
Storage + Database
Monitoring:
Prometheus
Grafana
ELK
OpenTelemetry
```

---

# Technology Stack

## Backend

You want both .NET and Java.

Use both intentionally.

## .NET Side

Use:

### ASP.NET Core 9 Web API

For:

* API Gateway
* Authentication
* User management
* Billing

Why?

Because .NET is excellent for:

* enterprise backend
* high performance APIs
* cloud systems

Libraries:

```csharp
ASP.NET Core
Entity Framework Core
IdentityServer
MediatR
FluentValidation
AutoMapper
Serilog
Hangfire
```

---

## Java Side

Use:

### Spring Boot 3

For:

* Job Scheduler
* Resource Manager
* Worker services

Libraries:

```java
Spring Boot
Spring Cloud
Spring Security
Hibernate
Kafka Client
Resilience4j
MapStruct
```

Why?

Because Java dominates:

* distributed systems
* big data
* cloud infrastructure

---

# Frontend

You only need enough UI.

Use:

```text
React
TypeScript
Tailwind CSS
```

Pages:

```text
Login
Dashboard
Projects
Submit Job
Job Monitoring
Resource Usage
Billing
```

---

# Database Architecture

Do NOT put everything in one database.

Use database per service.

---

## User Service

Database:

PostgreSQL

Tables:

```text
Users
Id
Email
PasswordHash
Role
CreatedAt
```

---

## Project Service

PostgreSQL

```text
Projects
Id
UserId
Name
Description
CreatedAt
```

---

## Job Service

PostgreSQL

```text
Jobs
Id
ProjectId
Status
CreatedAt
StartedAt
CompletedAt
GPURequired
```

Status:

```text
CREATED
QUEUED
RUNNING
FAILED
COMPLETED
```

---

## Resource Service

PostgreSQL

```text
GPU_NODES
Id
Name
GPUType
Memory
Status
CurrentJob
```

Example:

```text
GPU-001
NVIDIA A100
80GB
AVAILABLE
```

---

# Microservices Design

## 1. API Gateway

Technology:

.NET

Responsibilities:

* routing
* authentication
* rate limiting
* request logging

Example:

```text
POST
/api/jobs
Gateway
        |
        |
Job Service
```

---

### 2. Authentication Service

.NET

Features:

* JWT authentication
* refresh tokens
* OAuth login

Example:

Login:

```http
POST /auth/login
Response:
{
 accessToken:
 refreshToken:
}
```

---

### 3. User Service

.NET

Responsibilities:

* users
* roles
* permissions

Roles:

```text
USER
ADMIN
ENGINEER
```

---

### 4. Project Service

Java

Responsibilities:

Manage AI projects.

Example:

Create project:

```http
POST /projects
{
"name":"Llama Training",
"description":"Fine tuning model"
}
```

---

### 5. Job Scheduler Service ⭐ Important

Java

This is your strongest backend component.

Similar to:

* Kubernetes scheduler
* Slurm scheduler

Responsibilities:

Receive:

```text
Train model
Need:
GPU:
A100
Memory:
40GB
Duration:
5 hours
```

Then:

Find available GPU.

Example:

Available:

```text
GPU-01
A100
80GB
```

Assign:

```text
Job 1001
running on GPU-01
```

Algorithm:

Simple version:

```text
1. Get pending jobs
2. Get available GPUs
3. Match requirement
4. Assign job
5. Publish event
```

Advanced:

Priority scheduling:

```text
Enterprise customer
        |
        |
High priority
Free user
        |
        |
Low priority
```

---

### 6. Resource Management Service

Java

Manages GPU nodes.

Example:

GPU heartbeat:

```text
GPU01
CPU 40%
Memory 70%
Temperature 55C
Status AVAILABLE
```

Like NVIDIA monitoring.

---

### 7. Worker Service

.NET Worker Service

Simulates GPU execution.

Example:

Receive:

Kafka message:

```text
START_JOB
{
jobId:123,
gpu:"A100"
}
```

Then:

```text
Running training...
20%
40%
80%
100%
Finished
```

Update database.

---

### 8. Billing Service

.NET

Calculate:

```text
GPU usage
+
Storage
+
Runtime
```

Example:

A100:

```text
$2/hour
Job:
5 hours
Cost:
$10
```

---

# Event Driven Architecture

Use Kafka.

Flow:

```text
User submits job
       |
       v
Job Service
       |
       |
Kafka Topic:
job.created
       |
       |
Scheduler
       |
       |
Kafka:
job.assigned
       |
Worker
       |
job.completed
```

Kafka topics:

```text
job.created
job.started
job.completed
resource.updated
payment.created
```

---

# Caching

Use Redis.

Examples:

## User sessions

```text
JWT blacklist
```

## GPU availability

Instead of:

```sql
SELECT *
FROM GPU
WHERE status='AVAILABLE'
```

Use:

Redis:

```text
available_gpu:A100
[
GPU01,
GPU02
]
```

---

# API Documentation

Every service:

Use:

```text
Swagger/OpenAPI
```

Example:

```http
GET
/api/jobs/{id}
Response:
{
 id:1,
 status:"RUNNING",
 gpu:"A100",
 progress:60
}
```

---

# Security

Implement:

## JWT

```text
Access Token
15 minutes
```

## Refresh Token

```text
30 days
```

## Role Authorization

Example:

Only ADMIN:

```text
DELETE GPU node
```

---

# Testing Strategy

This is where many juniors fail.

Implement:

## Unit Tests

.NET:

```csharp
xUnit
Moq
```

Java:

```java
JUnit
Mockito
```

Example:

Scheduler:

Test:

```text
Given:
GPU available
When:
job submitted
Then:
GPU assigned
```

---

## Integration Test

Use:

```text
Testcontainers
```

Start:

```text
PostgreSQL
Kafka
Redis
```

Automatically.

---

# DevOps

## Docker

Every service:

```dockerfile
Dockerfile
```

Example:

```text
gateway
user-service
job-service
scheduler
worker
```

---

## Docker Compose

Local environment:

```yaml
docker-compose.yml
services:
postgres
kafka
redis
gateway
scheduler
worker
```

---

# Kubernetes Deployment

This is a huge plus.

Deploy:

```text
Namespace:
ai-cloud
Pods:
gateway
user-service
scheduler
worker
Services:
ClusterIP
Ingress
```

---

# CI/CD

Use:

GitHub Actions

Pipeline:

```text
git push
        |
Run tests
        |
Build Docker images
        |
Push Docker Hub
        |
Deploy Kubernetes
```

---

# Observability

Very important for senior-level impression.

## Logging

Use:

.NET:

```csharp
Serilog
```

Java:

```text
Logback
```

Centralize:

```text
ELK Stack
ElasticSearch
Logstash
Kibana
```

---

## Metrics

Prometheus:

Track:

```text
Number of jobs
Average execution time
API latency
Failed jobs
GPU utilization
```

Grafana dashboard:

Example:

```text
======================
GPU Usage
A100
75%
Jobs Running
23
Failed Jobs
2
======================
```

---

# Project MVP (First 8 Weeks)

Do not build everything immediately.

### Phase 1: Foundation (Week 1)

Build:

* Git repository
* Docker environment
* PostgreSQL
* Authentication

Deliver:

```text
User can register/login
```

---

### Phase 2: Core Backend (Week 2-3)

Build:

User Service

Project Service

Job Service

Features:

```text
Create project
Submit job
View jobs
```

---

### Phase 3: Scheduler (Week 4)

Implement:

GPU simulation

Example:

```text
GPU Pool:
A100-1
A100-2
RTX4090
Scheduler assigns jobs.
```

---

### Phase 4: Event System (Week 5)

Add:

Kafka

Events:

```text
job.created
job.started
job.finished
```

---

### Phase 5: Worker System (Week 6)

Create workers:

```text
Worker-1
Worker-2
```

Execute jobs.

---

### Phase 6: Production Features (Week 7)

Add:

* Redis
* Rate limiting
* Monitoring
* Logs

---

### Phase 7: Cloud Deployment (Week 8)

Deploy:

Option 1:

AWS

```text
EKS
RDS
Elasticache
```

Option 2:

Azure

```text
AKS
Azure Database
Redis Cache
```

---

# GitHub Repository Structure

```text
ai-compute-platform/
├── backend/
│   ├── dotnet/
│   │   ├── gateway/
│   │   ├── auth-service/
│   │   ├── user-service/
│   │   ├── billing-service/
│   │   └── worker-service/
│   └── java/
│       ├── project-service/
│       ├── scheduler-service/
│       └── resource-service/
├── frontend/
├── infra/
│   ├── docker/
│   └── kubernetes/
└── docs/
    ├── architecture.md
    ├── api-design.md
    └── database-design.md
```

---

# Extra Features That Impress Big Tech Interviewers

## 1. Distributed Lock

Problem:

Two schedulers assign same GPU.

Solution:

Redis Distributed Lock.

---

## 2. Retry Mechanism

Using:

Kafka retry topic

Example:

```text
job.failed
retry after 5 minutes
```

---

## 3. Circuit Breaker

Using:

Resilience4j

Example:

Billing service down:

```text
Scheduler continues working
```

---

## 4. API Rate Limiting

Example:

Free users:

```text
10 jobs/day
```

---

## 5. Real AI Integration

Add:

Python worker:

```text
PyTorch
CUDA simulation
```

Flow:

```text
Java Scheduler
      |
Python AI Worker
      |
Model training
```

---

# Resume Description

You can write:

> Designed and developed a distributed AI compute orchestration platform inspired by NVIDIA DGX Cloud, implementing microservices architecture using ASP.NET Core and Spring Boot. Built event-driven job scheduling with Kafka, resource allocation algorithms, Docker/Kubernetes deployment, Redis caching, PostgreSQL service isolation, and observability using Prometheus/Grafana.

This single project can demonstrate:

✅ .NET backend
✅ Java backend
✅ Microservices
✅ Distributed systems
✅ Cloud engineering
✅ DevOps
✅ System design
✅ Database design
✅ Event-driven architecture

For a **Junior Backend Developer**, this is already far above the average portfolio level.

---

# Concurrency & Production Backend Engineering

Yes. This is exactly the kind of question that separates a **CRUD backend developer** from someone who understands **production backend engineering**.

For your AI Compute Cloud Platform (mini NVIDIA DGX Cloud), concurrency and high traffic are actually some of the most interesting engineering problems. A production system must handle:

* Thousands/millions of API requests
* Many users submitting jobs simultaneously
* Many workers processing jobs
* Payment events arriving at the same time
* Resource allocation conflicts
* Database bottlenecks
* Failures and recovery

Let's extend the design with production concerns.

---

## 1. The Most Dangerous Problem: Race Conditions

### Example: GPU Allocation

Imagine you have:

```text
GPU-A100-01
Status: AVAILABLE
```

Two users submit jobs at exactly the same time.

```text
User A                 User B
Submit Job             Submit Job
     |                    |
 Scheduler            Scheduler
     |                    |
Check GPU available
     |                    |
    YES                  YES
     |                    |
Assign GPU           Assign GPU
```

Now:

```text
GPU-A100-01
Running Job A
Running Job B
```

Impossible. You have over-allocated a GPU.

---

### Solution 1: Database Transaction + Row Lock

PostgreSQL example:

```sql
BEGIN;

SELECT *
FROM gpu_nodes
WHERE id='A100-01'
AND status='AVAILABLE'
FOR UPDATE;

UPDATE gpu_nodes
SET status='BUSY'
WHERE id='A100-01';

COMMIT;
```

`FOR UPDATE` means:
> "Only one transaction can modify this row at a time."

Flow:

```text
Scheduler A
Locks GPU
    |
Scheduler B
waits
    |
Scheduler A
Assigns job
    |
Scheduler B
Checks again -> GPU unavailable
```

---

### Solution 2: Distributed Lock (Redis)

When you have multiple scheduler instances:

```text
Scheduler 1 ----> Redis Lock ----> GPU-A100-01
                     ^
Scheduler 2 ---------| (Cannot access)
```

Example:

```text
SET gpu:A100-01 LOCKED NX EX 30
```

Meaning:
* `NX` = only create if not exists
* `EX` = expire after 30 seconds

Used by payment systems, inventory systems, and booking systems.

---

## 2. Database Scaling Problems

At small scale: `API -> PostgreSQL` works.

At high traffic (10,000 requests/sec), single PostgreSQL CPU hits 100%.

### Solution: Read/Write Separation

```text
              Application
                   |
          -------------------
          |                 |
      Write DB         Read Replica
    (Primary DB)      (Read-Only DB)
```

* **Write**: `INSERT INTO jobs` goes to Primary DB.
* **Read**: `SELECT * FROM jobs` goes to Read Replica.

---

## 3. Connection Pooling

A common production mistake: opening and closing a database connection for every request is very expensive.

Use Connection Pooling:

```text
Application ---> Connection Pool [conn 1, conn 2, conn 3] ---> PostgreSQL
```

* **.NET**: `MaxPoolSize=100`
* **Java (HikariCP)**: `spring.datasource.hikari.maximum-pool-size=100`

---

## 4. Payment Concurrency & Idempotency

Payment concurrency is more dangerous than GPU scheduling.

Example: User pays 500,000 VND. Bank sends "Payment Success" webhook twice.
Without protection, balance becomes +1,000,000 VND.

### Solution: Idempotency

Every payment has a unique `transaction_id` (`TX123456`).

Database table:
```sql
PaymentTransaction (
    id UNIQUE,
    external_id UNIQUE,
    status
)
```

* **First request**: `TX123` -> Processed -> `SUCCESS`.
* **Second request**: `TX123` -> Already exists -> Ignore.

---

## 5. Message Queue for Traffic Spikes

Avoid synchronous processing: `User -> API -> Process Immediately -> GPU` dies under 10,000 requests.

Use Message Queue (Kafka):

```text
User -> API -> Kafka (Job Queue) -> Workers
```

API response:
```json
{
  "jobId": 123,
  "status": "QUEUED"
}
```
The user does not wait.

---

## 6. Back Pressure

When GPU workers handle 100 jobs/hour, but users submit 10,000 jobs/hour:

### Queue Limit & Rejection
Set Kafka max queue size (e.g. 100,000 jobs). When full, return `503 Service Unavailable` (Try later).

---

## 7. Rate Limiting

Protect APIs from abuse:
* **Free User**: 100 requests/minute
* **Enterprise**: 10,000 requests/minute

API Gateway checks Redis counter before allowing/denying requests.
* **.NET**: `AspNetCoreRateLimit`
* **Cloud/Gateway**: Kong, NGINX, AWS API Gateway

---

## 8. Horizontal Scaling

Never depend on a single server instance.

```text
             Load Balancer
                   |
       -------------------------
       |           |           |
    API-1        API-2       API-3
```

Kubernetes config: `replicas: 5`

---

## 9. Stateless Services

Your API should not store user state in memory. Use **JWT Token + Redis** so any server instance can handle any incoming request.

---

## 10. Distributed Transaction & Saga Pattern

When user submits GPU job:
1. Create job
2. Reserve GPU
3. Deduct money

If step 3 fails, DB is inconsistent. Do **not** use traditional DB transactions across microservices. Use the **Saga Pattern**:

```text
Job Created -> Reserve GPU -> Charge Wallet -> Start Training
                                  | (Fails)
                                  v
                       Release GPU & Cancel Job (Compensation Event)
```

---

## 11. Monitoring Production

Track key metrics using **Prometheus + Grafana**:
* API latency
* Requests/sec
* Error rate
* Database connection pool status
* Kafka consumer lag
* CPU / Memory / GPU utilization

---

## 12. Structured Logging

Never use `Console.WriteLine()`. Use structured logging:
* **.NET**: Serilog
* **Java**: Logback
* **Centralized**: ELK Stack (ElasticSearch + Logstash + Kibana)

```json
{
  "service": "scheduler",
  "jobId": 123,
  "gpu": "A100",
  "duration": 200
}
```

---

## 13. Distributed Tracing

Use **OpenTelemetry + Jaeger** to trace requests across microservices and find latency bottlenecks:

```text
Request ID: abc-123
Gateway (10ms) -> Job Service (30ms) -> Kafka (200ms) -> Scheduler (50ms)
```

---

## 14. Disaster Recovery

* **Backup**: Daily backup + Point-in-time recovery (PITR).
* **Multi-Zone**: Deploy across multiple Cloud Availability Zones (Zone A API, Zone B DB, Zone C Workers).

---

## 15. Security Production Concerns

* **Secrets**: Never hardcode passwords in `appsettings.json`. Use AWS Secrets Manager, Azure Key Vault, or HashiCorp Vault.
* **API Security**: HTTPS, JWT expiration, refresh token rotation, CORS, SQL injection protection, input validation.

---

## 16. Cost Control

Automatic timeouts: If a GPU job stays idle with no activity for 30 minutes, automatically stop the GPU to prevent unnecessary cloud costs.

---

# Complete Production Architecture

```text
                 CDN
                  |
             Load Balancer
                  |
          API Gateway Cluster
                  |
 ---------------------------------------------------
 |          |          |          |                |
Auth    Job       Billing    Payment        Resource
                  |
              Kafka Cluster
                  |
        -------------------------
        |           |           |
    Scheduler    Worker     Metering
                  |
        -------------------------
        |           |           |
    PostgreSQL    Redis      S3 Storage

Monitoring: Prometheus | Grafana | OpenTelemetry | ELK
```

---

# Production Feature Priority Matrix

| Priority | Feature |
| :--- | :--- |
| ⭐⭐⭐⭐⭐ | Kafka async processing |
| ⭐⭐⭐⭐⭐ | Redis distributed lock |
| ⭐⭐⭐⭐⭐ | Database transaction handling |
| ⭐⭐⭐⭐⭐ | Idempotent payment API |
| ⭐⭐⭐⭐ | Docker + Kubernetes |
| ⭐⭐⭐⭐ | Rate limiting |
| ⭐⭐⭐⭐ | Monitoring dashboard |
| ⭐⭐⭐⭐ | OpenTelemetry tracing |
| ⭐⭐⭐ | Database read replicas |
| ⭐⭐⭐ | Saga pattern |

---

# Cloud Billing & Payment System

Yes. Adding a **payment and transaction system** makes the architecture much closer to a real cloud platform like AWS, Google Cloud, or NVIDIA DGX Cloud.

Do **not** directly handle raw bank money movement. Integrate with a **payment gateway** and maintain an internal **billing ledger**.

---

## Payment Microservices Architecture

```text
                    User
                     |
               API Gateway
                     |
        ----------------------------------
        |                |               |
   Auth Service   Compute Service   Payment Service
                                         |
                                  Payment Gateway
                                         |
                                   Bank / Wallet

Compute Usage -> Usage Metering Service -> Billing Service -> Transaction Database
```

---

## New Payment Microservices

### 1. Wallet Service (.NET)
Manages user balance (VND / USD).

```sql
CREATE TABLE Wallet (
    Id UUID PRIMARY KEY,
    UserId UUID NOT NULL,
    Balance DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    Currency VARCHAR(10) NOT NULL DEFAULT 'VND',
    CreatedAt TIMESTAMP NOT NULL,
    UpdatedAt TIMESTAMP NOT NULL
);
```

---

### 2. Payment Service (.NET)
Responsible for:
* Creating payment requests
* Generating QR codes (VietQR / VNPay / MoMo / ZaloPay)
* Receiving payment callbacks (webhooks)
* Verifying transaction signatures

Flow:
```text
User -> Payment Service -> Generate QR -> User Scans -> Bank -> Gateway Callback -> Increase Wallet Balance
```

---

### 3. Payment Transaction Table

```sql
CREATE TABLE PaymentTransaction (
    Id UUID PRIMARY KEY,
    UserId UUID NOT NULL,
    TransactionType VARCHAR(50) NOT NULL, -- DEPOSIT, GPU_USAGE, REFUND
    Amount DECIMAL(18, 2) NOT NULL,
    Status VARCHAR(20) NOT NULL,          -- PENDING, SUCCESS, FAILED
    PaymentMethod VARCHAR(50),
    ReferenceCode VARCHAR(100) UNIQUE,
    CreatedAt TIMESTAMP NOT NULL
);
```

Example Data:

| ID | Type | Amount | Status |
| :--- | :--- | :--- | :--- |
| 001 | DEPOSIT | +200,000 VND | SUCCESS |
| 002 | GPU_USAGE | -15,000 VND | SUCCESS |
| 003 | REFUND | +50,000 VND | SUCCESS |

---

### 4. Usage Metering Service
Tracks resource usage (similar to AWS billing):

```sql
CREATE TABLE ResourceUsage (
    Id UUID PRIMARY KEY,
    UserId UUID NOT NULL,
    ResourceType VARCHAR(50) NOT NULL, -- NVIDIA_A100, RTX_4090
    ResourceId VARCHAR(100) NOT NULL,
    StartTime TIMESTAMP NOT NULL,
    EndTime TIMESTAMP,
    DurationMinutes INT,
    Cost DECIMAL(18, 4)
);
```

---

### 5. Billing Engine
Calculates cost based on pricing tiers:

```sql
CREATE TABLE ResourcePricing (
    Resource VARCHAR(50) PRIMARY KEY,
    PricePerHour DECIMAL(10, 2) NOT NULL
);
```

Calculation: `Cost = (Duration / 60) * PricePerHour`

---

## Real Transaction Step-by-Step Flow

1. **User deposits money**: User requests 1,000,000 VND deposit. System creates transaction `TX001` in `PENDING` status.
2. **Generate QR**: Returns QR Code URL (`https://qr-payment.com/TX001`).
3. **User pays**: User scans QR and completes bank payment.
4. **Callback & Wallet Update**: Bank sends webhook `TX001 SUCCESS`. System updates wallet balance (`0 -> 1,000,000 VND`).
5. **Job Submission Check**: User submits GPU job. System verifies `Wallet Balance >= Estimated Cost`.
6. **Job Metering**: Worker emits `GPU_USAGE_EVENT` every 60 seconds.
7. **Deduction**: Billing service calculates hourly cost and creates negative transaction (`-2 USD`), updating wallet balance.

---

## Double Entry Ledger Accounting

A professional cloud system uses accounting-style double-entry ledgers to prevent balance bugs and support auditing:

```sql
CREATE TABLE LedgerEntry (
    Id UUID PRIMARY KEY,
    UserId UUID NOT NULL,
    Debit DECIMAL(18, 2) DEFAULT 0,
    Credit DECIMAL(18, 2) DEFAULT 0,
    Description TEXT,
    CreatedAt TIMESTAMP NOT NULL
);
```

* **Deposit**: Credit `+100 USD`
* **GPU Usage**: Debit `-5 USD`

---

## Payment Microservice Tech Stack & Security

* **Backend**: ASP.NET Core, EF Core, PostgreSQL, Redis, RabbitMQ/Kafka, Hangfire.
* **Security**: JWT, HTTPS, Webhook Signature Verification, Idempotency Key (`ExternalTransactionId UNIQUE`).

---

## Payment System MVP Roadmap

### Version 1 (Must Have for Portfolio)
* ✅ Wallet management
* ✅ Deposit money & QR generation
* ✅ Transaction history
* ✅ Resource usage deduction
* ✅ Billing dashboard

### Version 2 (Advanced)
* ✅ Payment gateway webhook integration
* ✅ Refund system
* ✅ Invoice generation & PDF export
* ✅ Monthly billing statements

---

# Summary Technology Matrix

| Area | Technology |
| :--- | :--- |
| **Backend API** | ASP.NET Core 9 |
| **Distributed Scheduler** | Spring Boot 3 |
| **Database** | PostgreSQL |
| **Cache & Lock** | Redis |
| **Messaging** | Apache Kafka |
| **Payment Gateway** | VietQR / VNPay / MoMo |
| **Accounting** | Double-Entry Ledger |
| **DevOps** | Docker / Kubernetes |
| **Observability** | Prometheus / Grafana / OpenTelemetry / ELK |
