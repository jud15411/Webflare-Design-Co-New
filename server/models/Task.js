const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Backlog', 'To Do', 'In Progress', 'Done'], // Added "Backlog"
    default: 'Backlog' // Set as default
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  dueDate: {
    type: Date
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  milestoneId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Milestone'
  }
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);