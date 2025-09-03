const express = require('express');
const router = express.Router();
const cabinetController = require('../controllers/cabinet.controller');
const upload = require('../middleware/upload');

// Get root items
router.get('/', cabinetController.getRootItems);

// Search across all items
router.get('/search', cabinetController.searchItems);

// Get folder contents
router.get('/folder/:id', cabinetController.getFolderContents);

// Create folder
router.post('/folder', cabinetController.createFolder);

// Update folder
router.put('/folder/:id', cabinetController.updateFolder);

// Delete folder
router.delete('/folder/:id', cabinetController.deleteFolder);

// Upload files
router.post('/upload', upload.array('files'), cabinetController.uploadFiles);

// Delete files
router.delete('/files', cabinetController.deleteFiles);

// Get file content
router.get('/file/:id', cabinetController.getFileContent);

// Download file
router.get('/file/:id/download', cabinetController.downloadFile);

module.exports = router;