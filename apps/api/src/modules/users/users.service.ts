import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../../shared/firebase/firebase.service';

@Injectable()
export class UsersService {
  constructor(private readonly firebase: FirebaseService) {}

  async findAll() {
    const snapshot = await this.firebase.db.collection('users').get();
    return snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email,
        displayName: data.displayName,
        isActive: data.isActive,
        isSuperAdmin: data.isSuperAdmin,
        tenantId: data.tenantId,
        createdAt: data.createdAt,
      };
    });
  }
}
