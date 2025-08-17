const express = require('express');
const router = express.Router();
const callController = require('../controllers/call.controller');


router.post('/create', callController.addCall);
router.get('/:id', callController.getCallDetails);
router.put('/:id', callController.editCall);
router.get('/', callController.getAllDetails);

module.exports = router;