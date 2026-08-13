import { Controller, Post, Param, Body, UseGuards, Request, Patch, Get } from '@nestjs/common';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('from-quotation/:quotationId')
  async createFromQuotation(@Param('quotationId') quotationId: string, @Request() req: any) {
    const userId = req.user?.id || 'anonymous_admin';
    return this.ordersService.createOrderFromQuotation(quotationId, userId);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string, 
    @Body('status') status: string, 
    @Body('deliveryMeta') deliveryMeta: any,
    @Request() req: any
  ) {
    const userId = req.user?.id || 'anonymous_admin';
    return this.ordersService.updateOrderStatus(id, status, userId, deliveryMeta);
  }

  @Get()
  async listOrders() {
    return this.ordersService.listOrders();
  }

  @Patch('fix-totals')
  async fixTotals() {
    return this.ordersService.fixTotals();
  }

  @Get(':id')
  async getOrder(@Param('id') id: string) {
    return this.ordersService.getOrder(id);
  }
}
