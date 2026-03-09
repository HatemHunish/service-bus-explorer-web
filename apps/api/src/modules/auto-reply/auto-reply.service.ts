import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../connections/database.service';
import {
  IAutoReplyRule,
  ICreateAutoReplyRule,
  IUpdateAutoReplyRule,
  IAutoReplyActivityLog,
  IPropertyCondition,
  IBodyCondition,
} from '@service-bus-explorer/shared';
import { v4 as uuid } from 'uuid';

interface DbAutoReplyRule {
  id: string;
  connection_id: string;
  name: string;
  description: string | null;
  enabled: number;
  source_entity_type: 'queue' | 'subscription';
  source_queue_name: string | null;
  source_topic_name: string | null;
  source_subscription_name: string | null;
  property_conditions: string | null;
  body_conditions: string | null;
  match_mode: 'all' | 'any';
  reply_target_type: 'same' | 'queue' | 'topic';
  reply_queue_name: string | null;
  reply_topic_name: string | null;
  reply_subscription_name: string | null;
  reply_delay_ms: number;
  reply_count: number;
  reply_template: string;
  reply_content_type: string;
  reply_properties_template: string | null;
  created_at: string;
  updated_at: string;
  last_triggered_at: string | null;
  trigger_count: number;
}

interface DbActivityLog {
  id: string;
  rule_id: string;
  rule_name: string;
  original_message_id: string | null;
  original_sequence_number: number | null;
  original_body: string | null;
  reply_message_id: string | null;
  reply_body: string | null;
  reply_target: string | null;
  status: 'success' | 'failed' | 'skipped';
  error_message: string | null;
  received_at: string;
  replied_at: string | null;
  processing_time_ms: number | null;
}

@Injectable()
export class AutoReplyService {
  constructor(private readonly databaseService: DatabaseService) {}

  findAll(connectionId?: string): IAutoReplyRule[] {
    const sql = connectionId
      ? 'SELECT * FROM auto_reply_rules WHERE connection_id = ? ORDER BY created_at DESC'
      : 'SELECT * FROM auto_reply_rules ORDER BY created_at DESC';
    const params = connectionId ? [connectionId] : [];
    const rows = this.databaseService.all<DbAutoReplyRule>(sql, params);
    return rows.map(this.mapToRule);
  }

  findById(id: string): IAutoReplyRule | null {
    const row = this.databaseService.get<DbAutoReplyRule>(
      'SELECT * FROM auto_reply_rules WHERE id = ?',
      [id]
    );
    return row ? this.mapToRule(row) : null;
  }

  findEnabled(connectionId?: string): IAutoReplyRule[] {
    const sql = connectionId
      ? 'SELECT * FROM auto_reply_rules WHERE enabled = 1 AND connection_id = ?'
      : 'SELECT * FROM auto_reply_rules WHERE enabled = 1';
    const params = connectionId ? [connectionId] : [];
    const rows = this.databaseService.all<DbAutoReplyRule>(sql, params);
    return rows.map(this.mapToRule);
  }

  create(data: ICreateAutoReplyRule): IAutoReplyRule {
    const id = uuid();
    const now = new Date().toISOString();

    this.databaseService.run(
      `INSERT INTO auto_reply_rules (
        id, connection_id, name, description, enabled,
        source_entity_type, source_queue_name, source_topic_name, source_subscription_name,
        property_conditions, body_conditions, match_mode,
        reply_target_type, reply_queue_name, reply_topic_name, reply_subscription_name,
        reply_delay_ms, reply_count, reply_template, reply_content_type, reply_properties_template,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.connectionId,
        data.name,
        data.description || null,
        data.enabled ? 1 : 0,
        data.source.entityType,
        data.source.queueName || null,
        data.source.topicName || null,
        data.source.subscriptionName || null,
        JSON.stringify(data.propertyConditions || []),
        JSON.stringify(data.bodyConditions || []),
        data.matchMode || 'all',
        data.reply.target.targetType,
        data.reply.target.queueName || null,
        data.reply.target.topicName || null,
        data.reply.target.subscriptionName || null,
        data.reply.delayMs || 0,
        data.reply.replyCount ?? 1,
        data.reply.template,
        data.reply.contentType || 'application/json',
        data.reply.propertiesTemplate ? JSON.stringify(data.reply.propertiesTemplate) : null,
        now,
        now,
      ]
    );

    return this.findById(id)!;
  }

  update(id: string, data: IUpdateAutoReplyRule): IAutoReplyRule | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const params: unknown[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      params.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      params.push(data.description || null);
    }
    if (data.enabled !== undefined) {
      updates.push('enabled = ?');
      params.push(data.enabled ? 1 : 0);
    }
    if (data.source !== undefined) {
      updates.push('source_entity_type = ?');
      params.push(data.source.entityType);
      updates.push('source_queue_name = ?');
      params.push(data.source.queueName || null);
      updates.push('source_topic_name = ?');
      params.push(data.source.topicName || null);
      updates.push('source_subscription_name = ?');
      params.push(data.source.subscriptionName || null);
    }
    if (data.propertyConditions !== undefined) {
      updates.push('property_conditions = ?');
      params.push(JSON.stringify(data.propertyConditions));
    }
    if (data.bodyConditions !== undefined) {
      updates.push('body_conditions = ?');
      params.push(JSON.stringify(data.bodyConditions));
    }
    if (data.matchMode !== undefined) {
      updates.push('match_mode = ?');
      params.push(data.matchMode);
    }
    if (data.reply !== undefined) {
      if (data.reply.target !== undefined) {
        updates.push('reply_target_type = ?');
        params.push(data.reply.target.targetType);
        updates.push('reply_queue_name = ?');
        params.push(data.reply.target.queueName || null);
        updates.push('reply_topic_name = ?');
        params.push(data.reply.target.topicName || null);
        updates.push('reply_subscription_name = ?');
        params.push(data.reply.target.subscriptionName || null);
      }
      if (data.reply.delayMs !== undefined) {
        updates.push('reply_delay_ms = ?');
        params.push(data.reply.delayMs);
      }
      if (data.reply.replyCount !== undefined) {
        updates.push('reply_count = ?');
        params.push(data.reply.replyCount);
      }
      if (data.reply.template !== undefined) {
        updates.push('reply_template = ?');
        params.push(data.reply.template);
      }
      if (data.reply.contentType !== undefined) {
        updates.push('reply_content_type = ?');
        params.push(data.reply.contentType);
      }
      if (data.reply.propertiesTemplate !== undefined) {
        updates.push('reply_properties_template = ?');
        params.push(data.reply.propertiesTemplate ? JSON.stringify(data.reply.propertiesTemplate) : null);
      }
    }

    if (updates.length === 0) return existing;

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    this.databaseService.run(
      `UPDATE auto_reply_rules SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    return this.findById(id);
  }

  delete(id: string): boolean {
    const result = this.databaseService.run('DELETE FROM auto_reply_rules WHERE id = ?', [id]);
    return result.changes > 0;
  }

  enable(id: string): IAutoReplyRule | null {
    return this.update(id, { enabled: true });
  }

  disable(id: string): IAutoReplyRule | null {
    return this.update(id, { enabled: false });
  }

  incrementTriggerCount(id: string): void {
    this.databaseService.run(
      `UPDATE auto_reply_rules SET trigger_count = trigger_count + 1, last_triggered_at = ? WHERE id = ?`,
      [new Date().toISOString(), id]
    );
  }

  // Activity Log Methods
  logActivity(log: Omit<IAutoReplyActivityLog, 'id'>): IAutoReplyActivityLog {
    const id = uuid();
    this.databaseService.run(
      `INSERT INTO auto_reply_activity_log (
        id, rule_id, rule_name, original_message_id, original_sequence_number, original_body,
        reply_message_id, reply_body, reply_target, status, error_message,
        received_at, replied_at, processing_time_ms
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        log.ruleId,
        log.ruleName,
        log.originalMessageId || null,
        log.originalSequenceNumber || null,
        log.originalBody || null,
        log.replyMessageId || null,
        log.replyBody || null,
        log.replyTarget || null,
        log.status,
        log.errorMessage || null,
        log.receivedAt instanceof Date ? log.receivedAt.toISOString() : log.receivedAt,
        log.repliedAt instanceof Date ? log.repliedAt.toISOString() : log.repliedAt || null,
        log.processingTimeMs || null,
      ]
    );

    return { id, ...log };
  }

  findActivityById(id: string): IAutoReplyActivityLog | null {
    const row = this.databaseService.get<DbActivityLog>(
      'SELECT * FROM auto_reply_activity_log WHERE id = ?',
      [id]
    );
    return row ? this.mapToActivityLog(row) : null;
  }

  getActivityLog(ruleId: string, limit = 100, offset = 0): IAutoReplyActivityLog[] {
    const rows = this.databaseService.all<DbActivityLog>(
      `SELECT * FROM auto_reply_activity_log WHERE rule_id = ? ORDER BY received_at DESC LIMIT ? OFFSET ?`,
      [ruleId, limit, offset]
    );
    return rows.map(this.mapToActivityLog);
  }

  getRecentActivity(limit = 50): IAutoReplyActivityLog[] {
    const rows = this.databaseService.all<DbActivityLog>(
      `SELECT * FROM auto_reply_activity_log ORDER BY received_at DESC LIMIT ?`,
      [limit]
    );
    return rows.map(this.mapToActivityLog);
  }

  clearActivityLog(ruleId: string): number {
    const result = this.databaseService.run(
      'DELETE FROM auto_reply_activity_log WHERE rule_id = ?',
      [ruleId]
    );
    return result.changes;
  }

  private mapToRule = (row: DbAutoReplyRule): IAutoReplyRule => ({
    id: row.id,
    connectionId: row.connection_id,
    name: row.name,
    description: row.description || undefined,
    enabled: row.enabled === 1,
    source: {
      entityType: row.source_entity_type,
      queueName: row.source_queue_name || undefined,
      topicName: row.source_topic_name || undefined,
      subscriptionName: row.source_subscription_name || undefined,
    },
    propertyConditions: row.property_conditions
      ? (JSON.parse(row.property_conditions) as IPropertyCondition[])
      : [],
    bodyConditions: row.body_conditions
      ? (JSON.parse(row.body_conditions) as IBodyCondition[])
      : [],
    matchMode: row.match_mode,
    reply: {
      target: {
        targetType: row.reply_target_type,
        queueName: row.reply_queue_name || undefined,
        topicName: row.reply_topic_name || undefined,
        subscriptionName: row.reply_subscription_name || undefined,
      },
      delayMs: row.reply_delay_ms,
      replyCount: row.reply_count ?? 1,
      template: row.reply_template,
      contentType: row.reply_content_type,
      propertiesTemplate: row.reply_properties_template
        ? JSON.parse(row.reply_properties_template)
        : undefined,
    },
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    lastTriggeredAt: row.last_triggered_at ? new Date(row.last_triggered_at) : undefined,
    triggerCount: row.trigger_count,
  });

  private mapToActivityLog = (row: DbActivityLog): IAutoReplyActivityLog => ({
    id: row.id,
    ruleId: row.rule_id,
    ruleName: row.rule_name,
    originalMessageId: row.original_message_id || undefined,
    originalSequenceNumber: row.original_sequence_number || undefined,
    originalBody: row.original_body || undefined,
    replyMessageId: row.reply_message_id || undefined,
    replyBody: row.reply_body || undefined,
    replyTarget: row.reply_target || undefined,
    status: row.status,
    errorMessage: row.error_message || undefined,
    receivedAt: new Date(row.received_at),
    repliedAt: row.replied_at ? new Date(row.replied_at) : undefined,
    processingTimeMs: row.processing_time_ms || undefined,
  });
}
