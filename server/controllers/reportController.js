const { runAnalysis } = require('./analyzeController');
const { buildAuditPdfBuffer } = require('../utils/pdfReport');
const { getAIReport } = require('../utils/aiAnalyzer');

const toSafeFilename = (url) => {
    try {
        const u = new URL(url);
        return u.hostname.replace(/[^a-zA-Z0-9.-]/g, '_');
    } catch {
        return 'website';
    }
};

const downloadReportPdf = async (req, res) => {
    try {
        const { url, keyword, country } = req.body || {};
        const result = await runAnalysis({ url, keyword, country });

        // Optional AI narrative (never blocks PDF generation)
        const aiReport = await getAIReport(result);

        const pdfBuffer = await buildAuditPdfBuffer(result, aiReport);

        const filename = `geovisionflow-audit-${toSafeFilename(url)}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.status(200).send(pdfBuffer);
    } catch (error) {
        console.error('PDF report generation failed:', error);
        res.status(error.statusCode || 500).json({ error: 'Failed to generate PDF report. ' + error.message });
    }
};

module.exports = { downloadReportPdf };

