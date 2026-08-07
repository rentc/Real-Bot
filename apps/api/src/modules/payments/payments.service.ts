import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { FirebaseService } from '../../shared/firebase/firebase.service';
import { DocumentNumberingService } from '../pdf/document-numbering.service';
import { PdfService } from '../pdf/pdf.service';
import { wrcReceiptTemplate } from '../pdf/templates/wrc-receipt.template';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly firebase: FirebaseService,
    private readonly numberingService: DocumentNumberingService,
    private readonly pdfService: PdfService
  ) {}

  async submitPaymentEvidence(orderId: string, amount: number, evidenceUrl: string, submittedBy: string) {
    const db = this.firebase.db;
    const orderRef = db.collection('orders').doc(orderId);
    
    return await db.runTransaction(async (t) => {
      const doc = await t.get(orderRef);
      if (!doc.exists) {
        throw new NotFoundException('Order not found');
      }

      const paymentRef = db.collection('payments').doc();
      const paymentData = {
        tenantId: doc.data()?.tenantId,
        orderId,
        amount,
        evidenceUrl,
        status: 'PENDING_VERIFICATION',
        submittedBy,
        submittedAt: new Date(),
      };

      t.set(paymentRef, paymentData);
      
      // Update order to indicate payment is submitted
      t.update(orderRef, { paymentStatus: 'EVIDENCE_SUBMITTED' });

      return { id: paymentRef.id, message: 'Payment evidence submitted successfully' };
    });
  }

  async verifyPayment(paymentId: string, verifiedBy: string) {
    const db = this.firebase.db;
    const paymentRef = db.collection('payments').doc(paymentId);
    
    return await db.runTransaction(async (t) => {
      const doc = await t.get(paymentRef);
      if (!doc.exists) {
        throw new NotFoundException('Payment not found');
      }
      
      const paymentData = doc.data();
      if (paymentData?.status !== 'PENDING_VERIFICATION') {
        throw new BadRequestException('Payment is not pending verification');
      }

      t.update(paymentRef, {
        status: 'VERIFIED',
        verifiedBy,
        verifiedAt: new Date()
      });

      const orderRef = db.collection('orders').doc(paymentData.orderId);
      t.update(orderRef, { paymentStatus: 'PAID' });

      return { message: 'Payment verified successfully' };
    });
  }

  async generateReceipt(orderId: string, generatedBy: string) {
    const db = this.firebase.db;
    const orderRef = db.collection('orders').doc(orderId);
    
    const doc = await orderRef.get();
    if (!doc.exists) {
      throw new NotFoundException('Order not found');
    }
    
    const orderData = doc.data();
    if (orderData?.paymentStatus !== 'PAID') {
      throw new BadRequestException('Cannot generate receipt for unpaid order');
    }

    // Check if receipt already exists
    const existingReceipts = await db.collection('receipts').where('orderId', '==', orderId).get();
    if (!existingReceipts.empty) {
      return { message: 'Receipt already exists', receiptId: existingReceipts.docs[0].id };
    }

    const receiptNumber = await this.numberingService.generateDocumentNumber(orderData.tenantId, 'RC');
    
    const receiptData = {
      ...orderData,
      documentNumber: receiptNumber,
      orderId,
    };
    
    const htmlContent = wrcReceiptTemplate(receiptData);
    const pdfBuffer = await this.pdfService.generatePdfFromHtml(htmlContent);
    
    // In a real scenario, we would upload pdfBuffer to Firebase Storage and get a URL.
    // For this implementation, we just record the receipt document.
    const receiptRef = db.collection('receipts').doc();
    await receiptRef.set({
      tenantId: orderData.tenantId,
      orderId,
      receiptNumber,
      generatedBy,
      generatedAt: new Date(),
    });

    return { id: receiptRef.id, receiptNumber, message: 'Receipt generated successfully' };
  }
}
