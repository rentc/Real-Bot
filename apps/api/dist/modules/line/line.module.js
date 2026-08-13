"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LineModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const groups_module_1 = require("../groups/groups.module");
const users_module_1 = require("../users/users.module");
const line_api_service_1 = require("./line-api.service");
const line_webhook_controller_1 = require("./line-webhook.controller");
const line_webhook_service_1 = require("./line-webhook.service");
const ai_module_1 = require("../../shared/ai/ai.module");
const sessions_module_1 = require("../sessions/sessions.module");
const quotations_module_1 = require("../quotations/quotations.module");
const approvals_module_1 = require("../approvals/approvals.module");
const orders_module_1 = require("../orders/orders.module");
let LineModule = class LineModule {
};
exports.LineModule = LineModule;
exports.LineModule = LineModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule, groups_module_1.GroupsModule, users_module_1.UsersModule, ai_module_1.AiModule, sessions_module_1.SessionsModule, quotations_module_1.QuotationsModule, (0, common_1.forwardRef)(() => approvals_module_1.ApprovalsModule), orders_module_1.OrdersModule],
        providers: [line_api_service_1.LineApiService, line_webhook_service_1.LineWebhookService],
        controllers: [line_webhook_controller_1.LineWebhookController],
        exports: [line_api_service_1.LineApiService],
    })
], LineModule);
