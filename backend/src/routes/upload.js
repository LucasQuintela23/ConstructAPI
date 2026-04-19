const express = require('express');
const router = express.Router();
const multer = require('multer');
const controller = require('../controllers/upload');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/:templateId', upload.single('file'), controller.upload);

module.exports = router;
