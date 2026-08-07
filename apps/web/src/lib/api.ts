const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function fetchDashboardMetrics() {
  try {
    const res = await fetch(`${API_URL}/analytics/dashboard`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch metrics');
    return await res.json();
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return {
      totalQuotations: 0,
      totalOrders: 0,
      conversionRate: '0%',
      totalRevenue: 0,
      pendingApprovals: 0,
    };
  }
}

export async function fetchOrders() {
  try {
    const res = await fetch(`${API_URL}/orders`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch orders');
    return await res.json();
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

export async function fetchPendingApprovals() {
  try {
    const res = await fetch(`${API_URL}/approvals`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch pending approvals');
    return await res.json();
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    return [];
  }
}

export async function fetchProducts() {
  try {
    const res = await fetch(`${API_URL}/products?tenantId=tenant_wrc_main`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch products');
    return await res.json();
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}
