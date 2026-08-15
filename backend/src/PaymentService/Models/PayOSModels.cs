using System.Text.Json.Serialization;

namespace PaymentService.Models;

public class CreatePaymentLinkRequest
{
    [JsonPropertyName("orderCode")]
    public long OrderCode { get; set; }

    [JsonPropertyName("amount")]
    public int Amount { get; set; }

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("cancelUrl")]
    public string CancelUrl { get; set; } = string.Empty;

    [JsonPropertyName("returnUrl")]
    public string ReturnUrl { get; set; } = string.Empty;

    [JsonPropertyName("signature")]
    public string Signature { get; set; } = string.Empty;
}

public class PayOSResponse<T>
{
    [JsonPropertyName("code")]
    public string Code { get; set; } = string.Empty;

    [JsonPropertyName("desc")]
    public string Desc { get; set; } = string.Empty;

    [JsonPropertyName("data")]
    public T? Data { get; set; }

    [JsonPropertyName("signature")]
    public string? Signature { get; set; }
}

public class PayOSPaymentLinkData
{
    [JsonPropertyName("bin")]
    public string Bin { get; set; } = string.Empty;

    [JsonPropertyName("accountNumber")]
    public string AccountNumber { get; set; } = string.Empty;

    [JsonPropertyName("accountName")]
    public string AccountName { get; set; } = string.Empty;

    [JsonPropertyName("amount")]
    public int Amount { get; set; }

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("orderCode")]
    public long OrderCode { get; set; }

    [JsonPropertyName("currency")]
    public string Currency { get; set; } = "VND";

    [JsonPropertyName("paymentLinkId")]
    public string PaymentLinkId { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("checkoutUrl")]
    public string CheckoutUrl { get; set; } = string.Empty;

    [JsonPropertyName("qrCode")]
    public string QrCode { get; set; } = string.Empty;
}

public class PayOSWebhookData
{
    [JsonPropertyName("orderCode")]
    public long OrderCode { get; set; }

    [JsonPropertyName("amount")]
    public int Amount { get; set; }

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("accountNumber")]
    public string AccountNumber { get; set; } = string.Empty;

    [JsonPropertyName("reference")]
    public string Reference { get; set; } = string.Empty;

    [JsonPropertyName("transactionDateTime")]
    public string TransactionDateTime { get; set; } = string.Empty;

    [JsonPropertyName("currency")]
    public string Currency { get; set; } = "VND";

    [JsonPropertyName("paymentLinkId")]
    public string PaymentLinkId { get; set; } = string.Empty;

    [JsonPropertyName("code")]
    public string Code { get; set; } = string.Empty;

    [JsonPropertyName("desc")]
    public string Desc { get; set; } = string.Empty;
}

public class PayOSWebhookPayload
{
    [JsonPropertyName("code")]
    public string Code { get; set; } = string.Empty;

    [JsonPropertyName("desc")]
    public string Desc { get; set; } = string.Empty;

    [JsonPropertyName("data")]
    public PayOSWebhookData? Data { get; set; }

    [JsonPropertyName("signature")]
    public string? Signature { get; set; }
}
