using JobService.Data;
using Microsoft.EntityFrameworkCore;
using Shared.Constants;
using Shared.Events;
using Shared.Messaging;

namespace JobService.Consumers;

public class JobCompletedConsumer : KafkaConsumerBase<JobCompletedEvent>
{
    private readonly IServiceScopeFactory _scopeFactory;

    public JobCompletedConsumer(
        IConfiguration config,
        ILogger<JobCompletedConsumer> logger,
        IServiceScopeFactory scopeFactory)
        : base(
            config["Kafka:BootstrapServers"] ?? "localhost:9092",
            "job-service-completed-group",
            KafkaTopics.JobCompleted,
            logger)
    {
        _scopeFactory = scopeFactory;
    }

    protected override async Task HandleMessageAsync(JobCompletedEvent message, CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<JobDbContext>();

        var job = await db.TrainingJobs.FirstOrDefaultAsync(j => j.Id == message.JobId, cancellationToken);
        if (job == null) return;

        job.Status = "COMPLETED";
        job.Progress = 100;
        job.CompletedAt = message.CompletedAt;
        if (message.FinalCost > 0)
        {
            job.TotalCost = message.FinalCost;
        }

        await db.SaveChangesAsync(cancellationToken);
    }
}
