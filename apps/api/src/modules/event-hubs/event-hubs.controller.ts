import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { EventHubsService } from './event-hubs.service';

@ApiTags('event-hubs')
@Controller('event-hubs')
export class EventHubsController {
  constructor(private readonly eventHubsService: EventHubsService) {}

  @Get()
  @ApiOperation({ summary: 'List all event hubs' })
  findAll() {
    return this.eventHubsService.findAll();
  }

  @Get(':name/partitions')
  @ApiOperation({ summary: 'Get partitions for an event hub' })
  @ApiParam({ name: 'name', description: 'Event hub name' })
  getPartitions(@Param('name') name: string) {
    return this.eventHubsService.getPartitions(decodeURIComponent(name));
  }

  @Post(':name/events')
  @ApiOperation({ summary: 'Send events to an event hub' })
  @ApiParam({ name: 'name', description: 'Event hub name' })
  sendEvents(
    @Param('name') name: string,
    @Body() body: { events: any[]; partitionId?: string },
  ) {
    return this.eventHubsService.sendEvents(decodeURIComponent(name), body.events, body.partitionId);
  }

  @Get(':name/partitions/:partitionId/events')
  @ApiOperation({ summary: 'Receive events from a partition' })
  @ApiParam({ name: 'name', description: 'Event hub name' })
  @ApiParam({ name: 'partitionId', description: 'Partition ID' })
  @ApiQuery({ name: 'consumerGroup', required: false })
  @ApiQuery({ name: 'maxCount', required: false })
  receiveEvents(
    @Param('name') name: string,
    @Param('partitionId') partitionId: string,
    @Query('consumerGroup') consumerGroup?: string,
    @Query('maxCount') maxCount?: string,
  ) {
    return this.eventHubsService.receiveEvents(
      decodeURIComponent(name),
      partitionId,
      consumerGroup || '$Default',
      maxCount ? parseInt(maxCount, 10) : 10,
    );
  }
}
