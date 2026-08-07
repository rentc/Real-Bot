import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(@Query('tenantId') tenantId?: string) {
    return this.productsService.findAll(tenantId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Get('test/seed')
  async seed() {
    return this.productsService.seed();
  }

  @Get('test/ai')
  async testAi(@Query('text') text: string) {
    try {
      const mockConfigService = { get: (key: string) => process.env[key] };
      const aiService = new (require('../../shared/ai/ai.service').AiService)(mockConfigService);
      return await aiService.extractQuotationRequest(text || 'ขอราคา NYY 4x6 100 เมตร');
    } catch (e: any) {
      return { error: e.message || String(e) };
    }
  }
}
