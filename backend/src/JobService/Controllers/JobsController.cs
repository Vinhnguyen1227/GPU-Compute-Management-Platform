using System.Security.Claims;
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

    public JobsController(IJobService jobService)
    {
        _jobService = jobService;
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
    public async Task<IActionResult> GetJobs([FromQuery] Guid? projectId, [FromQuery] string? status)
    {
        var userId = GetUserId();
        var jobs = await _jobService.GetJobsAsync(userId, projectId, status);
        return Ok(ApiResponse<IEnumerable<JobDto>>.Ok(jobs));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetJobById(Guid id)
    {
        var userId = GetUserId();
        var job = await _jobService.GetJobByIdAsync(id, userId);
        if (job == null)
        {
            return NotFound(ApiResponse<string>.Fail("Job not found"));
        }
        return Ok(ApiResponse<JobDto>.Ok(job));
    }

    [HttpPost]
    public async Task<IActionResult> SubmitJob([FromBody] SubmitJobRequest request)
    {
        var userId = GetUserId();
        var job = await _jobService.SubmitJobAsync(userId, request);
        return CreatedAtAction(nameof(GetJobById), new { id = job.Id }, ApiResponse<JobDto>.Ok(job));
    }

    [HttpPost("{id:guid}/cancel")]
    public async Task<IActionResult> CancelJob(Guid id)
    {
        var userId = GetUserId();
        var canceled = await _jobService.CancelJobAsync(id, userId);
        if (!canceled)
        {
            return BadRequest(ApiResponse<string>.Fail("Job could not be canceled or was not found"));
        }
        return Ok(ApiResponse<string>.Ok("Job canceled successfully"));
    }

    [HttpGet("{id:guid}/logs")]
    public async Task GetJobLogs(Guid id, CancellationToken cancellationToken)
    {
        Response.Headers.Append("Content-Type", "text/event-stream");
        Response.Headers.Append("Cache-Control", "no-cache");
        Response.Headers.Append("Connection", "keep-alive");

        var sampleLogs = new[]
        {
            $"[INFO] [{DateTime.UtcNow:HH:mm:ss}] Initializing PyTorch distributed framework...",
            $"[INFO] [{DateTime.UtcNow:HH:mm:ss}] Loading checkpoint weights into GPU VRAM...",
            $"[INFO] [{DateTime.UtcNow:HH:mm:ss}] Training Epoch 1/10 - Batch loss: 0.4521 - Learning rate: 1e-4",
            $"[INFO] [{DateTime.UtcNow:HH:mm:ss}] Evaluation loss: 0.3892 - Accuracy: 91.4%"
        };

        foreach (var log in sampleLogs)
        {
            if (cancellationToken.IsCancellationRequested) break;
            await Response.WriteAsync($"data: {log}\n\n", cancellationToken);
            await Response.Body.FlushAsync(cancellationToken);
            await Task.Delay(1000, cancellationToken);
        }
    }
}
