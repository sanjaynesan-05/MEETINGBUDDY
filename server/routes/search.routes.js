const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', searchController.searchMeetings);
router.get('/hybrid', searchController.hybridSearch);

module.exports = router;
