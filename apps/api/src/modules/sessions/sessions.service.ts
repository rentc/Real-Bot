import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../../shared/firebase/firebase.service';

@Injectable()
export class SessionsService {
  constructor(private readonly firebase: FirebaseService) {}

  async upsertSession(groupId: string, userId: string, data: any) {
    const sessionId = `${groupId}_${userId}`;
    const docRef = this.firebase.db.collection('sessions').doc(sessionId);
    
    await docRef.set({
      groupId,
      userId,
      ...data,
      updatedAt: new Date(),
    }, { merge: true });

    return sessionId;
  }

  async getSession(groupId: string, userId: string) {
    const sessionId = `${groupId}_${userId}`;
    const doc = await this.firebase.db.collection('sessions').doc(sessionId).get();
    return doc.exists ? doc.data() : null;
  }

  async clearSession(groupId: string, userId: string) {
    const sessionId = `${groupId}_${userId}`;
    await this.firebase.db.collection('sessions').doc(sessionId).delete();
  }
}
