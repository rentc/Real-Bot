import { fetchProducts } from '@/lib/api';
import ProductsClient from './ProductsClient';

export default async function Products() {
  const products = await fetchProducts();

  return (
    <ProductsClient initialProducts={products} />
  );
}
