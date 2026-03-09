import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
  IsArray,
  ValidateNested,
  IsObject,
  Min,
  Allow,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MatchOperator } from '@service-bus-explorer/shared';

class PropertyConditionDto {
  @IsString()
  property: string;

  @IsEnum(['equals', 'notEquals', 'contains', 'startsWith', 'endsWith', 'regex', 'exists'])
  operator: MatchOperator;

  @IsOptional()
  value?: string | number | boolean;
}

class BodyConditionDto {
  @IsString()
  jsonPath: string;

  @IsEnum(['equals', 'notEquals', 'contains', 'startsWith', 'endsWith', 'regex', 'exists'])
  operator: MatchOperator;

  @IsOptional()
  value?: string | number | boolean;
}

class SourceDto {
  @IsEnum(['queue', 'subscription'])
  entityType: 'queue' | 'subscription';

  @IsOptional()
  @IsString()
  queueName?: string;

  @IsOptional()
  @IsString()
  topicName?: string;

  @IsOptional()
  @IsString()
  subscriptionName?: string;
}

class ReplyTargetDto {
  @IsEnum(['same', 'queue', 'topic'])
  targetType: 'same' | 'queue' | 'topic';

  @IsOptional()
  @IsString()
  queueName?: string;

  @IsOptional()
  @IsString()
  topicName?: string;

  @IsOptional()
  @IsString()
  subscriptionName?: string;
}

class ReplyConfigDto {
  @ValidateNested()
  @Type(() => ReplyTargetDto)
  target: ReplyTargetDto;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  delayMs?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  replyCount?: number;

  @IsString()
  template: string;

  @IsOptional()
  @IsString()
  contentType?: string;

  @IsOptional()
  @IsObject()
  propertiesTemplate?: Record<string, string>;
}

export class CreateAutoReplyRuleDto {
  @IsString()
  connectionId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ValidateNested()
  @Type(() => SourceDto)
  source: SourceDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PropertyConditionDto)
  propertyConditions?: PropertyConditionDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BodyConditionDto)
  bodyConditions?: BodyConditionDto[];

  @IsOptional()
  @IsEnum(['all', 'any'])
  matchMode?: 'all' | 'any';

  @ValidateNested()
  @Type(() => ReplyConfigDto)
  reply: ReplyConfigDto;
}

export class UpdateAutoReplyRuleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => SourceDto)
  source?: SourceDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PropertyConditionDto)
  propertyConditions?: PropertyConditionDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BodyConditionDto)
  bodyConditions?: BodyConditionDto[];

  @IsOptional()
  @IsEnum(['all', 'any'])
  matchMode?: 'all' | 'any';

  @IsOptional()
  @ValidateNested()
  @Type(() => ReplyConfigDto)
  reply?: ReplyConfigDto;
}

class SampleMessageDto {
  @IsOptional()
  @IsString()
  messageId?: string;

  @IsOptional()
  @IsString()
  correlationId?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  contentType?: string;

  @IsOptional()
  @IsObject()
  applicationProperties?: Record<string, unknown>;

  @Allow()
  body: unknown;
}

export class TestTemplateDto {
  @IsString()
  template: string;

  @ValidateNested()
  @Type(() => SampleMessageDto)
  sampleMessage: SampleMessageDto;
}
