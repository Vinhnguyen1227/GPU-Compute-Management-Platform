namespace PaymentService.Services;

public interface IPaymentGateway
{
    string GenerateQrUrl(decimal amount, string referenceCode, string paymentMethod);
    string ComputeSignature(string data);
    bool VerifySignature(string data, string? signature);
    Task SimulateCallbackAsync(string referenceCode, decimal amount, CancellationToken ct = default);
}
