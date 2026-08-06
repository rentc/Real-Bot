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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const firebase_service_1 = require("../../shared/firebase/firebase.service");
let ProductsService = class ProductsService {
    constructor(firebase) {
        this.firebase = firebase;
    }
    async findAll(tenantId) {
        let query = this.firebase.db.collection('products');
        if (tenantId) {
            query = query.where('tenantId', '==', tenantId);
        }
        const snapshot = await query.get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    async findOne(id) {
        const doc = await this.firebase.db.collection('products').doc(id).get();
        if (!doc.exists)
            throw new common_1.NotFoundException(`Product ${id} not found`);
        return { id: doc.id, ...doc.data() };
    }
    async seed() {
        const tenantId = 'tenant_wrc_main';
        const db = this.firebase.db;
        const batch = db.batch();
        const productsData = [
            { id: 'CBL-THW-001', sku: 'THW-1X1.5-BK', name: 'สายไฟ THW 1 x 1.5 ตร.มม. สีดำ', brand: 'Thai Cable', terms: ['thw', '1x1.5', 'สายไฟ', 'สีดำ'], price: 760 },
            { id: 'CBL-THW-002', sku: 'THW-1X2.5-BK', name: 'สายไฟ THW 1 x 2.5 ตร.มม. สีดำ', brand: 'Thai Cable', terms: ['thw', '1x2.5', 'สายไฟ', 'สีดำ'], price: 1180 },
            { id: 'CBL-THW-003', sku: 'THW-1X4-BK', name: 'สายไฟ THW 1 x 4 ตร.มม. สีดำ', brand: 'Phelps Dodge', terms: ['thw', '1x4', 'สายไฟ', 'สีดำ'], price: 1850 },
            { id: 'CBL-THW-004', sku: 'THW-1X6-BK', name: 'สายไฟ THW 1 x 6 ตร.มม. สีดำ', brand: 'Phelps Dodge', terms: ['thw', '1x6', 'สายไฟ', 'สีดำ'], price: 2740 },
            { id: 'CBL-NYY-001', sku: 'NYY-2X2.5', name: 'สายไฟ NYY 2 x 2.5 ตร.มม.', brand: 'BCC', terms: ['nyy', '2x2.5', 'สายไฟ'], price: 48 },
            { id: 'CBL-NYY-002', sku: 'NYY-2X4', name: 'สายไฟ NYY 2 x 4 ตร.มม.', brand: 'BCC', terms: ['nyy', '2x4', 'สายไฟ'], price: 69 },
            { id: 'CBL-NYY-003', sku: 'NYY-4X6', name: 'สายไฟ NYY 4 x 6 ตร.มม.', brand: 'Yazaki', terms: ['nyy', '4x6', 'สายไฟ'], price: 218 },
            { id: 'CBL-VCT-001', sku: 'VCT-2X1.5', name: 'สายไฟอ่อน VCT 2 x 1.5 ตร.มม.', brand: 'Thai Cable', terms: ['vct', '2x1.5', 'สายไฟอ่อน'], price: 2180 },
            { id: 'CBL-VCT-002', sku: 'VCT-3X2.5', name: 'สายไฟอ่อน VCT 3 x 2.5 ตร.มม.', brand: 'Thai Cable', terms: ['vct', '3x2.5', 'สายไฟอ่อน'], price: 3980 },
            { id: 'CBL-VCT-003', sku: 'VCT-4X4', name: 'สายไฟอ่อน VCT 4 x 4 ตร.มม.', brand: 'Phelps Dodge', terms: ['vct', '4x4', 'สายไฟอ่อน'], price: 165 },
            { id: 'CBL-CV-001', sku: 'CV-1X16', name: 'สายไฟ CV 1 x 16 ตร.มม.', brand: 'BCC', terms: ['cv', '1x16', 'สายไฟ'], price: 148 },
            { id: 'CBL-CV-002', sku: 'CV-4X10', name: 'สายไฟ CV 4 x 10 ตร.มม.', brand: 'BCC', terms: ['cv', '4x10', 'สายไฟ'], price: 428 },
            { id: 'CBL-VAF-001', sku: 'VAF-2X1.5', name: 'สายไฟ VAF 2 x 1.5 ตร.มม.', brand: 'Yazaki', terms: ['vaf', '2x1.5', 'สายไฟ'], price: 1650 },
            { id: 'CBL-VAF-002', sku: 'VAF-2X2.5', name: 'สายไฟ VAF 2 x 2.5 ตร.มม.', brand: 'Yazaki', terms: ['vaf', '2x2.5', 'สายไฟ'], price: 2390 },
            { id: 'CBL-CTL-001', sku: 'CTL-4X1.5', name: 'สายคอนโทรล 4 x 1.5 ตร.มม.', brand: 'Sample Brand', terms: ['ctl', '4x1.5', 'สายคอนโทรล'], price: 82 },
        ];
        for (const p of productsData) {
            const prodRef = db.collection('products').doc(p.id);
            batch.set(prodRef, {
                tenantId,
                name: p.name,
                sku: p.sku,
                brand: p.brand,
                searchTerms: p.terms,
                isActive: true,
                createdAt: new Date(),
            }, { merge: true });
            const priceRef = db.collection('prices').doc(`price_${p.id}`);
            batch.set(priceRef, {
                productId: p.id,
                tenantId,
                price: p.price,
                currency: 'THB',
                effectiveDate: new Date(),
                status: 'ACTIVE',
                createdBy: 'seed',
            }, { merge: true });
        }
        await batch.commit();
        return { message: 'Seeded 15 products' };
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [firebase_service_1.FirebaseService])
], ProductsService);
