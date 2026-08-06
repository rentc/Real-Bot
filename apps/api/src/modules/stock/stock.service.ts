import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../../shared/firebase/firebase.service';

@Injectable()
export class StockService {
  constructor(private readonly firebase: FirebaseService) {}

  async getStock(productId: string) {
    const snapshot = await this.firebase.db.collection('stockLevels')
      .where('productId', '==', productId)
      .get();
      
    let totalStock = 0;
    const details: any[] = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      totalStock += data.quantity || 0;
      details.push({
        warehouseId: data.warehouseId,
        quantity: data.quantity,
      });
    }

    return {
      productId,
      totalStock,
      details,
    };
  }
}
