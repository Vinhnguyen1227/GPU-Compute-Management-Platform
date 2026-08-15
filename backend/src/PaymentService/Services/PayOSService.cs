using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using PaymentService.Config;
using PaymentService.Models;

namespace PaymentService.Services;

public class PayOSService : IPayOSService
{
    private readonly HttpClient _httpClient;
    private readonly PayOSSettings _settings;
    private readonly ILogger<PayOSService> _logger;

    public PayOSService(
        HttpClient httpClient,
        IOptions<PayOSSettings> settings,
        ILogger<PayOSService> logger)
    {
        _httpClient = httpClient;
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task<PayOSPaymentLinkData?> CreatePaymentLinkAsync(
        long orderCode,
        int amountVnd,
        string transferCode,
        CancellationToken ct = default)
    {
        var cancelUrl = "http://localhost:3000/billing";
        var returnUrl = "http://localhost:3000/billing";
        var description = transferCode.Length > 25 ? transferCode[..25] : transferCode;

        // PayOS signature format: amount={amount}&cancelUrl={cancelUrl}&description={description}&orderCode={orderCode}&returnUrl={returnUrl}
        var dataToSign = $"amount={amountVnd}&cancelUrl={cancelUrl}&description={description}&orderCode={orderCode}&returnUrl={returnUrl}";
        var signature = ComputeHmacSha256(dataToSign, _settings.ChecksumKey);

        var requestBody = new CreatePaymentLinkRequest
        {
            OrderCode = orderCode,
            Amount = amountVnd,
            Description = description,
            CancelUrl = cancelUrl,
            ReturnUrl = returnUrl,
            Signature = signature
        };

        var request = new HttpRequestMessage(HttpMethod.Post, "https://api-merchant.payos.vn/v2/payment-requests")
        {
            Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json")
        };

        request.Headers.Add("x-client-id", _settings.ClientId);
        request.Headers.Add("x-api-key", _settings.ApiKey);

        try
        {
            var response = await _httpClient.SendAsync(request, ct);
            var json = await response.Content.ReadAsStringAsync(ct);

            _logger.LogInformation("PayOS create payment link response: {Json}", json);

            var result = JsonSerializer.Deserialize<PayOSResponse<PayOSPaymentLinkData>>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (result != null && result.Code == "00")
            {
                return result.Data;
            }

            _logger.LogWarning("PayOS returned error: Code={Code}, Desc={Desc}", result?.Code, result?.Desc);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to call PayOS API for orderCode {OrderCode}", orderCode);
        }

        // Return fallback data if API is unreachable
        return new PayOSPaymentLinkData
        {
            Bin = _settings.BankId,
            AccountNumber = _settings.AccountNo,
            AccountName = _settings.AccountName,
            Amount = amountVnd,
            Description = transferCode,
            OrderCode = orderCode,
            Currency = "VND",
            CheckoutUrl = $"https://pay.payos.vn/web/{orderCode}",
            QrCode = GenerateDirectVietQrUrl(amountVnd, transferCode)
        };
    }

    public string GenerateDirectVietQrUrl(int amountVnd, string transferCode)
    {
        var accountNameEscaped = Uri.EscapeDataString(_settings.AccountName);
        var transferCodeEscaped = Uri.EscapeDataString(transferCode);
        return $"https://img.vietqr.io/image/{_settings.BankId}-{_settings.AccountNo}-{_settings.Template}.png?amount={amountVnd}&addInfo={transferCodeEscaped}&accountName={accountNameEscaped}";
    }

    public bool VerifyWebhookSignature(PayOSWebhookPayload payload)
    {
        if (payload?.Data == null || string.IsNullOrWhiteSpace(payload.Signature))
            return false;

        var d = payload.Data;
        // Data format sorted: amount={amount}&code={code}&desc={desc}&description={description}&orderCode={orderCode}&reference={reference}&transactionDateTime={transactionDateTime}
        var dataToSign = $"amount={d.Amount}&code={d.Code}&desc={d.Desc}&description={d.Description}&orderCode={d.OrderCode}&reference={d.Reference}&transactionDateTime={d.TransactionDateTime}";
        var expected = ComputeHmacSha256(dataToSign, _settings.ChecksumKey);

        return string.Equals(expected, payload.Signature, StringComparison.OrdinalIgnoreCase);
    }

    private static string ComputeHmacSha256(string data, string key)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(key));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }
}
