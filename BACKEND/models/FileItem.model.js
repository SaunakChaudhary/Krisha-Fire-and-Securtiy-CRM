const mongoose = require('mongoose');

const fileItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['folder', 'file'],
    required: true
  },
  mimeType: {
    type: String,
    required: function() {
      return this.type === 'file';
    }
  },
  size: {
    type: Number,
    required: function() {
      return this.type === 'file';
    },
    default: 0
  },
  path: {
    type: String,
    required: function() {
      return this.type === 'file';
    }
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FileItem',
    default: null
  },
  isRoot: {
    type: Boolean,
    default: false
  },
  modified: {
    type: Date,
    default: Date.now
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' 
  }
}, {
  timestamps: true
});

// Update modified date before saving
fileItemSchema.pre('save', function(next) {
  this.modified = Date.now();
  next();
});

// Static method to get root items
fileItemSchema.statics.getRootItems = function(search = '') {
  const query = { 
    $or: [{ isRoot: true }, { parent: null }],
    type: 'folder'
  };
  
  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }
  
  return this.find(query).sort({ modified: -1 });
};

// Method to get folder contents
fileItemSchema.methods.getContents = function(search = '') {
  const query = { parent: this._id };
  
  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }
  
  return mongoose.model('FileItem').find(query).sort({ modified: -1 });
};

// Static method to delete folder recursively
fileItemSchema.statics.deleteFolderRecursively = async function(folderId) {
  const folder = await this.findById(folderId);
  if (!folder) return;
  
  // Find all items in this folder
  const contents = await this.find({ parent: folderId });
  
  // Recursively delete subfolders and their contents
  for (const item of contents) {
    if (item.type === 'folder') {
      await this.deleteFolderRecursively(item._id);
    }
    await this.findByIdAndDelete(item._id);
  }
  
  // Delete the folder itself
  await this.findByIdAndDelete(folderId);
};

module.exports = mongoose.model('FileItem', fileItemSchema);