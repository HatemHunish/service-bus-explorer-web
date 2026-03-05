export interface IEventHubProperties {
  name: string;
  createdAt: Date;
  partitionIds: string[];
}

export interface IEventHubRuntimeProperties {
  name: string;
  createdAt: Date;
  partitionIds: string[];
}

export interface IEventHub extends IEventHubProperties {
  runtimeProperties?: IEventHubRuntimeProperties;
}

export interface IPartitionProperties {
  partitionId: string;
  eventHubName: string;
  beginningSequenceNumber: number;
  lastEnqueuedSequenceNumber: number;
  lastEnqueuedOffset: string;
  lastEnqueuedTimeUtc: Date;
  isEmpty: boolean;
}

export interface IConsumerGroup {
  name: string;
  eventHubName: string;
  createdAt: Date;
  userMetadata?: string;
}

export interface CreateConsumerGroupDto {
  name: string;
  userMetadata?: string;
}

export interface IEventData {
  partitionKey?: string;
  body: string;
  contentType?: string;
  properties?: Record<string, unknown>;
}

export interface IReceivedEventData extends IEventData {
  sequenceNumber: number;
  offset: string;
  enqueuedTimeUtc: Date;
  partitionKey?: string;
  systemProperties: Record<string, unknown>;
}

export interface SendEventsDto {
  events: IEventData[];
  partitionId?: string;
  partitionKey?: string;
}

export interface ReceiveEventsDto {
  partitionId: string;
  consumerGroup?: string;
  startPosition?: {
    offset?: string;
    sequenceNumber?: number;
    enqueuedTime?: Date;
    isInclusive?: boolean;
  };
  maxEventCount?: number;
  maxWaitTimeInSeconds?: number;
}
