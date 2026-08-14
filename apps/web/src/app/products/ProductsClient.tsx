'use client';
import { useState, useEffect } from 'react';
import { updateProduct, activateAllProducts } from '@/lib/api';

export default function ProductsClient({ initialProducts }: { initialProducts: any[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});

  useEffect(() => {
    // Fetch all customer groups for the dropdown
    import('@/lib/api').then(({ fetchGroups }) => {
      fetchGroups().then(data => setGroups(data));
    });
  }, []);

  useEffect(() => {
    // When a group is selected, fetch their overrides and apply them
    if (!selectedGroup) {
      setProducts(initialProducts);
      return;
    }

    setLoading(true);
    import('@/lib/api').then(({ fetchPriceOverrides }) => {
      fetchPriceOverrides(selectedGroup).then(overrides => {
        // Merge overrides into products
        const updatedProducts = initialProducts.map(p => {
          const override = overrides.find((o: any) => o.productId === p.id);
          if (override) {
            return { ...p, currentDiscount: override.finalDiscount ?? override.discount, isOverridden: true };
          }
          return { ...p, currentDiscount: p.defaultDiscount, isOverridden: false };
        });
        setProducts(updatedProducts);
      }).finally(() => setLoading(false));
    });
  }, [selectedGroup, initialProducts]);

  const handleDiscountChange = async (productId: string, newDiscount: string) => {
    if (!selectedGroup) return;
    const numDiscount = parseFloat(newDiscount);
    if (isNaN(numDiscount)) return;

    // Optimistic update
    setProducts(products.map(p => p.id === productId ? { ...p, currentDiscount: numDiscount, isOverridden: true } : p));

    // Save to backend
    try {
      const { updateProduct } = await import('@/lib/api');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      // If we don't have a setOverride function, fetch directly
      await fetch(`${API_URL}/prices/overrides?groupId=${selectedGroup}&tenantId=tenant_wrc_main&productId=${productId}&discount=${numDiscount}`, {
        method: 'POST'
      });
    } catch (err) {
      console.error('Failed to save override:', err);
    }
  };

  const handleEditClick = (product: any) => {
    setEditingId(product.id);
    setEditFormData({ ...product });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const handleSaveEdit = async () => {
    try {
      setLoading(true);
      await updateProduct(editingId!, editFormData);
      
      // Update local state
      setProducts(products.map(p => p.id === editingId ? { ...p, ...editFormData } : p));
      
      setEditingId(null);
      setEditFormData({});
    } catch (error) {
      alert('Failed to save product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleActivateAll = async () => {
    if (!confirm('Are you sure you want to set ALL parts to Active?')) return;
    
    try {
      setLoading(true);
      await activateAllProducts();
      
      // Update local state
      setProducts(products.map(p => ({ ...p, isActive: true })));
      alert('All products have been activated.');
    } catch (error) {
      alert('Failed to activate all products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, field: string) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
    setEditFormData({ ...editFormData, [field]: value });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    setEditFormData({ ...editFormData, [field]: e.target.checked });
  };

  return (
    <div>
      <h1 style={{ fontSize: '32px', marginBottom: '24px', fontWeight: 700 }}>
        Product <span className="text-gradient">Catalog</span>
      </h1>
      
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', gap: '24px', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ flex: 1, display: 'flex', gap: '16px', alignItems: 'center' }}>
          <select 
            className="input-premium" 
            style={{ width: '300px' }}
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
          >
            <option value="">Global Catalog (Default Prices)</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.groupName || 'Unnamed Group'}</option>
            ))}
          </select>
          {selectedGroup && <span style={{ color: 'var(--accent-blue)', fontSize: '14px', fontWeight: 600 }}>Viewing Customer-Specific Pricing</span>}
        </div>
        <input type="text" className="input-premium" placeholder="Search products..." style={{ width: '300px' }} />
        <button className="btn-primary" onClick={handleActivateAll}>Activate All Parts</button>
        <button className="btn-primary" style={{ background: 'var(--bg-secondary)' }}>Add Product</button>
      </div>

      <div className="glass-panel" style={{ padding: '24px', minHeight: '400px', overflowX: 'auto', opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
        {products.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No products found.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', whiteSpace: 'nowrap', tableLayout: 'auto' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '8px', width: '5%' }}>Brand</th>
                <th style={{ padding: '8px', width: '8%' }}>Product</th>
                <th style={{ padding: '8px', width: '5%' }}>Type</th>
                <th style={{ padding: '8px', width: '8%' }}>Size</th>
                <th style={{ padding: '8px', width: '8%', textAlign: 'right' }}>Quantity</th>
                <th style={{ padding: '8px', width: '8%' }}>ระยะ</th>
                <th style={{ padding: '8px', width: '8%', textAlign: 'right' }}>ส่วนลดใหม่ (%)</th>
                <th style={{ padding: '8px', width: '10%', textAlign: 'right' }}>ราคาตั้งใหม่</th>
                <th style={{ padding: '8px', width: '10%', textAlign: 'right' }}>Net Price</th>
                <th style={{ padding: '8px', width: '10%', textAlign: 'right' }}>Net Value</th>
                <th style={{ padding: '8px', width: '5%', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '8px', width: '15%', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product: any) => {
                const isEditing = editingId === product.id;
                const p = isEditing ? editFormData : product;
                
                const discount = p.currentDiscount !== undefined ? p.currentDiscount : p.defaultDiscount;
                const discountAmount = (p.basePrice * discount) / 100;
                const netPrice = p.basePrice - discountAmount;
                const netValue = netPrice * p.quantity;

                const inputStyle = {
                  width: '100%',
                  minWidth: '40px',
                  boxSizing: 'border-box' as const,
                  background: '#ffffff',
                  border: '1px solid #d1d5db',
                  color: '#111827',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  outline: 'none',
                  fontSize: '13px',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
                };

                return (
                  <tr key={product.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: isEditing ? 'rgba(0,0,0,0.02)' : 'transparent' }}>
                    <td style={{ padding: '8px', fontWeight: 500 }}>
                      {isEditing ? <input type="text" value={p.brand} onChange={(e) => handleChange(e, 'brand')} style={inputStyle} /> : p.brand}
                    </td>
                    <td style={{ padding: '8px' }}>
                      {isEditing ? <input type="text" value={p.category || ''} onChange={(e) => handleChange(e, 'category')} style={inputStyle} /> : (p.category || 'Wiring')}
                    </td>
                    <td style={{ padding: '8px' }}>
                      {isEditing ? <input type="text" value={p.type} onChange={(e) => handleChange(e, 'type')} style={inputStyle} /> : p.type}
                    </td>
                    <td style={{ padding: '8px' }}>
                      {isEditing ? <input type="text" value={p.size} onChange={(e) => handleChange(e, 'size')} style={inputStyle} /> : p.size}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>
                      {isEditing ? <input type="number" value={p.quantity} onChange={(e) => handleChange(e, 'quantity')} style={{...inputStyle, textAlign: 'right'}} /> : p.quantity.toLocaleString()}
                    </td>
                    <td style={{ padding: '8px' }}>
                      {isEditing ? <input type="text" value={p.packaging} onChange={(e) => handleChange(e, 'packaging')} style={inputStyle} /> : p.packaging}
                    </td>
                    
                    <td style={{ padding: '8px', textAlign: 'right' }}>
                      {isEditing ? (
                        <input type="number" step="0.01" value={p.defaultDiscount} onChange={(e) => handleChange(e, 'defaultDiscount')} style={{...inputStyle, textAlign: 'right'}} />
                      ) : selectedGroup ? (
                        <input 
                          type="number" 
                          step="0.01"
                          value={discount}
                          onChange={(e) => handleDiscountChange(p.id, e.target.value)}
                          style={{
                            ...inputStyle,
                            background: p.isOverridden ? 'var(--accent-blue-glow)' : 'var(--bg-primary)',
                            border: `1px solid ${p.isOverridden ? 'var(--accent-blue)' : 'var(--border)'}`,
                            color: p.isOverridden ? 'var(--accent-blue)' : 'var(--text-primary)',
                            textAlign: 'right',
                            fontWeight: p.isOverridden ? 700 : 400
                          }}
                        />
                      ) : (
                        <span style={{ color: 'var(--accent-red)' }}>{discount}%</span>
                      )}
                    </td>

                    <td style={{ padding: '8px', textAlign: 'right' }}>
                      {isEditing ? <input type="number" step="0.01" value={p.basePrice} onChange={(e) => handleChange(e, 'basePrice')} style={{...inputStyle, textAlign: 'right'}} /> : p.basePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600, color: 'var(--accent-blue)' }}>{netPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600, color: 'var(--accent-green)' }}>{netValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      {isEditing ? (
                        <input type="checkbox" checked={p.isActive} onChange={(e) => handleCheckboxChange(e, 'isActive')} style={{ transform: 'scale(1.2)', cursor: 'pointer' }} />
                      ) : (
                        <span style={{ 
                          padding: '2px 6px', 
                          borderRadius: '4px', 
                          fontSize: '11px',
                          background: p.isActive ? 'rgba(0, 230, 118, 0.2)' : 'rgba(0, 0, 0, 0.05)',
                          color: p.isActive ? 'var(--accent-green)' : 'var(--text-secondary)'
                        }}>
                          {p.isActive ? 'Active' : 'Inactive'}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          <button onClick={handleSaveEdit} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}>Save</button>
                          <button onClick={handleCancelEdit} style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}>Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => handleEditClick(p)} style={{ background: 'transparent', color: '#2563eb', border: '1px solid #2563eb', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}>Edit</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
