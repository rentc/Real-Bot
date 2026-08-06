import { Module } from '@nestjs/common';
import { MatchingService } from './matching.service';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [ProductsModule],
  providers: [MatchingService],
  exports: [MatchingService],
})
export class MatchingModule {}
