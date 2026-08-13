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
exports.QuotationsService = void 0;
const common_1 = require("@nestjs/common");
const firebase_service_1 = require("../../shared/firebase/firebase.service");
const prices_service_1 = require("../prices/prices.service");
const matching_service_1 = require("../matching/matching.service");
let QuotationsService = class QuotationsService {
    constructor(firebase, pricesService, matchingService) {
        this.firebase = firebase;
        this.pricesService = pricesService;
        this.matchingService = matchingService;
    }
    async generateDraftQuotation(tenantId, groupId, userId, extractedItems) {
        const items = [];
        let subtotal = 0;
        for (const item of extractedItems) {
            const product = await this.matchingService.matchProduct(tenantId, item);
            if (product) {
                const price = await this.pricesService.getNetPrice(product, groupId, tenantId);
                if (price !== null) {
                    const itemTotal = price * item.quantity;
                    subtotal += itemTotal;
                    items.push({
                        productId: product.id,
                        name: product.name,
                        sku: product.sku,
                        quantity: item.quantity,
                        unitPrice: price,
                        total: itemTotal,
                    });
                }
            }
        }
        const vat = subtotal * 0.07;
        const grandTotal = subtotal + vat;
        const draftQuote = {
            tenantId,
            groupId,
            userId,
            status: 'DRAFT',
            createdAt: new Date(),
            items,
            subtotal,
            vat,
            grandTotal,
        };
        const docRef = await this.firebase.db.collection('quotations').add(draftQuote);
        return { id: docRef.id, ...draftQuote };
    }
};
exports.QuotationsService = QuotationsService;
exports.QuotationsService = QuotationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [firebase_service_1.FirebaseService,
        prices_service_1.PricesService,
        matching_service_1.MatchingService])
], QuotationsService);
