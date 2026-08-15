namespace ResourceService.Models;

public record GpuNodeDto(
    string Id,
    string Name,
    string GpuModel,
    int TotalMemoryGB,
    int UsedMemoryGB,
    decimal GpuUtilPercent,
    decimal CpuUtilPercent,
    int TemperatureC,
    string Status,
    string? CurrentJobId,
    string? CurrentJobName
);

public record ClusterMetricsDto(
    int ActiveJobs,
    int QueuedJobs,
    int TotalGpus,
    int AvailableGpus,
    decimal AvgGpuUtilization,
    decimal TotalComputeHours,
    decimal SystemKafkaLag
);

public record UpdateNodeStatusRequest(
    string Status // AVAILABLE | MAINTENANCE
);
