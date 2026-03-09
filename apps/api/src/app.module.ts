import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConnectionsModule } from './modules/connections/connections.module';
import { ServiceBusModule } from './modules/service-bus/service-bus.module';
import { EventHubsModule } from './modules/event-hubs/event-hubs.module';
import { EventGridModule } from './modules/event-grid/event-grid.module';
import { NotificationHubsModule } from './modules/notification-hubs/notification-hubs.module';
import { RelaysModule } from './modules/relays/relays.module';
import { ImportExportModule } from './modules/import-export/import-export.module';
import { WebSocketModule } from './modules/websocket/websocket.module';
import { AutoReplyModule } from './modules/auto-reply/auto-reply.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ConnectionsModule,
    ServiceBusModule,
    EventHubsModule,
    EventGridModule,
    NotificationHubsModule,
    RelaysModule,
    ImportExportModule,
    WebSocketModule,
    AutoReplyModule,
  ],
})
export class AppModule {}
