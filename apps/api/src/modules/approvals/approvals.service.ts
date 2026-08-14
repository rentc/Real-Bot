import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { FirebaseService } from '../../shared/firebase/firebase.service';
import { LineApiService } from '../line/line-api.service';
import { DocumentNumberingService } from '../pdf/document-numbering.service';

@Injectable()
export class ApprovalsService {
  constructor(
    private readonly firebase: FirebaseService,
    @Inject(forwardRef(() => LineApiService))
    private readonly lineApi: LineApiService,
    private readonly docNumbering: DocumentNumberingService,
  ) {}

  async submitQuotationForApproval(quotationId: string, submittedBy: string, tenantId: string = 'tenant_wrc_main') {
    const db = this.firebase.db;
    
    // Check if it's already submitted
    const existing = await db.collection('approval_requests')
      .where('quotationId', '==', quotationId)
      .where('status', '==', 'SUBMITTED')
      .get();
      
    if (!existing.empty) {
      throw new BadRequestException('Quotation is already pending approval.');
    }

    const requestId = await this.docNumbering.generateDocumentNumber(tenantId, 'RE');
    const requestRef = db.collection('approval_requests').doc(requestId);
    
    await requestRef.set({
      tenantId,
      quotationId,
      status: 'SUBMITTED',
      submittedBy,
      submittedAt: new Date(),
    });

    return { id: requestId, message: 'Approval request submitted successfully' };
  }

  async approveRequest(requestId: string, approvedBy: string) {
    const db = this.firebase.db;
    const requestRef = db.collection('approval_requests').doc(requestId);
    
    let quotationData: any = null;

    await db.runTransaction(async (t) => {
      // 1. All Reads
      const doc = await t.get(requestRef);
      if (!doc.exists) {
        throw new NotFoundException('Approval request not found');
      }
      
      const data = doc.data();
      if (data?.status !== 'SUBMITTED') {
        throw new BadRequestException(`Request is in ${data?.status} state, cannot be approved`);
      }

      const quotationRef = db.collection('quotations').doc(data.quotationId);
      const quotationDoc = await t.get(quotationRef);
      quotationData = quotationDoc.data();
      if (quotationData) {
        quotationData.id = quotationDoc.id;
      }

      // 2. All Writes
      // Update request status
      t.update(requestRef, {
        status: 'APPROVED',
        approvedBy,
        approvedAt: new Date()
      });

      // Audit log
      const actionRef = db.collection('approval_actions').doc();
      t.set(actionRef, {
        requestId,
        action: 'APPROVE',
        actedBy: approvedBy,
        actedAt: new Date()
      });
      
      // Update quotation status if needed
      t.update(quotationRef, {
        status: 'APPROVED'
      });
    });

    if (quotationData && quotationData.groupId) {
      const dateStr = new Date(quotationData.createdAt?.toDate() || new Date()).toLocaleDateString('th-TH');
      
      let itemsText = '';
      const formatCurrency = (amount: number) => {
        return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      };

      for (const item of (quotationData.items || [])) {
        itemsText += `• ${item.name} x ${item.quantity} = ฿${formatCurrency(item.total)}\n`;
      }
      
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api-e5mpppexfq-an.a.run.app/api';
      const pdfUrl = `${apiBaseUrl}/quotations/${quotationData.id}/pdf`;
      
      let pushText = `✅ ใบเสนอราคาได้รับการอนุมัติแล้วครับ\n\n`;
      pushText += `📄 เลขที่: ${quotationData.id}\n`;
      pushText += `📅 วันที่: ${dateStr}\n\n`;
      pushText += `รายการสินค้า:\n`;
      pushText += itemsText;
      pushText += `-----------------------\n`;
      pushText += `ยอดก่อน VAT: ฿${formatCurrency(quotationData.subtotal)}\n`;
      pushText += `VAT 7%: ฿${formatCurrency(quotationData.vat)}\n`;
      pushText += `ยอดรวมทั้งสิ้น: ฿${formatCurrency(quotationData.grandTotal)}\n\n`;
      pushText += `📥 ดาวน์โหลดใบเสนอราคา (PDF):\n${pdfUrl}\n\n`;
      pushText += `✅ แอดมินอนุมัติเรียบร้อยแล้ว ลูกค้าสามารถตรวจสอบใบเสนอราคาและคลิกยืนยันด้านล่างเพื่อสั่งซื้อได้เลยครับ`;
      
      await this.lineApi.pushMessage(quotationData.groupId, [
        {
          type: 'text',
          text: pushText,
          quickReply: {
            items: [
              {
                type: 'action',
                action: {
                  type: 'message',
                  label: 'ยืนยันการสั่งซื้อ',
                  text: `#order ${quotationData.id}`
                }
              }
            ]
          }
        }
      ]);
    }

    return { message: 'Quotation approved successfully' };
  }

  async rejectRequest(requestId: string, rejectedBy: string, reason?: string) {
    const db = this.firebase.db;
    const requestRef = db.collection('approval_requests').doc(requestId);
    
    await db.runTransaction(async (t) => {
      const doc = await t.get(requestRef);
      if (!doc.exists) {
        throw new NotFoundException('Approval request not found');
      }
      
      const data = doc.data();
      if (data?.status !== 'SUBMITTED') {
        throw new BadRequestException(`Request is in ${data?.status} state, cannot be rejected`);
      }

      // Update request status
      t.update(requestRef, {
        status: 'REJECTED',
        rejectedBy,
        rejectReason: reason || null,
        rejectedAt: new Date()
      });

      // Audit log
      const actionRef = db.collection('approval_actions').doc();
      t.set(actionRef, {
        requestId,
        action: 'REJECT',
        actedBy: rejectedBy,
        reason: reason || null,
        actedAt: new Date()
      });
      
      // Update quotation status if needed
      const quotationRef = db.collection('quotations').doc(data.quotationId);
      t.update(quotationRef, {
        status: 'DRAFT' // Or REJECTED
      });
    });

    return { message: 'Quotation rejected successfully' };
  }

  async listPending(tenantId: string = 'tenant_wrc_main') {
    const snapshot = await this.firebase.db.collection('approval_requests')
      .where('tenantId', '==', tenantId)
      .where('status', '==', 'SUBMITTED')
      .orderBy('submittedAt', 'desc')
      .limit(50)
      .get();
      
    const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Fetch quotation details for each request
    const requestsWithDetails = await Promise.all(requests.map(async (req: any) => {
      try {
        const quotationDoc = await this.firebase.db.collection('quotations').doc(req.quotationId).get();
        if (quotationDoc.exists) {
          req.quotation = { id: quotationDoc.id, ...quotationDoc.data() };
        }
      } catch (e) {
        console.error(`Failed to fetch quotation details for ${req.quotationId}`, e);
      }
      return req;
    }));
    
    return requestsWithDetails;
  }

  async listHistory(tenantId: string = 'tenant_wrc_main') {
    const snapshot = await this.firebase.db.collection('approval_requests')
      .where('tenantId', '==', tenantId)
      .where('status', 'in', ['APPROVED', 'REJECTED'])
      .orderBy('submittedAt', 'desc')
      .limit(50)
      .get();
      
    const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Fetch quotation details for each request
    const requestsWithDetails = await Promise.all(requests.map(async (req: any) => {
      try {
        const quotationDoc = await this.firebase.db.collection('quotations').doc(req.quotationId).get();
        if (quotationDoc.exists) {
          req.quotation = { id: quotationDoc.id, ...quotationDoc.data() };
        }
      } catch (e) {
        console.error(`Failed to fetch quotation details for ${req.quotationId}`, e);
      }
      return req;
    }));
    
    return requestsWithDetails;
  }

  async deleteRequest(requestId: string) {
    const db = this.firebase.db;
    const requestRef = db.collection('approval_requests').doc(requestId);
    
    // Delete the request entirely so it no longer shows up in either list.
    // We do not delete the actual quotation to preserve history, just the approval request view.
    await requestRef.delete();
    
    return { message: 'Request deleted successfully' };
  }
}
