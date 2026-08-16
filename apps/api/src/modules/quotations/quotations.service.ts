import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../../shared/firebase/firebase.service';
import { PricesService } from '../prices/prices.service';
import { MatchingService } from '../matching/matching.service';
import { DocumentNumberingService } from '../pdf/document-numbering.service';

@Injectable()
export class QuotationsService {
  constructor(
    private readonly firebase: FirebaseService,
    private readonly pricesService: PricesService,
    private readonly matchingService: MatchingService,
    private readonly docNumbering: DocumentNumberingService,
  ) {}

  async generateDraftQuotation(tenantId: string, groupId: string, userId: string, extractedItems: any[]) {
    const items = [];
    let subtotal = 0;

    for (const item of extractedItems) {
      const quantity = Number(item.quantity) || 1;
      const product: any = await this.matchingService.matchProduct(tenantId, item);
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

  async findOne(id: string) {
    const doc = await this.firebase.db.collection('quotations').doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  async updateQuotation(id: string, data: any) {
    const ref = this.firebase.db.collection('quotations').doc(id);
    await ref.update({
      ...data,
      updatedAt: new Date(),
    });
    return this.findOne(id);
  }
}
