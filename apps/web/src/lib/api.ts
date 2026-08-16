const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function fetchDashboardMetrics(groupId?: string, role?: string) {
  try {
    const params = new URLSearchParams();
    if (groupId) params.append('groupId', groupId);
    if (role) params.append('role', role);
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_URL}/analytics/dashboard${queryString}`, { cache: 'no-store' });
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

export async function fetchGroups() {
  try {
    const res = await fetch(`${API_URL}/groups`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch groups');
    return await res.json();
  } catch (error) {
    console.error('Error fetching groups:', error);
    return [];
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

export async function fetchApprovalHistory() {
  try {
    const res = await fetch(`${API_URL}/approvals/history`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch approval history');
    return await res.json();
  } catch (error) {
    console.error('Error fetching approval history:', error);
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

export async function fetchGroup(groupId: string) {
  try {
    const res = await fetch(`${API_URL}/groups/${groupId}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch group');
    return await res.json();
  } catch (error) {
    console.error('Error fetching group:', error);
    return null;
  }
}

export async function fetchBuyerProfile(groupId: string) {
  try {
    const res = await fetch(`${API_URL}/buyers/${groupId}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Error fetching buyer profile:', error);
    return null;
  }
}

export async function fetchPriceOverrides(groupId: string) {
  try {
    const res = await fetch(`${API_URL}/prices/overrides?groupId=${groupId}&tenantId=tenant_wrc_main`, { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('Error fetching price overrides:', error);
    return [];
  }
}

export async function approveQuotation(requestId: string) {
  try {
    const res = await fetch(`${API_URL}/approvals/${requestId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to approve quotation');
    return await res.json();
  } catch (error) {
    console.error('Error approving quotation:', error);
    throw error;
  }
}

export async function rejectQuotation(requestId: string, reason: string) {
  try {
    const res = await fetch(`${API_URL}/approvals/${requestId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    if (!res.ok) throw new Error('Failed to reject quotation');
    return await res.json();
  } catch (error) {
    console.error('Error rejecting quotation:', error);
    throw error;
  }
}

export async function deleteQuotationRequest(requestId: string) {
  try {
    const res = await fetch(`${API_URL}/approvals/${requestId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete quotation request');
    return await res.json();
  } catch (error) {
    console.error('Error deleting quotation request:', error);
    throw error;
  }
}

export async function updateProduct(id: string, updates: any) {
  try {
    const res = await fetch(`${API_URL}/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update product');
    return await res.json();
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
}

export async function activateAllProducts() {
  try {
    const res = await fetch(`${API_URL}/products/activate-all?tenantId=tenant_wrc_main`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to activate all products');
    return await res.json();
  } catch (error) {
    console.error('Error activating all products:', error);
    throw error;
  }
}

export async function updateQuotation(id: string, data: any) {
  const res = await fetch(`${API_URL}/quotations/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update quotation');
  }

  return await res.json();
}
