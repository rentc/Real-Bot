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
exports.PricesService = void 0;
const common_1 = require("@nestjs/common");
const firebase_service_1 = require("../../shared/firebase/firebase.service");
let PricesService = class PricesService {
    constructor(firebase) {
        this.firebase = firebase;
    }
    async getNetPrice(product, groupId, tenantId) {
        if (!product || !product.basePrice)
            return null;
        let discount = product.defaultDiscount || 0;
        const discountSnapshot = await this.firebase.db.collection('customerDiscounts')
            .where('groupId', '==', groupId)
            .where('tenantId', '==', tenantId)
            .get();
        if (!discountSnapshot.empty) {
            const overrides = discountSnapshot.docs.map(d => d.data());
            const productOverride = overrides.find(o => o.productId === product.id);
            const typeOverride = overrides.find(o => o.type === product.type && !o.productId);
            if (productOverride) {
                discount = productOverride.finalDiscount ?? productOverride.discount ?? discount;
            }
            else if (typeOverride) {
                discount = typeOverride.finalDiscount ?? typeOverride.discount ?? discount;
            }
        }
        const netPrice = product.basePrice * (1 - discount / 100);
        return Math.round(netPrice * 100) / 100;
    }
    async getOverrides(groupId, tenantId) {
        const snapshot = await this.firebase.db.collection('customerDiscounts')
            .where('groupId', '==', groupId)
            .where('tenantId', '==', tenantId)
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    async setOverride(groupId, tenantId, productId, discount, adjustmentPercent) {
        const id = `${groupId}_${productId}`;
        const ref = this.firebase.db.collection('customerDiscounts').doc(id);
        const data = {
            groupId,
            tenantId,
            productId,
            finalDiscount: discount,
            updatedAt: new Date(),
        };
        if (adjustmentPercent !== undefined) {
            data.adjustmentPercent = adjustmentPercent;
        }
        await ref.set(data, { merge: true });
        return { id, groupId, productId, finalDiscount: discount, adjustmentPercent };
    }
};
exports.PricesService = PricesService;
exports.PricesService = PricesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [firebase_service_1.FirebaseService])
], PricesService);
