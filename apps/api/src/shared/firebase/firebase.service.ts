import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  public db!: Firestore;
  public storage!: any;

  onModuleInit() {
    if (!getApps().length) {
      initializeApp();
      this.logger.log('Firebase Admin SDK initialized');
    }
    this.db = getFirestore();
    this.db.settings({ ignoreUndefinedProperties: true });
    this.storage = getStorage().bucket();
  }
}
