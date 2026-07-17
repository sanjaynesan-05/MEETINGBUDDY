const express = require('express');
const auth = require('../middleware/auth');
const { getDashboardStats } = require('../controllers/dashboardController');

const router = express.Router();

// All dashboard routes require authentication
router.use(auth);

// @route   GET /api/dashboard
// @desc    Get aggregated dashboard stats
router.get('/', getDashboardStats);

module.exports = router;
