// src/common/guards/firebase-auth.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor() {
    if (admin.apps.length === 0) {
      admin.initializeApp(); // sử dụng GOOGLE_APPLICATION_CREDENTIALS
    }
  }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const useAuth = (process.env.USE_FIREBASE_AUTH ?? 'false') === 'true';
    if (!useAuth) return true;

    const req = ctx.switchToHttp().getRequest();
    const auth = (req.headers.authorization || '').toString();
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token) throw new UnauthorizedException('Missing token');
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    return true;
  }
}
