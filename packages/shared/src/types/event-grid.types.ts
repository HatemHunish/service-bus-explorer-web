export interface IEventGridNamespace {
  id: string;
  name: string;
  location: string;
  provisioningState: string;
  topicsConfiguration?: {
    inputSchema: string;
  };
}

export interface IEventGridTopic {
  name: string;
  provisioningState: string;
  inputSchema?: string;
  publisherType?: string;
}

export interface IEventGridSubscription {
  name: string;
  topicName: string;
  provisioningState: string;
  deliveryConfiguration?: {
    deliveryMode: string;
    queue?: {
      receiveLockDurationInSeconds: number;
      maxDeliveryCount: number;
    };
  };
  eventDeliverySchema?: string;
  filtersConfiguration?: {
    includedEventTypes?: string[];
    filters?: IEventGridFilter[];
  };
}

export interface IEventGridFilter {
  key: string;
  operatorType: string;
  values?: string[];
  value?: string | number | boolean;
}

export interface CreateEventGridTopicDto {
  name: string;
  inputSchema?: string;
  publisherType?: string;
}

export interface CreateEventGridSubscriptionDto {
  name: string;
  deliveryMode?: 'Queue' | 'Push';
  receiveLockDurationInSeconds?: number;
  maxDeliveryCount?: number;
  eventTypes?: string[];
  filters?: IEventGridFilter[];
}

export interface ICloudEvent {
  id: string;
  source: string;
  type: string;
  specversion: string;
  time?: string;
  datacontenttype?: string;
  subject?: string;
  data?: unknown;
}

export interface PublishEventDto {
  source: string;
  type: string;
  subject?: string;
  data: unknown;
  dataContentType?: string;
}

export interface PublishEventsDto {
  events: PublishEventDto[];
}

export interface ReceiveGridEventsDto {
  maxEvents?: number;
  maxWaitTimeInSeconds?: number;
}

export interface IReceivedCloudEvent extends ICloudEvent {
  brokerProperties: {
    lockToken: string;
    deliveryCount: number;
  };
}

export interface EventActionDto {
  lockTokens: string[];
}

export type EventAction = 'acknowledge' | 'release' | 'reject';
