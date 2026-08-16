import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../../shared/firebase/firebase.service';

@Injectable()
export class BuyersService {
  constructor(private readonly firebase: FirebaseService) {}

  async getBuyerProfile(groupId: string) {
    const doc = await this.firebase.db.collection('buyerProfiles').doc(groupId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  async upsertBuyerProfile(groupId: string, data: {
    companyName?: string;
    contactName?: string;
    phone?: string;
    address?: string;
    taxId?: string;
    email?: string;
    tenantId?: string;
  }) {
    const ref = this.firebase.db.collection('buyerProfiles').doc(groupId);
    await ref.set({
      ...data,
      lineGroupId: groupId,
      tenantId: data.tenantId || 'tenant_wrc_main',
      updatedAt: new Date(),
    }, { merge: true });

    // Auto-activate the group when buyer profile is configured
    try {
      await this.firebase.db.collection('lineGroups').doc(groupId).update({
        status: 'ACTIVE',
        updatedAt: new Date(),
      });
    } catch (e) {
      console.error('Failed to update group status to ACTIVE', e);
    }

    const updated = await ref.get();
    return { id: updated.id, ...updated.data() };
  }
}
