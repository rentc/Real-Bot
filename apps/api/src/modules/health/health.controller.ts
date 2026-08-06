import { Controller, Get } from '@nestjs/common';
import { FirebaseService } from '../../shared/firebase/firebase.service';

@Controller('health')
export class HealthController {
  constructor(private readonly firebase: FirebaseService) {}

  @Get()
  async check() {
    let dbStatus = 'ok';
    try {
      // Just a simple query to check if firestore connection is ok
      await this.firebase.db.collection('health_check').limit(1).get();
    } catch {
      dbStatus = 'error';
    }

    return {
      status: dbStatus === 'ok' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
      },
    };
  }
}
