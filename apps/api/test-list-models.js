const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.list({});
    console.log("=== AVAILABLE MODELS ===");
    
    // Some versions of the SDK return the models array inside response.data or similar
    const models = response.models || response.data || response;
    
    if (Array.isArray(models)) {
        for (const model of models) {
            console.log(model.name);
        }
    } else {
        console.log("Unrecognized response format:", typeof response, response);
    }
  } catch (e) {
    console.log('Error listing models:', e.message);
  }
}
listModels();
