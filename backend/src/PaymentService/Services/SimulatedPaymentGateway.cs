using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using PaymentService.Models;

namespace PaymentService.Services;

public class SimulatedPaymentGateway : IPaymentGateway
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _config;
    private readonly ILogger<SimulatedPaymentGateway> _logger;

    public SimulatedPaymentGateway(
        IHttpClientFactory httpClientFactory,
        IConfiguration config,
        ILogger<SimulatedPaymentGateway> logger)
    {
        _httpClientFactory = httpClientFactory;
        _config = config;
        _logger = logger;
    }

    public string GenerateQrUrl(decimal amount, string referenceCode, string paymentMethod)
    {
        var bankId = _config["VietQR:BankId"] ?? "970422";
        var accountNo = _config["VietQR:AccountNo"] ?? "1234567890";
        var template = _config["VietQR:Template"] ?? "compact";

        // Generate VietQR format url
        return $"https://img.vietqr.io/image/{bankId}-{accountNo}-{template}.png?amount={amount:F0}&addInfo={Uri.EscapeDataString(referenceCode)}";
    }

    public string ComputeSignature(string data)
    {
        var secret = _config["VietQR:WebhookSecret"] ?? "vietqr_sandbox_secret_key";
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        return Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(data)));
    }

    public bool VerifySignature(string data, string? signature)
    {
        if (string.IsNullOrWhiteSpace(signature)) return false;
        var expected = ComputeSignature(data);
        return string.Equals(expected, signature, StringComparison.OrdinalIgnoreCase);
    }

    public async Task SimulateCallbackAsync(string referenceCode, decimal amount, CancellationToken ct = default)
    {
        var delayMs = _config.GetValue<int>("VietQR:SimulateDelayMs", 5000);
        _logger.LogInformation("Payment simulation triggered for {ReferenceCode}. Awaiting {DelayMs}ms...", referenceCode, delayMs);

        await Task.Delay(delayMs, ct);

        try
        {
            var client = _httpClientFactory.CreateClient();
            var payload = new WebhookPayload
            {
                ReferenceCode = referenceCode,
                Status = "SUCCESS",
                Amount = amount,
                Signature = ComputeSignature(referenceCode)
            };

            var callbackUrl = _config["Payment:CallbackUrl"] ?? "http://localhost:5006/api/webhook/payment-callback";
            var response = await client.PostAsJsonAsync(callbackUrl, payload, ct);
            _logger.LogInformation("Simulated webhook callback sent to {Url}, Status: {StatusCode}", callbackUrl, response.StatusCode);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send simulated webhook callback for {ReferenceCode}", referenceCode);
        }
    }
}
