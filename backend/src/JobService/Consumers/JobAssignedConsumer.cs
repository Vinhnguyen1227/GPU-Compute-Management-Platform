using JobService.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Shared.Constants;
using Shared.Events;
using Shared.Messaging;

namespace JobService.Consumers;

public class JobAssignedConsumer : KafkaConsumerBase<JobAssignedEvent>
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<JobAssignedConsumer> _logger;

    public JobAssignedConsumer(
        IConfiguration config,
        IServiceScopeFactory scopeFactory,
        ILogger<JobAssignedConsumer> logger)
        : base(
            config["KAFKA_BOOTSTRAP_SERVERS"] ?? config["Kafka:BootstrapServers"] ?? "localhost:9092",
            "job-service-assigned-group",
            KafkaTopics.JobAssigned,
            logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task HandleMessageAsync(JobAssignedEvent message, CancellationToken cancellationToken)
    {
        _logger.LogInformation("JobAssignedConsumer received assignment: JobId={JobId}, NodeId={NodeId}", message.JobId, message.NodeId);

        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<JobDbContext>();

        var job = await dbContext.TrainingJobs.FirstOrDefaultAsync(j => j.Id == message.JobId, cancellationToken);
        if (job != null)
        {
            job.Status = "RUNNING";
            job.AssignedNodeId = message.NodeId;
            job.StartedAt = message.AssignedAt;

            await dbContext.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Job {JobId} status updated to RUNNING on node {NodeId}", message.JobId, message.NodeId);
        }
        else
        {
            _logger.LogWarning("Job {JobId} not found when handling JobAssignedEvent", message.JobId);
        }
    }
}
