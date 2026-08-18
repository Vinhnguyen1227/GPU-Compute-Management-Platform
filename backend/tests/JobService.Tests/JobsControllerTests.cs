using System.Security.Claims;
using JobService.Controllers;
using JobService.Models;
using JobService.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Shared.Models;
using Xunit;

namespace JobService.Tests;

public class JobsControllerTests
{
    private readonly Mock<IJobService> _mockJobService;
    private readonly JobLogBroadcaster _broadcaster;
    private readonly JobsController _controller;
    private readonly Guid _testUserId = Guid.NewGuid();

    public JobsControllerTests()
    {
        _mockJobService = new Mock<IJobService>();
        _broadcaster = new JobLogBroadcaster();
        _controller = new JobsController(_mockJobService.Object, _broadcaster);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, _testUserId.ToString()),
            new Claim(ClaimTypes.Role, "USER")
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = claimsPrincipal }
        };
    }

    [Fact]
    public async Task SubmitJob_ShouldReturnAccepted_WhenJobCreated()
    {
        // Arrange
        var request = new SubmitJobRequest
        {
            Name = "Llama-3 FineTuning",
            ProjectId = Guid.NewGuid(),
            GpuType = "NVIDIA H100 (80GB)",
            GpuCount = 2,
            DurationHours = 10,
            Command = "python train.py",
            Framework = "PyTorch 2.2"
        };
        var createdJob = new TrainingJob
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            OwnerId = _testUserId,
            Status = "QUEUED",
            GpuType = request.GpuType,
            GpuCount = request.GpuCount
        };

        _mockJobService
            .Setup(s => s.SubmitJobAsync(request, _testUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(createdJob);

        // Act
        var actionResult = await _controller.SubmitJob(request, CancellationToken.None);

        // Assert
        var acceptedResult = Assert.IsType<AcceptedResult>(actionResult);
        var apiResponse = Assert.IsType<ApiResponse<TrainingJob>>(acceptedResult.Value);
        Assert.True(apiResponse.Success);
        Assert.Equal(createdJob.Id, apiResponse.Data?.Id);
    }

    [Fact]
    public async Task CancelJob_ShouldReturnOk_WhenJobCancelled()
    {
        // Arrange
        var jobId = Guid.NewGuid();
        var cancelledJob = new TrainingJob
        {
            Id = jobId,
            OwnerId = _testUserId,
            Status = "COMPLETED",
            TotalCost = 50.00m
        };

        _mockJobService
            .Setup(s => s.CancelJobAsync(jobId, _testUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(cancelledJob);

        // Act
        var actionResult = await _controller.CancelJob(jobId, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(actionResult);
        var apiResponse = Assert.IsType<ApiResponse<TrainingJob>>(okResult.Value);
        Assert.True(apiResponse.Success);
        Assert.Equal("COMPLETED", apiResponse.Data?.Status);
    }
}
