import { Injectable } from '@nestjs/common';
import { ConnectionsService } from '../connections/connections.service';
import { AzureClientFactory } from '../connections/azure-client.factory';
import { IEventHub, IPartitionProperties, IConsumerGroup, IReceivedEventData, IEventData } from '@service-bus-explorer/shared';

@Injectable()
export class EventHubsService {
  constructor(
    private readonly connectionsService: ConnectionsService,
    private readonly azureClientFactory: AzureClientFactory,
  ) {}

  async findAll(): Promise<IEventHub[]> {
    // Event Hubs requires separate connection - implementation depends on namespace type
    // For now, return empty array - full implementation requires Event Hub specific connection
    return [];
  }

  async getPartitions(eventHubName: string): Promise<IPartitionProperties[]> {
    const connection = this.connectionsService.getActiveConnectionOrThrow();
    const { consumerClient } = this.azureClientFactory.createEventHubClients(connection, eventHubName);

    const partitionIds = await consumerClient.getPartitionIds();
    const partitions: IPartitionProperties[] = [];

    for (const partitionId of partitionIds) {
      const props = await consumerClient.getPartitionProperties(partitionId);
      partitions.push({
        partitionId: props.partitionId,
        eventHubName: props.eventHubName,
        beginningSequenceNumber: Number(props.beginningSequenceNumber),
        lastEnqueuedSequenceNumber: Number(props.lastEnqueuedSequenceNumber),
        lastEnqueuedOffset: String(props.lastEnqueuedOffset),
        lastEnqueuedTimeUtc: props.lastEnqueuedOnUtc,
        isEmpty: props.isEmpty,
      });
    }

    return partitions;
  }

  async sendEvents(eventHubName: string, events: IEventData[], partitionId?: string): Promise<void> {
    const connection = this.connectionsService.getActiveConnectionOrThrow();
    const { producerClient } = this.azureClientFactory.createEventHubClients(connection, eventHubName);

    const batch = await producerClient.createBatch(partitionId ? { partitionId } : undefined);

    for (const event of events) {
      const added = batch.tryAdd({
        body: event.body,
        contentType: event.contentType,
        properties: event.properties,
      });

      if (!added) {
        // Send current batch and create new one
        await producerClient.sendBatch(batch);
        const newBatch = await producerClient.createBatch(partitionId ? { partitionId } : undefined);
        newBatch.tryAdd({
          body: event.body,
          contentType: event.contentType,
          properties: event.properties,
        });
      }
    }

    if (batch.count > 0) {
      await producerClient.sendBatch(batch);
    }
  }

  async receiveEvents(
    eventHubName: string,
    partitionId: string,
    consumerGroup = '$Default',
    maxEventCount = 10,
    maxWaitTimeInSeconds = 30,
  ): Promise<IReceivedEventData[]> {
    const connection = this.connectionsService.getActiveConnectionOrThrow();
    const { consumerClient } = this.azureClientFactory.createEventHubClients(connection, eventHubName, consumerGroup);

    const events: IReceivedEventData[] = [];
    const subscription = consumerClient.subscribe(
      partitionId,
      {
        processEvents: async (receivedEvents) => {
          for (const event of receivedEvents) {
            events.push({
              sequenceNumber: Number(event.sequenceNumber),
              offset: String(event.offset),
              enqueuedTimeUtc: event.enqueuedTimeUtc,
              partitionKey: event.partitionKey || undefined,
              body: typeof event.body === 'string' ? event.body : JSON.stringify(event.body),
              contentType: event.contentType,
              properties: event.properties as Record<string, unknown>,
              systemProperties: event.systemProperties as Record<string, unknown>,
            });

            if (events.length >= maxEventCount) {
              await subscription.close();
            }
          }
        },
        processError: async (err) => {
          console.error('Error receiving events:', err);
        },
      },
      { startPosition: { isInclusive: false } },
    );

    // Wait for events or timeout
    await new Promise((resolve) => setTimeout(resolve, maxWaitTimeInSeconds * 1000));
    await subscription.close();

    return events;
  }
}
