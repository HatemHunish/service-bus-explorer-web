import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { useSubscription, useSubscriptionMessages, useSubscriptionDLQMessages, useRules } from '@/hooks/useServiceBus';

export function SubscriptionDetailsPage() {
  const { topicName, subscriptionName } = useParams<{ topicName: string; subscriptionName: string }>();
  const decodedTopicName = decodeURIComponent(topicName || '');
  const decodedSubName = decodeURIComponent(subscriptionName || '');

  const { data: subscription, isLoading, refetch } = useSubscription(decodedTopicName, decodedSubName);
  const { data: messages, refetch: refetchMessages } = useSubscriptionMessages(decodedTopicName, decodedSubName, 20);
  const { data: dlqMessages, refetch: refetchDLQ } = useSubscriptionDLQMessages(decodedTopicName, decodedSubName, 20);
  const { data: rules } = useRules(decodedTopicName, decodedSubName);

  const [activeTab, setActiveTab] = useState<'properties' | 'messages' | 'rules' | 'dlq'>('properties');

  if (isLoading) {
    return <div className="text-center text-muted-foreground">Loading subscription details...</div>;
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
          <Button variant="outline" onClick={() => { refetch(); refetchMessages(); }}>
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
        {(['properties', 'messages', 'rules', 'dlq'] as const).map((tab) => (
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
