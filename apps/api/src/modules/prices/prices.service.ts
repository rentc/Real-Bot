import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../../shared/firebase/firebase.service';

@Injectable()
export class PricesService {
  constructor(private readonly firebase: FirebaseService) {}

  async getActivePrice(productId: string, tenantId: string) {
    // Query the top-level prices collection directly (as seeded)
    const priceSnapshot = await this.firebase.db.collection('prices')
      .where('tenantId', '==', tenantId)
      .where('productId', '==', productId)
      .where('status', '==', 'ACTIVE')
      .limit(1)
      .get();
      
    if (priceSnapshot.empty) return null;
    return priceSnapshot.docs[0].data().price;
  }
}
