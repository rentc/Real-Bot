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
exports.QuotationsController = void 0;
const common_1 = require("@nestjs/common");
const quotations_service_1 = require("./quotations.service");
const pdf_service_1 = require("../pdf/pdf.service");
const wrc_quotation_template_1 = require("../pdf/templates/wrc-quotation.template");
const firebase_service_1 = require("../../shared/firebase/firebase.service");
const swagger_1 = require("@nestjs/swagger");
let QuotationsController = class QuotationsController {
    constructor(quotationsService, pdfService, firebase) {
        this.quotationsService = quotationsService;
        this.pdfService = pdfService;
        this.firebase = firebase;
    }
    async getQuotationPdf(id, res) {
        const quotation = await this.quotationsService.findOne(id);
        if (!quotation) {
            throw new common_1.NotFoundException(`Quotation with ID ${id} not found`);
        }
        let customerName = 'ทั่วไป';
        if (quotation.groupId) {
            try {
                const groupDoc = await this.firebase.db.collection('lineGroups').doc(quotation.groupId).get();
                if (groupDoc.exists) {
                    customerName = groupDoc.data()?.groupName || 'ทั่วไป';
                }
            }
            catch (e) {
            }
        }
        const templateData = {
            documentNumber: quotation.id,
            customerName,
            items: quotation.items || [],
            subtotal: quotation.subtotal || 0,
            vat: quotation.vat || 0,
            total: quotation.grandTotal || 0,
        };
        const htmlContent = (0, wrc_quotation_template_1.wrcQuotationTemplate)(templateData);
        const htmlWithPrint = htmlContent.replace('</body>', '<script>window.onload = function() { window.print(); }</script></body>');
        res.set({
            'Content-Type': 'text/html; charset=utf-8',
        });
        res.end(htmlWithPrint);
    }
};
exports.QuotationsController = QuotationsController;
__decorate([
    (0, common_1.Get)(':id/pdf'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a quotation PDF by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Quotation ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], QuotationsController.prototype, "getQuotationPdf", null);
exports.QuotationsController = QuotationsController = __decorate([
    (0, swagger_1.ApiTags)('quotations'),
    (0, common_1.Controller)('quotations'),
    __metadata("design:paramtypes", [quotations_service_1.QuotationsService,
        pdf_service_1.PdfService,
        firebase_service_1.FirebaseService])
], QuotationsController);
