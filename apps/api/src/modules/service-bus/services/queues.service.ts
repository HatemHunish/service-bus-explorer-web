import { Injectable, NotFoundException } from '@nestjs/common';
import { ConnectionsService } from '../../connections/connections.service';
import { AzureClientFactory } from '../../connections/azure-client.factory';
import {
  IQueue,
  IQueueProperties,
  IQueueRuntimeProperties,
  CreateQueueDto,
  UpdateQueueDto,
  EntityStatus,
} from '@service-bus-explorer/shared';

@Injectable()
export class QueuesService {
  constructor(
    private readonly connectionsService: ConnectionsService,
    private readonly azureClientFactory: AzureClientFactory,
  ) {}

  private getAdminClient() {
    const connection = this.connectionsService.getActiveConnectionOrThrow();
    return this.azureClientFactory.createServiceBusClients(connection).adminClient;
  }

  async findAll(): Promise<IQueue[]> {
    const adminClient = this.getAdminClient();
    const queues: IQueue[] = [];

    for await (const queue of adminClient.listQueues()) {
      const runtimeProps = await adminClient.getQueueRuntimeProperties(queue.name);

      queues.push({
        name: queue.name,
        maxSizeInMegabytes: queue.maxSizeInMegabytes,
        maxMessageSizeInKilobytes: queue.maxMessageSizeInKilobytes,
        requiresDuplicateDetection: queue.requiresDuplicateDetection,
        requiresSession: queue.requiresSession,
        defaultMessageTimeToLive: queue.defaultMessageTimeToLive,
        deadLetteringOnMessageExpiration: queue.deadLetteringOnMessageExpiration,
        duplicateDetectionHistoryTimeWindow: queue.duplicateDetectionHistoryTimeWindow,
        maxDeliveryCount: queue.maxDeliveryCount,
        lockDuration: queue.lockDuration,
        enableBatchedOperations: queue.enableBatchedOperations,
        enablePartitioning: queue.enablePartitioning,
        forwardTo: queue.forwardTo,
        forwardDeadLetteredMessagesTo: queue.forwardDeadLetteredMessagesTo,
        autoDeleteOnIdle: queue.autoDeleteOnIdle,
        status: queue.status as EntityStatus,
        userMetadata: queue.userMetadata,
        runtimeProperties: {
          name: runtimeProps.name,
          totalMessageCount: runtimeProps.totalMessageCount ?? 0,
          activeMessageCount: runtimeProps.activeMessageCount ?? 0,
          deadLetterMessageCount: runtimeProps.deadLetterMessageCount ?? 0,
          scheduledMessageCount: runtimeProps.scheduledMessageCount ?? 0,
          transferMessageCount: runtimeProps.transferMessageCount ?? 0,
          transferDeadLetterMessageCount: runtimeProps.transferDeadLetterMessageCount ?? 0,
          sizeInBytes: runtimeProps.sizeInBytes ?? 0,
          createdAt: runtimeProps.createdAt,
          modifiedAt: runtimeProps.modifiedAt,
          accessedAt: runtimeProps.accessedAt,
        },
      });
    }

    return queues;
  }

  async findOne(name: string): Promise<IQueue> {
    const adminClient = this.getAdminClient();

    try {
      const queue = await adminClient.getQueue(name);
      const runtimeProps = await adminClient.getQueueRuntimeProperties(name);

      return {
        name: queue.name,
        maxSizeInMegabytes: queue.maxSizeInMegabytes,
        maxMessageSizeInKilobytes: queue.maxMessageSizeInKilobytes,
        requiresDuplicateDetection: queue.requiresDuplicateDetection,
        requiresSession: queue.requiresSession,
        defaultMessageTimeToLive: queue.defaultMessageTimeToLive,
        deadLetteringOnMessageExpiration: queue.deadLetteringOnMessageExpiration,
        duplicateDetectionHistoryTimeWindow: queue.duplicateDetectionHistoryTimeWindow,
        maxDeliveryCount: queue.maxDeliveryCount,
        lockDuration: queue.lockDuration,
        enableBatchedOperations: queue.enableBatchedOperations,
        enablePartitioning: queue.enablePartitioning,
        forwardTo: queue.forwardTo,
        forwardDeadLetteredMessagesTo: queue.forwardDeadLetteredMessagesTo,
        autoDeleteOnIdle: queue.autoDeleteOnIdle,
        status: queue.status as EntityStatus,
        userMetadata: queue.userMetadata,
        runtimeProperties: {
          name: runtimeProps.name,
          totalMessageCount: runtimeProps.totalMessageCount ?? 0,
          activeMessageCount: runtimeProps.activeMessageCount ?? 0,
          deadLetterMessageCount: runtimeProps.deadLetterMessageCount ?? 0,
          scheduledMessageCount: runtimeProps.scheduledMessageCount ?? 0,
          transferMessageCount: runtimeProps.transferMessageCount ?? 0,
          transferDeadLetterMessageCount: runtimeProps.transferDeadLetterMessageCount ?? 0,
          sizeInBytes: runtimeProps.sizeInBytes ?? 0,
          createdAt: runtimeProps.createdAt,
          modifiedAt: runtimeProps.modifiedAt,
          accessedAt: runtimeProps.accessedAt,
        },
      };
    } catch (error: any) {
      if (error.code === 'MessagingEntityNotFound') {
        throw new NotFoundException(`Queue '${name}' not found`);
      }
      throw error;
    }
  }

  async create(dto: CreateQueueDto): Promise<IQueue> {
    const adminClient = this.getAdminClient();

    const options: any = {
      maxSizeInMegabytes: dto.maxSizeInMegabytes,
      maxMessageSizeInKilobytes: dto.maxMessageSizeInKilobytes,
      requiresDuplicateDetection: dto.requiresDuplicateDetection,
      requiresSession: dto.requiresSession,
      defaultMessageTimeToLive: dto.defaultMessageTimeToLive,
      deadLetteringOnMessageExpiration: dto.deadLetteringOnMessageExpiration,
      duplicateDetectionHistoryTimeWindow: dto.duplicateDetectionHistoryTimeWindow,
      maxDeliveryCount: dto.maxDeliveryCount,
      lockDuration: dto.lockDuration,
      enableBatchedOperations: dto.enableBatchedOperations,
      enablePartitioning: dto.enablePartitioning,
      forwardTo: dto.forwardTo,
      forwardDeadLetteredMessagesTo: dto.forwardDeadLetteredMessagesTo,
      autoDeleteOnIdle: dto.autoDeleteOnIdle,
      userMetadata: dto.userMetadata,
    };

    // Remove undefined values
    Object.keys(options).forEach(key => {
      if (options[key] === undefined) {
        delete options[key];
      }
    });

    await adminClient.createQueue(dto.name, options);

    return this.findOne(dto.name);
  }

  async update(name: string, dto: UpdateQueueDto): Promise<IQueue> {
    const adminClient = this.getAdminClient();

    // Get existing queue
    const existing = await adminClient.getQueue(name);

    // Apply updates
    const updates: any = {
      ...existing,
      maxSizeInMegabytes: dto.maxSizeInMegabytes ?? existing.maxSizeInMegabytes,
      defaultMessageTimeToLive: dto.defaultMessageTimeToLive ?? existing.defaultMessageTimeToLive,
      deadLetteringOnMessageExpiration: dto.deadLetteringOnMessageExpiration ?? existing.deadLetteringOnMessageExpiration,
      duplicateDetectionHistoryTimeWindow: dto.duplicateDetectionHistoryTimeWindow ?? existing.duplicateDetectionHistoryTimeWindow,
      maxDeliveryCount: dto.maxDeliveryCount ?? existing.maxDeliveryCount,
      lockDuration: dto.lockDuration ?? existing.lockDuration,
      enableBatchedOperations: dto.enableBatchedOperations ?? existing.enableBatchedOperations,
      forwardTo: dto.forwardTo ?? existing.forwardTo,
      forwardDeadLetteredMessagesTo: dto.forwardDeadLetteredMessagesTo ?? existing.forwardDeadLetteredMessagesTo,
      autoDeleteOnIdle: dto.autoDeleteOnIdle ?? existing.autoDeleteOnIdle,
      status: dto.status ?? existing.status,
      userMetadata: dto.userMetadata ?? existing.userMetadata,
    };

    await adminClient.updateQueue(updates);

    return this.findOne(name);
  }

  async remove(name: string): Promise<void> {
    const adminClient = this.getAdminClient();

    try {
      await adminClient.deleteQueue(name);
    } catch (error: any) {
      if (error.code === 'MessagingEntityNotFound') {
        throw new NotFoundException(`Queue '${name}' not found`);
      }
      throw error;
    }
  }

  async exists(name: string): Promise<boolean> {
    const adminClient = this.getAdminClient();
    return adminClient.queueExists(name);
  }
}
