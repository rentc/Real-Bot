import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { FirebaseService } from '../../shared/firebase/firebase.service';

export interface JwtPayload {
  sub: string; // user ID
  email: string;
  tenantId: string;
  isSuperAdmin: boolean;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly firebase: FirebaseService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const usersSnapshot = await this.firebase.db.collection('users').where('email', '==', email).limit(1).get();
    
    if (usersSnapshot.empty) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const userDoc = usersSnapshot.docs[0];
    const user = userDoc.data();
    const userId = userDoc.id;

    if (!user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    let tenantName = 'Unknown Tenant';
    if (user.tenantId) {
      const tenantDoc = await this.firebase.db.collection('tenants').doc(user.tenantId).get();
      if (tenantDoc.exists) {
        tenantName = tenantDoc.data()?.name || tenantName;
      }
    }

    const payload: JwtPayload = {
      sub: userId,
      email: user.email,
      tenantId: user.tenantId,
      isSuperAdmin: user.isSuperAdmin,
    };

    return {
      accessToken: this.jwt.sign(payload),
      user: {
        id: userId,
        email: user.email,
        displayName: user.displayName,
        tenantId: user.tenantId,
        tenantName: tenantName,
        isSuperAdmin: user.isSuperAdmin,
      },
    };
  }

  async validateUser(payload: JwtPayload) {
    const userDoc = await this.firebase.db.collection('users').doc(payload.sub).get();
    
    if (!userDoc.exists) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const user = userDoc.data();
    if (!user?.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }
    
    return {
      id: userDoc.id,
      email: user.email,
      tenantId: user.tenantId,
      isSuperAdmin: user.isSuperAdmin,
    };
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }
}
