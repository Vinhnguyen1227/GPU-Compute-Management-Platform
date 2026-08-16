using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Shared.Models;
using UserService.Data;
using UserService.Models;
using UserService.Services;

namespace UserService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly UserDbContext _dbContext;

    public UsersController(IUserService userService, UserDbContext dbContext)
    {
        _userService = userService;
        _dbContext = dbContext;
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<UserDto>>> GetCurrentUserProfile()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                           ?? User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(ApiResponse<UserDto>.Fail("Unauthorized - User ID claim missing or invalid"));
        }

        var authHeader = Request.Headers["Authorization"].FirstOrDefault();
        var result = await _userService.GetUserProfileAsync(userId, authHeader);
        if (!result.Success)
        {
            return NotFound(result);
        }
        return Ok(result);
    }

    [HttpGet]
    [Authorize(Roles = "ADMIN")]
    public async Task<ActionResult<ApiResponse<List<UserDto>>>> GetAllUsers()
    {
        var profiles = await _dbContext.UserProfiles.OrderByDescending(p => p.CreatedAt).ToListAsync();
        var userDtos = profiles.Select(p => new UserDto(
            p.Id,
            p.Name,
            p.Email,
            p.Role,
            p.AvatarUrl,
            0m,
            "VND"
        )).ToList();

        return Ok(ApiResponse<List<UserDto>>.Ok(userDtos));
    }

    [HttpPut("{id}/role")]
    [Authorize(Roles = "ADMIN")]
    public async Task<ActionResult<ApiResponse<bool>>> UpdateUserRole(Guid id, [FromBody] UpdateRoleRequest request)
    {
        var profile = await _dbContext.UserProfiles.FindAsync(id);
        if (profile == null)
        {
            return NotFound(ApiResponse<bool>.Fail("User not found"));
        }

        profile.Role = request.Role.ToUpper();
        profile.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        return Ok(ApiResponse<bool>.Ok(true, $"Role updated to {profile.Role}"));
    }

    [HttpPut("me")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<UserDto>>> UpdateCurrentUserProfile([FromBody] UpdateProfileRequest request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                           ?? User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(ApiResponse<UserDto>.Fail("Unauthorized - User ID claim missing or invalid"));
        }

        var result = await _userService.UpdateUserProfileAsync(userId, request);
        if (!result.Success)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<UserDto>>> GetUserById(Guid id)
    {
        var authHeader = Request.Headers["Authorization"].FirstOrDefault();
        var result = await _userService.GetUserProfileAsync(id, authHeader);
        if (!result.Success)
        {
            return NotFound(result);
        }
        return Ok(result);
    }

    [HttpPost("internal/create")]
    public async Task<ActionResult<ApiResponse<bool>>> CreateInternalProfile([FromBody] CreateInternalProfileRequest request)
    {
        var result = await _userService.CreateInternalProfileAsync(request);
        return Ok(result);
    }
}

public record UpdateRoleRequest(string Role);
