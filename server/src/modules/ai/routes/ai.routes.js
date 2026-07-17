const express = require('express');
const router = express.Router();
const { getHealth } = require('../controllers/aiHealthController');
const chunkRoutes = require('./chunk.routes');
const embeddingRoutes = require('./embedding.routes');
const indexRoutes = require('./index.routes');
const retrievalRoutes = require('./retrieval.routes');
const promptRoutes = require('./prompt.routes');
const generationRoutes = require('./generation.routes');
const chatRoutes = require('./chat.routes');
const conversationRoutes = require('./conversation.routes');

router.get('/health', getHealth);
router.use('/chunk', chunkRoutes);
router.use('/embed', embeddingRoutes);
router.use('/index', indexRoutes);
router.use('/retrieve', retrievalRoutes);
router.use('/prompt', promptRoutes);
router.use('/generate', generationRoutes);
router.use('/chat', chatRoutes);
router.use('/conversation', conversationRoutes);

module.exports = router;
