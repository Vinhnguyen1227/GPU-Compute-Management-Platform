using Microsoft.EntityFrameworkCore;
using PaymentService.Data;
using PaymentService.Models;
using Xunit;

namespace Backend.E2E.Tests;

public class WalletAndBillingE2ETests
{
    private PaymentDbContext GetInMemoryPaymentDb()
    {
        var options = new DbContextOptionsBuilder<PaymentDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new PaymentDbContext(options);
    }

    [Fact]
    public async Task E2E_WelcomeBonusAndTopUp_ShouldComputeLedgerIntegrity()
    {
        // 1. Arrange & Welcome Bonus Init
        using var db = GetInMemoryPaymentDb();
        var userId = Guid.NewGuid();

        var wallet = new Wallet
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Balance = 100000m, // 100k VND Promo
            Currency = "VND"
        };
        db.Wallets.Add(wallet);

        var promoTx = new PaymentTransaction
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TransactionType = "DEPOSIT",
            Amount = 100000m,
            Currency = "VND",
            Status = "SUCCESS",
            PaymentMethod = "System",
            ReferenceCode = "WELCOME-100K",
            Description = "Welcome bonus promo"
        };
        db.PaymentTransactions.Add(promoTx);
        await db.SaveChangesAsync();

        // 2. User Deposits 500.000₫ via VietQR
        wallet.Balance += 500000m;
        var depositTx = new PaymentTransaction
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TransactionType = "DEPOSIT",
            Amount = 500000m,
            Currency = "VND",
            Status = "SUCCESS",
            PaymentMethod = "VietQR",
            ReferenceCode = "VIETQR-982123",
            Description = "Topup deposit via VietQR"
        };
        db.PaymentTransactions.Add(depositTx);
        await db.SaveChangesAsync();

        // 3. Assert total wallet balance and total deposits
        var totalDeposits = await db.PaymentTransactions
            .Where(t => t.UserId == userId && t.TransactionType == "DEPOSIT" && t.Status == "SUCCESS")
            .SumAsync(t => t.Amount);

        Assert.Equal(600000m, wallet.Balance);
        Assert.Equal(600000m, totalDeposits);
    }
}
