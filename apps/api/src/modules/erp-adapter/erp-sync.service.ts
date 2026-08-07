import { Injectable, Logger } from '@nestjs/common';
import { IErpAdapter } from './interfaces/erp.interface';

@Injectable()
export class ErpSyncService implements IErpAdapter {
  private readonly logger = new Logger(ErpSyncService.name);

  async syncProducts() {
    this.logger.warn('ERP syncProducts is not implemented yet.');
    return { totalSynced: 0, errors: [] };
  }

  async syncPrices() {
    this.logger.warn('ERP syncPrices is not implemented yet.');
    return { totalSynced: 0, errors: [] };
  }

  async syncStockLevels() {
    this.logger.warn('ERP syncStockLevels is not implemented yet.');
    return { totalSynced: 0, errors: [] };
  }

  async pushOrder(orderId: string) {
    this.logger.warn(`ERP pushOrder called for order ${orderId} but not implemented yet.`);
    return { success: true, erpReference: 'mock_erp_ref_001' };
  }
}
