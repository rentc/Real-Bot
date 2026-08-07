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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const payments_service_1 = require("./payments.service");
let PaymentsController = class PaymentsController {
    constructor(paymentsService) {
        this.paymentsService = paymentsService;
    }
    async submitEvidence(orderId, amount, evidenceUrl, req) {
        const userId = req.user?.id || 'anonymous_user';
        return this.paymentsService.submitPaymentEvidence(orderId, amount, evidenceUrl, userId);
    }
    async verifyPayment(paymentId, req) {
        const userId = req.user?.id || 'anonymous_admin';
        return this.paymentsService.verifyPayment(paymentId, userId);
    }
    async generateReceipt(orderId, req) {
        const userId = req.user?.id || 'anonymous_admin';
        return this.paymentsService.generateReceipt(orderId, userId);
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Post)(':orderId/evidence'),
    __param(0, (0, common_1.Param)('orderId')),
    __param(1, (0, common_1.Body)('amount')),
    __param(2, (0, common_1.Body)('evidenceUrl')),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, String, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "submitEvidence", null);
__decorate([
    (0, common_1.Post)(':paymentId/verify'),
    __param(0, (0, common_1.Param)('paymentId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "verifyPayment", null);
__decorate([
    (0, common_1.Post)(':orderId/receipt'),
    __param(0, (0, common_1.Param)('orderId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "generateReceipt", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, common_1.Controller)('payments'),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService])
], PaymentsController);
