using AuthService.Models;
using AuthService.Services;
using Microsoft.Extensions.Options;
using Shared.Auth;
using Shared.Models;
using Xunit;

namespace Backend.E2E.Tests;

public class AuthAndUserE2ETests
{
    private readonly JwtTokenService _jwtTokenService;

    public AuthAndUserE2ETests()
    {
        var settings = new JwtSettings
        {
            SecretKey = "E2ESuperSecretTestKeyForPlatform2026!",
            Issuer = "AIComputePlatformE2E",
            Audience = "AIComputePlatformE2EAudience",
            AccessTokenExpiryMinutes = 30,
            RefreshTokenExpiryDays = 30
        };
        _jwtTokenService = new JwtTokenService(Options.Create(settings));
    }

    [Fact]
    public void E2E_UserRegistrationAndTokenLifecycle_ShouldSucceed()
    {
        // 1. User details
        var userId = Guid.NewGuid();
        var email = "e2e.dev@ai-cloud.io";
        var userAuth = new UserAuth
        {
            Id = userId,
            Email = email,
            Role = "USER",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("User@2026!")
        };

        // 2. Verify password hashing
        Assert.True(BCrypt.Net.BCrypt.Verify("User@2026!", userAuth.PasswordHash));
        Assert.False(BCrypt.Net.BCrypt.Verify("WrongPassword", userAuth.PasswordHash));

        // 3. Issue JWT Access Token
        var token = _jwtTokenService.GenerateAccessToken(userAuth, "E2E Developer");
        Assert.NotNull(token);
        Assert.NotEmpty(token);

        // 4. Extract JTI claim from token
        var jti = _jwtTokenService.GetJtiFromToken(token);
        Assert.NotNull(jti);
        Assert.NotEmpty(jti);

        // 5. Generate Refresh Token
        var refreshToken = _jwtTokenService.GenerateRefreshToken();
        Assert.NotNull(refreshToken);
        Assert.NotEmpty(refreshToken);
    }
}
