"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const firebase_service_1 = require("../../shared/firebase/firebase.service");
const document_numbering_service_1 = require("../pdf/document-numbering.service");
const pdf_service_1 = require("../pdf/pdf.service");
const wrc_receipt_template_1 = require("../pdf/templates/wrc-receipt.template");
let PaymentsService = class PaymentsService {
    constructor(firebase, numberingService, pdfService) {
        this.firebase = firebase;
        this.numberingService = numberingService;
        this.pdfService = pdfService;
    }
    async submitPaymentEvidence(orderId, amount, evidenceUrl, submittedBy) {
        const db = this.firebase.db;
        const orderRef = db.collection('orders').doc(orderId);
        return await db.runTransaction(async (t) => {
            const doc = await t.get(orderRef);
            if (!doc.exists) {
                throw new common_1.NotFoundException('Order not found');
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
            t.update(orderRef, { paymentStatus: 'EVIDENCE_SUBMITTED' });
            return { id: paymentRef.id, message: 'Payment evidence submitted successfully' };
        });
    }
    async verifyPayment(paymentId, verifiedBy) {
        const db = this.firebase.db;
        const paymentRef = db.collection('payments').doc(paymentId);
        return await db.runTransaction(async (t) => {
            const doc = await t.get(paymentRef);
            if (!doc.exists) {
                throw new common_1.NotFoundException('Payment not found');
            }
            const paymentData = doc.data();
            if (paymentData?.status !== 'PENDING_VERIFICATION') {
                throw new common_1.BadRequestException('Payment is not pending verification');
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
    async generateReceipt(orderId, generatedBy) {
        const db = this.firebase.db;
        const orderRef = db.collection('orders').doc(orderId);
        const doc = await orderRef.get();
        if (!doc.exists) {
            throw new common_1.NotFoundException('Order not found');
        }
        const orderData = doc.data();
        if (orderData?.paymentStatus !== 'PAID') {
            throw new common_1.BadRequestException('Cannot generate receipt for unpaid order');
        }
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
        const htmlContent = (0, wrc_receipt_template_1.wrcReceiptTemplate)(receiptData);
        const pdfBuffer = await this.pdfService.generatePdfFromHtml(htmlContent);
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
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [firebase_service_1.FirebaseService,
        document_numbering_service_1.DocumentNumberingService,
        pdf_service_1.PdfService])
], PaymentsService);
