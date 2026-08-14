import { fetchOrders, fetchGroups } from '@/lib/api';

export default async function Orders() {
  const [orders, groups] = await Promise.all([
    fetchOrders(),
    fetchGroups().catch(() => [])
  ]);

  const getCustomerName = (id: string) => {
    if (!id) return 'N/A';
    const group = groups.find((g: any) => g.id === id || g.lineGroupId === id);
    return group ? (group.groupName || group.name || id) : id;
  };

  return (
    <div>
      <h1 style={{ fontSize: '32px', marginBottom: '24px', fontWeight: 700 }}>
        Order <span className="text-gradient">Management</span>
      </h1>
      
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <input type="text" className="input-premium" placeholder="Search orders..." style={{ width: '300px' }} />
        <button className="btn-primary">Export CSV</button>
      </div>

      <div className="glass-panel" style={{ padding: '24px', minHeight: '400px' }}>
        {orders.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No orders found.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>Order Number</th>
                <th style={{ padding: '12px' }}>Customer</th>
                <th style={{ padding: '12px' }}>Total</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px' }}>Payment</th>
                <th style={{ padding: '12px' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order: any) => (
                <tr key={order.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px' }}>{order.orderNumber}</td>
                  <td style={{ padding: '12px' }}>{getCustomerName(order.customerId || order.groupId)}</td>
                  <td style={{ padding: '12px' }}>฿{order.total?.toLocaleString() || 0}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      background: order.status === 'DELIVERED' ? 'rgba(0, 230, 118, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                      color: order.status === 'DELIVERED' ? 'var(--accent-green)' : 'inherit'
                    }}>
                      {order.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontWeight: 'bold',
                        fontSize: '12px',
                        background: order.paymentStatus === 'PAID' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 193, 7, 0.1)',
                        color: order.paymentStatus === 'PAID' ? '#4CAF50' : '#FFC107'
                      }}>
                        {order.paymentStatus || 'PENDING'}
                      </span>
                      {order.slipUrl && (
                        <a 
                          href={order.slipUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          style={{
                            fontSize: '12px',
                            color: 'var(--accent-blue)',
                            textDecoration: 'underline'
                          }}
                        >
                          View Slip
                        </a>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>{new Date(order.createdAt?._seconds ? order.createdAt._seconds * 1000 : Date.now()).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
