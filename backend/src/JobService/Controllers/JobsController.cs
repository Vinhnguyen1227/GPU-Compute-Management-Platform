using System.Security.Claims;
using System.Threading.Channels;
using JobService.Models;
using JobService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shared.Models;

namespace JobService.Controllers;

[ApiController]
[Route("api/jobs")]
[Authorize]
public class JobsController : ControllerBase
{
    private readonly IJobService _jobService;
    private readonly JobLogBroadcaster _broadcaster;

    public JobsController(IJobService jobService, JobLogBroadcaster broadcaster)
    {
        _jobService = jobService;
        _broadcaster = broadcaster;
    }

    private Guid GetUserId()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (Guid.TryParse(userIdStr, out var userId))
        {
            return userId;
        }
        return Guid.Parse("11111111-1111-1111-1111-111111111111");
    }

    [HttpPost]
    public async Task<IActionResult> SubmitJob([FromBody] SubmitJobRequest request, CancellationToken ct)
    {
        var userId = GetUserId();
        var job = await _jobService.SubmitJobAsync(request, userId, ct);
        return Accepted($"/api/jobs/{job.Id}", ApiResponse<TrainingJob>.Ok(job, "Job submitted successfully"));
    }

    [HttpGet]
    public async Task<IActionResult> GetJobs(
        [FromQuery] string? status = null,
        [FromQuery] Guid? projectId = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var userId = GetUserId();
        var result = await _jobService.GetJobsAsync(status, projectId, userId, page, pageSize, ct);
        return Ok(ApiResponse<PaginatedResult<TrainingJob>>.Ok(result));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetJob(Guid id, CancellationToken ct)
    {
        var userId = GetUserId();
        var job = await _jobService.GetJobByIdAsync(id, userId, ct);
        if (job == null)
            return NotFound(ApiResponse<TrainingJob>.Fail("Job not found"));

        return Ok(ApiResponse<TrainingJob>.Ok(job));
    }

    [HttpPost("{id:guid}/cancel")]
    public async Task<IActionResult> CancelJob(Guid id, CancellationToken ct)
    {
        var userId = GetUserId();
        var job = await _jobService.CancelJobAsync(id, userId, ct);
        if (job == null)
            return NotFound(ApiResponse<TrainingJob>.Fail("Job not found"));

        return Ok(ApiResponse<TrainingJob>.Ok(job, "Job cancelled successfully"));
    }

    [HttpGet("{id:guid}/logs")]
    [AllowAnonymous]
    public async Task StreamLogs(Guid id, CancellationToken ct)
    {
        Response.ContentType = "text/event-stream";
        Response.Headers.Append("Cache-Control", "no-cache");
        Response.Headers.Append("Connection", "keep-alive");

        var channel = Channel.CreateUnbounded<string>();
        using var subscription = _broadcaster.Subscribe(id, channel.Writer);

        try
        {
            await foreach (var logLine in channel.Reader.ReadAllAsync(ct))
            {
                await Response.WriteAsync($"data: {logLine}\n\n", ct);
                await Response.Body.FlushAsync(ct);
            }
        }
        catch (OperationCanceledException)
        {
            // Client disconnected
        }
    }
}
