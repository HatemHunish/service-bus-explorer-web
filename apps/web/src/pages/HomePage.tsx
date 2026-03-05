import { Link, useNavigate } from 'react-router-dom';
import { Database, Folder, Zap, MessageSquare, ArrowRight, Plug, Plus } from 'lucide-react';
import { useQueues, useTopics } from '@/hooks/useServiceBus';
import { Button } from '@/components/common/Button';
import { useConnectionStore } from '@/store/useConnectionStore';

export function HomePage() {
  const navigate = useNavigate();
  const { activeConnection, connections } = useConnectionStore();
  const { data: queues } = useQueues();
  const { data: topics } = useTopics();

  const totalQueueMessages = queues?.reduce(
    (sum, q) => sum + (q.runtimeProperties?.activeMessageCount || 0),
    0
  ) || 0;

  const totalDLQMessages = queues?.reduce(
    (sum, q) => sum + (q.runtimeProperties?.deadLetterMessageCount || 0),
    0
  ) || 0;

  // Show Get Started when no active connection
  if (!activeConnection) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Plug className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Welcome to Service Bus Explorer</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Connect to your Azure Service Bus namespace to get started managing queues, topics, and messages.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" onClick={() => navigate('/connections')}>
              <Plus className="mr-2 h-5 w-5" />
              {connections.length > 0 ? 'Manage Connections' : 'Add Connection'}
            </Button>
          </div>
          {connections.length > 0 && (
            <p className="mt-4 text-sm text-muted-foreground">
              You have {connections.length} saved connection{connections.length > 1 ? 's' : ''}.
              Go to Connections to activate one.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your Azure Service Bus namespace
          {activeConnection.namespace && (
            <span className="ml-2 font-mono text-sm">({activeConnection.namespace})</span>
          )}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-queue/10 p-2">
              <Database className="h-5 w-5 text-queue" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Queues</p>
              <p className="text-2xl font-semibold">{queues?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-topic/10 p-2">
              <Folder className="h-5 w-5 text-topic" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Topics</p>
              <p className="text-2xl font-semibold">{topics?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Messages</p>
              <p className="text-2xl font-semibold">{totalQueueMessages}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-destructive/10 p-2">
              <Zap className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Dead-letter Messages</p>
              <p className="text-2xl font-semibold">{totalDLQMessages}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold">Queues</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your Service Bus queues and messages
          </p>
          <div className="mt-4 space-y-2">
            {queues?.slice(0, 5).map((queue) => (
              <Link
                key={queue.name}
                to={`/queues/${encodeURIComponent(queue.name)}`}
                className="flex items-center justify-between rounded-md border p-3 hover:bg-accent"
              >
                <div className="flex items-center gap-3">
                  <Database className="h-4 w-4 text-queue" />
                  <span className="font-medium">{queue.name}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>{queue.runtimeProperties?.activeMessageCount || 0} msgs</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
            {(!queues || queues.length === 0) && (
              <p className="text-sm text-muted-foreground">No queues found</p>
            )}
          </div>
          <Link to="/queues" className="mt-4 block">
            <Button variant="outline" className="w-full">
              View All Queues
            </Button>
          </Link>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold">Topics</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your Service Bus topics and subscriptions
          </p>
          <div className="mt-4 space-y-2">
            {topics?.slice(0, 5).map((topic) => (
              <Link
                key={topic.name}
                to={`/topics/${encodeURIComponent(topic.name)}`}
                className="flex items-center justify-between rounded-md border p-3 hover:bg-accent"
              >
                <div className="flex items-center gap-3">
                  <Folder className="h-4 w-4 text-topic" />
                  <span className="font-medium">{topic.name}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>{topic.runtimeProperties?.subscriptionCount || 0} subs</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
            {(!topics || topics.length === 0) && (
              <p className="text-sm text-muted-foreground">No topics found</p>
            )}
          </div>
          <Link to="/topics" className="mt-4 block">
            <Button variant="outline" className="w-full">
              View All Topics
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
