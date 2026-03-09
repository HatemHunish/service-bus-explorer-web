// Match operators for conditions
export type MatchOperator = 'equals' | 'notEquals' | 'contains' | 'startsWith' | 'endsWith' | 'regex' | 'exists';

// Property condition for matching message properties
export interface IPropertyCondition {
  property: string;
  operator: MatchOperator;
  value?: string | number | boolean;
}

// Body condition for matching JSON body fields
export interface IBodyCondition {
  jsonPath: string;
  operator: MatchOperator;
  value?: string | number | boolean;
}

// Source entity configuration
export interface IAutoReplySource {
  entityType: 'queue' | 'subscription';
  queueName?: string;
  topicName?: string;
  subscriptionName?: string;
}

// Reply target configuration
export interface IAutoReplyTarget {
  targetType: 'same' | 'queue' | 'topic';
  queueName?: string;
  topicName?: string;
  subscriptionName?: string;
}

// Reply configuration
export interface IAutoReplyConfig {
  target: IAutoReplyTarget;
  delayMs: number;
  replyCount: number; // Number of times to send the reply (default: 1)
  template: string;
  contentType: string;
  propertiesTemplate?: Record<string, string>;
}

// Auto-reply rule
export interface IAutoReplyRule {
  id: string;
  connectionId: string;
  name: string;
  description?: string;
  enabled: boolean;
  source: IAutoReplySource;
  propertyConditions: IPropertyCondition[];
  bodyConditions: IBodyCondition[];
  matchMode: 'all' | 'any';
  reply: IAutoReplyConfig;
  createdAt: Date;
  updatedAt: Date;
  lastTriggeredAt?: Date;
  triggerCount: number;
}

// Create/Update DTOs
export interface ICreateAutoReplyRule {
  connectionId: string;
  name: string;
  description?: string;
  enabled?: boolean;
  source: IAutoReplySource;
  propertyConditions?: IPropertyCondition[];
  bodyConditions?: IBodyCondition[];
  matchMode?: 'all' | 'any';
  reply: {
    target: IAutoReplyTarget;
    delayMs?: number;
    replyCount?: number; // Number of times to send the reply (default: 1)
    template: string;
    contentType?: string;
    propertiesTemplate?: Record<string, string>;
  };
}

export interface IUpdateAutoReplyRule {
  name?: string;
  description?: string;
  enabled?: boolean;
  source?: IAutoReplySource;
  propertyConditions?: IPropertyCondition[];
  bodyConditions?: IBodyCondition[];
  matchMode?: 'all' | 'any';
  reply?: {
    target?: IAutoReplyTarget;
    delayMs?: number;
    replyCount?: number;
    template?: string;
    contentType?: string;
    propertiesTemplate?: Record<string, string>;
  };
}

// Listener status
export interface IAutoReplyListenerStatus {
  ruleId: string;
  ruleName: string;
  isActive: boolean;
  startedAt?: Date;
  messagesProcessed: number;
  messagesMatched: number;
  lastError?: string;
}

// Activity log entry
export interface IAutoReplyActivityLog {
  id: string;
  ruleId: string;
  ruleName: string;
  originalMessageId?: string;
  originalSequenceNumber?: number;
  originalBody?: string;
  replyMessageId?: string;
  replyBody?: string;
  replyTarget?: string;
  status: 'success' | 'failed' | 'skipped';
  errorMessage?: string;
  receivedAt: Date;
  repliedAt?: Date;
  processingTimeMs?: number;
}

// Template test request/response
export interface ITemplateTestRequest {
  template: string;
  sampleMessage: {
    messageId?: string;
    correlationId?: string;
    subject?: string;
    contentType?: string;
    applicationProperties?: Record<string, unknown>;
    body: unknown;
  };
}

export interface ITemplateTestResponse {
  result: string;
  variables: string[];
  errors?: string[];
}

// Available variables response
export interface IAvailableVariables {
  systemVariables: string[];
  propertyVariables: string[];
  bodyVariables: string[];
}
