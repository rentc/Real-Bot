import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../../shared/firebase/firebase.service';
import { PricesService } from '../prices/prices.service';
import { MatchingService } from '../matching/matching.service';

@Injectable()
export class QuotationsService {
  constructor(
    private readonly firebase: FirebaseService,
    private readonly pricesService: PricesService,
    private readonly matchingService: MatchingService,
  ) {}

  async generateDraftQuotation(tenantId: string, groupId: string, userId: string, extractedItems: any[]) {
    const items = [];
    let subtotal = 0;

    for (const item of extractedItems) {
      const product: any = await this.matchingService.matchProduct(tenantId, item);
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
}
