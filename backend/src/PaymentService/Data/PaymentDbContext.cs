using Microsoft.EntityFrameworkCore;
using PaymentService.Models;

namespace PaymentService.Data;

public class PaymentDbContext : DbContext
{
    public PaymentDbContext(DbContextOptions<PaymentDbContext> options) : base(options) { }

    public DbSet<Wallet> Wallets => Set<Wallet>();
    public DbSet<PaymentTransaction> PaymentTransactions => Set<PaymentTransaction>();
    public DbSet<ResourceUsage> ResourceUsages => Set<ResourceUsage>();
    public DbSet<ResourcePricing> ResourcePricings => Set<ResourcePricing>();
    public DbSet<LedgerEntry> LedgerEntries => Set<LedgerEntry>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Wallet>(entity =>
        {
            entity.ToTable("wallets");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.Balance).HasColumnName("balance").HasColumnType("decimal(18,2)");
            entity.Property(e => e.Currency).HasColumnName("currency").HasMaxLength(10);
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

            entity.HasIndex(e => e.UserId).IsUnique();
        });

        modelBuilder.Entity<PaymentTransaction>(entity =>
        {
            entity.ToTable("payment_transactions");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.TransactionType).HasColumnName("transaction_type").HasMaxLength(50);
            entity.Property(e => e.Amount).HasColumnName("amount").HasColumnType("decimal(18,2)");
            entity.Property(e => e.Currency).HasColumnName("currency").HasMaxLength(10);
            entity.Property(e => e.Status).HasColumnName("status").HasMaxLength(20);
            entity.Property(e => e.PaymentMethod).HasColumnName("payment_method").HasMaxLength(50);
            entity.Property(e => e.ReferenceCode).HasColumnName("reference_code").HasMaxLength(100);
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");

            entity.HasIndex(e => e.UserId).HasDatabaseName("idx_tx_user");
            entity.HasIndex(e => e.ReferenceCode).IsUnique().HasDatabaseName("idx_tx_ref");
        });

        modelBuilder.Entity<ResourceUsage>(entity =>
        {
            entity.ToTable("resource_usage");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.JobId).HasColumnName("job_id");
            entity.Property(e => e.ResourceType).HasColumnName("resource_type").HasMaxLength(50);
            entity.Property(e => e.ResourceId).HasColumnName("resource_id").HasMaxLength(100);
            entity.Property(e => e.StartTime).HasColumnName("start_time");
            entity.Property(e => e.EndTime).HasColumnName("end_time");
            entity.Property(e => e.DurationMinutes).HasColumnName("duration_minutes");
            entity.Property(e => e.Cost).HasColumnName("cost").HasColumnType("decimal(18,4)");

            entity.HasIndex(e => e.UserId).HasDatabaseName("idx_usage_user");
        });

        modelBuilder.Entity<ResourcePricing>(entity =>
        {
            entity.ToTable("resource_pricing");
            entity.HasKey(e => e.ResourceType);
            entity.Property(e => e.ResourceType).HasColumnName("resource_type").HasMaxLength(50);
            entity.Property(e => e.PricePerHour).HasColumnName("price_per_hour").HasColumnType("decimal(10,2)");
        });

        modelBuilder.Entity<LedgerEntry>(entity =>
        {
            entity.ToTable("ledger_entries");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.Debit).HasColumnName("debit").HasColumnType("decimal(18,2)");
            entity.Property(e => e.Credit).HasColumnName("credit").HasColumnType("decimal(18,2)");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");

            entity.HasIndex(e => e.UserId).HasDatabaseName("idx_ledger_user");
        });
    }
}
