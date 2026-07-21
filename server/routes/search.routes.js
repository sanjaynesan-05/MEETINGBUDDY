const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { protect } = require('../middleware/auth'); // Using existing auth middleware

// All search routes are protected
router.use(protect);

router.get('/', searchController.searchMeetings);

module.exports = router;
