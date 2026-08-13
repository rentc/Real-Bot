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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalsService = void 0;
const common_1 = require("@nestjs/common");
const firebase_service_1 = require("../../shared/firebase/firebase.service");
const line_api_service_1 = require("../line/line-api.service");
let ApprovalsService = class ApprovalsService {
    constructor(firebase, lineApi) {
        this.firebase = firebase;
        this.lineApi = lineApi;
    }
    async submitQuotationForApproval(quotationId, submittedBy, tenantId = 'tenant_wrc_main') {
        const db = this.firebase.db;
        const existing = await db.collection('approval_requests')
            .where('quotationId', '==', quotationId)
            .where('status', '==', 'SUBMITTED')
            .get();
        if (!existing.empty) {
            throw new common_1.BadRequestException('Quotation is already pending approval.');
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
    async approveRequest(requestId, approvedBy) {
        const db = this.firebase.db;
        const requestRef = db.collection('approval_requests').doc(requestId);
        let quotationData = null;
        await db.runTransaction(async (t) => {
            const doc = await t.get(requestRef);
            if (!doc.exists) {
                throw new common_1.NotFoundException('Approval request not found');
            }
            const data = doc.data();
            if (data?.status !== 'SUBMITTED') {
                throw new common_1.BadRequestException(`Request is in ${data?.status} state, cannot be approved`);
            }
            const quotationRef = db.collection('quotations').doc(data.quotationId);
            const quotationDoc = await t.get(quotationRef);
            quotationData = quotationDoc.data();
            if (quotationData) {
                quotationData.id = quotationDoc.id;
            }
            t.update(requestRef, {
                status: 'APPROVED',
                approvedBy,
                approvedAt: new Date()
            });
            const actionRef = db.collection('approval_actions').doc();
            t.set(actionRef, {
                requestId,
                action: 'APPROVE',
                actedBy: approvedBy,
                actedAt: new Date()
            });
            t.update(quotationRef, {
                status: 'APPROVED'
            });
        });
        if (quotationData && quotationData.groupId) {
            const dateStr = new Date(quotationData.createdAt?.toDate() || new Date()).toLocaleDateString('th-TH');
            let itemsText = '';
            const formatCurrency = (amount) => {
                return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            };
            for (const item of (quotationData.items || [])) {
                itemsText += `• ${item.name} x ${item.quantity} = ฿${formatCurrency(item.total)}\n`;
            }
            let pushText = `✅ ใบเสนอราคาได้รับการอนุมัติแล้วครับ\n\n`;
            pushText += `📄 เลขที่: ${quotationData.id}\n`;
            pushText += `📅 วันที่: ${dateStr}\n\n`;
            pushText += `รายการสินค้า:\n`;
            pushText += itemsText;
            pushText += `-----------------------\n`;
            pushText += `ยอดก่อน VAT: ฿${formatCurrency(quotationData.subtotal)}\n`;
            pushText += `VAT 7%: ฿${formatCurrency(quotationData.vat)}\n`;
            pushText += `ยอดรวมทั้งสิ้น: ฿${formatCurrency(quotationData.grandTotal)}\n\n`;
            pushText += `✅ แอดมินอนุมัติเรียบร้อยแล้ว ลูกค้าสามารถยืนยันและดำเนินการชำระเงินได้เลยครับ`;
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
    async rejectRequest(requestId, rejectedBy, reason) {
        const db = this.firebase.db;
        const requestRef = db.collection('approval_requests').doc(requestId);
        await db.runTransaction(async (t) => {
            const doc = await t.get(requestRef);
            if (!doc.exists) {
                throw new common_1.NotFoundException('Approval request not found');
            }
            const data = doc.data();
            if (data?.status !== 'SUBMITTED') {
                throw new common_1.BadRequestException(`Request is in ${data?.status} state, cannot be rejected`);
            }
            t.update(requestRef, {
                status: 'REJECTED',
                rejectedBy,
                rejectReason: reason || null,
                rejectedAt: new Date()
            });
            const actionRef = db.collection('approval_actions').doc();
            t.set(actionRef, {
                requestId,
                action: 'REJECT',
                actedBy: rejectedBy,
                reason: reason || null,
                actedAt: new Date()
            });
            const quotationRef = db.collection('quotations').doc(data.quotationId);
            t.update(quotationRef, {
                status: 'DRAFT'
            });
        });
        return { message: 'Quotation rejected successfully' };
    }
    async listPending(tenantId = 'tenant_wrc_main') {
        const snapshot = await this.firebase.db.collection('approval_requests')
            .where('tenantId', '==', tenantId)
            .where('status', '==', 'SUBMITTED')
            .orderBy('submittedAt', 'desc')
            .limit(50)
            .get();
        const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const requestsWithDetails = await Promise.all(requests.map(async (req) => {
            try {
                const quotationDoc = await this.firebase.db.collection('quotations').doc(req.quotationId).get();
                if (quotationDoc.exists) {
                    req.quotation = { id: quotationDoc.id, ...quotationDoc.data() };
                }
            }
            catch (e) {
                console.error(`Failed to fetch quotation details for ${req.quotationId}`, e);
            }
            return req;
        }));
        return requestsWithDetails;
    }
    async listHistory(tenantId = 'tenant_wrc_main') {
        const snapshot = await this.firebase.db.collection('approval_requests')
            .where('tenantId', '==', tenantId)
            .where('status', 'in', ['APPROVED', 'REJECTED'])
            .orderBy('submittedAt', 'desc')
            .limit(50)
            .get();
        const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const requestsWithDetails = await Promise.all(requests.map(async (req) => {
            try {
                const quotationDoc = await this.firebase.db.collection('quotations').doc(req.quotationId).get();
                if (quotationDoc.exists) {
                    req.quotation = { id: quotationDoc.id, ...quotationDoc.data() };
                }
            }
            catch (e) {
                console.error(`Failed to fetch quotation details for ${req.quotationId}`, e);
            }
            return req;
        }));
        return requestsWithDetails;
    }
    async deleteRequest(requestId) {
        const db = this.firebase.db;
        const requestRef = db.collection('approval_requests').doc(requestId);
        await requestRef.delete();
        return { message: 'Request deleted successfully' };
    }
};
exports.ApprovalsService = ApprovalsService;
exports.ApprovalsService = ApprovalsService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => line_api_service_1.LineApiService))),
    __metadata("design:paramtypes", [firebase_service_1.FirebaseService,
        line_api_service_1.LineApiService])
], ApprovalsService);
