namespace UserService.Models;

public record UpdateProfileRequest(
    string Name,
    string? AvatarUrl
);

public record CreateInternalProfileRequest(
    Guid Id,
    string Name,
    string Email,
    string Role
);

public record UserDto(
    Guid Id,
    string Name,
    string Email,
    string Role,
    string? AvatarUrl,
    decimal Balance,
    string Currency
);
