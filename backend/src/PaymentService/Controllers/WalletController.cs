using Microsoft.AspNetCore.Mvc;
using PaymentService.Models;
using PaymentService.Services;
using Shared.Models;

namespace PaymentService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WalletController : ControllerBase
{
    private readonly IWalletService _walletService;

    public WalletController(IWalletService walletService)
    {
        _walletService = walletService;
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirst("sub")?.Value;
        if (Guid.TryParse(claim, out var userId)) return userId;
        return Guid.Parse("11111111-1111-1111-1111-111111111111");
    }

    [HttpGet]
    public async Task<IActionResult> GetWallet(CancellationToken ct)
    {
        var userId = GetUserId();
        var wallet = await _walletService.GetOrCreateWalletAsync(userId, ct);
        return Ok(ApiResponse<object>.Ok(new { balance = wallet.Balance, currency = wallet.Currency }));
    }

    [HttpPost("deposit")]
    public async Task<IActionResult> Deposit([FromBody] DepositRequest request, CancellationToken ct)
    {
        var userId = GetUserId();
        var response = await _walletService.CreateDepositAsync(request, userId, ct);
        return Ok(ApiResponse<DepositResponse>.Ok(response, "Deposit transaction initialized"));
    }
}
