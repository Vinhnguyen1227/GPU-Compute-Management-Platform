using System.Threading.Channels;
using JobService.Services;
using Xunit;

namespace JobService.Tests;

public class JobLogBroadcasterTests
{
    [Fact]
    public async Task BroadcastAsync_ShouldSendLogToSubscriberChannel()
    {
        // Arrange
        var broadcaster = new JobLogBroadcaster();
        var jobId = Guid.NewGuid();
        var channel = Channel.CreateUnbounded<string>();

        using var subscription = broadcaster.Subscribe(jobId, channel.Writer);

        // Act
        var testLog = "[Epoch 1/10] Loss: 0.123, GPU Temp: 65C";
        await broadcaster.BroadcastAsync(jobId, testLog);

        // Assert
        Assert.True(channel.Reader.TryRead(out var receivedLog));
        Assert.Equal(testLog, receivedLog);
    }

    [Fact]
    public async Task Unsubscribe_ShouldRemoveChannelFromBroadcaster()
    {
        // Arrange
        var broadcaster = new JobLogBroadcaster();
        var jobId = Guid.NewGuid();
        var channel = Channel.CreateUnbounded<string>();

        var subscription = broadcaster.Subscribe(jobId, channel.Writer);
        subscription.Dispose();

        // Act
        await broadcaster.BroadcastAsync(jobId, "This log should not be delivered");

        // Assert
        Assert.False(channel.Reader.TryRead(out _));
    }
}
