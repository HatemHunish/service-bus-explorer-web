import { Injectable, NotFoundException } from '@nestjs/common';
import { ConnectionsService } from '../../connections/connections.service';
import { AzureClientFactory } from '../../connections/azure-client.factory';
import { ITopic, CreateTopicDto, UpdateTopicDto, EntityStatus } from '@service-bus-explorer/shared';

@Injectable()
export class TopicsService {
  constructor(
    private readonly connectionsService: ConnectionsService,
    private readonly azureClientFactory: AzureClientFactory,
  ) {}

  private getAdminClient() {
    const connection = this.connectionsService.getActiveConnectionOrThrow();
    return this.azureClientFactory.createServiceBusClients(connection).adminClient;
  }

  async findAll(): Promise<ITopic[]> {
    const adminClient = this.getAdminClient();
    const topics: ITopic[] = [];

    for await (const topic of adminClient.listTopics()) {
      const runtimeProps = await adminClient.getTopicRuntimeProperties(topic.name);

      topics.push({
        name: topic.name,
        maxSizeInMegabytes: topic.maxSizeInMegabytes,
        maxMessageSizeInKilobytes: topic.maxMessageSizeInKilobytes,
        requiresDuplicateDetection: topic.requiresDuplicateDetection,
        defaultMessageTimeToLive: topic.defaultMessageTimeToLive,
        duplicateDetectionHistoryTimeWindow: topic.duplicateDetectionHistoryTimeWindow,
        enableBatchedOperations: topic.enableBatchedOperations,
        enablePartitioning: topic.enablePartitioning,
        autoDeleteOnIdle: topic.autoDeleteOnIdle,
        status: topic.status as EntityStatus,
        userMetadata: topic.userMetadata,
        supportOrdering: topic.supportOrdering,
        runtimeProperties: {
          name: runtimeProps.name,
          subscriptionCount: runtimeProps.subscriptionCount ?? 0,
          sizeInBytes: runtimeProps.sizeInBytes ?? 0,
          scheduledMessageCount: runtimeProps.scheduledMessageCount ?? 0,
          createdAt: runtimeProps.createdAt,
          modifiedAt: runtimeProps.modifiedAt,
          accessedAt: runtimeProps.accessedAt,
        },
      });
    }

    return topics;
  }

  async findOne(name: string): Promise<ITopic> {
    const adminClient = this.getAdminClient();

    try {
      const topic = await adminClient.getTopic(name);
      const runtimeProps = await adminClient.getTopicRuntimeProperties(name);

      return {
        name: topic.name,
        maxSizeInMegabytes: topic.maxSizeInMegabytes,
        maxMessageSizeInKilobytes: topic.maxMessageSizeInKilobytes,
        requiresDuplicateDetection: topic.requiresDuplicateDetection,
        defaultMessageTimeToLive: topic.defaultMessageTimeToLive,
        duplicateDetectionHistoryTimeWindow: topic.duplicateDetectionHistoryTimeWindow,
        enableBatchedOperations: topic.enableBatchedOperations,
        enablePartitioning: topic.enablePartitioning,
        autoDeleteOnIdle: topic.autoDeleteOnIdle,
        status: topic.status as EntityStatus,
        userMetadata: topic.userMetadata,
        supportOrdering: topic.supportOrdering,
        runtimeProperties: {
          name: runtimeProps.name,
          subscriptionCount: runtimeProps.subscriptionCount ?? 0,
          sizeInBytes: runtimeProps.sizeInBytes ?? 0,
          scheduledMessageCount: runtimeProps.scheduledMessageCount ?? 0,
          createdAt: runtimeProps.createdAt,
          modifiedAt: runtimeProps.modifiedAt,
          accessedAt: runtimeProps.accessedAt,
        },
      };
    } catch (error: any) {
      if (error.code === 'MessagingEntityNotFound') {
        throw new NotFoundException(`Topic '${name}' not found`);
      }
      throw error;
    }
  }

  async create(dto: CreateTopicDto): Promise<ITopic> {
    const adminClient = this.getAdminClient();

    const options: any = {};
    Object.keys(dto).forEach(key => {
      if (key !== 'name' && (dto as any)[key] !== undefined) {
        options[key] = (dto as any)[key];
      }
    });

    await adminClient.createTopic(dto.name, options);
    return this.findOne(dto.name);
  }

  async update(name: string, dto: UpdateTopicDto): Promise<ITopic> {
    const adminClient = this.getAdminClient();
    const existing = await adminClient.getTopic(name);

    const updates: any = { ...existing };
    Object.keys(dto).forEach(key => {
      if ((dto as any)[key] !== undefined) {
        updates[key] = (dto as any)[key];
      }
    });

    await adminClient.updateTopic(updates);
    return this.findOne(name);
  }

  async remove(name: string): Promise<void> {
    const adminClient = this.getAdminClient();

    try {
      await adminClient.deleteTopic(name);
    } catch (error: any) {
      if (error.code === 'MessagingEntityNotFound') {
        throw new NotFoundException(`Topic '${name}' not found`);
      }
      throw error;
    }
  }
}
