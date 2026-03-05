export type MessageBodyType = 'text' | 'json' | 'xml' | 'binary';

export interface IMessageProperty {
  key: string;
  value: string | number | boolean | Date;
  type: 'string' | 'number' | 'boolean' | 'datetime';
}

export interface ISendMessage {
  messageId?: string;
  sessionId?: string;
  correlationId?: string;
  contentType?: string;
  subject?: string;
  partitionKey?: string;
  to?: string;
  replyTo?: string;
  replyToSessionId?: string;
  timeToLive?: string;
  scheduledEnqueueTime?: Date;
  body: string;
  bodyType: MessageBodyType;
  applicationProperties?: IMessageProperty[];
}

export interface IReceivedMessage {
  messageId: string;
  sequenceNumber: number;
  enqueuedTime: Date;
  expiresAt?: Date;
  lockedUntil?: Date;
  lockToken?: string;
  deliveryCount: number;
  sessionId?: string;
  correlationId?: string;
  contentType?: string;
  subject?: string;
  partitionKey?: string;
  to?: string;
  replyTo?: string;
  replyToSessionId?: string;
  timeToLive?: string;
  state: 'active' | 'deferred' | 'scheduled';
  deadLetterSource?: string;
  deadLetterReason?: string;
  deadLetterErrorDescription?: string;
  body: string;
  bodyType: MessageBodyType;
  applicationProperties: Record<string, unknown>;
}

export interface SendMessageDto {
  message: ISendMessage;
}

export interface SendBatchMessagesDto {
  messages: ISendMessage[];
}

export interface PeekMessagesDto {
  maxMessageCount?: number;
  fromSequenceNumber?: number;
}

export interface ReceiveMessagesDto {
  maxMessageCount?: number;
  maxWaitTimeInMs?: number;
  receiveMode?: 'peekLock' | 'receiveAndDelete';
}

export interface MessageActionDto {
  lockToken: string;
}

export interface ResubmitMessageDto {
  message: ISendMessage;
  targetEntity?: string;
}

export interface PurgeMessagesDto {
  includeDeadLetter?: boolean;
}

export interface PurgeResult {
  purgedCount: number;
}
