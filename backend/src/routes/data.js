const express = require('express');
const router = express.Router();
const controller = require('../controllers/data');

router.get('/:templateId', controller.list);
router.post('/:templateId', controller.create);
router.get('/:templateId/:id', controller.getOne);
router.put('/:templateId/:id', controller.update);
router.delete('/:templateId/:id', controller.remove);

module.exports = router;
