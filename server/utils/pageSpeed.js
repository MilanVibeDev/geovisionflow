const axios = require('axios');

const getPageSpeed = async (url) => {
    try {
        let apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile`;
        if (process.env.PAGESPEED_API_KEY) {
            apiUrl += `&key=${process.env.PAGESPEED_API_KEY}`;
        }
        const response = await axios.get(apiUrl);
        const data = response.data;

        const lighthouse = data.lighthouseResult;
        const metrics = lighthouse.audits;

        return {
            score: Math.round(lighthouse.categories.performance.score * 100),
            fcp: metrics['first-contentful-paint'].displayValue,
            lcp: metrics['largest-contentful-paint'].displayValue,
            cls: metrics['cumulative-layout-shift'].displayValue,
            tti: metrics['interactive'].displayValue,
            speedIndex: metrics['speed-index'].displayValue,
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
