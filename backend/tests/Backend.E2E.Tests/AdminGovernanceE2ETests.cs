using Microsoft.EntityFrameworkCore;
using ResourceService.Data;
using ResourceService.Models;
using ResourceService.Services;
using Xunit;

namespace Backend.E2E.Tests;

public class AdminGovernanceE2ETests
{
    private ResourceDbContext GetInMemoryResourceDb()
    {
        var options = new DbContextOptionsBuilder<ResourceDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var context = new ResourceDbContext(options);
        context.GpuNodes.Add(new GpuNode
        {
            Id = "node-h100-01",
            Name = "DGX-H100-01",
            GpuModel = "NVIDIA H100 (80GB)",
            TotalMemoryGb = 320,
            Status = "AVAILABLE",
            GpuUtilPercent = 0m
        });
        context.SaveChanges();
        return context;
    }

    [Fact]
    public async Task E2E_AdminToggleNodeMaintenance_ShouldUpdateNodeState()
    {
        // Arrange
        using var context = GetInMemoryResourceDb();
        var nodeService = new GpuNodeServiceImplementation(context);

        // Act
        var result = await nodeService.UpdateNodeStatusAsync("node-h100-01", "MAINTENANCE");

        // Assert
        Assert.True(result);
        var node = await context.GpuNodes.FindAsync("node-h100-01");
        Assert.NotNull(node);
        Assert.Equal("MAINTENANCE", node.Status);
    }
}
