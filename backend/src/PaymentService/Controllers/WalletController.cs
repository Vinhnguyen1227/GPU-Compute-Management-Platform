using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PaymentService.Data;
using PaymentService.Models;
using Shared.Models;

namespace PaymentService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WalletController : ControllerBase
{
    private readonly PaymentDbContext _db;
    private readonly ILogger<WalletController> _logger;

    public WalletController(PaymentDbContext db, ILogger<WalletController> logger)
    {
        _db = db;
        _logger = logger;
    }

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<ApiResponse<WalletDto>>> GetWallet()
    {
        var userId = GetUserId();
        if (userId == Guid.Empty)
        {
            return Unauthorized(ApiResponse<WalletDto>.Fail("Unauthorized"));
        }

        var wallet = await _db.Wallets.FirstOrDefaultAsync(w => w.UserId == userId);
        if (wallet == null)
        {
            wallet = new Wallet
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Balance = 0m,
                Currency = "VND",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _db.Wallets.Add(wallet);
            await _db.SaveChangesAsync();
        }

        return Ok(ApiResponse<WalletDto>.Ok(new WalletDto(wallet.Id, wallet.UserId, wallet.Balance, wallet.Currency)));
    }

    [HttpPost("internal/init")]
    public async Task<ActionResult<ApiResponse<bool>>> InitializeWallet([FromBody] InitWalletRequest request)
    {
        var existing = await _db.Wallets.FirstOrDefaultAsync(w => w.UserId == request.UserId);
        if (existing != null)
        {
            return Ok(ApiResponse<bool>.Ok(true, "Wallet already exists"));
        }

        var wallet = new Wallet
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            Balance = request.InitialBalance,
            Currency = "VND",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _db.Wallets.Add(wallet);

        if (request.InitialBalance > 0)
        {
            var tx = new PaymentTransaction
            {
                Id = Guid.NewGuid(),
                UserId = request.UserId,
                TransactionType = "DEPOSIT",
                Amount = request.InitialBalance,
                Currency = "VND",
                Status = "SUCCESS",
                PaymentMethod = "System",
                ReferenceCode = $"PROMO-WELCOME-{request.UserId.ToString()[..6]}",
                Description = "Tặng 100.000₫ số dư chào mừng thành viên mới",
                CreatedAt = DateTime.UtcNow
            };
            _db.PaymentTransactions.Add(tx);
        }

        await _db.SaveChangesAsync();
        return Ok(ApiResponse<bool>.Ok(true, "Wallet initialized with welcome bonus"));
    }

    [HttpPost("admin/credit")]
    [Authorize(Roles = "ADMIN")]
    public async Task<ActionResult<ApiResponse<WalletDto>>> AdminAdjustBalance([FromBody] AdminAdjustCreditRequest request)
    {
        var wallet = await _db.Wallets.FirstOrDefaultAsync(w => w.UserId == request.UserId);
        if (wallet == null)
        {
            wallet = new Wallet
            {
                Id = Guid.NewGuid(),
                UserId = request.UserId,
                Balance = Math.Max(0, request.Amount),
                Currency = "VND",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _db.Wallets.Add(wallet);
        }
        else
        {
            wallet.Balance = Math.Max(0, wallet.Balance + request.Amount);
            wallet.UpdatedAt = DateTime.UtcNow;
        }

        var tx = new PaymentTransaction
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            TransactionType = "ADMIN_ADJUSTMENT",
            Amount = request.Amount,
            Currency = "VND",
            Status = "SUCCESS",
            PaymentMethod = "Admin",
            ReferenceCode = $"ADM-{Guid.NewGuid().ToString()[..8]}",
            Description = request.Reason ?? $"Điều chỉnh số dư ví từ Quản trị viên ({request.Amount:N0}₫)",
            CreatedAt = DateTime.UtcNow
        };
        _db.PaymentTransactions.Add(tx);

        var ledger = new LedgerEntry
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            Debit = request.Amount < 0 ? Math.Abs(request.Amount) : 0,
            Credit = request.Amount > 0 ? request.Amount : 0,
            Description = $"Admin balance adjustment: {request.Reason}",
            CreatedAt = DateTime.UtcNow
        };
        _db.LedgerEntries.Add(ledger);

        await _db.SaveChangesAsync();
        return Ok(ApiResponse<WalletDto>.Ok(new WalletDto(wallet.Id, wallet.UserId, wallet.Balance, wallet.Currency), "Balance adjusted"));
    }

    [HttpGet("billing/analytics")]
    [Authorize(Roles = "ADMIN")]
    public async Task<ActionResult<ApiResponse<RevenueAnalyticsDto>>> GetRevenueAnalytics()
    {
        var totalDeposits = await _db.PaymentTransactions
            .Where(t => t.TransactionType == "DEPOSIT" && t.Status == "SUCCESS")
            .SumAsync(t => t.Amount);

        var totalComputeBilled = await _db.PaymentTransactions
            .Where(t => t.TransactionType == "GPU_USAGE" && t.Status == "SUCCESS")
            .SumAsync(t => Math.Abs(t.Amount));

        return Ok(ApiResponse<RevenueAnalyticsDto>.Ok(new RevenueAnalyticsDto(
            totalDeposits,
            totalComputeBilled,
            totalDeposits - totalComputeBilled
        )));
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        return Guid.TryParse(claim, out var id) ? id : Guid.Empty;
    }
}

public record WalletDto(Guid Id, Guid UserId, decimal Balance, string Currency);
public record InitWalletRequest(Guid UserId, decimal InitialBalance);
public record AdminAdjustCreditRequest(Guid UserId, decimal Amount, string? Reason);
public record RevenueAnalyticsDto(decimal TotalDeposits, decimal TotalComputeBilled, decimal GrossMargin);
