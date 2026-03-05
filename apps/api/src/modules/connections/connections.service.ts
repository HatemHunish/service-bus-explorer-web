import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from './database.service';
import { AzureClientFactory } from './azure-client.factory';
import {
  IConnection,
  CreateConnectionDto,
  UpdateConnectionDto,
  ConnectionTestResult,
} from '@service-bus-explorer/shared';

interface ConnectionRow {
  id: string;
  name: string;
  type: string | null;
  connection_type: string;
  connection_string: string | null;
  endpoint: string | null;
  namespace: string | null;
  shared_access_key_name: string | null;
  shared_access_key: string | null;
  transport_type: string;
  tenant_id: string | null;
  client_id: string | null;
  created_at: string;
  updated_at: string;
  last_connected_at: string | null;
}

@Injectable()
export class ConnectionsService {
  private activeConnectionId: string | null = null;

  constructor(
    private readonly db: DatabaseService,
    private readonly azureClientFactory: AzureClientFactory,
  ) {}

  async create(dto: CreateConnectionDto): Promise<IConnection> {
    const id = uuidv4();

    // Parse connection string if provided
    let parsedData = {};
    if (dto.connectionString) {
      parsedData = this.azureClientFactory.parseConnectionString(dto.connectionString);
    }

    const connection: IConnection = {
      id,
      name: dto.name,
      type: dto.type || 'serviceBus',
      connectionType: dto.connectionType || (dto.connectionString ? 'sas' : 'entraId'),
      connectionString: dto.connectionString,
      endpoint: dto.endpoint || (parsedData as any).endpoint,
      namespace: dto.namespace || (parsedData as any).namespace,
      sharedAccessKeyName: dto.sharedAccessKeyName || (parsedData as any).sharedAccessKeyName,
      sharedAccessKey: dto.sharedAccessKey || (parsedData as any).sharedAccessKey,
      transportType: dto.transportType || 'amqp',
      tenantId: dto.tenantId,
      clientId: dto.clientId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.db.run(
      `INSERT INTO connections (
        id, name, type, connection_type, connection_string, endpoint, namespace,
        shared_access_key_name, shared_access_key, transport_type,
        tenant_id, client_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        connection.id,
        connection.name,
        connection.type,
        connection.connectionType,
        connection.connectionString || null,
        connection.endpoint || null,
        connection.namespace || null,
        connection.sharedAccessKeyName || null,
        connection.sharedAccessKey || null,
        connection.transportType,
        connection.tenantId || null,
        connection.clientId || null,
      ],
    );

    return connection;
  }

  findAll(): IConnection[] {
    const rows = this.db.all<ConnectionRow>('SELECT * FROM connections ORDER BY name');
    return rows.map(this.mapRowToConnection);
  }

  findOne(id: string): IConnection {
    const row = this.db.get<ConnectionRow>('SELECT * FROM connections WHERE id = ?', [id]);

    if (!row) {
      throw new NotFoundException(`Connection with id ${id} not found`);
    }

    return this.mapRowToConnection(row);
  }

  async update(id: string, dto: UpdateConnectionDto): Promise<IConnection> {
    const existing = this.findOne(id);

    const updates: string[] = [];
    const params: unknown[] = [];

    if (dto.name !== undefined) {
      updates.push('name = ?');
      params.push(dto.name);
    }
    if (dto.connectionString !== undefined) {
      updates.push('connection_string = ?');
      params.push(dto.connectionString);

      // Re-parse connection string
      const parsed = this.azureClientFactory.parseConnectionString(dto.connectionString);
      updates.push('endpoint = ?', 'namespace = ?', 'shared_access_key_name = ?', 'shared_access_key = ?');
      params.push(parsed.endpoint || null, parsed.namespace || null, parsed.sharedAccessKeyName || null, parsed.sharedAccessKey || null);
    }
    if (dto.transportType !== undefined) {
      updates.push('transport_type = ?');
      params.push(dto.transportType);
    }

    updates.push("updated_at = datetime('now')");
    params.push(id);

    if (updates.length > 1) {
      this.db.run(
        `UPDATE connections SET ${updates.join(', ')} WHERE id = ?`,
        params,
      );

      // Close existing clients if connection details changed
      await this.azureClientFactory.closeAllClients(id);
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const existing = this.findOne(id);

    // Close any open clients
    await this.azureClientFactory.closeAllClients(id);

    this.db.run('DELETE FROM connections WHERE id = ?', [id]);

    if (this.activeConnectionId === id) {
      this.activeConnectionId = null;
    }
  }

  async testConnection(id: string): Promise<ConnectionTestResult> {
    const connection = this.findOne(id);

    try {
      const { adminClient } = this.azureClientFactory.createServiceBusClients(connection);

      // Test by getting namespace properties
      const properties = await adminClient.getNamespaceProperties();

      // Update last connected timestamp
      this.db.run(
        "UPDATE connections SET last_connected_at = datetime('now') WHERE id = ?",
        [id],
      );

      return {
        success: true,
        message: 'Connection successful',
        namespace: properties.name,
        endpoint: connection.endpoint,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async testNewConnection(dto: {
    connectionString?: string;
    namespace?: string;
    tenantId?: string;
    clientId?: string;
    clientSecret?: string;
  }): Promise<ConnectionTestResult> {
    try {
      // Create a temporary connection object for testing
      let parsedData: any = {};
      if (dto.connectionString) {
        parsedData = this.azureClientFactory.parseConnectionString(dto.connectionString);
      }

      const tempConnection: IConnection = {
        id: 'temp-test',
        name: 'Test Connection',
        type: 'serviceBus',
        connectionType: dto.connectionString ? 'sas' : 'entraId',
        connectionString: dto.connectionString,
        endpoint: parsedData.endpoint || (dto.namespace ? `sb://${dto.namespace}.servicebus.windows.net/` : undefined),
        namespace: parsedData.namespace || dto.namespace,
        sharedAccessKeyName: parsedData.sharedAccessKeyName,
        sharedAccessKey: parsedData.sharedAccessKey,
        transportType: 'amqp',
        tenantId: dto.tenantId,
        clientId: dto.clientId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const { adminClient } = this.azureClientFactory.createServiceBusClients(tempConnection);

      // Test by getting namespace properties
      const properties = await adminClient.getNamespaceProperties();

      return {
        success: true,
        message: 'Connection successful',
        namespace: properties.name,
        endpoint: tempConnection.endpoint,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async setActiveConnection(id: string): Promise<IConnection> {
    const connection = this.findOne(id);

    // Test the connection first
    const testResult = await this.testConnection(id);
    if (!testResult.success) {
      throw new BadRequestException(`Cannot activate connection: ${testResult.message}`);
    }

    this.activeConnectionId = id;
    return connection;
  }

  getActiveConnection(): IConnection | null {
    if (!this.activeConnectionId) {
      return null;
    }

    try {
      return this.findOne(this.activeConnectionId);
    } catch {
      this.activeConnectionId = null;
      return null;
    }
  }

  getActiveConnectionOrThrow(): IConnection {
    const connection = this.getActiveConnection();
    if (!connection) {
      throw new BadRequestException('No active connection. Please connect to a namespace first.');
    }
    return connection;
  }

  private mapRowToConnection(row: ConnectionRow): IConnection {
    return {
      id: row.id,
      name: row.name,
      type: (row.type as any) || 'serviceBus',
      connectionType: row.connection_type as 'sas' | 'entraId',
      connectionString: row.connection_string || undefined,
      endpoint: row.endpoint || undefined,
      namespace: row.namespace || undefined,
      sharedAccessKeyName: row.shared_access_key_name || undefined,
      sharedAccessKey: row.shared_access_key || undefined,
      transportType: row.transport_type as 'amqp' | 'amqpWebSockets',
      tenantId: row.tenant_id || undefined,
      clientId: row.client_id || undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      lastConnectedAt: row.last_connected_at ? new Date(row.last_connected_at) : undefined,
    };
  }
}
