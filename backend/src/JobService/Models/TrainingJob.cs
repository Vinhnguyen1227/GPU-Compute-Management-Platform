using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace JobService.Models;

[Table("training_jobs")]
public class TrainingJob
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("owner_id")]
    public Guid OwnerId { get; set; }

    [Column("project_id")]
    public Guid ProjectId { get; set; }

    [MaxLength(255)]
    [Column("project_name")]
    public string ProjectName { get; set; } = string.Empty;

    [MaxLength(255)]
    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [MaxLength(100)]
    [Column("gpu_type")]
    public string GpuType { get; set; } = string.Empty;

    [Column("gpu_count")]
    public int GpuCount { get; set; } = 1;

    [MaxLength(20)]
    [Column("status")]
    public string Status { get; set; } = "CREATED"; // CREATED | QUEUED | RUNNING | COMPLETED | FAILED

    [Column("progress")]
    public int Progress { get; set; } = 0;

    [Column("duration_hours")]
    public decimal? DurationHours { get; set; }

    [Column("cost_per_hour")]
    public decimal CostPerHour { get; set; }

    [Column("total_cost")]
    public decimal TotalCost { get; set; }

    [MaxLength(100)]
    [Column("assigned_node_id")]
    public string? AssignedNodeId { get; set; }

    [Column("command")]
    public string? Command { get; set; }

    [MaxLength(100)]
    [Column("framework")]
    public string? Framework { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("started_at")]
    public DateTime? StartedAt { get; set; }

    [Column("completed_at")]
    public DateTime? CompletedAt { get; set; }
}
