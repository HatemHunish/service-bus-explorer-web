import { Injectable, BadRequestException } from '@nestjs/common';
import { ServiceBusReceivedMessage, ServiceBusMessage } from '@azure/service-bus';
import { ConnectionsService } from '../../connections/connections.service';
import { AzureClientFactory } from '../../connections/azure-client.factory';
import {
  ISendMessage,
  IReceivedMessage,
  MessageBodyType,
  PurgeResult,
} from '@service-bus-explorer/shared';

@Injectable()
export class MessagesService {
  constructor(
    private readonly connectionsService: ConnectionsService,
    private readonly azureClientFactory: AzureClientFactory,
  ) {}

  private getClient() {
    const connection = this.connectionsService.getActiveConnectionOrThrow();
    return this.azureClientFactory.createServiceBusClients(connection).client;
  }

  async sendToQueue(queueName: string, message: ISendMessage): Promise<void> {
    const client = this.getClient();
    const sender = client.createSender(queueName);

    try {
      const sbMessage = this.createServiceBusMessage(message);
      await sender.sendMessages(sbMessage);
    } finally {
      await sender.close();
    }
  }

  async sendBatchToQueue(queueName: string, messages: ISendMessage[]): Promise<void> {
    const client = this.getClient();
    const sender = client.createSender(queueName);

    try {
      const batch = await sender.createMessageBatch();

      for (const msg of messages) {
        const sbMessage = this.createServiceBusMessage(msg);
        if (!batch.tryAddMessage(sbMessage)) {
          // Send current batch and create new one
          await sender.sendMessages(batch);
          const newBatch = await sender.createMessageBatch();
          if (!newBatch.tryAddMessage(sbMessage)) {
            throw new BadRequestException('Message too large to fit in a batch');
          }
        }
      }

      // Send remaining messages
      if (batch.count > 0) {
        await sender.sendMessages(batch);
      }
    } finally {
      await sender.close();
    }
  }

  async sendToTopic(topicName: string, message: ISendMessage): Promise<void> {
    const client = this.getClient();
    const sender = client.createSender(topicName);

    try {
      const sbMessage = this.createServiceBusMessage(message);
      await sender.sendMessages(sbMessage);
    } finally {
      await sender.close();
    }
  }

  async sendBatchToTopic(topicName: string, messages: ISendMessage[]): Promise<void> {
    const client = this.getClient();
    const sender = client.createSender(topicName);

    try {
      const batch = await sender.createMessageBatch();

      for (const msg of messages) {
        const sbMessage = this.createServiceBusMessage(msg);
        if (!batch.tryAddMessage(sbMessage)) {
          await sender.sendMessages(batch);
          const newBatch = await sender.createMessageBatch();
          if (!newBatch.tryAddMessage(sbMessage)) {
            throw new BadRequestException('Message too large to fit in a batch');
          }
        }
      }

      if (batch.count > 0) {
        await sender.sendMessages(batch);
      }
    } finally {
      await sender.close();
    }
  }

  async peekQueueMessages(queueName: string, maxCount = 10, fromSequenceNumber?: number): Promise<IReceivedMessage[]> {
    const client = this.getClient();
    const receiver = client.createReceiver(queueName, { receiveMode: 'peekLock' });

    try {
      const messages = fromSequenceNumber
        ? await receiver.peekMessages(maxCount, { fromSequenceNumber: BigInt(fromSequenceNumber) as any })
        : await receiver.peekMessages(maxCount);
      console.log('Peeked messages:', messages);
      return messages.map(this.mapReceivedMessage);
    } finally {
      await receiver.close();
    }
  }

  async peekSubscriptionMessages(
    topicName: string,
    subscriptionName: string,
    maxCount = 10,
    fromSequenceNumber?: number,
  ): Promise<IReceivedMessage[]> {
    const client = this.getClient();
    const receiver = client.createReceiver(topicName, subscriptionName, { receiveMode: 'peekLock' });

    try {
      const messages = fromSequenceNumber
        ? await receiver.peekMessages(maxCount, { fromSequenceNumber: BigInt(fromSequenceNumber) as any })
        : await receiver.peekMessages(maxCount);

      return messages.map(this.mapReceivedMessage);
    } finally {
      await receiver.close();
    }
  }

  async receiveQueueMessages(
    queueName: string,
    maxCount = 10,
    maxWaitTimeInMs = 5000,
    receiveMode: 'peekLock' | 'receiveAndDelete' = 'receiveAndDelete',
  ): Promise<IReceivedMessage[]> {
    const client = this.getClient();
    const receiver = client.createReceiver(queueName, { receiveMode });

    try {
      const messages = await receiver.receiveMessages(maxCount, { maxWaitTimeInMs });

      if (receiveMode === 'peekLock') {
        // Complete messages after receiving
        for (const msg of messages) {
          await receiver.completeMessage(msg);
        }
      }

      return messages.map(this.mapReceivedMessage);
    } finally {
      await receiver.close();
    }
  }

  async receiveSubscriptionMessages(
    topicName: string,
    subscriptionName: string,
    maxCount = 10,
    maxWaitTimeInMs = 5000,
    receiveMode: 'peekLock' | 'receiveAndDelete' = 'receiveAndDelete',
  ): Promise<IReceivedMessage[]> {
    const client = this.getClient();
    const receiver = client.createReceiver(topicName, subscriptionName, { receiveMode });

    try {
      const messages = await receiver.receiveMessages(maxCount, { maxWaitTimeInMs });

      if (receiveMode === 'peekLock') {
        for (const msg of messages) {
          await receiver.completeMessage(msg);
        }
      }

      return messages.map(this.mapReceivedMessage);
    } finally {
      await receiver.close();
    }
  }

  async peekDeadLetterQueue(queueName: string, maxCount = 10): Promise<IReceivedMessage[]> {
    const client = this.getClient();
    const receiver = client.createReceiver(queueName, {
      receiveMode: 'peekLock',
      subQueueType: 'deadLetter',
    });

    try {
      const messages = await receiver.peekMessages(maxCount);
      return messages.map(this.mapReceivedMessage);
    } finally {
      await receiver.close();
    }
  }

  async peekSubscriptionDeadLetterQueue(
    topicName: string,
    subscriptionName: string,
    maxCount = 10,
  ): Promise<IReceivedMessage[]> {
    const client = this.getClient();
    const receiver = client.createReceiver(topicName, subscriptionName, {
      receiveMode: 'peekLock',
      subQueueType: 'deadLetter',
    });

    try {
      const messages = await receiver.peekMessages(maxCount);
      return messages.map(this.mapReceivedMessage);
    } finally {
      await receiver.close();
    }
  }

  async resubmitFromDeadLetter(
    queueName: string,
    messageSequenceNumbers: number[],
    targetQueue?: string,
  ): Promise<number> {
    const client = this.getClient();
    const dlqReceiver = client.createReceiver(queueName, {
      receiveMode: 'peekLock',
      subQueueType: 'deadLetter',
    });

    const target = targetQueue || queueName;
    const sender = client.createSender(target);

    let resubmittedCount = 0;

    try {
      // Receive messages from DLQ
      const messages = await dlqReceiver.receiveMessages(messageSequenceNumbers.length * 2, {
        maxWaitTimeInMs: 10000,
      });

      for (const msg of messages) {
        const seqNum = Number(msg.sequenceNumber);
        if (messageSequenceNumbers.includes(seqNum)) {
          // Create new message with same content
          const newMessage: ServiceBusMessage = {
            body: msg.body,
            messageId: msg.messageId,
            sessionId: msg.sessionId,
            correlationId: msg.correlationId,
            contentType: msg.contentType,
            subject: msg.subject,
            partitionKey: msg.partitionKey,
            replyTo: msg.replyTo,
            replyToSessionId: msg.replyToSessionId,
            applicationProperties: msg.applicationProperties,
          };

          await sender.sendMessages(newMessage);
          await dlqReceiver.completeMessage(msg);
          resubmittedCount++;
        }
      }

      return resubmittedCount;
    } finally {
      await dlqReceiver.close();
      await sender.close();
    }
  }

  async purgeQueue(queueName: string, includeDeadLetter = false): Promise<PurgeResult> {
    const client = this.getClient();
    let purgedCount = 0;

    // Purge main queue
    const receiver = client.createReceiver(queueName, { receiveMode: 'receiveAndDelete' });
    try {
      let batch: ServiceBusReceivedMessage[];
      do {
        batch = await receiver.receiveMessages(100, { maxWaitTimeInMs: 1000 });
        purgedCount += batch.length;
      } while (batch.length > 0);
    } finally {
      await receiver.close();
    }

    // Purge dead-letter queue if requested
    if (includeDeadLetter) {
      const dlqReceiver = client.createReceiver(queueName, {
        receiveMode: 'receiveAndDelete',
        subQueueType: 'deadLetter',
      });
      try {
        let batch: ServiceBusReceivedMessage[];
        do {
          batch = await dlqReceiver.receiveMessages(100, { maxWaitTimeInMs: 1000 });
          purgedCount += batch.length;
        } while (batch.length > 0);
      } finally {
        await dlqReceiver.close();
      }
    }

    return { purgedCount };
  }

  async purgeSubscription(
    topicName: string,
    subscriptionName: string,
    includeDeadLetter = false,
  ): Promise<PurgeResult> {
    const client = this.getClient();
    let purgedCount = 0;

    // Purge main subscription
    const receiver = client.createReceiver(topicName, subscriptionName, {
      receiveMode: 'receiveAndDelete',
    });
    try {
      let batch: ServiceBusReceivedMessage[];
      do {
        batch = await receiver.receiveMessages(100, { maxWaitTimeInMs: 1000 });
        purgedCount += batch.length;
      } while (batch.length > 0);
    } finally {
      await receiver.close();
    }

    // Purge dead-letter queue if requested
    if (includeDeadLetter) {
      const dlqReceiver = client.createReceiver(topicName, subscriptionName, {
        receiveMode: 'receiveAndDelete',
        subQueueType: 'deadLetter',
      });
      try {
        let batch: ServiceBusReceivedMessage[];
        do {
          batch = await dlqReceiver.receiveMessages(100, { maxWaitTimeInMs: 1000 });
          purgedCount += batch.length;
        } while (batch.length > 0);
      } finally {
        await dlqReceiver.close();
      }
    }

    return { purgedCount };
  }

  private createServiceBusMessage(message: ISendMessage): ServiceBusMessage {
    let body: unknown;

    if (message.bodyType === 'json') {
      try {
        body = JSON.parse(message.body);
      } catch {
        body = message.body;
      }
    } else {
      body = message.body;
    }

    const applicationProperties: Record<string, unknown> = {};
    if (message.applicationProperties) {
      for (const prop of message.applicationProperties) {
        applicationProperties[prop.key] = prop.value;
      }
    }

    return {
      body,
      messageId: message.messageId,
      sessionId: message.sessionId,
      correlationId: message.correlationId,
      contentType: message.contentType,
      subject: message.subject,
      partitionKey: message.partitionKey,
      to: message.to,
      replyTo: message.replyTo,
      replyToSessionId: message.replyToSessionId,
      timeToLive: message.timeToLive ? this.parseDuration(message.timeToLive) : undefined,
      scheduledEnqueueTimeUtc: message.scheduledEnqueueTime,
      applicationProperties: Object.keys(applicationProperties).length > 0 ? applicationProperties as any : undefined,
    };
  }

  private mapReceivedMessage = (msg: ServiceBusReceivedMessage): IReceivedMessage => {
    let bodyStr: string;
    let bodyType: MessageBodyType = 'text';

    if (typeof msg.body === 'string') {
      bodyStr = msg.body;
      bodyType = 'text';

      // Try to detect JSON
      try {
        JSON.parse(bodyStr);
        bodyType = 'json';
      } catch {
        // Check if it looks like XML
        if (bodyStr.trim().startsWith('<')) {
          bodyType = 'xml';
        }
      }
    } else if (Buffer.isBuffer(msg.body)) {
      bodyStr = msg.body.toString('base64');
      bodyType = 'binary';
    } else {
      bodyStr = JSON.stringify(msg.body, null, 2);
      bodyType = 'json';
    }

    return {
      messageId: msg.messageId as string,
      sequenceNumber: Number(msg.sequenceNumber),
      enqueuedTime: msg.enqueuedTimeUtc!,
      expiresAt: msg.expiresAtUtc,
      lockedUntil: msg.lockedUntilUtc,
      lockToken: msg.lockToken,
      deliveryCount: msg.deliveryCount || 0,
      sessionId: msg.sessionId,
      correlationId: msg.correlationId as string | undefined,
      contentType: msg.contentType,
      subject: msg.subject,
      partitionKey: msg.partitionKey,
      to: msg.to,
      replyTo: msg.replyTo,
      replyToSessionId: msg.replyToSessionId,
      timeToLive: msg.timeToLive ? `PT${msg.timeToLive}S` : undefined,
      state: msg.state as 'active' | 'deferred' | 'scheduled',
      deadLetterSource: msg.deadLetterSource,
      deadLetterReason: msg.deadLetterReason,
      deadLetterErrorDescription: msg.deadLetterErrorDescription,
      body: bodyStr,
      bodyType,
      applicationProperties: msg.applicationProperties as Record<string, unknown> || {},
    };
  };

  private parseDuration(duration: string): number {
    // Parse ISO 8601 duration to milliseconds
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);

    return (hours * 3600 + minutes * 60 + seconds) * 1000;
  }
}
