const axios = require('axios');
const cheerio = require('cheerio');

const scrapeWebsite = async (url) => {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            },
            timeout: 15000 // 15s timeout
        });
        const html = response.data;
        const $ = cheerio.load(html);

        const title = $('title').text().trim();
        const description = $('meta[name="description"]').attr('content') || '';
        const h1 = [];
        $('h1').each((i, el) => h1.push($(el).text().trim()));
        const h2 = [];
        $('h2').each((i, el) => h2.push($(el).text().trim()));

        const imagesCount = $('img').length;
        const imagesWithAlt = $('img[alt]').length;

        const textContent = $('body').text().replace(/\s+/g, ' ').trim();
        const wordCount = textContent.split(' ').length;

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
        console.error('Error scraping website:', error.message);
        throw new Error('Failed to scrape the target URL. Make sure the link is Public.');
    }
};

module.exports = { scrapeWebsite };
