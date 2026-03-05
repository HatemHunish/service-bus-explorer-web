import { Injectable, NotFoundException } from '@nestjs/common';
import { ConnectionsService } from '../../connections/connections.service';
import { AzureClientFactory } from '../../connections/azure-client.factory';
import { ISubscription, CreateSubscriptionDto, UpdateSubscriptionDto, EntityStatus } from '@service-bus-explorer/shared';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly connectionsService: ConnectionsService,
    private readonly azureClientFactory: AzureClientFactory,
  ) {}

  private getAdminClient() {
    const connection = this.connectionsService.getActiveConnectionOrThrow();
    return this.azureClientFactory.createServiceBusClients(connection).adminClient;
  }

  async findAll(topicName: string): Promise<ISubscription[]> {
    const adminClient = this.getAdminClient();
    const subscriptions: ISubscription[] = [];

    for await (const sub of adminClient.listSubscriptions(topicName)) {
      const runtimeProps = await adminClient.getSubscriptionRuntimeProperties(topicName, sub.subscriptionName);

      subscriptions.push({
        subscriptionName: sub.subscriptionName,
        topicName: topicName,
        lockDuration: sub.lockDuration,
        requiresSession: sub.requiresSession,
        defaultMessageTimeToLive: sub.defaultMessageTimeToLive,
        deadLetteringOnMessageExpiration: sub.deadLetteringOnMessageExpiration,
        deadLetteringOnFilterEvaluationExceptions: sub.deadLetteringOnFilterEvaluationExceptions,
        maxDeliveryCount: sub.maxDeliveryCount,
        enableBatchedOperations: sub.enableBatchedOperations,
        forwardTo: sub.forwardTo,
        forwardDeadLetteredMessagesTo: sub.forwardDeadLetteredMessagesTo,
        autoDeleteOnIdle: sub.autoDeleteOnIdle,
        status: sub.status as EntityStatus,
        userMetadata: sub.userMetadata,
        runtimeProperties: {
          subscriptionName: runtimeProps.subscriptionName,
          topicName: runtimeProps.topicName,
          totalMessageCount: runtimeProps.totalMessageCount,
          activeMessageCount: runtimeProps.activeMessageCount,
          deadLetterMessageCount: runtimeProps.deadLetterMessageCount,
          transferMessageCount: runtimeProps.transferMessageCount,
          transferDeadLetterMessageCount: runtimeProps.transferDeadLetterMessageCount,
          createdAt: runtimeProps.createdAt,
          modifiedAt: runtimeProps.modifiedAt,
          accessedAt: runtimeProps.accessedAt,
        },
      });
    }

    return subscriptions;
  }

  async findOne(topicName: string, subscriptionName: string): Promise<ISubscription> {
    const adminClient = this.getAdminClient();

    try {
      const sub = await adminClient.getSubscription(topicName, subscriptionName);
      const runtimeProps = await adminClient.getSubscriptionRuntimeProperties(topicName, subscriptionName);

      return {
        subscriptionName: sub.subscriptionName,
        topicName: topicName,
        lockDuration: sub.lockDuration,
        requiresSession: sub.requiresSession,
        defaultMessageTimeToLive: sub.defaultMessageTimeToLive,
        deadLetteringOnMessageExpiration: sub.deadLetteringOnMessageExpiration,
        deadLetteringOnFilterEvaluationExceptions: sub.deadLetteringOnFilterEvaluationExceptions,
        maxDeliveryCount: sub.maxDeliveryCount,
        enableBatchedOperations: sub.enableBatchedOperations,
        forwardTo: sub.forwardTo,
        forwardDeadLetteredMessagesTo: sub.forwardDeadLetteredMessagesTo,
        autoDeleteOnIdle: sub.autoDeleteOnIdle,
        status: sub.status as EntityStatus,
        userMetadata: sub.userMetadata,
        runtimeProperties: {
          subscriptionName: runtimeProps.subscriptionName,
          topicName: runtimeProps.topicName,
          totalMessageCount: runtimeProps.totalMessageCount,
          activeMessageCount: runtimeProps.activeMessageCount,
          deadLetterMessageCount: runtimeProps.deadLetterMessageCount,
          transferMessageCount: runtimeProps.transferMessageCount,
          transferDeadLetterMessageCount: runtimeProps.transferDeadLetterMessageCount,
          createdAt: runtimeProps.createdAt,
          modifiedAt: runtimeProps.modifiedAt,
          accessedAt: runtimeProps.accessedAt,
        },
      };
    } catch (error: any) {
      if (error.code === 'MessagingEntityNotFound') {
        throw new NotFoundException(`Subscription '${subscriptionName}' not found in topic '${topicName}'`);
      }
      throw error;
    }
  }

  async create(topicName: string, dto: CreateSubscriptionDto): Promise<ISubscription> {
    const adminClient = this.getAdminClient();

    const options: any = {};
    Object.keys(dto).forEach(key => {
      if (key !== 'subscriptionName' && key !== 'defaultRule' && (dto as any)[key] !== undefined) {
        options[key] = (dto as any)[key];
      }
    });

    if (dto.defaultRule) {
      await adminClient.createSubscription(topicName, dto.subscriptionName, {
        ...options,
        defaultRuleOptions: {
          name: dto.defaultRule.name,
          filter: dto.defaultRule.filter.sqlExpression
            ? { sqlExpression: dto.defaultRule.filter.sqlExpression }
            : dto.defaultRule.filter.correlationFilter || { sqlExpression: '1=1' },
          action: dto.defaultRule.action?.sqlExpression
            ? { sqlExpression: dto.defaultRule.action.sqlExpression }
            : undefined,
        },
      });
    } else {
      await adminClient.createSubscription(topicName, dto.subscriptionName, options);
    }

    return this.findOne(topicName, dto.subscriptionName);
  }

  async update(topicName: string, subscriptionName: string, dto: UpdateSubscriptionDto): Promise<ISubscription> {
    const adminClient = this.getAdminClient();
    const existing = await adminClient.getSubscription(topicName, subscriptionName);

    const updates: any = { ...existing };
    Object.keys(dto).forEach(key => {
      if ((dto as any)[key] !== undefined) {
        updates[key] = (dto as any)[key];
      }
    });

    await adminClient.updateSubscription(updates);
    return this.findOne(topicName, subscriptionName);
  }

  async remove(topicName: string, subscriptionName: string): Promise<void> {
    const adminClient = this.getAdminClient();

    try {
      await adminClient.deleteSubscription(topicName, subscriptionName);
    } catch (error: any) {
      if (error.code === 'MessagingEntityNotFound') {
        throw new NotFoundException(`Subscription '${subscriptionName}' not found in topic '${topicName}'`);
      }
      throw error;
    }
  }
}
