import { IsString, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateConnectionDto {
  @ApiProperty({ description: 'Display name for the connection' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ enum: ['serviceBus', 'eventHubs', 'eventGrid', 'notificationHubs', 'relay'], description: 'Service type' })
  @IsEnum(['serviceBus', 'eventHubs', 'eventGrid', 'notificationHubs', 'relay'])
  @IsOptional()
  type?: 'serviceBus' | 'eventHubs' | 'eventGrid' | 'notificationHubs' | 'relay';

  @ApiPropertyOptional({ enum: ['sas', 'entraId'], description: 'Authentication type' })
  @IsEnum(['sas', 'entraId'])
  @IsOptional()
  connectionType?: 'sas' | 'entraId';

  @ApiPropertyOptional({ description: 'Full connection string (for SAS auth)' })
  @IsString()
  @IsOptional()
  connectionString?: string;

  @ApiPropertyOptional({ description: 'Service Bus endpoint (for Entra ID auth)' })
  @IsString()
  @IsOptional()
  endpoint?: string;

  @ApiPropertyOptional({ description: 'Namespace name' })
  @IsString()
  @IsOptional()
  namespace?: string;

  @ApiPropertyOptional({ description: 'Shared access key name' })
  @IsString()
  @IsOptional()
  sharedAccessKeyName?: string;

  @ApiPropertyOptional({ description: 'Shared access key' })
  @IsString()
  @IsOptional()
  sharedAccessKey?: string;

  @ApiPropertyOptional({ enum: ['amqp', 'amqpWebSockets'], default: 'amqp' })
  @IsEnum(['amqp', 'amqpWebSockets'])
  @IsOptional()
  transportType?: 'amqp' | 'amqpWebSockets';

  @ApiPropertyOptional({ description: 'Azure tenant ID (for Entra ID auth)' })
  @IsString()
  @IsOptional()
  tenantId?: string;

  @ApiPropertyOptional({ description: 'Azure client ID (for Entra ID auth)' })
  @IsString()
  @IsOptional()
  clientId?: string;
}

// DTO for testing a connection before saving
export class TestConnectionDto {
  @ApiPropertyOptional({ description: 'Display name for the connection' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ enum: ['serviceBus', 'eventHubs', 'eventGrid', 'notificationHubs', 'relay'], description: 'Service type' })
  @IsEnum(['serviceBus', 'eventHubs', 'eventGrid', 'notificationHubs', 'relay'])
  @IsOptional()
  type?: 'serviceBus' | 'eventHubs' | 'eventGrid' | 'notificationHubs' | 'relay';

  @ApiPropertyOptional({ description: 'Full connection string (for SAS auth)' })
  @IsString()
  @IsOptional()
  connectionString?: string;

  @ApiPropertyOptional({ description: 'Namespace name or endpoint' })
  @IsString()
  @IsOptional()
  namespace?: string;

  @ApiPropertyOptional({ description: 'Azure tenant ID (for Entra ID auth)' })
  @IsString()
  @IsOptional()
  tenantId?: string;

  @ApiPropertyOptional({ description: 'Azure client ID (for Entra ID auth)' })
  @IsString()
  @IsOptional()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Azure client secret (for Entra ID auth)' })
  @IsString()
  @IsOptional()
  clientSecret?: string;
}

export class UpdateConnectionDto {
  @ApiPropertyOptional({ description: 'Display name for the connection' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Full connection string' })
  @IsString()
  @IsOptional()
  connectionString?: string;

  @ApiPropertyOptional({ description: 'Shared access key name' })
  @IsString()
  @IsOptional()
  sharedAccessKeyName?: string;

  @ApiPropertyOptional({ description: 'Shared access key' })
  @IsString()
  @IsOptional()
  sharedAccessKey?: string;

  @ApiPropertyOptional({ enum: ['amqp', 'amqpWebSockets'] })
  @IsEnum(['amqp', 'amqpWebSockets'])
  @IsOptional()
  transportType?: 'amqp' | 'amqpWebSockets';
}
