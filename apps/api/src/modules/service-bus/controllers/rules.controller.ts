import { Controller, Get, Post, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { RulesService } from '../services/rules.service';
import { CreateRuleDto } from '../dto/rule.dto';

@ApiTags('rules')
@Controller('service-bus/topics/:topicName/subscriptions/:subscriptionName/rules')
export class RulesController {
  constructor(private readonly rulesService: RulesService) {}

  @Get()
  @ApiOperation({ summary: 'List all rules for a subscription' })
  @ApiParam({ name: 'topicName', description: 'Topic name' })
  @ApiParam({ name: 'subscriptionName', description: 'Subscription name' })
  findAll(@Param('topicName') topicName: string, @Param('subscriptionName') subscriptionName: string) {
    return this.rulesService.findAll(decodeURIComponent(topicName), decodeURIComponent(subscriptionName));
  }

  @Get(':name')
  @ApiOperation({ summary: 'Get a rule by name' })
  @ApiParam({ name: 'topicName', description: 'Topic name' })
  @ApiParam({ name: 'subscriptionName', description: 'Subscription name' })
  @ApiParam({ name: 'name', description: 'Rule name' })
  findOne(
    @Param('topicName') topicName: string,
    @Param('subscriptionName') subscriptionName: string,
    @Param('name') name: string,
  ) {
    return this.rulesService.findOne(
      decodeURIComponent(topicName),
      decodeURIComponent(subscriptionName),
      decodeURIComponent(name),
    );
  }

  @Post()
  @ApiOperation({ summary: 'Create a new rule' })
  @ApiParam({ name: 'topicName', description: 'Topic name' })
  @ApiParam({ name: 'subscriptionName', description: 'Subscription name' })
  create(
    @Param('topicName') topicName: string,
    @Param('subscriptionName') subscriptionName: string,
    @Body() dto: CreateRuleDto,
  ) {
    return this.rulesService.create(decodeURIComponent(topicName), decodeURIComponent(subscriptionName), dto);
  }

  @Delete(':name')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a rule' })
  @ApiParam({ name: 'topicName', description: 'Topic name' })
  @ApiParam({ name: 'subscriptionName', description: 'Subscription name' })
  @ApiParam({ name: 'name', description: 'Rule name' })
  remove(
    @Param('topicName') topicName: string,
    @Param('subscriptionName') subscriptionName: string,
    @Param('name') name: string,
  ) {
    return this.rulesService.remove(
      decodeURIComponent(topicName),
      decodeURIComponent(subscriptionName),
      decodeURIComponent(name),
    );
  }
}
