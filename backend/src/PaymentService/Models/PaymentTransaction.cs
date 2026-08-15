namespace PaymentService.Models;

public class PaymentTransaction
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string TransactionType { get; set; } = string.Empty; // DEPOSIT | GPU_USAGE | REFUND
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "USD";
    public string Status { get; set; } = "PENDING"; // PENDING | SUCCESS | FAILED
    public string? PaymentMethod { get; set; } // VietQR | VNPay | MoMo | System
    public string? ReferenceCode { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
