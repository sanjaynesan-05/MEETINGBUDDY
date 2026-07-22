const express = require('express');
const router = express.Router();
const { exportActionItemsIcs } = require('../controllers/calendarController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/meetings/:id/calendar/ics', exportActionItemsIcs);

module.exports = router;
