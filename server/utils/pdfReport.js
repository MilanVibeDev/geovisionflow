const PDFDocument = require('pdfkit');

const safeText = (v) => (v === null || v === undefined ? '' : String(v));

const scoreLabel = (s) => {
    if (s === null || s === undefined) return 'N/A';
    if (s >= 80) return 'Good';
    if (s >= 55) return 'Fair';
    return 'Poor';
};

const scoreColor = (s) => {
    if (s === null || s === undefined) return '#6b7280';
    if (s >= 80) return '#4F46E5'; // indigo
    if (s >= 55) return '#F59E0B'; // amber
    return '#EF4444'; // red
};

const addSectionTitle = (doc, title) => {
    doc.moveDown(0.9);
    doc
        .font('Helvetica-Bold')
        .fontSize(13)
        .fillColor('#111827')
        .text(title, { underline: false });
    doc
        .moveDown(0.35)
        .lineWidth(1)
        .strokeColor('#E5E7EB')
        .moveTo(doc.page.margins.left, doc.y)
        .lineTo(doc.page.width - doc.page.margins.right, doc.y)
        .stroke();
    doc.moveDown(0.6);
};

const addBulletList = (doc, items, opts = {}) => {
    const { maxItems = 12 } = opts;
    if (!Array.isArray(items) || items.length === 0) return;

    items.slice(0, maxItems).forEach((t) => {
        const line = safeText(t).trim();
        if (!line) return;
        doc
            .font('Helvetica')
            .fontSize(10.5)
            .fillColor('#111827')
            .text(`• ${line}`, { indent: 10, continued: false });
        doc.moveDown(0.2);
    });
};

/**
 * Create a PDF report buffer for an analysis result.
 *
 * @param {object} analysisResult Same shape as /api/analyze response.
 * @param {object} aiReport Optional AI-written report sections.
 * @returns {Promise<Buffer>}
 */
const buildAuditPdfBuffer = async (analysisResult, aiReport) => {
    const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 48, left: 48, right: 48, bottom: 54 },
        bufferPages: true
    });

    const chunks = [];
    doc.on('data', (c) => chunks.push(c));

    const done = new Promise((resolve, reject) => {
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
    });

    const url = analysisResult?.url || '';
    const scores = analysisResult?.scores || {};
    const seoData = analysisResult?.seoData || {};
    const aiAudit = analysisResult?.aiAudit || {};

    // Header
    doc
        .font('Helvetica-Bold')
        .fontSize(20)
        .fillColor('#111827')
        .text('GeoVisionFlow Audit Report', { align: 'left' });
    doc
        .moveDown(0.2)
        .font('Helvetica')
        .fontSize(10.5)
        .fillColor('#6b7280')
        .text(`Website: ${safeText(url)}`);
    doc
        .font('Helvetica')
        .fontSize(10.5)
        .fillColor('#6b7280')
        .text(`Generated: ${new Date().toLocaleString()}`);

    // Score row
    doc.moveDown(1.0);
    const scoreItems = [
        { label: 'Technical SEO', value: scores.technical },
        { label: 'Page Speed', value: scores.performance },
        { label: 'AIO', value: scores.aio },
        { label: 'GEO', value: scores.geo }
    ];

    const startX = doc.x;
    const rowY = doc.y;
    const colGap = 14;
    const colWidth = (doc.page.width - doc.page.margins.left - doc.page.margins.right - colGap * 3) / 4;

    scoreItems.forEach((s, idx) => {
        const x = startX + idx * (colWidth + colGap);
        doc
            .save()
            .rect(x, rowY, colWidth, 58)
            .fill('#F9FAFB')
            .restore();

        doc
            .font('Helvetica-Bold')
            .fontSize(10)
            .fillColor('#374151')
            .text(s.label, x + 10, rowY + 10, { width: colWidth - 20 });

        const val = s.value === null || s.value === undefined ? '—' : `${s.value}`;
        doc
            .font('Helvetica-Bold')
            .fontSize(18)
            .fillColor(scoreColor(s.value))
            .text(val, x + 10, rowY + 26, { width: colWidth - 20 });

        doc
            .font('Helvetica')
            .fontSize(9.5)
            .fillColor('#6b7280')
            .text(scoreLabel(s.value), x + 10, rowY + 46, { width: colWidth - 20 });
    });
    doc.y = rowY + 68;

    // Executive summary (AI-generated)
    addSectionTitle(doc, 'Executive Summary');
    const summaryText =
        safeText(aiReport?.executiveSummary).trim() ||
        safeText(aiAudit?.scoringRationale?.aio).trim() ||
        'This report summarises your current SEO, AIO, GEO and AEO readiness and provides a prioritised improvement roadmap.';

    doc
        .font('Helvetica')
        .fontSize(11)
        .fillColor('#111827')
        .text(summaryText, { lineGap: 2 });

    // Top improvements
    addSectionTitle(doc, 'Top Improvements (Prioritised)');
    const topImprovements =
        Array.isArray(aiReport?.topImprovements) && aiReport.topImprovements.length > 0
            ? aiReport.topImprovements
            : (aiAudit?.actionPlan || []).map((p) => `${p.priority}: ${p.task} (${p.impact})`);
    addBulletList(doc, topImprovements, { maxItems: 12 });

    // Key findings (objective)
    addSectionTitle(doc, 'Key Findings (On-Page)');
    const findings = [];
    if (!seoData.title) findings.push('Missing meta title.');
    if (!seoData.description) findings.push('Missing meta description.');
    if (seoData.h1Count === 0) findings.push('No H1 tag found.');
    if (seoData.h1Count > 1) findings.push('Multiple H1 tags found (should be exactly 1).');
    if (!seoData.hasViewport) findings.push('Missing viewport meta tag (mobile friendliness).');
    if ((seoData.imagesCount || 0) > (seoData.imagesWithAlt || 0)) findings.push('Some images are missing alt text.');
    if ((seoData.wordCount || 0) < 600) findings.push('Content is relatively thin for competitive ranking (aim 600+ words).');
    if (!seoData.h2Tags || seoData.h2Tags.length === 0) findings.push('No H2 sub-headings detected (add structure).');
    if (findings.length === 0) findings.push('No critical on-page issues detected in the scraped signals.');
    addBulletList(doc, findings, { maxItems: 12 });

    // Content gaps
    addSectionTitle(doc, 'Content Gaps (AI)');
    addBulletList(doc, aiAudit?.contentGaps || aiReport?.contentGaps || [], { maxItems: 10 });

    // Suggested metadata
    addSectionTitle(doc, 'Suggested Metadata');
    const metaLines = [
        `Suggested Title: ${safeText(aiAudit?.suggestedMetaTitle || '')}`.trim(),
        `Suggested H1: ${safeText(aiAudit?.suggestedH1 || '')}`.trim(),
        `Suggested Description: ${safeText(aiAudit?.suggestedMetaDescription || '')}`.trim()
    ].filter((x) => x && !x.endsWith(':'));
    if (metaLines.length === 0) metaLines.push('No suggestions available (AI analysis may have failed).');
    metaLines.forEach((line) => {
        doc.font('Helvetica').fontSize(10.5).fillColor('#111827').text(line, { lineGap: 2 });
        doc.moveDown(0.25);
    });

    // Footer / page numbers
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        const pageNum = i - range.start + 1;
        doc
            .font('Helvetica')
            .fontSize(9)
            .fillColor('#9CA3AF')
            .text(`Page ${pageNum} of ${range.count}`, 0, doc.page.height - 36, { align: 'center' });
    }

    doc.end();
    return done;
};

module.exports = { buildAuditPdfBuffer };

