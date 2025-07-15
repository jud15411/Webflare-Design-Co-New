const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['Draft', 'Sent', 'Paid', 'Overdue'], default: 'Draft' },
  dueDate: Date,
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true }
});

module.exports = mongoose.model('Invoice', InvoiceSchema);