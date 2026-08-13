# AI Compute Cloud Platform - Coding Agent Guide

## Project Overview

Build a production-grade mini cloud computing platform inspired by
NVIDIA DGX Cloud, AWS SageMaker, and Google Cloud AI infrastructure.

The platform allows users to:

-   Create accounts
-   Manage AI projects
-   Submit AI training jobs
-   Request compute resources (GPU simulation)
-   Monitor job execution
-   Pay based on resource consumption
-   Manage wallet balance and transactions

The goal is to demonstrate backend engineering skills:

-   Microservices architecture
-   Distributed systems
-   Event-driven design
-   Payment systems
-   Concurrency handling
-   Cloud deployment
-   Observability

------------------------------------------------------------------------

# Main Architecture

    Client
     |
    API Gateway
     |
    ------------------------------------------------
    |              |               |                |
    Auth       User Service    Job Service     Payment Service
     |
     |
    ------------------------------------------------
                    |
                 Kafka
                    |
    ------------------------------------------------
    |              |               |
    Scheduler   Worker Service   Usage Metering
                    |
                    |
              Resource Service

    Infrastructure:
    PostgreSQL
    Redis
    Kafka
    Docker
    Kubernetes
    Prometheus
    Grafana
    OpenTelemetry

------------------------------------------------------------------------

# Technology Stack

## Backend

### .NET

Use ASP.NET Core for:

-   API Gateway
-   Authentication Service
-   Payment Service
-   Wallet Service
-   Billing Service
-   Worker Service

Libraries:

-   Entity Framework Core
-   Identity
-   JWT Authentication
-   Serilog
-   FluentValidation
-   Hangfire
-   xUnit

### Java

Use Spring Boot for:

-   Job Scheduler
-   Resource Manager
-   Project Service

Libraries:

-   Spring Boot 3
-   Spring Security
-   Hibernate
-   Kafka Client
-   Resilience4j
-   JUnit
-   Mockito

------------------------------------------------------------------------

# Core Microservices

## 1. API Gateway

Responsibilities:

-   Request routing
-   Authentication checking
-   Rate limiting
-   Logging
-   API aggregation

------------------------------------------------------------------------

## 2. Authentication Service

Features:

-   Register/login
-   JWT access tokens
-   Refresh tokens
-   Role management

Roles:

-   USER
-   ADMIN
-   ENGINEER

------------------------------------------------------------------------

## 3. User Service

Manages:

-   User profile
-   Permissions
-   Account information

Database:

PostgreSQL

------------------------------------------------------------------------

## 4. Project Service

Manages AI projects.

Example:

    Project:
    Llama Fine Tuning

    Owner:
    User A

    Dataset:
    training-data.zip

------------------------------------------------------------------------

# Compute System

## Job Service

Users submit AI jobs.

Example:

    Train Model

    GPU:
    NVIDIA A100

    Duration:
    5 hours

Job lifecycle:

    CREATED
     |
    QUEUED
     |
    RUNNING
     |
    COMPLETED
     |
    FAILED

------------------------------------------------------------------------

# Scheduler Service

Responsible for resource allocation.

Similar to Kubernetes scheduler.

Responsibilities:

-   Find available GPUs
-   Match requirements
-   Assign jobs
-   Prevent resource conflicts

Example:

    Job requires:

    A100 GPU
    40GB memory


    Available:

    A100-01

    Assign Job

------------------------------------------------------------------------

# Resource Service

Tracks compute resources.

Example:

    GPU Node:

    Name:
    A100-01

    GPU:
    NVIDIA A100

    Memory:
    80GB

    Status:
    AVAILABLE

------------------------------------------------------------------------

# Worker Service

Simulates GPU execution.

Responsibilities:

-   Consume jobs
-   Execute workloads
-   Report progress
-   Publish completion events

------------------------------------------------------------------------

# Payment And Billing System

## Wallet Service

Stores user balance.

Example:

    Balance:

    500 USD

------------------------------------------------------------------------

## Payment Service

Handles deposits.

Payment flow:

    User
     |
    Create Deposit
     |
    Generate QR
     |
    User Pays
     |
    Payment Gateway Callback
     |
    Update Wallet

Possible integrations:

-   VietQR
-   VNPay
-   MoMo
-   ZaloPay

------------------------------------------------------------------------

## Transaction System

Never directly modify balance.

Use transaction records.

Example:

    Transaction

    ID:
    TX001

    Type:
    DEPOSIT

    Amount:
    +100 USD

    Status:
    SUCCESS

------------------------------------------------------------------------

# Usage Metering

Tracks resource consumption.

Example:

    GPU:

    A100

    Duration:

    3 hours

    Cost:

    6 USD

Formula:

    Cost =
    Usage Time x Resource Price

------------------------------------------------------------------------

# Billing Engine

Calculates:

-   GPU usage
-   Storage usage
-   Runtime cost

Example:

    A100

    2 USD/hour

    5 hours

    =

    10 USD

------------------------------------------------------------------------

# Concurrency And Production Requirements

## Race Condition Prevention

Problem:

Two users reserve the same GPU.

Solutions:

-   PostgreSQL row locking
-   Redis distributed lock

Example:

    SELECT FOR UPDATE

------------------------------------------------------------------------

# Database Scaling

Implement:

-   Connection pooling
-   Read replicas
-   Index optimization
-   Database migrations

------------------------------------------------------------------------

# Payment Safety

Implement:

## Idempotency

Prevent duplicate payments.

Example:

    Transaction ID:

    TX12345

    UNIQUE

Repeated callbacks are ignored.

------------------------------------------------------------------------

# Distributed Transactions

Use Saga Pattern.

Example:

    Create Job

          |
    Reserve GPU

          |
    Charge Wallet

          |
    Start Training

If payment fails:

    Release GPU

    Cancel Job

------------------------------------------------------------------------

# Messaging Architecture

Use Kafka.

Topics:

    job.created

    job.started

    job.completed

    resource.updated

    payment.completed

Benefits:

-   Async processing
-   Traffic handling
-   Failure recovery

------------------------------------------------------------------------

# Caching

Use Redis for:

-   Session data
-   GPU availability
-   Rate limiting
-   Distributed locks

------------------------------------------------------------------------

# Security

Implement:

-   HTTPS
-   JWT authentication
-   Refresh token rotation
-   Input validation
-   SQL injection prevention
-   Secret management

Use:

-   Azure Key Vault
-   AWS Secrets Manager
-   Hashicorp Vault

------------------------------------------------------------------------

# DevOps

## Docker

Every service has:

    Dockerfile

------------------------------------------------------------------------

## Kubernetes

Deploy:

    API replicas

    Scheduler replicas

    Worker replicas

    Kafka cluster

    Database

    Redis

------------------------------------------------------------------------

# CI/CD Pipeline

GitHub Actions:

    Push Code

     |

    Run Tests

     |

    Build Docker Image

     |

    Push Image

     |

    Deploy Kubernetes

------------------------------------------------------------------------

# Monitoring

## Metrics

Track:

-   API latency
-   Error rate
-   CPU
-   Memory
-   Kafka lag
-   Job execution time
-   GPU usage

Tools:

-   Prometheus
-   Grafana

------------------------------------------------------------------------

# Logging

Use:

-   Serilog
-   Logback
-   Elasticsearch
-   Kibana

Example:

    {
     service:"scheduler",
     jobId:123,
     gpu:"A100"
    }

------------------------------------------------------------------------

# Distributed Tracing

Use:

-   OpenTelemetry
-   Jaeger

Trace:

    Gateway

     |

    Job Service

     |

    Kafka

     |

    Scheduler

     |

    Worker

------------------------------------------------------------------------

# MVP Development Roadmap

## Phase 1

Build:

-   Repository structure
-   Docker environment
-   Authentication
-   User service

------------------------------------------------------------------------

## Phase 2

Build:

-   Project service
-   Job service
-   Basic APIs

------------------------------------------------------------------------

## Phase 3

Build:

-   Scheduler
-   GPU simulator
-   Worker service

------------------------------------------------------------------------

## Phase 4

Build:

-   Kafka event system
-   Async processing

------------------------------------------------------------------------

## Phase 5

Build:

-   Wallet
-   Payment
-   QR payment
-   Billing

------------------------------------------------------------------------

## Phase 6

Production improvements:

-   Redis
-   Rate limiting
-   Monitoring
-   Logging
-   Kubernetes deployment

------------------------------------------------------------------------

# Recommended Repository Structure

    ai-compute-platform/

    backend/

        dotnet/

            gateway/

            auth-service/

            payment-service/

            wallet-service/

            worker-service/


        java/

            project-service/

            scheduler-service/

            resource-service/


    frontend/

    infra/

        docker/

        kubernetes/


    docs/

        architecture.md

        api-design.md

        database-design.md

------------------------------------------------------------------------

# Resume Description

Designed and developed a distributed AI compute orchestration platform
inspired by NVIDIA DGX Cloud using ASP.NET Core and Spring Boot
microservices. Implemented Kafka-based event-driven architecture, GPU
resource scheduling, payment and billing systems, Redis caching,
PostgreSQL service isolation, Docker/Kubernetes deployment, and
production observability using Prometheus, Grafana, and OpenTelemetry.
