const express = require('express');
const router = express.Router();
const { getTasks, updateTask } = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getTasks);
router.put('/:meetingId/:index', updateTask);

module.exports = router;
