using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using ResourceService.Services;
using Shared.Constants;
using Shared.Events;
using Shared.Messaging;

namespace ResourceService.Consumers;

public class JobCreatedConsumer : KafkaConsumerBase<JobCreatedEvent>
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IKafkaProducer _kafkaProducer;
    private readonly ILogger<JobCreatedConsumer> _logger;

    public JobCreatedConsumer(
        string bootstrapServers,
        IServiceScopeFactory scopeFactory,
        IKafkaProducer kafkaProducer,
        ILogger<JobCreatedConsumer> logger)
        : base(bootstrapServers, "resource-service-created-group", KafkaTopics.JobCreated, logger)
    {
        _scopeFactory = scopeFactory;
        _kafkaProducer = kafkaProducer;
        _logger = logger;
    }

    protected override async Task HandleMessageAsync(JobCreatedEvent message, CancellationToken cancellationToken)
    {
        _logger.LogInformation("JobCreatedConsumer received job submission: JobId={JobId}, GpuType={GpuType}", message.JobId, message.GpuType);

        using var scope = _scopeFactory.CreateScope();
        var schedulerService = scope.ServiceProvider.GetRequiredService<SchedulerService>();

        var assignedNode = await schedulerService.TryAssignGpuAsync(message.JobId, message.JobName, message.GpuType, cancellationToken);

        if (assignedNode != null)
        {
            _logger.LogInformation("Assigned GPU Node {NodeId} to Job {JobId}", assignedNode.Id, message.JobId);

            var assignedEvent = new JobAssignedEvent
            {
                JobId = message.JobId,
                NodeId = assignedNode.Id,
                NodeName = assignedNode.Name,
                AssignedAt = DateTime.UtcNow
            };

            await _kafkaProducer.ProduceAsync(KafkaTopics.JobAssigned, message.JobId.ToString(), assignedEvent, cancellationToken);
        }
        else
        {
            _logger.LogWarning("No GPU node available for Job {JobId}. Job remains in QUEUED status.", message.JobId);
        }
    }
}
