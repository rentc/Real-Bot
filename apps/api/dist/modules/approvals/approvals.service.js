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
exports.ApprovalsService = void 0;
const common_1 = require("@nestjs/common");
const firebase_service_1 = require("../../shared/firebase/firebase.service");
let ApprovalsService = class ApprovalsService {
    constructor(firebase) {
        this.firebase = firebase;
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
        await db.runTransaction(async (t) => {
            const doc = await t.get(requestRef);
            if (!doc.exists) {
                throw new common_1.NotFoundException('Approval request not found');
            }
            const data = doc.data();
            if (data?.status !== 'SUBMITTED') {
                throw new common_1.BadRequestException(`Request is in ${data?.status} state, cannot be approved`);
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
            const quotationRef = db.collection('quotations').doc(data.quotationId);
            t.update(quotationRef, {
                status: 'APPROVED'
            });
        });
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
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
};
exports.ApprovalsService = ApprovalsService;
exports.ApprovalsService = ApprovalsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [firebase_service_1.FirebaseService])
], ApprovalsService);
