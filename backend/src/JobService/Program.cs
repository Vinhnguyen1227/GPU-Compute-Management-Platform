using System.Text;
using FluentValidation;
using FluentValidation.AspNetCore;
using JobService.Consumers;
using JobService.Data;
using JobService.Events;
using JobService.Services;
using JobService.Validators;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Shared.Auth;
using Shared.Messaging;

var builder = WebApplication.CreateBuilder(args);

// Controllers & Validation
builder.Services.AddControllers();
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<SubmitJobRequestValidator>();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHttpClient();

// Options Configuration
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("JwtSettings"));
var jwtSettings = builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>() ?? new JwtSettings
{
    SecretKey = builder.Configuration["JWT_SECRET_KEY"] ?? "your-256-bit-secret-key-for-dev",
    Issuer = builder.Configuration["JWT_ISSUER"] ?? "ai-cloud-platform",
    Audience = builder.Configuration["JWT_AUDIENCE"] ?? "ai-cloud-clients"
};

// JWT Authentication
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidAudience = jwtSettings.Audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.SecretKey))
    };
});

// DbContext
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
                       ?? "Host=localhost;Port=5432;Database=job_db;Username=postgres;Password=devpassword";
builder.Services.AddDbContext<JobDbContext>(options =>
    options.UseNpgsql(connectionString));

// Kafka Configuration
var kafkaBootstrap = builder.Configuration["KAFKA_BOOTSTRAP_SERVERS"] ?? builder.Configuration["Kafka:BootstrapServers"] ?? "localhost:9092";
builder.Services.AddSingleton<IKafkaProducer>(sp => new KafkaProducer(
    kafkaBootstrap,
    sp.GetRequiredService<ILogger<KafkaProducer>>()
));

// App Services & Singletons
builder.Services.AddSingleton<JobLogBroadcaster>();
builder.Services.AddScoped<JobEventProducer>();
builder.Services.AddScoped<IJobService, JobServiceImplementation>();

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
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", () => Results.Ok(new { status = "Healthy", service = "JobService" }));

app.MapControllers();

// Auto Apply Migrations / Ensure DB Created in Dev
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<JobDbContext>();
    try
    {
        db.Database.EnsureCreated();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[Warning] Database EnsureCreated failed: {ex.Message}");
    }
}

app.Run();
