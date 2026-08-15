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

    public async Task PublishJobCreatedAsync(JobCreatedEvent eventData, CancellationToken cancellationToken = default)
    {
        await _kafkaProducer.ProduceAsync(KafkaTopics.JobCreated, eventData.JobId.ToString(), eventData, cancellationToken);
    }
}
