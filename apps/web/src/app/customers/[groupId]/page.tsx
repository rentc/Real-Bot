import { fetchGroup, fetchBuyerProfile, fetchProducts, fetchPriceOverrides } from '@/lib/api';
import CustomerDetailClient from './CustomerDetailClient';
import { notFound } from 'next/navigation';

export default async function CustomerDetailPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;

  const [group, buyerProfile, products, priceOverrides] = await Promise.all([
    fetchGroup(groupId),
    fetchBuyerProfile(groupId).catch(() => null),
    fetchProducts(),
    fetchPriceOverrides(groupId).catch(() => []),
  ]);

  if (!group) return notFound();

  return (
    <CustomerDetailClient
      group={group}
      initialBuyerProfile={buyerProfile || {}}
      products={products}
      initialOverrides={priceOverrides || []}
    />
  );
}
