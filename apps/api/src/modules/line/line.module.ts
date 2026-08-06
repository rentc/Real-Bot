import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GroupsModule } from '../groups/groups.module';
import { UsersModule } from '../users/users.module';
import { LineApiService } from './line-api.service';
import { LineWebhookController } from './line-webhook.controller';
import { LineWebhookService } from './line-webhook.service';

import { AiModule } from '../../shared/ai/ai.module';
import { SessionsModule } from '../sessions/sessions.module';
import { QuotationsModule } from '../quotations/quotations.module';

@Module({
  imports: [ConfigModule, GroupsModule, UsersModule, AiModule, SessionsModule, QuotationsModule],
  providers: [LineApiService, LineWebhookService],
  controllers: [LineWebhookController],
  exports: [LineApiService],
})
export class LineModule {}
