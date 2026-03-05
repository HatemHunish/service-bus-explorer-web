import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { MessagesService } from '../services/messages.service';
import { SendMessageDto, SendBatchDto, PeekMessagesDto, ReceiveMessagesDto, ResubmitDto, PurgeDto } from '../dto/message.dto';

@ApiTags('messages')
@Controller('service-bus')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  // Queue message operations
  @Post('queues/:name/messages')
  @ApiOperation({ summary: 'Send a message to a queue' })
  @ApiParam({ name: 'name', description: 'Queue name' })
  sendToQueue(@Param('name') name: string, @Body() dto: SendMessageDto) {
    return this.messagesService.sendToQueue(decodeURIComponent(name), dto.message);
  }

  @Post('queues/:name/messages/batch')
  @ApiOperation({ summary: 'Send multiple messages to a queue' })
  @ApiParam({ name: 'name', description: 'Queue name' })
  sendBatchToQueue(@Param('name') name: string, @Body() dto: SendBatchDto) {
    return this.messagesService.sendBatchToQueue(decodeURIComponent(name), dto.messages);
  }

  @Get('queues/:name/messages')
  @ApiOperation({ summary: 'Peek messages from a queue' })
  @ApiParam({ name: 'name', description: 'Queue name' })
  @ApiQuery({ name: 'count', required: false, description: 'Number of messages to peek' })
  @ApiQuery({ name: 'fromSequenceNumber', required: false, description: 'Starting sequence number' })
  peekQueueMessages(
    @Param('name') name: string,
    @Query('count') count?: string,
    @Query('fromSequenceNumber') fromSequenceNumber?: string,
  ) {
    return this.messagesService.peekQueueMessages(
      decodeURIComponent(name),
      count ? parseInt(count, 10) : 10,
      fromSequenceNumber ? parseInt(fromSequenceNumber, 10) : undefined,
    );
  }

  @Post('queues/:name/messages/receive')
  @ApiOperation({ summary: 'Receive and delete messages from a queue' })
  @ApiParam({ name: 'name', description: 'Queue name' })
  receiveQueueMessages(@Param('name') name: string, @Body() dto: ReceiveMessagesDto) {
    return this.messagesService.receiveQueueMessages(
      decodeURIComponent(name),
      dto.maxMessageCount || 10,
      dto.maxWaitTimeInMs || 5000,
      dto.receiveMode || 'receiveAndDelete',
    );
  }

  @Get('queues/:name/dlq')
  @ApiOperation({ summary: 'Peek messages from dead-letter queue' })
  @ApiParam({ name: 'name', description: 'Queue name' })
  @ApiQuery({ name: 'count', required: false, description: 'Number of messages to peek' })
  peekDeadLetterQueue(@Param('name') name: string, @Query('count') count?: string) {
    return this.messagesService.peekDeadLetterQueue(
      decodeURIComponent(name),
      count ? parseInt(count, 10) : 10,
    );
  }

  @Post('queues/:name/dlq/resubmit')
  @ApiOperation({ summary: 'Resubmit messages from dead-letter queue' })
  @ApiParam({ name: 'name', description: 'Queue name' })
  resubmitFromQueueDLQ(@Param('name') name: string, @Body() dto: ResubmitDto) {
    return this.messagesService.resubmitFromDeadLetter(
      decodeURIComponent(name),
      dto.sequenceNumbers,
      dto.targetQueue,
    );
  }

  @Post('queues/:name/purge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Purge all messages from a queue' })
  @ApiParam({ name: 'name', description: 'Queue name' })
  purgeQueue(@Param('name') name: string, @Body() dto: PurgeDto) {
    return this.messagesService.purgeQueue(decodeURIComponent(name), dto.includeDeadLetter);
  }

  // Topic message operations
  @Post('topics/:name/messages')
  @ApiOperation({ summary: 'Send a message to a topic' })
  @ApiParam({ name: 'name', description: 'Topic name' })
  sendToTopic(@Param('name') name: string, @Body() dto: SendMessageDto) {
    return this.messagesService.sendToTopic(decodeURIComponent(name), dto.message);
  }

  @Post('topics/:name/messages/batch')
  @ApiOperation({ summary: 'Send multiple messages to a topic' })
  @ApiParam({ name: 'name', description: 'Topic name' })
  sendBatchToTopic(@Param('name') name: string, @Body() dto: SendBatchDto) {
    return this.messagesService.sendBatchToTopic(decodeURIComponent(name), dto.messages);
  }

  // Subscription message operations
  @Get('topics/:topicName/subscriptions/:subscriptionName/messages')
  @ApiOperation({ summary: 'Peek messages from a subscription' })
  @ApiParam({ name: 'topicName', description: 'Topic name' })
  @ApiParam({ name: 'subscriptionName', description: 'Subscription name' })
  @ApiQuery({ name: 'count', required: false })
  @ApiQuery({ name: 'fromSequenceNumber', required: false })
  peekSubscriptionMessages(
    @Param('topicName') topicName: string,
    @Param('subscriptionName') subscriptionName: string,
    @Query('count') count?: string,
    @Query('fromSequenceNumber') fromSequenceNumber?: string,
  ) {
    return this.messagesService.peekSubscriptionMessages(
      decodeURIComponent(topicName),
      decodeURIComponent(subscriptionName),
      count ? parseInt(count, 10) : 10,
      fromSequenceNumber ? parseInt(fromSequenceNumber, 10) : undefined,
    );
  }

  @Post('topics/:topicName/subscriptions/:subscriptionName/messages/receive')
  @ApiOperation({ summary: 'Receive and delete messages from a subscription' })
  @ApiParam({ name: 'topicName', description: 'Topic name' })
  @ApiParam({ name: 'subscriptionName', description: 'Subscription name' })
  receiveSubscriptionMessages(
    @Param('topicName') topicName: string,
    @Param('subscriptionName') subscriptionName: string,
    @Body() dto: ReceiveMessagesDto,
  ) {
    return this.messagesService.receiveSubscriptionMessages(
      decodeURIComponent(topicName),
      decodeURIComponent(subscriptionName),
      dto.maxMessageCount || 10,
      dto.maxWaitTimeInMs || 5000,
      dto.receiveMode || 'receiveAndDelete',
    );
  }

  @Get('topics/:topicName/subscriptions/:subscriptionName/dlq')
  @ApiOperation({ summary: 'Peek messages from subscription dead-letter queue' })
  @ApiParam({ name: 'topicName', description: 'Topic name' })
  @ApiParam({ name: 'subscriptionName', description: 'Subscription name' })
  @ApiQuery({ name: 'count', required: false })
  peekSubscriptionDLQ(
    @Param('topicName') topicName: string,
    @Param('subscriptionName') subscriptionName: string,
    @Query('count') count?: string,
  ) {
    return this.messagesService.peekSubscriptionDeadLetterQueue(
      decodeURIComponent(topicName),
      decodeURIComponent(subscriptionName),
      count ? parseInt(count, 10) : 10,
    );
  }

  @Post('topics/:topicName/subscriptions/:subscriptionName/purge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Purge all messages from a subscription' })
  @ApiParam({ name: 'topicName', description: 'Topic name' })
  @ApiParam({ name: 'subscriptionName', description: 'Subscription name' })
  purgeSubscription(
    @Param('topicName') topicName: string,
    @Param('subscriptionName') subscriptionName: string,
    @Body() dto: PurgeDto,
  ) {
    return this.messagesService.purgeSubscription(
      decodeURIComponent(topicName),
      decodeURIComponent(subscriptionName),
      dto.includeDeadLetter,
    );
  }
}
