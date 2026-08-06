import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { PricesService } from './prices.service';

@Controller('prices')
export class PricesController {
  constructor(private readonly pricesService: PricesService) {}

  @Get('active')
  async getActivePrice(@Query('productId') productId: string, @Query('tenantId') tenantId: string) {
    if (!productId || !tenantId) throw new BadRequestException('productId and tenantId are required');
    const price = await this.pricesService.getActivePrice(productId, tenantId);
    return { productId, tenantId, price };
  }
}
