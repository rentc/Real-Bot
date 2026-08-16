import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../../shared/firebase/firebase.service';

@Injectable()
export class GroupsService {
  constructor(private readonly firebase: FirebaseService) {}

  async findAll() {
    const snapshot = await this.firebase.db.collection('lineGroups').orderBy('updatedAt', 'desc').get();
    
    // In Firestore, we might need to count memberships manually or maintain a counter,
    // but for now we'll just return the groups without the count to keep it simple,
    // or fetch the count by querying the subcollection for each (inefficient but works for small scale).
    const groups = await Promise.all(snapshot.docs.map(async (doc) => {
      const data = doc.data();
      const membershipsSnapshot = await doc.ref.collection('memberships').get();
      
      let buyerProfile = null;
      try {
         const buyerDoc = await this.firebase.db.collection('buyerProfiles').doc(doc.id).get();
         if (buyerDoc.exists) {
            buyerProfile = buyerDoc.data();
         }
      } catch (e) {}

      return {
        id: doc.id,
        ...data,
        buyerProfile,
        _count: {
          memberships: membershipsSnapshot.size,
        }
      };
    }));
    
    return groups;
  }

  async findOne(id: string) {
    const groupDoc = await this.firebase.db.collection('lineGroups').doc(id).get();

    if (!groupDoc.exists) {
      throw new NotFoundException(`Group with ID ${id} not found`);
    }
    
    const membershipsSnapshot = await groupDoc.ref.collection('memberships').get();
    
    const memberships = await Promise.all(membershipsSnapshot.docs.map(async (doc: any) => {
      const data = doc.data();
      let userProfile = {};
      try {
        const userDoc = await this.firebase.db.collection('lineUsers').doc(doc.id).get();
        if (userDoc.exists) {
          userProfile = userDoc.data() || {};
        }
      } catch (e) {
        console.error('Failed to fetch user profile', e);
      }

      let role = null;
      try {
        const rolesSnapshot = await doc.ref.collection('roles').where('isActive', '==', true).get();
        if (!rolesSnapshot.empty) {
          role = rolesSnapshot.docs[0].data().roleId;
        }
      } catch (e) {
        console.error('Failed to fetch role', e);
      }

      return {
        id: doc.id,
        ...data,
        ...userProfile,
        role,
      };
    }));

    return {
      id: groupDoc.id,
      ...groupDoc.data(),
      memberships,
    };
  }

  async assignRole(groupId: string, userId: string, roleId: string, assignedByUserId: string) {
    const groupRef = this.firebase.db.collection('lineGroups').doc(groupId);
    const groupDoc = await groupRef.get();
    if (!groupDoc.exists) {
      throw new NotFoundException(`Group with ID ${groupId} not found`);
    }

    const membershipRef = groupRef.collection('memberships').doc(userId);
    const membershipDoc = await membershipRef.get();

    if (!membershipDoc.exists) {
      throw new NotFoundException(`Membership for user ${userId} in group ${groupId} not found`);
    }

    // Deactivate existing roles
    const existingRoles = await membershipRef.collection('roles').get();
    const batch = this.firebase.db.batch();
    existingRoles.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    const rolesRef = membershipRef.collection('roles').doc(roleId);
    await rolesRef.set({
      roleId: roleId,
      assignedBy: assignedByUserId,
      isActive: true,
      updatedAt: new Date(),
    }, { merge: true });

    return { success: true };
  }

  async removeRole(groupId: string, userId: string, roleId: string) {
    const groupRef = this.firebase.db.collection('lineGroups').doc(groupId);
    const groupDoc = await groupRef.get();
    if (!groupDoc.exists) throw new NotFoundException(`Group not found`);

    const membershipRef = groupRef.collection('memberships').doc(userId);
    const membershipDoc = await membershipRef.get();
    if (!membershipDoc.exists) throw new NotFoundException(`Membership not found`);

    const roleRef = membershipRef.collection('roles').doc(roleId);
    await roleRef.delete();

    return { success: true };
  }
}
