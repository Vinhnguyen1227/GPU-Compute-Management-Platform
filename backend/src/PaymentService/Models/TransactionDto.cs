using System.Text.Json.Serialization;

namespace PaymentService.Models;

public class TransactionDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    
    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;
    
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "USD";
    public string Status { get; set; } = "PENDING";
    public string? PaymentMethod { get; set; }
    public string? ReferenceCode { get; set; }
    public string? Description { get; set; }
    
    [JsonPropertyName("timestamp")]
    public string Timestamp { get; set; } = string.Empty;
}
