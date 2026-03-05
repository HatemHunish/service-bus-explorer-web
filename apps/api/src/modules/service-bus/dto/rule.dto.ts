import { IsString, IsOptional, IsEnum, IsNotEmpty, ValidateNested, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { FilterType, ICorrelationFilter } from '@service-bus-explorer/shared';

class CorrelationFilterDto implements ICorrelationFilter {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  correlationId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  messageId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  to?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  replyTo?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sessionId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  replyToSessionId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  contentType?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  applicationProperties?: Record<string, string | number | boolean>;
}

class FilterDto {
  @ApiProperty({ enum: ['sql', 'correlation', 'true', 'false'] })
  @IsEnum(['sql', 'correlation', 'true', 'false'])
  type: FilterType;

  @ApiPropertyOptional({ description: 'SQL filter expression' })
  @IsString()
  @IsOptional()
  sqlExpression?: string;

  @ApiPropertyOptional({ type: CorrelationFilterDto })
  @ValidateNested()
  @Type(() => CorrelationFilterDto)
  @IsOptional()
  correlationFilter?: CorrelationFilterDto;
}

class ActionDto {
  @ApiProperty({ description: 'SQL action expression' })
  @IsString()
  sqlExpression: string;
}

export class CreateRuleDto {
  @ApiProperty({ description: 'Rule name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ type: FilterDto })
  @ValidateNested()
  @Type(() => FilterDto)
  filter: FilterDto;

  @ApiPropertyOptional({ type: ActionDto })
  @ValidateNested()
  @Type(() => ActionDto)
  @IsOptional()
  action?: ActionDto;
}
