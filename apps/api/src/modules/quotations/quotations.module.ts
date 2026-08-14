import { Module } from '@nestjs/common';
import { QuotationsService } from './quotations.service';
import { QuotationsController } from './quotations.controller';
import { PricesModule } from '../prices/prices.module';
import { MatchingModule } from '../matching/matching.module';
import { PdfModule } from '../pdf/pdf.module';

@Module({
  imports: [PricesModule, MatchingModule, PdfModule],
  controllers: [QuotationsController],
  providers: [QuotationsService],
  exports: [QuotationsService],
})
export class QuotationsModule {}
