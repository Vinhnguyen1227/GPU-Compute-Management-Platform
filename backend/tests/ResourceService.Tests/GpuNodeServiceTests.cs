using Microsoft.EntityFrameworkCore;
using ResourceService.Data;
using ResourceService.Models;
using ResourceService.Services;
using Xunit;

namespace ResourceService.Tests;

public class GpuNodeServiceTests
{
    private ResourceDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ResourceDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var context = new ResourceDbContext(options);
        context.GpuNodes.AddRange(
            new GpuNode
            {
                Id = "node-h100-01",
                Name = "DGX-H100-NODE-01",
                GpuModel = "NVIDIA H100 (80GB)",
                TotalMemoryGb = 320,
                Status = "AVAILABLE",
                GpuUtilPercent = 10m
            },
            new GpuNode
            {
                Id = "node-a100-01",
                Name = "DGX-A100-NODE-01",
                GpuModel = "NVIDIA A100 (80GB)",
                TotalMemoryGb = 160,
                Status = "BUSY",
                GpuUtilPercent = 85m
            }
        );
        context.SaveChanges();
        return context;
    }

    [Fact]
    public async Task GetAllNodesAsync_ShouldReturnAllSeededNodes()
    {
        // Arrange
        using var context = GetInMemoryDbContext();
        var service = new GpuNodeServiceImplementation(context);

        // Act
        var nodes = (await service.GetAllNodesAsync()).ToList();

        // Assert
        Assert.Equal(2, nodes.Count);
        Assert.Contains(nodes, n => n.Id == "node-h100-01");
        Assert.Contains(nodes, n => n.Id == "node-a100-01");
    }

    [Fact]
    public async Task GetClusterMetricsAsync_ShouldComputeMetricsCorrectly()
    {
        // Arrange
        using var context = GetInMemoryDbContext();
        var service = new GpuNodeServiceImplementation(context);

        // Act
        var metrics = await service.GetClusterMetricsAsync();

        // Assert
        Assert.Equal(1, metrics.ActiveJobs);
        Assert.Equal(1, metrics.AvailableGpus);
        Assert.Equal(2, metrics.TotalGpus);
        Assert.Equal(47.5m, metrics.AvgGpuUtilization); // (10 + 85) / 2 = 47.5
    }

    [Fact]
    public async Task UpdateNodeStatusAsync_ShouldChangeStatusInDatabase()
    {
        // Arrange
        using var context = GetInMemoryDbContext();
        var service = new GpuNodeServiceImplementation(context);

        // Act
        var result = await service.UpdateNodeStatusAsync("node-h100-01", "MAINTENANCE");

        // Assert
        Assert.True(result);
        var updatedNode = await context.GpuNodes.FindAsync("node-h100-01");
        Assert.NotNull(updatedNode);
        Assert.Equal("MAINTENANCE", updatedNode.Status);
    }
}
