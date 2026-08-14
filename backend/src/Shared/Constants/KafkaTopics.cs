namespace Shared.Constants;

public static class KafkaTopics
{
    public const string JobCreated = "job.created";
    public const string JobAssigned = "job.assigned";
    public const string JobProgress = "job.progress";
    public const string JobCompleted = "job.completed";
    public const string JobFailed = "job.failed";
    public const string ResourceUpdated = "resource.updated";
    public const string PaymentCompleted = "payment.completed";
}
