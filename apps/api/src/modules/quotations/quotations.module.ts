import { Module } from '@nestjs/common';
import { QuotationsService } from './quotations.service';
import { PricesModule } from '../prices/prices.module';
import { MatchingModule } from '../matching/matching.module';

@Module({
  imports: [PricesModule, MatchingModule],
  providers: [QuotationsService],
  exports: [QuotationsService],
})
export class QuotationsModule {}
