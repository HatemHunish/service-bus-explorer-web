import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EntityStatus } from '@service-bus-explorer/shared';

export class CreateTopicDto {
  @ApiProperty({ description: 'Topic name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ default: 1024 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  maxSizeInMegabytes?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  maxMessageSizeInKilobytes?: number;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  requiresDuplicateDetection?: boolean;

  @ApiPropertyOptional({ example: 'P14D' })
  @IsString()
  @IsOptional()
  defaultMessageTimeToLive?: string;

  @ApiPropertyOptional({ example: 'PT10M' })
  @IsString()
  @IsOptional()
  duplicateDetectionHistoryTimeWindow?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  enableBatchedOperations?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  enablePartitioning?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  autoDeleteOnIdle?: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  supportOrdering?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  userMetadata?: string;
}

export class UpdateTopicDto {
  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(1)
  maxSizeInMegabytes?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  defaultMessageTimeToLive?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  duplicateDetectionHistoryTimeWindow?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  enableBatchedOperations?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  autoDeleteOnIdle?: string;

  @ApiPropertyOptional({ enum: ['Active', 'Disabled', 'SendDisabled', 'ReceiveDisabled'] })
  @IsEnum(['Active', 'Disabled', 'SendDisabled', 'ReceiveDisabled'])
  @IsOptional()
  status?: EntityStatus;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  supportOrdering?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  userMetadata?: string;
}
