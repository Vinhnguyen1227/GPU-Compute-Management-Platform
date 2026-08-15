namespace PaymentService.Models;

public class ResourcePricing
{
    public string ResourceType { get; set; } = string.Empty; // Primary Key
    public decimal PricePerHour { get; set; }
}
