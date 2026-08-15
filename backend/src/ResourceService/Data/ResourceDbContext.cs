using Microsoft.EntityFrameworkCore;
using ResourceService.Models;

namespace ResourceService.Data;

public class ResourceDbContext : DbContext
{
    public ResourceDbContext(DbContextOptions<ResourceDbContext> options) : base(options) { }

    public DbSet<GpuNode> GpuNodes => Set<GpuNode>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<GpuNode>().HasData(
            new GpuNode { Id = "node-h100-01", Name = "DGX-H100-NODE-01", GpuModel = "NVIDIA H100 (80GB)", TotalMemoryGb = 320, UsedMemoryGb = 0, GpuUtilPercent = 0, CpuUtilPercent = 5, TemperatureC = 38, Status = "AVAILABLE", CurrentJobId = null, CurrentJobName = null, UpdatedAt = DateTime.UtcNow },
            new GpuNode { Id = "node-a100-01", Name = "DGX-A100-NODE-01", GpuModel = "NVIDIA A100 (80GB)", TotalMemoryGb = 160, UsedMemoryGb = 0, GpuUtilPercent = 0, CpuUtilPercent = 5, TemperatureC = 38, Status = "AVAILABLE", CurrentJobId = null, CurrentJobName = null, UpdatedAt = DateTime.UtcNow },
            new GpuNode { Id = "node-a100-02", Name = "DGX-A100-NODE-02", GpuModel = "NVIDIA A100 (80GB)", TotalMemoryGb = 160, UsedMemoryGb = 0, GpuUtilPercent = 0, CpuUtilPercent = 5, TemperatureC = 38, Status = "AVAILABLE", CurrentJobId = null, CurrentJobName = null, UpdatedAt = DateTime.UtcNow },
            new GpuNode { Id = "node-4090-01", Name = "CLUSTER-RTX4090-01", GpuModel = "NVIDIA RTX 4090 (24GB)", TotalMemoryGb = 96, UsedMemoryGb = 0, GpuUtilPercent = 0, CpuUtilPercent = 8, TemperatureC = 41, Status = "AVAILABLE", CurrentJobId = null, CurrentJobName = null, UpdatedAt = DateTime.UtcNow },
            new GpuNode { Id = "node-l40s-01", Name = "DGX-L40S-NODE-01", GpuModel = "NVIDIA L40S (48GB)", TotalMemoryGb = 192, UsedMemoryGb = 0, GpuUtilPercent = 0, CpuUtilPercent = 0, TemperatureC = 35, Status = "MAINTENANCE", CurrentJobId = null, CurrentJobName = null, UpdatedAt = DateTime.UtcNow }
        );
    }
}
