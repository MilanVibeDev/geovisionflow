require('dotenv').config();
const axios = require('axios');

async function testGemini() {
    console.log("Using key:", process.env.GEMINI_API_KEY ? "Loaded" : "Missing");
    const model = process.env.AI_MODEL || 'gemini-1.5-flash';
    const prompt = 'Hello';
    
    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            },
            {
                timeout: 30000
            }
        );
        console.log("Success:", response.data.candidates[0].content.parts[0].text);
    } catch (e) {
        console.error("Error:", e.response?.data || e.message);
    }
}
testGemini();
