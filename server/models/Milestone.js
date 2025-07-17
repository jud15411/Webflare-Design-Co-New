const mongoose = require('mongoose');

const MilestoneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  projectId: { // Link to the project this milestone belongs to
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: { // e.g., 'Not Started', 'In Progress', 'Completed', 'On Hold'
    type: String,
    enum: ['Not Started', 'In Progress', 'Completed', 'On Hold', 'Canceled'],
    default: 'Not Started'
  },
  completionDate: { // Date when the milestone was marked 'Completed'
    type: Date
  },
  // Add an optional field to store client suggestions/feedback related to this milestone
  clientSuggestions: {
    type: String,
    trim: true
  },
  // Optionally, track who made the last suggestion
  lastSuggestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastSuggestionDate: {
    type: Date
  }
}, { timestamps: true }); // Adds createdAt and updatedAt

module.exports = mongoose.model('Milestone', MilestoneSchema);