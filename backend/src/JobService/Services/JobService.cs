using JobService.Data;
using JobService.Events;
using JobService.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Shared.Events;
using Shared.Models;

namespace JobService.Services;

public class JobServiceImplementation : IJobService
{
    private readonly JobDbContext _db;
    private readonly JobEventProducer _eventProducer;
    private readonly HttpClient _httpClient;
    private readonly ILogger<JobServiceImplementation> _logger;

    public JobServiceImplementation(
        JobDbContext db,
        JobEventProducer eventProducer,
        HttpClient httpClient,
        ILogger<JobServiceImplementation> logger)
    {
        _db = db;
        _eventProducer = eventProducer;
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<TrainingJob> SubmitJobAsync(SubmitJobRequest request, Guid userId, CancellationToken ct = default)
    {
        var durationHours = request.DurationHours ?? 1.0m;
        var totalCost = request.TotalCost > 0 
            ? request.TotalCost 
            : request.CostPerHour * durationHours * request.GpuCount;

        var job = new TrainingJob
        {
            Id = Guid.NewGuid(),
            OwnerId = userId,
            ProjectId = request.ProjectId,
            ProjectName = request.ProjectName,
            Name = request.Name,
            GpuType = request.GpuType,
            GpuCount = request.GpuCount,
            Status = "CREATED",
            Progress = 0,
            DurationHours = durationHours,
            CostPerHour = request.CostPerHour,
            TotalCost = totalCost,
            Command = request.Command,
            Framework = request.Framework,
            CreatedAt = DateTime.UtcNow
        };

        _db.TrainingJobs.Add(job);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Job {JobId} saved to DB for user {UserId}. Publishing JobCreatedEvent...", job.Id, userId);

        var createdEvent = new JobCreatedEvent
        {
            JobId = job.Id,
            ProjectId = job.ProjectId,
            UserId = userId,
            JobName = job.Name,
            GpuType = job.GpuType,
            GpuCount = job.GpuCount,
            DurationHours = durationHours,
            CostPerHour = job.CostPerHour,
            TotalCost = job.TotalCost,
            CreatedAt = job.CreatedAt
        };

        await _eventProducer.PublishJobCreatedAsync(createdEvent, ct);

        // Notify ProjectService to increment job count
        try
        {
            var projectServiceUrl = "http://project-service:8080";
            await _httpClient.PostAsync($"{projectServiceUrl}/api/projects/internal/{job.ProjectId}/increment-job-count", null, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to notify ProjectService to increment job count for project {ProjectId}", job.ProjectId);
        }

        return job;
    }

    public async Task<PaginatedResult<TrainingJob>> GetJobsAsync(
        string? status = null,
        Guid? projectId = null,
        Guid? ownerId = null,
        int page = 1,
        int pageSize = 20,
        CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.TrainingJobs.AsNoTracking().AsQueryable();

        if (ownerId.HasValue && ownerId.Value != Guid.Empty)
        {
            query = query.Where(j => j.OwnerId == ownerId.Value);
        }

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

    public async Task<TrainingJob?> GetJobByIdAsync(Guid id, Guid? ownerId = null, CancellationToken ct = default)
    {
        var query = _db.TrainingJobs.AsNoTracking().Where(j => j.Id == id);
        if (ownerId.HasValue && ownerId.Value != Guid.Empty)
        {
            query = query.Where(j => j.OwnerId == ownerId.Value);
        }
        return await query.FirstOrDefaultAsync(ct);
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
