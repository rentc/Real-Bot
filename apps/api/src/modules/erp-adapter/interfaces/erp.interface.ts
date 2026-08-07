export interface IErpAdapter {
  /**
   * Synchronize products from ERP to local database.
   */
  syncProducts(): Promise<{ totalSynced: number; errors: any[] }>;

  /**
   * Synchronize active prices from ERP to local database.
   */
  syncPrices(): Promise<{ totalSynced: number; errors: any[] }>;

  /**
   * Synchronize warehouse stock levels from ERP to local database.
   */
  syncStockLevels(): Promise<{ totalSynced: number; errors: any[] }>;

  /**
   * Push a confirmed order to the ERP system for fulfillment.
   */
  pushOrder(orderId: string): Promise<{ success: boolean; erpReference?: string; error?: any }>;
}
