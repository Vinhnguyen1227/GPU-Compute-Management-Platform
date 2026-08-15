# Active Context

## Current Status
- Finished Phase 3 — Project + Job + Resource Services implementation.
- Solution builds cleanly (`dotnet build backend/AIComputePlatform.sln` -> 0 errors, 0 warnings across all 9 projects).

## Key Accomplishments
- **ProjectService**:
  - Implemented `Project` model & `ProjectDbContext`.
  - Built `IProjectService` / `ProjectServiceImplementation` for project CRUD filtered by JWT user ID (`sub`).
  - Added internal endpoint `POST /api/projects/internal/{id}/increment-job-count` for `JobService` integration.
  - Built `ProjectsController` and configured JWT Bearer authentication in `Program.cs`.
- **JobService**:
  - Implemented `TrainingJob` model & `JobDbContext`.
  - Built `JobEventProducer` to publish `job.created` Kafka events on job submission.
  - Built `JobAssignedConsumer` (BackgroundService) to process `job.assigned` events and transition jobs to `RUNNING` status with assigned node ID.
  - Built `IJobService` / `JobServiceImplementation` and `JobsController` (including SSE streaming placeholder endpoint `/api/jobs/{id}/logs`).
- **ResourceService**:
  - Implemented `GpuNode` model & `ResourceDbContext`.
  - Built `SchedulerService` using atomic PostgreSQL row locking (`SELECT ... FOR UPDATE SKIP LOCKED`) for GPU allocation.
  - Built `JobCreatedConsumer` (BackgroundService) listening on `job.created` -> invokes `SchedulerService` -> assigns GPU node -> publishes `job.assigned` Kafka event.
  - Built `GpuNodesController` and `ClusterMetricsController`.
- **ApiGateway**:
  - Verified routing for `/api/projects/*`, `/api/jobs/*`, `/api/gpu-nodes/*`, and `/api/cluster/*`.
