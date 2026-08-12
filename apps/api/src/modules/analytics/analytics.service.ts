import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../../shared/firebase/firebase.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly firebase: FirebaseService) {}

  async getDashboardMetrics(tenantId: string = 'tenant_wrc_main', groupId?: string, role?: string) {
    const db = this.firebase.db;
    
    // In a real production system with large data, these would be computed via Firebase Extensions
    // or Cloud Functions responding to writes, aggregating into a summary document.
    // For this prototype, we'll perform simple read aggregations.
    
    let quotationsQuery: any = db.collection('quotations').where('tenantId', '==', tenantId);
    let ordersQuery: any = db.collection('orders').where('tenantId', '==', tenantId);
    let approvalsQuery: any = db.collection('approval_requests').where('tenantId', '==', tenantId).where('status', '==', 'SUBMITTED');

    if (groupId) {
      quotationsQuery = quotationsQuery.where('groupId', '==', groupId);
      ordersQuery = ordersQuery.where('groupId', '==', groupId);
      approvalsQuery = approvalsQuery.where('groupId', '==', groupId);
    }
    
    if (role) {
      quotationsQuery = quotationsQuery.where('role', '==', role);
      ordersQuery = ordersQuery.where('role', '==', role);
      approvalsQuery = approvalsQuery.where('role', '==', role);
    }
    
    const [
      quotationsSnapshot,
      ordersSnapshot,
      approvalsSnapshot
    ] = await Promise.all([
      quotationsQuery.get(),
      ordersQuery.get(),
      approvalsQuery.get()
    ]);

    const totalQuotations = quotationsSnapshot.size;
    const totalOrders = ordersSnapshot.size;
    const pendingApprovals = approvalsSnapshot.size;
    
    let totalRevenue = 0;
    ordersSnapshot.forEach((doc: any) => {
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
