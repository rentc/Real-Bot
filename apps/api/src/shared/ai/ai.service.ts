import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI, Type } from '@google/genai';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly ai: GoogleGenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') || process.env.GEMINI_API_KEY;
    this.ai = new GoogleGenAI({ apiKey });
  }

  async extractQuotationRequest(text: string) {
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

      rawText = response.text || '{}';
      // Remove markdown code blocks if any
      rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

      const result = JSON.parse(rawText);
      return result;
    } catch (e: any) {
      this.logger.error('Failed to generate or parse AI response', e);
      return { intent: 'OTHER', items: [], debug_error: e.message || String(e), debug_raw: rawText };
    }
  }

  async extractQuotationFromMedia(mediaBuffer: Buffer, mimeType: string) {
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

      rawText = response.text || '{}';
      // Remove markdown code blocks if any
      rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

      const result = JSON.parse(rawText);
      return result;
    } catch (e: any) {
      this.logger.error('Failed to extract quotation from media', e);
      return { intent: 'OTHER', items: [], debug_error: e.message || String(e), debug_raw: rawText };
    }
  }

  async verifyPaymentSlip(imageBuffer: Buffer, mimeType: string = 'image/jpeg') {
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
            type: Type.OBJECT,
            properties: {
              isSlip: { type: Type.BOOLEAN, description: "True if the image is a valid bank transfer slip" },
              amount: { type: Type.NUMBER, description: "The exact amount of money transferred, e.g. 1500.50" },
              receiverName: { type: Type.STRING, description: "The name of the person or company receiving the money" },
              bankRef: { type: Type.STRING, description: "The reference number, transaction ID, or ref code" },
              transferDate: { type: Type.STRING, description: "The date and time of transfer, if available" }
            }
          }
        }
      });

      let rawText = response.text || '{}';
      rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(rawText);
    } catch (e: any) {
      this.logger.error('Failed to verify slip', e);
      return { isSlip: false, error: e.message };
    }
  }
}
