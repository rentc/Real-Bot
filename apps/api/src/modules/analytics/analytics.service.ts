import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../../shared/firebase/firebase.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly firebase: FirebaseService) {}

  async getDashboardMetrics(tenantId: string = 'tenant_wrc_main') {
    const db = this.firebase.db;
    
    // In a real production system with large data, these would be computed via Firebase Extensions
    // or Cloud Functions responding to writes, aggregating into a summary document.
    // For this prototype, we'll perform simple read aggregations.
    
    const [
      quotationsSnapshot,
      ordersSnapshot,
      approvalsSnapshot
    ] = await Promise.all([
      db.collection('quotations').where('tenantId', '==', tenantId).get(),
      db.collection('orders').where('tenantId', '==', tenantId).get(),
      db.collection('approval_requests').where('tenantId', '==', tenantId).where('status', '==', 'SUBMITTED').get()
    ]);

    const totalQuotations = quotationsSnapshot.size;
    const totalOrders = ordersSnapshot.size;
    const pendingApprovals = approvalsSnapshot.size;
    
    let totalRevenue = 0;
    ordersSnapshot.forEach(doc => {
      totalRevenue += doc.data().total || 0;
    });

    const conversionRate = totalQuotations > 0 ? (totalOrders / totalQuotations) * 100 : 0;

    return {
      totalQuotations,
      totalOrders,
      conversionRate: conversionRate.toFixed(2) + '%',
      totalRevenue,
      pendingApprovals,
    };
  }
}
