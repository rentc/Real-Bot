'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { approveQuotation, rejectQuotation, deleteQuotationRequest } from '@/lib/api';

export default function QuotationsClient({ 
  initialApprovals,
  initialHistory 
}: { 
  initialApprovals: any[],
  initialHistory?: any[]
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  
  // Local state to avoid needing a hard refresh
  const [localPending, setLocalPending] = useState(initialApprovals || []);
  const [localHistory, setLocalHistory] = useState(initialHistory || []);
  
  // Rejection state
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleApprove = async (id: string) => {
    try {
      setLoading(id);
      await approveQuotation(id);
      
      // Update local state
      const requestToMove = localPending.find(r => r.id === id);
      if (requestToMove) {
        setLocalPending(prev => prev.filter(r => r.id !== id));
        setLocalHistory(prev => [{ ...requestToMove, status: 'APPROVED' }, ...prev]);
      }
      
      alert('Quotation approved successfully! The LINE bot has notified the group.');
      setSelectedRequest(null);
    } catch (error) {
      alert('Failed to approve quotation. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) {
      alert('Please enter a reason for rejection.');
      return;
    }
    
    try {
      setLoading(id);
      await rejectQuotation(id, rejectReason);
      
      // Update local state
      const requestToMove = localPending.find(r => r.id === id);
      if (requestToMove) {
        setLocalPending(prev => prev.filter(r => r.id !== id));
        setLocalHistory(prev => [{ ...requestToMove, status: 'REJECTED' }, ...prev]);
      }
      
      alert('Quotation rejected successfully.');
      setSelectedRequest(null);
      setIsRejecting(false);
      setRejectReason('');
    } catch (error) {
      alert('Failed to reject quotation. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quotation request from the list?')) return;
    
    try {
      setLoading(`delete-${id}`);
      await deleteQuotationRequest(id);
      
      // Update local state
      setLocalPending(prev => prev.filter(r => r.id !== id));
      setLocalHistory(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      alert('Failed to delete request.');
    } finally {
      setLoading(null);
    }
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return '0.00';
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const currentList = activeTab === 'pending' ? localPending : localHistory;

  return (
    <div>
      <h1 style={{ fontSize: '32px', marginBottom: '24px', fontWeight: 700 }}>
        Quotation <span className="text-gradient">Approvals</span>
      </h1>
      
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <input type="text" className="input-premium" placeholder="Search quotations..." style={{ width: '300px' }} />
        <button className="btn-primary">Create Quotation</button>
      </div>
      
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <button 
          onClick={() => setActiveTab('pending')}
          style={{ 
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'pending' ? '2px solid var(--accent-blue)' : '2px solid transparent',
            color: activeTab === 'pending' ? 'var(--text-primary)' : 'var(--text-secondary)',
            padding: '8px 16px',
            fontSize: '16px',
            cursor: 'pointer',
            fontWeight: activeTab === 'pending' ? 'bold' : 'normal',
            transition: 'all 0.2s'
          }}
        >
          Pending ({localPending.length})
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          style={{ 
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'history' ? '2px solid var(--accent-blue)' : '2px solid transparent',
            color: activeTab === 'history' ? 'var(--text-primary)' : 'var(--text-secondary)',
            padding: '8px 16px',
            fontSize: '16px',
            cursor: 'pointer',
            fontWeight: activeTab === 'history' ? 'bold' : 'normal',
            transition: 'all 0.2s'
          }}
        >
          History
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '24px', minHeight: '400px' }}>
        {currentList.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No {activeTab} approvals right now.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>Request ID</th>
                <th style={{ padding: '12px' }}>Quotation ID</th>
                <th style={{ padding: '12px' }}>Submitted By</th>
                <th style={{ padding: '12px' }}>Date</th>
                {activeTab === 'history' && <th style={{ padding: '12px' }}>Status</th>}
                <th style={{ padding: '12px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentList.map((req: any) => (
                <tr key={req.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px' }}>{req.id}</td>
                  <td style={{ padding: '12px' }}>{req.quotationId}</td>
                  <td style={{ padding: '12px' }}>{req.submittedBy}</td>
                  <td style={{ padding: '12px' }}>{new Date(req.submittedAt?._seconds ? req.submittedAt._seconds * 1000 : Date.now()).toLocaleDateString()}</td>
                  {activeTab === 'history' && (
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        color: req.status === 'APPROVED' ? '#4CAF50' : '#F44336',
                        fontWeight: 'bold',
                        fontSize: '12px',
                        padding: '4px 8px',
                        background: req.status === 'APPROVED' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                        borderRadius: '4px'
                      }}>
                        {req.status}
                      </span>
                    </td>
                  )}
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => {
                          setSelectedRequest(req);
                          setIsRejecting(false);
                          setRejectReason('');
                        }}
                        style={{ 
                          background: 'var(--accent-blue)', 
                          color: 'white', 
                          padding: '6px 16px', 
                          borderRadius: '6px', 
                          border: 'none', 
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          transition: 'background 0.2s'
                        }}
                      >
                        Review
                      </button>
                      <button 
                        onClick={() => handleDelete(req.id)}
                        disabled={loading === `delete-${req.id}`}
                        style={{ 
                          background: 'transparent', 
                          color: '#F44336', 
                          padding: '6px 16px', 
                          borderRadius: '6px', 
                          border: '1px solid rgba(244, 67, 54, 0.3)', 
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          transition: 'background 0.2s',
                          opacity: loading === `delete-${req.id}` ? 0.5 : 1
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Review Modal */}
      {selectedRequest && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="glass-panel" style={{ width: '600px', maxWidth: '90%', padding: '32px', position: 'relative' }}>
            <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>Review Quotation</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              <strong>Quotation ID:</strong> {selectedRequest.quotationId}
            </p>
            
            {selectedRequest.quotation ? (
              <>
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Items Requested:</h3>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {(selectedRequest.quotation.items || []).map((item: any, i: number) => (
                      <li key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                        <span>
                          {item.name} (x{item.quantity})
                          {item.unitPrice !== undefined && (
                            <span style={{ color: 'var(--text-secondary)', fontSize: '13px', marginLeft: '8px' }}>
                              (฿{formatCurrency(item.unitPrice)}/unit)
                            </span>
                          )}
                        </span>
                        <span>฿{formatCurrency(item.total)}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                    <div><span style={{ color: 'var(--text-secondary)' }}>Subtotal:</span> ฿{formatCurrency(selectedRequest.quotation.subtotal)}</div>
                    <div><span style={{ color: 'var(--text-secondary)' }}>VAT (7%):</span> ฿{formatCurrency(selectedRequest.quotation.vat)}</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--accent-blue)' }}>
                      Total: ฿{formatCurrency(selectedRequest.quotation.grandTotal)}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Loading details...</p>
            )}

            {isRejecting ? (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Reason for Rejection</label>
                <textarea 
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="E.g., Price is too low, please revise."
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'white', border: '1px solid #ccc', color: 'black', minHeight: '80px', fontFamily: 'inherit' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                  <button 
                    onClick={() => setIsRejecting(false)}
                    style={{ background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    Back
                  </button>
                  <button 
                    onClick={() => handleReject(selectedRequest.id)}
                    disabled={loading === selectedRequest.id}
                    style={{ background: '#F44336', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', opacity: loading === selectedRequest.id ? 0.7 : 1 }}
                  >
                    {loading === selectedRequest.id ? 'Rejecting...' : 'Confirm Rejection'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button 
                  onClick={() => setSelectedRequest(null)}
                  style={{ background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  {activeTab === 'pending' && (
                    <button 
                      onClick={() => setIsRejecting(true)}
                      style={{ background: 'transparent', color: '#F44336', border: '1px solid rgba(244, 67, 54, 0.3)', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Reject
                    </button>
                  )}
                  {activeTab === 'pending' && (
                    <button 
                      onClick={() => handleApprove(selectedRequest.id)}
                      disabled={loading === selectedRequest.id}
                      className="btn-primary"
                      style={{ opacity: loading === selectedRequest.id ? 0.7 : 1 }}
                    >
                      {loading === selectedRequest.id ? 'Approving...' : 'Approve Quotation'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
