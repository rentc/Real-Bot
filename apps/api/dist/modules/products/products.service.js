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
    async update(id, updates) {
        const prodRef = this.firebase.db.collection('products').doc(id);
        const doc = await prodRef.get();
        if (!doc.exists)
            throw new common_1.NotFoundException(`Product ${id} not found`);
        await prodRef.update({
            ...updates,
            updatedAt: new Date()
        });
        return { id, ...updates };
    }
    async activateAll(tenantId = 'tenant_wrc_main') {
        const db = this.firebase.db;
        const productsSnapshot = await db.collection('products').where('tenantId', '==', tenantId).get();
        const batch = db.batch();
        let count = 0;
        productsSnapshot.docs.forEach(doc => {
            if (doc.data().isActive !== true) {
                batch.update(doc.ref, { isActive: true, updatedAt: new Date() });
                count++;
            }
        });
        if (count > 0) {
            await batch.commit();
        }
        return { message: `Activated ${count} products successfully.` };
    }
    async seed() {
        const tenantId = 'tenant_wrc_main';
        const db = this.firebase.db;
        const oldProducts = await db.collection('products').where('tenantId', '==', tenantId).get();
        const batchDelete = db.batch();
        oldProducts.docs.forEach(doc => batchDelete.delete(doc.ref));
        await batchDelete.commit();
        const batch = db.batch();
        const rawData = [
            { brand: 'BCC', type: 'THW', size: '16', quantity: 505, packaging: 'ขดลวด', discount: 64.25, basePrice: 168.77, status: 'Active' },
            { brand: 'BCC', type: 'THW', size: '16', quantity: 1000, packaging: 'ขดลวด', discount: 61.78, basePrice: 168.77, status: 'Inactive' },
            { brand: 'BCC', type: 'THW', size: '16', quantity: 5000, packaging: '2000*2 / 1000', discount: 60.35, basePrice: 168.77, status: 'Inactive' },
            { brand: 'BCC', type: 'THW', size: '25', quantity: 1707, packaging: 'ขดลวด', discount: 64.25, basePrice: 265.54, status: 'Inactive' },
            { brand: 'BCC', type: 'THW', size: '25', quantity: 4000, packaging: '2000*2', discount: 60.35, basePrice: 265.54, status: 'Inactive' },
            { brand: 'BCC', type: 'THW', size: '35', quantity: 2000, packaging: 'ขดลวด', discount: 58.00, basePrice: 357.86, status: 'Inactive' },
            { brand: 'BCC', type: 'THW', size: '35', quantity: 2000, packaging: 'ขดลวด', discount: 57.30, basePrice: 357.86, status: 'Inactive' },
            { brand: 'BCC', type: 'THW', size: '50', quantity: 2000, packaging: 'ขดลวด', discount: 58.00, basePrice: 471.43, status: 'Inactive' },
            { brand: 'BCC', type: 'THW', size: '50', quantity: 3000, packaging: '2000+1000', discount: 57.30, basePrice: 471.43, status: 'Inactive' },
            { brand: 'BCC', type: 'THW', size: '120', quantity: 2000, packaging: '1000*2', discount: 58.84, basePrice: 1173.91, status: 'Inactive' },
            { brand: 'BCC', type: 'FD-CV', size: '1 X 16', quantity: 1000, packaging: 'ขดลวด', discount: 60.35, basePrice: 184.22, status: 'Inactive' },
            { brand: 'BCC', type: 'FD-CV', size: '1 X 25', quantity: 2500, packaging: '1000 +1500', discount: 60.35, basePrice: 278.82, status: 'Inactive' },
            { brand: 'BCC', type: 'FD-CV', size: '1 X 50', quantity: 1000, packaging: 'ขดลวด', discount: 58.84, basePrice: 484.00, status: 'Inactive' },
            { brand: 'BCC', type: 'FD-CV', size: '1 X 50', quantity: 1000, packaging: 'ขดลวด', discount: 57.30, basePrice: 484.00, status: 'Inactive' },
            { brand: 'BCC', type: 'FD-CV', size: '1 X 95', quantity: 1000, packaging: 'ขดลวด', discount: 60.60, basePrice: 977.87, status: 'Inactive' },
            { brand: 'BCC', type: 'FD-CV', size: '1 X 95', quantity: 2000, packaging: '1000*2', discount: 59.13, basePrice: 977.87, status: 'Inactive' },
            { brand: 'BCC', type: 'FD-CV', size: '1 X 95', quantity: 5642, packaging: '1000*4+1642', discount: 63.15, basePrice: 655.17, status: 'Inactive' },
            { brand: 'BCC', type: 'FD-CV', size: '1X 120', quantity: 384, packaging: 'ขดลวด', discount: 63.15, basePrice: 1239.94, status: 'Inactive' },
            { brand: 'BCC', type: 'FD-CV', size: '1X 150', quantity: 2000, packaging: '1000*2', discount: 61.50, basePrice: 1525.66, status: 'Inactive' },
            { brand: 'BCC', type: 'FD-CV', size: '1X 150', quantity: 5000, packaging: '1000*5', discount: 58.84, basePrice: 1525.66, status: 'Inactive' },
            { brand: 'BCC', type: 'FD-CV', size: '1X 150', quantity: 1860, packaging: '1000 + 860', discount: 57.30, basePrice: 1525.66, status: 'Inactive' },
            { brand: 'BCC', type: 'FD-CV', size: '1X 240', quantity: 3000, packaging: '1000*3', discount: 61.50, basePrice: 2518.71, status: 'Inactive' },
            { brand: 'BCC', type: 'FD-CV', size: '1X 240', quantity: 5000, packaging: '1000*5', discount: 58.84, basePrice: 2518.71, status: 'Inactive' },
            { brand: 'BCC', type: 'FD-CV', size: '1X 240', quantity: 4000, packaging: '1000*4', discount: 57.30, basePrice: 2518.71, status: 'Inactive' },
            { brand: 'BCC', type: 'FD-CV', size: '1X 300', quantity: 1000, packaging: 'ขดลวด', discount: 57.30, basePrice: 3126.76, status: 'Inactive' },
            { brand: 'BCC', type: 'CV', size: '1 X 50', quantity: 2000, packaging: 'ขดลวด', discount: 57.34, basePrice: 479.64, status: 'Inactive' },
            { brand: 'BCC', type: 'CV', size: '1 X 70', quantity: 2000, packaging: '1000*2', discount: 59.06, basePrice: 704.01, status: 'Inactive' },
            { brand: 'BCC', type: 'CV', size: '1X 185', quantity: 1000, packaging: 'ขดลวด', discount: 57.34, basePrice: 1890.80, status: 'Inactive' },
            { brand: 'BCC', type: 'CV', size: '1X 300', quantity: 2000, packaging: '1000*2', discount: 57.34, basePrice: 3098.58, status: 'Inactive' },
        ];
        let index = 1;
        for (const p of rawData) {
            const cleanSize = p.size.replace(/\s+/g, '');
            const id = `${p.brand}-${p.type}-${cleanSize}-${p.quantity}-${index}`;
            const prodRef = db.collection('products').doc(id);
            batch.set(prodRef, {
                tenantId,
                name: `สายไฟ ${p.brand} ${p.type} ${p.size}`,
                sku: id,
                brand: p.brand,
                category: 'Wiring',
                type: p.type,
                size: p.size,
                basePrice: p.basePrice,
                defaultDiscount: p.discount,
                packaging: p.packaging,
                quantity: p.quantity,
                isActive: p.status === 'Active',
                searchTerms: [p.brand.toLowerCase(), p.type.toLowerCase(), p.size.toLowerCase(), cleanSize.toLowerCase(), 'สายไฟ'],
                createdAt: new Date(),
            }, { merge: true });
            index++;
        }
        await batch.commit();
        return { message: `Seeded ${rawData.length} products.` };
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [firebase_service_1.FirebaseService])
], ProductsService);
