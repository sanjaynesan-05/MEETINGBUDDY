const express = require('express');
const router = express.Router();
const { sendChatMessage } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', sendChatMessage);

module.exports = router;
