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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const firebase_service_1 = require("../../shared/firebase/firebase.service");
let AnalyticsService = class AnalyticsService {
    constructor(firebase) {
        this.firebase = firebase;
    }
    async getDashboardMetrics(tenantId = 'tenant_wrc_main') {
        const db = this.firebase.db;
        const [quotationsSnapshot, ordersSnapshot, approvalsSnapshot] = await Promise.all([
            db.collection('quotations').where('tenantId', '==', tenantId).get(),
            db.collection('orders').where('tenantId', '==', tenantId).get(),
            db.collection('approval_requests').where('tenantId', '==', tenantId).where('status', '==', 'SUBMITTED').get()
        ]);
        const totalQuotations = quotationsSnapshot.size;
        const totalOrders = ordersSnapshot.size;
        const pendingApprovals = approvalsSnapshot.size;
        let totalRevenue = 0;
        ordersSnapshot.forEach(doc => {
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
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [firebase_service_1.FirebaseService])
], AnalyticsService);
