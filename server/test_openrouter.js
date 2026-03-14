const axios = require('axios');
const key = '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';

const candidateModels = [
    'google/gemini-2.0-flash-exp:free',
    'google/gemini-2.0-flash-lite-preview-02-05:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'mistralai/mistral-7b-instruct:free',
    'google/gemini-flash-1.5-exp:free',
    'openrouter/auto',
    'google/gemini-2.0-flash:free'
];

async function run() {
    for (const model of candidateModels) {
        try {
            console.log(`Testing model: ${model}`);
            const res = await axios.post(
                'https://openrouter.ai/api/v1/chat/completions',
                {
                    model: model,
                    messages: [{ role: 'user', content: "hello" }]
                },
                {
                    headers: {
                        'Authorization': `Bearer ${key}`,
                        'HTTP-Referer': 'https://geovisionflow.com',
                        'X-Title': 'SEO Calc'
                    }
                }
            );
            console.log("SUCCESS:", res.data?.choices[0]?.message);
        } catch (err) {
            console.dir(err.response?.data || err.message, {depth: null});
        }
    }
}
run();
