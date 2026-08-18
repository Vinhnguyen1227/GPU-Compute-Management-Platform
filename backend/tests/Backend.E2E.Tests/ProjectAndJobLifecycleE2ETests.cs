using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using PaymentService.Data;
using PaymentService.Models;
using PaymentService.Services;
using Shared.Events;
using Xunit;

namespace Backend.E2E.Tests;

public class ProjectAndJobLifecycleE2ETests
{
    private PaymentDbContext GetInMemoryPaymentDb()
    {
        var options = new DbContextOptionsBuilder<PaymentDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var context = new PaymentDbContext(options);
        context.ResourcePricings.AddRange(
            new ResourcePricing { ResourceType = "NVIDIA A100 (80GB)", PricePerHour = 50000m },
            new ResourcePricing { ResourceType = "NVIDIA H100 (80GB)", PricePerHour = 112500m }
        );
        context.SaveChanges();
        return context;
    }

    [Fact]
    public async Task E2E_JobLifecycleAndPAYGWalletDeduction_ShouldProcessCorrectly()
    {
        // 1. Arrange User & Initial Wallet Balance (100.000₫ Welcome Promo)
        using var paymentDb = GetInMemoryPaymentDb();
        var userId = Guid.NewGuid();
        var initialBalance = 500000m; // 500k VND

        var wallet = new Wallet
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Balance = initialBalance,
            Currency = "VND"
        };
        paymentDb.Wallets.Add(wallet);
        await paymentDb.SaveChangesAsync();

        // 2. Simulate Job Submission & Pre-Auth Check
        var hourlyRate = 112500m; // H100 rate
        var estimatedHours = 2.0;
        var requiredPreAuth = (decimal)estimatedHours * hourlyRate; // 225.000₫

        Assert.True(wallet.Balance >= requiredPreAuth, "Pre-authorization check should pass");

        // 3. Simulate Job Completion after 1.5 actual hours
        var actualHours = 1.5;
        var actualCost = (decimal)actualHours * hourlyRate; // 168.750₫

        var billingEngine = new BillingEngine(paymentDb, NullLogger<BillingEngine>.Instance);
        var completedEvent = new JobCompletedEvent
        {
            JobId = Guid.NewGuid(),
            UserId = userId,
            NodeId = "node-h100-01",
            GpuType = "NVIDIA H100 (80GB)",
            ActualDurationHours = actualHours,
            FinalCost = actualCost,
            CompletedAt = DateTime.UtcNow
        };

        // Act - Process PAYG billing
        await billingEngine.ProcessJobCompletionAsync(completedEvent);

        // Assert - Verify exact wallet balance deduction & ledger audit
        var updatedWallet = await paymentDb.Wallets.FirstOrDefaultAsync(w => w.UserId == userId);
        Assert.NotNull(updatedWallet);
        Assert.Equal(initialBalance - actualCost, updatedWallet.Balance); // 500.000 - 168.750 = 331.250₫

        var ledger = await paymentDb.LedgerEntries.FirstOrDefaultAsync(l => l.UserId == userId);
        Assert.NotNull(ledger);
        Assert.Equal(actualCost, ledger.Debit);

        var tx = await paymentDb.PaymentTransactions.FirstOrDefaultAsync(t => t.UserId == userId);
        Assert.NotNull(tx);
        Assert.Equal(-actualCost, tx.Amount);
    }
}
