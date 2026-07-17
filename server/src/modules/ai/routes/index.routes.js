const express = require('express');
const router = express.Router();
const { indexEmbeddings, getStatus } = require('../controllers/indexController');

router.post('/', indexEmbeddings);
router.get('/status', getStatus);

module.exports = router;
