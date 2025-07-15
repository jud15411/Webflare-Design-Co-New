const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  status: {
    type: String,
    enum: ['To Do', 'In Progress', 'On Hold', 'Done'],
    default: 'To Do' // This automatically sets the status for new tasks
  },
  dueDate: Date,
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true }
});

module.exports = mongoose.model('Task', TaskSchema);