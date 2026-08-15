using FluentValidation;
using PaymentService.Models;

namespace PaymentService.Validators;

public class DepositRequestValidator : AbstractValidator<DepositRequest>
{
    public DepositRequestValidator()
    {
        RuleFor(x => x.Amount).GreaterThan(0).WithMessage("Deposit amount must be greater than 0");
        RuleFor(x => x.PaymentMethod).NotEmpty().WithMessage("Payment method is required");
    }
}
