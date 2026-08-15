using JobService.Data;
using Microsoft.EntityFrameworkCore;
using Shared.Constants;
using Shared.Events;
using Shared.Messaging;

namespace JobService.Consumers;

public class JobAssignedConsumer : KafkaConsumerBase<JobAssignedEvent>
{
    private readonly IServiceScopeFactory _scopeFactory;

    public JobAssignedConsumer(
        IConfiguration config,
        ILogger<JobAssignedConsumer> logger,
        IServiceScopeFactory scopeFactory)
        : base(
            config["Kafka:BootstrapServers"] ?? "localhost:9092",
            "job-service-assigned-group",
            KafkaTopics.JobAssigned,
            logger)
    {
        _scopeFactory = scopeFactory;
    }

    protected override async Task HandleMessageAsync(JobAssignedEvent message, CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<JobDbContext>();

        var job = await db.TrainingJobs.FirstOrDefaultAsync(j => j.Id == message.JobId, cancellationToken);
        if (job == null) return;

        job.Status = "RUNNING";
        job.AssignedNodeId = message.NodeId;
        job.StartedAt = message.AssignedAt;

        await db.SaveChangesAsync(cancellationToken);
    }
}
