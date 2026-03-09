import { Module } from '@nestjs/common';
import { ConnectionsModule } from '../connections/connections.module';
import { AutoReplyController } from './auto-reply.controller';
import { AutoReplyService } from './auto-reply.service';
import { AutoReplyListenerService } from './auto-reply-listener.service';
import { MatcherService } from './matcher.service';
import { TemplateService } from './template.service';

@Module({
  imports: [ConnectionsModule],
  controllers: [AutoReplyController],
  providers: [
    AutoReplyService,
    AutoReplyListenerService,
    MatcherService,
    TemplateService,
  ],
  exports: [AutoReplyService, AutoReplyListenerService],
})
export class AutoReplyModule {}
