import { useState } from 'react';
import { Plus, Radio, RefreshCw, Activity, Users } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { useConnectionStore } from '@/store/useConnectionStore';

interface EventHub {
  name: string;
  partitionCount: number;
  consumerGroups: string[];
  createdAt: string;
  status: string;
}

export function EventHubsPage() {
  const { activeConnection } = useConnectionStore();
  const [eventHubs] = useState<EventHub[]>([]);
  const [isLoading] = useState(false);
  const [selectedHub, setSelectedHub] = useState<string | null>(null);

  if (!activeConnection) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Radio className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No Connection</h3>
          <p className="mt-2 text-muted-foreground">
            Connect to an Event Hubs namespace to view event hubs
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Event Hubs</h1>
          <p className="text-muted-foreground">Manage your Event Hubs and partitions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {}}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Event Hub
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground">Loading event hubs...</div>
      ) : !eventHubs.length ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <Radio className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No Event Hubs found</h3>
          <p className="mt-2 text-muted-foreground">
            Create an Event Hub to start streaming events
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Event Hubs List */}
          <div className="lg:col-span-1">
            <div className="rounded-lg border">
              <div className="border-b p-3">
                <h3 className="font-semibold">Event Hubs</h3>
              </div>
              <div className="divide-y">
                {eventHubs.map((hub) => (
                  <button
                    key={hub.name}
                    onClick={() => setSelectedHub(hub.name)}
                    className={`flex w-full items-center gap-3 p-3 text-left hover:bg-muted/50 ${
                      selectedHub === hub.name ? 'bg-muted' : ''
                    }`}
                  >
                    <Radio className="h-5 w-5 text-primary" />
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate font-medium">{hub.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {hub.partitionCount} partitions
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        hub.status === 'Active'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}
                    >
                      {hub.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Event Hub Details */}
          <div className="lg:col-span-2">
            {selectedHub ? (
              <EventHubDetails hubName={selectedHub} />
            ) : (
              <div className="flex h-64 items-center justify-center rounded-lg border bg-card">
                <p className="text-muted-foreground">Select an Event Hub to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function EventHubDetails({ hubName }: { hubName: string }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'partitions' | 'consumers' | 'send'>('overview');

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4">
        <h2 className="text-xl font-semibold">{hubName}</h2>
        <p className="text-sm text-muted-foreground">Event Hub details and operations</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Partitions</p>
          </div>
          <p className="mt-1 text-2xl font-semibold">4</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Consumer Groups</p>
          </div>
          <p className="mt-1 text-2xl font-semibold">2</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Status</p>
          </div>
          <p className="mt-1 text-2xl font-semibold text-green-600">Active</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {(['overview', 'partitions', 'consumers', 'send'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === tab
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'overview' && 'Overview'}
            {tab === 'partitions' && 'Partitions'}
            {tab === 'consumers' && 'Consumer Groups'}
            {tab === 'send' && 'Send Event'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="rounded-lg border bg-card p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">-</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Message Retention</p>
              <p className="font-medium">1 day</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Partition Count</p>
              <p className="font-medium">4</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Capture</p>
              <p className="font-medium">Disabled</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'partitions' && (
        <div className="rounded-lg border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">Partition ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Begin Sequence</th>
                <th className="px-4 py-3 text-left text-sm font-medium">End Sequence</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Last Enqueued</th>
              </tr>
            </thead>
            <tbody>
              {[0, 1, 2, 3].map((id) => (
                <tr key={id} className="border-b">
                  <td className="px-4 py-3 font-medium">{id}</td>
                  <td className="px-4 py-3 text-muted-foreground">0</td>
                  <td className="px-4 py-3 text-muted-foreground">-</td>
                  <td className="px-4 py-3 text-muted-foreground">-</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'consumers' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Consumer Group
            </Button>
          </div>
          <div className="rounded-lg border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">$Default</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">System default</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'send' && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold">Send Event</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Publish an event to this Event Hub
          </p>
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-sm font-medium">Partition Key (optional)</label>
              <input
                type="text"
                className="mt-1 w-full rounded-md border bg-background px-3 py-2"
                placeholder="Enter partition key..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Event Body</label>
              <textarea
                className="mt-1 w-full rounded-md border bg-background px-3 py-2"
                rows={6}
                placeholder="Event data (JSON)..."
              />
            </div>
            <Button>
              <Radio className="mr-2 h-4 w-4" />
              Send Event
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
