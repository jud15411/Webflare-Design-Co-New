const mongoose = require('mongoose');

// 1. Define the schema and assign it to the 'projectSchema' variable
const projectSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    status: { type: String, default: 'Planning' },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    imageUrl: { type: String },
    isFeatured: { type: Boolean, default: false },
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// 2. NOW that projectSchema exists, add the virtual field to it
projectSchema.virtual('milestones', {
    ref: 'Milestone',
    localField: '_id',
    foreignField: 'projectId'
});

// 3. Export the model
module.exports = mongoose.model('Project', projectSchema);