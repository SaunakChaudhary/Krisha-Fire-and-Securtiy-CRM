const express = require('express');
const router = express.Router();
const refCodeController = require('../controllers/reference.controller');

router.post('/', refCodeController.createReferenceCode);
router.put('/:id', refCodeController.updateReferenceCode);
router.get('/category/:category', refCodeController.getByCategory);

module.exports = router;
