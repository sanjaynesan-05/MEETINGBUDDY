const express = require('express');
const router = express.Router();
const { retrieveContext, getHealth } = require('../controllers/retrievalController');

router.post('/', retrieveContext);
router.get('/health', getHealth);

module.exports = router;
