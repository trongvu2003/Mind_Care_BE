// src/modules/journal/journal.service.ts
import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class JournalService {
  private enabled = (process.env.USE_FIRESTORE ?? 'false') === 'true';
  private db: FirebaseFirestore.Firestore | null = null;

  constructor() {
    if (this.enabled) {
      if (admin.apps.length === 0) admin.initializeApp();
      this.db = admin.firestore();
    }
  }

  async addJournal(userId: string, content: string, sentiment: any) {
    if (!this.enabled || !this.db) return;
    await this.db.collection('journals').add({
      userId,
      content,
      sentiment,
      createdAt: Date.now(),
    });
  }

  async addEmotionSnapshot(userId: string, faces: any[]) {
    if (!this.enabled || !this.db) return;
    await this.db.collection('emotion_snapshots').add({
      userId,
      faces,
      createdAt: Date.now(),
    });
  }
}
