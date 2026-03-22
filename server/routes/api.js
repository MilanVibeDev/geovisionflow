const express = require('express');
const router = express.Router();
const { analyzeWebsite } = require('../controllers/analyzeController');
const { downloadReportPdf } = require('../controllers/reportController');
const { signup, signin } = require('../controllers/authController');

router.post('/auth/signup', signup);
router.post('/auth/signin', signin);

router.post('/analyze', analyzeWebsite);
router.post('/report/pdf', downloadReportPdf);

module.exports = router;
