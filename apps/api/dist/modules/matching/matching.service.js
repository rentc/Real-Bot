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
var MatchingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchingService = void 0;
const common_1 = require("@nestjs/common");
const products_service_1 = require("../products/products.service");
let MatchingService = MatchingService_1 = class MatchingService {
    constructor(productsService) {
        this.productsService = productsService;
        this.logger = new common_1.Logger(MatchingService_1.name);
    }
    async matchProduct(tenantId, extractedItem) {
        const products = await this.productsService.findAll(tenantId);
        const type = extractedItem.type?.toUpperCase() || '';
        const size = extractedItem.size?.toUpperCase() || '';
        const matched = products.find(p => {
            const sku = (p.sku || '').toUpperCase();
            const name = (p.name || '').toUpperCase();
            const normSku = sku.replace(/\s+/g, '');
            const normName = name.replace(/\s+/g, '');
            const normType = type.replace(/\s+/g, '');
            const normSize = size.replace(/\s+/g, '');
            const hasType = normType ? (normSku.includes(normType) || normName.includes(normType)) : true;
            const hasSize = normSize ? (normSku.includes(normSize) || normName.includes(normSize)) : true;
            if (!type && !size)
                return false;
            return hasType && hasSize;
        });
        if (matched) {
            this.logger.log(`Matched ${type} ${size} to product ID: ${matched.id}`);
            return matched;
        }
        this.logger.warn(`Could not match product: ${type} ${size}`);
        return null;
    }
};
exports.MatchingService = MatchingService;
exports.MatchingService = MatchingService = MatchingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [products_service_1.ProductsService])
], MatchingService);
