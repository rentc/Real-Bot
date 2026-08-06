import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { StockService } from './stock.service';

@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get()
  async getStock(@Query('productId') productId: string) {
    if (!productId) throw new BadRequestException('productId is required');
    return this.stockService.getStock(productId);
  }
}
