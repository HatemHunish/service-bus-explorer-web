import { useState } from 'react';
import { Play, Square, Trash2, Radio, Circle } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { MessageViewer } from './MessageViewer';
import { cn } from '@/lib/utils';

interface ListenerMessage {
  id: string;
  sequenceNumber: number;
  messageId?: string;
  body: string;
  enqueuedTime: string;
  receivedAt: string;
  entityType: 'queue' | 'subscription';
  entityName: string;
  topicName?: string;
}

interface MessageListenerProps {
  isConnected: boolean;
  isListening: boolean;
  messages: ListenerMessage[];
  onStart: () => void;
  onStop: () => void;
  onClear: () => void;
  entityType: 'queue' | 'subscription';
  entityName: string;
  topicName?: string;
}

export function MessageListener({
  isConnected,
  isListening,
  messages,
  onStart,
  onStop,
  onClear,
  entityType: _entityType,
  entityName,
  topicName,
}: MessageListenerProps) {
  const [selectedMessage, setSelectedMessage] = useState<ListenerMessage | null>(null);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full',
              isListening
                ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {isListening ? (
              <Radio className="h-5 w-5 animate-pulse" />
            ) : (
              <Circle className="h-5 w-5" />
            )}
          </div>
          <div>
            <h3 className="font-semibold">
              {topicName ? `${topicName} / ${entityName}` : entityName}
            </h3>
            <p className="text-sm text-muted-foreground">
              {!isConnected
                ? 'WebSocket disconnected'
                : isListening
                ? 'Listening for messages...'
                : 'Listener stopped'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {messages.length} message{messages.length !== 1 ? 's' : ''}
          </span>
          <Button variant="outline" size="sm" onClick={onClear} disabled={messages.length === 0}>
            <Trash2 className="mr-1 h-4 w-4" />
            Clear
          </Button>
          {isListening ? (
            <Button variant="destructive" size="sm" onClick={onStop}>
              <Square className="mr-1 h-4 w-4" />
              Stop
            </Button>
          ) : (
            <Button size="sm" onClick={onStart} disabled={!isConnected}>
              <Play className="mr-1 h-4 w-4" />
              Start
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Message List */}
        <div className="w-1/2 overflow-auto border-r">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <Radio className="h-12 w-12 text-muted-foreground" />
              <h4 className="mt-4 font-semibold">No messages received</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                {isListening
                  ? 'Waiting for new messages...'
                  : 'Start the listener to receive messages'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {messages.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => setSelectedMessage(msg)}
                  className={cn(
                    'w-full p-3 text-left transition-colors hover:bg-muted/50',
                    selectedMessage?.id === msg.id && 'bg-muted'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">#{msg.sequenceNumber}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.receivedAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {msg.body.length > 100 ? `${msg.body.substring(0, 100)}...` : msg.body}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Message Detail */}
        <div className="flex-1 overflow-auto">
          {selectedMessage ? (
            <MessageViewer
              message={{
                sequenceNumber: selectedMessage.sequenceNumber,
                messageId: selectedMessage.messageId,
                enqueuedTime: selectedMessage.enqueuedTime,
                body: selectedMessage.body,
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Select a message to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
