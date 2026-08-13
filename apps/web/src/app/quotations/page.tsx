import { fetchPendingApprovals, fetchApprovalHistory } from '@/lib/api';
import QuotationsClient from './QuotationsClient';

export default async function Quotations() {
  const [pendingApprovals, approvalHistory] = await Promise.all([
    fetchPendingApprovals(),
    fetchApprovalHistory()
  ]);

  return <QuotationsClient initialApprovals={pendingApprovals} initialHistory={approvalHistory} />;
}
