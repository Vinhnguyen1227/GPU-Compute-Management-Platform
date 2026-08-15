using Shared.Constants;
using Shared.Events;
using Shared.Messaging;

namespace WorkerService.Services;

public class GpuSimulator
{
    private readonly ILogger<GpuSimulator> _logger;

    public GpuSimulator(ILogger<GpuSimulator> logger)
    {
        _logger = logger;
    }

    public async Task SimulateTrainingAsync(
        Guid jobId,
        Guid userId,
        string nodeId,
        string gpuType,
        decimal costPerHour,
        IKafkaProducer producer,
        CancellationToken ct)
    {
        int totalEpochs = 10;
        var random = new Random();

        _logger.LogInformation("Starting GPU training simulation for Job {JobId} on Node {NodeId} ({GpuType})",
            jobId, nodeId, gpuType);

        for (int epoch = 1; epoch <= totalEpochs; epoch++)
        {
            ct.ThrowIfCancellationRequested();

            // Simulate realistic epoch compute delay (3 to 6 seconds per epoch for smooth demo)
            await Task.Delay(TimeSpan.FromSeconds(random.Next(3, 7)), ct);

            int progress = (int)((double)epoch / totalEpochs * 100);
            double loss = Math.Max(0.01, 2.5 * Math.Exp(-0.35 * epoch) + (random.NextDouble() * 0.04 - 0.02));
            int gpuTemp = 65 + random.Next(0, 15);
            double vramUsed = 55 + random.NextDouble() * 20;

            // 5% simulated CUDA OOM failure after epoch 2
            if (epoch > 2 && random.NextDouble() < 0.05)
            {
                throw new InvalidOperationException($"CUDA out of memory. Tried to allocate {random.Next(2, 8)} GiB on {gpuType}");
            }

            var progressEvent = new JobProgressEvent
            {
                JobId = jobId,
                ProgressPercent = progress,
                CurrentEpoch = $"Epoch {epoch}/{totalEpochs}",
                LogSnippet = $"Loss: {loss:F4}, LR: 1.2e-5, GPU Temp: {gpuTemp}°C, VRAM: {vramUsed:F1}/80 GB",
                UpdatedAt = DateTime.UtcNow
            };

            await producer.ProduceAsync(KafkaTopics.JobProgress, jobId.ToString(), progressEvent, ct);

            var resourceEvent = new ResourceUpdatedEvent
            {
                NodeId = nodeId,
                Status = "BUSY",
                GpuUtilPercent = (decimal)(75 + random.NextDouble() * 20),
                UpdatedAt = DateTime.UtcNow
            };

            await producer.ProduceAsync(KafkaTopics.ResourceUpdated, nodeId, resourceEvent, ct);
        }
    }
}
