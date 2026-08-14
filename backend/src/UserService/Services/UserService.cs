using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Shared.Models;
using UserService.Data;
using UserService.Models;

namespace UserService.Services;

public class UserServiceImplementation : IUserService
{
    private readonly UserDbContext _dbContext;
    private readonly HttpClient _httpClient;
    private readonly ILogger<UserServiceImplementation> _logger;
    private readonly string _paymentServiceUrl;

    public UserServiceImplementation(
        UserDbContext dbContext,
        IHttpClientFactory httpClientFactory,
        ILogger<UserServiceImplementation> logger,
        IConfiguration configuration)
    {
        _dbContext = dbContext;
        _httpClient = httpClientFactory.CreateClient();
        _logger = logger;
        _paymentServiceUrl = configuration["PaymentServiceUrl"] ?? "http://localhost:5006";
    }

    public async Task<ApiResponse<UserDto>> GetUserProfileAsync(Guid userId, string? authHeader = null)
    {
        var profile = await _dbContext.UserProfiles.FindAsync(userId);
        if (profile == null)
        {
            return ApiResponse<UserDto>.Fail("User profile not found");
        }

        // Fetch wallet balance from PaymentService if available
        decimal balance = 0.00m;
        string currency = "USD";

        try
        {
            var requestMessage = new HttpRequestMessage(HttpMethod.Get, $"{_paymentServiceUrl}/api/wallet");
            if (!string.IsNullOrEmpty(authHeader))
            {
                requestMessage.Headers.Authorization = AuthenticationHeaderValue.Parse(authHeader);
            }

            var response = await _httpClient.SendAsync(requestMessage);
            if (response.IsSuccessStatusCode)
            {
                var walletResult = await response.Content.ReadFromJsonAsync<ApiResponse<WalletDto>>();
                if (walletResult?.Data != null)
                {
                    balance = walletResult.Data.Balance;
                    currency = walletResult.Data.Currency ?? "USD";
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogInformation("PaymentService wallet balance lookup skipped/failed: {Message}", ex.Message);
        }

        var userDto = new UserDto(
            profile.Id,
            profile.Name,
            profile.Email,
            profile.Role,
            profile.AvatarUrl,
            balance,
            currency
        );

        return ApiResponse<UserDto>.Ok(userDto);
    }

    public async Task<ApiResponse<UserDto>> UpdateUserProfileAsync(Guid userId, UpdateProfileRequest request)
    {
        var profile = await _dbContext.UserProfiles.FindAsync(userId);
        if (profile == null)
        {
            return ApiResponse<UserDto>.Fail("User profile not found");
        }

        profile.Name = request.Name;
        if (request.AvatarUrl != null)
        {
            profile.AvatarUrl = request.AvatarUrl;
        }
        profile.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        return await GetUserProfileAsync(userId);
    }

    public async Task<ApiResponse<bool>> CreateInternalProfileAsync(CreateInternalProfileRequest request)
    {
        var existing = await _dbContext.UserProfiles.FindAsync(request.Id);
        if (existing != null)
        {
            return ApiResponse<bool>.Ok(true, "Profile already exists");
        }

        var profile = new UserProfile
        {
            Id = request.Id,
            Name = request.Name,
            Email = request.Email,
            Role = request.Role,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _dbContext.UserProfiles.Add(profile);
        await _dbContext.SaveChangesAsync();

        return ApiResponse<bool>.Ok(true, "Profile created successfully");
    }

    private record WalletDto(decimal Balance, string Currency);
}
