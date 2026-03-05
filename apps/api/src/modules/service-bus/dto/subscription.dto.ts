import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum, IsNotEmpty, Min, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { EntityStatus } from '@service-bus-explorer/shared';
import { CreateRuleDto } from './rule.dto';

export class CreateSubscriptionDto {
  @ApiProperty({ description: 'Subscription name' })
  @IsString()
  @IsNotEmpty()
  subscriptionName: string;

  @ApiPropertyOptional({ example: 'PT1M' })
  @IsString()
  @IsOptional()
  lockDuration?: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  requiresSession?: boolean;

  @ApiPropertyOptional({ example: 'P14D' })
  @IsString()
  @IsOptional()
  defaultMessageTimeToLive?: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  deadLetteringOnMessageExpiration?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  deadLetteringOnFilterEvaluationExceptions?: boolean;

  @ApiPropertyOptional({ default: 10 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  maxDeliveryCount?: number;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  enableBatchedOperations?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  forwardTo?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  forwardDeadLetteredMessagesTo?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  autoDeleteOnIdle?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  userMetadata?: string;

  @ApiPropertyOptional({ type: CreateRuleDto })
  @ValidateNested()
  @Type(() => CreateRuleDto)
  @IsOptional()
  defaultRule?: CreateRuleDto;
}

export class UpdateSubscriptionDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  lockDuration?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  defaultMessageTimeToLive?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  deadLetteringOnMessageExpiration?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  deadLetteringOnFilterEvaluationExceptions?: boolean;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(1)
  maxDeliveryCount?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  enableBatchedOperations?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  forwardTo?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  forwardDeadLetteredMessagesTo?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  autoDeleteOnIdle?: string;

  @ApiPropertyOptional({ enum: ['Active', 'Disabled', 'SendDisabled', 'ReceiveDisabled'] })
  @IsEnum(['Active', 'Disabled', 'SendDisabled', 'ReceiveDisabled'])
  @IsOptional()
  status?: EntityStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  userMetadata?: string;
}
