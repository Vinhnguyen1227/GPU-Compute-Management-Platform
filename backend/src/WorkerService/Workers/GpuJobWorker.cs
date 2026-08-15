using Shared.Constants;
using Shared.Events;
using Shared.Messaging;
using WorkerService.Services;

namespace WorkerService.Workers;

public class GpuJobWorker : KafkaConsumerBase<JobAssignedEvent>
{
    private readonly IKafkaProducer _producer;
    private readonly GpuSimulator _simulator;
    private readonly ILogger<GpuJobWorker> _logger;

    public GpuJobWorker(
        IConfiguration config,
        ILogger<GpuJobWorker> logger,
        IKafkaProducer producer,
        GpuSimulator simulator)
        : base(
            config["Kafka:BootstrapServers"] ?? "localhost:9092",
            "worker-gpu-group",
            KafkaTopics.JobAssigned,
            logger)
    {
        _producer = producer;
        _simulator = simulator;
        _logger = logger;
    }

    protected override async Task HandleMessageAsync(JobAssignedEvent message, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Received JobAssignedEvent for JobId: {JobId} on Node: {NodeId}", message.JobId, message.NodeId);

        var startTime = DateTime.UtcNow;

        try
        {
            await _simulator.SimulateTrainingAsync(
                message.JobId,
                Guid.Empty,
                message.NodeId,
                "NVIDIA A100 (80GB)",
                2.00m,
                _producer,
                cancellationToken);

            var duration = (DateTime.UtcNow - startTime).TotalHours;
            var completedEvent = new JobCompletedEvent
            {
                JobId = message.JobId,
                UserId = Guid.Empty,
                NodeId = message.NodeId,
                GpuType = "NVIDIA A100 (80GB)",
                ActualDurationHours = duration,
                FinalCost = Math.Round((decimal)duration * 2.00m, 2),
                CompletedAt = DateTime.UtcNow
            };

            await _producer.ProduceAsync(KafkaTopics.JobCompleted, message.JobId.ToString(), completedEvent, cancellationToken);
            _logger.LogInformation("Job {JobId} completed successfully. Published JobCompletedEvent.", message.JobId);
        }
        catch (Exception ex)
        {
            var duration = (DateTime.UtcNow - startTime).TotalHours;
            _logger.LogError(ex, "Job {JobId} failed during execution: {Reason}", message.JobId, ex.Message);

            var failedEvent = new JobFailedEvent
            {
                JobId = message.JobId,
                UserId = Guid.Empty,
                NodeId = message.NodeId,
                Reason = ex.Message,
                PartialDurationHours = duration,
                FailedAt = DateTime.UtcNow
            };

            await _producer.ProduceAsync(KafkaTopics.JobFailed, message.JobId.ToString(), failedEvent, cancellationToken);
        }
    }
}
