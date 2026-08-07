import { Controller, Post, Param, Body, UseGuards, Request, Get } from '@nestjs/common';
import { ApprovalsService } from './approvals.service';

@Controller('approvals')
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Post('request')
  async requestApproval(@Body('quotationId') quotationId: string, @Request() req: any) {
    const userId = req.user?.id || 'anonymous_user'; // Fallback if auth is not fully hooked up
    return this.approvalsService.submitQuotationForApproval(quotationId, userId);
  }

  @Post(':id/approve')
  async approve(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.id || 'anonymous_admin'; // Fallback if auth is not fully hooked up
    return this.approvalsService.approveRequest(id, userId);
  }

  @Post(':id/reject')
  async reject(@Param('id') id: string, @Body('reason') reason: string, @Request() req: any) {
    const userId = req.user?.id || 'anonymous_admin'; // Fallback if auth is not fully hooked up
    return this.approvalsService.rejectRequest(id, userId, reason);
  }

  @Get()
  async listPending() {
    return this.approvalsService.listPending();
  }
}
