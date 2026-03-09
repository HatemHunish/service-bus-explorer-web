import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useConnectionStore } from '@/store/useConnectionStore';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

interface WebSocketState {
  isConnected: boolean;
  isListening: boolean;
  messages: ReceivedMessage[];
  entityUpdates: EntityUpdate[];
}

interface ReceivedMessage {
  id: string;
  sequenceNumber: number;
  messageId?: string;
  body: string;
  enqueuedTime: string;
  entityType: 'queue' | 'subscription';
  entityName: string;
  topicName?: string;
  receivedAt: string;
}

interface EntityUpdate {
  entityType: 'queue' | 'topic' | 'subscription';
  entityName: string;
  topicName?: string;
  activeMessageCount?: number;
  deadLetterMessageCount?: number;
  scheduledMessageCount?: number;
  transferMessageCount?: number;
}

interface UseWebSocketOptions {
  autoConnect?: boolean;
  maxMessages?: number;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { autoConnect = true, maxMessages = 100 } = options;
  const socketRef = useRef<Socket | null>(null);
  const { activeConnection } = useConnectionStore();

  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isListening: false,
    messages: [],
    entityUpdates: [],
  });

  // Initialize socket connection
  useEffect(() => {
    if (!autoConnect) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('WebSocket connected');
      setState((prev) => ({ ...prev, isConnected: true }));
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setState((prev) => ({ ...prev, isConnected: false, isListening: false }));
    });

    socket.on('message:received', (message: ReceivedMessage) => {
      setState((prev) => ({
        ...prev,
        messages: [
          { ...message, receivedAt: new Date().toISOString() },
          ...prev.messages,
        ].slice(0, maxMessages),
      }));
    });

    socket.on('entity:update', (update: EntityUpdate) => {
      setState((prev) => ({
        ...prev,
        entityUpdates: [update, ...prev.entityUpdates.filter(
          (u) =>
            !(u.entityType === update.entityType &&
              u.entityName === update.entityName &&
              u.topicName === update.topicName)
        )].slice(0, 50),
      }));
    });

    socket.on('listener:started', ({ entityName, topicName }) => {
      console.log(`Listener started for ${topicName ? `${topicName}/` : ''}${entityName}`);
      setState((prev) => ({ ...prev, isListening: true }));
    });

    socket.on('listener:stopped', ({ entityName, topicName }) => {
      console.log(`Listener stopped for ${topicName ? `${topicName}/` : ''}${entityName}`);
      setState((prev) => ({ ...prev, isListening: false }));
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [autoConnect, maxMessages]);

  // Start listening to messages
  const startListening = useCallback(
    (entityType: 'queue' | 'subscription', entityName: string, topicName?: string) => {
      if (!socketRef.current || !activeConnection) return;

      socketRef.current.emit('subscribe:messages', {
        connectionId: activeConnection.id,
        entityType,
        entityName,
        topicName,
      });
    },
    [activeConnection]
  );

  // Stop listening to messages
  const stopListening = useCallback(
    (entityType: 'queue' | 'subscription', entityName: string, topicName?: string) => {
      if (!socketRef.current) return;

      socketRef.current.emit('unsubscribe:messages', {
        entityType,
        entityName,
        topicName,
      });
    },
    []
  );

  // Subscribe to entity updates
  const subscribeToEntity = useCallback(
    (entityType: 'queue' | 'topic' | 'subscription', entityName: string, topicName?: string) => {
      if (!socketRef.current || !activeConnection) return;

      socketRef.current.emit('subscribe:entity', {
        connectionId: activeConnection.id,
        entityType,
        entityName,
        topicName,
      });
    },
    [activeConnection]
  );

  // Unsubscribe from entity updates
  const unsubscribeFromEntity = useCallback(
    (entityType: 'queue' | 'topic' | 'subscription', entityName: string, topicName?: string) => {
      if (!socketRef.current) return;

      socketRef.current.emit('unsubscribe:entity', {
        entityType,
        entityName,
        topicName,
      });
    },
    []
  );

  // Clear received messages
  const clearMessages = useCallback(() => {
    setState((prev) => ({ ...prev, messages: [] }));
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
    subscribeToEntity,
    unsubscribeFromEntity,
    clearMessages,
    socket: socketRef.current,
  };
}

// Hook for listening to a specific queue
export function useQueueListener(queueName: string | undefined) {
  const { isConnected, isListening, messages, startListening, stopListening, clearMessages } =
    useWebSocket();

  const start = useCallback(() => {
    if (queueName) {
      startListening('queue', queueName);
    }
  }, [queueName, startListening]);

  const stop = useCallback(() => {
    if (queueName) {
      stopListening('queue', queueName);
    }
  }, [queueName, stopListening]);

  // Filter messages for this queue
  const queueMessages = messages.filter(
    (m) => m.entityType === 'queue' && m.entityName === queueName
  );

  return {
    isConnected,
    isListening,
    messages: queueMessages,
    start,
    stop,
    clearMessages,
  };
}

// Hook for listening to a specific subscription
export function useSubscriptionListener(topicName: string | undefined, subscriptionName: string | undefined) {
  const { isConnected, isListening, messages, startListening, stopListening, clearMessages } =
    useWebSocket();

  const start = useCallback(() => {
    if (topicName && subscriptionName) {
      startListening('subscription', subscriptionName, topicName);
    }
  }, [topicName, subscriptionName, startListening]);

  const stop = useCallback(() => {
    if (topicName && subscriptionName) {
      stopListening('subscription', subscriptionName, topicName);
    }
  }, [topicName, subscriptionName, stopListening]);

  // Filter messages for this subscription
  const subscriptionMessages = messages.filter(
    (m) =>
      m.entityType === 'subscription' &&
      m.entityName === subscriptionName &&
      m.topicName === topicName
  );

  return {
    isConnected,
    isListening,
    messages: subscriptionMessages,
    start,
    stop,
    clearMessages,
  };
}
