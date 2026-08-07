"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const firebase_module_1 = require("./shared/firebase/firebase.module");
const health_module_1 = require("./modules/health/health.module");
const auth_module_1 = require("./modules/auth/auth.module");
const line_module_1 = require("./modules/line/line.module");
const groups_module_1 = require("./modules/groups/groups.module");
const users_module_1 = require("./modules/users/users.module");
const products_module_1 = require("./modules/products/products.module");
const prices_module_1 = require("./modules/prices/prices.module");
const stock_module_1 = require("./modules/stock/stock.module");
const ai_module_1 = require("./shared/ai/ai.module");
const sessions_module_1 = require("./modules/sessions/sessions.module");
const matching_module_1 = require("./modules/matching/matching.module");
const quotations_module_1 = require("./modules/quotations/quotations.module");
const approvals_module_1 = require("./modules/approvals/approvals.module");
const pdf_module_1 = require("./modules/pdf/pdf.module");
const orders_module_1 = require("./modules/orders/orders.module");
const payments_module_1 = require("./modules/payments/payments.module");
const analytics_module_1 = require("./modules/analytics/analytics.module");
const erp_adapter_module_1 = require("./modules/erp-adapter/erp-adapter.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env', '../../.env'],
            }),
            throttler_1.ThrottlerModule.forRoot([{
                    ttl: 60000,
                    limit: 100,
                }]),
            firebase_module_1.FirebaseModule,
            health_module_1.HealthModule,
            auth_module_1.AuthModule,
            line_module_1.LineModule,
            groups_module_1.GroupsModule,
            users_module_1.UsersModule,
            products_module_1.ProductsModule,
            prices_module_1.PricesModule,
            stock_module_1.StockModule,
            ai_module_1.AiModule,
            sessions_module_1.SessionsModule,
            matching_module_1.MatchingModule,
            quotations_module_1.QuotationsModule,
            approvals_module_1.ApprovalsModule,
            pdf_module_1.PdfModule,
            orders_module_1.OrdersModule,
            payments_module_1.PaymentsModule,
            analytics_module_1.AnalyticsModule,
            erp_adapter_module_1.ErpAdapterModule,
        ],
    })
], AppModule);
