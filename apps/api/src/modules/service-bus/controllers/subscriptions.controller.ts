import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { SubscriptionsService } from '../services/subscriptions.service';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from '../dto/subscription.dto';

@ApiTags('subscriptions')
@Controller('service-bus/topics/:topicName/subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  @ApiOperation({ summary: 'List all subscriptions for a topic' })
  @ApiParam({ name: 'topicName', description: 'Topic name' })
  findAll(@Param('topicName') topicName: string) {
    return this.subscriptionsService.findAll(decodeURIComponent(topicName));
  }

  @Get(':name')
  @ApiOperation({ summary: 'Get a subscription by name' })
  @ApiParam({ name: 'topicName', description: 'Topic name' })
  @ApiParam({ name: 'name', description: 'Subscription name' })
  findOne(@Param('topicName') topicName: string, @Param('name') name: string) {
    return this.subscriptionsService.findOne(decodeURIComponent(topicName), decodeURIComponent(name));
  }

  @Post()
  @ApiOperation({ summary: 'Create a new subscription' })
  @ApiParam({ name: 'topicName', description: 'Topic name' })
  create(@Param('topicName') topicName: string, @Body() dto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(decodeURIComponent(topicName), dto);
  }

  @Put(':name')
  @ApiOperation({ summary: 'Update a subscription' })
  @ApiParam({ name: 'topicName', description: 'Topic name' })
  @ApiParam({ name: 'name', description: 'Subscription name' })
  update(
    @Param('topicName') topicName: string,
    @Param('name') name: string,
    @Body() dto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionsService.update(decodeURIComponent(topicName), decodeURIComponent(name), dto);
  }

  @Delete(':name')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a subscription' })
  @ApiParam({ name: 'topicName', description: 'Topic name' })
  @ApiParam({ name: 'name', description: 'Subscription name' })
  remove(@Param('topicName') topicName: string, @Param('name') name: string) {
    return this.subscriptionsService.remove(decodeURIComponent(topicName), decodeURIComponent(name));
  }
}
