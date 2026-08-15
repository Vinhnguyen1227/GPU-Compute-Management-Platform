using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectService.Models;
using ProjectService.Services;
using Shared.Models;

namespace ProjectService.Controllers;

[ApiController]
[Route("api/projects")]
[Authorize]
public class ProjectsController : ControllerBase
{
    private readonly IProjectService _projectService;

    public ProjectsController(IProjectService projectService)
    {
        _projectService = projectService;
    }

    private Guid GetUserId()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (Guid.TryParse(userIdStr, out var userId))
        {
            return userId;
        }
        throw new UnauthorizedAccessException("Invalid User ID in token claims");
    }

    [HttpGet]
    public async Task<IActionResult> GetProjects()
    {
        var userId = GetUserId();
        var projects = await _projectService.GetProjectsAsync(userId);
        return Ok(ApiResponse<IEnumerable<ProjectDto>>.Ok(projects));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetProjectById(Guid id)
    {
        var userId = GetUserId();
        var project = await _projectService.GetProjectByIdAsync(id, userId);
        if (project == null)
        {
            return NotFound(ApiResponse<string>.Fail("Project not found"));
        }
        return Ok(ApiResponse<ProjectDto>.Ok(project));
    }

    [HttpPost]
    public async Task<IActionResult> CreateProject([FromBody] CreateProjectRequest request)
    {
        var userId = GetUserId();
        var project = await _projectService.CreateProjectAsync(userId, request);
        return CreatedAtAction(nameof(GetProjectById), new { id = project.Id }, ApiResponse<ProjectDto>.Ok(project));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateProject(Guid id, [FromBody] UpdateProjectRequest request)
    {
        var userId = GetUserId();
        var updated = await _projectService.UpdateProjectAsync(id, userId, request);
        if (updated == null)
        {
            return NotFound(ApiResponse<string>.Fail("Project not found"));
        }
        return Ok(ApiResponse<ProjectDto>.Ok(updated));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteProject(Guid id)
    {
        var userId = GetUserId();
        var deleted = await _projectService.DeleteProjectAsync(id, userId);
        if (!deleted)
        {
            return NotFound(ApiResponse<string>.Fail("Project not found"));
        }
        return Ok(ApiResponse<string>.Ok("Project deleted successfully"));
    }

    [HttpPost("internal/{id:guid}/increment-job-count")]
    [AllowAnonymous]
    public async Task<IActionResult> IncrementJobCount(Guid id)
    {
        var updated = await _projectService.IncrementJobCountAsync(id);
        if (!updated)
        {
            return NotFound(ApiResponse<string>.Fail("Project not found"));
        }
        return Ok(ApiResponse<string>.Ok("Job count incremented"));
    }
}
