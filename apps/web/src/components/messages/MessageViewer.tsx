import { useState } from 'react';
import { Copy, ChevronDown, ChevronRight, Hash } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/common/Tabs';
import { toast } from '@/components/common/Toaster';
import { cn } from '@/lib/utils';

interface MessageViewerProps {
  message: {
    sequenceNumber: number;
    messageId?: string;
    correlationId?: string;
    sessionId?: string;
    partitionKey?: string;
    contentType?: string;
    label?: string;
    to?: string;
    replyTo?: string;
    enqueuedTime: string;
    expiresAt?: string;
    lockedUntil?: string;
    deliveryCount?: number;
    deadLetterSource?: string;
    deadLetterReason?: string;
    deadLetterErrorDescription?: string;
    body: string;
    applicationProperties?: Record<string, any>;
  };
  onClose?: () => void;
}

export function MessageViewer({ message, onClose }: MessageViewerProps) {
  const [activeTab, setActiveTab] = useState<'body' | 'properties' | 'custom'>('body');
  const [bodyFormat, setBodyFormat] = useState<'raw' | 'json' | 'xml'>('raw');

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast(`${label} copied to clipboard`);
  };

  const formatBody = (body: string): string => {
    if (bodyFormat === 'json') {
      try {
        return JSON.stringify(JSON.parse(body), null, 2);
      } catch {
        return body;
      }
    }
    if (bodyFormat === 'xml') {
      // Simple XML formatting
      try {
        return body.replace(/></g, '>\n<');
      } catch {
        return body;
      }
    }
    return body;
  };

  const detectFormat = (body: string): 'json' | 'xml' | 'raw' => {
    try {
      JSON.parse(body);
      return 'json';
    } catch {
      if (body.trim().startsWith('<')) {
        return 'xml';
      }
      return 'raw';
    }
  };

  // Auto-detect format on first render
  useState(() => {
    setBodyFormat(detectFormat(message.body));
  });

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div>
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Sequence #{message.sequenceNumber}</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Enqueued: {new Date(message.enqueuedTime).toLocaleString()}
          </p>
        </div>
        {onClose && (
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      {/* Quick Info */}
      <div className="grid grid-cols-2 gap-2 border-b p-4 text-sm md:grid-cols-4">
        {message.messageId && (
          <div>
            <p className="text-muted-foreground">Message ID</p>
            <p className="truncate font-mono text-xs">{message.messageId}</p>
          </div>
        )}
        {message.contentType && (
          <div>
            <p className="text-muted-foreground">Content Type</p>
            <p className="font-medium">{message.contentType}</p>
          </div>
        )}
        {message.deliveryCount !== undefined && (
          <div>
            <p className="text-muted-foreground">Delivery Count</p>
            <p className="font-medium">{message.deliveryCount}</p>
          </div>
        )}
        {message.label && (
          <div>
            <p className="text-muted-foreground">Label/Subject</p>
            <p className="font-medium">{message.label}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1">
        <div className="border-b px-4">
          <TabsList>
            <TabsTrigger value="body">Body</TabsTrigger>
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="custom">
              Custom Properties
              {message.applicationProperties && Object.keys(message.applicationProperties).length > 0 && (
                <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs">
                  {Object.keys(message.applicationProperties).length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="body" className="flex-1 overflow-hidden p-4">
          <div className="flex h-full flex-col">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex gap-1">
                {(['raw', 'json', 'xml'] as const).map((format) => (
                  <button
                    key={format}
                    onClick={() => setBodyFormat(format)}
                    className={cn(
                      'rounded px-2 py-1 text-xs font-medium',
                      bodyFormat === format
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    )}
                  >
                    {format.toUpperCase()}
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(message.body, 'Body')}
              >
                <Copy className="mr-1 h-3 w-3" />
                Copy
              </Button>
            </div>
            <pre className="flex-1 overflow-auto rounded-md bg-muted p-4 font-mono text-sm">
              {formatBody(message.body)}
            </pre>
          </div>
        </TabsContent>

        <TabsContent value="properties" className="overflow-auto p-4">
          <div className="space-y-4">
            <PropertySection title="Identification">
              <PropertyRow label="Sequence Number" value={message.sequenceNumber} />
              <PropertyRow label="Message ID" value={message.messageId} copyable />
              <PropertyRow label="Correlation ID" value={message.correlationId} copyable />
              <PropertyRow label="Session ID" value={message.sessionId} />
              <PropertyRow label="Partition Key" value={message.partitionKey} />
            </PropertySection>

            <PropertySection title="Routing">
              <PropertyRow label="To" value={message.to} />
              <PropertyRow label="Reply To" value={message.replyTo} />
              <PropertyRow label="Label/Subject" value={message.label} />
            </PropertySection>

            <PropertySection title="Timing">
              <PropertyRow
                label="Enqueued Time"
                value={message.enqueuedTime ? new Date(message.enqueuedTime).toLocaleString() : undefined}
              />
              <PropertyRow
                label="Expires At"
                value={message.expiresAt ? new Date(message.expiresAt).toLocaleString() : undefined}
              />
              <PropertyRow
                label="Locked Until"
                value={message.lockedUntil ? new Date(message.lockedUntil).toLocaleString() : undefined}
              />
            </PropertySection>

            <PropertySection title="Delivery">
              <PropertyRow label="Content Type" value={message.contentType} />
              <PropertyRow label="Delivery Count" value={message.deliveryCount} />
            </PropertySection>

            {message.deadLetterSource && (
              <PropertySection title="Dead-letter Info">
                <PropertyRow label="Source" value={message.deadLetterSource} />
                <PropertyRow label="Reason" value={message.deadLetterReason} />
                <PropertyRow label="Error Description" value={message.deadLetterErrorDescription} />
              </PropertySection>
            )}
          </div>
        </TabsContent>

        <TabsContent value="custom" className="overflow-auto p-4">
          {!message.applicationProperties || Object.keys(message.applicationProperties).length === 0 ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              No custom properties
            </div>
          ) : (
            <div className="rounded-lg border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-2 text-left text-sm font-medium">Key</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Value</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(message.applicationProperties).map(([key, value]) => (
                    <tr key={key} className="border-b last:border-0">
                      <td className="px-4 py-2 font-mono text-sm">{key}</td>
                      <td className="px-4 py-2 font-mono text-sm">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </td>
                      <td className="px-4 py-2 text-sm text-muted-foreground">
                        {typeof value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PropertySection({ title, children }: { title: string; children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="rounded-lg border">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 p-3 text-left font-medium hover:bg-muted/50"
      >
        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        {title}
      </button>
      {expanded && <div className="border-t p-3">{children}</div>}
    </div>
  );
}

function PropertyRow({
  label,
  value,
  copyable,
}: {
  label: string;
  value: any;
  copyable?: boolean;
}) {
  if (value === undefined || value === null || value === '') return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(String(value));
    toast(`${label} copied`);
  };

  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-medium">{String(value)}</span>
        {copyable && (
          <button onClick={handleCopy} className="text-muted-foreground hover:text-foreground">
            <Copy className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}
