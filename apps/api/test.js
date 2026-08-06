const { GoogleGenAI } = require('@google/genai');
async function test() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const testModels = ['gemini-3.5-flash', 'gemini-flash-latest'];
  for (const m of testModels) {
    try {
      console.log(`Testing model: ${m}`);
      const response = await ai.models.generateContent({
        model: m,
        contents: "Say hi"
      });
      console.log(`Success for ${m}: ${response.text}`);
    } catch (e) {
      console.error(`Failed for ${m}:`, e.message);
    }
  }
}
test();
