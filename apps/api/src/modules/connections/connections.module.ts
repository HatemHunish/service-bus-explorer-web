import { Module, Global } from '@nestjs/common';
import { ConnectionsController } from './connections.controller';
import { ConnectionsService } from './connections.service';
import { AzureClientFactory } from './azure-client.factory';
import { DatabaseService } from './database.service';

@Global()
@Module({
  controllers: [ConnectionsController],
  providers: [ConnectionsService, AzureClientFactory, DatabaseService],
  exports: [ConnectionsService, AzureClientFactory],
})
export class ConnectionsModule {}
