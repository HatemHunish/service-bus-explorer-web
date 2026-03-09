export const DEFAULT_MESSAGE_TTL = 'P14D'; // 14 days in ISO 8601 duration
export const DEFAULT_LOCK_DURATION = 'PT1M'; // 1 minute
export const DEFAULT_MAX_DELIVERY_COUNT = 10;
export const DEFAULT_MAX_SIZE_MB = 1024; // 1GB
export const DEFAULT_DUPLICATE_DETECTION_WINDOW = 'PT10M'; // 10 minutes

export const MESSAGE_BODY_TYPES = ['text', 'json', 'xml', 'binary'] as const;

export const ENTITY_STATUSES = [
  'Active',
  'Disabled',
  'SendDisabled',
  'ReceiveDisabled',
] as const;

export const ACCESS_RIGHTS = ['Manage', 'Send', 'Listen'] as const;

export const TRANSPORT_TYPES = ['amqp', 'amqpWebSockets'] as const;

export const PLATFORMS = ['apns', 'fcm', 'wns', 'mpns', 'adm', 'baidu'] as const;

export const API_ENDPOINTS = {
  CONNECTIONS: '/api/connections',
  SERVICE_BUS: {
    QUEUES: '/api/service-bus/queues',
    TOPICS: '/api/service-bus/topics',
    SUBSCRIPTIONS: (topicName: string) =>
      `/api/service-bus/topics/${encodeURIComponent(topicName)}/subscriptions`,
    RULES: (topicName: string, subscriptionName: string) =>
      `/api/service-bus/topics/${encodeURIComponent(topicName)}/subscriptions/${encodeURIComponent(subscriptionName)}/rules`,
  },
  EVENT_HUBS: '/api/event-hubs',
  EVENT_GRID: '/api/event-grid',
  NOTIFICATION_HUBS: '/api/notification-hubs',
  RELAYS: '/api/relays',
  IMPORT_EXPORT: '/api/import-export',
} as const;

export const WS_EVENTS = {
  SUBSCRIBE_MESSAGES: 'subscribe:messages',
  UNSUBSCRIBE_MESSAGES: 'unsubscribe:messages',
  MESSAGE_RECEIVED: 'message:received',
  ENTITY_UPDATE: 'entity:update',
  CONNECTION_STATUS: 'connection:status',
  ERROR: 'error',
  // Auto-reply events
  AUTO_REPLY_STARTED: 'auto-reply:started',
  AUTO_REPLY_STOPPED: 'auto-reply:stopped',
  AUTO_REPLY_MATCHED: 'auto-reply:matched',
  AUTO_REPLY_SENT: 'auto-reply:sent',
  AUTO_REPLY_ERROR: 'auto-reply:error',
} as const;
