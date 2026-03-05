import { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { Select, SelectOption } from '@/components/common/Select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/common/Tabs';
import { api } from '@/services/api';
import { toast } from '@/components/common/Toaster';
import { useConnectionStore } from '@/store/useConnectionStore';

interface ConnectionDialogProps {
  open: boolean;
  onClose: () => void;
  connection?: {
    id: string;
    name: string;
    type: string;
    connectionString?: string;
    namespace?: string;
  } | null;
}

type AuthMethod = 'connectionString' | 'entraId';
type ServiceType = 'serviceBus' | 'eventHubs' | 'eventGrid' | 'notificationHubs' | 'relay';

export function ConnectionDialog({ open, onClose, connection }: ConnectionDialogProps) {
  const { addConnection, setActiveConnection } = useConnectionStore();

  const [name, setName] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('serviceBus');
  const [authMethod, setAuthMethod] = useState<AuthMethod>('connectionString');
  const [connectionString, setConnectionString] = useState('');
  const [namespace, setNamespace] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testError, setTestError] = useState('');

  // Reset form when dialog opens/closes or connection changes
  useEffect(() => {
    if (open) {
      if (connection) {
        setName(connection.name);
        setServiceType((connection.type as ServiceType) || 'serviceBus');
        setConnectionString(connection.connectionString || '');
        setNamespace(connection.namespace || '');
      } else {
        resetForm();
      }
    }
  }, [open, connection]);

  const resetForm = () => {
    setName('');
    setServiceType('serviceBus');
    setAuthMethod('connectionString');
    setConnectionString('');
    setNamespace('');
    setTenantId('');
    setClientId('');
    setClientSecret('');
    setTestStatus('idle');
    setTestError('');
  };

  const parseConnectionString = (cs: string) => {
    const endpoint = cs.match(/Endpoint=sb:\/\/([^;]+)/);
    if (endpoint) {
      const ns = endpoint[1].replace('.servicebus.windows.net/', '');
      setNamespace(ns);
      if (!name) {
        setName(ns);
      }
    }
  };

  const handleConnectionStringChange = (value: string) => {
    setConnectionString(value);
    parseConnectionString(value);
  };

  const handleTest = async () => {
    setTestStatus('testing');
    setTestError('');

    try {
      const result = await api.testConnection({
        name: name || 'Test Connection',
        type: serviceType,
        connectionString: authMethod === 'connectionString' ? connectionString : undefined,
        namespace: namespace,
        ...(authMethod === 'entraId' && { tenantId, clientId, clientSecret }),
      });

      if (result.success) {
        setTestStatus('success');
      } else {
        setTestStatus('error');
        setTestError(result.error || 'Connection test failed');
      }
    } catch (error: any) {
      setTestStatus('error');
      setTestError(error.message || 'Connection test failed');
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast('Please enter a connection name', 'destructive');
      return;
    }

    if (authMethod === 'connectionString' && !connectionString.trim()) {
      toast('Please enter a connection string', 'destructive');
      return;
    }

    setIsLoading(true);

    try {
      const newConnection = await api.createConnection({
        name,
        type: serviceType,
        connectionType: authMethod === 'connectionString' ? 'sas' : 'entraId',
        connectionString: authMethod === 'connectionString' ? connectionString : undefined,
        namespace,
        ...(authMethod === 'entraId' && { tenantId, clientId }),
      });

      addConnection(newConnection);
      setActiveConnection(newConnection);
      toast('Connection saved successfully');
      onClose();
    } catch (error: any) {
      toast(error.message || 'Failed to save connection', 'destructive');
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Content */}
      <div className="fixed left-[50%] top-[50%] z-50 w-full max-w-2xl translate-x-[-50%] translate-y-[-50%]">
        <div className="rounded-lg border bg-background shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold">
                {connection ? 'Edit Connection' : 'New Connection'}
              </h2>
              <p className="text-sm text-muted-foreground">
                Connect to Azure messaging services
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
            <div className="space-y-4">
              {/* Connection Name */}
              <div>
                <label className="text-sm font-medium">Connection Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Service Bus"
                  className="mt-1"
                />
              </div>

              {/* Service Type */}
              <div>
                <label className="text-sm font-medium">Service Type</label>
                <Select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value as ServiceType)}
                  className="mt-1"
                >
                  <SelectOption value="serviceBus">Service Bus</SelectOption>
                  <SelectOption value="eventHubs">Event Hubs</SelectOption>
                  <SelectOption value="eventGrid">Event Grid</SelectOption>
                  <SelectOption value="notificationHubs">Notification Hubs</SelectOption>
                  <SelectOption value="relay">Relay</SelectOption>
                </Select>
              </div>

              {/* Auth Method Tabs */}
              <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as AuthMethod)}>
                <TabsList className="w-full">
                  <TabsTrigger value="connectionString" className="flex-1">
                    Connection String
                  </TabsTrigger>
                  <TabsTrigger value="entraId" className="flex-1">
                    Entra ID (AAD)
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="connectionString" className="mt-4 space-y-4">
                  <div>
                    <label className="text-sm font-medium">Connection String</label>
                    <Textarea
                      value={connectionString}
                      onChange={(e) => handleConnectionStringChange(e.target.value)}
                      placeholder="Endpoint=sb://your-namespace.servicebus.windows.net/;SharedAccessKeyName=...;SharedAccessKey=..."
                      className="mt-1 font-mono text-xs"
                      rows={4}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Paste your connection string from the Azure portal
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="entraId" className="mt-4 space-y-4">
                  <div>
                    <label className="text-sm font-medium">Namespace</label>
                    <Input
                      value={namespace}
                      onChange={(e) => setNamespace(e.target.value)}
                      placeholder="your-namespace.servicebus.windows.net"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Tenant ID</label>
                    <Input
                      value={tenantId}
                      onChange={(e) => setTenantId(e.target.value)}
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Client ID</label>
                    <Input
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Client Secret</label>
                    <Input
                      type="password"
                      value={clientSecret}
                      onChange={(e) => setClientSecret(e.target.value)}
                      placeholder="Enter client secret"
                      className="mt-1"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              {/* Test Connection */}
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {testStatus === 'idle' && (
                      <div className="h-8 w-8 rounded-full border-2 border-dashed border-muted-foreground/50" />
                    )}
                    {testStatus === 'testing' && (
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    )}
                    {testStatus === 'success' && (
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    )}
                    {testStatus === 'error' && (
                      <XCircle className="h-8 w-8 text-destructive" />
                    )}
                    <div>
                      <p className="font-medium">
                        {testStatus === 'idle' && 'Test Connection'}
                        {testStatus === 'testing' && 'Testing...'}
                        {testStatus === 'success' && 'Connection Successful'}
                        {testStatus === 'error' && 'Connection Failed'}
                      </p>
                      {testStatus === 'idle' && (
                        <p className="text-sm text-muted-foreground">
                          Verify your connection before saving
                        </p>
                      )}
                      {testStatus === 'error' && testError && (
                        <p className="text-sm text-destructive">{testError}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleTest}
                    disabled={testStatus === 'testing' || (!connectionString && authMethod === 'connectionString')}
                  >
                    {testStatus === 'testing' ? 'Testing...' : 'Test'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 border-t px-6 py-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Connection'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
