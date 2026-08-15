using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ResourceService.Consumers;
using ResourceService.Data;
using ResourceService.Services;
using Shared.Auth;
using Shared.Messaging;

var builder = WebApplication.CreateBuilder(args);

// Add Services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

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
                       ?? "Host=localhost;Port=5432;Database=resource_db;Username=postgres;Password=devpassword";
builder.Services.AddDbContext<ResourceDbContext>(options =>
    options.UseNpgsql(connectionString));

// Scheduler & Domain Services
builder.Services.AddScoped<SchedulerService>();
builder.Services.AddScoped<IGpuNodeService, GpuNodeServiceImplementation>();

// Kafka Producer & Consumers
var kafkaBootstrap = builder.Configuration["KAFKA_BOOTSTRAP_SERVERS"] ?? "localhost:9092";
builder.Services.AddSingleton<IKafkaProducer>(sp => new KafkaProducer(
    kafkaBootstrap,
    sp.GetRequiredService<ILogger<KafkaProducer>>()
));

builder.Services.AddHostedService(sp => new JobCreatedConsumer(
    kafkaBootstrap,
    sp.GetRequiredService<IServiceScopeFactory>(),
    sp.GetRequiredService<IKafkaProducer>(),
    sp.GetRequiredService<ILogger<JobCreatedConsumer>>()
));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", () => Results.Ok(new { status = "Healthy", service = "ResourceService" }));

app.MapControllers();

// Auto Apply Migrations / Ensure DB Created in Dev
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ResourceDbContext>();
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
