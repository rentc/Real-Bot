import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
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

import { ApprovalsModule } from './modules/approvals/approvals.module';
import { PdfModule } from './modules/pdf/pdf.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';

import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ErpAdapterModule } from './modules/erp-adapter/erp-adapter.module';
import { BuyersModule } from './modules/buyers/buyers.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
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
    ApprovalsModule,
    PdfModule,
    OrdersModule,
    PaymentsModule,
    AnalyticsModule,
    ErpAdapterModule,
    BuyersModule,
  ],
})
export class AppModule {}
