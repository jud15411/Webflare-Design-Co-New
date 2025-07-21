const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    status: { 
        type: String, 
        enum: ['Backlog', 'To Do', 'In Progress', 'Done'], 
        default: 'Backlog' 
    },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    // THE FIX: Change assignedTo to be an array to allow multiple users
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    dueDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);