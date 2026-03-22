const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');

const scrapeWebsite = async (url) => {
    try {
        // Robust axios configuration to handle various website conditions
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Upgrade-Insecure-Requests': '1'
            },
            timeout: 15000, // 15s timeout
            httpsAgent: new https.Agent({
                rejectUnauthorized: false // Ignore SSL certificate issues for scraping
            }),
            validateStatus: (status) => status < 500 // Allow 4xx statuses so we can at least try to scrape what's there
        });

        const html = response.data;
        if (!html || typeof html !== 'string') {
            throw new Error('Received non-textual content or empty response.');
        }

        const $ = cheerio.load(html);

        const title = $('title').text().trim() || $('meta[property="og:title"]').attr('content')?.trim() || '';
        const description = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';
        const h1 = [];
        $('h1').each((i, el) => h1.push($(el).text().trim()));
        const h2 = [];
        $('h2').each((i, el) => h2.push($(el).text().trim()));

        const imagesCount = $('img').length;
        const imagesWithAlt = $('img[alt]').filter((i, el) => $(el).attr('alt')?.trim().length > 0).length;

        // Clean up text content for better word counting and AI analysis
        const textContent = $('body')
            .clone()
            .find('script, style, nav, footer, header, noscript')
            .remove()
            .end()
            .text()
            .replace(/\s+/g, ' ')
            .trim();
        
        const wordCount = textContent.split(' ').filter(word => word.length > 0).length;

        const hasViewport = $('meta[name="viewport"]').length > 0;

        // Extract basic top level domain for geo assumption
        let tld = 'global';
        try {
            const urlObj = new URL(url);
            const parts = urlObj.hostname.split('.');
            tld = parts[parts.length - 1];
            if (tld === 'com' || tld === 'net' || tld === 'org') tld = 'Global';
            else tld = tld.toUpperCase();
        } catch (e) { }

        return {
            title,
            description,
            h1Count: h1.length,
            h1Tags: h1,
            h2Tags: h2,
            imagesCount,
            imagesWithAlt,
            wordCount,
            hasViewport,
            detectedGeo: tld,
            textContent: textContent.substring(0, 3000) // snippet for AI analysis
        };
    } catch (error) {
        console.error('❌ ERROR [Scraper]:', error.message);
        if (error.response) {
            console.error('   ↳ Status:', error.response.status);
            console.error('   ↳ Headers:', JSON.stringify(error.response.headers).substring(0, 200));
        }

        // Specific user-friendly messages for common errors
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            throw new Error('Website timed out. It might be too slow or blocking our crawler.');
        }
        if (error.response?.status === 403) {
            throw new Error('Access forbidden (403). The website is likely blocking automated requests.');
        }
        if (error.response?.status === 404) {
            throw new Error('Website not found (404). Check the URL and try again.');
        }

        throw new Error('Failed to scrape the target URL. Make sure the link is Public and accessible.');
    }
};

module.exports = { scrapeWebsite };
