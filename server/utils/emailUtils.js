// utils/emailUtils.js
const nodemailer = require('nodemailer');
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const CLIENT_URL = process.env.CLIENT_URL || `http://localhost:8080`;

const sendVerificationEmail = async (user) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASS
        }
    });

    const verificationLink = `${CLIENT_URL}/login?verificationStatus=success&email=${encodeURIComponent(user.email)}`;

    const mailOptions = {
        // ... (mailOptions logic from your server.js)
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Verification email sent to:', user.email);
    } catch (error) {
        console.error('Error sending verification email:', error);
        throw new Error('Failed to send verification email.');
    }
};

module.exports = { sendVerificationEmail };