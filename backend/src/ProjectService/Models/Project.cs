using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProjectService.Models;

[Table("projects")]
public class Project
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [Column("owner_id")]
    public Guid OwnerId { get; set; }

    [Required]
    [MaxLength(255)]
    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("description")]
    public string? Description { get; set; }

    [MaxLength(255)]
    [Column("dataset_name")]
    public string? DatasetName { get; set; }

    [MaxLength(50)]
    [Column("dataset_size")]
    public string? DatasetSize { get; set; }

    [Column("job_count")]
    public int JobCount { get; set; } = 0;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
