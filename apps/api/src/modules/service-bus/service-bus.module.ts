import { Module } from '@nestjs/common';
import { QueuesController } from './controllers/queues.controller';
import { TopicsController } from './controllers/topics.controller';
import { SubscriptionsController } from './controllers/subscriptions.controller';
import { RulesController } from './controllers/rules.controller';
import { MessagesController } from './controllers/messages.controller';
import { QueuesService } from './services/queues.service';
import { TopicsService } from './services/topics.service';
import { SubscriptionsService } from './services/subscriptions.service';
import { RulesService } from './services/rules.service';
import { MessagesService } from './services/messages.service';

@Module({
  controllers: [
    QueuesController,
    TopicsController,
    SubscriptionsController,
    RulesController,
    MessagesController,
  ],
  providers: [
    QueuesService,
    TopicsService,
    SubscriptionsService,
    RulesService,
    MessagesService,
  ],
  exports: [
    QueuesService,
    TopicsService,
    SubscriptionsService,
    RulesService,
    MessagesService,
  ],
})
export class ServiceBusModule {}
