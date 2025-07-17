const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  role: { 
    type: String,
    enum: ['CEO', 'CTO', 'Developer', 'Sales'],
    default: 'Developer'
  }
});

module.exports = mongoose.model('User', UserSchema);