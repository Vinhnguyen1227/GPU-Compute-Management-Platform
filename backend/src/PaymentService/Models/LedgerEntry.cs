namespace PaymentService.Models;

public class LedgerEntry
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public decimal Debit { get; set; }
    public decimal Credit { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
