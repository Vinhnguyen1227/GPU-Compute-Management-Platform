using FluentValidation;
using FluentValidation.AspNetCore;
using JobService.Consumers;
using JobService.Data;
using JobService.Events;
using JobService.Services;
using JobService.Validators;
using Microsoft.EntityFrameworkCore;
using Shared.Messaging;

var builder = WebApplication.CreateBuilder(args);

// Controllers & Validation
builder.Services.AddControllers();
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<SubmitJobRequestValidator>();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Host=localhost;Port=5432;Database=job_db;Username=postgres;Password=devpassword";
builder.Services.AddDbContext<JobDbContext>(options =>
    options.UseNpgsql(connectionString));

// Kafka Messaging
var kafkaBootstrap = builder.Configuration["Kafka:BootstrapServers"] ?? "localhost:9092";
builder.Services.AddSingleton<IKafkaProducer>(sp =>
{
    var logger = sp.GetRequiredService<ILogger<KafkaProducer>>();
    return new KafkaProducer(kafkaBootstrap, logger);
});

// App Services & Singletons
builder.Services.AddSingleton<JobLogBroadcaster>();
builder.Services.AddScoped<JobEventProducer>();
builder.Services.AddScoped<IJobService, JobService.Services.JobService>();

// Kafka Consumers (Hosted Services)
builder.Services.AddHostedService<JobAssignedConsumer>();
builder.Services.AddHostedService<JobProgressConsumer>();
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

app.MapGet("/health", () => Results.Ok(new { status = "Healthy", service = "JobService" }));

app.MapControllers();

app.Run();
