export type EntityStatus = 'Active' | 'Disabled' | 'SendDisabled' | 'ReceiveDisabled';

// Queue Types
export interface IQueueProperties {
  name: string;
  maxSizeInMegabytes: number;
  maxMessageSizeInKilobytes?: number;
  requiresDuplicateDetection: boolean;
  requiresSession: boolean;
  defaultMessageTimeToLive: string;
  deadLetteringOnMessageExpiration: boolean;
  duplicateDetectionHistoryTimeWindow: string;
  maxDeliveryCount: number;
  lockDuration: string;
  enableBatchedOperations: boolean;
  enablePartitioning: boolean;
  forwardTo?: string;
  forwardDeadLetteredMessagesTo?: string;
  autoDeleteOnIdle?: string;
  status: EntityStatus;
  userMetadata?: string;
}

export interface IQueueRuntimeProperties {
  name: string;
  totalMessageCount: number;
  activeMessageCount: number;
  deadLetterMessageCount: number;
  scheduledMessageCount: number;
  transferMessageCount: number;
  transferDeadLetterMessageCount: number;
  sizeInBytes: number;
  createdAt: Date;
  modifiedAt: Date;
  accessedAt: Date;
}

export interface IQueue extends IQueueProperties {
  runtimeProperties?: IQueueRuntimeProperties;
}

export interface CreateQueueDto {
  name: string;
  maxSizeInMegabytes?: number;
  maxMessageSizeInKilobytes?: number;
  requiresDuplicateDetection?: boolean;
  requiresSession?: boolean;
  defaultMessageTimeToLive?: string;
  deadLetteringOnMessageExpiration?: boolean;
  duplicateDetectionHistoryTimeWindow?: string;
  maxDeliveryCount?: number;
  lockDuration?: string;
  enableBatchedOperations?: boolean;
  enablePartitioning?: boolean;
  forwardTo?: string;
  forwardDeadLetteredMessagesTo?: string;
  autoDeleteOnIdle?: string;
  userMetadata?: string;
}

export interface UpdateQueueDto {
  maxSizeInMegabytes?: number;
  defaultMessageTimeToLive?: string;
  deadLetteringOnMessageExpiration?: boolean;
  duplicateDetectionHistoryTimeWindow?: string;
  maxDeliveryCount?: number;
  lockDuration?: string;
  enableBatchedOperations?: boolean;
  forwardTo?: string;
  forwardDeadLetteredMessagesTo?: string;
  autoDeleteOnIdle?: string;
  status?: EntityStatus;
  userMetadata?: string;
}

// Topic Types
export interface ITopicProperties {
  name: string;
  maxSizeInMegabytes: number;
  maxMessageSizeInKilobytes?: number;
  requiresDuplicateDetection: boolean;
  defaultMessageTimeToLive: string;
  duplicateDetectionHistoryTimeWindow: string;
  enableBatchedOperations: boolean;
  enablePartitioning: boolean;
  autoDeleteOnIdle?: string;
  status: EntityStatus;
  userMetadata?: string;
  supportOrdering: boolean;
}

export interface ITopicRuntimeProperties {
  name: string;
  subscriptionCount: number;
  sizeInBytes: number;
  scheduledMessageCount: number;
  createdAt: Date;
  modifiedAt: Date;
  accessedAt: Date;
}

export interface ITopic extends ITopicProperties {
  runtimeProperties?: ITopicRuntimeProperties;
}

export interface CreateTopicDto {
  name: string;
  maxSizeInMegabytes?: number;
  maxMessageSizeInKilobytes?: number;
  requiresDuplicateDetection?: boolean;
  defaultMessageTimeToLive?: string;
  duplicateDetectionHistoryTimeWindow?: string;
  enableBatchedOperations?: boolean;
  enablePartitioning?: boolean;
  autoDeleteOnIdle?: string;
  supportOrdering?: boolean;
  userMetadata?: string;
}

export interface UpdateTopicDto {
  maxSizeInMegabytes?: number;
  defaultMessageTimeToLive?: string;
  duplicateDetectionHistoryTimeWindow?: string;
  enableBatchedOperations?: boolean;
  autoDeleteOnIdle?: string;
  status?: EntityStatus;
  supportOrdering?: boolean;
  userMetadata?: string;
}

// Subscription Types
export interface ISubscriptionProperties {
  subscriptionName: string;
  topicName: string;
  lockDuration: string;
  requiresSession: boolean;
  defaultMessageTimeToLive: string;
  deadLetteringOnMessageExpiration: boolean;
  deadLetteringOnFilterEvaluationExceptions: boolean;
  maxDeliveryCount: number;
  enableBatchedOperations: boolean;
  forwardTo?: string;
  forwardDeadLetteredMessagesTo?: string;
  autoDeleteOnIdle?: string;
  status: EntityStatus;
  userMetadata?: string;
}

export interface ISubscriptionRuntimeProperties {
  subscriptionName: string;
  topicName: string;
  totalMessageCount: number;
  activeMessageCount: number;
  deadLetterMessageCount: number;
  transferMessageCount: number;
  transferDeadLetterMessageCount: number;
  createdAt: Date;
  modifiedAt: Date;
  accessedAt: Date;
}

export interface ISubscription extends ISubscriptionProperties {
  runtimeProperties?: ISubscriptionRuntimeProperties;
}

export interface CreateSubscriptionDto {
  subscriptionName: string;
  lockDuration?: string;
  requiresSession?: boolean;
  defaultMessageTimeToLive?: string;
  deadLetteringOnMessageExpiration?: boolean;
  deadLetteringOnFilterEvaluationExceptions?: boolean;
  maxDeliveryCount?: number;
  enableBatchedOperations?: boolean;
  forwardTo?: string;
  forwardDeadLetteredMessagesTo?: string;
  autoDeleteOnIdle?: string;
  userMetadata?: string;
  defaultRule?: CreateRuleDto;
}

export interface UpdateSubscriptionDto {
  lockDuration?: string;
  defaultMessageTimeToLive?: string;
  deadLetteringOnMessageExpiration?: boolean;
  deadLetteringOnFilterEvaluationExceptions?: boolean;
  maxDeliveryCount?: number;
  enableBatchedOperations?: boolean;
  forwardTo?: string;
  forwardDeadLetteredMessagesTo?: string;
  autoDeleteOnIdle?: string;
  status?: EntityStatus;
  userMetadata?: string;
}

// Rule Types
export type FilterType = 'sql' | 'correlation' | 'true' | 'false';

export interface ISqlFilter {
  sqlExpression: string;
}

export interface ICorrelationFilter {
  correlationId?: string;
  messageId?: string;
  to?: string;
  replyTo?: string;
  subject?: string;
  sessionId?: string;
  replyToSessionId?: string;
  contentType?: string;
  applicationProperties?: Record<string, string | number | boolean>;
}

export interface IRule {
  name: string;
  filter: ISqlFilter | ICorrelationFilter;
  action?: ISqlFilter;
  createdAt: Date;
}

export interface CreateRuleDto {
  name: string;
  filter: {
    type: FilterType;
    sqlExpression?: string;
    correlationFilter?: ICorrelationFilter;
  };
  action?: {
    sqlExpression: string;
  };
}

// Authorization Rule Types
export type AccessRight = 'Manage' | 'Send' | 'Listen';

export interface IAuthorizationRule {
  keyName: string;
  primaryKey: string;
  secondaryKey: string;
  rights: AccessRight[];
  createdAt?: Date;
  modifiedAt?: Date;
}

export interface CreateAuthorizationRuleDto {
  keyName: string;
  rights: AccessRight[];
}
