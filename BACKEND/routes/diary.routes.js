const express = require('express');
const router = express.Router();
const diaryController = require('../controllers/diary.controller');

// Get diary entries for a specific date and engineer
router.get('/entries', diaryController.getAllDiaryEntries);

// Create a new diary entry
router.post('/entries/:userId', diaryController.createDiaryEntry);

// Update a diary entry
router.put('/entries/:id', diaryController.updateDiaryEntry);

// Delete a diary entry
router.delete('/entries/:id', diaryController.deleteDiaryEntry);

// Get all assignments for a specific call log
router.get('/call-log/:callLogId/assignments', diaryController.getAssignmentsByCallLog);

// Check for time conflicts
router.get('/check-conflict', diaryController.checkTimeConflict);

module.exports = router;