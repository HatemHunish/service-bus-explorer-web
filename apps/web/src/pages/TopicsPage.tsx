import { Link } from 'react-router-dom';
import { Plus, Folder, RefreshCw } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { useTopics } from '@/hooks/useServiceBus';

export function TopicsPage() {
  const { data: topics, isLoading, refetch } = useTopics();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Topics</h1>
          <p className="text-muted-foreground">Manage your Service Bus topics and subscriptions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Topic
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground">Loading topics...</div>
      ) : !topics?.length ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <Folder className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No topics found</h3>
          <p className="mt-2 text-muted-foreground">
            Create a topic to start publishing messages
          </p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Subscriptions</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Size</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {topics.map((topic) => (
                <tr key={topic.name} className="border-b hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link
                      to={`/topics/${encodeURIComponent(topic.name)}`}
                      className="flex items-center gap-2 font-medium text-primary hover:underline"
                    >
                      <Folder className="h-4 w-4" />
                      {topic.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-topic/10 px-2 py-0.5 text-xs text-topic">
                      {topic.runtimeProperties?.subscriptionCount || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {((topic.runtimeProperties?.sizeInBytes || 0) / 1024).toFixed(1)} KB
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        topic.status === 'Active'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}
                    >
                      {topic.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
