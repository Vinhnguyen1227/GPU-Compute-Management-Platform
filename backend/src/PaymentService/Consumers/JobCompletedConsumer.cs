using PaymentService.Services;
using Shared.Constants;
using Shared.Events;
using Shared.Messaging;

namespace PaymentService.Consumers;

public class JobCompletedConsumer : KafkaConsumerBase<JobCompletedEvent>
{
    private readonly IServiceScopeFactory _scopeFactory;

    public JobCompletedConsumer(
        IConfiguration config,
        ILogger<JobCompletedConsumer> logger,
        IServiceScopeFactory scopeFactory)
        : base(
            config["KAFKA_BOOTSTRAP_SERVERS"] ?? config["Kafka:BootstrapServers"] ?? "localhost:9092",
            "payment-service-job-completed-group",
            KafkaTopics.JobCompleted,
            logger)
    {
        _scopeFactory = scopeFactory;
    }

    protected override async Task HandleMessageAsync(JobCompletedEvent message, CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var billingEngine = scope.ServiceProvider.GetRequiredService<IBillingEngine>();
        await billingEngine.ProcessJobCompletionAsync(message, cancellationToken);
    }
}
