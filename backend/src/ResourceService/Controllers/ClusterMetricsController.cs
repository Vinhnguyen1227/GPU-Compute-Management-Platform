using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ResourceService.Models;
using ResourceService.Services;
using Shared.Models;

namespace ResourceService.Controllers;

[ApiController]
[Route("api/cluster")]
[Authorize]
public class ClusterMetricsController : ControllerBase
{
    private readonly IGpuNodeService _nodeService;

    public ClusterMetricsController(IGpuNodeService nodeService)
    {
        _nodeService = nodeService;
    }

    [HttpGet("metrics")]
    public async Task<IActionResult> GetClusterMetrics()
    {
        var metrics = await _nodeService.GetClusterMetricsAsync();
        return Ok(ApiResponse<ClusterMetricsDto>.Ok(metrics));
    }
}
