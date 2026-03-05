import { Module } from '@nestjs/common';
import { ImportExportController } from './import-export.controller';
import { ImportExportService } from './import-export.service';
import { ServiceBusModule } from '../service-bus/service-bus.module';

@Module({
  imports: [ServiceBusModule],
  controllers: [ImportExportController],
  providers: [ImportExportService],
})
export class ImportExportModule {}
