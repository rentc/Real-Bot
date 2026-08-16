'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

type Tab = 'buyer' | 'pricing';

export default function CustomerDetailClient({
  group,
  initialBuyerProfile,
  products,
  initialOverrides,
}: {
  group: any;
  initialBuyerProfile: any;
  products: any[];
  initialOverrides: any[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>((searchParams.get('tab') as Tab) || 'buyer');

  // --- Buyer Details State ---
  const [buyerForm, setBuyerForm] = useState({
    companyName: initialBuyerProfile?.companyName || '',
    contactName: initialBuyerProfile?.contactName || '',
    phone: initialBuyerProfile?.phone || '',
    address: initialBuyerProfile?.address || '',
    taxId: initialBuyerProfile?.taxId || '',
    email: initialBuyerProfile?.email || '',
  });
  const [savingBuyer, setSavingBuyer] = useState(false);
  const [buyerSaved, setBuyerSaved] = useState(false);

  // --- Pricing State ---
  const overridesMap: Record<string, any> = {};
  initialOverrides.forEach((o: any) => {
    overridesMap[o.productId] = o;
  });

  const [adjustments, setAdjustments] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    initialOverrides.forEach((o: any) => {
      map[o.productId] = String(o.adjustmentPercent ?? '');
    });
    return map;
  });
  const [savingPricing, setSavingPricing] = useState<Record<string, boolean>>({});

  const [buyerError, setBuyerError] = useState<string | null>(null);

  const handleBuyerSave = async () => {
    setSavingBuyer(true);
    setBuyerError(null);
    try {
      const res = await fetch(`${API_URL}/buyers/${group.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buyerForm),
      });
      if (!res.ok) {
        throw new Error('Failed to save buyer details');
      }
      setBuyerSaved(true);
      setTimeout(() => setBuyerSaved(false), 3000);
    } catch (err: any) {
      setBuyerError(err.message || 'An error occurred while saving.');
    } finally {
      setSavingBuyer(false);
    }
  };

  const handleAdjustmentChange = (productId: string, val: string) => {
    setAdjustments(prev => ({ ...prev, [productId]: val }));
  };

  const handleAdjustmentSave = async (productId: string, defaultDiscount: number) => {
    const raw = adjustments[productId];
    const adjustment = parseFloat(raw);
    if (isNaN(adjustment)) return;

    const finalDiscount = defaultDiscount + adjustment;
    setSavingPricing(prev => ({ ...prev, [productId]: true }));
    try {
      await fetch(`${API_URL}/prices/overrides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: group.id,
          tenantId: 'tenant_wrc_main',
          productId,
          adjustmentPercent: adjustment,
          finalDiscount,
        }),
      });
    } finally {
      setSavingPricing(prev => ({ ...prev, [productId]: false }));
    }
  };

  const tabStyle = (tab: Tab) => ({
    padding: '10px 24px',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
    border: 'none',
    background: activeTab === tab ? 'var(--accent-blue)' : 'transparent',
    color: activeTab === tab ? 'white' : 'var(--text-secondary)',
    transition: 'all 0.2s',
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button
          onClick={() => router.push('/customers')}
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '20px' }}
        >
          ←
        </button>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0 }}>
            {group.groupName || 'Unnamed Group'}
          </h1>
          {buyerForm.companyName && (
            <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0', fontSize: '14px' }}>
              {buyerForm.companyName}
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-panel" style={{ display: 'inline-flex', gap: '4px', padding: '6px', marginBottom: '24px', borderRadius: '12px' }}>
        <button style={tabStyle('buyer')} onClick={() => setActiveTab('buyer')}>👤 Buyer Details</button>
        <button style={tabStyle('pricing')} onClick={() => setActiveTab('pricing')}>💰 Custom Pricing</button>
      </div>

      {/* --- TAB: Buyer Details --- */}
      {activeTab === 'buyer' && (
        <div className="glass-panel" style={{ padding: '32px', maxWidth: '680px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px' }}>
            Buyer Information
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px', lineHeight: '1.6' }}>
            This information is pre-filled automatically on every quotation generated for this customer group.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                Company Name <span style={{ color: 'var(--accent-blue)' }}>*</span>
              </label>
              <input
                className="input-premium"
                style={{ width: '100%', boxSizing: 'border-box' }}
                placeholder="บริษัท XXX จำกัด"
                value={buyerForm.companyName}
                onChange={e => setBuyerForm(f => ({ ...f, companyName: e.target.value }))}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Contact Name</label>
              <input
                className="input-premium"
                style={{ width: '100%', boxSizing: 'border-box' }}
                placeholder="ชื่อผู้ติดต่อ"
                value={buyerForm.contactName}
                onChange={e => setBuyerForm(f => ({ ...f, contactName: e.target.value }))}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Phone</label>
              <input
                className="input-premium"
                style={{ width: '100%', boxSizing: 'border-box' }}
                placeholder="0XX-XXX-XXXX"
                value={buyerForm.phone}
                onChange={e => setBuyerForm(f => ({ ...f, phone: e.target.value }))}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Tax ID</label>
              <input
                className="input-premium"
                style={{ width: '100%', boxSizing: 'border-box' }}
                placeholder="เลขประจำตัวผู้เสียภาษี"
                value={buyerForm.taxId}
                onChange={e => setBuyerForm(f => ({ ...f, taxId: e.target.value }))}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Email</label>
              <input
                className="input-premium"
                style={{ width: '100%', boxSizing: 'border-box' }}
                type="email"
                placeholder="email@company.com"
                value={buyerForm.email}
                onChange={e => setBuyerForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Address</label>
              <textarea
                className="input-premium"
                style={{ width: '100%', boxSizing: 'border-box', minHeight: '80px', resize: 'vertical' }}
                placeholder="ที่อยู่สำหรับออกใบเสนอราคา..."
                value={buyerForm.address}
                onChange={e => setBuyerForm(f => ({ ...f, address: e.target.value }))}
              />
            </div>
          </div>

          <div style={{ marginTop: '28px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              className="btn-primary"
              onClick={handleBuyerSave}
              disabled={savingBuyer}
              style={{ opacity: savingBuyer ? 0.7 : 1 }}
            >
              {savingBuyer ? 'Saving...' : 'Save Buyer Details'}
            </button>
            {buyerSaved && (
              <span style={{ color: 'var(--accent-green)', fontSize: '14px', fontWeight: 600 }}>
                ✓ Saved successfully!
              </span>
            )}
            {buyerError && (
              <span style={{ color: 'var(--accent-red)', fontSize: '14px', fontWeight: 600 }}>
                ⚠️ {buyerError}
              </span>
            )}
          </div>
        </div>
      )}

      {/* --- TAB: Custom Pricing --- */}
      {activeTab === 'pricing' && (
        <div>
          <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: '20px', borderLeft: '3px solid var(--accent-blue)' }}>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              <strong style={{ color: 'var(--text-primary)' }}>How it works:</strong> The table shows the global default discount for each product.
              Enter an <strong style={{ color: 'var(--accent-blue)' }}>additional % adjustment</strong> in the "+ส่วนลดเพิ่ม" column (e.g. <code>3.5</code> to give +3.5% extra).
              The Total Discount and Net Price will update instantly. Press <strong>Enter</strong> or click outside the field to auto-save.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', whiteSpace: 'nowrap' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                  <th style={{ padding: '12px' }}>Brand</th>
                  <th style={{ padding: '12px' }}>Type</th>
                  <th style={{ padding: '12px' }}>Size</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Qty</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>ราคาตั้ง</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>ส่วนลด Default (%)</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{ color: 'var(--accent-blue)' }}>+ส่วนลดเพิ่ม (%)</span>
                  </th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>ส่วนลดรวม (%)</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Net Price</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product: any) => {
                  const adj = parseFloat(adjustments[product.id] || '0') || 0;
                  const totalDiscount = product.defaultDiscount + adj;
                  const netPrice = product.basePrice * (1 - totalDiscount / 100);
                  const hasOverride = adj !== 0;

                  return (
                    <tr
                      key={product.id}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        background: hasOverride ? 'rgba(99,179,237,0.04)' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{product.brand}</td>
                      <td style={{ padding: '10px 12px' }}>{product.type}</td>
                      <td style={{ padding: '10px 12px' }}>{product.size}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                        {product.quantity.toLocaleString()}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        {product.basePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                        {product.defaultDiscount}%
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>+</span>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            placeholder="0"
                            value={adjustments[product.id] ?? ''}
                            onChange={e => handleAdjustmentChange(product.id, e.target.value)}
                            onBlur={() => handleAdjustmentSave(product.id, product.defaultDiscount)}
                            onKeyDown={e => e.key === 'Enter' && handleAdjustmentSave(product.id, product.defaultDiscount)}
                            style={{
                              width: '70px',
                              background: hasOverride ? 'rgba(99,179,237,0.15)' : 'var(--bg-secondary)',
                              border: `1px solid ${hasOverride ? 'var(--accent-blue)' : 'var(--border)'}`,
                              color: hasOverride ? 'var(--accent-blue)' : 'var(--text-primary)',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              textAlign: 'right',
                              outline: 'none',
                              fontWeight: hasOverride ? 700 : 400,
                              fontSize: '13px',
                            }}
                          />
                          {savingPricing[product.id] && (
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>💾</span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: hasOverride ? 700 : 400, color: hasOverride ? 'var(--accent-blue)' : 'var(--text-primary)' }}>
                        {totalDiscount.toFixed(2)}%
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: hasOverride ? 'var(--accent-green)' : 'var(--text-secondary)' }}>
                        {netPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
