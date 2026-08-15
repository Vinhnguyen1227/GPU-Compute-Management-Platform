namespace JobService.Models;

public class SubmitJobRequest
{
    public string Name { get; set; } = string.Empty;
    public Guid ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public string GpuType { get; set; } = string.Empty;
    public int GpuCount { get; set; } = 1;
    public decimal DurationHours { get; set; }
    public decimal CostPerHour { get; set; }
    public decimal TotalCost { get; set; }
    public string? Command { get; set; }
    public string? Framework { get; set; }
}
