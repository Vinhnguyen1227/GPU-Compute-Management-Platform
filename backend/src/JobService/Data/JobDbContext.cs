using JobService.Models;
using Microsoft.EntityFrameworkCore;

namespace JobService.Data;

public class JobDbContext : DbContext
{
    public JobDbContext(DbContextOptions<JobDbContext> options) : base(options) { }

    public DbSet<TrainingJob> TrainingJobs => Set<TrainingJob>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<TrainingJob>(entity =>
        {
            entity.ToTable("training_jobs");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.OwnerId).HasColumnName("owner_id");
            entity.Property(e => e.ProjectId).HasColumnName("project_id");
            entity.Property(e => e.ProjectName).HasColumnName("project_name").HasMaxLength(255);
            entity.Property(e => e.Name).HasColumnName("name").HasMaxLength(255);
            entity.Property(e => e.GpuType).HasColumnName("gpu_type").HasMaxLength(100);
            entity.Property(e => e.GpuCount).HasColumnName("gpu_count");
            entity.Property(e => e.Status).HasColumnName("status").HasMaxLength(20);
            entity.Property(e => e.Progress).HasColumnName("progress");
            entity.Property(e => e.DurationHours).HasColumnName("duration_hours").HasColumnType("decimal(10,2)");
            entity.Property(e => e.CostPerHour).HasColumnName("cost_per_hour").HasColumnType("decimal(10,2)");
            entity.Property(e => e.TotalCost).HasColumnName("total_cost").HasColumnType("decimal(10,2)");
            entity.Property(e => e.AssignedNodeId).HasColumnName("assigned_node_id").HasMaxLength(100);
            entity.Property(e => e.Command).HasColumnName("command");
            entity.Property(e => e.Framework).HasColumnName("framework").HasMaxLength(100);
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.StartedAt).HasColumnName("started_at");
            entity.Property(e => e.CompletedAt).HasColumnName("completed_at");

            entity.HasIndex(e => e.Status).HasDatabaseName("idx_jobs_status");
            entity.HasIndex(e => e.ProjectId).HasDatabaseName("idx_jobs_project");
            entity.HasIndex(e => e.OwnerId).HasDatabaseName("idx_jobs_owner");
        });
    }
}
