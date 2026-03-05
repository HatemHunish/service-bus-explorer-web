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
    `);

    // Migration: add type column if it doesn't exist
    try {
      this.db.exec(`ALTER TABLE connections ADD COLUMN type TEXT DEFAULT 'serviceBus'`);
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
