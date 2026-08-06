import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI, Type } from '@google/genai';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly ai = new GoogleGenAI({});

  async extractQuotationRequest(text: string) {
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
          type: Type.OBJECT,
          properties: {
            intent: { type: Type.STRING, enum: ['QUOTE', 'PRICE', 'STOCK', 'OTHER'] },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, description: "Cable type e.g. NYY, THW, VCT" },
                  size: { type: Type.STRING, description: "Size e.g. 4x6, 2x2.5" },
                  quantity: { type: Type.NUMBER, description: "Amount requested" }
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
    } catch (e) {
      this.logger.error('Failed to parse AI response', e);
      return { intent: 'OTHER', items: [] };
    }
  }
}
