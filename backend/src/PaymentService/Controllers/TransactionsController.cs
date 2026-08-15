using Microsoft.AspNetCore.Mvc;
using PaymentService.Models;
using PaymentService.Services;
using Shared.Models;

namespace PaymentService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TransactionsController : ControllerBase
{
    private readonly IWalletService _walletService;

    public TransactionsController(IWalletService walletService)
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
    public async Task<IActionResult> GetTransactions(
        [FromQuery] string? type = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var userId = GetUserId();
        var result = await _walletService.GetTransactionsAsync(userId, type, page, pageSize, ct);
        return Ok(ApiResponse<PaginatedResult<TransactionDto>>.Ok(result));
    }
}
