using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using PaymentService.Config;
using PaymentService.Data;
using PaymentService.Models;
using Shared.Constants;
using Shared.Events;
using Shared.Messaging;
using Shared.Models;

namespace PaymentService.Services;

public class WalletService : IWalletService
{
    private readonly PaymentDbContext _db;
    private readonly IPayOSService _payOSService;
    private readonly PayOSSettings _settings;
    private readonly IKafkaProducer _producer;
    private readonly ILogger<WalletService> _logger;

    public WalletService(
        PaymentDbContext db,
        IPayOSService payOSService,
        IOptions<PayOSSettings> settings,
        IKafkaProducer producer,
        ILogger<WalletService> logger)
    {
        _db = db;
        _payOSService = payOSService;
        _settings = settings.Value;
        _producer = producer;
        _logger = logger;
    }

    public async Task<Wallet> GetOrCreateWalletAsync(Guid userId, CancellationToken ct = default)
    {
        var wallet = await _db.Wallets.FirstOrDefaultAsync(w => w.UserId == userId, ct);
        if (wallet == null)
        {
            wallet = new Wallet
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Balance = 0.00m,
                Currency = "USD",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _db.Wallets.Add(wallet);
            await _db.SaveChangesAsync(ct);
            _logger.LogInformation("Auto-created wallet for user {UserId}", userId);
        }
        return wallet;
    }

    public async Task<DepositResponse> CreateDepositAsync(DepositRequest request, Guid userId, CancellationToken ct = default)
    {
        // 1. Generate unique 6-8 digit numeric OrderCode for PayOS
        var orderCode = (long)(DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() % 90000000 + 10000000);
        var transferDescription = $"DGX{orderCode % 100000}";

        // 2. Compute VND & USD amounts authority on backend
        int amountVnd = request.Amount > 1000
            ? (int)request.Amount // passed directly in VND
            : (int)(request.Amount * _settings.VndExchangeRate); // passed in USD

        decimal amountUsd = request.Amount > 1000
            ? Math.Round(request.Amount / _settings.VndExchangeRate, 2)
            : request.Amount;

        var refCode = orderCode.ToString();

        // 3. Save pending transaction to DB
        var tx = new PaymentTransaction
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TransactionType = "DEPOSIT",
            Amount = amountUsd,
            Currency = "USD",
            Status = "PENDING",
            PaymentMethod = request.PaymentMethod,
            ReferenceCode = refCode,
            Description = $"Deposit via {request.PaymentMethod} (Order #{orderCode} - {amountVnd:N0} VND)",
            CreatedAt = DateTime.UtcNow
        };

        _db.PaymentTransactions.Add(tx);
        await _db.SaveChangesAsync(ct);

        // 4. Request official PayOS Payment Request
        var payOSData = await _payOSService.CreatePaymentLinkAsync(orderCode, amountVnd, transferDescription, ct);

        // 5. Use official QR code string / direct VietQR
        var qrCodeUrl = !string.IsNullOrWhiteSpace(payOSData?.QrCode) && payOSData.QrCode.StartsWith("http")
            ? payOSData.QrCode
            : _payOSService.GenerateDirectVietQrUrl(amountVnd, transferDescription);

        return new DepositResponse
        {
            TransactionId = tx.Id,
            OrderCode = orderCode,
            TransferCode = transferDescription,
            QrCodeUrl = qrCodeUrl,
            CheckoutUrl = payOSData?.CheckoutUrl,
            AmountUsd = amountUsd,
            AmountVnd = amountVnd,
            Currency = "USD",
            Status = "PENDING",
            ReferenceCode = refCode,
            BankAccount = _settings.AccountNo,
            AccountName = _settings.AccountName,
            BankName = "MB Bank"
        };
    }

    /// <summary>
    /// Strict PayOS Webhook processor:
    /// - Checks OrderCode exists in DB
    /// - Enforces idempotency (if already SUCCESS, returns without mutation)
    /// - Verifies received VND amount matches the DB order amount
    /// - Credits user wallet, creates ledger debit entry, publishes Kafka event
    /// </summary>
    public async Task<WebhookProcessResult> ProcessPayOSWebhookAsync(long orderCode, int receivedAmountVnd, CancellationToken ct = default)
    {
        var refCode = orderCode.ToString();
        var tx = await _db.PaymentTransactions.FirstOrDefaultAsync(t => t.ReferenceCode == refCode, ct);

        if (tx == null)
        {
            _logger.LogWarning("PayOS Webhook rejected: OrderCode #{OrderCode} not found in DB", orderCode);
            return new WebhookProcessResult(false, $"Order #{orderCode} not found");
        }

        // Idempotency check: Already processed
        if (tx.Status == "SUCCESS")
        {
            _logger.LogInformation("PayOS Webhook idempotency: OrderCode #{OrderCode} is already marked SUCCESS. Skipping credit.", orderCode);
            return new WebhookProcessResult(true, "Already processed");
        }

        // Amount verification: expected amount in VND
        int expectedAmountVnd = (int)(tx.Amount * _settings.VndExchangeRate);
        if (Math.Abs(receivedAmountVnd - expectedAmountVnd) > 1000) // allow tiny rounding delta
        {
            _logger.LogError("PayOS Webhook rejected: Amount mismatch for order #{OrderCode}. Expected: {Expected} VND, Received: {Received} VND",
                orderCode, expectedAmountVnd, receivedAmountVnd);
            return new WebhookProcessResult(false, "Amount mismatch");
        }

        // Mark as SUCCESS
        tx.Status = "SUCCESS";

        // Credit Wallet
        var wallet = await GetOrCreateWalletAsync(tx.UserId, ct);
        wallet.Balance += tx.Amount;
        wallet.UpdatedAt = DateTime.UtcNow;

        // Double-entry ledger
        var ledger = new LedgerEntry
        {
            Id = Guid.NewGuid(),
            UserId = tx.UserId,
            Debit = 0,
            Credit = tx.Amount,
            Description = $"Deposit via PayOS/MBBank (Order #{orderCode})",
            CreatedAt = DateTime.UtcNow
        };
        _db.LedgerEntries.Add(ledger);

        // Kafka Event
        await _producer.ProduceAsync(
            KafkaTopics.PaymentCompleted,
            tx.Id.ToString(),
            new PaymentCompletedEvent
            {
                TransactionId = tx.Id,
                UserId = tx.UserId,
                Amount = tx.Amount,
                TransactionType = tx.TransactionType,
                Status = tx.Status,
                CompletedAt = DateTime.UtcNow
            },
            ct);

        await _db.SaveChangesAsync(ct);
        _logger.LogInformation("Successfully processed PayOS payment for Order #{OrderCode}. Credited ${Amount} USD to User {UserId}",
            orderCode, tx.Amount, tx.UserId);

        return new WebhookProcessResult(true, "Payment processed successfully");
    }

    public async Task<bool> ProcessWebhookCallbackAsync(WebhookPayload payload, CancellationToken ct = default)
    {
        var tx = await _db.PaymentTransactions.FirstOrDefaultAsync(t => t.ReferenceCode == payload.ReferenceCode, ct);
        if (tx == null) return false;

        if (tx.Status == "SUCCESS") return true;

        tx.Status = payload.Status == "SUCCESS" ? "SUCCESS" : "FAILED";

        if (tx.Status == "SUCCESS")
        {
            var wallet = await GetOrCreateWalletAsync(tx.UserId, ct);
            wallet.Balance += tx.Amount;
            wallet.UpdatedAt = DateTime.UtcNow;

            var ledger = new LedgerEntry
            {
                Id = Guid.NewGuid(),
                UserId = tx.UserId,
                Debit = 0,
                Credit = tx.Amount,
                Description = $"Deposit via {tx.PaymentMethod} ({tx.ReferenceCode})",
                CreatedAt = DateTime.UtcNow
            };
            _db.LedgerEntries.Add(ledger);

            await _producer.ProduceAsync(
                KafkaTopics.PaymentCompleted,
                tx.Id.ToString(),
                new PaymentCompletedEvent
                {
                    TransactionId = tx.Id,
                    UserId = tx.UserId,
                    Amount = tx.Amount,
                    TransactionType = tx.TransactionType,
                    Status = tx.Status,
                    CompletedAt = DateTime.UtcNow
                },
                ct);
        }

        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<PaginatedResult<TransactionDto>> GetTransactionsAsync(Guid userId, string? type = null, int page = 1, int pageSize = 20, CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.PaymentTransactions.AsNoTracking().Where(t => t.UserId == userId);

        if (!string.IsNullOrWhiteSpace(type))
        {
            query = query.Where(t => t.TransactionType == type);
        }

        var totalCount = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new TransactionDto
            {
                Id = t.Id,
                UserId = t.UserId,
                Type = t.TransactionType,
                Amount = t.Amount,
                Currency = t.Currency,
                Status = t.Status,
                PaymentMethod = t.PaymentMethod,
                ReferenceCode = t.ReferenceCode,
                Description = t.Description,
                Timestamp = t.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss")
            })
            .ToListAsync(ct);

        return new PaginatedResult<TransactionDto>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<PaginatedResult<ResourceUsage>> GetResourceUsagesAsync(Guid userId, int page = 1, int pageSize = 20, CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.ResourceUsages.AsNoTracking().Where(u => u.UserId == userId);
        var totalCount = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(u => u.StartTime)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return new PaginatedResult<ResourceUsage>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }
}
