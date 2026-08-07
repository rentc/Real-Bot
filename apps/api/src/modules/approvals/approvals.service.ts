import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { FirebaseService } from '../../shared/firebase/firebase.service';

@Injectable()
export class ApprovalsService {
  constructor(private readonly firebase: FirebaseService) {}

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

    const requestRef = db.collection('approval_requests').doc();
    
    await requestRef.set({
      tenantId,
      quotationId,
      status: 'SUBMITTED',
      submittedBy,
      submittedAt: new Date(),
    });

    return { id: requestRef.id, message: 'Approval request submitted successfully' };
  }

  async approveRequest(requestId: string, approvedBy: string) {
    const db = this.firebase.db;
    const requestRef = db.collection('approval_requests').doc(requestId);
    
    await db.runTransaction(async (t) => {
      const doc = await t.get(requestRef);
      if (!doc.exists) {
        throw new NotFoundException('Approval request not found');
      }
      
      const data = doc.data();
      if (data?.status !== 'SUBMITTED') {
        throw new BadRequestException(`Request is in ${data?.status} state, cannot be approved`);
      }

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
      const quotationRef = db.collection('quotations').doc(data.quotationId);
      t.update(quotationRef, {
        status: 'APPROVED'
      });
    });

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
      
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}
