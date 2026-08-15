using JobService.Data;
using JobService.Events;
using JobService.Models;
using Microsoft.EntityFrameworkCore;
using Shared.Events;
using Shared.Models;

namespace JobService.Services;

public class JobService : IJobService
{
    private readonly JobDbContext _db;
    private readonly JobEventProducer _eventProducer;
    private readonly ILogger<JobService> _logger;

    public JobService(JobDbContext db, JobEventProducer eventProducer, ILogger<JobService> logger)
    {
        _db = db;
        _eventProducer = eventProducer;
        _logger = logger;
    }

    public async Task<TrainingJob> SubmitJobAsync(SubmitJobRequest request, Guid userId, CancellationToken ct = default)
    {
        var job = new TrainingJob
        {
            Id = Guid.NewGuid(),
            ProjectId = request.ProjectId,
            ProjectName = request.ProjectName,
            Name = request.Name,
            GpuType = request.GpuType,
            GpuCount = request.GpuCount,
            Status = "CREATED",
            Progress = 0,
            DurationHours = request.DurationHours,
            CostPerHour = request.CostPerHour,
            TotalCost = request.TotalCost > 0 ? request.TotalCost : request.CostPerHour * request.DurationHours * request.GpuCount,
            Command = request.Command,
            Framework = request.Framework,
            CreatedAt = DateTime.UtcNow
        };

        _db.TrainingJobs.Add(job);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Job {JobId} saved to DB. Publishing JobCreatedEvent...", job.Id);

        var createdEvent = new JobCreatedEvent
        {
            JobId = job.Id,
            ProjectId = job.ProjectId,
            UserId = userId,
            JobName = job.Name,
            GpuType = job.GpuType,
            GpuCount = job.GpuCount,
            DurationHours = job.DurationHours ?? 0,
            CostPerHour = job.CostPerHour,
            TotalCost = job.TotalCost,
            CreatedAt = job.CreatedAt
        };

        await _eventProducer.PublishJobCreatedAsync(createdEvent, ct);

        return job;
    }

    public async Task<PaginatedResult<TrainingJob>> GetJobsAsync(string? status = null, Guid? projectId = null, int page = 1, int pageSize = 20, CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.TrainingJobs.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(j => j.Status == status);
        }

        if (projectId.HasValue && projectId.Value != Guid.Empty)
        {
            query = query.Where(j => j.ProjectId == projectId.Value);
        }

        var totalCount = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(j => j.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return new PaginatedResult<TrainingJob>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<TrainingJob?> GetJobByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.TrainingJobs.AsNoTracking().FirstOrDefaultAsync(j => j.Id == id, ct);
    }

    public async Task<TrainingJob?> CancelJobAsync(Guid id, Guid userId, CancellationToken ct = default)
    {
        var job = await _db.TrainingJobs.FirstOrDefaultAsync(j => j.Id == id, ct);
        if (job == null) return null;

        if (job.Status == "COMPLETED" || job.Status == "FAILED")
        {
            return job; // Already finished
        }

        job.Status = "FAILED";
        job.CompletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        var duration = job.StartedAt.HasValue
            ? (DateTime.UtcNow - job.StartedAt.Value).TotalHours
            : 0.0;

        var failedEvent = new JobFailedEvent
        {
            JobId = job.Id,
            UserId = userId,
            NodeId = job.AssignedNodeId ?? string.Empty,
            Reason = "Cancelled by user",
            PartialDurationHours = duration,
            FailedAt = DateTime.UtcNow
        };

        await _eventProducer.PublishJobFailedAsync(failedEvent, ct);

        return job;
    }
}
