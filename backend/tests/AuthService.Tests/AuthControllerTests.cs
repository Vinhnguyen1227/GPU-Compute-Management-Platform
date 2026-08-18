using AuthService.Controllers;
using AuthService.Models;
using AuthService.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Shared.Models;
using Xunit;

namespace AuthService.Tests;

public class AuthControllerTests
{
    private readonly Mock<IAuthService> _mockAuthService;
    private readonly AuthController _controller;

    public AuthControllerTests()
    {
        _mockAuthService = new Mock<IAuthService>();
        _controller = new AuthController(_mockAuthService.Object);

        var httpContext = new DefaultHttpContext();
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = httpContext
        };
    }

    [Fact]
    public async Task Register_ShouldReturnOk_WhenRegistrationSucceeds()
    {
        // Arrange
        var request = new RegisterRequest("New Developer", "newuser@ai-cloud.io", "Password123!", "USER");
        var authRes = new AuthResponse(Guid.NewGuid(), request.Email, request.Name, "USER", "valid_access_token", "valid_refresh_token");
        var expectedResponse = ApiResponse<AuthResponse>.Ok(authRes);

        _mockAuthService
            .Setup(s => s.RegisterAsync(request))
            .ReturnsAsync(expectedResponse);

        // Act
        var actionResult = await _controller.Register(request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
        var apiResponse = Assert.IsType<ApiResponse<AuthResponse>>(okResult.Value);
        Assert.True(apiResponse.Success);
        Assert.Equal("valid_access_token", apiResponse.Data?.AccessToken);
    }

    [Fact]
    public async Task Login_ShouldReturnUnauthorized_WhenCredentialsInvalid()
    {
        // Arrange
        var request = new LoginRequest("wrong@ai-cloud.io", "WrongPassword");
        var failResponse = ApiResponse<AuthResponse>.Fail("Invalid credentials");

        _mockAuthService
            .Setup(s => s.LoginAsync(request))
            .ReturnsAsync(failResponse);

        // Act
        var actionResult = await _controller.Login(request);

        // Assert
        var unauthResult = Assert.IsType<UnauthorizedObjectResult>(actionResult.Result);
        var apiResponse = Assert.IsType<ApiResponse<AuthResponse>>(unauthResult.Value);
        Assert.False(apiResponse.Success);
        Assert.Equal("Invalid credentials", apiResponse.Error);
    }

    [Fact]
    public async Task Logout_ShouldReturnBadRequest_WhenAuthHeaderMissing()
    {
        // Act
        var actionResult = await _controller.Logout();

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(actionResult.Result);
        var apiResponse = Assert.IsType<ApiResponse<bool>>(badRequestResult.Value);
        Assert.False(apiResponse.Success);
    }
}
