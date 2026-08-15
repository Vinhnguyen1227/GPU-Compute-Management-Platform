using Microsoft.EntityFrameworkCore;
using ProjectService.Data;
using ProjectService.Models;

namespace ProjectService.Services;

public class ProjectServiceImplementation : IProjectService
{
    private readonly ProjectDbContext _dbContext;

    public ProjectServiceImplementation(ProjectDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IEnumerable<ProjectDto>> GetProjectsAsync(Guid ownerId)
    {
        var projects = await _dbContext.Projects
            .Where(p => p.OwnerId == ownerId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        return projects.Select(MapToDto);
    }

    public async Task<ProjectDto?> GetProjectByIdAsync(Guid id, Guid ownerId)
    {
        var project = await _dbContext.Projects.FirstOrDefaultAsync(p => p.Id == id && p.OwnerId == ownerId);
        return project == null ? null : MapToDto(project);
    }

    public async Task<ProjectDto> CreateProjectAsync(Guid ownerId, CreateProjectRequest request)
    {
        var project = new Project
        {
            OwnerId = ownerId,
            Name = request.Name,
            Description = request.Description,
            DatasetName = request.DatasetName,
            DatasetSize = request.DatasetSize,
            JobCount = 0,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.Projects.Add(project);
        await _dbContext.SaveChangesAsync();

        return MapToDto(project);
    }

    public async Task<ProjectDto?> UpdateProjectAsync(Guid id, Guid ownerId, UpdateProjectRequest request)
    {
        var project = await _dbContext.Projects.FirstOrDefaultAsync(p => p.Id == id && p.OwnerId == ownerId);
        if (project == null) return null;

        project.Name = request.Name;
        project.Description = request.Description;
        project.DatasetName = request.DatasetName;
        project.DatasetSize = request.DatasetSize;

        await _dbContext.SaveChangesAsync();
        return MapToDto(project);
    }

    public async Task<bool> DeleteProjectAsync(Guid id, Guid ownerId)
    {
        var project = await _dbContext.Projects.FirstOrDefaultAsync(p => p.Id == id && p.OwnerId == ownerId);
        if (project == null) return false;

        _dbContext.Projects.Remove(project);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<bool> IncrementJobCountAsync(Guid id)
    {
        var project = await _dbContext.Projects.FirstOrDefaultAsync(p => p.Id == id);
        if (project == null) return false;

        project.JobCount += 1;
        await _dbContext.SaveChangesAsync();
        return true;
    }

    private static ProjectDto MapToDto(Project p) => new(
        p.Id,
        p.Name,
        p.Description ?? string.Empty,
        p.DatasetName ?? string.Empty,
        p.DatasetSize ?? string.Empty,
        p.CreatedAt,
        p.JobCount,
        p.OwnerId
    );
}
