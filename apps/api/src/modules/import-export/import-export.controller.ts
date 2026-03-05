import { Controller, Get, Post, Body, Res, Header } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { ImportExportService } from './import-export.service';

@ApiTags('import-export')
@Controller('import-export')
export class ImportExportController {
  constructor(private readonly importExportService: ImportExportService) {}

  @Get('export/json')
  @ApiOperation({ summary: 'Export all entities as JSON' })
  @Header('Content-Type', 'application/json')
  @Header('Content-Disposition', 'attachment; filename="service-bus-export.json"')
  async exportJson(@Res() res: Response) {
    const json = await this.importExportService.exportToJson();
    res.send(json);
  }

  @Get('export/xml')
  @ApiOperation({ summary: 'Export all entities as XML' })
  @Header('Content-Type', 'application/xml')
  @Header('Content-Disposition', 'attachment; filename="service-bus-export.xml"')
  async exportXml(@Res() res: Response) {
    const xml = await this.importExportService.exportToXml();
    res.send(xml);
  }

  @Post('import/json')
  @ApiOperation({ summary: 'Import entities from JSON' })
  async importJson(@Body() body: { data: string }) {
    return this.importExportService.importFromJson(body.data);
  }

  @Post('import/xml')
  @ApiOperation({ summary: 'Import entities from XML' })
  async importXml(@Body() body: { data: string }) {
    return this.importExportService.importFromXml(body.data);
  }
}
