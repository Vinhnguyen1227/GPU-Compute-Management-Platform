using ResourceService.Models;

namespace ResourceService.Services;

public interface IGpuNodeService
{
    Task<IEnumerable<GpuNodeDto>> GetAllNodesAsync();
    Task<GpuNodeDto?> GetNodeByIdAsync(string id);
    Task<bool> UpdateNodeStatusAsync(string id, string status);
    Task<ClusterMetricsDto> GetClusterMetricsAsync();
}
