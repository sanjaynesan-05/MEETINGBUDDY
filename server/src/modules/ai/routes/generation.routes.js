const express = require('express');
const router = express.Router();
const { generateAIResponse, getHealth } = require('../controllers/generationController');

router.post('/', generateAIResponse);
router.get('/health', getHealth);

module.exports = router;
