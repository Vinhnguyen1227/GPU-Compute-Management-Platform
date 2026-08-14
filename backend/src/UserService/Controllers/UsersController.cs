using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shared.Models;
using UserService.Models;
using UserService.Services;

namespace UserService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
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
