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
        modelBuilder.Entity<TrainingJob>().HasIndex(j => j.Status);
        modelBuilder.Entity<TrainingJob>().HasIndex(j => j.ProjectId);
        modelBuilder.Entity<TrainingJob>().HasIndex(j => j.OwnerId);
    }
}
