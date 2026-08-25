import { Injectable, Logger } from '@nestjs/common';
import { ProductsService } from '../products/products.service';

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(private readonly productsService: ProductsService) {}

  async matchProduct(tenantId: string, extractedItem: any) {
    const products: any[] = await this.productsService.findAll(tenantId);

    const type = extractedItem.type?.toUpperCase() || '';
    const size = extractedItem.size?.toUpperCase() || '';

    // Normalize: remove spaces and unify X notation (1X300, 1 X 300, 1x300 -> 1X300)
    const normalize = (s: string) => s.replace(/\s+/g, '').replace(/x/gi, 'X');

    const normType = normalize(type);
    const normSize = normalize(size);

    // If AI extracted nothing, don't match
    if (!normType && !normSize) return null;

    const activeProducts = products.filter(p => p.isActive);
    const productsToSearch = activeProducts.length > 0 ? activeProducts : products;

    const matched = productsToSearch.find(p => {
      const normSku  = normalize(p.sku  || '');
      const normName = normalize(p.name || '');

      const hasType = normType ? (normSku.includes(normType) || normName.includes(normType)) : true;
      const hasSize = normSize ? (normSku.includes(normSize) || normName.includes(normSize)) : true;

      return hasType && hasSize;
    });

    if (matched) {
      this.logger.log(`Matched "${type} ${size}" -> product ID: ${matched.id} (${matched.name})`);
      return matched;
    }

    // Fallback: try matching type only (useful when size format is non-standard)
    if (normType && normSize) {
      const typeOnlyMatch = productsToSearch.find(p => {
        const normSku  = normalize(p.sku  || '');
        const normName = normalize(p.name || '');
        return normSku.includes(normType) || normName.includes(normType);
      });
      if (typeOnlyMatch) {
        this.logger.warn(`Partial match (type only) "${type}" -> ${typeOnlyMatch.id} (${typeOnlyMatch.name})`);
        return typeOnlyMatch;
      }
    }

    this.logger.warn(`Could not match product: "${type} ${size}"`);
    return null;
  }
}
