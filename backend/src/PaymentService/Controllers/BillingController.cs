using Microsoft.AspNetCore.Mvc;
using PaymentService.Models;
using PaymentService.Services;
using Shared.Models;

namespace PaymentService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BillingController : ControllerBase
{
    private readonly IWalletService _walletService;

    public BillingController(IWalletService walletService)
    {
        _walletService = walletService;
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirst("sub")?.Value;
        if (Guid.TryParse(claim, out var userId)) return userId;
        return Guid.Parse("11111111-1111-1111-1111-111111111111");
    }

    [HttpGet("usage")]
    public async Task<IActionResult> GetUsage(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var userId = GetUserId();
        var result = await _walletService.GetResourceUsagesAsync(userId, page, pageSize, ct);
        return Ok(ApiResponse<PaginatedResult<ResourceUsage>>.Ok(result));
    }
}
