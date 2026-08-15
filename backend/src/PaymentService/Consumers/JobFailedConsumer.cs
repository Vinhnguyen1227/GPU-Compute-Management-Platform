using PaymentService.Services;
using Shared.Constants;
using Shared.Events;
using Shared.Messaging;

namespace PaymentService.Consumers;

public class JobFailedConsumer : KafkaConsumerBase<JobFailedEvent>
{
    private readonly IServiceScopeFactory _scopeFactory;

    public JobFailedConsumer(
        IConfiguration config,
        ILogger<JobFailedConsumer> logger,
        IServiceScopeFactory scopeFactory)
        : base(
            config["Kafka:BootstrapServers"] ?? "localhost:9092",
            "payment-service-job-failed-group",
            KafkaTopics.JobFailed,
            logger)
    {
        _scopeFactory = scopeFactory;
    }

    protected override async Task HandleMessageAsync(JobFailedEvent message, CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var billingEngine = scope.ServiceProvider.GetRequiredService<IBillingEngine>();
        await billingEngine.ProcessJobFailureAsync(message, cancellationToken);
    }
}
