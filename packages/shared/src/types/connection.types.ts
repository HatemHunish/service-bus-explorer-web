export type ConnectionType = 'sas' | 'entraId';
export type TransportType = 'amqp' | 'amqpWebSockets';
export type ServiceType = 'serviceBus' | 'eventHubs' | 'eventGrid' | 'notificationHubs' | 'relay';

export interface IConnection {
  id: string;
  name: string;
  type: ServiceType;
  connectionType: ConnectionType;
  connectionString?: string;
  endpoint?: string;
  namespace?: string;
  sharedAccessKeyName?: string;
  sharedAccessKey?: string;
  transportType: TransportType;
  tenantId?: string;
  clientId?: string;
  createdAt: Date;
  updatedAt: Date;
  lastConnectedAt?: Date;
}

export interface CreateConnectionDto {
  name: string;
  type?: ServiceType;
  connectionType?: ConnectionType;
  connectionString?: string;
  endpoint?: string;
  namespace?: string;
  sharedAccessKeyName?: string;
  sharedAccessKey?: string;
  transportType?: TransportType;
  tenantId?: string;
  clientId?: string;
}

export interface UpdateConnectionDto {
  name?: string;
  connectionString?: string;
  sharedAccessKeyName?: string;
  sharedAccessKey?: string;
  transportType?: TransportType;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  namespace?: string;
  endpoint?: string;
}
