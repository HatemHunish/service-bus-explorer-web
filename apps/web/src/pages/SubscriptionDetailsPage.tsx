import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { RefreshCw, Trash2, Send } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { useSubscription, useSubscriptionMessages, useSubscriptionDLQMessages, useRules, useSendTopicMessage } from '@/hooks/useServiceBus';
import { MessageEditor, SendMessageData } from '@/components/messages/MessageEditor';
import { MessageItem } from '@/components/messages/MessageItem';
import { toast } from '@/components/common/Toaster';

export function SubscriptionDetailsPage() {
  const { topicName, subscriptionName } = useParams<{ topicName: string; subscriptionName: string }>();
  const decodedTopicName = decodeURIComponent(topicName || '');
  const decodedSubName = decodeURIComponent(subscriptionName || '');

  const { data: subscription, isLoading, isError: subscriptionError, refetch } = useSubscription(decodedTopicName, decodedSubName);
  const { data: messages, isLoading: messagesLoading, refetch: refetchMessages } = useSubscriptionMessages(decodedTopicName, decodedSubName, 20);
  const { data: dlqMessages, isLoading: dlqLoading, isError: dlqError, refetch: refetchDLQ } = useSubscriptionDLQMessages(decodedTopicName, decodedSubName, 20);
  const { data: rules } = useRules(decodedTopicName, decodedSubName);
  const sendMessage = useSendTopicMessage();

  const [activeTab, setActiveTab] = useState<'properties' | 'messages' | 'send' | 'rules' | 'dlq'>('properties');

  const handleSendMessage = async (message: SendMessageData) => {
    try {
      await sendMessage.mutateAsync({
        name: decodedTopicName,
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
      toast('Message sent to topic successfully', 'default');
      // Refresh messages after sending
      setTimeout(() => refetchMessages(), 500);
    } catch (err) {
      toast(`Failed to send message: ${(err as Error).message}`, 'destructive');
    }
  };

  if (isLoading) {
    return <div className="text-center text-muted-foreground">Loading subscription details...</div>;
  }

  if (subscriptionError) {
    return (
      <div className="text-center">
        <p className="text-destructive">Failed to load subscription details.</p>
        <Button variant="outline" onClick={() => refetch()} className="mt-2">
          Try Again
        </Button>
      </div>
    );
  }

  if (!subscription) {
    return <div className="text-center text-muted-foreground">Subscription not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Topic: {decodedTopicName}</p>
          <h1 className="text-2xl font-semibold">{subscription.subscriptionName}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { refetch(); refetchMessages(); refetchDLQ(); }}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Active Messages</p>
          <p className="text-2xl font-semibold">{subscription.runtimeProperties?.activeMessageCount || 0}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Dead-letter</p>
          <p className="text-2xl font-semibold text-destructive">
            {subscription.runtimeProperties?.deadLetterMessageCount || 0}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Transfer</p>
          <p className="text-2xl font-semibold">{subscription.runtimeProperties?.transferMessageCount || 0}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Rules</p>
          <p className="text-2xl font-semibold">{rules?.length || 0}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {(['properties', 'messages', 'send', 'rules', 'dlq'] as const).map((tab) => (
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
            {tab === 'send' && (
              <span className="flex items-center gap-1">
                <Send className="h-3 w-3" />
                Send
              </span>
            )}
            {tab === 'rules' && 'Rules'}
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
              <p className="font-medium">{subscription.status}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Lock Duration</p>
              <p className="font-medium">{subscription.lockDuration}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Max Delivery Count</p>
              <p className="font-medium">{subscription.maxDeliveryCount}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Default TTL</p>
              <p className="font-medium">{subscription.defaultMessageTimeToLive}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Requires Session</p>
              <p className="font-medium">{subscription.requiresSession ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Dead-letter on Expiration</p>
              <p className="font-medium">{subscription.deadLetteringOnMessageExpiration ? 'Yes' : 'No'}</p>
            </div>
            {subscription.forwardTo && (
              <div>
                <p className="text-sm text-muted-foreground">Forward To</p>
                <p className="font-medium">{subscription.forwardTo}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'messages' && (
        <div className="rounded-lg border">
          <div className="flex items-center justify-between border-b p-3">
            <h3 className="font-semibold">Messages (Peek)</h3>
            <Button variant="outline" size="sm" onClick={() => refetchMessages()} disabled={messagesLoading}>
              <RefreshCw className={`mr-1 h-4 w-4 ${messagesLoading ? 'animate-spin' : ''}`} />
              {messagesLoading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
          <div className="max-h-[600px] overflow-auto">
            {messagesLoading ? (
              <p className="p-4 text-center text-muted-foreground">Loading messages...</p>
            ) : !messages?.length ? (
              <p className="p-4 text-center text-muted-foreground">No messages</p>
            ) : (
              messages.map((msg) => (
                <MessageItem key={msg.sequenceNumber} message={msg} />
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'send' && (
        <div className="rounded-lg border bg-card p-4">
          <div className="mb-4">
            <h3 className="font-semibold">Send Message to Topic</h3>
            <p className="text-sm text-muted-foreground">
              Messages sent here will be delivered to the topic "{decodedTopicName}" and routed to this subscription based on its filter rules.
            </p>
          </div>
          <MessageEditor
            onSend={handleSendMessage}
            isLoading={sendMessage.isPending}
            entityType="topic"
          />
        </div>
      )}

      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button>Add Rule</Button>
          </div>
          {!rules?.length ? (
            <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
              No rules defined
            </div>
          ) : (
            <div className="space-y-2">
              {rules.map((rule) => (
                <div key={rule.name} className="rounded-lg border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{rule.name}</h4>
                    <Button variant="ghost" size="sm" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {rule.filter && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground">Filter:</p>
                      <code className="text-xs">
                        {(rule.filter as any).sqlExpression || JSON.stringify(rule.filter)}
                      </code>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'dlq' && (
        <div className="rounded-lg border">
          <div className="flex items-center justify-between border-b p-3">
            <h3 className="font-semibold">Dead-letter Messages</h3>
            <Button variant="outline" size="sm" onClick={() => refetchDLQ()} disabled={dlqLoading}>
              <RefreshCw className={`mr-1 h-4 w-4 ${dlqLoading ? 'animate-spin' : ''}`} />
              {dlqLoading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
          <div className="max-h-[600px] overflow-auto">
            {dlqLoading ? (
              <p className="p-4 text-center text-muted-foreground">Loading dead-letter messages...</p>
            ) : dlqError ? (
              <p className="p-4 text-center text-destructive">Failed to load dead-letter messages. Click Refresh to try again.</p>
            ) : !dlqMessages?.length ? (
              <p className="p-4 text-center text-muted-foreground">No dead-letter messages</p>
            ) : (
              dlqMessages.map((msg) => (
                <MessageItem key={msg.sequenceNumber} message={msg} showDeadLetterInfo />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
