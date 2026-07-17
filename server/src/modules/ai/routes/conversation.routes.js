const express = require('express');
const router = express.Router();
const { handleConversation, getSession, deleteSession, getHealth } = require('../controllers/conversationController');

router.get('/health', getHealth);
router.post('/', handleConversation);
router.get('/:sessionId', getSession);
router.delete('/:sessionId', deleteSession);

module.exports = router;
