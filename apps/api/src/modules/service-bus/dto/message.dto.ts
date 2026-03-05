import { IsString, IsOptional, IsArray, IsEnum, IsNumber, IsBoolean, IsDate, ValidateNested, Min, IsDefined } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { MessageBodyType, IMessageProperty } from '@service-bus-explorer/shared';

export class MessagePropertyDto implements IMessageProperty {
  @ApiProperty({ description: 'Property key' })
  @IsString()
  key: string;

  @ApiProperty({ description: 'Property value', oneOf: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }] })
  @IsDefined()
  value: string | number | boolean | Date;

  @ApiProperty({ enum: ['string', 'number', 'boolean', 'datetime'] })
  @IsEnum(['string', 'number', 'boolean', 'datetime'])
  type: 'string' | 'number' | 'boolean' | 'datetime';
}

export class SendMessageBodyDto {
  @ApiPropertyOptional({ description: 'Message ID' })
  @IsString()
  @IsOptional()
  messageId?: string;

  @ApiPropertyOptional({ description: 'Session ID' })
  @IsString()
  @IsOptional()
  sessionId?: string;

  @ApiPropertyOptional({ description: 'Correlation ID' })
  @IsString()
  @IsOptional()
  correlationId?: string;

  @ApiPropertyOptional({ description: 'Content type (e.g., application/json)' })
  @IsString()
  @IsOptional()
  contentType?: string;

  @ApiPropertyOptional({ description: 'Subject/Label' })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiPropertyOptional({ description: 'Partition key' })
  @IsString()
  @IsOptional()
  partitionKey?: string;

  @ApiPropertyOptional({ description: 'To address' })
  @IsString()
  @IsOptional()
  to?: string;

  @ApiPropertyOptional({ description: 'Reply to address' })
  @IsString()
  @IsOptional()
  replyTo?: string;

  @ApiPropertyOptional({ description: 'Reply to session ID' })
  @IsString()
  @IsOptional()
  replyToSessionId?: string;

  @ApiPropertyOptional({ description: 'Time to live (ISO 8601 duration)' })
  @IsString()
  @IsOptional()
  timeToLive?: string;

  @ApiPropertyOptional({ description: 'Scheduled enqueue time' })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  scheduledEnqueueTime?: Date;

  @ApiProperty({ description: 'Message body content' })
  @IsString()
  body: string;

  @ApiProperty({ enum: ['text', 'json', 'xml', 'binary'], description: 'Body type' })
  @IsEnum(['text', 'json', 'xml', 'binary'])
  bodyType: MessageBodyType;

  @ApiPropertyOptional({ type: [MessagePropertyDto], description: 'Custom properties' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessagePropertyDto)
  @IsOptional()
  applicationProperties?: MessagePropertyDto[];
}

export class SendMessageDto {
  @ApiProperty({ type: SendMessageBodyDto })
  @ValidateNested()
  @Type(() => SendMessageBodyDto)
  message: SendMessageBodyDto;
}

export class SendBatchDto {
  @ApiProperty({ type: [SendMessageBodyDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SendMessageBodyDto)
  messages: SendMessageBodyDto[];
}

export class PeekMessagesDto {
  @ApiPropertyOptional({ description: 'Maximum number of messages to peek', default: 10 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  maxMessageCount?: number;

  @ApiPropertyOptional({ description: 'From sequence number (for pagination)' })
  @IsNumber()
  @IsOptional()
  fromSequenceNumber?: number;
}

export class ReceiveMessagesDto {
  @ApiPropertyOptional({ description: 'Maximum number of messages to receive', default: 10 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  maxMessageCount?: number;

  @ApiPropertyOptional({ description: 'Maximum wait time in milliseconds', default: 5000 })
  @IsNumber()
  @IsOptional()
  maxWaitTimeInMs?: number;

  @ApiPropertyOptional({ enum: ['peekLock', 'receiveAndDelete'], default: 'receiveAndDelete' })
  @IsEnum(['peekLock', 'receiveAndDelete'])
  @IsOptional()
  receiveMode?: 'peekLock' | 'receiveAndDelete';
}

export class ResubmitDto {
  @ApiProperty({ description: 'Sequence numbers of messages to resubmit' })
  @IsArray()
  @IsNumber({}, { each: true })
  sequenceNumbers: number[];

  @ApiPropertyOptional({ description: 'Target queue (defaults to original queue)' })
  @IsString()
  @IsOptional()
  targetQueue?: string;
}

export class PurgeDto {
  @ApiPropertyOptional({ description: 'Include dead-letter queue', default: false })
  @IsBoolean()
  @IsOptional()
  includeDeadLetter?: boolean;
}
