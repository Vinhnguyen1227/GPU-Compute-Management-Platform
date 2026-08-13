# System Patterns

## System Architecture
```
                  [ Web Client (React + Vite + TS) ]
                                  |
                                  v
                        [ API Gateway (.NET) ]
                                  |
    +-----------------------------+-----------------------------+
    |                             |                             |
[Auth Service]            [User Service]               [Billing & Payment]
   (.NET)                     (.NET)                        (.NET)
    |                             |                             |
    +-----------------------------+-----------------------------+
                                  |
                               [Kafka]
                                  |
    +-----------------------------+-----------------------------+
    |                             |                             |
[Job Scheduler]          [Resource Service]            [Worker Service]
    (Java)                     (Java)                        (.NET)
```

## Key Patterns
- **Database per Service**: Isolated PostgreSQL DB instances.
- **Event-Driven Messaging**: Kafka topics (`job.created`, `job.started`, `job.completed`, `payment.completed`).
- **Distributed Locks**: Redis locks for GPU node allocation safety.
- **Idempotent Payments**: Transaction reference tracking for QR callbacks.
- **Single Page App Routing**: Modular route structure with tabbed & drawer views for deep inspection.
