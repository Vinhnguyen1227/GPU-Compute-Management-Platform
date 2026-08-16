using System.Text.Json;
using Confluent.Kafka;
using JobService.Data;
using JobService.Models;
using Microsoft.EntityFrameworkCore;
using Shared.Constants;
using Shared.Events;
using Shared.Models;

namespace JobService.Services;

public class JobServiceImplementation : IJobService
{
    private readonly JobDbContext _dbContext;
    private readonly IProducer<string, string> _producer;
    private readonly ILogger<JobServiceImplementation> _logger;

    public JobServiceImplementation(
        JobDbContext dbContext,
        IProducer<string, string> producer,
        ILogger<JobServiceImplementation> logger)
    {
        _dbContext = dbContext;
        _producer = producer;
        _logger = logger;
    }

    public async Task<ApiResponse<TrainingJobDto>> CreateJobAsync(CreateJobRequest request, Guid userId, CancellationToken ct = default)
    {
        var job = new TrainingJob
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            ProjectId = request.ProjectId,
            Name = request.Name,
            Framework = request.Framework,
            Command = request.Command,
            GpuType = request.GpuType,
            GpuCount = request.GpuCount,
            Status = "QUEUED",
            Progress = 0,
            EstimatedDurationHours = request.EstimatedDurationHours,
            CostPerHour = request.CostPerHour,
            TotalCost = 0m,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _dbContext.TrainingJobs.Add(job);
        await _dbContext.SaveChangesAsync(ct);

        var jobCreatedEvent = new JobCreatedEvent
        {
            JobId = job.Id,
            UserId = job.UserId,
            ProjectId = job.ProjectId,
            GpuType = job.GpuType,
            GpuCount = job.GpuCount,
            CreatedAt = job.CreatedAt
        };

        var message = new Message<string, string>
        {
            Key = job.Id.ToString(),
            Value = JsonSerializer.Serialize(jobCreatedEvent)
        };

        await _producer.ProduceAsync(KafkaTopics.JobCreated, message, ct);
        _logger.LogInformation("Job {JobId} created and published to topic {Topic}", job.Id, KafkaTopics.JobCreated);

        return ApiResponse<TrainingJobDto>.Ok(MapToDto(job));
    }

    public async Task<ApiResponse<TrainingJobDto>> GetJobByIdAsync(Guid jobId, CancellationToken ct = default)
    {
        var job = await _dbContext.TrainingJobs.FindAsync(new object[] { jobId }, ct);
        if (job == null)
        {
            return ApiResponse<TrainingJobDto>.Fail("Job not found");
        }
        return ApiResponse<TrainingJobDto>.Ok(MapToDto(job));
    }

    public async Task<ApiResponse<List<TrainingJobDto>>> GetJobsByUserIdAsync(Guid userId, CancellationToken ct = default)
    {
        var jobs = await _dbContext.TrainingJobs
            .Where(j => j.UserId == userId)
            .OrderByDescending(j => j.CreatedAt)
            .ToListAsync(ct);

        return ApiResponse<List<TrainingJobDto>>.Ok(jobs.Select(MapToDto).ToList());
    }

    public async Task<ApiResponse<bool>> CancelJobAsync(Guid jobId, Guid userId, CancellationToken ct = default)
    {
        var job = await _dbContext.TrainingJobs.FindAsync(new object[] { jobId }, ct);
        if (job == null)
        {
            return ApiResponse<bool>.Fail("Job not found");
        }

        if (job.UserId != userId && userId != Guid.Empty)
        {
            return ApiResponse<bool>.Fail("Unauthorized to cancel this job");
        }

        var startTime = job.StartedAt ?? job.CreatedAt;
        var actualDurationHours = Math.Max(0.05, (DateTime.UtcNow - startTime).TotalHours);
        var actualCost = Math.Round((decimal)actualDurationHours * job.CostPerHour * job.GpuCount, 0);

        job.Status = "COMPLETED";
        job.CompletedAt = DateTime.UtcNow;
        job.ActualDurationHours = actualDurationHours;
        job.TotalCost = actualCost;
        job.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(ct);

        var completedEvent = new JobCompletedEvent
        {
            JobId = job.Id,
            UserId = job.UserId,
            GpuType = job.GpuType,
            NodeId = job.AssignedNodeId ?? "node-auto",
            ActualDurationHours = actualDurationHours,
            FinalCost = actualCost,
            CompletedAt = DateTime.UtcNow
        };

        await _producer.ProduceAsync(KafkaTopics.JobCompleted, new Message<string, string>
        {
            Key = job.Id.ToString(),
            Value = JsonSerializer.Serialize(completedEvent)
        }, ct);

        _logger.LogInformation("Job {JobId} terminated. Actual duration: {Duration}h, Cost: {Cost} VND",
            job.Id, actualDurationHours, actualCost);

        return ApiResponse<bool>.Ok(true, "Job stopped and released successfully");
    }

    private static TrainingJobDto MapToDto(TrainingJob j) => new(
        j.Id, j.UserId, j.ProjectId, j.Name, j.Framework, j.Command,
        j.GpuType, j.GpuCount, j.Status, j.Progress, j.EstimatedDurationHours,
        j.CostPerHour, j.TotalCost, j.AssignedNodeId, j.CreatedAt, j.StartedAt, j.CompletedAt
    );
}
