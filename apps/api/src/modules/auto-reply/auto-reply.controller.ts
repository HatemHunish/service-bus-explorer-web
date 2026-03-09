import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { AutoReplyService } from './auto-reply.service';
import { AutoReplyListenerService } from './auto-reply-listener.service';
import { TemplateService } from './template.service';
import { CreateAutoReplyRuleDto, UpdateAutoReplyRuleDto, TestTemplateDto } from './auto-reply.dto';

@Controller('auto-reply')
export class AutoReplyController {
  constructor(
    private readonly autoReplyService: AutoReplyService,
    private readonly listenerService: AutoReplyListenerService,
    private readonly templateService: TemplateService,
  ) {}

  // ===== Rules CRUD =====

  @Get('rules')
  listRules(@Query('connectionId') connectionId?: string) {
    return this.autoReplyService.findAll(connectionId);
  }

  @Get('rules/:id')
  getRule(@Param('id') id: string) {
    const rule = this.autoReplyService.findById(id);
    if (!rule) {
      throw new NotFoundException(`Rule not found: ${id}`);
    }
    return rule;
  }

  @Post('rules')
  createRule(@Body() dto: CreateAutoReplyRuleDto) {
    return this.autoReplyService.create(dto);
  }

  @Put('rules/:id')
  updateRule(@Param('id') id: string, @Body() dto: UpdateAutoReplyRuleDto) {
    const rule = this.autoReplyService.update(id, dto);
    if (!rule) {
      throw new NotFoundException(`Rule not found: ${id}`);
    }
    return rule;
  }

  @Delete('rules/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRule(@Param('id') id: string) {
    // Stop listener if running
    await this.listenerService.stopListener(id);

    const deleted = this.autoReplyService.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Rule not found: ${id}`);
    }
  }

  // ===== Enable/Disable =====

  @Post('rules/:id/enable')
  enableRule(@Param('id') id: string) {
    const rule = this.autoReplyService.enable(id);
    if (!rule) {
      throw new NotFoundException(`Rule not found: ${id}`);
    }
    return rule;
  }

  @Post('rules/:id/disable')
  async disableRule(@Param('id') id: string) {
    // Stop listener when disabling
    await this.listenerService.stopListener(id);

    const rule = this.autoReplyService.disable(id);
    if (!rule) {
      throw new NotFoundException(`Rule not found: ${id}`);
    }
    return rule;
  }

  // ===== Listener Control =====

  @Post('rules/:id/start')
  async startListener(@Param('id') id: string) {
    const rule = this.autoReplyService.findById(id);
    if (!rule) {
      throw new NotFoundException(`Rule not found: ${id}`);
    }
    return this.listenerService.startListener(id);
  }

  @Post('rules/:id/stop')
  async stopListener(@Param('id') id: string) {
    const stopped = await this.listenerService.stopListener(id);
    if (!stopped) {
      // Return status anyway even if wasn't running
      return this.listenerService.getListenerStatus(id);
    }
    return this.listenerService.getListenerStatus(id);
  }

  @Get('listeners/status')
  getAllListenerStatuses() {
    return this.listenerService.getAllListenerStatuses();
  }

  @Get('listeners/active')
  getActiveListeners() {
    return this.listenerService.getActiveListenerStatuses();
  }

  @Get('rules/:id/listener-status')
  getListenerStatus(@Param('id') id: string) {
    const status = this.listenerService.getListenerStatus(id);
    if (!status) {
      throw new NotFoundException(`Rule not found: ${id}`);
    }
    return status;
  }

  // ===== Activity Log =====

  @Get('rules/:id/activity')
  getActivityLog(
    @Param('id') id: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const rule = this.autoReplyService.findById(id);
    if (!rule) {
      throw new NotFoundException(`Rule not found: ${id}`);
    }
    return this.autoReplyService.getActivityLog(
      id,
      limit ? parseInt(limit, 10) : 100,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get('activity/recent')
  getRecentActivity(@Query('limit') limit?: string) {
    return this.autoReplyService.getRecentActivity(limit ? parseInt(limit, 10) : 50);
  }

  @Post('rules/:ruleId/activity/:logId/resend')
  async resendReply(
    @Param('ruleId') ruleId: string,
    @Param('logId') logId: string,
  ) {
    return this.listenerService.resendReply(ruleId, logId);
  }

  @Delete('rules/:id/activity')
  @HttpCode(HttpStatus.NO_CONTENT)
  clearActivityLog(@Param('id') id: string) {
    const rule = this.autoReplyService.findById(id);
    if (!rule) {
      throw new NotFoundException(`Rule not found: ${id}`);
    }
    this.autoReplyService.clearActivityLog(id);
  }

  // ===== Template Testing =====

  @Post('template/test')
  testTemplate(@Body() dto: TestTemplateDto) {
    return this.templateService.testTemplate(dto.template, dto.sampleMessage);
  }

  @Get('template/variables')
  getAvailableVariables() {
    return this.templateService.getAvailableVariables();
  }
}
