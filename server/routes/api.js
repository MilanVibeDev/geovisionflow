const express = require('express');
const router = express.Router();
const { analyzeWebsite } = require('../controllers/analyzeController');

router.post('/analyze', analyzeWebsite);

module.exports = router;
