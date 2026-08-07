import { fetchDashboardMetrics } from '@/lib/api';

export default async function Dashboard() {
  const metrics = await fetchDashboardMetrics();

  return (
    <div>
      <h1 style={{ fontSize: '32px', marginBottom: '24px', fontWeight: 700 }}>
        Dashboard <span className="text-gradient">Overview</span>
      </h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        
        <div className="glass-panel hover-glow" style={{ padding: '24px' }}>
          <h3 style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '14px' }}>Total Quotations</h3>
          <p style={{ fontSize: '36px', fontWeight: 800 }}>{metrics.totalQuotations}</p>
        </div>

        <div className="glass-panel hover-glow" style={{ padding: '24px' }}>
          <h3 style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '14px' }}>Pending Approvals</h3>
          <p style={{ fontSize: '36px', fontWeight: 800, color: 'var(--accent-red)' }}>{metrics.pendingApprovals}</p>
        </div>

        <div className="glass-panel hover-glow" style={{ padding: '24px' }}>
          <h3 style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '14px' }}>Total Orders</h3>
          <p style={{ fontSize: '36px', fontWeight: 800, color: 'var(--accent-green)' }}>{metrics.totalOrders}</p>
        </div>

        <div className="glass-panel hover-glow" style={{ padding: '24px' }}>
          <h3 style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '14px' }}>Conversion Rate</h3>
          <p style={{ fontSize: '36px', fontWeight: 800 }}>{metrics.conversionRate}</p>
        </div>

      </div>

      <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Total Revenue</h2>
      <div className="glass-panel" style={{ padding: '24px', minHeight: '100px' }}>
        <p style={{ fontSize: '32px', fontWeight: 600, color: 'var(--accent-blue)' }}>
          ฿ {metrics.totalRevenue.toLocaleString()}
        </p>
      </div>
    </div>
  );
}
