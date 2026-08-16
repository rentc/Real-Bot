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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const firebase_service_1 = require("../../shared/firebase/firebase.service");
const document_numbering_service_1 = require("../pdf/document-numbering.service");
let OrdersService = class OrdersService {
    constructor(firebase, numberingService) {
        this.firebase = firebase;
        this.numberingService = numberingService;
    }
    async createOrderFromQuotation(quotationId, createdBy) {
        const db = this.firebase.db;
        const quotationRef = db.collection('quotations').doc(quotationId);
        return await db.runTransaction(async (t) => {
            const doc = await t.get(quotationRef);
            if (!doc.exists) {
                throw new common_1.NotFoundException('Quotation not found');
            }
            const quotationData = doc.data();
            if (quotationData?.status !== 'APPROVED') {
                throw new common_1.BadRequestException('Quotation must be APPROVED before converting to an order');
            }
            const orderNumber = await this.numberingService.generateDocumentNumber(quotationData.tenantId, 'OD');
            const orderRef = db.collection('orders').doc();
            const orderData = {
                tenantId: quotationData.tenantId,
                quotationId,
                orderNumber,
                customerId: quotationData.customerId || quotationData.groupId || null,
                groupId: quotationData.groupId || null,
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
            t.update(quotationRef, { status: 'ORDERED' });
            return { id: orderRef.id, orderNumber, message: 'Order created successfully' };
        });
    }
    async updateOrderStatus(orderId, status, updatedBy, deliveryMeta) {
        const validStatuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
        if (!validStatuses.includes(status)) {
            throw new common_1.BadRequestException('Invalid order status');
        }
        const db = this.firebase.db;
        const orderRef = db.collection('orders').doc(orderId);
        await db.runTransaction(async (t) => {
            const doc = await t.get(orderRef);
            if (!doc.exists) {
                throw new common_1.NotFoundException('Order not found');
            }
            const updates = {
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
    async getOrder(orderId) {
        const doc = await this.firebase.db.collection('orders').doc(orderId).get();
        if (!doc.exists) {
            throw new common_1.NotFoundException('Order not found');
        }
        return { id: doc.id, ...doc.data() };
    }
    async listOrders(tenantId = 'tenant_wrc_main') {
        const snapshot = await this.firebase.db.collection('orders')
            .orderBy('createdAt', 'desc')
            .limit(100)
            .get();
        const allOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const tenantOrders = allOrders.filter(order => order.tenantId === tenantId).slice(0, 50);
        const ordersWithCustomerName = await Promise.all(tenantOrders.map(async (order) => {
            let customerName = null;
            if (order.groupId) {
                try {
                    const buyerDoc = await this.firebase.db.collection('buyerProfiles').doc(order.groupId).get();
                    if (buyerDoc.exists) {
                        const buyerData = buyerDoc.data();
                        customerName = buyerData?.companyName || null;
                    }
                }
                catch (e) { }
            }
            order.customerName = customerName;
            return order;
        }));
        return ordersWithCustomerName;
    }
    async findPendingOrderForGroup(groupId, tenantId = 'tenant_wrc_main') {
        const snapshot = await this.firebase.db.collection('orders')
            .where('status', '==', 'PENDING')
            .get();
        let pendingOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        pendingOrders = pendingOrders
            .filter(o => o.tenantId === tenantId && o.paymentStatus === 'PENDING')
            .sort((a, b) => (b.createdAt?._seconds || 0) - (a.createdAt?._seconds || 0));
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
    async markOrderPaid(orderId, slipMeta, slipUrl) {
        const db = this.firebase.db;
        const orderRef = db.collection('orders').doc(orderId);
        await db.runTransaction(async (t) => {
            const doc = await t.get(orderRef);
            if (!doc.exists) {
                throw new common_1.NotFoundException('Order not found');
            }
            const updates = {
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
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [firebase_service_1.FirebaseService,
        document_numbering_service_1.DocumentNumberingService])
], OrdersService);
