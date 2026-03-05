import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EntityStatus } from '@service-bus-explorer/shared';

export class CreateQueueDto {
  @ApiProperty({ description: 'Queue name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Maximum size in megabytes', default: 1024 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  maxSizeInMegabytes?: number;

  @ApiPropertyOptional({ description: 'Maximum message size in kilobytes' })
  @IsNumber()
  @IsOptional()
  maxMessageSizeInKilobytes?: number;

  @ApiPropertyOptional({ description: 'Enable duplicate detection', default: false })
  @IsBoolean()
  @IsOptional()
  requiresDuplicateDetection?: boolean;

  @ApiPropertyOptional({ description: 'Enable sessions', default: false })
  @IsBoolean()
  @IsOptional()
  requiresSession?: boolean;

  @ApiPropertyOptional({ description: 'Default message TTL (ISO 8601 duration)', example: 'P14D' })
  @IsString()
  @IsOptional()
  defaultMessageTimeToLive?: string;

  @ApiPropertyOptional({ description: 'Enable dead-lettering on message expiration', default: false })
  @IsBoolean()
  @IsOptional()
  deadLetteringOnMessageExpiration?: boolean;

  @ApiPropertyOptional({ description: 'Duplicate detection history window (ISO 8601 duration)', example: 'PT10M' })
  @IsString()
  @IsOptional()
  duplicateDetectionHistoryTimeWindow?: string;

  @ApiPropertyOptional({ description: 'Maximum delivery count before dead-lettering', default: 10 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  maxDeliveryCount?: number;

  @ApiPropertyOptional({ description: 'Lock duration (ISO 8601 duration)', example: 'PT1M' })
  @IsString()
  @IsOptional()
  lockDuration?: string;

  @ApiPropertyOptional({ description: 'Enable batched operations', default: true })
  @IsBoolean()
  @IsOptional()
  enableBatchedOperations?: boolean;

  @ApiPropertyOptional({ description: 'Enable partitioning', default: false })
  @IsBoolean()
  @IsOptional()
  enablePartitioning?: boolean;

  @ApiPropertyOptional({ description: 'Forward to queue/topic' })
  @IsString()
  @IsOptional()
  forwardTo?: string;

  @ApiPropertyOptional({ description: 'Forward dead-lettered messages to' })
  @IsString()
  @IsOptional()
  forwardDeadLetteredMessagesTo?: string;

  @ApiPropertyOptional({ description: 'Auto-delete on idle (ISO 8601 duration)' })
  @IsString()
  @IsOptional()
  autoDeleteOnIdle?: string;

  @ApiPropertyOptional({ description: 'User metadata' })
  @IsString()
  @IsOptional()
  userMetadata?: string;
}

export class UpdateQueueDto {
  @ApiPropertyOptional({ description: 'Maximum size in megabytes' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  maxSizeInMegabytes?: number;

  @ApiPropertyOptional({ description: 'Default message TTL (ISO 8601 duration)' })
  @IsString()
  @IsOptional()
  defaultMessageTimeToLive?: string;

  @ApiPropertyOptional({ description: 'Enable dead-lettering on message expiration' })
  @IsBoolean()
  @IsOptional()
  deadLetteringOnMessageExpiration?: boolean;

  @ApiPropertyOptional({ description: 'Duplicate detection history window (ISO 8601 duration)' })
  @IsString()
  @IsOptional()
  duplicateDetectionHistoryTimeWindow?: string;

  @ApiPropertyOptional({ description: 'Maximum delivery count' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  maxDeliveryCount?: number;

  @ApiPropertyOptional({ description: 'Lock duration (ISO 8601 duration)' })
  @IsString()
  @IsOptional()
  lockDuration?: string;

  @ApiPropertyOptional({ description: 'Enable batched operations' })
  @IsBoolean()
  @IsOptional()
  enableBatchedOperations?: boolean;

  @ApiPropertyOptional({ description: 'Forward to queue/topic' })
  @IsString()
  @IsOptional()
  forwardTo?: string;

  @ApiPropertyOptional({ description: 'Forward dead-lettered messages to' })
  @IsString()
  @IsOptional()
  forwardDeadLetteredMessagesTo?: string;

  @ApiPropertyOptional({ description: 'Auto-delete on idle (ISO 8601 duration)' })
  @IsString()
  @IsOptional()
  autoDeleteOnIdle?: string;

  @ApiPropertyOptional({ enum: ['Active', 'Disabled', 'SendDisabled', 'ReceiveDisabled'] })
  @IsEnum(['Active', 'Disabled', 'SendDisabled', 'ReceiveDisabled'])
  @IsOptional()
  status?: EntityStatus;

  @ApiPropertyOptional({ description: 'User metadata' })
  @IsString()
  @IsOptional()
  userMetadata?: string;
}
