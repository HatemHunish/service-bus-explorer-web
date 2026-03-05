import { useState } from 'react';
import { Send, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { Select, SelectOption } from '@/components/common/Select';
import { toast } from '@/components/common/Toaster';
import { cn } from '@/lib/utils';

interface MessageEditorProps {
  onSend: (message: SendMessageData) => Promise<void>;
  isLoading?: boolean;
  entityType?: 'queue' | 'topic';
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
  applicationProperties?: Record<string, any>;
}

export function MessageEditor({ onSend, isLoading, entityType = 'queue' }: MessageEditorProps) {
  const [body, setBody] = useState('');
  const [bodyType, setBodyType] = useState<'text' | 'json' | 'xml'>('text');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCustomProps, setShowCustomProps] = useState(false);

  // Advanced properties
  const [messageId, setMessageId] = useState('');
  const [correlationId, setCorrelationId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [partitionKey, setPartitionKey] = useState('');
  const [contentType, setContentType] = useState('');
  const [label, setLabel] = useState('');
  const [to, setTo] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [replyToSessionId, setReplyToSessionId] = useState('');
  const [timeToLive, setTimeToLive] = useState('');
  const [scheduledEnqueueTime, setScheduledEnqueueTime] = useState('');

  // Custom properties
  const [customProps, setCustomProps] = useState<Array<{ key: string; value: string; type: string }>>([]);

  const handleAddCustomProp = () => {
    setCustomProps([...customProps, { key: '', value: '', type: 'string' }]);
  };

  const handleRemoveCustomProp = (index: number) => {
    setCustomProps(customProps.filter((_, i) => i !== index));
  };

  const handleCustomPropChange = (index: number, field: 'key' | 'value' | 'type', value: string) => {
    const updated = [...customProps];
    updated[index][field] = value;
    setCustomProps(updated);
  };

  const handleSend = async () => {
    if (!body.trim()) {
      toast('Please enter a message body', 'destructive');
      return;
    }

    // Build application properties
    const applicationProperties: Record<string, any> = {};
    customProps.forEach(({ key, value, type }) => {
      if (key.trim()) {
        let typedValue: any = value;
        switch (type) {
          case 'number':
            typedValue = Number(value);
            break;
          case 'boolean':
            typedValue = value.toLowerCase() === 'true';
            break;
          case 'json':
            try {
              typedValue = JSON.parse(value);
            } catch {
              typedValue = value;
            }
            break;
        }
        applicationProperties[key] = typedValue;
      }
    });

    const message: SendMessageData = {
      body,
      bodyType,
      ...(messageId && { messageId }),
      ...(correlationId && { correlationId }),
      ...(sessionId && { sessionId }),
      ...(partitionKey && { partitionKey }),
      ...(contentType && { contentType }),
      ...(label && { label }),
      ...(to && { to }),
      ...(replyTo && { replyTo }),
      ...(replyToSessionId && { replyToSessionId }),
      ...(timeToLive && { timeToLive }),
      ...(scheduledEnqueueTime && { scheduledEnqueueTime }),
      ...(Object.keys(applicationProperties).length > 0 && { applicationProperties }),
    };

    await onSend(message);
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(body);
      setBody(JSON.stringify(parsed, null, 2));
      setBodyType('json');
    } catch {
      toast('Invalid JSON', 'destructive');
    }
  };

  return (
    <div className="space-y-4">
      {/* Body Type Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Body Type:</span>
        {(['text', 'json', 'xml'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setBodyType(type)}
            className={cn(
              'rounded px-3 py-1 text-sm font-medium transition-colors',
              bodyType === type
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            )}
          >
            {type.toUpperCase()}
          </button>
        ))}
        {bodyType === 'json' && (
          <Button variant="outline" size="sm" onClick={formatJson}>
            Format
          </Button>
        )}
      </div>

      {/* Message Body */}
      <div>
        <label className="text-sm font-medium">Message Body</label>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={
            bodyType === 'json'
              ? '{"key": "value"}'
              : bodyType === 'xml'
              ? '<root><message>Hello</message></root>'
              : 'Enter your message...'
          }
          className="mt-1 min-h-[200px] font-mono text-sm"
        />
      </div>

      {/* Advanced Properties Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex w-full items-center gap-2 rounded-lg border p-3 text-left font-medium hover:bg-muted/50"
      >
        {showAdvanced ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        Advanced Properties
      </button>

      {showAdvanced && (
        <div className="grid gap-4 rounded-lg border p-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Message ID</label>
            <Input
              value={messageId}
              onChange={(e) => setMessageId(e.target.value)}
              placeholder="Auto-generated if empty"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Correlation ID</label>
            <Input
              value={correlationId}
              onChange={(e) => setCorrelationId(e.target.value)}
              placeholder="For request-reply patterns"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Session ID</label>
            <Input
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="Required for session-enabled entities"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Partition Key</label>
            <Input
              value={partitionKey}
              onChange={(e) => setPartitionKey(e.target.value)}
              placeholder="For partitioned entities"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Content Type</label>
            <Input
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              placeholder="e.g., application/json"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Label / Subject</label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Message label"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">To</label>
            <Input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="Destination address"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Reply To</label>
            <Input
              value={replyTo}
              onChange={(e) => setReplyTo(e.target.value)}
              placeholder="Reply address"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Reply To Session ID</label>
            <Input
              value={replyToSessionId}
              onChange={(e) => setReplyToSessionId(e.target.value)}
              placeholder="Reply session"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Time To Live</label>
            <Input
              value={timeToLive}
              onChange={(e) => setTimeToLive(e.target.value)}
              placeholder="e.g., PT1H (1 hour) or P1D (1 day)"
              className="mt-1"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Scheduled Enqueue Time</label>
            <Input
              type="datetime-local"
              value={scheduledEnqueueTime}
              onChange={(e) => setScheduledEnqueueTime(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      )}

      {/* Custom Properties Toggle */}
      <button
        onClick={() => setShowCustomProps(!showCustomProps)}
        className="flex w-full items-center gap-2 rounded-lg border p-3 text-left font-medium hover:bg-muted/50"
      >
        {showCustomProps ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        Custom Properties
        {customProps.length > 0 && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
            {customProps.length}
          </span>
        )}
      </button>

      {showCustomProps && (
        <div className="space-y-2 rounded-lg border p-4">
          {customProps.map((prop, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={prop.key}
                onChange={(e) => handleCustomPropChange(index, 'key', e.target.value)}
                placeholder="Key"
                className="flex-1"
              />
              <Input
                value={prop.value}
                onChange={(e) => handleCustomPropChange(index, 'value', e.target.value)}
                placeholder="Value"
                className="flex-1"
              />
              <Select
                value={prop.type}
                onChange={(e) => handleCustomPropChange(index, 'type', e.target.value)}
                className="w-28"
              >
                <SelectOption value="string">String</SelectOption>
                <SelectOption value="number">Number</SelectOption>
                <SelectOption value="boolean">Boolean</SelectOption>
                <SelectOption value="json">JSON</SelectOption>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRemoveCustomProp(index)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={handleAddCustomProp}>
            <Plus className="mr-1 h-4 w-4" />
            Add Property
          </Button>
        </div>
      )}

      {/* Send Button */}
      <div className="flex justify-end">
        <Button onClick={handleSend} disabled={isLoading || !body.trim()}>
          <Send className="mr-2 h-4 w-4" />
          {isLoading ? 'Sending...' : `Send to ${entityType === 'topic' ? 'Topic' : 'Queue'}`}
        </Button>
      </div>
    </div>
  );
}
