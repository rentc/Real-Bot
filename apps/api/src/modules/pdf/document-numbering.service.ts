import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../../shared/firebase/firebase.service';

@Injectable()
export class DocumentNumberingService {
  constructor(private readonly firebase: FirebaseService) {}

  async generateDocumentNumber(tenantId: string, prefix: string = 'QT'): Promise<string> {
    const db = this.firebase.db;
    const date = new Date();
    // Format YYYYMMDD
    const yearMonthDay = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
    
    // We append the date to the counter ID so it resets daily
    const counterRef = db.collection('document_counters').doc(`${tenantId}_${prefix}_${yearMonthDay}`);

    const newNumber = await db.runTransaction(async (t) => {
      const doc = await t.get(counterRef);
      let currentSeq = 0;
      
      if (doc.exists) {
        currentSeq = doc.data()?.sequence || 0;
      }
      
      const nextSeq = currentSeq + 1;
      
      t.set(counterRef, { sequence: nextSeq }, { merge: true });
      return nextSeq;
    });

    const sequenceStr = newNumber.toString().padStart(2, '0');
    
    return `${prefix}-${yearMonthDay}${sequenceStr}`;
  }
}
