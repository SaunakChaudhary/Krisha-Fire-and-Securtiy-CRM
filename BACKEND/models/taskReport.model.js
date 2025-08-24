const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const taskReportSchema = new mongoose.Schema({
  engineer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Engineer',
  },
  taskId: {
    type: String,
    required: true
  },
  taskDetails: {
    type: Object
  },
  customerRating: {
    type: Number,
    min: 0,
    max: 5
  },
  customerReview: {
    type: String
  },
  engineerSignature: {
    type: String
  },
  customerSignature: {
    type: String
  },
  checklistStatus: {
    type: Object,
    default: {}
  },
  additionalNotes: {
    type: String
  },
  documents: [documentSchema], 
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('TaskReport', taskReportSchema);