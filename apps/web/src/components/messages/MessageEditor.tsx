import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Send, RotateCcw, Copy, Check } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { toast } from '@/components/common/Toaster';

interface MessageEditorProps {
  onSend: (message: SendMessageData) => Promise<void>;
  isLoading?: boolean;
  entityType?: 'queue' | 'topic';
}

export interface ApplicationProperty {
  key: string;
  value: string | number | boolean;
  type: 'string' | 'number' | 'boolean' | 'datetime';
}

export interface SendMessageData {
  body: string;
  bodyType: 'text' | 'json' | 'xml';
  messageId?: string;
  correlationId?: string;
  sessionId?: string;
  partitionKey?: string;
  contentType?: string;
  label?: string;
  to?: string;
  replyTo?: string;
  replyToSessionId?: string;
  timeToLive?: string;
  scheduledEnqueueTime?: string;
  applicationProperties?: ApplicationProperty[];
}

const DEFAULT_MESSAGE = `{
  "body": {
    "message": "Hello, Service Bus!",
    "timestamp": "2024-01-01T00:00:00Z"
  },
  "applicationProperties": {
    "eventType": "TestEvent",
    "version": 1,
    "isTest": true
  },
  "contentType": "application/json",
  "subject": "TestMessage"
}`;

const MESSAGE_SCHEMA_HELP = `// Message Structure:
// {
//   "body": { ... } | "string" | any,     // Required: Message body (any JSON value)
//   "applicationProperties": {             // Optional: Custom properties
//     "key": "string" | number | boolean
//   },
//   "messageId": "string",                 // Optional: Custom message ID
//   "correlationId": "string",             // Optional: For request-reply patterns
//   "sessionId": "string",                 // Optional: For session-enabled entities
//   "partitionKey": "string",              // Optional: For partitioned entities
//   "contentType": "string",               // Optional: e.g., "application/json"
//   "subject": "string",                   // Optional: Message label/subject
//   "to": "string",                        // Optional: Destination address
//   "replyTo": "string",                   // Optional: Reply address
//   "replyToSessionId": "string",          // Optional: Reply session
//   "timeToLive": "string",                // Optional: e.g., "PT1H" (1 hour)
//   "scheduledEnqueueTime": "ISO date"     // Optional: Schedule message
// }

`;

export function MessageEditor({ onSend, isLoading, entityType = 'queue' }: MessageEditorProps) {
  const [messageJson, setMessageJson] = useState(DEFAULT_MESSAGE);
  const [copied, setCopied] = useState(false);

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(messageJson);
      setMessageJson(JSON.stringify(parsed, null, 2));
    } catch (e) {
      toast(`Invalid JSON: ${(e as Error).message}`, 'destructive');
    }
  };

  const handleReset = () => {
    setMessageJson(DEFAULT_MESSAGE);
  };

  const handleCopySchema = async () => {
    await navigator.clipboard.writeText(MESSAGE_SCHEMA_HELP);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = async () => {
    // Parse and validate JSON
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(messageJson);
    } catch (e) {
      toast(`Invalid JSON: ${(e as Error).message}`, 'destructive');
      return;
    }

    // Validate required body field
    if (parsed.body === undefined) {
      toast('Message must have a "body" field', 'destructive');
      return;
    }

    // Determine body type and stringify if needed
    let bodyStr: string;
    let bodyType: 'text' | 'json' | 'xml' = 'text';

    if (typeof parsed.body === 'object' && parsed.body !== null) {
      bodyStr = JSON.stringify(parsed.body);
      bodyType = 'json';
    } else if (typeof parsed.body === 'string') {
      bodyStr = parsed.body;
      // Try to detect if it's JSON or XML
      if (parsed.body.trim().startsWith('{') || parsed.body.trim().startsWith('[')) {
        try {
          JSON.parse(parsed.body);
          bodyType = 'json';
        } catch {
          bodyType = 'text';
        }
      } else if (parsed.body.trim().startsWith('<')) {
        bodyType = 'xml';
      }
    } else {
      bodyStr = JSON.stringify(parsed.body);
      bodyType = 'json';
    }

    // Build application properties with type inference
    const applicationProperties: ApplicationProperty[] = [];
    if (parsed.applicationProperties && typeof parsed.applicationProperties === 'object') {
      for (const [key, value] of Object.entries(parsed.applicationProperties as Record<string, unknown>)) {
        let propType: 'string' | 'number' | 'boolean' | 'datetime' = 'string';
        let propValue: string | number | boolean = String(value);

        if (typeof value === 'number') {
          propType = 'number';
          propValue = value;
        } else if (typeof value === 'boolean') {
          propType = 'boolean';
          propValue = value;
        } else if (typeof value === 'string') {
          propType = 'string';
          propValue = value;
        }

        applicationProperties.push({ key, value: propValue, type: propType });
      }
    }

    // Build the message data
    const message: SendMessageData = {
      body: bodyStr,
      bodyType,
      ...(parsed.messageId && { messageId: String(parsed.messageId) }),
      ...(parsed.correlationId && { correlationId: String(parsed.correlationId) }),
      ...(parsed.sessionId && { sessionId: String(parsed.sessionId) }),
      ...(parsed.partitionKey && { partitionKey: String(parsed.partitionKey) }),
      ...(parsed.contentType && { contentType: String(parsed.contentType) }),
      ...(parsed.subject && { label: String(parsed.subject) }),
      ...(parsed.label && { label: String(parsed.label) }),
      ...(parsed.to && { to: String(parsed.to) }),
      ...(parsed.replyTo && { replyTo: String(parsed.replyTo) }),
      ...(parsed.replyToSessionId && { replyToSessionId: String(parsed.replyToSessionId) }),
      ...(parsed.timeToLive && { timeToLive: String(parsed.timeToLive) }),
      ...(parsed.scheduledEnqueueTime && { scheduledEnqueueTime: String(parsed.scheduledEnqueueTime) }),
      ...(applicationProperties.length > 0 && { applicationProperties }),
    };

    await onSend(message);
  };

  return (
    <div className="space-y-3">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Message JSON</span>
          <button
            onClick={handleCopySchema}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            title="Copy schema reference"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-green-500" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>Schema</span>
              </>
            )}
          </button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="mr-1 h-3 w-3" />
            Reset
          </Button>
          <Button variant="outline" size="sm" onClick={handleFormat}>
            Format
          </Button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="rounded-lg border overflow-hidden">
        <Editor
          height="350px"
          language="json"
          value={messageJson}
          onChange={(val) => setMessageJson(val || '')}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            lineNumbers: 'on',
            fontSize: 13,
            wordWrap: 'on',
            automaticLayout: true,
            scrollBeyondLastLine: false,
            tabSize: 2,
            formatOnPaste: true,
          }}
        />
      </div>

      {/* Help text */}
      <p className="text-xs text-muted-foreground">
        Define your message as JSON. Use <code className="bg-muted px-1 rounded">body</code> for message content,{' '}
        <code className="bg-muted px-1 rounded">applicationProperties</code> for custom properties.
      </p>

      {/* Send Button */}
      <div className="flex justify-end">
        <Button onClick={handleSend} disabled={isLoading || !messageJson.trim()}>
          <Send className="mr-2 h-4 w-4" />
          {isLoading ? 'Sending...' : `Send to ${entityType === 'topic' ? 'Topic' : 'Queue'}`}
        </Button>
      </div>
    </div>
  );
}
