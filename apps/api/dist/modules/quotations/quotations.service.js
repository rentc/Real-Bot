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
const document_numbering_service_1 = require("../pdf/document-numbering.service");
let QuotationsService = class QuotationsService {
    constructor(firebase, pricesService, matchingService, docNumbering) {
        this.firebase = firebase;
        this.pricesService = pricesService;
        this.matchingService = matchingService;
        this.docNumbering = docNumbering;
    }
    async generateDraftQuotation(tenantId, groupId, userId, extractedItems) {
        const items = [];
        let subtotal = 0;
        for (const item of extractedItems) {
            const quantity = Number(item.quantity) || 1;
            const product = await this.matchingService.matchProduct(tenantId, item);
            if (product) {
                const price = await this.pricesService.getNetPrice(product, groupId, tenantId);
                if (price !== null) {
                    let itemTotal = price * quantity;
                    let unitPrice = price;
                    let note = null;
                    if (product.quantity !== undefined && quantity > product.quantity) {
                        itemTotal = 0;
                        unitPrice = 0;
                        note = `จำนวนสินค้าไม่เพียงพอ (คงเหลือ ${product.quantity})`;
                    }
                    subtotal += itemTotal;
                    items.push({
                        productId: product.id,
                        name: product.name,
                        sku: product.sku,
                        quantity: quantity,
                        unitPrice: unitPrice,
                        total: itemTotal,
                        ...(note && { note }),
                    });
                }
            }
        }
        const vat = subtotal * 0.07;
        const grandTotal = subtotal + vat;
        const quotationId = await this.docNumbering.generateDocumentNumber(tenantId, 'QT');
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
        const docRef = this.firebase.db.collection('quotations').doc(quotationId);
        await docRef.set(draftQuote);
        return { id: quotationId, ...draftQuote };
    }
    async findOne(id) {
        const doc = await this.firebase.db.collection('quotations').doc(id).get();
        if (!doc.exists)
            return null;
        return { id: doc.id, ...doc.data() };
    }
    async updateQuotation(id, data) {
        const ref = this.firebase.db.collection('quotations').doc(id);
        await ref.update({
            ...data,
            updatedAt: new Date(),
        });
        return this.findOne(id);
    }
};
exports.QuotationsService = QuotationsService;
exports.QuotationsService = QuotationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [firebase_service_1.FirebaseService,
        prices_service_1.PricesService,
        matching_service_1.MatchingService,
        document_numbering_service_1.DocumentNumberingService])
], QuotationsService);
