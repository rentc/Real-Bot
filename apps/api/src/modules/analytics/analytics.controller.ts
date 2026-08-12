import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get main dashboard metrics' })
  async getDashboard(
    @Query('groupId') groupId?: string,
    @Query('role') role?: string,
  ) {
    return this.analyticsService.getDashboardMetrics('tenant_wrc_main', groupId, role);
  }
}
