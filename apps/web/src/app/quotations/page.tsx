import { fetchPendingApprovals } from '@/lib/api';

export default async function Quotations() {
  const pendingApprovals = await fetchPendingApprovals();

  return (
    <div>
      <h1 style={{ fontSize: '32px', marginBottom: '24px', fontWeight: 700 }}>
        Quotation <span className="text-gradient">Approvals</span>
      </h1>
      
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <input type="text" className="input-premium" placeholder="Search quotations..." style={{ width: '300px' }} />
        <button className="btn-primary">Create Quotation</button>
      </div>

      <div className="glass-panel" style={{ padding: '24px', minHeight: '400px' }}>
        {pendingApprovals.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No pending approvals right now.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>Request ID</th>
                <th style={{ padding: '12px' }}>Quotation ID</th>
                <th style={{ padding: '12px' }}>Submitted By</th>
                <th style={{ padding: '12px' }}>Date</th>
                <th style={{ padding: '12px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingApprovals.map((req: any) => (
                <tr key={req.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px' }}>{req.id}</td>
                  <td style={{ padding: '12px' }}>{req.quotationId}</td>
                  <td style={{ padding: '12px' }}>{req.submittedBy}</td>
                  <td style={{ padding: '12px' }}>{new Date(req.submittedAt?._seconds ? req.submittedAt._seconds * 1000 : Date.now()).toLocaleDateString()}</td>
                  <td style={{ padding: '12px' }}>
                    <button style={{ background: 'var(--accent-blue)', color: 'white', padding: '4px 12px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>Review</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
