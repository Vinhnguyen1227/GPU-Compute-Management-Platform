using Shared.Events;

namespace PaymentService.Services;

public interface IBillingEngine
{
    Task ProcessJobCompletionAsync(JobCompletedEvent @event, CancellationToken ct = default);
    Task ProcessJobFailureAsync(JobFailedEvent @event, CancellationToken ct = default);
}
