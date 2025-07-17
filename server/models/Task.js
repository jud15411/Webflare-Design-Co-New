const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  milestoneId: { // New field to link to a specific milestone
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Milestone'
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dueDate: Date,
  status: { type: String, enum: ['To Do', 'In Progress', 'Done', 'Blocked'], default: 'To Do' }
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);