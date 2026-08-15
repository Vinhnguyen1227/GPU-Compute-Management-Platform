using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ResourceService.Models;

[Table("gpu_nodes")]
public class GpuNode
{
    [Key]
    [Column("id")]
    [MaxLength(100)]
    public string Id { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    [Column("gpu_model")]
    public string GpuModel { get; set; } = string.Empty;

    [Column("total_memory_gb")]
    public int TotalMemoryGb { get; set; }

    [Column("used_memory_gb")]
    public int UsedMemoryGb { get; set; } = 0;

    [Column("gpu_util_percent")]
    public decimal GpuUtilPercent { get; set; } = 0;

    [Column("cpu_util_percent")]
    public decimal CpuUtilPercent { get; set; } = 0;

    [Column("temperature_c")]
    public int TemperatureC { get; set; } = 35;

    [Required]
    [MaxLength(20)]
    [Column("status")]
    public string Status { get; set; } = "AVAILABLE"; // AVAILABLE | BUSY | MAINTENANCE

    [MaxLength(100)]
    [Column("current_job_id")]
    public string? CurrentJobId { get; set; }

    [MaxLength(255)]
    [Column("current_job_name")]
    public string? CurrentJobName { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
