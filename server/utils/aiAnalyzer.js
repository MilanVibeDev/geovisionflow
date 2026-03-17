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

const getAIAudit = async (seoData, keyword, country) => {
    try {
        const prompt = `
You are an expert SEO / AIO / GEO / AEO analyst. Your task is to analyze a website's data and return HONEST, CRITICAL, and TRUTHFUL scores and recommendations — never inflate scores to make the user feel good.

=== FRAMEWORK DEFINITIONS ===
- SEO  : Improves website position on Google.
   • Backlinks and mentions on other relevant websites.
   • Keyword demand + relevance to the actual solution (e.g. "automation agency in serbia").
   • Correct search intent match (blog vs landing vs product vs tool).
   • On-page optimisation (title/description/H1, headings, image alt text, URL clarity, internal navigation).
   • Page speed and mobile friendliness.
- AIO  : Helps AI assistants (ChatGPT, Gemini, Perplexity, etc.) pull information FROM the site when answering questions.
   • Being in (or worthy of) top-3 Google for that query.
   • Clear, structured, factual content; FAQ-style answers; concise explanations.
   • Tables, lists, and schemas that make stats and steps easy to extract.
   • Blogs that answer very specific, long-tail questions, in human style (not generic AI fluff).
- GEO  : Makes AI assistants actively MENTION THIS BRAND when recommending businesses.
   • Clear brand name + what it does + which industries it helps (e.g. tech/agency/SaaS).
   • Location / region is explicit (city/country, "in Serbia", etc.).
   • Proof and depth: case studies, "from our experience", specific results.
   • Implied off-site presence: mentions/reviews/case studies that would realistically exist on other niche websites.
- AEO  : Google AI (AI Overviews) answers questions DIRECTLY from this page.
   • Direct, 40–60 word answers for FAQs.
   • Specific "how we did X for Y" stories, not generic advice.
   • Structured data (FAQPage, HowTo, LocalBusiness) and tables that are easy to quote.
   • The page combines text, images, and maybe videos/diagrams to support clear answers.

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

=== SCORING CRITERIA (MUST FOLLOW) ===

AIO Score (0-100) — Can AI crawlers extract useful info from this page?
  - Content is well-structured and semantically clear (good H1/H2/H3, sections): +15
  - Has clear answers to specific questions people actually ask (FAQs, "how to", "best X for Y"): +20
  - Uses long-tail, niche-specific phrasing (4+ word phrases like "automation agency in serbia for marketing agencies"): +10
  - Long-form, informative content (>800 words) that is easy to skim with sub-headings and lists: +10
  - FAQ answers are roughly 40–60 words and to the point: +10
  - Clean headings hierarchy (only one H1, logical H2s): +10
  - Fast, mobile-friendly page (viewport meta present and content not bloated): +10
  - No fluff or obvious generic AI text; includes phrases like "from our experience" and specific case details: +10
  - Structured tables or bullet lists that summarise stats, processes, or comparisons: +5
  Score HONESTLY. A purely promotional, generic landing page with no specific answers scores 10–30. A well-structured, FAQ‑rich, niche page scores 70–90.

GEO Score (0-100) — How likely is an AI to RECOMMEND this brand?
  - Brand name and website are clearly and repeatedly mentioned in a natural way: +20
  - At least one clear location / region (city, country, "in Serbia", etc.) is mentioned: +15
  - The industries and niches the brand serves are explicit (e.g. tech, agencies, SaaS, e‑commerce): +10
  - Content deeply explains HOW the brand helps these niches (3+ concrete examples, case studies, or scenarios): +15
  - Presence of social proof: testimonials, "(Google) reviews", case study stories, YouTube videos, or Reddit posts embedded / referenced: +15
  - FAQ or blog titles are human and story‑like (e.g. "How an animated video attracted more customers to XYZ company", not generic AI titles): +10
  - Navigation makes it obvious what the brand offers and where to click for each service: +5
  - 404 and support pages help users quickly find alternative pages or a search bar: +10
  Score HONESTLY. Generic brochure pages with weak branding score 10–30. Strong, story‑driven, proof‑heavy brand pages score 70–90.

AEO Influence (do NOT give a separate numeric score, but use this when deciding AIO/GEO scores and recommendations):
  - The page contains clear, copy‑pastable answers to niche questions in ~40–60 words.
  - FAQs and sections read like direct answers, not intros or vague marketing.
  - Structured tables, lists, and diagrams make statistics and comparisons easy to quote.
  - The content is written in a way that could realistically appear in Google's AI Overview snippets.

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
2. Use the following heuristics DIRECTLY in your analysis:
   • SEO: demand + relevance of the keyword, search intent (blog vs landing vs product vs tool), clear URL text, on-page elements (titles, headings, alt text), internal navigation clarity, lack of duplicate content on many pages.
   • AIO: whether this page actually answers specific questions people in this niche ask (like questions you would see in "People also ask" on Google or on Reddit threads), and whether the answers are concise, clear, and structured.
   • GEO: how strongly the brand is tied to specific niches/industries and locations, and how likely it is that users would see this brand as a recommended option in AI answers.
   • AEO: how "snippet-ready" the content is — short, clear answer blocks, tables, FAQs with 40–60 word replies, clear "from our experience" style storytelling.
3. contentGaps MUST be concrete and based on the page. Example: "No mention of specific industries (e.g. agencies, SaaS)", "FAQ answers are too long and not 40–60 words".
4. actionPlan tasks MUST be SPECIFIC to this page and keyword, and should map to SEO, AIO, GEO or AEO (or combinations). Each task should feel like something a human strategist would actually do next on this page.
5. geoSuggestions: Provide 4 specific, actionable suggestions to improve GEO score, focusing on brand mentions, industries, reviews, case studies, and local signals.
6. geoRoadmap: Break down into technical, content, and visibility steps with SPECIFIC advice (e.g. "Implement LocalBusiness JSON‑LD with city + industry", not just "add schema").
7. suggestedH1 and suggestedMetaTitle must include the target keyword "${keyword}" and follow best practices (human‑sounding, not generic AI titles).

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

        const model = process.env.AI_MODEL || 'gemini-flash-latest';

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

/**
 * Create AI-written narrative for a PDF report.
 * Returns a small JSON payload so PDF layout stays consistent.
 */
const getAIReport = async (analysisResult) => {
    try {
        const url = analysisResult?.url || '';
        const scores = analysisResult?.scores || {};
        const seoData = analysisResult?.seoData || {};
        const aiAudit = analysisResult?.aiAudit || {};

        const prompt = `
You are an expert SEO / AIO / GEO / AEO strategist.
Write concise, high-signal report text for a PDF. Be honest and practical.

Website: ${url}
Scores:
- Technical SEO: ${scores.technical ?? 'N/A'}
- Page Speed: ${scores.performance ?? 'N/A'}
- AIO: ${scores.aio ?? 'N/A'}
- GEO: ${scores.geo ?? 'N/A'}

Target keyword: ${seoData.targetKeyword || 'general'}
Target region: ${seoData.targetCountry || 'global'}

Scraped signals:
- Title present: ${seoData.title ? 'Yes' : 'No'}
- Description present: ${seoData.description ? 'Yes' : 'No'}
- H1 count: ${seoData.h1Count ?? 'N/A'}
- H2 count: ${Array.isArray(seoData.h2Tags) ? seoData.h2Tags.length : 'N/A'}
- Word count: ${seoData.wordCount ?? 'N/A'}
- Images with alt: ${(seoData.imagesWithAlt ?? 0)}/${(seoData.imagesCount ?? 0)}
- Mobile viewport: ${seoData.hasViewport ? 'Yes' : 'No'}

AI audit context:
- AIO rationale: ${aiAudit?.scoringRationale?.aio || 'N/A'}
- GEO rationale: ${aiAudit?.scoringRationale?.geo || 'N/A'}
- Content gaps: ${(aiAudit?.contentGaps || []).slice(0, 8).join(' | ') || 'N/A'}
- Action plan: ${(aiAudit?.actionPlan || []).slice(0, 8).map(p => `${p.priority}: ${p.task} (${p.impact})`).join(' | ') || 'N/A'}

Output ONLY valid JSON:
{
  "executiveSummary": "3-6 sentences max. Mention what to fix first and why.",
  "topImprovements": ["10 items max. Start with the highest impact actions."],
  "contentGaps": ["up to 8 concrete gaps"]
}
        `.trim();

        const model = process.env.AI_MODEL || 'gemini-flash-latest';
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.2,
                    topP: 0.8,
                    maxOutputTokens: 1200
                }
            },
            { timeout: 35000 }
        );

        const candidate = response?.data?.candidates?.[0];
        let resultText = candidate?.content?.parts?.[0]?.text || '';
        resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonStart = resultText.indexOf('{');
        const jsonEnd = resultText.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) resultText = resultText.substring(jsonStart, jsonEnd + 1);

        return JSON.parse(resultText);
    } catch (e) {
        return null;
    }
};

module.exports = { getAIAudit, getAIReport };
