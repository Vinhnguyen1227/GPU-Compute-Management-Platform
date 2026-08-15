using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ResourceService.Models;
using ResourceService.Services;
using Shared.Models;

namespace ResourceService.Controllers;

[ApiController]
[Route("api/gpu-nodes")]
[Authorize]
public class GpuNodesController : ControllerBase
{
    private readonly IGpuNodeService _nodeService;

    public GpuNodesController(IGpuNodeService nodeService)
    {
        _nodeService = nodeService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllNodes()
    {
        var nodes = await _nodeService.GetAllNodesAsync();
        return Ok(ApiResponse<IEnumerable<GpuNodeDto>>.Ok(nodes));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetNodeById(string id)
    {
        var node = await _nodeService.GetNodeByIdAsync(id);
        if (node == null)
        {
            return NotFound(ApiResponse<string>.Fail("GPU node not found"));
        }
        return Ok(ApiResponse<GpuNodeDto>.Ok(node));
    }

    [HttpPut("{id}/status")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> UpdateNodeStatus(string id, [FromBody] UpdateNodeStatusRequest request)
    {
        var updated = await _nodeService.UpdateNodeStatusAsync(id, request.Status);
        if (!updated)
        {
            return NotFound(ApiResponse<string>.Fail("GPU node not found"));
        }
        return Ok(ApiResponse<string>.Ok($"Node status updated to {request.Status}"));
    }
}
