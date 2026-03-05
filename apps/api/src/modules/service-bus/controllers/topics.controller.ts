import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { TopicsService } from '../services/topics.service';
import { CreateTopicDto, UpdateTopicDto } from '../dto/topic.dto';

@ApiTags('topics')
@Controller('service-bus/topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Get()
  @ApiOperation({ summary: 'List all topics' })
  findAll() {
    return this.topicsService.findAll();
  }

  @Get(':name')
  @ApiOperation({ summary: 'Get a topic by name' })
  @ApiParam({ name: 'name', description: 'Topic name' })
  findOne(@Param('name') name: string) {
    return this.topicsService.findOne(decodeURIComponent(name));
  }

  @Post()
  @ApiOperation({ summary: 'Create a new topic' })
  create(@Body() dto: CreateTopicDto) {
    return this.topicsService.create(dto);
  }

  @Put(':name')
  @ApiOperation({ summary: 'Update a topic' })
  @ApiParam({ name: 'name', description: 'Topic name' })
  update(@Param('name') name: string, @Body() dto: UpdateTopicDto) {
    return this.topicsService.update(decodeURIComponent(name), dto);
  }

  @Delete(':name')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a topic' })
  @ApiParam({ name: 'name', description: 'Topic name' })
  remove(@Param('name') name: string) {
    return this.topicsService.remove(decodeURIComponent(name));
  }
}
