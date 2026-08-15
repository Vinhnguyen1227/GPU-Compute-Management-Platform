using JobService.Models;

namespace JobService.Services;

public interface IJobService
{
    Task<IEnumerable<JobDto>> GetJobsAsync(Guid ownerId, Guid? projectId = null, string? status = null);
    Task<JobDto?> GetJobByIdAsync(Guid id, Guid ownerId);
    Task<JobDto> SubmitJobAsync(Guid ownerId, SubmitJobRequest request);
    Task<bool> CancelJobAsync(Guid id, Guid ownerId);
}
