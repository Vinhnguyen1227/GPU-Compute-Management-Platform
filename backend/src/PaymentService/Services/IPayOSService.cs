using PaymentService.Models;

namespace PaymentService.Services;

public interface IPayOSService
{
    Task<PayOSPaymentLinkData?> CreatePaymentLinkAsync(long orderCode, int amountVnd, string transferCode, CancellationToken ct = default);
    string GenerateDirectVietQrUrl(int amountVnd, string transferCode);
    bool VerifyWebhookSignature(PayOSWebhookPayload payload);
}
