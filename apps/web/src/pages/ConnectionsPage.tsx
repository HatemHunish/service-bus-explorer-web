import { useState } from 'react';
import { Plus, Plug, Trash2, TestTube, Check, Edit2, Database, Radio, Grid, Bell } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { useConnectionStore } from '@/store/useConnectionStore';
import { connectionsApi } from '@/services/api';
import { toast } from '@/components/common/Toaster';
import { ConnectionDialog } from '@/components/connections/ConnectionDialog';

const SERVICE_TYPE_ICONS: Record<string, React.ReactNode> = {
  serviceBus: <Database className="h-5 w-5" />,
  eventHubs: <Radio className="h-5 w-5" />,
  eventGrid: <Grid className="h-5 w-5" />,
  notificationHubs: <Bell className="h-5 w-5" />,
  relay: <Plug className="h-5 w-5" />,
};

const SERVICE_TYPE_LABELS: Record<string, string> = {
  serviceBus: 'Service Bus',
  eventHubs: 'Event Hubs',
  eventGrid: 'Event Grid',
  notificationHubs: 'Notification Hubs',
  relay: 'Relay',
};

export function ConnectionsPage() {
  const { connections, activeConnection, setActiveConnection, removeConnection } =
    useConnectionStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<any>(null);
  const [testing, setTesting] = useState<string | null>(null);

  const handleTest = async (id: string) => {
    setTesting(id);
    try {
      const result = await connectionsApi.test(id);
      if (result.success) {
        toast(`Connected to ${result.namespace}`);
      } else {
        toast(result.message, 'destructive');
      }
    } catch (error: any) {
      toast(error.message || 'Connection test failed', 'destructive');
    } finally {
      setTesting(null);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      const connection = await connectionsApi.activate(id);
      setActiveConnection(connection);
      toast('Connection activated');
    } catch (error: any) {
      toast(error.message || 'Failed to activate connection', 'destructive');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this connection?')) return;

    try {
      await connectionsApi.delete(id);
      removeConnection(id);
      toast('Connection deleted');
    } catch (error: any) {
      toast(error.message || 'Failed to delete connection', 'destructive');
    }
  };

  const handleEdit = (connection: any) => {
    setEditingConnection(connection);
    setDialogOpen(true);
  };

  const handleNewConnection = () => {
    setEditingConnection(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Connections</h1>
          <p className="text-muted-foreground">Manage your Azure messaging service connections</p>
        </div>
        <Button onClick={handleNewConnection}>
          <Plus className="mr-2 h-4 w-4" />
          New Connection
        </Button>
      </div>

      {/* Connection Dialog */}
      <ConnectionDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingConnection(null);
        }}
        connection={editingConnection}
      />

      {/* Connections List */}
      <div className="space-y-2">
        {connections.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center">
            <Plug className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No connections</h3>
            <p className="mt-2 text-muted-foreground">
              Create a connection to get started with Service Bus Explorer
            </p>
            <Button onClick={handleNewConnection} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Add Connection
            </Button>
          </div>
        ) : (
          connections.map((conn) => (
            <div
              key={conn.id}
              className={`flex items-center justify-between rounded-lg border bg-card p-4 transition-colors ${
                activeConnection?.id === conn.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/30'
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`rounded-full p-2.5 ${
                    activeConnection?.id === conn.id
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {SERVICE_TYPE_ICONS[conn.type || 'serviceBus'] || <Plug className="h-5 w-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{conn.name}</h3>
                    {activeConnection?.id === conn.id && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Connected
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{SERVICE_TYPE_LABELS[conn.type || 'serviceBus'] || 'Service Bus'}</span>
                    {conn.namespace && (
                      <>
                        <span>•</span>
                        <span className="font-mono text-xs">{conn.namespace}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTest(conn.id)}
                  disabled={testing === conn.id}
                >
                  <TestTube className="mr-1 h-4 w-4" />
                  {testing === conn.id ? 'Testing...' : 'Test'}
                </Button>
                {activeConnection?.id !== conn.id && (
                  <Button variant="outline" size="sm" onClick={() => handleActivate(conn.id)}>
                    <Check className="mr-1 h-4 w-4" />
                    Connect
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => handleEdit(conn)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(conn.id)}
                  className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
