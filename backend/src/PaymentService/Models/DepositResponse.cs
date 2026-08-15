namespace PaymentService.Models;

public class DepositResponse
{
    public Guid TransactionId { get; set; }
    public long OrderCode { get; set; }
    public string TransferCode { get; set; } = string.Empty; // e.g. "o1wCm"
    public string QrCodeUrl { get; set; } = string.Empty;
    public string? CheckoutUrl { get; set; }
    public decimal AmountUsd { get; set; }
    public int AmountVnd { get; set; }
    public string Currency { get; set; } = "USD";
    public string Status { get; set; } = "PENDING";
    public string ReferenceCode { get; set; } = string.Empty;
    public string BankAccount { get; set; } = string.Empty;
    public string AccountName { get; set; } = string.Empty;
    public string BankName { get; set; } = "MB Bank";
}
