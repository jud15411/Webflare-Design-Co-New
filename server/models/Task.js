const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const taskSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  assignedTo: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  status: {
    type: String,
    enum: ['Backlog', 'To Do', 'In Progress', 'Done'],
    default: 'Backlog',
  },
  dueDate: {
    type: Date,
  },
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual property to link to time entries
taskSchema.virtual('timeEntries', {
  ref: 'TimeEntry',
  localField: '_id',
  foreignField: 'taskId'
});

module.exports = mongoose.model('Task', taskSchema);