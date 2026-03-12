const axios = require('axios');

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

        const model = process.env.AI_MODEL || 'gemini-2.5-flash';

        let response;
        try {
            console.log(`Attempting AI analysis with Gemini model: ${model}`);
            response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
                {
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        responseMimeType: "application/json"
                    }
                },
                {
                    timeout: 30000 // 30s timeout
                }
            );
        } catch (err) {
            console.error(`Gemini Model ${model} failed:`, err.response?.data?.error?.message || err.message);
            throw err;
        }

        if (!response) {
            throw new Error('Gemini analysis failed');
        }

        if (response.data.usageMetadata) {
            const { totalTokenCount, promptTokenCount, candidatesTokenCount } = response.data.usageMetadata;
            console.log(`Gemini Usage - Model: ${model}, Total Tokens: ${totalTokenCount} (P: ${promptTokenCount}, C: ${candidatesTokenCount})`);
        }

        let resultText = response.data.candidates[0].content.parts[0].text;

        // Remove markdown formatting if present
        resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();

        // Ensure we only have the JSON part if there's any prefix/suffix
        const jsonStart = resultText.indexOf('{');
        const jsonEnd = resultText.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
            resultText = resultText.substring(jsonStart, jsonEnd + 1);
        }

        const parsed = JSON.parse(resultText);

        // Backwards-compat: map aioScore -> aiVisibilityScore for any code that still reads it
        parsed.aiVisibilityScore = parsed.aioScore;

        return parsed;

    } catch (error) {
        console.error('Gemini AI Analysis Error:', error.response?.data || error.message);
        return {
            aioScore: null,
            geoScore: null,
            aiVisibilityScore: null,
            aiSnippetProbability: 'Unknown',
            llmReadability: 'Unknown',
            contentGaps: ['AI analysis could not be completed — API error or rate limit. Scores are unavailable.'],
            suggestedH1: seoData.h1Tags[0] || 'N/A',
            suggestedMetaTitle: seoData.title || 'N/A',
            suggestedMetaDescription: seoData.description || 'N/A',
            actionPlan: [{ priority: 'High', task: 'Retry the analysis — AI API returned an error.', impact: 'AIO' }],
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
