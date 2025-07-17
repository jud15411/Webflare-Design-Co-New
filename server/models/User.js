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
    enum: ['CEO', 'CTO', 'Developer', 'Sales', 'Client'], // Added 'Client' role
    default: 'Developer',
    required: true
  },
  emailVerificationToken: String,
  isEmailVerified: { type: Boolean, default: false },
  clientId: { // New field to link a client user to a client company
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client', // References the 'Client' model
    required: function() { return this.role === 'Client'; } // Required only if role is 'Client'
  }
});

module.exports = mongoose.model('User', UserSchema);