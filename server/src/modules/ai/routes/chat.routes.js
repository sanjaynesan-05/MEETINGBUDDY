const express = require('express');
const router = express.Router();
const { handleChatRequest, getHealth } = require('../controllers/chatController');

router.post('/', handleChatRequest);
router.get('/health', getHealth);

module.exports = router;
