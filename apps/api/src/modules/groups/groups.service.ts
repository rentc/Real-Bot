import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../../shared/firebase/firebase.service';

@Injectable()
export class GroupsService {
  constructor(private readonly firebase: FirebaseService) {}

  async findAll() {
    const snapshot = await this.firebase.db.collection('lineGroups').orderBy('createdAt', 'desc').get();
    
    // In Firestore, we might need to count memberships manually or maintain a counter,
    // but for now we'll just return the groups without the count to keep it simple,
    // or fetch the count by querying the subcollection for each (inefficient but works for small scale).
    const groups = [];
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      const membershipsSnapshot = await doc.ref.collection('memberships').get();
      
      groups.push({
        id: doc.id,
        ...data,
        _count: {
          memberships: membershipsSnapshot.size,
        }
      });
    }
    
    return groups;
  }

  async findOne(id: string) {
    const groupDoc = await this.firebase.db.collection('lineGroups').doc(id).get();

    if (!groupDoc.exists) {
      throw new NotFoundException(`Group with ID ${id} not found`);
    }
    
    const membershipsSnapshot = await groupDoc.ref.collection('memberships').get();
    const memberships = membershipsSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // To populate lineUser and roles, we'd need more joins. For simplicity we assume
    // the membership document stores the roles array and lineUser references.

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

    const roleDoc = await this.firebase.db.collection('roles').doc(roleId).get();
    if (!roleDoc.exists) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

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
