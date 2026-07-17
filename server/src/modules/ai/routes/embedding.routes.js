const express = require('express');
const router = express.Router();
const { embedChunk } = require('../controllers/embeddingController');

router.post('/', embedChunk);

module.exports = router;
