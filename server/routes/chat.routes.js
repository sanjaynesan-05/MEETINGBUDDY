const express = require('express');
const router = express.Router();
const { sendChatMessage, streamChatMessage } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', sendChatMessage);
router.post('/stream', streamChatMessage);

module.exports = router;
