import { Module } from '@nestjs/common';
import { ServiceBusGateway } from './service-bus.gateway';

@Module({
  providers: [ServiceBusGateway],
  exports: [ServiceBusGateway],
})
export class WebSocketModule {}
