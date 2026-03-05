import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { RefreshCw, Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { useQueue, useQueueMessages, useQueueDLQMessages, useSendQueueMessage, usePurgeQueue } from '@/hooks/useServiceBus';
import { toast } from '@/components/common/Toaster';

export function QueueDetailsPage() {
  const { queueName } = useParams<{ queueName: string }>();
  const decodedName = decodeURIComponent(queueName || '');

  const { data: queue, isLoading, refetch } = useQueue(decodedName);
  const { data: messages, refetch: refetchMessages } = useQueueMessages(decodedName, 20);
  const { data: dlqMessages, refetch: refetchDLQ } = useQueueDLQMessages(decodedName, 20);
  const sendMessage = useSendQueueMessage();
  const purgeQueue = usePurgeQueue();

  const [activeTab, setActiveTab] = useState<'properties' | 'messages' | 'dlq'>('properties');
  const [messageBody, setMessageBody] = useState('');

  const handleSend = async () => {
    if (!messageBody.trim()) {
      toast('Please enter a message body', 'destructive');
      return;
    }

    try {
      await sendMessage.mutateAsync({
        name: decodedName,
        message: {
          body: messageBody,
          bodyType: 'text',
        },
      });
      toast('Message sent successfully');
      setMessageBody('');
      refetchMessages();
    } catch (error: any) {
      toast(error.message || 'Failed to send message', 'destructive');
    }
  };

  const handlePurge = async () => {
    if (!confirm('Are you sure you want to purge all messages?')) return;

    try {
      const result = await purgeQueue.mutateAsync({ name: decodedName });
      toast(`Purged ${result.purgedCount} messages`);
      refetch();
      refetchMessages();
    } catch (error: any) {
      toast(error.message || 'Failed to purge queue', 'destructive');
    }
  };

  if (isLoading) {
    return <div className="text-center text-muted-foreground">Loading queue details...</div>;
  }

  if (!queue) {
    return <div className="text-center text-muted-foreground">Queue not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{queue.name}</h1>
          <p className="text-muted-foreground">Queue details and messages</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="destructive" onClick={handlePurge}>
            <Trash2 className="mr-2 h-4 w-4" />
            Purge
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Active Messages</p>
          <p className="text-2xl font-semibold">{queue.runtimeProperties?.activeMessageCount || 0}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Dead-letter</p>
          <p className="text-2xl font-semibold text-destructive">
            {queue.runtimeProperties?.deadLetterMessageCount || 0}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Scheduled</p>
          <p className="text-2xl font-semibold">{queue.runtimeProperties?.scheduledMessageCount || 0}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Size</p>
          <p className="text-2xl font-semibold">
            {((queue.runtimeProperties?.sizeInBytes || 0) / 1024).toFixed(1)} KB
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {(['properties', 'messages', 'dlq'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === tab
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'properties' && 'Properties'}
            {tab === 'messages' && 'Messages'}
            {tab === 'dlq' && 'Dead-letter'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'properties' && (
        <div className="rounded-lg border bg-card p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium">{queue.status}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Max Size</p>
              <p className="font-medium">{queue.maxSizeInMegabytes} MB</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Max Delivery Count</p>
              <p className="font-medium">{queue.maxDeliveryCount}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Lock Duration</p>
              <p className="font-medium">{queue.lockDuration}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Requires Session</p>
              <p className="font-medium">{queue.requiresSession ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Partitioning</p>
              <p className="font-medium">{queue.enablePartitioning ? 'Enabled' : 'Disabled'}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'messages' && (
        <div className="space-y-4">
          {/* Send Message */}
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold">Send Message</h3>
            <div className="mt-2 flex gap-2">
              <textarea
                className="flex-1 rounded-md border bg-background px-3 py-2"
                rows={3}
                placeholder="Message body..."
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
              />
              <Button onClick={handleSend} disabled={sendMessage.isPending}>
                <Send className="mr-2 h-4 w-4" />
                Send
              </Button>
            </div>
          </div>

          {/* Messages List */}
          <div className="rounded-lg border">
            <div className="flex items-center justify-between border-b p-3">
              <h3 className="font-semibold">Messages (Peek)</h3>
              <Button variant="outline" size="sm" onClick={() => refetchMessages()}>
                <RefreshCw className="mr-1 h-4 w-4" />
                Refresh
              </Button>
            </div>
            <div className="max-h-96 overflow-auto">
              {!messages?.length ? (
                <p className="p-4 text-center text-muted-foreground">No messages</p>
              ) : (
                messages.map((msg, i) => (
                  <div key={msg.sequenceNumber || i} className="border-b p-3 last:border-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">#{msg.sequenceNumber}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.enqueuedTime).toLocaleString()}
                      </span>
                    </div>
                    <pre className="mt-2 max-h-24 overflow-auto rounded bg-muted p-2 text-xs">
                      {msg.body}
                    </pre>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'dlq' && (
        <div className="rounded-lg border">
          <div className="flex items-center justify-between border-b p-3">
            <h3 className="font-semibold">Dead-letter Messages</h3>
            <Button variant="outline" size="sm" onClick={() => refetchDLQ()}>
              <RefreshCw className="mr-1 h-4 w-4" />
              Refresh
            </Button>
          </div>
          <div className="max-h-96 overflow-auto">
            {!dlqMessages?.length ? (
              <p className="p-4 text-center text-muted-foreground">No dead-letter messages</p>
            ) : (
              dlqMessages.map((msg, i) => (
                <div key={msg.sequenceNumber || i} className="border-b p-3 last:border-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">#{msg.sequenceNumber}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.enqueuedTime).toLocaleString()}
                    </span>
                  </div>
                  {msg.deadLetterReason && (
                    <p className="mt-1 text-sm text-destructive">
                      Reason: {msg.deadLetterReason}
                    </p>
                  )}
                  {msg.deadLetterErrorDescription && (
                    <p className="text-xs text-muted-foreground">
                      {msg.deadLetterErrorDescription}
                    </p>
                  )}
                  <pre className="mt-2 max-h-24 overflow-auto rounded bg-muted p-2 text-xs">
                    {msg.body}
                  </pre>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
