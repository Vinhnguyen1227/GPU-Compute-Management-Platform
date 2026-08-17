using JobService.Data;
using JobService.Events;
using JobService.Models;
using Microsoft.EntityFrameworkCore;
using Shared.Events;
using Shared.Models;

namespace JobService.Services;

public class JobServiceImplementation : IJobService
{
    private readonly JobDbContext _dbContext;
    private readonly JobEventProducer _eventProducer;
    private readonly ILogger<JobServiceImplementation> _logger;

    public JobServiceImplementation(
        JobDbContext dbContext,
        JobEventProducer eventProducer,
        ILogger<JobServiceImplementation> logger)
    {
        _dbContext = dbContext;
        _eventProducer = eventProducer;
        _logger = logger;
    }

    public async Task<TrainingJob> SubmitJobAsync(SubmitJobRequest request, Guid userId, CancellationToken ct = default)
    {
        var job = new TrainingJob
        {
            Id = Guid.NewGuid(),
            OwnerId = userId,
            ProjectId = request.ProjectId,
            ProjectName = string.IsNullOrWhiteSpace(request.ProjectName) ? "AI Project" : request.ProjectName,
            Name = request.Name,
            GpuType = request.GpuType,
            GpuCount = request.GpuCount > 0 ? request.GpuCount : 1,
            Status = "CREATED",
            Progress = 0,
            DurationHours = request.DurationHours,
            CostPerHour = request.CostPerHour,
            TotalCost = request.TotalCost,
            Command = request.Command,
            Framework = request.Framework,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.TrainingJobs.Add(job);
        await _dbContext.SaveChangesAsync(ct);

        var jobCreatedEvent = new JobCreatedEvent
        {
            JobId = job.Id,
            UserId = userId,
            ProjectId = job.ProjectId,
            GpuType = job.GpuType,
            GpuCount = job.GpuCount,
            CreatedAt = job.CreatedAt
        };

        await _eventProducer.PublishJobCreatedAsync(jobCreatedEvent, ct);
        _logger.LogInformation("Job {JobId} created for User {UserId} and event published", job.Id, userId);

        return job;
    }

    public async Task<PaginatedResult<TrainingJob>> GetJobsAsync(string? status = null, Guid? projectId = null, Guid? ownerId = null, int page = 1, int pageSize = 20, CancellationToken ct = default)
    {
        var query = _dbContext.TrainingJobs.AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(j => j.Status == status);
        }

        if (projectId.HasValue && projectId.Value != Guid.Empty)
        {
            query = query.Where(j => j.ProjectId == projectId.Value);
        }

        if (ownerId.HasValue && ownerId.Value != Guid.Empty)
        {
            query = query.Where(j => j.OwnerId == ownerId.Value);
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
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<TrainingJob?> GetJobByIdAsync(Guid id, Guid? ownerId = null, CancellationToken ct = default)
    {
        var job = await _dbContext.TrainingJobs.FirstOrDefaultAsync(j => j.Id == id, ct);
        if (job == null) return null;

        if (ownerId.HasValue && ownerId.Value != Guid.Empty && job.OwnerId != ownerId.Value)
        {
            return null;
        }

        return job;
    }

    public async Task<TrainingJob?> CancelJobAsync(Guid id, Guid userId, CancellationToken ct = default)
    {
        var job = await _dbContext.TrainingJobs.FirstOrDefaultAsync(j => j.Id == id, ct);
        if (job == null) return null;

        if (userId != Guid.Empty && job.OwnerId != userId)
        {
            return null;
        }

        job.Status = "FAILED";
        job.CompletedAt = DateTime.UtcNow;
        job.TotalCost = 0m;

        await _dbContext.SaveChangesAsync(ct);

        var jobFailedEvent = new JobFailedEvent
        {
            JobId = job.Id,
            UserId = userId,
            Reason = "Cancelled by user",
            FailedAt = DateTime.UtcNow
        };

        await _eventProducer.PublishJobFailedAsync(jobFailedEvent, ct);
        _logger.LogInformation("Job {JobId} cancelled by User {UserId}", job.Id, userId);

        return job;
    }
}
