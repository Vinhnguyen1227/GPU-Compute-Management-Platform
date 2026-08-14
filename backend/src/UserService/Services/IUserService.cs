using Shared.Models;
using UserService.Models;

namespace UserService.Services;

public interface IUserService
{
    Task<ApiResponse<UserDto>> GetUserProfileAsync(Guid userId, string? authHeader = null);
    Task<ApiResponse<UserDto>> UpdateUserProfileAsync(Guid userId, UpdateProfileRequest request);
    Task<ApiResponse<bool>> CreateInternalProfileAsync(CreateInternalProfileRequest request);
}
