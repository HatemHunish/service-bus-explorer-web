import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ChevronRight,
  ChevronDown,
  Database,
  Folder,
  MessageSquare,
  Radio,
  Bell,
  Zap,
  RefreshCw,
  Reply,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/common/Button';
import { ScrollArea } from '@/components/common/ScrollArea';
import { useConnectionStore } from '@/store/useConnectionStore';
import { useQueues, useTopics } from '@/hooks/useServiceBus';

export function Sidebar() {
  const location = useLocation();
  const { activeConnection } = useConnectionStore();
  const [expandedSections, setExpandedSections] = useState<string[]>(['queues', 'topics']);

  const { data: queues, isLoading: queuesLoading, refetch: refetchQueues } = useQueues();
  const { data: topics, isLoading: topicsLoading, refetch: refetchTopics } = useTopics();

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  };

  const isExpanded = (section: string) => expandedSections.includes(section);

  if (!activeConnection) {
    return (
      <aside className="w-64 border-r bg-card">
        <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
          Connect to a namespace to browse entities
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 border-r bg-card flex flex-col">
      <div className="flex items-center justify-between border-b p-2">
        <span className="text-sm font-medium">Entities</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => {
            refetchQueues();
            refetchTopics();
          }}
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* Queues Section */}
          <div className="mb-2">
            <button
              onClick={() => toggleSection('queues')}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent"
            >
              {isExpanded('queues') ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <Database className="h-4 w-4 text-queue" />
              <span>Queues</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {queues?.length || 0}
              </span>
            </button>
            {isExpanded('queues') && (
              <div className="ml-4 mt-1 space-y-0.5">
                {queuesLoading ? (
                  <div className="px-2 py-1 text-xs text-muted-foreground">Loading...</div>
                ) : queues?.length === 0 ? (
                  <div className="px-2 py-1 text-xs text-muted-foreground">No queues</div>
                ) : (
                  queues?.map((queue) => (
                    <Link
                      key={queue.name}
                      to={`/queues/${encodeURIComponent(queue.name)}`}
                      className={cn(
                        'flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-accent',
                        location.pathname === `/queues/${encodeURIComponent(queue.name)}` &&
                          'bg-accent'
                      )}
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-queue" />
                      <span className="truncate">{queue.name}</span>
                      {queue.runtimeProperties && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          {queue.runtimeProperties.activeMessageCount}
                        </span>
                      )}
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Topics Section */}
          <div className="mb-2">
            <button
              onClick={() => toggleSection('topics')}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent"
            >
              {isExpanded('topics') ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <Folder className="h-4 w-4 text-topic" />
              <span>Topics</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {topics?.length || 0}
              </span>
            </button>
            {isExpanded('topics') && (
              <div className="ml-4 mt-1 space-y-0.5">
                {topicsLoading ? (
                  <div className="px-2 py-1 text-xs text-muted-foreground">Loading...</div>
                ) : topics?.length === 0 ? (
                  <div className="px-2 py-1 text-xs text-muted-foreground">No topics</div>
                ) : (
                  topics?.map((topic) => (
                    <Link
                      key={topic.name}
                      to={`/topics/${encodeURIComponent(topic.name)}`}
                      className={cn(
                        'flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-accent',
                        location.pathname.startsWith(`/topics/${encodeURIComponent(topic.name)}`) &&
                          'bg-accent'
                      )}
                    >
                      <Radio className="h-3.5 w-3.5 text-topic" />
                      <span className="truncate">{topic.name}</span>
                      {topic.runtimeProperties && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          {topic.runtimeProperties.subscriptionCount}
                        </span>
                      )}
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Event Hubs Section */}
          <div className="mb-2">
            <button
              onClick={() => toggleSection('eventhubs')}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent"
            >
              {isExpanded('eventhubs') ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <Zap className="h-4 w-4 text-eventhub" />
              <span>Event Hubs</span>
            </button>
            {isExpanded('eventhubs') && (
              <div className="ml-4 mt-1">
                <Link
                  to="/event-hubs"
                  className="flex items-center gap-2 rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-accent"
                >
                  View Event Hubs
                </Link>
              </div>
            )}
          </div>

          {/* Notification Hubs Section */}
          <div className="mb-2">
            <button
              onClick={() => toggleSection('notificationhubs')}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent"
            >
              {isExpanded('notificationhubs') ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <Bell className="h-4 w-4 text-purple-500" />
              <span>Notification Hubs</span>
            </button>
          </div>

          {/* Auto-Reply Section */}
          <div className="mb-2">
            <Link
              to="/auto-reply"
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent',
                location.pathname === '/auto-reply' && 'bg-accent'
              )}
            >
              <Reply className="h-4 w-4 text-orange-500" />
              <span>Auto-Reply</span>
            </Link>
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}
