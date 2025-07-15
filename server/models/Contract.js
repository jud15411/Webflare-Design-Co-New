const mongoose = require('mongoose');

const ContractSchema = new mongoose.Schema({
  title: { type: String, required: true },
  status: { type: String, enum: ['Draft', 'Sent', 'Active', 'Expired'], default: 'Draft' },
  startDate: Date,
  endDate: Date,
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true }
});

module.exports = mongoose.model('Contract', ContractSchema);