import { Injectable, BadRequestException } from '@nestjs/common';
import {
  ServiceBusClient,
  ServiceBusAdministrationClient,
} from '@azure/service-bus';
import { EventHubConsumerClient, EventHubProducerClient } from '@azure/event-hubs';
import { DefaultAzureCredential } from '@azure/identity';
import { IConnection } from '@service-bus-explorer/shared';

export interface ServiceBusClients {
  client: ServiceBusClient;
  adminClient: ServiceBusAdministrationClient;
}

export interface EventHubClients {
  producerClient: EventHubProducerClient;
  consumerClient: EventHubConsumerClient;
}

@Injectable()
export class AzureClientFactory {
  private serviceBusClients: Map<string, ServiceBusClients> = new Map();
  private eventHubClients: Map<string, Map<string, EventHubClients>> = new Map();

  createServiceBusClients(connection: IConnection): ServiceBusClients {
    const cacheKey = connection.id;

    // Return cached clients if available
    if (this.serviceBusClients.has(cacheKey)) {
      return this.serviceBusClients.get(cacheKey)!;
    }

    let client: ServiceBusClient;
    let adminClient: ServiceBusAdministrationClient;

    if (connection.connectionType === 'sas') {
      if (!connection.connectionString) {
        throw new BadRequestException('Connection string is required for SAS authentication');
      }

      client = new ServiceBusClient(connection.connectionString, {
        webSocketOptions:
          connection.transportType === 'amqpWebSockets'
            ? { webSocket: require('ws') }
            : undefined,
      });

      adminClient = new ServiceBusAdministrationClient(connection.connectionString);
    } else if (connection.connectionType === 'entraId') {
      if (!connection.endpoint) {
        throw new BadRequestException('Endpoint is required for Entra ID authentication');
      }

      const credential = new DefaultAzureCredential();
      const fullyQualifiedNamespace = connection.endpoint.replace(/^sb:\/\//, '').replace(/\/$/, '');

      client = new ServiceBusClient(fullyQualifiedNamespace, credential, {
        webSocketOptions:
          connection.transportType === 'amqpWebSockets'
            ? { webSocket: require('ws') }
            : undefined,
      });

      adminClient = new ServiceBusAdministrationClient(fullyQualifiedNamespace, credential);
    } else {
      throw new BadRequestException(`Unsupported connection type: ${connection.connectionType}`);
    }

    const clients = { client, adminClient };
    this.serviceBusClients.set(cacheKey, clients);

    return clients;
  }

  createEventHubClients(
    connection: IConnection,
    eventHubName: string,
    consumerGroup = '$Default',
  ): EventHubClients {
    const connectionKey = connection.id;
    const eventHubKey = `${eventHubName}:${consumerGroup}`;

    // Check cache
    if (this.eventHubClients.has(connectionKey)) {
      const hubClients = this.eventHubClients.get(connectionKey)!;
      if (hubClients.has(eventHubKey)) {
        return hubClients.get(eventHubKey)!;
      }
    }

    let producerClient: EventHubProducerClient;
    let consumerClient: EventHubConsumerClient;

    if (connection.connectionType === 'sas') {
      if (!connection.connectionString) {
        throw new BadRequestException('Connection string is required for SAS authentication');
      }

      producerClient = new EventHubProducerClient(connection.connectionString, eventHubName);
      consumerClient = new EventHubConsumerClient(
        consumerGroup,
        connection.connectionString,
        eventHubName,
      );
    } else if (connection.connectionType === 'entraId') {
      if (!connection.endpoint) {
        throw new BadRequestException('Endpoint is required for Entra ID authentication');
      }

      const credential = new DefaultAzureCredential();
      const fullyQualifiedNamespace = connection.endpoint.replace(/^sb:\/\//, '').replace(/\/$/, '');

      producerClient = new EventHubProducerClient(
        fullyQualifiedNamespace,
        eventHubName,
        credential,
      );
      consumerClient = new EventHubConsumerClient(
        consumerGroup,
        fullyQualifiedNamespace,
        eventHubName,
        credential,
      );
    } else {
      throw new BadRequestException(`Unsupported connection type: ${connection.connectionType}`);
    }

    const clients = { producerClient, consumerClient };

    // Cache the clients
    if (!this.eventHubClients.has(connectionKey)) {
      this.eventHubClients.set(connectionKey, new Map());
    }
    this.eventHubClients.get(connectionKey)!.set(eventHubKey, clients);

    return clients;
  }

  async closeServiceBusClients(connectionId: string): Promise<void> {
    const clients = this.serviceBusClients.get(connectionId);
    if (clients) {
      await clients.client.close();
      this.serviceBusClients.delete(connectionId);
    }
  }

  async closeEventHubClients(connectionId: string): Promise<void> {
    const hubClients = this.eventHubClients.get(connectionId);
    if (hubClients) {
      for (const clients of hubClients.values()) {
        await clients.producerClient.close();
        await clients.consumerClient.close();
      }
      this.eventHubClients.delete(connectionId);
    }
  }

  async closeAllClients(connectionId: string): Promise<void> {
    await Promise.all([
      this.closeServiceBusClients(connectionId),
      this.closeEventHubClients(connectionId),
    ]);
  }

  parseConnectionString(connectionString: string): {
    endpoint?: string;
    namespace?: string;
    sharedAccessKeyName?: string;
    sharedAccessKey?: string;
    entityPath?: string;
  } {
    const result: Record<string, string> = {};
    const parts = connectionString.split(';');

    for (const part of parts) {
      const [key, ...valueParts] = part.split('=');
      if (key && valueParts.length > 0) {
        result[key.toLowerCase()] = valueParts.join('=');
      }
    }

    let namespace: string | undefined;
    if (result.endpoint) {
      const match = result.endpoint.match(/sb:\/\/([^.]+)\./);
      if (match) {
        namespace = match[1];
      }
    }

    return {
      endpoint: result.endpoint,
      namespace,
      sharedAccessKeyName: result.sharedaccesskeyname,
      sharedAccessKey: result.sharedaccesskey,
      entityPath: result.entitypath,
    };
  }
}
