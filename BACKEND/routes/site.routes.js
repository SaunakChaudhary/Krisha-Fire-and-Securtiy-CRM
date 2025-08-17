const express = require('express');
const router = express.Router();
const siteController = require('../controllers/site.controller');

router.post('/', siteController.createSite);
router.get('/', siteController.getAllSites);
router.get('/:id', siteController.getSiteById);
router.put('/:id', siteController.updateSite);
router.delete('/:id', siteController.deleteSite);

module.exports = router;
