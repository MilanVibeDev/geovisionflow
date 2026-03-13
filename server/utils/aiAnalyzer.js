const axios = require('axios');

// ── Error type classifier ──────────────────────────────────────────────────────
/**
 * Classifies an axios/network error into one of three categories:
 *   API_ERROR     – Gemini returned an HTTP error (4xx/5xx from Google's API)
 *   NETWORK_ERROR – No response received (DNS failure, timeout, no internet)
 *   SERVER_ERROR  – Unexpected internal error (parse failure, bad config, etc.)
 */
const classifyError = (err) => {
    if (err.response) {
        // The request reached Google's servers and they returned an error status
        const status = err.response.status;
        const apiMsg = err.response?.data?.error?.message || err.response?.data?.error || err.message;
        return {
            type: 'API_ERROR',
            status,
            message: apiMsg,
            detail: err.response?.data
        };
    } else if (err.request) {
        // The request was made but no response was received
        const isTimeout = err.code === 'ECONNABORTED' || err.message?.includes('timeout');
        return {
            type: 'NETWORK_ERROR',
            status: null,
            message: isTimeout
                ? `Request timed out after ${err.config?.timeout || '?'}ms — Gemini API unreachable`
                : `No response from Gemini API — possible DNS failure or no internet connection (${err.code || err.message})`,
            detail: null
        };
    } else {
        // Something happened in setting up the request or in our parsing code
        return {
            type: 'SERVER_ERROR',
            status: null,
            message: err.message,
            detail: null
        };
    }
};

// ── Console logger for classified errors ──────────────────────────────────────
const logClassifiedError = (context, errInfo) => {
    const icons = { API_ERROR: '🔴 [API ERROR]', NETWORK_ERROR: '🟠 [NETWORK ERROR]', SERVER_ERROR: '🟡 [SERVER ERROR]' };
    const icon = icons[errInfo.type] || '❌ [ERROR]';
    console.error(`\n${icon} ${context}`);
    console.error(`  ↳ Type    : ${errInfo.type}`);
    if (errInfo.status) console.error(`  ↳ Status  : HTTP ${errInfo.status}`);
    console.error(`  ↳ Message : ${errInfo.message}`);
    if (errInfo.detail) console.error(`  ↳ Detail  :`, JSON.stringify(errInfo.detail, null, 2));
    console.error('');
};

/**
 * Sends scraped website data to the AI for honest, criteria-based analysis.
 *
 * Framework definitions (used in the prompt):
 *  - SEO  → improves website position on Google (backlinks, keywords, on-page)
 *  - AIO  → helps AI systems pull information FROM your site when answering questions
 *  - GEO  → makes AI systems MENTION YOUR BUSINESS to users
 *  - AEO  → Google AI Overview answers a question directly from your page
 */
const getAIAudit = async (seoData, keyword, country) => {
    try {
        const prompt = `
You are an expert SEO, AIO, and GEO analyst. Your task is to analyze a website's data and return HONEST, CRITICAL, and TRUTHFUL scores and recommendations — never inflate scores to make the user feel good.

=== FRAMEWORK DEFINITIONS ===
- SEO  : Improves search engine ranking (Google). Key factors: backlinks (external), relevant long-tail keywords (4+ words), search intent match, on-page optimisation (title, description, H1, image alt text, URL clarity), page speed, and mobile-friendliness.
- AIO  : Helps AI assistants (ChatGPT, Gemini, etc.) pull content FROM your site when answering questions. Key factors: being in the top 3 Google results, clear structured content, semantic clarity, FAQ-style answers, LLM-readable text.
- GEO  : Makes AI assistants MENTION YOUR BRAND when recommending businesses to users. Key factors: frequency of credible brand mentions, brand authority, consistency of NAP (Name/Address/Phone), presence in niche-relevant sources.
- AEO  : Makes Google's AI Overview feature answer questions directly FROM your page. Key factors: clear direct answers near the top of the page, FAQ schema, structured data (JSON-LD), strong brand mentions, concise and authoritative content.

=== WEBSITE DATA TO ANALYZE ===
Target Keyword: "${keyword || 'not specified'}"
Target Country/Region: "${country || 'Global'}"
Page Title: "${seoData.title || 'MISSING'}"
Meta Description: "${seoData.description || 'MISSING'}"
H1 Tags (${seoData.h1Count}): ${seoData.h1Tags.join(' | ') || 'NONE FOUND'}
H2 Tags: ${seoData.h2Tags.slice(0, 5).join(' | ') || 'NONE FOUND'}
Total Images: ${seoData.imagesCount}, Images With Alt Text: ${seoData.imagesWithAlt}
Word Count: ${seoData.wordCount}
Has Viewport Meta: ${seoData.hasViewport ? 'Yes' : 'No'}
Content Sample (first 2000 chars):
"${seoData.textContent.substring(0, 2000)}"

=== SCORING CRITERIA ===

AIO Score (0-100) — Can AI crawlers extract useful info from this page?
  - Content is well-structured and semantically clear: +20
  - Has clear answers to common questions in the niche: +20
  - Long-form, informative content (>800 words): +15
  - Clean headings hierarchy (H1, H2, H3): +15
  - Fast, mobile-friendly page (inferred from viewport tag): +10
  - No fluff or over-promotion, factual and helpful: +10
  - Presence of entity data (company name, location, service clearly stated): +10
  Score HONESTLY. A purely promotional page with no educational value scores 10-30. A well-structured FAQ-heavy page scores 70-90.

GEO Score (0-100) — How likely is an AI to RECOMMEND this brand?
  - Brand name is clearly and repeatedly stated in content: +20
  - Specific location or region is mentioned: +20
  - Niche and service are crystal clear from the content: +20
  - Content shows authority/expertise in niche (original insights, not generic): +20
  - Presence of social proof signals (reviews, testimonials, case studies): +20
  Score HONESTLY. Generic or thin pages score 10-30. Branded, location-specific, expert content scores 70-90.

LLM Readability: How easily can a language model parse this page?
  - "Good": Clean structure, semantic headings, factual content, >600 words
  - "Fair": Mixed quality, some structure but also promotional fluff
  - "Poor": Mostly promotional, thin, or unstructured content

AI Snippet Probability: Likelihood of being included in AI-generated answers
  - "High": Top-3 worthy SEO + excellent AIO/GEO signals
  - "Medium": Decent but room for improvement
  - "Low": Poor SEO or poor content quality

=== INSTRUCTIONS ===
1. Be CRITICAL and HONEST. If the page is missing key elements, score it LOW.
2. contentGaps should list REAL, specific things that are missing or weak — not generic advice.
3. actionPlan tasks should be SPECIFIC to the content and keyword analyzed, not boilerplate.
4. geoSuggestions: Provide 4 specific, actionable suggestions to improve GEO score.
5. geoRoadmap: Break down into technical, content, and visibility steps with SPECIFIC advice.
6. suggestedH1 and suggestedMetaTitle must include the target keyword "${keyword}" and follow best practices.

Return ONLY valid JSON, no explanation text outside the JSON:
{
    "aioScore": 0-100,
    "geoScore": 0-100,
    "aiSnippetProbability": "High|Medium|Low",
    "llmReadability": "Good|Fair|Poor",
    "contentGaps": ["specific gap 1", "specific gap 2", "specific gap 3"],
    "suggestedH1": "keyword-optimized H1 suggestion",
    "suggestedMetaTitle": "keyword-optimized meta title (50-60 chars)",
    "suggestedMetaDescription": "compelling meta description (120-160 chars)",
    "actionPlan": [
        { "priority": "High", "task": "specific action", "impact": "SEO|AIO|GEO|AEO" },
        { "priority": "High", "task": "specific action", "impact": "SEO|AIO|GEO|AEO" },
        { "priority": "Medium", "task": "specific action", "impact": "SEO|AIO|GEO|AEO" },
        { "priority": "Medium", "task": "specific action", "impact": "SEO|AIO|GEO|AEO" },
        { "priority": "Low", "task": "specific action", "impact": "SEO|AIO|GEO|AEO" }
    ],
    "aiVisibilityDetails": {
        "seoOptimization": 0-100,
        "brandMentions": 0-100,
        "technicalStructure": 0-100,
        "contentClarity": 0-100,
        "discoveryEase": "Easy|Moderate|Hard",
        "brandSentiment": "Positive|Neutral|Negative",
        "aiKeyAssociations": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
    },
    "geoRoadmap": {
        "technical": ["specific technical step 1", "specific technical step 2"],
        "content": ["specific content step 1", "specific content step 2"],
        "visibility": ["specific visibility step 1", "specific visibility step 2"]
    },
    "geoSuggestions": [
        "Suggestion 1: specific instruction",
        "Suggestion 2: specific instruction",
        "Suggestion 3: specific instruction",
        "Suggestion 4: specific instruction"
    ],
    "scoringRationale": {
        "aio": "1-2 sentence honest explanation of why the AIO score was given",
        "geo": "1-2 sentence honest explanation of why the GEO score was given"
    }
}
        `;

        const model = process.env.AI_MODEL || 'gemini-1.5-flash';

        let response;
        let attempts = 0;
        const maxAttempts = 3;
        
        while (attempts < maxAttempts) {
            try {
                console.log(`\n🤖 Attempt ${attempts + 1}/${maxAttempts}: AI analysis with model: ${model}`);
                response = await axios.post(
                    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
                    {
                        contents: [{ parts: [{ text: prompt }] }],
                        // NOTE: responseMimeType "application/json" is intentionally omitted.
                        // It causes HTTP 400 errors with gemini-2.0-flash. We parse JSON manually below.
                        generationConfig: {
                            temperature: 0.2,
                            topP: 0.8,
                            maxOutputTokens: 4096
                        }
                    },
                    {
                        timeout: 35000 // 35s timeout
                    }
                );
                console.log(`✅ Gemini responded successfully on attempt ${attempts + 1}`);
                break; // Success!
            } catch (err) {
                attempts++;
                const errInfo = classifyError(err);
                logClassifiedError(`Gemini attempt ${attempts}/${maxAttempts} failed`, errInfo);

                const isRateLimit = err.response?.status === 429;
                
                if (isRateLimit && attempts < maxAttempts) {
                    const waitTime = attempts * 5000; // 5s, 10s...
                    console.warn(`⏳ Rate limited (429). Retrying in ${waitTime / 1000}s...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    continue;
                }
                
                if (attempts === maxAttempts) throw err;
            }
        }

        if (!response) {
            throw new Error('Gemini analysis failed — no response after all retries');
        }

        if (!response.data || !response.data.candidates || response.data.candidates.length === 0) {
            const errInfo = { type: 'API_ERROR', status: 200, message: 'No candidates in Gemini response — likely safety filter triggered', detail: response.data };
            logClassifiedError('Gemini returned empty candidates', errInfo);
            throw new Error('AI Analysis failed - No response from model.');
        }

        const candidate = response.data.candidates[0];
        if (candidate.finishReason === 'SAFETY' || candidate.finishReason === 'OTHER') {
            const errInfo = { type: 'API_ERROR', status: 200, message: `Gemini blocked response. finishReason: ${candidate.finishReason}`, detail: candidate };
            logClassifiedError('Gemini blocked response', errInfo);
            throw new Error(`AI Analysis blocked by safety filters (${candidate.finishReason}).`);
        }

        let resultText = candidate.content.parts[0].text;
        
        // Ensure resultText is not empty
        if (!resultText) {
            const errInfo = { type: 'API_ERROR', status: 200, message: 'Gemini returned a candidate with empty text content', detail: candidate };
            logClassifiedError('Empty text in Gemini candidate', errInfo);
            throw new Error('Gemini returned an empty response.');
        }

        // Remove markdown formatting if present
        resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();

        // Ensure we only have the JSON part if there's any prefix/suffix
        const jsonStart = resultText.indexOf('{');
        const jsonEnd = resultText.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
            resultText = resultText.substring(jsonStart, jsonEnd + 1);
        }

        try {
            const parsed = JSON.parse(resultText);
            // Backwards-compat: map aioScore -> aiVisibilityScore for any code that still reads it
            parsed.aiVisibilityScore = parsed.aioScore;
            console.log(`\n✅ AI Analysis complete — AIO: ${parsed.aioScore}, GEO: ${parsed.geoScore}\n`);
            return parsed;
        } catch (parseErr) {
            const errInfo = { type: 'SERVER_ERROR', status: null, message: `JSON parse failed: ${parseErr.message}`, detail: resultText.substring(0, 300) };
            logClassifiedError('Failed to parse Gemini JSON output', errInfo);
            throw new Error('Failed to parse AI response. Model output was not valid JSON.');
        }

    } catch (error) {
        const errInfo = classifyError(error);
        logClassifiedError('getAIAudit — fatal error, returning fallback result', errInfo);

        return {
            aioScore: null,
            geoScore: null,
            aiVisibilityScore: null,
            aiSnippetProbability: 'Unknown',
            llmReadability: 'Unknown',
            errorType: errInfo.type,
            errorMessage: errInfo.message,
            contentGaps: [`AI analysis could not be completed — ${errInfo.type}: ${errInfo.message}`],
            suggestedH1: seoData.h1Tags[0] || 'N/A',
            suggestedMetaTitle: seoData.title || 'N/A',
            suggestedMetaDescription: seoData.description || 'N/A',
            actionPlan: [{ priority: 'High', task: `Retry the analysis — ${errInfo.type.replace('_', ' ')}: ${errInfo.message}`, impact: 'AIO' }],
            aiVisibilityDetails: {
                seoOptimization: null,
                brandMentions: null,
                technicalStructure: null,
                contentClarity: null,
                discoveryEase: 'Unknown',
                brandSentiment: 'Unknown',
                aiKeyAssociations: []
            },
            geoRoadmap: {
                technical: ['Complete a successful analysis to receive technical GEO steps.'],
                content: ['Complete a successful analysis to receive content GEO steps.'],
                visibility: ['Complete a successful analysis to receive visibility GEO steps.']
            },
            geoSuggestions: ['Retry the analysis to receive personalised GEO suggestions.'],
            scoringRationale: {
                aio: 'Analysis failed — no rationale available.',
                geo: 'Analysis failed — no rationale available.'
            }
        };
    }
};

module.exports = { getAIAudit };
