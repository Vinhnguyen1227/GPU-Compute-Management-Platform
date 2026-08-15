using JobService.Models;
using Shared.Models;

namespace JobService.Services;

public interface IJobService
{
    Task<TrainingJob> SubmitJobAsync(SubmitJobRequest request, Guid userId, CancellationToken ct = default);
    Task<PaginatedResult<TrainingJob>> GetJobsAsync(string? status = null, Guid? projectId = null, int page = 1, int pageSize = 20, CancellationToken ct = default);
    Task<TrainingJob?> GetJobByIdAsync(Guid id, CancellationToken ct = default);
    Task<TrainingJob?> CancelJobAsync(Guid id, Guid userId, CancellationToken ct = default);
}
