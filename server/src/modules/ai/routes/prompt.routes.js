const express = require('express');
const router = express.Router();
const { previewPrompt, getHealth } = require('../controllers/promptController');

router.post('/', previewPrompt);
router.get('/health', getHealth);

module.exports = router;
