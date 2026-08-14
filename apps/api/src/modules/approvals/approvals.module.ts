import { Module, forwardRef } from '@nestjs/common';
import { ApprovalsService } from './approvals.service';
import { ApprovalsController } from './approvals.controller';
import { LineModule } from '../line/line.module';
import { PdfModule } from '../pdf/pdf.module';

@Module({
  imports: [forwardRef(() => LineModule), PdfModule],
  controllers: [ApprovalsController],
  providers: [ApprovalsService],
  exports: [ApprovalsService],
})
export class ApprovalsModule {}
