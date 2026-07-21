const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth'); // Assuming protect is the standard auth middleware

// All analytics routes are protected
router.use(protect);

router.get('/dashboard', analyticsController.getDashboard);
router.get('/health', analyticsController.getHealth);
router.get('/overview', analyticsController.getOverview);
router.get('/sentiment', analyticsController.getSentiment);
router.get('/emotion', analyticsController.getEmotion);
router.get('/engagement', analyticsController.getEngagement);
router.get('/meeting-types', analyticsController.getMeetingTypes);
router.get('/action-items', analyticsController.getActionItems);
router.get('/participants', analyticsController.getParticipants);
router.get('/trends', analyticsController.getTrends);
router.get('/keywords', analyticsController.getKeywords);

module.exports = router;
