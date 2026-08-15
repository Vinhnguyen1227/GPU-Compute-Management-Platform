using System.Collections.Concurrent;
using System.Threading.Channels;

namespace JobService.Services;

public class JobLogBroadcaster
{
    private readonly ConcurrentDictionary<Guid, List<ChannelWriter<string>>> _subscribers = new();

    public IDisposable Subscribe(Guid jobId, ChannelWriter<string> writer)
    {
        var list = _subscribers.GetOrAdd(jobId, _ => new List<ChannelWriter<string>>());
        lock (list)
        {
            list.Add(writer);
        }

        return new Unsubscriber(() =>
        {
            lock (list)
            {
                list.Remove(writer);
                if (list.Count == 0)
                {
                    _subscribers.TryRemove(jobId, out _);
                }
            }
        });
    }

    public async Task BroadcastAsync(Guid jobId, string logLine)
    {
        if (!_subscribers.TryGetValue(jobId, out var list))
            return;

        List<ChannelWriter<string>> snapshot;
        lock (list)
        {
            snapshot = list.ToList();
        }

        foreach (var writer in snapshot)
        {
            try
            {
                await writer.WriteAsync(logLine);
            }
            catch
            {
                // Writer closed or subscriber disconnected
            }
        }
    }

    private sealed class Unsubscriber : IDisposable
    {
        private readonly Action _onDispose;
        public Unsubscriber(Action onDispose) => _onDispose = onDispose;
        public void Dispose() => _onDispose();
    }
}
