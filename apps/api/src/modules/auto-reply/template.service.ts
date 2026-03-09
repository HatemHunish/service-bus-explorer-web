import { Injectable } from '@nestjs/common';
import { ServiceBusReceivedMessage } from '@azure/service-bus';
import { IAvailableVariables, ITemplateTestResponse } from '@service-bus-explorer/shared';
import { v4 as uuid } from 'uuid';

@Injectable()
export class TemplateService {
  private readonly variablePattern = /\{\{([^}]+)\}\}/g;

  processTemplate(template: string, message: ServiceBusReceivedMessage): string {
    return template.replace(this.variablePattern, (match, variable) => {
      const value = this.resolveVariable(variable.trim(), message);
      if (value === undefined || value === null) {
        return match; // Keep original placeholder if not found
      }
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
      return String(value);
    });
  }

  processPropertiesTemplate(
    template: Record<string, string>,
    message: ServiceBusReceivedMessage
  ): Record<string, string | number | boolean | Date> {
    const result: Record<string, string | number | boolean | Date> = {};
    for (const [key, valueTemplate] of Object.entries(template)) {
      const processed = this.processTemplate(valueTemplate, message);
      // Try to parse as JSON if it looks like a JSON value
      try {
        result[key] = this.normalizeApplicationProperty(JSON.parse(processed));
      } catch {
        result[key] = this.normalizeApplicationProperty(processed);
      }
    }
    return result;
  }

  private normalizeApplicationProperty(value: unknown): string | number | boolean | Date {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }

    if (value instanceof Date) {
      return value;
    }

    // Service Bus application properties don't support objects/arrays/null directly.
    // Preserve data by serializing unsupported values.
    return JSON.stringify(value);
  }

  testTemplate(
    template: string,
    sampleMessage: {
      messageId?: string;
      correlationId?: string;
      subject?: string;
      contentType?: string;
      applicationProperties?: Record<string, unknown>;
      body: unknown;
    }
  ): ITemplateTestResponse {
    const errors: string[] = [];
    const variables: string[] = [];

    // Extract all variables from template
    const matches = template.matchAll(this.variablePattern);
    for (const match of matches) {
      variables.push(match[1].trim());
    }

    // Create a mock message object for testing
    const mockMessage = {
      messageId: sampleMessage.messageId || 'test-message-id',
      correlationId: sampleMessage.correlationId,
      subject: sampleMessage.subject,
      contentType: sampleMessage.contentType,
      applicationProperties: sampleMessage.applicationProperties || {},
      body: sampleMessage.body,
      enqueuedTimeUtc: new Date(),
      sequenceNumber: BigInt(1),
      deliveryCount: 0,
    } as unknown as ServiceBusReceivedMessage;

    let result: string;
    try {
      result = this.processTemplate(template, mockMessage);
    } catch (err) {
      errors.push(`Template processing error: ${(err as Error).message}`);
      result = template;
    }

    // Check for unresolved variables
    const unresolvedMatches = result.matchAll(this.variablePattern);
    for (const match of unresolvedMatches) {
      errors.push(`Variable not found: ${match[1].trim()}`);
    }

    return { result, variables, errors: errors.length > 0 ? errors : undefined };
  }

  getAvailableVariables(message?: ServiceBusReceivedMessage): IAvailableVariables {
    const systemVariables = [
      'messageId',
      'correlationId',
      'sessionId',
      'subject',
      'label',
      'contentType',
      'to',
      'replyTo',
      'replyToSessionId',
      'partitionKey',
      'enqueuedTime',
      'sequenceNumber',
      'deliveryCount',
      '$uuid',
      '$timestamp',
      '$isoTimestamp',
    ];

    const propertyVariables: string[] = [];
    // Merge applicationProperties and userProperties
    const allProperties = {
      ...(message?.applicationProperties || {}),
      ...((message as any)?.userProperties || {}),
    };
    for (const key of Object.keys(allProperties)) {
      propertyVariables.push(`properties.${key}`);
    }

    const bodyVariables: string[] = [];
    if (message) {
      const body = this.parseBody(message.body);
      if (typeof body === 'object' && body !== null) {
        this.extractBodyPaths(body, 'body', bodyVariables, 3); // Max depth of 3
      }
    }

    return { systemVariables, propertyVariables, bodyVariables };
  }

  generateReplyMessageId(): string {
    return `reply-${uuid()}`;
  }

  private resolveVariable(variable: string, message: ServiceBusReceivedMessage): unknown {
    // Handle special variables
    if (variable === '$uuid') {
      return uuid();
    }
    if (variable === '$timestamp') {
      return Date.now();
    }
    if (variable === '$isoTimestamp') {
      return new Date().toISOString();
    }

    // Handle message properties
    const body = this.parseBody(message.body);

    if (variable.startsWith('body.')) {
      const path = variable.substring(5);
      return this.getNestedValue(body, path);
    }

    // Merge applicationProperties and userProperties (AMQP uses userProperties)
    const allProperties = {
      ...(message.applicationProperties || {}),
      ...((message as any).userProperties || {}),
    };

    if (variable.startsWith('properties.') || variable.startsWith('applicationProperties.') || variable.startsWith('userProperties.')) {
      let path: string;
      if (variable.startsWith('properties.')) {
        path = variable.substring(11);
      } else if (variable.startsWith('applicationProperties.')) {
        path = variable.substring(22);
      } else {
        path = variable.substring(15); // 'userProperties.'.length
      }
      return allProperties[path];
    }

    // Standard message properties
    const propMap: Record<string, unknown> = {
      messageId: message.messageId,
      correlationId: message.correlationId,
      sessionId: message.sessionId,
      subject: message.subject,
      label: message.subject,
      contentType: message.contentType,
      to: message.to,
      replyTo: message.replyTo,
      replyToSessionId: message.replyToSessionId,
      partitionKey: message.partitionKey,
      enqueuedTime: message.enqueuedTimeUtc?.toISOString(),
      sequenceNumber: message.sequenceNumber?.toString(),
      deliveryCount: message.deliveryCount,
    };

    if (variable in propMap) {
      return propMap[variable];
    }

    // Try direct body access if not prefixed
    return this.getNestedValue(body, variable);
  }

  private parseBody(body: unknown): unknown {
    if (typeof body === 'string') {
      try {
        return JSON.parse(body);
      } catch {
        return body;
      }
    }
    if (Buffer.isBuffer(body)) {
      try {
        return JSON.parse(body.toString('utf-8'));
      } catch {
        return body.toString('utf-8');
      }
    }
    return body;
  }

  private getNestedValue(obj: unknown, path: string): unknown {
    if (obj === null || obj === undefined) {
      return undefined;
    }

    const parts = path.split('.');
    let current: unknown = obj;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }

      // Handle array indexing
      const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
      if (arrayMatch) {
        const [, key, index] = arrayMatch;
        current = (current as Record<string, unknown>)?.[key];
        if (Array.isArray(current)) {
          current = current[parseInt(index, 10)];
        } else {
          return undefined;
        }
      } else {
        current = (current as Record<string, unknown>)?.[part];
      }
    }

    return current;
  }

  private extractBodyPaths(
    obj: unknown,
    prefix: string,
    paths: string[],
    maxDepth: number
  ): void {
    if (maxDepth <= 0 || obj === null || obj === undefined) {
      return;
    }

    if (typeof obj !== 'object') {
      return;
    }

    if (Array.isArray(obj)) {
      if (obj.length > 0) {
        paths.push(`${prefix}[0]`);
        this.extractBodyPaths(obj[0], `${prefix}[0]`, paths, maxDepth - 1);
      }
      return;
    }

    for (const key of Object.keys(obj)) {
      const fullPath = `${prefix}.${key}`;
      paths.push(fullPath);
      this.extractBodyPaths((obj as Record<string, unknown>)[key], fullPath, paths, maxDepth - 1);
    }
  }
}
