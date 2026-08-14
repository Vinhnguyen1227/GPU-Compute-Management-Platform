using System.Security.Claims;
using AuthService.Models;

namespace AuthService.Services;

public interface IJwtTokenService
{
    string GenerateAccessToken(UserAuth user, string name);
    string GenerateRefreshToken();
    ClaimsPrincipal? GetPrincipalFromExpiredToken(string token);
    string? GetJtiFromToken(string token);
}
