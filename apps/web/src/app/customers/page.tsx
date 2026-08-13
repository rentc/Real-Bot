import { fetchGroups } from '@/lib/api';
import CustomersClient from './CustomersClient';

export default async function CustomersPage() {
  const groups = await fetchGroups();
  return <CustomersClient groups={groups} />;
}
