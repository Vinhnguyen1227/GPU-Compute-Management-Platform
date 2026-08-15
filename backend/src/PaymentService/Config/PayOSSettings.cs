namespace PaymentService.Config;

public class PayOSSettings
{
    public string ClientId { get; set; } = Environment.GetEnvironmentVariable("PAYOS_CLIENT_ID") ?? string.Empty;
    public string ApiKey { get; set; } = Environment.GetEnvironmentVariable("PAYOS_API_KEY") ?? string.Empty;
    public string ChecksumKey { get; set; } = Environment.GetEnvironmentVariable("PAYOS_CHECKSUM_KEY") ?? string.Empty;
    public string BankId { get; set; } = "970422"; // MB Bank BIN
    public string AccountNo { get; set; } = "0932296788";
    public string AccountName { get; set; } = "HOANG ANH TUAN";
    public string Template { get; set; } = "compact2";
    public decimal VndExchangeRate { get; set; } = 25000m; // 1 USD = 25,000 VND
}
