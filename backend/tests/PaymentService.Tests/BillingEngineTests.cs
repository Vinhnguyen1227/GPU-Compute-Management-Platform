using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using PaymentService.Data;
using PaymentService.Models;
using PaymentService.Services;
using Shared.Events;
using Xunit;

namespace PaymentService.Tests;

public class BillingEngineTests
{
    private PaymentDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<PaymentDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var context = new PaymentDbContext(options);

        context.ResourcePricings.AddRange(
            new ResourcePricing { ResourceType = "NVIDIA A100 (80GB)", PricePerHour = 2.00m },
            new ResourcePricing { ResourceType = "NVIDIA H100 (80GB)", PricePerHour = 4.50m }
        );

        context.SaveChanges();
        return context;
    }

    [Fact]
    public async Task ProcessJobCompletionAsync_ShouldDeductWalletAndCreateLedgerEntry()
    {
        // Arrange
        using var context = GetInMemoryDbContext();
        var userId = Guid.NewGuid();

        var wallet = new Wallet
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Balance = 100.00m,
            Currency = "USD"
        };
        context.Wallets.Add(wallet);
        context.SaveChanges();

        var billingEngine = new BillingEngine(context, NullLogger<BillingEngine>.Instance);

        var completedEvent = new JobCompletedEvent
        {
            JobId = Guid.NewGuid(),
            UserId = userId,
            NodeId = "node-h100-01",
            GpuType = "NVIDIA H100 (80GB)",
            ActualDurationHours = 2.0, // 2.0h * $4.50 = $9.00
            FinalCost = 9.00m,
            CompletedAt = DateTime.UtcNow
        };

        // Act
        await billingEngine.ProcessJobCompletionAsync(completedEvent);

        // Assert
        var updatedWallet = await context.Wallets.FirstOrDefaultAsync(w => w.UserId == userId);
        Assert.NotNull(updatedWallet);
        Assert.Equal(91.00m, updatedWallet.Balance); // $100 - $9 = $91

        var ledger = await context.LedgerEntries.FirstOrDefaultAsync(l => l.UserId == userId);
        Assert.NotNull(ledger);
        Assert.Equal(9.00m, ledger.Debit);

        var tx = await context.PaymentTransactions.FirstOrDefaultAsync(t => t.UserId == userId);
        Assert.NotNull(tx);
        Assert.Equal(-9.00m, tx.Amount);
    }
}
