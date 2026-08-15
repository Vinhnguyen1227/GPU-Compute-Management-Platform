using Microsoft.EntityFrameworkCore;
using ResourceService.Data;
using ResourceService.Models;

namespace ResourceService.Services;

public class SchedulerService
{
    private readonly ResourceDbContext _dbContext;

    public SchedulerService(ResourceDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<GpuNode?> TryAssignGpuAsync(Guid jobId, string jobName, string gpuModel, CancellationToken cancellationToken = default)
    {
        using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            // Execute atomic query with FOR UPDATE SKIP LOCKED
            var sql = @"
                SELECT * FROM gpu_nodes
                WHERE (gpu_model = {0} OR {0} IS NULL OR {0} = '')
                  AND status = 'AVAILABLE'
                LIMIT 1
                FOR UPDATE SKIP LOCKED";

            var availableNode = await _dbContext.GpuNodes
                .FromSqlRaw(sql, gpuModel)
                .FirstOrDefaultAsync(cancellationToken);

            // Fallback: if no node matched exact gpuModel, check any AVAILABLE node
            if (availableNode == null)
            {
                var fallbackSql = @"
                    SELECT * FROM gpu_nodes
                    WHERE status = 'AVAILABLE'
                    LIMIT 1
                    FOR UPDATE SKIP LOCKED";

                availableNode = await _dbContext.GpuNodes
                    .FromSqlRaw(fallbackSql)
                    .FirstOrDefaultAsync(cancellationToken);
            }

            if (availableNode == null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return null;
            }

            availableNode.Status = "BUSY";
            availableNode.CurrentJobId = jobId.ToString();
            availableNode.CurrentJobName = jobName;
            availableNode.UsedMemoryGb = (int)(availableNode.TotalMemoryGb * 0.85);
            availableNode.GpuUtilPercent = 85.0m;
            availableNode.CpuUtilPercent = 45.0m;
            availableNode.TemperatureC = 68;
            availableNode.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return availableNode;
        }
        catch (Exception)
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<bool> ReleaseGpuAsync(string nodeId, CancellationToken cancellationToken = default)
    {
        var node = await _dbContext.GpuNodes.FirstOrDefaultAsync(n => n.Id == nodeId, cancellationToken);
        if (node == null) return false;

        node.Status = "AVAILABLE";
        node.CurrentJobId = null;
        node.CurrentJobName = null;
        node.UsedMemoryGb = 0;
        node.GpuUtilPercent = 0;
        node.CpuUtilPercent = 5;
        node.TemperatureC = 38;
        node.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
