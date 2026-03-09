import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private db: Database.Database;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const dbPath = this.configService.get<string>('DATABASE_PATH') || './data/connections.sqlite';
    const dbDir = path.dirname(dbPath);

    // Ensure directory exists
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');

    this.initSchema();
  }

  onModuleDestroy() {
    if (this.db) {
      this.db.close();
    }
  }

  private initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS connections (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT DEFAULT 'serviceBus',
        connection_type TEXT NOT NULL CHECK (connection_type IN ('sas', 'entraId')),
        connection_string TEXT,
        endpoint TEXT,
        namespace TEXT,
        shared_access_key_name TEXT,
        shared_access_key TEXT,
        transport_type TEXT DEFAULT 'amqp',
        tenant_id TEXT,
        client_id TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        last_connected_at TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_connections_name ON connections(name);

      CREATE TABLE IF NOT EXISTS auto_reply_rules (
        id TEXT PRIMARY KEY,
        connection_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        enabled INTEGER DEFAULT 0,
        source_entity_type TEXT NOT NULL CHECK (source_entity_type IN ('queue', 'subscription')),
        source_queue_name TEXT,
        source_topic_name TEXT,
        source_subscription_name TEXT,
        property_conditions TEXT,
        body_conditions TEXT,
        match_mode TEXT DEFAULT 'all' CHECK (match_mode IN ('all', 'any')),
        reply_target_type TEXT DEFAULT 'same' CHECK (reply_target_type IN ('same', 'queue', 'topic')),
        reply_queue_name TEXT,
        reply_topic_name TEXT,
        reply_subscription_name TEXT,
        reply_delay_ms INTEGER DEFAULT 0,
        reply_template TEXT NOT NULL,
        reply_content_type TEXT DEFAULT 'application/json',
        reply_properties_template TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        last_triggered_at TEXT,
        trigger_count INTEGER DEFAULT 0,
        FOREIGN KEY (connection_id) REFERENCES connections(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_auto_reply_rules_connection ON auto_reply_rules(connection_id);
      CREATE INDEX IF NOT EXISTS idx_auto_reply_rules_enabled ON auto_reply_rules(enabled);

      CREATE TABLE IF NOT EXISTS auto_reply_activity_log (
        id TEXT PRIMARY KEY,
        rule_id TEXT NOT NULL,
        rule_name TEXT NOT NULL,
        original_message_id TEXT,
        original_sequence_number INTEGER,
        original_body TEXT,
        reply_message_id TEXT,
        reply_body TEXT,
        reply_target TEXT,
        status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'skipped')),
        error_message TEXT,
        received_at TEXT NOT NULL,
        replied_at TEXT,
        processing_time_ms INTEGER,
        FOREIGN KEY (rule_id) REFERENCES auto_reply_rules(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_auto_reply_activity_rule ON auto_reply_activity_log(rule_id);
      CREATE INDEX IF NOT EXISTS idx_auto_reply_activity_received ON auto_reply_activity_log(received_at);
    `);

    // Migration: add type column if it doesn't exist
    try {
      this.db.exec(`ALTER TABLE connections ADD COLUMN type TEXT DEFAULT 'serviceBus'`);
    } catch {
      // Column already exists, ignore
    }

    // Migration: add reply_count column to auto_reply_rules if it doesn't exist
    try {
      this.db.exec(`ALTER TABLE auto_reply_rules ADD COLUMN reply_count INTEGER DEFAULT 1`);
    } catch {
      // Column already exists, ignore
    }

    // Migration: add reply_subscription_name column to auto_reply_rules if it doesn't exist
    try {
      this.db.exec(`ALTER TABLE auto_reply_rules ADD COLUMN reply_subscription_name TEXT`);
    } catch {
      // Column already exists, ignore
    }
  }

  getDatabase(): Database.Database {
    return this.db;
  }

  // Generic query methods
  run(sql: string, params: unknown[] = []) {
    return this.db.prepare(sql).run(...params);
  }

  get<T>(sql: string, params: unknown[] = []): T | undefined {
    return this.db.prepare(sql).get(...params) as T | undefined;
  }

  all<T>(sql: string, params: unknown[] = []): T[] {
    return this.db.prepare(sql).all(...params) as T[];
  }
}
