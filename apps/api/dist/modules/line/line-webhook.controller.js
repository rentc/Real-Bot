"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var LineWebhookController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LineWebhookController = void 0;
const common_1 = require("@nestjs/common");
const line_api_service_1 = require("./line-api.service");
const line_webhook_service_1 = require("./line-webhook.service");
let LineWebhookController = LineWebhookController_1 = class LineWebhookController {
    constructor(lineApi, webhookService) {
        this.lineApi = lineApi;
        this.webhookService = webhookService;
        this.logger = new common_1.Logger(LineWebhookController_1.name);
    }
    async handleWebhook(req, reply) {
        const signature = req.headers['x-line-signature'];
        const rawBody = req.rawBody || JSON.stringify(req.body);
        if (!this.lineApi.verifySignature(signature, rawBody)) {
            return reply.status(common_1.HttpStatus.UNAUTHORIZED).send({ error: 'Invalid signature' });
        }
        const body = req.body;
        const events = body?.events || [];
        for (const event of events) {
            try {
                await this.webhookService.processEvent(event);
            }
            catch (error) {
                this.logger.error(`Failed to process webhook event: ${event?.webhookEventId || 'unknown'}`, error instanceof Error ? error.stack : error);
            }
        }
        return reply.status(common_1.HttpStatus.OK).send({ status: 'ok' });
    }
};
exports.LineWebhookController = LineWebhookController;
__decorate([
    (0, common_1.Post)('webhook'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], LineWebhookController.prototype, "handleWebhook", null);
exports.LineWebhookController = LineWebhookController = LineWebhookController_1 = __decorate([
    (0, common_1.Controller)('line'),
    __metadata("design:paramtypes", [line_api_service_1.LineApiService,
        line_webhook_service_1.LineWebhookService])
], LineWebhookController);
