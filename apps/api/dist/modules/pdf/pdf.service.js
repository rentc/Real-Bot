"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var PdfService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfService = void 0;
const common_1 = require("@nestjs/common");
const playwright_1 = require("playwright");
let PdfService = PdfService_1 = class PdfService {
    constructor() {
        this.logger = new common_1.Logger(PdfService_1.name);
        this.browser = null;
    }
    async onModuleInit() {
        this.logger.log('Initializing Playwright browser for PDF generation');
        try {
            this.browser = await playwright_1.chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        }
        catch (e) {
            this.logger.error('Failed to launch Playwright browser', e);
        }
    }
    async onModuleDestroy() {
        if (this.browser) {
            await this.browser.close();
        }
    }
    async generatePdfFromHtml(htmlContent) {
        if (!this.browser) {
            this.browser = await playwright_1.chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        }
        const page = await this.browser.newPage();
        try {
            await page.setContent(htmlContent, { waitUntil: 'networkidle' });
            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
            });
            return pdfBuffer;
        }
        finally {
            await page.close();
        }
    }
};
exports.PdfService = PdfService;
exports.PdfService = PdfService = PdfService_1 = __decorate([
    (0, common_1.Injectable)()
], PdfService);
