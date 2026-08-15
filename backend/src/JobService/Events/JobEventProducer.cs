using Shared.Constants;
using Shared.Events;
using Shared.Messaging;

namespace JobService.Events;

public class JobEventProducer
{
    private readonly IKafkaProducer _kafkaProducer;

    public JobEventProducer(IKafkaProducer kafkaProducer)
    {
        _kafkaProducer = kafkaProducer;
    }

    public async Task PublishJobCreatedAsync(JobCreatedEvent @event, CancellationToken ct = default)
    {
        await _kafkaProducer.ProduceAsync(KafkaTopics.JobCreated, @event.JobId.ToString(), @event, ct);
    }

    public async Task PublishJobFailedAsync(JobFailedEvent @event, CancellationToken ct = default)
    {
        await _kafkaProducer.ProduceAsync(KafkaTopics.JobFailed, @event.JobId.ToString(), @event, ct);
    }
}
