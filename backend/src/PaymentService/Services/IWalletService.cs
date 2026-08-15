using PaymentService.Models;
using Shared.Models;

namespace PaymentService.Services;

public record WebhookProcessResult(bool Success, string Message);

public interface IWalletService
{
    Task<Wallet> GetOrCreateWalletAsync(Guid userId, CancellationToken ct = default);
    Task<DepositResponse> CreateDepositAsync(DepositRequest request, Guid userId, CancellationToken ct = default);
    Task<WebhookProcessResult> ProcessPayOSWebhookAsync(long orderCode, int receivedAmountVnd, CancellationToken ct = default);
    Task<bool> ProcessWebhookCallbackAsync(WebhookPayload payload, CancellationToken ct = default);
    Task<PaginatedResult<TransactionDto>> GetTransactionsAsync(Guid userId, string? type = null, int page = 1, int pageSize = 20, CancellationToken ct = default);
    Task<PaginatedResult<ResourceUsage>> GetResourceUsagesAsync(Guid userId, int page = 1, int pageSize = 20, CancellationToken ct = default);
}
