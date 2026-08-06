import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseModule } from './shared/firebase/firebase.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { LineModule } from './modules/line/line.module';
import { GroupsModule } from './modules/groups/groups.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { PricesModule } from './modules/prices/prices.module';
import { StockModule } from './modules/stock/stock.module';

import { AiModule } from './shared/ai/ai.module';
import { SessionsModule } from './modules/sessions/sessions.module';

import { MatchingModule } from './modules/matching/matching.module';
import { QuotationsModule } from './modules/quotations/quotations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    FirebaseModule,
    HealthModule,
    AuthModule,
    LineModule,
    GroupsModule,
    UsersModule,
    ProductsModule,
    PricesModule,
    StockModule,
    AiModule,
    SessionsModule,
    MatchingModule,
    QuotationsModule,
  ],
})
export class AppModule {}
