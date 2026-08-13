import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { FirebaseService } from '../../shared/firebase/firebase.service';
import { DocumentNumberingService } from '../pdf/document-numbering.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly firebase: FirebaseService,
    private readonly numberingService: DocumentNumberingService
  ) {}

  async createOrderFromQuotation(quotationId: string, createdBy: string) {
    const db = this.firebase.db;
    const quotationRef = db.collection('quotations').doc(quotationId);
    
    return await db.runTransaction(async (t) => {
      const doc = await t.get(quotationRef);
      if (!doc.exists) {
        throw new NotFoundException('Quotation not found');
      }
      
      const quotationData = doc.data();
      if (quotationData?.status !== 'APPROVED') {
        throw new BadRequestException('Quotation must be APPROVED before converting to an order');
      }

      // Generate Order Number
      const orderNumber = await this.numberingService.generateDocumentNumber(quotationData.tenantId, 'OD');
      
      const orderRef = db.collection('orders').doc();
      const orderData = {
        tenantId: quotationData.tenantId,
        quotationId,
        orderNumber,
        customerId: quotationData.customerId || null,
        items: quotationData.items || [],
        subtotal: quotationData.subtotal || 0,
        vat: quotationData.vat || 0,
        total: quotationData.grandTotal || quotationData.total || 0,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        deliveryEvents: [],
        createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      t.set(orderRef, orderData);

      // Update Quotation Status
      t.update(quotationRef, { status: 'ORDERED' });

      return { id: orderRef.id, orderNumber, message: 'Order created successfully' };
    });
  }

  async updateOrderStatus(orderId: string, status: string, updatedBy: string, deliveryMeta?: any) {
    const validStatuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException('Invalid order status');
    }

    const db = this.firebase.db;
    const orderRef = db.collection('orders').doc(orderId);
    
    await db.runTransaction(async (t) => {
      const doc = await t.get(orderRef);
      if (!doc.exists) {
        throw new NotFoundException('Order not found');
      }

      const updates: any = {
        status,
        updatedAt: new Date(),
        updatedBy
      };

      if (status === 'SHIPPED' || status === 'DELIVERED') {
        const events = doc.data()?.deliveryEvents || [];
        events.push({
          status,
          date: new Date(),
          meta: deliveryMeta || null,
          recordedBy: updatedBy
        });
        updates.deliveryEvents = events;
      }

      t.update(orderRef, updates);
    });

    return { message: `Order status updated to ${status}` };
  }

  async getOrder(orderId: string) {
    const doc = await this.firebase.db.collection('orders').doc(orderId).get();
    if (!doc.exists) {
      throw new NotFoundException('Order not found');
    }
    return { id: doc.id, ...doc.data() };
  }

  async listOrders(tenantId: string = 'tenant_wrc_main') {
    const snapshot = await this.firebase.db.collection('orders')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();
      
    // Filter by tenantId in memory to avoid composite index requirement
    const allOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
    return allOrders.filter(order => order.tenantId === tenantId).slice(0, 50);
  }

  async findPendingOrderForGroup(groupId: string, tenantId: string = 'tenant_wrc_main') {
    // Find a pending order that was created from a quotation for this group
    // In our simplified model, we'll find recent orders and filter by groupId via quotation
    // To avoid complex composite indexes, we query by status=PENDING, 
    // then sort and filter in memory.
    const snapshot = await this.firebase.db.collection('orders')
      .where('status', '==', 'PENDING')
      .get();
      
    let pendingOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
    
    // In-memory filter and sort
    pendingOrders = pendingOrders
      .filter(o => o.tenantId === tenantId && o.paymentStatus === 'PENDING')
      .sort((a, b) => (b.createdAt?._seconds || 0) - (a.createdAt?._seconds || 0));
      
    // Since order itself might not have groupId directly if we stored customerId, 
    // let's fetch the quotation to verify groupId.
    for (const order of pendingOrders) {
      if (order.quotationId) {
        const quoteDoc = await this.firebase.db.collection('quotations').doc(order.quotationId).get();
        if (quoteDoc.exists && quoteDoc.data()?.groupId === groupId) {
          return order;
        }
      }
    }
    
    return null;
  }

  async markOrderPaid(orderId: string, slipMeta: any, slipUrl?: string) {
    const db = this.firebase.db;
    const orderRef = db.collection('orders').doc(orderId);
    
    await db.runTransaction(async (t) => {
      const doc = await t.get(orderRef);
      if (!doc.exists) {
        throw new NotFoundException('Order not found');
      }

      const updates: any = {
        paymentStatus: 'PAID',
        status: 'CONFIRMED',
        paymentVerifiedAt: new Date(),
        slipVerification: slipMeta,
        updatedAt: new Date(),
      };
      
      if (slipUrl) {
        updates.slipUrl = slipUrl;
      }

      t.update(orderRef, updates);
    });

    return { message: 'Order marked as paid' };
  }

  async fixTotals() {
    const db = this.firebase.db;
    const snapshot = await db.collection('orders').where('total', '==', 0).get();
    let count = 0;

    for (const doc of snapshot.docs) {
      const order = doc.data();
      if (order.quotationId) {
        const quoteDoc = await db.collection('quotations').doc(order.quotationId).get();
        if (quoteDoc.exists) {
          const q = quoteDoc.data();
          const realTotal = q?.grandTotal || q?.total || 0;
          if (realTotal > 0) {
            await doc.ref.update({ total: realTotal });
            count++;
          }
        }
      }
    }
    return { message: `Fixed totals for ${count} orders` };
  }
}
