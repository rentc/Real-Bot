import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../../shared/firebase/firebase.service';

@Injectable()
export class PricesService {
  constructor(private readonly firebase: FirebaseService) {}

  async getNetPrice(product: any, groupId: string, tenantId: string) {
    if (!product || !product.basePrice) return null;

    let discount = product.defaultDiscount || 0;

    // Check for customer-specific discount override
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
      } else if (typeOverride) {
        discount = typeOverride.finalDiscount ?? typeOverride.discount ?? discount;
      }
    }

    // Calculate Net Price: basePrice * (1 - discount/100)
    const netPrice = product.basePrice * (1 - discount / 100);
    // Round to 2 decimal places
    return Math.round(netPrice * 100) / 100;
  }

  async getOverrides(groupId: string, tenantId: string) {
    const snapshot = await this.firebase.db.collection('customerDiscounts')
      .where('groupId', '==', groupId)
      .where('tenantId', '==', tenantId)
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async setOverride(groupId: string, tenantId: string, productId: string, discount: number, adjustmentPercent?: number) {
    const id = `${groupId}_${productId}`;
    const ref = this.firebase.db.collection('customerDiscounts').doc(id);

    const data: any = {
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
}
