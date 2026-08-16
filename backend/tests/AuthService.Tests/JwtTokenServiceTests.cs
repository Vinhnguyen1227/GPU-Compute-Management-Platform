using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using AuthService.Models;
using AuthService.Services;
using Microsoft.Extensions.Options;
using Shared.Auth;
using Xunit;

namespace AuthService.Tests;

public class JwtTokenServiceTests
{
    private readonly JwtTokenService _jwtTokenService;
    private readonly JwtSettings _settings;

    public JwtTokenServiceTests()
    {
        _settings = new JwtSettings
        {
            SecretKey = "SuperSecretTestKeyThatIsAtLeast32BytesLong!",
            Issuer = "AIComputePlatformTest",
            Audience = "AIComputePlatformTestAudience",
            AccessTokenExpiryMinutes = 15,
            RefreshTokenExpiryDays = 30
        };

        var options = Options.Create(_settings);
        _jwtTokenService = new JwtTokenService(options);
    }

    [Fact]
    public void GenerateAccessToken_ShouldReturnValidJwtToken()
    {
        // Arrange
        var user = new UserAuth
        {
            Id = Guid.NewGuid(),
            Email = "test@aicloud.io",
            Role = "USER"
        };
        var userName = "Test User";

        // Act
        var token = _jwtTokenService.GenerateAccessToken(user, userName);

        // Assert
        Assert.NotNull(token);
        Assert.NotEmpty(token);

        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);

        Assert.Equal(_settings.Issuer, jwt.Issuer);
        Assert.Contains(jwt.Claims, c => c.Type == JwtRegisteredClaimNames.Sub && c.Value == user.Id.ToString());
        Assert.Contains(jwt.Claims, c => c.Type == JwtRegisteredClaimNames.Email && c.Value == user.Email);
        Assert.Contains(jwt.Claims, c => c.Type == ClaimTypes.Role && c.Value == user.Role);
    }

    [Fact]
    public void GenerateRefreshToken_ShouldReturnRandomBase64String()
    {
        // Act
        var token1 = _jwtTokenService.GenerateRefreshToken();
        var token2 = _jwtTokenService.GenerateRefreshToken();

        // Assert
        Assert.NotNull(token1);
        Assert.NotNull(token2);
        Assert.NotEqual(token1, token2);
    }

    [Fact]
    public void GetJtiFromToken_ShouldExtractJtiClaim()
    {
        // Arrange
        var user = new UserAuth
        {
            Id = Guid.NewGuid(),
            Email = "jti@aicloud.io",
            Role = "ADMIN"
        };
        var token = _jwtTokenService.GenerateAccessToken(user, "Admin User");

        // Act
        var jti = _jwtTokenService.GetJtiFromToken(token);

        // Assert
        Assert.NotNull(jti);
        Assert.NotEmpty(jti);
    }
}
