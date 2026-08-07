"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ErpSyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErpSyncService = void 0;
const common_1 = require("@nestjs/common");
let ErpSyncService = ErpSyncService_1 = class ErpSyncService {
    constructor() {
        this.logger = new common_1.Logger(ErpSyncService_1.name);
    }
    async syncProducts() {
        this.logger.warn('ERP syncProducts is not implemented yet.');
        return { totalSynced: 0, errors: [] };
    }
    async syncPrices() {
        this.logger.warn('ERP syncPrices is not implemented yet.');
        return { totalSynced: 0, errors: [] };
    }
    async syncStockLevels() {
        this.logger.warn('ERP syncStockLevels is not implemented yet.');
        return { totalSynced: 0, errors: [] };
    }
    async pushOrder(orderId) {
        this.logger.warn(`ERP pushOrder called for order ${orderId} but not implemented yet.`);
        return { success: true, erpReference: 'mock_erp_ref_001' };
    }
};
exports.ErpSyncService = ErpSyncService;
exports.ErpSyncService = ErpSyncService = ErpSyncService_1 = __decorate([
    (0, common_1.Injectable)()
], ErpSyncService);
