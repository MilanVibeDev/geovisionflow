const { scrapeWebsite } = require('../utils/scraper');
const { getPageSpeed } = require('../utils/pageSpeed');
const { getAIAudit } = require('../utils/aiAnalyzer');
const { supabase } = require('../utils/supabase');

// ── Daily Rate Limit ─────────────────────────────────────────────────────────
// In-memory store: { [key]: { date: 'YYYY-MM-DD', count: N } }
// Key = user UUID (authenticated) or 'ip:<address>' (guest).
// Resets automatically at next midnight UTC.
const DAILY_LIMIT = 1;
const usageStore = new Map();

const getTodayUTC = () => new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'

/**
 * Returns { allowed: bool, usedToday: number, resetsAt: string }
 * and increments the counter when allowed=true.
 */
const checkAndIncrementLimit = (key) => {
    const today = getTodayUTC();
    const entry = usageStore.get(key);

    if (!entry || entry.date !== today) {
        // New day or first ever — reset
        usageStore.set(key, { date: today, count: 1 });
        return { allowed: true, usedToday: 1 };
    }

    if (entry.count >= DAILY_LIMIT) {
        // Calculate ms until midnight UTC
        const now = new Date();
        const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
        const hoursLeft = Math.ceil((midnight - now) / 36e5);
        return { allowed: false, usedToday: entry.count, hoursLeft };
    }

    entry.count += 1;
    return { allowed: true, usedToday: entry.count };
};

/**
 * Decodes a Supabase/JWT Bearer token without verifying the signature
 * (server already trusts the DB; we just need the sub/user ID).
 */
const extractUserIdFromToken = (authHeader) => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    try {
        const payload = authHeader.split('.')[1];
        const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
        return decoded.sub || null; // Supabase uses 'sub' for the user UUID
    } catch {
        return null;
    }
};

/**
 * Computes the Technical SEO score from scraped data.
 *
 * This is calculated entirely from objective, verifiable signals —
 * no AI guesswork involved. Each deduction has a clear reason.
 *
 * Max: 100
 */
const calcTechScore = (seoData, perfScore) => {
    let score = 100;
    const deductions = [];

    // Page Title
    if (!seoData.title) {
        score -= 15;
        deductions.push({ field: 'title', issue: 'Missing', severity: 'critical' });
    } else if (seoData.title.length < 30 || seoData.title.length > 60) {
        score -= 5;
        deductions.push({ field: 'title', issue: `Length ${seoData.title.length} chars (ideal: 30-60)`, severity: 'warning' });
    }

    // Meta Description
    if (!seoData.description) {
        score -= 15;
        deductions.push({ field: 'description', issue: 'Missing', severity: 'critical' });
    } else if (seoData.description.length < 120 || seoData.description.length > 160) {
        score -= 5;
        deductions.push({ field: 'description', issue: `Length ${seoData.description.length} chars (ideal: 120-160)`, severity: 'warning' });
    }

    // H1 tag
    if (seoData.h1Count === 0) {
        score -= 15;
        deductions.push({ field: 'h1', issue: 'No H1 tag found', severity: 'critical' });
    } else if (seoData.h1Count > 1) {
        score -= 8;
        deductions.push({ field: 'h1', issue: `${seoData.h1Count} H1 tags found (should be exactly 1)`, severity: 'warning' });
    }

    // Viewport meta (mobile-friendliness signal)
    if (!seoData.hasViewport) {
        score -= 10;
        deductions.push({ field: 'viewport', issue: 'Missing viewport meta tag — not mobile-friendly', severity: 'critical' });
    }

    // Image Alt Text
    if (seoData.imagesCount > 0) {
        const altRatio = seoData.imagesWithAlt / seoData.imagesCount;
        if (altRatio < 0.5) {
            score -= 10;
            deductions.push({ field: 'images', issue: `Only ${seoData.imagesWithAlt}/${seoData.imagesCount} images have alt text`, severity: 'critical' });
        } else if (altRatio < 1.0) {
            score -= 5;
            deductions.push({ field: 'images', issue: `${seoData.imagesWithAlt}/${seoData.imagesCount} images have alt text (aim for 100%)`, severity: 'warning' });
        }
    }

    // Content depth (word count)
    if (seoData.wordCount < 300) {
        score -= 10;
        deductions.push({ field: 'content', issue: `Thin content: only ${seoData.wordCount} words (minimum 300 recommended)`, severity: 'critical' });
    } else if (seoData.wordCount < 600) {
        score -= 5;
        deductions.push({ field: 'content', issue: `Moderate content: ${seoData.wordCount} words (600+ recommended for ranking)`, severity: 'warning' });
    }

    // H2 structure (sub-headings show content organisation)
    if (!seoData.h2Tags || seoData.h2Tags.length === 0) {
        score -= 5;
        deductions.push({ field: 'h2', issue: 'No H2 tags — content lacks structural hierarchy', severity: 'warning' });
    }

    // Page Speed
    if (perfScore === null || perfScore === undefined) {
        // No penalty — API may be unavailable
    } else if (perfScore < 40) {
        score -= 20;
        deductions.push({ field: 'performance', issue: `Very slow (PageSpeed: ${perfScore}/100)`, severity: 'critical' });
    } else if (perfScore < 70) {
        score -= 10;
        deductions.push({ field: 'performance', issue: `Slow (PageSpeed: ${perfScore}/100)`, severity: 'warning' });
    } else if (perfScore < 90) {
        score -= 3;
        deductions.push({ field: 'performance', issue: `Could be faster (PageSpeed: ${perfScore}/100)`, severity: 'info' });
    }

    return {
        score: Math.max(0, score),
        deductions
    };
};

const runAnalysis = async ({ url, keyword, country }) => {
    if (!url) {
        const err = new Error('URL is required');
        err.statusCode = 400;
        throw err;
    }

    const targetCountry = country !== 'global' ? (country || 'global') : 'global';
    const targetKeyword = keyword || 'general';

    console.log(`Starting analysis for ${url} (KW: ${targetKeyword}, Country: ${targetCountry})`);

    // 0. Check Cache (Audit within last 24 hours)
    try {
        const yesterday = new Date();
        yesterday.setHours(yesterday.getHours() - 24);

        const { data: cachedAudit, error: cacheError } = await supabase
            .from('audits')
            .select('*')
            .eq('url', url)
            .order('created_at', { ascending: false })
            .limit(1);

        if (!cacheError && cachedAudit && cachedAudit.length > 0) {
            const lastAuditDate = new Date(cachedAudit[0].created_at);
            const hasResults = cachedAudit[0].ai_score !== null && cachedAudit[0].geo_score !== null;

            if (lastAuditDate > yesterday && hasResults) {
                console.log(`Using cached result for ${url}`);
                return {
                    url: cachedAudit[0].url,
                    scores: {
                        technical: cachedAudit[0].tech_score,
                        performance: cachedAudit[0].perf_score,
                        aio: cachedAudit[0].ai_score,
                        geo: cachedAudit[0].geo_score
                    },
                    techDeductions: cachedAudit[0].seo_data?.techDeductions || [],
                    seoData: cachedAudit[0].seo_data,
                    perfData: cachedAudit[0].perf_data,
                    aiAudit: cachedAudit[0].ai_audit,
                    cached: true
                };
            } else if (lastAuditDate > yesterday && !hasResults) {
                console.log(`Detected failed audit in cache for ${url}, skipping for fresh analysis`);
            }
        }
    } catch (cacheEx) {
        console.error('Cache check error:', cacheEx.message);
    }

    // 1. Scrape Website
    console.log('Step 1: Scraping website...');
    const seoData = await scrapeWebsite(url);
    console.log('Step 1: Scraping successful');

    // 2. Performance (PageSpeed)
    console.log('Step 2: Getting PageSpeed data...');
    const perfData = await getPageSpeed(url);
    console.log('Step 2: PageSpeed successful');

    // 3. Calculate Technical Score — formula-based, honest
    console.log('Step 3: Calculating technical score...');
    const { score: techScore, deductions: techDeductions } = calcTechScore(seoData, perfData.score);

    // 4. AI Analysis
    console.log('Step 4: Starting AI analysis...');
    const aiCountry = targetCountry === 'global' ? seoData.detectedGeo : targetCountry;
    const aiAudit = await getAIAudit(seoData, targetKeyword, aiCountry);
    console.log('Step 4: AI analysis completed');

    const result = {
        url,
        scores: {
            technical: techScore,
            performance: perfData.score ?? null,
            aio: aiAudit.aioScore ?? null,
            geo: aiAudit.geoScore ?? null
        },
        techDeductions,
        seoData: {
            ...seoData,
            targetKeyword,
            targetCountry
        },
        perfData,
        aiAudit,
        cached: false
    };

    // 5. Save to Supabase
    try {
        await supabase.from('audits').insert([{
            url: result.url,
            tech_score: result.scores.technical,
            perf_score: result.scores.performance,
            ai_score: result.scores.aio,
            geo_score: result.scores.geo,
            seo_data: { ...result.seoData, techDeductions },
            ai_audit: result.aiAudit,
            perf_data: result.perfData
        }]);
        console.log('Saved new audit to database');
    } catch (dbError) {
        console.error('Failed to save to Supabase:', dbError.message);
    }

    return result;
};

const analyzeWebsite = async (req, res) => {
    // ── Identify caller ─────────────────────────────────────────────────────
    const userId = extractUserIdFromToken(req.headers['authorization']);
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
    const limitKey = userId ? `user:${userId}` : `ip:${ip}`;

    // ── Check if result is already cached (no AI cost) ──────────────────────
    // We still allow cached responses through even if the limit is reached
    // because they cost $0 in API usage. Check cache first.
    const { url } = req.body || {};
    let isCached = false;
    if (url) {
        try {
            const yesterday = new Date();
            yesterday.setHours(yesterday.getHours() - 24);
            const { data: cachedAudit } = await supabase
                .from('audits')
                .select('created_at, ai_score, geo_score')
                .eq('url', url)
                .order('created_at', { ascending: false })
                .limit(1);
            if (cachedAudit?.length > 0) {
                const lastDate = new Date(cachedAudit[0].created_at);
                const hasResults = cachedAudit[0].ai_score !== null && cachedAudit[0].geo_score !== null;
                if (lastDate > yesterday && hasResults) isCached = true;
            }
        } catch { /* ignore */ }
    }

    // ── Enforce limit only for fresh (non-cached) analyses ──────────────────
    if (!isCached) {
        const limitCheck = checkAndIncrementLimit(limitKey);
        if (!limitCheck.allowed) {
            console.log(`Rate limit hit for ${limitKey} (${limitCheck.usedToday}/${DAILY_LIMIT} today)`);
            return res.status(429).json({
                error: 'DAILY_LIMIT_REACHED',
                message: `You have used your ${DAILY_LIMIT} free analysis for today. Your limit resets in approximately ${limitCheck.hoursLeft} hour(s).`,
                hoursLeft: limitCheck.hoursLeft,
                limit: DAILY_LIMIT,
                usedToday: limitCheck.usedToday
            });
        }
    }

    try {
        const result = await runAnalysis(req.body || {});
        res.json(result);
    } catch (error) {
        console.error('Error during analysis:', error);
        // If analysis failed, refund the usage slot so the user can retry
        if (!isCached) {
            const entry = usageStore.get(limitKey);
            if (entry && entry.count > 0) entry.count -= 1;
        }
        res.status(error.statusCode || 500).json({ error: 'Failed to analyze website. ' + error.message });
    }
};

module.exports = { analyzeWebsite, runAnalysis };
