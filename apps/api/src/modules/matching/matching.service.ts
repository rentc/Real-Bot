import { Injectable, Logger } from '@nestjs/common';
import { ProductsService } from '../products/products.service';

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(private readonly productsService: ProductsService) {}

  async matchProduct(tenantId: string, extractedItem: any) {
    const products: any[] = await this.productsService.findAll(tenantId);
    
    // Very simple matching logic based on type and size
    // In a real system, this would be more sophisticated (aliases, fuzzy search, etc.)
    const type = extractedItem.type?.toUpperCase() || '';
    const size = extractedItem.size?.toUpperCase() || '';
    
    // Match if SKU or Name contains both Type and Size (ignoring spaces)
    const matched = products.find(p => {
      const sku = (p.sku || '').toUpperCase();
      const name = (p.name || '').toUpperCase();
      
      const normSku = sku.replace(/\s+/g, '');
      const normName = name.replace(/\s+/g, '');
      const normType = type.replace(/\s+/g, '');
      const normSize = size.replace(/\s+/g, '');
      
      const hasType = normType ? (normSku.includes(normType) || normName.includes(normType)) : true;
      const hasSize = normSize ? (normSku.includes(normSize) || normName.includes(normSize)) : true;
      
      // If AI extracted nothing, don't match
      if (!type && !size) return false;
      
      return hasType && hasSize;
    });
    
    if (matched) {
      this.logger.log(`Matched ${type} ${size} to product ID: ${matched.id}`);
      return matched;
    }
    
    this.logger.warn(`Could not match product: ${type} ${size}`);
    return null;
  }
}
