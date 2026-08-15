namespace PaymentService.Models;

public class DepositRequest
{
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = "VietQR"; // VietQR | VNPay | MoMo
}
