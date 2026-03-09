import { Injectable, OnModuleDestroy, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ServiceBusReceivedMessage, ServiceBusMessage } from '@azure/service-bus';
import { IAutoReplyRule, IAutoReplyListenerStatus } from '@service-bus-explorer/shared';
import { ConnectionsService } from '../connections/connections.service';
import { AzureClientFactory } from '../connections/azure-client.factory';
import { AutoReplyService } from './auto-reply.service';
import { MatcherService } from './matcher.service';
import { TemplateService } from './template.service';

interface ListenerInfo {
  ruleId: string;
  ruleName: string;
  receiver: any;
  subscription: any;
  startedAt: Date;
  messagesProcessed: number;
  messagesMatched: number;
  lastError?: string;
}

@Injectable()
export class AutoReplyListenerService implements OnModuleDestroy {
  private readonly logger = new Logger(AutoReplyListenerService.name);
  private readonly activeListeners = new Map<string, ListenerInfo>();

  constructor(
    private readonly connectionsService: ConnectionsService,
    private readonly azureClientFactory: AzureClientFactory,
    private readonly autoReplyService: AutoReplyService,
    private readonly matcherService: MatcherService,
    private readonly templateService: TemplateService,
  ) {}

  async onModuleDestroy() {
    await this.stopAllListeners();
  }

  async startListener(ruleId: string): Promise<IAutoReplyListenerStatus> {
    // Check if already running
    if (this.activeListeners.has(ruleId)) {
      return this.getListenerStatus(ruleId)!;
    }

    const rule = this.autoReplyService.findById(ruleId);
    if (!rule) {
      throw new NotFoundException(`Rule not found: ${ruleId}`);
    }

    const connection = this.connectionsService.findOne(rule.connectionId);

    const { client: sbClient } = this.azureClientFactory.createServiceBusClients(connection);

    // Create receiver based on source entity type
    let receiver;
    if (rule.source.entityType === 'queue') {
      if (!rule.source.queueName) {
        throw new BadRequestException('Queue name is required for queue source');
      }
      receiver = sbClient.createReceiver(rule.source.queueName, { receiveMode: 'peekLock' });
    } else {
      if (!rule.source.topicName || !rule.source.subscriptionName) {
        throw new BadRequestException('Topic and subscription names are required for subscription source');
      }
      receiver = sbClient.createReceiver(rule.source.topicName, rule.source.subscriptionName, {
        receiveMode: 'peekLock',
      });
    }

    const listenerInfo: ListenerInfo = {
      ruleId,
      ruleName: rule.name,
      receiver,
      subscription: null,
      startedAt: new Date(),
      messagesProcessed: 0,
      messagesMatched: 0,
    };

    // Subscribe to messages
    const subscription = receiver.subscribe({
      processMessage: async (message: ServiceBusReceivedMessage) => {
        await this.processMessage(rule, message, listenerInfo, sbClient);
      },
      processError: async (err: any) => {
        this.logger.error(`Error in auto-reply listener for rule ${ruleId}:`, err);
        listenerInfo.lastError = err.error?.message || err.message || 'Unknown error';
      },
    });

    listenerInfo.subscription = subscription;
    this.activeListeners.set(ruleId, listenerInfo);

    this.logger.log(`Started auto-reply listener for rule: ${rule.name} (${ruleId})`);

    return this.getListenerStatus(ruleId)!;
  }

  async stopListener(ruleId: string): Promise<boolean> {
    const listener = this.activeListeners.get(ruleId);
    if (!listener) {
      return false;
    }

    try {
      if (listener.subscription) {
        await listener.subscription.close();
      }
      if (listener.receiver) {
        await listener.receiver.close();
      }
    } catch (err) {
      this.logger.error(`Error stopping listener for rule ${ruleId}:`, err);
    }

    this.activeListeners.delete(ruleId);
    this.logger.log(`Stopped auto-reply listener for rule: ${listener.ruleName} (${ruleId})`);

    return true;
  }

  async stopAllListeners(): Promise<void> {
    const ruleIds = Array.from(this.activeListeners.keys());
    for (const ruleId of ruleIds) {
      await this.stopListener(ruleId);
    }
  }

  isListenerActive(ruleId: string): boolean {
    return this.activeListeners.has(ruleId);
  }

  getListenerStatus(ruleId: string): IAutoReplyListenerStatus | null {
    const listener = this.activeListeners.get(ruleId);
    if (!listener) {
      const rule = this.autoReplyService.findById(ruleId);
      if (!rule) return null;
      return {
        ruleId,
        ruleName: rule.name,
        isActive: false,
        messagesProcessed: 0,
        messagesMatched: 0,
      };
    }

    return {
      ruleId: listener.ruleId,
      ruleName: listener.ruleName,
      isActive: true,
      startedAt: listener.startedAt,
      messagesProcessed: listener.messagesProcessed,
      messagesMatched: listener.messagesMatched,
      lastError: listener.lastError,
    };
  }

  getAllListenerStatuses(): IAutoReplyListenerStatus[] {
    const statuses: IAutoReplyListenerStatus[] = [];

    // Get all rules and their statuses
    const rules = this.autoReplyService.findAll();
    for (const rule of rules) {
      const status = this.getListenerStatus(rule.id);
      if (status) {
        statuses.push(status);
      }
    }

    return statuses;
  }

  getActiveListenerStatuses(): IAutoReplyListenerStatus[] {
    return Array.from(this.activeListeners.values()).map((listener) => ({
      ruleId: listener.ruleId,
      ruleName: listener.ruleName,
      isActive: true,
      startedAt: listener.startedAt,
      messagesProcessed: listener.messagesProcessed,
      messagesMatched: listener.messagesMatched,
      lastError: listener.lastError,
    }));
  }

  async resendReply(ruleId: string, logId: string): Promise<{ messageId: string }> {
    const rule = this.autoReplyService.findById(ruleId);
    if (!rule) throw new NotFoundException(`Rule not found: ${ruleId}`);

    const log = this.autoReplyService.findActivityById(logId);
    if (!log) throw new NotFoundException(`Activity log entry not found: ${logId}`);

    if (!log.replyBody || !log.replyTarget) {
      throw new BadRequestException('No reply body or target available for this log entry');
    }

    const connection = this.connectionsService.findOne(rule.connectionId);
    const { client: sbClient } = this.azureClientFactory.createServiceBusClients(connection);

    const messageId = this.templateService.generateReplyMessageId();
    const sender = sbClient.createSender(log.replyTarget);
    const startTime = Date.now();

    try {
      await sender.sendMessages({
        body: this.parseReplyBody(log.replyBody, rule.reply.contentType),
        messageId,
        contentType: rule.reply.contentType,
        correlationId: log.originalMessageId,
      });
    } finally {
      await sender.close();
      // Do NOT close sbClient — it's a shared cached client managed by AzureClientFactory.
      // Closing it here would kill any active listener using the same connection.
    }

    this.autoReplyService.logActivity({
      ruleId: rule.id,
      ruleName: rule.name,
      originalMessageId: log.originalMessageId,
      originalSequenceNumber: log.originalSequenceNumber,
      originalBody: log.originalBody,
      replyMessageId: messageId,
      replyBody: log.replyBody,
      replyTarget: log.replyTarget,
      status: 'success',
      receivedAt: new Date(),
      repliedAt: new Date(),
      processingTimeMs: Date.now() - startTime,
    });

    this.logger.log(`Manual resend for rule "${rule.name}" -> ${log.replyTarget} (${messageId})`);
    return { messageId };
  }

  private async processMessage(
    rule: IAutoReplyRule,
    message: ServiceBusReceivedMessage,
    listenerInfo: ListenerInfo,
    sbClient: any,
  ): Promise<void> {
    const startTime = Date.now();
    listenerInfo.messagesProcessed++;

    // Re-fetch rule to get latest version (in case it was updated)
    const currentRule = this.autoReplyService.findById(rule.id);
    if (!currentRule || !currentRule.enabled) {
      // Rule disabled or deleted, complete message and stop
      await listenerInfo.receiver.completeMessage(message);
      return;
    }

    // Check if message matches conditions
    const matches = this.matcherService.matchesRule(message, currentRule);

    if (!matches) {
      // Log skipped
      this.autoReplyService.logActivity({
        ruleId: currentRule.id,
        ruleName: currentRule.name,
        originalMessageId: message.messageId as string,
        originalSequenceNumber: Number(message.sequenceNumber),
        originalBody: this.getMessageBody(message),
        status: 'skipped',
        receivedAt: new Date(),
        processingTimeMs: Date.now() - startTime,
      });

      // Complete the message
      await listenerInfo.receiver.completeMessage(message);
      return;
    }

    listenerInfo.messagesMatched++;

    try {
      // Process delay if configured
      if (currentRule.reply.delayMs > 0) {
        await this.delay(currentRule.reply.delayMs);
      }

      // Build reply message
      const replyBody = this.templateService.processTemplate(currentRule.reply.template, message);
      const replyMessageId = this.templateService.generateReplyMessageId();

      const replyMessage: ServiceBusMessage = {
        body: this.parseReplyBody(replyBody, currentRule.reply.contentType),
        messageId: replyMessageId,
        contentType: currentRule.reply.contentType,
        correlationId: message.messageId as string,
      };

      // Process properties template if configured
      if (currentRule.reply.propertiesTemplate) {
        replyMessage.applicationProperties = this.templateService.processPropertiesTemplate(
          currentRule.reply.propertiesTemplate,
          message,
        );
      }

      // Determine reply target
      const replyTarget = this.getReplyTarget(currentRule, message);

      // Send reply replyCount times
      const replyCount = Number(currentRule.reply.replyCount ?? 1) || 1;
      this.logger.log(`Sending ${replyCount} reply message(s) to "${replyTarget}" for rule "${currentRule.name}"`);
      const sender = sbClient.createSender(replyTarget);
      try {
        for (let i = 0; i < replyCount; i++) {
          const msg: typeof replyMessage = {
            ...replyMessage,
            messageId: i === 0 ? replyMessageId : this.templateService.generateReplyMessageId(),
          };
          console.log('Sending reply message:', msg?.body);
          await sender.sendMessages(msg?.body);
          this.logger.debug(`Sent reply ${i + 1}/${replyCount} to "${replyTarget}"`);
          if (i < replyCount - 1 && currentRule.reply.delayMs > 0) {
            await this.delay(currentRule.reply.delayMs);
          }
        }
      } finally {
        await sender.close();
      }

      // Update trigger count
      this.autoReplyService.incrementTriggerCount(currentRule.id);

      // Log success
      this.autoReplyService.logActivity({
        ruleId: currentRule.id,
        ruleName: currentRule.name,
        originalMessageId: message.messageId as string,
        originalSequenceNumber: Number(message.sequenceNumber),
        originalBody: this.getMessageBody(message),
        replyMessageId,
        replyBody,
        replyTarget,
        status: 'success',
        receivedAt: new Date(),
        repliedAt: new Date(),
        processingTimeMs: Date.now() - startTime,
      });

      this.logger.log(
        `Auto-reply sent for rule "${currentRule.name}": ${message.messageId} -> ${replyTarget}`,
      );

      // Complete the original message
      await listenerInfo.receiver.completeMessage(message);
    } catch (err) {
      const errorMessage = (err as Error).message || 'Unknown error';
      listenerInfo.lastError = errorMessage;

      // Log failure
      this.autoReplyService.logActivity({
        ruleId: currentRule.id,
        ruleName: currentRule.name,
        originalMessageId: message.messageId as string,
        originalSequenceNumber: Number(message.sequenceNumber),
        originalBody: this.getMessageBody(message),
        status: 'failed',
        errorMessage,
        receivedAt: new Date(),
        processingTimeMs: Date.now() - startTime,
      });

      this.logger.error(`Auto-reply failed for rule "${currentRule.name}":`, err);

      // Abandon the message so it can be retried
      try {
        await listenerInfo.receiver.abandonMessage(message);
      } catch (abandonErr) {
        this.logger.error('Failed to abandon message:', abandonErr);
      }
    }
  }

  private getReplyTarget(rule: IAutoReplyRule, message: ServiceBusReceivedMessage): string {
    switch (rule.reply.target.targetType) {
      case 'queue':
        return rule.reply.target.queueName!;
      case 'topic':
        return rule.reply.target.topicName!;
      case 'same':
      default:
        // Reply to the same entity the message came from
        if (rule.source.entityType === 'queue') {
          return rule.source.queueName!;
        } else {
          // For subscriptions, we need to send to the topic
          return rule.source.topicName!;
        }
    }
  }

  private getMessageBody(message: ServiceBusReceivedMessage): string {
    if (typeof message.body === 'string') {
      return message.body;
    }
    if (Buffer.isBuffer(message.body)) {
      return message.body.toString('utf-8');
    }
    return JSON.stringify(message.body);
  }

  private parseReplyBody(body: string, contentType: string): unknown {
    if (contentType === 'application/json') {
      try {
        return JSON.parse(body);
      } catch {
        return body;
      }
    }
    return body;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
