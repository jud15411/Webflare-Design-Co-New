const Invoice = require('../models/Invoice');
const Counter = require('../models/Counter');
const User = require('../models/User');
const Notification = require('../models/Notification');
const nodemailer = require('nodemailer');

// ... (Get, Update, Delete logic is straightforward)

// @desc    Create an invoice
// @route   POST /api/invoices
// @access  Admin
exports.createInvoice = async (req, res) => {
    try {
        const counter = await Counter.findOneAndUpdate({ _id: 'invoiceNumber' }, { $inc: { sequence_value: 1 } }, { new: true, upsert: true });
        const newInvoiceNumber = `WDC-${String(counter.sequence_value).padStart(4, '0')}`;
        
        const newInvoice = new Invoice({ ...req.body, invoiceNumber: newInvoiceNumber });
        await newInvoice.save();

        const ceo = await User.findOne({ role: 'CEO' });
        if (ceo) {
            const creator = await User.findById(req.userId);
            const message = `A new invoice (${newInvoice.invoiceNumber}) was created by ${creator.name}.`;
            new Notification({ recipient: ceo._id, message, link: `/invoices` }).save();
        }
        res.status(201).json(newInvoice);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// @desc    Send an invoice via email
// @route   POST /api/invoices/:id/send-email
// @access  Admin
exports.sendInvoiceEmail = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id).populate({
            path: 'projectId',
            populate: { path: 'clientId' }
        });
        if (!invoice || !invoice.projectId || !invoice.projectId.clientId || !invoice.projectId.clientId.email) {
            return res.status(400).json({ msg: 'Client email not found for this invoice.' });
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail', auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: invoice.projectId.clientId.email,
            subject: `Invoice #${invoice.invoiceNumber} from Webflare Design Co.`,
            html: `<p>Hello ${invoice.projectId.clientId.name},</p> ... ` // Your email body
        };

        await transporter.sendMail(mailOptions);
        res.json({ msg: `Invoice sent successfully to ${invoice.projectId.clientId.email}.` });
    } catch (err) {
        res.status(500).send('Server error sending invoice email.');
    }
};