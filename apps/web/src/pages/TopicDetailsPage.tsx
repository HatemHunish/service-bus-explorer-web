import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { RefreshCw, Plus, Radio, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { useTopic, useSubscriptions, useSendTopicMessage } from '@/hooks/useServiceBus';
import { MessageEditor, SendMessageData } from '@/components/messages/MessageEditor';
import { toast } from '@/components/common/Toaster';

export function TopicDetailsPage() {
  const { topicName } = useParams<{ topicName: string }>();
  const decodedName = decodeURIComponent(topicName || '');

  const { data: topic, isLoading, refetch } = useTopic(decodedName);
  const { data: subscriptions, refetch: refetchSubs } = useSubscriptions(decodedName);
  const sendMessage = useSendTopicMessage();

  const [activeTab, setActiveTab] = useState<'properties' | 'subscriptions' | 'send'>('properties');

  const handleSendMessage = async (message: SendMessageData) => {
    try {
      await sendMessage.mutateAsync({
        name: decodedName,
        message: {
          body: message.body,
          bodyType: message.bodyType,
          messageId: message.messageId,
          correlationId: message.correlationId,
          sessionId: message.sessionId,
          partitionKey: message.partitionKey,
          contentType: message.contentType,
          subject: message.label,
          to: message.to,
          replyTo: message.replyTo,
          replyToSessionId: message.replyToSessionId,
          timeToLive: message.timeToLive,
          scheduledEnqueueTime: message.scheduledEnqueueTime ? new Date(message.scheduledEnqueueTime) : undefined,
          applicationProperties: message.applicationProperties,
        },
      });
      toast('Message sent successfully');
      refetchSubs();
    } catch (error: any) {
      toast(error.message || 'Failed to send message', 'destructive');
    }
  };

  if (isLoading) {
    return <div className="text-center text-muted-foreground">Loading topic details...</div>;
  }

  if (!topic) {
    return <div className="text-center text-muted-foreground">Topic not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{topic.name}</h1>
          <p className="text-muted-foreground">Topic details and subscriptions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { refetch(); refetchSubs(); }}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Subscriptions</p>
          <p className="text-2xl font-semibold">{topic.runtimeProperties?.subscriptionCount || 0}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Scheduled Messages</p>
          <p className="text-2xl font-semibold">{topic.runtimeProperties?.scheduledMessageCount || 0}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Size</p>
          <p className="text-2xl font-semibold">
            {((topic.runtimeProperties?.sizeInBytes || 0) / 1024).toFixed(1)} KB
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {(['properties', 'subscriptions', 'send'] as const).map((tab) => (
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
            {tab === 'subscriptions' && 'Subscriptions'}
            {tab === 'send' && 'Send Message'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'properties' && (
        <div className="rounded-lg border bg-card p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium">{topic.status}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Max Size</p>
              <p className="font-medium">{topic.maxSizeInMegabytes} MB</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Default TTL</p>
              <p className="font-medium">{topic.defaultMessageTimeToLive}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Partitioning</p>
              <p className="font-medium">{topic.enablePartitioning ? 'Enabled' : 'Disabled'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Duplicate Detection</p>
              <p className="font-medium">{topic.requiresDuplicateDetection ? 'Enabled' : 'Disabled'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ordering</p>
              <p className="font-medium">{topic.supportOrdering ? 'Supported' : 'Not supported'}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'subscriptions' && (
        <div className="space-y-4">
          {!subscriptions?.length && (
            <div className="flex items-start gap-3 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-700 dark:text-yellow-400">No subscriptions configured</h4>
                <p className="text-sm text-yellow-600 dark:text-yellow-500 mt-1">
                  Messages sent to this topic cannot be viewed without a subscription.
                  Create a subscription to start receiving and viewing messages.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Subscription
            </Button>
          </div>

          {!subscriptions?.length ? (
            <div className="rounded-lg border bg-card p-8 text-center">
              <Radio className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No subscriptions</h3>
              <p className="mt-2 text-muted-foreground">
                Create a subscription to receive messages from this topic.
                Without a subscription, messages sent to this topic will be lost.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Active</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Dead-letter</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((sub) => (
                    <tr key={sub.subscriptionName} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <Link
                          to={`/topics/${encodeURIComponent(decodedName)}/subscriptions/${encodeURIComponent(sub.subscriptionName)}`}
                          className="flex items-center gap-2 font-medium text-primary hover:underline"
                        >
                          <Radio className="h-4 w-4" />
                          {sub.subscriptionName}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                          {sub.runtimeProperties?.activeMessageCount || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
                          {sub.runtimeProperties?.deadLetterMessageCount || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            sub.status === 'Active'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'send' && (
        <div className="rounded-lg border bg-card p-4">
          <div className="mb-4">
            <h3 className="font-semibold">Send Message to Topic</h3>
            <p className="text-sm text-muted-foreground">
              Message will be delivered to all subscriptions based on their filter rules.
            </p>
            {!subscriptions?.length && (
              <div className="mt-2 flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-500">
                <AlertTriangle className="h-4 w-4" />
                <span>Warning: No subscriptions exist. Messages will be lost.</span>
              </div>
            )}
          </div>
          <MessageEditor
            onSend={handleSendMessage}
            isLoading={sendMessage.isPending}
            entityType="topic"
          />
        </div>
      )}
    </div>
  );
}
