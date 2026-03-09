import { Injectable } from '@nestjs/common';
import { ServiceBusReceivedMessage } from '@azure/service-bus';
import {
  IAutoReplyRule,
  IPropertyCondition,
  IBodyCondition,
  MatchOperator,
} from '@service-bus-explorer/shared';

@Injectable()
export class MatcherService {
  matchesRule(message: ServiceBusReceivedMessage, rule: IAutoReplyRule): boolean {
    const propertyResults = rule.propertyConditions.map((condition) =>
      this.evaluatePropertyCondition(message, condition)
    );
    const bodyResults = rule.bodyConditions.map((condition) =>
      this.evaluateBodyCondition(message, condition)
    );

    const allResults = [...propertyResults, ...bodyResults];

    // If no conditions, don't match (safety measure)
    if (allResults.length === 0) {
      return false;
    }

    if (rule.matchMode === 'all') {
      return allResults.every((result) => result);
    } else {
      return allResults.some((result) => result);
    }
  }

  private evaluatePropertyCondition(
    message: ServiceBusReceivedMessage,
    condition: IPropertyCondition
  ): boolean {
    const value = this.getPropertyValue(message, condition.property);
    return this.evaluateOperator(value, condition.operator, condition.value);
  }

  private evaluateBodyCondition(
    message: ServiceBusReceivedMessage,
    condition: IBodyCondition
  ): boolean {
    const body = this.parseBody(message.body);
    const value = this.getNestedValue(body, condition.jsonPath);
    return this.evaluateOperator(value, condition.operator, condition.value);
  }

  private getPropertyValue(message: ServiceBusReceivedMessage, property: string): unknown {
    // Handle standard message properties
    const standardProps: Record<string, unknown> = {
      messageId: message.messageId,
      correlationId: message.correlationId,
      sessionId: message.sessionId,
      subject: message.subject,
      label: message.subject, // alias
      contentType: message.contentType,
      to: message.to,
      replyTo: message.replyTo,
      replyToSessionId: message.replyToSessionId,
      partitionKey: message.partitionKey,
      enqueuedTime: message.enqueuedTimeUtc?.toISOString(),
      sequenceNumber: message.sequenceNumber?.toString(),
      deliveryCount: message.deliveryCount,
    };

    if (property in standardProps) {
      return standardProps[property];
    }

    // Merge applicationProperties and userProperties (AMQP uses userProperties)
    const allProperties = {
      ...(message.applicationProperties || {}),
      ...((message as any).userProperties || {}),
    };

    // Handle applicationProperties with dot notation (e.g., "applicationProperties.EventName" or just "EventName")
    if (property.startsWith('applicationProperties.')) {
      const propName = property.substring('applicationProperties.'.length);
      return allProperties[propName];
    }

    // Handle userProperties with dot notation
    if (property.startsWith('userProperties.')) {
      const propName = property.substring('userProperties.'.length);
      return allProperties[propName];
    }

    // Try properties directly for short-form access
    if (property in allProperties) {
      return allProperties[property];
    }

    return undefined;
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

      // Handle array indexing (e.g., "items[0]" or "items.0")
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

  private evaluateOperator(
    actualValue: unknown,
    operator: MatchOperator,
    expectedValue?: string | number | boolean
  ): boolean {
    switch (operator) {
      case 'exists':
        return actualValue !== undefined && actualValue !== null;

      case 'equals':
        return this.compareValues(actualValue, expectedValue) === 0;

      case 'notEquals':
        return this.compareValues(actualValue, expectedValue) !== 0;

      case 'contains':
        if (typeof actualValue !== 'string' || typeof expectedValue !== 'string') {
          return false;
        }
        return actualValue.toLowerCase().includes(expectedValue.toLowerCase());

      case 'startsWith':
        if (typeof actualValue !== 'string' || typeof expectedValue !== 'string') {
          return false;
        }
        return actualValue.toLowerCase().startsWith(expectedValue.toLowerCase());

      case 'endsWith':
        if (typeof actualValue !== 'string' || typeof expectedValue !== 'string') {
          return false;
        }
        return actualValue.toLowerCase().endsWith(expectedValue.toLowerCase());

      case 'regex':
        if (typeof expectedValue !== 'string') {
          return false;
        }
        try {
          const regex = new RegExp(expectedValue);
          const strValue = String(actualValue ?? '');
          return regex.test(strValue);
        } catch {
          return false;
        }

      default:
        return false;
    }
  }

  private compareValues(a: unknown, b: unknown): number {
    // Handle null/undefined
    if (a === undefined || a === null) {
      return b === undefined || b === null ? 0 : -1;
    }
    if (b === undefined || b === null) {
      return 1;
    }

    // Convert to comparable types
    const aStr = String(a);
    const bStr = String(b);

    // Try numeric comparison first
    const aNum = Number(a);
    const bNum = Number(b);
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return aNum - bNum;
    }

    // Case-insensitive string comparison
    return aStr.toLowerCase().localeCompare(bStr.toLowerCase());
  }
}
