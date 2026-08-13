import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../../shared/firebase/firebase.service';

@Injectable()
export class ProductsService {
  constructor(private readonly firebase: FirebaseService) {}

  async findAll(tenantId?: string) {
    let query: FirebaseFirestore.Query = this.firebase.db.collection('products');
    if (tenantId) {
      query = query.where('tenantId', '==', tenantId);
    }
    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async findOne(id: string) {
    const doc = await this.firebase.db.collection('products').doc(id).get();
    if (!doc.exists) throw new NotFoundException(`Product ${id} not found`);
    return { id: doc.id, ...doc.data() };
  }

  async update(id: string, updates: any) {
    const prodRef = this.firebase.db.collection('products').doc(id);
    const doc = await prodRef.get();
    if (!doc.exists) throw new NotFoundException(`Product ${id} not found`);
    
    await prodRef.update({
      ...updates,
      updatedAt: new Date()
    });
    
    return { id, ...updates };
  }

  async activateAll(tenantId: string = 'tenant_wrc_main') {
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
    
    // First, clear existing products
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
      { brand: 'BCC', type: 'FD-CV', size: '1 X 95', quantity: 5642, packaging: '1000*4+1642', discount: 63.15, basePrice: 655.17, status: 'Inactive' }, // Note: 655.17 seems incorrect in spreadsheet but keeping literal value
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
      // Create a predictable ID like BCC-THW-16-505
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
}
