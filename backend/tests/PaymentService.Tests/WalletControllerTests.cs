using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using PaymentService.Controllers;
using PaymentService.Data;
using Shared.Models;
using Xunit;

namespace PaymentService.Tests;

public class WalletControllerTests
{
    private PaymentDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<PaymentDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new PaymentDbContext(options);
    }

    [Fact]
    public async Task InitializeWallet_ShouldAddWalletAndPromoTransaction()
    {
        // Arrange
        using var context = GetInMemoryDbContext();
        var controller = new WalletController(context, NullLogger<WalletController>.Instance);
        var userId = Guid.NewGuid();

        var request = new InitWalletRequest(userId, 100000m);

        // Act
        var actionResult = await controller.InitializeWallet(request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
        var apiResponse = Assert.IsType<ApiResponse<bool>>(okResult.Value);
        Assert.True(apiResponse.Data);

        var wallet = await context.Wallets.FirstOrDefaultAsync(w => w.UserId == userId);
        Assert.NotNull(wallet);
        Assert.Equal(100000m, wallet.Balance);

        var tx = await context.PaymentTransactions.FirstOrDefaultAsync(t => t.UserId == userId);
        Assert.NotNull(tx);
        Assert.Equal(100000m, tx.Amount);
    }

    [Fact]
    public async Task AdminAdjustBalance_ShouldModifyWalletAndCreateLedgerEntry()
    {
        // Arrange
        using var context = GetInMemoryDbContext();
        var controller = new WalletController(context, NullLogger<WalletController>.Instance);

        var adminId = Guid.NewGuid();
        var targetUserId = Guid.NewGuid();

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, adminId.ToString()),
            new Claim(ClaimTypes.Role, "ADMIN")
        };
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"))
            }
        };

        var request = new AdminAdjustCreditRequest(targetUserId, 50000m, "Promo Bonus");

        // Act
        var actionResult = await controller.AdminAdjustBalance(request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
        var apiResponse = Assert.IsType<ApiResponse<WalletDto>>(okResult.Value);
        Assert.Equal(50000m, apiResponse.Data?.Balance);

        var ledger = await context.LedgerEntries.FirstOrDefaultAsync(l => l.UserId == targetUserId);
        Assert.NotNull(ledger);
        Assert.Equal(50000m, ledger.Credit);
    }
}
