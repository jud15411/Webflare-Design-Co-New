const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  imageUrl: { type: String },
  description: String,
  status: { 
    type: String, 
    enum: ['Planning', 'In Progress', 'Pending Review', 'Completed', 'Cancelled'], 
    default: 'Planning' 
  },
  isFeatured: { type: Boolean, default: false }, // <-- Add this line
  startDate: Date,
  endDate: Date,
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true }
});

module.exports = mongoose.model('Project', ProjectSchema);