using System.Net.Http.Json;
using AuthService.Data;
using AuthService.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Shared.Auth;
using Shared.Models;
using StackExchange.Redis;

namespace AuthService.Services;

public class AuthServiceImplementation : IAuthService
{
    private readonly AuthDbContext _dbContext;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IConnectionMultiplexer? _redis;
    private readonly HttpClient _httpClient;
    private readonly JwtSettings _jwtSettings;
    private readonly ILogger<AuthServiceImplementation> _logger;
    private readonly string _userServiceUrl;
    private readonly string _paymentServiceUrl;

    public AuthServiceImplementation(
        AuthDbContext dbContext,
        IJwtTokenService jwtTokenService,
        IHttpClientFactory httpClientFactory,
        IOptions<JwtSettings> jwtSettings,
        ILogger<AuthServiceImplementation> logger,
        IConnectionMultiplexer? redis = null,
        IConfiguration? configuration = null)
    {
        _dbContext = dbContext;
        _jwtTokenService = jwtTokenService;
        _redis = redis;
        _jwtSettings = jwtSettings.Value;
        _logger = logger;
        _httpClient = httpClientFactory.CreateClient();

        _userServiceUrl = configuration?["UserServiceUrl"] ?? "http://localhost:5002";
        _paymentServiceUrl = configuration?["PaymentServiceUrl"] ?? "http://localhost:5006";

        SeedDefaultAccountsAsync().GetAwaiter().GetResult();
    }

    private async Task SeedDefaultAccountsAsync()
    {
        try
        {
            var adminEmail = "admin@dgx-compute.io";
            if (!await _dbContext.UsersAuth.AnyAsync(u => u.Email == adminEmail))
            {
                var adminUser = new UserAuth
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                    Email = adminEmail,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@2026!", 12),
                    Role = "ADMIN",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _dbContext.UsersAuth.Add(adminUser);
            }

            var devEmail = "developer@ai-cloud.io";
            if (!await _dbContext.UsersAuth.AnyAsync(u => u.Email == devEmail))
            {
                var devUser = new UserAuth
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                    Email = devEmail,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("User@2026!", 12),
                    Role = "USER",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _dbContext.UsersAuth.Add(devUser);
            }

            await _dbContext.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Seed default accounts skipped: {Message}", ex.Message);
        }
    }

    public async Task<ApiResponse<AuthResponse>> RegisterAsync(RegisterRequest request)
    {
        var existingUser = await _dbContext.UsersAuth
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

        if (existingUser != null)
        {
            return ApiResponse<AuthResponse>.Fail("Email already in use");
        }

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, workFactor: 12);
        var role = "USER";

        var userAuth = new UserAuth
        {
            Id = Guid.NewGuid(),
            Email = request.Email.ToLower(),
            PasswordHash = passwordHash,
            Role = role,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var refreshToken = _jwtTokenService.GenerateRefreshToken();
        userAuth.RefreshToken = refreshToken;
        userAuth.RefreshExpiry = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpiryDays);

        _dbContext.UsersAuth.Add(userAuth);
        await _dbContext.SaveChangesAsync();

        try
        {
            var profilePayload = new
            {
                Id = userAuth.Id,
                Name = request.Name,
                Email = userAuth.Email,
                Role = userAuth.Role
            };
            await _httpClient.PostAsJsonAsync($"{_userServiceUrl}/api/users/internal/create", profilePayload);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling UserService to create user profile");
        }

        try
        {
            var walletPayload = new
            {
                UserId = userAuth.Id,
                InitialBalance = 100000m
            };
            await _httpClient.PostAsJsonAsync($"{_paymentServiceUrl}/api/wallet/internal/init", walletPayload);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling PaymentService to init wallet");
        }

        var accessToken = _jwtTokenService.GenerateAccessToken(userAuth, request.Name);

        var authResponse = new AuthResponse(
            userAuth.Id,
            userAuth.Email,
            request.Name,
            userAuth.Role,
            accessToken,
            refreshToken
        );

        return ApiResponse<AuthResponse>.Ok(authResponse, "User registered successfully with +100,000 VND welcome bonus");
    }

    public async Task<ApiResponse<AuthResponse>> LoginAsync(LoginRequest request)
    {
        var userAuth = await _dbContext.UsersAuth
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

        if (userAuth == null || !BCrypt.Net.BCrypt.Verify(request.Password, userAuth.PasswordHash))
        {
            return ApiResponse<AuthResponse>.Fail("Invalid email or password");
        }

        var refreshToken = _jwtTokenService.GenerateRefreshToken();
        userAuth.RefreshToken = refreshToken;
        userAuth.RefreshExpiry = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpiryDays);
        userAuth.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        string userName = userAuth.Email.Split('@')[0];
        try
        {
            var profileResponse = await _httpClient.GetFromJsonAsync<ApiResponse<UserProfileDto>>($"{_userServiceUrl}/api/users/{userAuth.Id}");
            if (profileResponse?.Data?.Name != null)
            {
                userName = profileResponse.Data.Name;
            }
        }
        catch
        {
        }

        var accessToken = _jwtTokenService.GenerateAccessToken(userAuth, userName);

        var authResponse = new AuthResponse(
            userAuth.Id,
            userAuth.Email,
            userName,
            userAuth.Role,
            accessToken,
            refreshToken
        );

        return ApiResponse<AuthResponse>.Ok(authResponse, "Login successful");
    }

    public async Task<ApiResponse<AuthResponse>> RefreshTokenAsync(RefreshTokenRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            return ApiResponse<AuthResponse>.Fail("Refresh token is required");
        }

        var userAuth = await _dbContext.UsersAuth
            .FirstOrDefaultAsync(u => u.RefreshToken == request.RefreshToken);

        if (userAuth == null || userAuth.RefreshExpiry < DateTime.UtcNow)
        {
            return ApiResponse<AuthResponse>.Fail("Invalid or expired refresh token");
        }

        var newRefreshToken = _jwtTokenService.GenerateRefreshToken();
        userAuth.RefreshToken = newRefreshToken;
        userAuth.RefreshExpiry = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpiryDays);
        userAuth.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        string userName = userAuth.Email.Split('@')[0];
        var accessToken = _jwtTokenService.GenerateAccessToken(userAuth, userName);

        var authResponse = new AuthResponse(
            userAuth.Id,
            userAuth.Email,
            userName,
            userAuth.Role,
            accessToken,
            newRefreshToken
        );

        return ApiResponse<AuthResponse>.Ok(authResponse, "Token refreshed successfully");
    }

    public async Task<ApiResponse<bool>> LogoutAsync(string token)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return ApiResponse<bool>.Fail("Token is required");
        }

        if (token.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            token = token.Substring(7);
        }

        var jti = _jwtTokenService.GetJtiFromToken(token);
        if (!string.IsNullOrEmpty(jti) && _redis != null && _redis.IsConnected)
        {
            var db = _redis.GetDatabase();
            var key = $"blacklist:{jti}";
            var expiry = TimeSpan.FromMinutes(_jwtSettings.AccessTokenExpiryMinutes);
            await db.StringSetAsync(key, "revoked", expiry);
        }

        return ApiResponse<bool>.Ok(true, "Logged out successfully");
    }

    private record UserProfileDto(Guid Id, string Name, string Email, string Role);
}
