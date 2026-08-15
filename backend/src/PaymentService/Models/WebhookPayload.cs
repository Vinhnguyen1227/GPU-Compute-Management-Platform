namespace PaymentService.Models;

public class WebhookPayload
{
    public string ReferenceCode { get; set; } = string.Empty;
    public string Status { get; set; } = "SUCCESS"; // SUCCESS | FAILED
    public decimal Amount { get; set; }
    public string? Signature { get; set; }
}
