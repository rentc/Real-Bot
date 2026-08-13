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
exports.PricesController = void 0;
const common_1 = require("@nestjs/common");
const prices_service_1 = require("./prices.service");
const products_service_1 = require("../products/products.service");
let PricesController = class PricesController {
    constructor(pricesService, productsService) {
        this.pricesService = pricesService;
        this.productsService = productsService;
    }
    async getActivePrice(productId, tenantId, groupId) {
        if (!productId || !tenantId)
            throw new common_1.BadRequestException('productId and tenantId are required');
        let product;
        try {
            product = await this.productsService.findOne(productId);
        }
        catch (e) {
            throw new common_1.NotFoundException(`Product ${productId} not found`);
        }
        const price = await this.pricesService.getNetPrice(product, groupId || 'unknown', tenantId);
        return { productId, tenantId, price };
    }
    async getOverrides(groupId, tenantId) {
        if (!groupId || !tenantId)
            throw new common_1.BadRequestException('groupId and tenantId are required');
        const overrides = await this.pricesService.getOverrides(groupId, tenantId);
        return overrides;
    }
    async setOverride(qGroupId, qTenantId, qProductId, qDiscount, body) {
        const groupId = body?.groupId || qGroupId;
        const tenantId = body?.tenantId || qTenantId;
        const productId = body?.productId || qProductId;
        const discount = body?.finalDiscount !== undefined ? body?.finalDiscount : qDiscount;
        const adjustmentPercent = body?.adjustmentPercent;
        if (!groupId || !tenantId || !productId || discount === undefined) {
            throw new common_1.BadRequestException('groupId, tenantId, productId, and discount are required');
        }
        const result = await this.pricesService.setOverride(groupId, tenantId, productId, Number(discount), adjustmentPercent);
        return result;
    }
};
exports.PricesController = PricesController;
__decorate([
    (0, common_1.Get)('active'),
    __param(0, (0, common_1.Query)('productId')),
    __param(1, (0, common_1.Query)('tenantId')),
    __param(2, (0, common_1.Query)('groupId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], PricesController.prototype, "getActivePrice", null);
__decorate([
    (0, common_1.Get)('overrides'),
    __param(0, (0, common_1.Query)('groupId')),
    __param(1, (0, common_1.Query)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PricesController.prototype, "getOverrides", null);
__decorate([
    (0, common_1.Post)('overrides'),
    __param(0, (0, common_1.Query)('groupId')),
    __param(1, (0, common_1.Query)('tenantId')),
    __param(2, (0, common_1.Query)('productId')),
    __param(3, (0, common_1.Query)('discount')),
    __param(4, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Number, Object]),
    __metadata("design:returntype", Promise)
], PricesController.prototype, "setOverride", null);
exports.PricesController = PricesController = __decorate([
    (0, common_1.Controller)('prices'),
    __metadata("design:paramtypes", [prices_service_1.PricesService,
        products_service_1.ProductsService])
], PricesController);
