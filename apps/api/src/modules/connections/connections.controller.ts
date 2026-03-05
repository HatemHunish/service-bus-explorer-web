import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConnectionsService } from './connections.service';
import { CreateConnectionDto, UpdateConnectionDto, TestConnectionDto } from './dto';

@ApiTags('connections')
@Controller('connections')
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new connection' })
  @ApiResponse({ status: 201, description: 'Connection created successfully' })
  create(@Body() createConnectionDto: CreateConnectionDto) {
    return this.connectionsService.create(createConnectionDto);
  }

  @Post('test')
  @ApiOperation({ summary: 'Test a connection before saving' })
  @ApiResponse({ status: 200, description: 'Test result' })
  testNewConnection(@Body() testConnectionDto: TestConnectionDto) {
    return this.connectionsService.testNewConnection(testConnectionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all saved connections' })
  @ApiResponse({ status: 200, description: 'List of connections' })
  findAll() {
    return this.connectionsService.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Get the currently active connection' })
  @ApiResponse({ status: 200, description: 'Active connection or null' })
  getActive() {
    return this.connectionsService.getActiveConnection();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a connection by ID' })
  @ApiResponse({ status: 200, description: 'Connection details' })
  @ApiResponse({ status: 404, description: 'Connection not found' })
  findOne(@Param('id') id: string) {
    return this.connectionsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a connection' })
  @ApiResponse({ status: 200, description: 'Connection updated' })
  @ApiResponse({ status: 404, description: 'Connection not found' })
  update(@Param('id') id: string, @Body() updateConnectionDto: UpdateConnectionDto) {
    return this.connectionsService.update(id, updateConnectionDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a connection' })
  @ApiResponse({ status: 204, description: 'Connection deleted' })
  @ApiResponse({ status: 404, description: 'Connection not found' })
  remove(@Param('id') id: string) {
    return this.connectionsService.remove(id);
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Test a connection' })
  @ApiResponse({ status: 200, description: 'Test result' })
  @ApiResponse({ status: 404, description: 'Connection not found' })
  testConnection(@Param('id') id: string) {
    return this.connectionsService.testConnection(id);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Set a connection as active' })
  @ApiResponse({ status: 200, description: 'Connection activated' })
  @ApiResponse({ status: 400, description: 'Connection test failed' })
  @ApiResponse({ status: 404, description: 'Connection not found' })
  activateConnection(@Param('id') id: string) {
    return this.connectionsService.setActiveConnection(id);
  }
}
