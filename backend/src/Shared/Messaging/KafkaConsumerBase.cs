using System.Text.Json;
using Confluent.Kafka;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Shared.Messaging;

/// <summary>
/// Base class for Kafka consumers. Subclasses override HandleMessageAsync to process
/// deserialized events. Runs as a BackgroundService with graceful shutdown.
/// </summary>
public abstract class KafkaConsumerBase<T> : BackgroundService
{
    private readonly string _topic;
    private readonly string _groupId;
    private readonly string _bootstrapServers;
    private readonly ILogger _logger;

    protected KafkaConsumerBase(
        string bootstrapServers,
        string groupId,
        string topic,
        ILogger logger)
    {
        _bootstrapServers = bootstrapServers;
        _groupId = groupId;
        _topic = topic;
        _logger = logger;
    }

    protected abstract Task HandleMessageAsync(T message, CancellationToken cancellationToken);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var config = new ConsumerConfig
        {
            BootstrapServers = _bootstrapServers,
            GroupId = _groupId,
            AutoOffsetReset = AutoOffsetReset.Earliest,
            EnableAutoCommit = false
        };

        using var consumer = new ConsumerBuilder<string, string>(config).Build();
        consumer.Subscribe(_topic);

        _logger.LogInformation("Kafka consumer started: topic={Topic}, group={GroupId}", _topic, _groupId);

        try
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var result = consumer.Consume(stoppingToken);

                    if (result?.Message?.Value == null)
                        continue;

                    var message = JsonSerializer.Deserialize<T>(result.Message.Value, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    if (message != null)
                    {
                        await HandleMessageAsync(message, stoppingToken);
                        consumer.Commit(result);
                    }
                }
                catch (ConsumeException ex)
                {
                    _logger.LogError(ex, "Kafka consume error on topic {Topic}: {Reason}", _topic, ex.Error.Reason);
                }
                catch (JsonException ex)
                {
                    _logger.LogError(ex, "Failed to deserialize message from topic {Topic}", _topic);
                }
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("Kafka consumer stopping: topic={Topic}", _topic);
        }
        finally
        {
            consumer.Close();
        }
    }
}
