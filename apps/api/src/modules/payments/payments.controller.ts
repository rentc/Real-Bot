import { Controller, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post(':orderId/evidence')
  async submitEvidence(
    @Param('orderId') orderId: string,
    @Body('amount') amount: number,
    @Body('evidenceUrl') evidenceUrl: string,
    @Request() req: any
  ) {
    const userId = req.user?.id || 'anonymous_user';
    return this.paymentsService.submitPaymentEvidence(orderId, amount, evidenceUrl, userId);
  }

  @Post(':paymentId/verify')
  async verifyPayment(@Param('paymentId') paymentId: string, @Request() req: any) {
    const userId = req.user?.id || 'anonymous_admin';
    return this.paymentsService.verifyPayment(paymentId, userId);
  }

  @Post(':orderId/receipt')
  async generateReceipt(@Param('orderId') orderId: string, @Request() req: any) {
    const userId = req.user?.id || 'anonymous_admin';
    return this.paymentsService.generateReceipt(orderId, userId);
  }
}
