namespace AuthService.Models;

public record RegisterRequest(
    string Name,
    string Email,
    string Password,
    string? Role = "USER"
);

public record LoginRequest(
    string Email,
    string Password
);

public record RefreshTokenRequest(
    string RefreshToken
);

public record AuthResponse(
    Guid Id,
    string Email,
    string Name,
    string Role,
    string AccessToken,
    string RefreshToken
);
