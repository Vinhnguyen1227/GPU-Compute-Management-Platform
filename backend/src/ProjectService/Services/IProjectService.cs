using ProjectService.Models;

namespace ProjectService.Services;

public interface IProjectService
{
    Task<IEnumerable<ProjectDto>> GetProjectsAsync(Guid ownerId);
    Task<ProjectDto?> GetProjectByIdAsync(Guid id, Guid ownerId);
    Task<ProjectDto> CreateProjectAsync(Guid ownerId, CreateProjectRequest request);
    Task<ProjectDto?> UpdateProjectAsync(Guid id, Guid ownerId, UpdateProjectRequest request);
    Task<bool> DeleteProjectAsync(Guid id, Guid ownerId);
    Task<bool> IncrementJobCountAsync(Guid id);
}
