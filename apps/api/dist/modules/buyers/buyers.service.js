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
exports.BuyersService = void 0;
const common_1 = require("@nestjs/common");
const firebase_service_1 = require("../../shared/firebase/firebase.service");
let BuyersService = class BuyersService {
    constructor(firebase) {
        this.firebase = firebase;
    }
    async getBuyerProfile(groupId) {
        const doc = await this.firebase.db.collection('buyerProfiles').doc(groupId).get();
        if (!doc.exists)
            return null;
        return { id: doc.id, ...doc.data() };
    }
    async upsertBuyerProfile(groupId, data) {
        const ref = this.firebase.db.collection('buyerProfiles').doc(groupId);
        await ref.set({
            ...data,
            lineGroupId: groupId,
            tenantId: data.tenantId || 'tenant_wrc_main',
            updatedAt: new Date(),
        }, { merge: true });
        try {
            await this.firebase.db.collection('lineGroups').doc(groupId).update({
                status: 'ACTIVE',
                updatedAt: new Date(),
            });
        }
        catch (e) {
            console.error('Failed to update group status to ACTIVE', e);
        }
        const updated = await ref.get();
        return { id: updated.id, ...updated.data() };
    }
};
exports.BuyersService = BuyersService;
exports.BuyersService = BuyersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [firebase_service_1.FirebaseService])
], BuyersService);
