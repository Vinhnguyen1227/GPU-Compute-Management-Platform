using FluentValidation;
using JobService.Models;

namespace JobService.Validators;

public class SubmitJobRequestValidator : AbstractValidator<SubmitJobRequest>
{
    public SubmitJobRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("Job name is required").MaximumLength(255);
        RuleFor(x => x.ProjectId).NotEmpty().WithMessage("ProjectId is required");
        RuleFor(x => x.GpuType).NotEmpty().WithMessage("GPU type is required");
        RuleFor(x => x.GpuCount).GreaterThanOrEqualTo(1).WithMessage("At least 1 GPU is required");
        RuleFor(x => x.DurationHours).GreaterThan(0).WithMessage("Duration must be greater than 0");
        RuleFor(x => x.CostPerHour).GreaterThanOrEqualTo(0).WithMessage("Cost per hour must be non-negative");
    }
}
