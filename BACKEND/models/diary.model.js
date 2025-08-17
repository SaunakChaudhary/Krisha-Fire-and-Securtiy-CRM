const mongoose = require('mongoose');

const diarySchema = new mongoose.Schema({
  site: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    required: [true, 'Site is required'],
    validate: {
      validator: async function(value) {
        const site = await mongoose.model('Site').findById(value);
        return site !== null;
      },
      message: 'Invalid site reference'
    }
  },
  callLog: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Call',
    required: [true, 'Call log is required'],
    validate: {
      validator: async function(value) {
        const call = await mongoose.model('Call').findById(value);
        return call !== null;
      },
      message: 'Invalid call log reference'
    }
  },
  engineer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Engineer is required'],
    validate: {
      validator: async function(value) {
        const user = await mongoose.model('User').findById(value);
        return user && user.accesstype_id?.name === 'Engineer';
      },
      message: 'Invalid engineer reference'
    }
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    validate: {
      validator: function(value) {
        return value >= new Date().setHours(0, 0, 0, 0);
      },
      message: 'Date cannot be in the past'
    }
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'],
    validate: {
      validator: function(value) {
        return this.startTime < value;
      },
      message: 'End time must be after start time'
    }
  },
  duration: {
    type: String,
    required: [true, 'Duration is required'],
    match: [/^([0-9]+h )?[0-9]+m$/, 'Invalid duration format (e.g., "2h 30m")']
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
    default: ''
  },
  status: {
    type: String,
    enum: {
      values: ['scheduled', 'in-progress', 'completed', 'cancelled'],
      message: 'Invalid status'
    },
    default: 'scheduled'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for duration calculation
diarySchema.virtual('calculatedDuration').get(function() {
  const start = new Date(`2000-01-01T${this.startTime}:00`);
  const end = new Date(`2000-01-01T${this.endTime}:00`);
  const diff = end - start;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours > 0 ? `${hours}h ` : ''}${minutes}m`;
});

// Pre-save hook to calculate duration
diarySchema.pre('save', function(next) {
  if (this.isModified('startTime') || this.isModified('endTime')) {
    this.duration = this.calculatedDuration;
  }
  next();
});

// Indexes for optimized queries
diarySchema.index({ engineer: 1, date: 1 });
diarySchema.index({ site: 1, date: 1 });
diarySchema.index({ callLog: 1 });
diarySchema.index({ status: 1, date: 1 });
diarySchema.index({ engineer: 1, status: 1 });

// Middleware to prevent time conflicts
diarySchema.pre('save', async function(next) {
  if (this.isModified('engineer') || this.isModified('date') || 
      this.isModified('startTime') || this.isModified('endTime')) {
    
    const conflict = await mongoose.model('Diary').findOne({
      _id: { $ne: this._id },
      engineer: this.engineer,
      date: this.date,
      $or: [
        { startTime: { $lt: this.endTime }, endTime: { $gt: this.startTime } }
      ]
    });

    if (conflict) {
      throw new Error(`Time conflict with existing assignment (${conflict.startTime}-${conflict.endTime})`);
    }
  }
  next();
});

const Diary = mongoose.model('Diary', diarySchema);

module.exports = Diary;