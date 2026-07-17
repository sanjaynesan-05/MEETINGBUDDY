const express = require('express');
const router = express.Router();
const { chunkTranscript } = require('../controllers/chunkController');

router.post('/', chunkTranscript);

module.exports = router;
