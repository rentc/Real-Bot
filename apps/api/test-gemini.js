const { GoogleGenAI, Type } = require('@google/genai');
require('dotenv').config();

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log('❌ NO API KEY FOUND IN .env');
    return;
  }
  console.log('✅ Found API Key starting with:', apiKey.substring(0, 5) + '...');
  
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `You are an AI assistant for a Thai electrical cable supplier.
Your task is to extract cable requests from the user message.
User message: "เสนอราคา 1. สายไฟอ่อน VCT 4 x 4 1000 เมตร 2. NYY 4x6 1000 เมตร"

Return a JSON object containing:
- "intent": "QUOTE", "PRICE", "STOCK", or "OTHER"
- "items": array of objects with "type" (e.g. "NYY", "VCT"), "size" (e.g. "4x6", "4x4"), and "quantity" (number).
`;

  try {
    console.log('⏳ Calling Gemini API...');
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            intent: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: { type: Type.OBJECT }
            }
          }
        }
      }
    });
    console.log('✅ SUCCESS! Response:', response.text);
  } catch (e) {
    console.log('❌ ERROR CALLING GEMINI:', e.message);
    if (e.status === 400 || e.status === 403) {
      console.log('👉 PLEASE CHECK IF YOUR GEMINI_API_KEY IS VALID!');
    }
  }
}
test();
