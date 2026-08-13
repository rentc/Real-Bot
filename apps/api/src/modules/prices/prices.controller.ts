import { Controller, Get, Post, Query, Body, BadRequestException, NotFoundException } from '@nestjs/common';
import { PricesService } from './prices.service';
import { ProductsService } from '../products/products.service';

@Controller('prices')
export class PricesController {
  constructor(
    private readonly pricesService: PricesService,
    private readonly productsService: ProductsService
  ) {}

  @Get('active')
  async getActivePrice(@Query('productId') productId: string, @Query('tenantId') tenantId: string, @Query('groupId') groupId: string) {
    if (!productId || !tenantId) throw new BadRequestException('productId and tenantId are required');
    
    let product;
    try {
      product = await this.productsService.findOne(productId);
    } catch (e) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    const price = await this.pricesService.getNetPrice(product, groupId || 'unknown', tenantId);
    return { productId, tenantId, price };
  }

  @Get('overrides')
  async getOverrides(@Query('groupId') groupId: string, @Query('tenantId') tenantId: string) {
    if (!groupId || !tenantId) throw new BadRequestException('groupId and tenantId are required');
    const overrides = await this.pricesService.getOverrides(groupId, tenantId);
    return overrides;
  }

  @Post('overrides')
  async setOverride(
    @Query('groupId') qGroupId: string, 
    @Query('tenantId') qTenantId: string,
    @Query('productId') qProductId: string,
    @Query('discount') qDiscount: number,
    @Body() body: any
  ) {
    const groupId = body?.groupId || qGroupId;
    const tenantId = body?.tenantId || qTenantId;
    const productId = body?.productId || qProductId;
    const discount = body?.finalDiscount !== undefined ? body?.finalDiscount : qDiscount;
    const adjustmentPercent = body?.adjustmentPercent;

    if (!groupId || !tenantId || !productId || discount === undefined) {
      throw new BadRequestException('groupId, tenantId, productId, and discount are required');
    }
    const result = await this.pricesService.setOverride(groupId, tenantId, productId, Number(discount), adjustmentPercent);
    return result;
  }
}
