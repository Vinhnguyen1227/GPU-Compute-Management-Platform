using System.Text.Json;
using JobService.Data;
using JobService.Services;
using Microsoft.EntityFrameworkCore;
using Shared.Constants;
using Shared.Events;
using Shared.Messaging;

namespace JobService.Consumers;

public class JobProgressConsumer : KafkaConsumerBase<JobProgressEvent>
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly JobLogBroadcaster _broadcaster;

    public JobProgressConsumer(
        IConfiguration config,
        ILogger<JobProgressConsumer> logger,
        IServiceScopeFactory scopeFactory,
        JobLogBroadcaster broadcaster)
        : base(
            config["Kafka:BootstrapServers"] ?? "localhost:9092",
            "job-service-progress-group",
            KafkaTopics.JobProgress,
            logger)
    {
        _scopeFactory = scopeFactory;
        _broadcaster = broadcaster;
    }

    protected override async Task HandleMessageAsync(JobProgressEvent message, CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<JobDbContext>();

        var job = await db.TrainingJobs.FirstOrDefaultAsync(j => j.Id == message.JobId, cancellationToken);
        if (job != null)
        {
            job.Progress = message.ProgressPercent;
            if (job.Status == "QUEUED" || job.Status == "CREATED")
            {
                job.Status = "RUNNING";
            }
            await db.SaveChangesAsync(cancellationToken);
        }

        var ssePayload = JsonSerializer.Serialize(new
        {
            timestamp = message.UpdatedAt.ToString("yyyy-MM-dd HH:mm:ss"),
            level = "INFO",
            message = string.IsNullOrWhiteSpace(message.CurrentEpoch)
                ? message.LogSnippet
                : $"[{message.CurrentEpoch}] {message.LogSnippet}"
        });

        await _broadcaster.BroadcastAsync(message.JobId, ssePayload);
    }
}
