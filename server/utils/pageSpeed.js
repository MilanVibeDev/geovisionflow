const axios = require('axios');

const getPageSpeed = async (url) => {
    try {
        let apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile`;
        if (process.env.PAGESPEED_API_KEY) {
            apiUrl += `&key=${process.env.PAGESPEED_API_KEY}`;
        }
        const response = await axios.get(apiUrl, { timeout: 20000 });
        const data = response.data;

        const lighthouse = data?.lighthouseResult;
        const metrics = lighthouse?.audits;
        const performance = lighthouse?.categories?.performance;

        if (!lighthouse || !metrics || !performance) {
            console.warn('PageSpeed API returned incomplete data for:', url);
            return {
                score: 0,
                fcp: 'N/A',
                lcp: 'N/A',
                cls: 'N/A',
                tti: 'N/A',
                speedIndex: 'N/A',
                error: 'Partial data received from PageSpeed API'
            };
        }

        return {
            score: Math.round((performance.score || 0) * 100),
            fcp: metrics['first-contentful-paint']?.displayValue || 'N/A',
            lcp: metrics['largest-contentful-paint']?.displayValue || 'N/A',
            cls: metrics['cumulative-layout-shift']?.displayValue || 'N/A',
            tti: metrics['interactive']?.displayValue || 'N/A',
            speedIndex: metrics['speed-index']?.displayValue || 'N/A',
        };
    } catch (error) {
        console.error('PageSpeed API Error:', error.message);
        // Fallback or default if limits exceeded
        return {
            score: 0,
            fcp: 'N/A',
            lcp: 'N/A',
            cls: 'N/A',
            tti: 'N/A',
            speedIndex: 'N/A',
        };
    }
};

module.exports = { getPageSpeed };
