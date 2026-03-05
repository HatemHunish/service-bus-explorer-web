import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ConnectionsService } from '../connections/connections.service';
import { AzureClientFactory } from '../connections/azure-client.factory';
import { WS_EVENTS } from '@service-bus-explorer/shared';

interface SubscriptionInfo {
  entityPath: string;
  entityType: 'queue' | 'subscription';
  topicName?: string;
  subscription?: any;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'service-bus',
})
export class ServiceBusGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private clientSubscriptions: Map<string, SubscriptionInfo[]> = new Map();

  constructor(
    private readonly connectionsService: ConnectionsService,
    private readonly azureClientFactory: AzureClientFactory,
  ) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    this.clientSubscriptions.set(client.id, []);
  }

  async handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);

    // Clean up subscriptions
    const subscriptions = this.clientSubscriptions.get(client.id) || [];
    for (const sub of subscriptions) {
      if (sub.subscription) {
        try {
          await sub.subscription.close();
        } catch (err) {
          console.error('Error closing subscription:', err);
        }
      }
    }

    this.clientSubscriptions.delete(client.id);
  }

  @SubscribeMessage(WS_EVENTS.SUBSCRIBE_MESSAGES)
  async handleSubscribeMessages(
    @MessageBody() data: { entityPath: string; entityType: 'queue' | 'subscription'; topicName?: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const connection = this.connectionsService.getActiveConnection();
      if (!connection) {
        client.emit(WS_EVENTS.ERROR, { message: 'No active connection' });
        return;
      }

      const { client: sbClient } = this.azureClientFactory.createServiceBusClients(connection);

      let receiver;
      if (data.entityType === 'queue') {
        receiver = sbClient.createReceiver(data.entityPath, { receiveMode: 'peekLock' });
      } else if (data.topicName) {
        receiver = sbClient.createReceiver(data.topicName, data.entityPath, { receiveMode: 'peekLock' });
      } else {
        client.emit(WS_EVENTS.ERROR, { message: 'Topic name required for subscription' });
        return;
      }

      // Subscribe to messages
      const subscription = receiver.subscribe({
        processMessage: async (message) => {
          client.emit(WS_EVENTS.MESSAGE_RECEIVED, {
            messageId: message.messageId,
            sequenceNumber: Number(message.sequenceNumber),
            enqueuedTime: message.enqueuedTimeUtc,
            body: typeof message.body === 'string' ? message.body : JSON.stringify(message.body),
            subject: message.subject,
            contentType: message.contentType,
            applicationProperties: message.applicationProperties,
          });

          // Complete the message
          await receiver.completeMessage(message);
        },
        processError: async (err) => {
          console.error('Error processing message:', err);
          client.emit(WS_EVENTS.ERROR, { message: err.error?.message || 'Unknown error' });
        },
      });

      // Store subscription info
      const subs = this.clientSubscriptions.get(client.id) || [];
      subs.push({
        entityPath: data.entityPath,
        entityType: data.entityType,
        topicName: data.topicName,
        subscription,
      });
      this.clientSubscriptions.set(client.id, subs);

      client.emit(WS_EVENTS.CONNECTION_STATUS, { status: 'subscribed', entityPath: data.entityPath });
    } catch (err: any) {
      client.emit(WS_EVENTS.ERROR, { message: err.message });
    }
  }

  @SubscribeMessage(WS_EVENTS.UNSUBSCRIBE_MESSAGES)
  async handleUnsubscribeMessages(
    @MessageBody() data: { entityPath: string },
    @ConnectedSocket() client: Socket,
  ) {
    const subscriptions = this.clientSubscriptions.get(client.id) || [];
    const subIndex = subscriptions.findIndex((s) => s.entityPath === data.entityPath);

    if (subIndex >= 0) {
      const sub = subscriptions[subIndex];
      if (sub.subscription) {
        await sub.subscription.close();
      }
      subscriptions.splice(subIndex, 1);
      this.clientSubscriptions.set(client.id, subscriptions);
    }

    client.emit(WS_EVENTS.CONNECTION_STATUS, { status: 'unsubscribed', entityPath: data.entityPath });
  }

  // Emit entity updates to all clients
  emitEntityUpdate(entityPath: string, update: { messageCount?: number; status?: string }) {
    this.server.emit(WS_EVENTS.ENTITY_UPDATE, { entityPath, ...update });
  }
}
