using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.EntityFrameworkCore;
using PaymentService.Config;
using PaymentService.Consumers;
using PaymentService.Data;
using PaymentService.Services;
using PaymentService.Validators;
using Shared.Messaging;

var builder = WebApplication.CreateBuilder(args);

// Load optional secrets file and environment variables
builder.Configuration
    .AddJsonFile("appsettings.Secrets.json", optional: true, reloadOnChange: true)
    .AddEnvironmentVariables();

// Controllers & FluentValidation
builder.Services.AddControllers();
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<DepositRequestValidator>();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Host=localhost;Port=5432;Database=payment_db;Username=postgres;Password=devpassword";
builder.Services.AddDbContext<PaymentDbContext>(options =>
    options.UseNpgsql(connectionString));

// Kafka Messaging
var kafkaBootstrap = builder.Configuration["Kafka:BootstrapServers"] ?? "localhost:9092";
builder.Services.AddSingleton<IKafkaProducer>(sp =>
{
    var logger = sp.GetRequiredService<ILogger<KafkaProducer>>();
    return new KafkaProducer(kafkaBootstrap, logger);
});

// PayOS Configuration
builder.Services.Configure<PayOSSettings>(builder.Configuration.GetSection("PayOS"));

// HTTP Client & PayOS Service
builder.Services.AddHttpClient<IPayOSService, PayOSService>();

// Domain Services
builder.Services.AddScoped<IPaymentGateway, SimulatedPaymentGateway>();
builder.Services.AddScoped<IBillingEngine, BillingEngine>();
builder.Services.AddScoped<IWalletService, WalletService>();

// Kafka Consumers (Hosted Services)
builder.Services.AddHostedService<JobCompletedConsumer>();
builder.Services.AddHostedService<JobFailedConsumer>();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");

app.MapGet("/health", () => Results.Ok(new { status = "Healthy", service = "PaymentService" }));

app.MapControllers();

app.Run();
