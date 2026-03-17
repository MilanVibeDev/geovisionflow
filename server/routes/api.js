const express = require('express');
const router = express.Router();
const { analyzeWebsite } = require('../controllers/analyzeController');
const { downloadReportPdf } = require('../controllers/reportController');

router.post('/analyze', analyzeWebsite);
router.post('/report/pdf', downloadReportPdf);

module.exports = router;
