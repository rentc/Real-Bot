"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const genai_1 = require("@google/genai");
let AiService = AiService_1 = class AiService {
    constructor() {
        this.logger = new common_1.Logger(AiService_1.name);
        this.ai = new genai_1.GoogleGenAI({});
    }
    async extractQuotationRequest(text) {
        this.logger.log(`Extracting from text: ${text}`);
        const prompt = `You are a helpful assistant for a Thai electrical cable supplier.
    Extract the list of items the user wants a quotation or price for.
    If the user asks for something else, return an empty items list.
    User message: "${text}"`;
        const response = await this.ai.models.generateContent({
            model: 'gemini-3.5-flash',
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
        try {
            const result = JSON.parse(response.text || '{}');
            return result;
        }
        catch (e) {
            this.logger.error('Failed to parse AI response', e);
            return { intent: 'OTHER', items: [] };
        }
    }
};
exports.AiService = AiService;
exports.AiService = AiService = AiService_1 = __decorate([
    (0, common_1.Injectable)()
], AiService);
