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
        total: quotationData.total || 0,
        status: 'PENDING',
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
      .where('tenantId', '==', tenantId)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
      
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}
