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
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { QueuesService } from '../services/queues.service';
import { CreateQueueDto, UpdateQueueDto } from '../dto/queue.dto';

@ApiTags('queues')
@Controller('service-bus/queues')
export class QueuesController {
  constructor(private readonly queuesService: QueuesService) {}

  @Get()
  @ApiOperation({ summary: 'List all queues' })
  @ApiResponse({ status: 200, description: 'List of queues' })
  findAll() {
    return this.queuesService.findAll();
  }

  @Get(':name')
  @ApiOperation({ summary: 'Get a queue by name' })
  @ApiParam({ name: 'name', description: 'Queue name' })
  @ApiResponse({ status: 200, description: 'Queue details' })
  @ApiResponse({ status: 404, description: 'Queue not found' })
  findOne(@Param('name') name: string) {
    return this.queuesService.findOne(decodeURIComponent(name));
  }

  @Post()
  @ApiOperation({ summary: 'Create a new queue' })
  @ApiResponse({ status: 201, description: 'Queue created' })
  create(@Body() createQueueDto: CreateQueueDto) {
    return this.queuesService.create(createQueueDto);
  }

  @Put(':name')
  @ApiOperation({ summary: 'Update a queue' })
  @ApiParam({ name: 'name', description: 'Queue name' })
  @ApiResponse({ status: 200, description: 'Queue updated' })
  @ApiResponse({ status: 404, description: 'Queue not found' })
  update(@Param('name') name: string, @Body() updateQueueDto: UpdateQueueDto) {
    return this.queuesService.update(decodeURIComponent(name), updateQueueDto);
  }

  @Delete(':name')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a queue' })
  @ApiParam({ name: 'name', description: 'Queue name' })
  @ApiResponse({ status: 204, description: 'Queue deleted' })
  @ApiResponse({ status: 404, description: 'Queue not found' })
  remove(@Param('name') name: string) {
    return this.queuesService.remove(decodeURIComponent(name));
  }

  @Get(':name/exists')
  @ApiOperation({ summary: 'Check if a queue exists' })
  @ApiParam({ name: 'name', description: 'Queue name' })
  @ApiResponse({ status: 200, description: 'Existence check result' })
  async exists(@Param('name') name: string) {
    const exists = await this.queuesService.exists(decodeURIComponent(name));
    return { exists };
  }
}
