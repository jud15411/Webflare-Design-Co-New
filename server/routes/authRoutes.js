const express = require('express');
const router = express.Router();

// Correctly import the register and login functions
const { register, login } = require('../controllers/authController');

// Define the routes using the imported functions
router.post('/register', register);
router.post('/login', login);

module.exports = router;