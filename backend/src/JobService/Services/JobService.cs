using JobService.Data;
using JobService.Events;
using JobService.Models;
using Microsoft.EntityFrameworkCore;
using Shared.Events;

namespace JobService.Services;

public class JobServiceImplementation : IJobService
{
    private readonly JobDbContext _dbContext;
    private readonly JobEventProducer _eventProducer;
    private readonly HttpClient _httpClient;

    public JobServiceImplementation(
        JobDbContext dbContext,
        JobEventProducer eventProducer,
        HttpClient httpClient)
    {
        _dbContext = dbContext;
        _eventProducer = eventProducer;
        _httpClient = httpClient;
    }

    public async Task<IEnumerable<JobDto>> GetJobsAsync(Guid ownerId, Guid? projectId = null, string? status = null)
    {
        var query = _dbContext.TrainingJobs.Where(j => j.OwnerId == ownerId);

        if (projectId.HasValue)
        {
            query = query.Where(j => j.ProjectId == projectId.Value);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(j => j.Status == status);
        }

        var jobs = await query.OrderByDescending(j => j.CreatedAt).ToListAsync();
        return jobs.Select(MapToDto);
    }

    public async Task<JobDto?> GetJobByIdAsync(Guid id, Guid ownerId)
    {
        var job = await _dbContext.TrainingJobs.FirstOrDefaultAsync(j => j.Id == id && j.OwnerId == ownerId);
        return job == null ? null : MapToDto(job);
    }

    public async Task<JobDto> SubmitJobAsync(Guid ownerId, SubmitJobRequest request)
    {
        var job = new TrainingJob
        {
            OwnerId = ownerId,
            ProjectId = request.ProjectId,
            ProjectName = request.ProjectName,
            Name = request.Name,
            GpuType = request.GpuType,
            GpuCount = request.GpuCount,
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
        await _dbContext.SaveChangesAsync();

        // Publish JobCreatedEvent to Kafka
        var createdEvent = new JobCreatedEvent
        {
            JobId = job.Id,
            ProjectId = job.ProjectId,
            UserId = ownerId,
            JobName = job.Name,
            GpuType = job.GpuType,
            GpuCount = job.GpuCount,
            DurationHours = job.DurationHours,
            CostPerHour = job.CostPerHour,
            TotalCost = job.TotalCost,
            CreatedAt = job.CreatedAt
        };

        await _eventProducer.PublishJobCreatedAsync(createdEvent);

        // Notify ProjectService to increment job count
        try
        {
            var projectServiceUrl = "http://project-service:8080";
            await _httpClient.PostAsync($"{projectServiceUrl}/api/projects/internal/{job.ProjectId}/increment-job-count", null);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Warning] Failed to notify ProjectService to increment job count: {ex.Message}");
        }

        return MapToDto(job);
    }

    public async Task<bool> CancelJobAsync(Guid id, Guid ownerId)
    {
        var job = await _dbContext.TrainingJobs.FirstOrDefaultAsync(j => j.Id == id && j.OwnerId == ownerId);
        if (job == null) return false;

        if (job.Status == "COMPLETED" || job.Status == "FAILED")
        {
            return false;
        }

        job.Status = "FAILED";
        job.CompletedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();
        return true;
    }

    private static JobDto MapToDto(TrainingJob j) => new(
        j.Id,
        j.Name,
        j.ProjectId,
        j.ProjectName,
        j.GpuType,
        j.GpuCount,
        j.Status,
        j.Progress,
        j.DurationHours,
        j.CostPerHour,
        j.TotalCost,
        j.AssignedNodeId,
        j.CreatedAt,
        j.StartedAt,
        j.CompletedAt,
        j.Command ?? string.Empty,
        j.Framework ?? string.Empty
    );
}
