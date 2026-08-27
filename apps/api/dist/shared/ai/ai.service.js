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
var AiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const genai_1 = require("@google/genai");
let AiService = AiService_1 = class AiService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(AiService_1.name);
        const apiKey = this.configService.get('GEMINI_API_KEY') || process.env.GEMINI_API_KEY;
        this.ai = new genai_1.GoogleGenAI({ apiKey });
    }
    async extractQuotationRequest(text) {
        this.logger.log(`Extracting from text using Regex: ${text}`);
        const items = [];
        const regex = /(FD-CV|CV|NYY|VCT|THW|VAF|VSF|VKF)\s+([\d\.]+(?:\s*[xX]\s*[\d\.]+)?)\s+(\d+)(?:\s*(?:เมตร|m|ม\.|ม้วน|ม))?/gi;
        let match;
        while ((match = regex.exec(text)) !== null) {
            items.push({
                type: match[1].toUpperCase(),
                size: match[2].replace(/\s+/g, '').toUpperCase(),
                quantity: parseInt(match[3], 10)
            });
        }
        let intent = 'OTHER';
        const lowerText = text.toLowerCase();
        if (items.length > 0 || lowerText.includes('ราคา') || lowerText.includes('quote') || lowerText.includes('price')) {
            intent = 'QUOTE';
        }
        return { intent, items };
    }
    async extractQuotationFromMedia(mediaBuffer, mimeType) {
        this.logger.log(`Extracting quotation from media (${mimeType})...`);
        const prompt = `You are an AI assistant for a Thai electrical cable supplier.
Your task is to extract cable requests from the attached image/document.
Return a JSON object containing:
- "intent": "QUOTE", "PRICE", "STOCK", or "OTHER"
- "items": array of objects with "type" (e.g. "NYY", "VCT"), "size" (e.g. "4x6", "4x4"), and "quantity" (number).
If the image doesn't contain a request for cables or pricing, return "intent": "OTHER".`;
        let rawText = '{}';
        try {
            const response = await this.ai.models.generateContent({
                model: 'gemini-3.6-flash',
                contents: [
                    prompt,
                    {
                        inlineData: {
                            data: mediaBuffer.toString('base64'),
                            mimeType: mimeType
                        }
                    }
                ],
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: genai_1.Type.OBJECT,
                        properties: {
                            intent: { type: genai_1.Type.STRING, enum: ['QUOTE', 'PRICE', 'STOCK', 'OTHER'] },
                            items: {
                                type: genai_1.Type.ARRAY,
                                items: {
                                    type: genai_1.Type.OBJECT,
                                    properties: {
                                        type: { type: genai_1.Type.STRING, description: "Cable type e.g. NYY, THW, VCT" },
                                        size: { type: genai_1.Type.STRING, description: "Size e.g. 4x6, 2x2.5" },
                                        quantity: { type: genai_1.Type.NUMBER, description: "Amount requested" }
                                    }
                                }
                            }
                        }
                    }
                }
            });
            rawText = response.text || '{}';
            rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
            const result = JSON.parse(rawText);
            return result;
        }
        catch (e) {
            this.logger.error('Failed to extract quotation from media', e);
            return { intent: 'OTHER', items: [], debug_error: e.message || String(e), debug_raw: rawText };
        }
    }
    async verifyPaymentSlip(imageBuffer, mimeType = 'image/jpeg') {
        this.logger.log('Verifying payment slip with Gemini Vision...');
        try {
            const response = await this.ai.models.generateContent({
                model: 'gemini-3.6-flash',
                contents: [
                    "Analyze this image. If it resembles a bank transfer slip, receipt, or any payment proof, set isSlip to true and extract the details. Be lenient: even if it's slightly blurry or from an unrecognized bank, treat it as a slip if it contains transfer details.",
                    {
                        inlineData: {
                            data: imageBuffer.toString('base64'),
                            mimeType: mimeType
                        }
                    }
                ],
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: genai_1.Type.OBJECT,
                        properties: {
                            isSlip: { type: genai_1.Type.BOOLEAN, description: "True if the image is a bank transfer slip or payment proof" },
                            amount: { type: genai_1.Type.NUMBER, description: "The exact amount of money transferred, e.g. 1500.50 (leave empty if unreadable)" },
                            receiverName: { type: genai_1.Type.STRING, description: "The name of the person or company receiving the money" },
                            bankRef: { type: genai_1.Type.STRING, description: "The reference number, transaction ID, or ref code" },
                            transferDate: { type: genai_1.Type.STRING, description: "The date and time of transfer, if available" },
                            rawTextDetected: { type: genai_1.Type.STRING, description: "Any raw text you can read from the slip for debugging" }
                        }
                    }
                }
            });
            let rawText = response.text || '{}';
            rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(rawText);
        }
        catch (e) {
            this.logger.error('Failed to verify slip', e);
            return { isSlip: false, error: e.message };
        }
    }
};
exports.AiService = AiService;
exports.AiService = AiService = AiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AiService);
