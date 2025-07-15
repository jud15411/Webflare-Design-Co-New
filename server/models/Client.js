const mongoose = require('mongoose');

const ClientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contactPerson: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: String,
  address: String,
  joinedDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Client', ClientSchema);