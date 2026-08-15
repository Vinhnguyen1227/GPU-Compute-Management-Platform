using JobService.Data;
using Microsoft.EntityFrameworkCore;
using Shared.Constants;
using Shared.Events;
using Shared.Messaging;

namespace JobService.Consumers;

public class JobFailedConsumer : KafkaConsumerBase<JobFailedEvent>
{
    private readonly IServiceScopeFactory _scopeFactory;

    public JobFailedConsumer(
        IConfiguration config,
        ILogger<JobFailedConsumer> logger,
        IServiceScopeFactory scopeFactory)
        : base(
            config["Kafka:BootstrapServers"] ?? "localhost:9092",
            "job-service-failed-group",
            KafkaTopics.JobFailed,
            logger)
    {
        _scopeFactory = scopeFactory;
    }

    protected override async Task HandleMessageAsync(JobFailedEvent message, CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<JobDbContext>();

        var job = await db.TrainingJobs.FirstOrDefaultAsync(j => j.Id == message.JobId, cancellationToken);
        if (job == null) return;

        job.Status = "FAILED";
        job.CompletedAt = message.FailedAt;

        await db.SaveChangesAsync(cancellationToken);
    }
}
