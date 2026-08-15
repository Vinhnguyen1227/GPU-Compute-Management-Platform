using Microsoft.AspNetCore.Mvc;
using PaymentService.Models;
using PaymentService.Services;
using Shared.Models;

namespace PaymentService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WebhookController : ControllerBase
{
    private readonly IWalletService _walletService;
    private readonly IPayOSService _payOSService;
    private readonly ILogger<WebhookController> _logger;

    public WebhookController(
        IWalletService walletService,
        IPayOSService payOSService,
        ILogger<WebhookController> logger)
    {
        _walletService = walletService;
        _payOSService = payOSService;
        _logger = logger;
    }

    /// <summary>
    /// Official PayOS Webhook receiver endpoint.
    /// URL: POST /api/webhook/payos
    /// </summary>
    [HttpPost("payos")]
    public async Task<IActionResult> PayOSWebhook([FromBody] PayOSWebhookPayload payload, CancellationToken ct)
    {
        _logger.LogInformation("Received PayOS webhook: Code={Code}, OrderCode={OrderCode}, Amount={Amount}, Desc={Description}",
            payload?.Code, payload?.Data?.OrderCode, payload?.Data?.Amount, payload?.Data?.Description);

        if (payload?.Data == null)
        {
            return BadRequest(new { success = false, message = "Missing webhook payload data" });
        }

        // 1. Verify Checksum Signature using PayOS Checksum Key
        var isSignatureValid = _payOSService.VerifyWebhookSignature(payload);
        if (!isSignatureValid)
        {
            _logger.LogWarning("PayOS Webhook rejected: Invalid HMAC signature for Order #{OrderCode}", payload.Data.OrderCode);
            return BadRequest(new { success = false, message = "Invalid webhook signature" });
        }

        // 2. Verify success status
        if (payload.Code != "00" && payload.Desc != "success")
        {
            _logger.LogInformation("PayOS Webhook status non-success: Code={Code}, Desc={Desc}", payload.Code, payload.Desc);
            return Ok(new { success = true, message = "Ignored non-success status" });
        }

        // 3. Process Webhook with strict idempotency & amount checking
        var result = await _walletService.ProcessPayOSWebhookAsync(payload.Data.OrderCode, payload.Data.Amount, ct);

        if (!result.Success)
        {
            _logger.LogWarning("PayOS Webhook processing failed: {Reason}", result.Message);
            return Ok(new { success = false, message = result.Message });
        }

        return Ok(new { success = true, message = "Payment verified and credited" });
    }

    /// <summary>
    /// Generic webhook callback for custom bank simulations.
    /// URL: POST /api/webhook/payment-callback
    /// </summary>
    [HttpPost("payment-callback")]
    public async Task<IActionResult> PaymentCallback([FromBody] WebhookPayload payload, CancellationToken ct)
    {
        _logger.LogInformation("Received payment callback for ref {ReferenceCode}", payload.ReferenceCode);

        var success = await _walletService.ProcessWebhookCallbackAsync(payload, ct);
        if (!success)
        {
            return NotFound(ApiResponse<string>.Fail("Transaction reference not found"));
        }

        return Ok(ApiResponse<string>.Ok("Callback processed successfully"));
    }
}
