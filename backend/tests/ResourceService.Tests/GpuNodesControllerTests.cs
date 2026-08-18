using Microsoft.AspNetCore.Mvc;
using Moq;
using ResourceService.Controllers;
using ResourceService.Models;
using ResourceService.Services;
using Shared.Models;
using Xunit;

namespace ResourceService.Tests;

public class GpuNodesControllerTests
{
    private readonly Mock<IGpuNodeService> _mockNodeService;
    private readonly GpuNodesController _controller;

    public GpuNodesControllerTests()
    {
        _mockNodeService = new Mock<IGpuNodeService>();
        _controller = new GpuNodesController(_mockNodeService.Object);
    }

    [Fact]
    public async Task GetAllNodes_ShouldReturnOk_WithNodeList()
    {
        // Arrange
        var mockNodes = new List<GpuNodeDto>
        {
            new GpuNodeDto("node-h100-01", "DGX-H100-01", "NVIDIA H100 (80GB)", 320, 0, 15m, 10m, 55, "AVAILABLE", null, null),
            new GpuNodeDto("node-a100-01", "DGX-A100-01", "NVIDIA A100 (80GB)", 160, 160, 90m, 60m, 72, "BUSY", "job-1", "Training Llama")
        };

        _mockNodeService
            .Setup(s => s.GetAllNodesAsync())
            .ReturnsAsync(mockNodes);

        // Act
        var actionResult = await _controller.GetAllNodes();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(actionResult);
        var apiResponse = Assert.IsType<ApiResponse<IEnumerable<GpuNodeDto>>>(okResult.Value);
        Assert.True(apiResponse.Success);
        Assert.Equal(2, apiResponse.Data?.Count());
    }

    [Fact]
    public async Task UpdateNodeStatus_ShouldReturnOk_WhenNodeUpdated()
    {
        // Arrange
        _mockNodeService
            .Setup(s => s.UpdateNodeStatusAsync("node-h100-01", "MAINTENANCE"))
            .ReturnsAsync(true);

        var request = new UpdateNodeStatusRequest("MAINTENANCE");

        // Act
        var actionResult = await _controller.UpdateNodeStatus("node-h100-01", request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(actionResult);
        var apiResponse = Assert.IsType<ApiResponse<string>>(okResult.Value);
        Assert.True(apiResponse.Success);
    }
}
