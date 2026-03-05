import { Module } from '@nestjs/common';
import { EventHubsController } from './event-hubs.controller';
import { EventHubsService } from './event-hubs.service';

@Module({
  controllers: [EventHubsController],
  providers: [EventHubsService],
  exports: [EventHubsService],
})
export class EventHubsModule {}
