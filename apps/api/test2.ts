import { GoogleGenAI, Type } from '@google/genai';
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log('NO API KEY');
    return;
  }
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `You are an AI assistant for a Thai electrical cable supplier.
Your task is to extract cable requests from the user message.
User message: "เสนอราคา 1. สายไฟอ่อน VCT 4 x 4 1000 เมตร 2. NYY 4x6 1000 เมตร"

Return a JSON object containing:
- "intent": "QUOTE", "PRICE", "STOCK", or "OTHER"
- "items": array of objects with "type" (e.g. "NYY", "VCT"), "size" (e.g. "4x6", "4x4"), and "quantity" (number).

Examples:
- "ขอราคา NYY 4x6 100 เมตร" -> {"intent":"PRICE", "items":[{"type":"NYY","size":"4x6","quantity":100}]}
- "เสนอราคา 1. VCT 4 x 4 1000 เมตร 2. THW 2.5 500 เมตร" -> {"intent":"QUOTE", "items":[{"type":"VCT","size":"4x4","quantity":1000}, {"type":"THW","size":"2.5","quantity":500}]}
`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
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
    console.log('SUCCESS:', response.text);
  } catch (e) {
    console.log('ERROR:', e.message);
  }
}
test();
