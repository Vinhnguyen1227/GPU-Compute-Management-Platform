using Microsoft.EntityFrameworkCore;
using PaymentService.Data;
using PaymentService.Models;
using Shared.Events;

namespace PaymentService.Services;

public class BillingEngine : IBillingEngine
{
    private readonly PaymentDbContext _db;
    private readonly ILogger<BillingEngine> _logger;

    public BillingEngine(PaymentDbContext db, ILogger<BillingEngine> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task ProcessJobCompletionAsync(JobCompletedEvent @event, CancellationToken ct = default)
    {
        _logger.LogInformation("Processing Pay-As-You-Go billing for completed job {JobId} (Actual Duration: {Duration}h, GPU: {GpuType})",
            @event.JobId, @event.ActualDurationHours, @event.GpuType);

        var pricing = await _db.ResourcePricings.FindAsync(new object[] { @event.GpuType }, ct);
        decimal pricePerHour = pricing?.PricePerHour ?? 50000m;
        decimal cost = Math.Round((decimal)@event.ActualDurationHours * pricePerHour, 0);

        if (@event.FinalCost > 0)
        {
            cost = @event.FinalCost;
        }

        var wallet = await _db.Wallets.FirstOrDefaultAsync(w => w.UserId == @event.UserId, ct);
        if (wallet == null)
        {
            wallet = new Wallet
            {
                Id = Guid.NewGuid(),
                UserId = @event.UserId,
                Balance = -cost,
                Currency = "VND",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _db.Wallets.Add(wallet);
        }
        else
        {
            wallet.Balance -= cost;
            wallet.UpdatedAt = DateTime.UtcNow;
        }

        var tx = new PaymentTransaction
        {
            Id = Guid.NewGuid(),
            UserId = @event.UserId,
            TransactionType = "GPU_USAGE",
            Amount = -cost,
            Currency = "VND",
            Status = "SUCCESS",
            PaymentMethod = "System",
            ReferenceCode = $"BILL-JOB-{@event.JobId.ToString()[..8]}",
            Description = $"GPU compute: {@event.GpuType} for {@event.ActualDurationHours:F2}h",
            CreatedAt = DateTime.UtcNow
        };
        _db.PaymentTransactions.Add(tx);

        var usage = new ResourceUsage
        {
            Id = Guid.NewGuid(),
            UserId = @event.UserId,
            JobId = @event.JobId,
            ResourceType = @event.GpuType,
            ResourceId = @event.NodeId,
            StartTime = @event.CompletedAt.AddHours(-@event.ActualDurationHours),
            EndTime = @event.CompletedAt,
            DurationMinutes = (int)(@event.ActualDurationHours * 60),
            Cost = cost
        };
        _db.ResourceUsages.Add(usage);

        var ledger = new LedgerEntry
        {
            Id = Guid.NewGuid(),
            UserId = @event.UserId,
            Debit = cost,
            Credit = 0,
            Description = $"Compute usage deduction for job {@event.JobId}",
            CreatedAt = DateTime.UtcNow
        };
        _db.LedgerEntries.Add(ledger);

        await _db.SaveChangesAsync(ct);
        _logger.LogInformation("Billed user {UserId} amount {Cost} VND for Job {JobId}", @event.UserId, cost, @event.JobId);
    }

    public async Task ProcessJobFailureAsync(JobFailedEvent @event, CancellationToken ct = default)
    {
        _logger.LogInformation("Processing failure/refund handling for job {JobId}", @event.JobId);

        if (@event.PartialDurationHours <= 0)
        {
            return;
        }

        var pricing = await _db.ResourcePricings.FirstOrDefaultAsync(ct);
        decimal pricePerHour = pricing?.PricePerHour ?? 50000m;
        decimal partialCost = Math.Round((decimal)@event.PartialDurationHours * pricePerHour, 0);

        var wallet = await _db.Wallets.FirstOrDefaultAsync(w => w.UserId == @event.UserId, ct);
        if (wallet != null)
        {
            wallet.Balance -= partialCost;
            wallet.UpdatedAt = DateTime.UtcNow;
        }

        var tx = new PaymentTransaction
        {
            Id = Guid.NewGuid(),
            UserId = @event.UserId,
            TransactionType = "GPU_USAGE",
            Amount = -partialCost,
            Currency = "VND",
            Status = "SUCCESS",
            PaymentMethod = "System",
            ReferenceCode = $"FAIL-JOB-{@event.JobId.ToString()[..8]}",
            Description = $"Partial compute charge (Failed: {@event.Reason})",
            CreatedAt = DateTime.UtcNow
        };
        _db.PaymentTransactions.Add(tx);

        await _db.SaveChangesAsync(ct);
    }
}
