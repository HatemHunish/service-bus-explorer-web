import { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import { cn } from '@/utils/cn';
import { IReceivedMessage } from '@service-bus-explorer/shared';

interface MessageItemProps {
  message: IReceivedMessage;
  showDeadLetterInfo?: boolean;
}

export function MessageItem({ message, showDeadLetterInfo = false }: MessageItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Merge applicationProperties and userProperties (AMQP uses userProperties, Azure SDK uses applicationProperties)
  const allProperties = {
    ...(message.applicationProperties || {}),
    ...(message.userProperties || {}),
  };
  const hasApplicationProperties = Object.keys(allProperties).length > 0;

  const formatBody = (body: string) => {
    try {
      return JSON.stringify(JSON.parse(body), null, 2);
    } catch {
      return body;
    }
  };

  return (
    <div className="border-b last:border-0">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 p-3 text-left hover:bg-muted/30"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">#{message.sequenceNumber}</span>
            {message.subject && (
              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                {message.subject}
              </span>
            )}
            {hasApplicationProperties && (
              <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-xs text-blue-600 dark:text-blue-400">
                {Object.keys(allProperties).length} props
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <span>{new Date(message.enqueuedTime).toLocaleString()}</span>
            {message.messageId && (
              <span className="truncate max-w-[200px]">ID: {message.messageId}</span>
            )}
          </div>
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3">
          {/* Dead Letter Info */}
          {showDeadLetterInfo && message.deadLetterReason && (
            <div className="rounded-lg bg-destructive/10 p-2">
              <p className="text-sm font-medium text-destructive">
                Reason: {message.deadLetterReason}
              </p>
              {message.deadLetterErrorDescription && (
                <p className="text-xs text-destructive/80 mt-1">
                  {message.deadLetterErrorDescription}
                </p>
              )}
            </div>
          )}

          {/* Message Properties */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {message.messageId && (
              <PropertyRow
                label="Message ID"
                value={message.messageId}
                onCopy={() => copyToClipboard(message.messageId!, 'messageId')}
                copied={copiedField === 'messageId'}
              />
            )}
            {message.correlationId && (
              <PropertyRow
                label="Correlation ID"
                value={message.correlationId}
                onCopy={() => copyToClipboard(message.correlationId!, 'correlationId')}
                copied={copiedField === 'correlationId'}
              />
            )}
            {message.sessionId && (
              <PropertyRow label="Session ID" value={message.sessionId} />
            )}
            {message.contentType && (
              <PropertyRow label="Content Type" value={message.contentType} />
            )}
            {message.subject && (
              <PropertyRow label="Subject/Label" value={message.subject} />
            )}
            {message.to && (
              <PropertyRow label="To" value={message.to} />
            )}
            {message.replyTo && (
              <PropertyRow label="Reply To" value={message.replyTo} />
            )}
            <PropertyRow label="Delivery Count" value={String(message.deliveryCount)} />
            {message.timeToLive && (
              <PropertyRow label="TTL" value={message.timeToLive} />
            )}
            {message.expiresAt && (
              <PropertyRow label="Expires At" value={new Date(message.expiresAt).toLocaleString()} />
            )}
          </div>

          {/* Application Properties (includes both applicationProperties and userProperties) */}
          {hasApplicationProperties && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Application Properties</p>
              <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 p-2">
                <div className="grid grid-cols-2 gap-1">
                  {Object.entries(allProperties).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-1 text-xs">
                      <span className="font-medium text-blue-600 dark:text-blue-400">{key}:</span>
                      <span className="text-foreground truncate">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Message Body */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-muted-foreground">Body</p>
              <button
                onClick={() => copyToClipboard(message.body, 'body')}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                {copiedField === 'body' ? (
                  <>
                    <Check className="h-3 w-3 text-green-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <pre className="max-h-48 overflow-auto rounded-lg bg-muted p-2 text-xs font-mono">
              {formatBody(message.body)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

function PropertyRow({
  label,
  value,
  onCopy,
  copied,
}: {
  label: string;
  value: string;
  onCopy?: () => void;
  copied?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium truncate">{value}</span>
      {onCopy && (
        <button onClick={onCopy} className="ml-1 text-muted-foreground hover:text-foreground">
          {copied ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </button>
      )}
    </div>
  );
}
