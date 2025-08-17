const mongoose = require('mongoose');

const associationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  display: {
    type: Boolean,
    default: true
  }
}, { _id: true });

const workTypeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  associatedDocketTypes: [associationSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
workTypeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

workTypeSchema.index({ code: 'text', name: 'text', 'associatedDocketTypes.name': 'text' });

const WorkType = mongoose.model('WorkType', workTypeSchema);

module.exports = WorkType;