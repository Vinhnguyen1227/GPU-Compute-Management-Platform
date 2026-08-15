using Shared.Messaging;
using WorkerService.Services;
using WorkerService.Workers;

var builder = Host.CreateApplicationBuilder(args);

// Kafka Messaging
var kafkaBootstrap = builder.Configuration["Kafka:BootstrapServers"] ?? "localhost:9092";
builder.Services.AddSingleton<IKafkaProducer>(sp =>
{
    var logger = sp.GetRequiredService<ILogger<KafkaProducer>>();
    return new KafkaProducer(kafkaBootstrap, logger);
});

// Services
builder.Services.AddSingleton<GpuSimulator>();

// Hosted Worker
builder.Services.AddHostedService<GpuJobWorker>();

var host = builder.Build();
host.Run();
