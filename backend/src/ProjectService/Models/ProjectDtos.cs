namespace ProjectService.Models;

public record CreateProjectRequest(
    string Name,
    string? Description,
    string? DatasetName,
    string? DatasetSize
);

public record UpdateProjectRequest(
    string Name,
    string? Description,
    string? DatasetName,
    string? DatasetSize
);

public record ProjectDto(
    Guid Id,
    string Name,
    string Description,
    string DatasetName,
    string DatasetSize,
    DateTime CreatedAt,
    int JobCount,
    Guid OwnerId
);
