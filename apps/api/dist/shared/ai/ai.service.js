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
        this.logger.log(`Extracting from text: ${text}`);
        const prompt = `You are an AI assistant for a Thai electrical cable supplier.
Your task is to extract cable requests from the user message.
User message: "${text}"

Return a JSON object containing:
- "intent": "QUOTE", "PRICE", "STOCK", or "OTHER"
- "items": array of objects with "type" (e.g. "NYY", "VCT"), "size" (e.g. "4x6", "4x4"), and "quantity" (number).

Examples:
- "ขอราคา NYY 4x6 100 เมตร" -> {"intent":"PRICE", "items":[{"type":"NYY","size":"4x6","quantity":100}]}
- "Quote NYY 4x6 100m" -> {"intent":"QUOTE", "items":[{"type":"NYY","size":"4x6","quantity":100}]}
- "เสนอราคา 1. VCT 4 x 4 1000 เมตร 2. THW 2.5 500 เมตร" -> {"intent":"QUOTE", "items":[{"type":"VCT","size":"4x4","quantity":1000}, {"type":"THW","size":"2.5","quantity":500}]}
`;
        let rawText = '{}';
        try {
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
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
            this.logger.error('Failed to generate or parse AI response', e);
            return { intent: 'OTHER', items: [], debug_error: e.message || String(e), debug_raw: rawText };
        }
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
                model: 'gemini-2.5-flash',
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
                model: 'gemini-2.5-flash',
                contents: [
                    "Extract information from this bank transfer slip. If it is clearly not a bank transfer slip, set isSlip to false.",
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
                            isSlip: { type: genai_1.Type.BOOLEAN, description: "True if the image is a valid bank transfer slip" },
                            amount: { type: genai_1.Type.NUMBER, description: "The exact amount of money transferred, e.g. 1500.50" },
                            receiverName: { type: genai_1.Type.STRING, description: "The name of the person or company receiving the money" },
                            bankRef: { type: genai_1.Type.STRING, description: "The reference number, transaction ID, or ref code" },
                            transferDate: { type: genai_1.Type.STRING, description: "The date and time of transfer, if available" }
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
