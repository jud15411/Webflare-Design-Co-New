const Invoice = require('../models/Invoice');
const Counter = require('../models/Counter');
const User = require('../models/User');
const Notification = require('../models/Notification');
const nodemailer = require('nodemailer');
const { EMAIL_USER, EMAIL_PASS } = process.env;

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Admin
exports.getInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find().populate({
            path: 'projectId',
            populate: { path: 'clientId', select: 'name email' } // Ensure client email is populated
        });
        res.json(invoices);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// @desc    Create an invoice
// @route   POST /api/invoices
// @access  Admin
exports.createInvoice = async (req, res) => {
    try {
        const counter = await Counter.findOneAndUpdate(
            { _id: 'invoiceNumber' },
            { $inc: { sequence_value: 1 } },
            { new: true, upsert: true }
        );
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

// @desc    Update an invoice
// @route   PUT /api/invoices/:id
// @access  Admin
exports.updateInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!invoice) {
            return res.status(404).json({ msg: 'Invoice not found' });
        }
        res.json(invoice);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// @desc    Delete an invoice
// @route   DELETE /api/invoices/:id
// @access  Admin
exports.deleteInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findByIdAndDelete(req.params.id);
        if (!invoice) {
            return res.status(404).json({ msg: 'Invoice not found' });
        }
        res.json({ msg: 'Invoice deleted successfully' });
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

        if (!invoice) return res.status(404).json({ msg: 'Invoice not found.' });
        
        const client = invoice.projectId?.clientId;
        if (!client || !client.email) {
            return res.status(400).json({ msg: 'Client email not found for this invoice.' });
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: EMAIL_USER, pass: EMAIL_PASS }
        });
        
        const mailOptions = {
            from: EMAIL_USER,
            to: client.email,
            subject: `Invoice #${invoice.invoiceNumber} from Webflare Design Co.`,
            html: `
                <p>Hello ${client.name || 'Client'},</p>
                <p>Please find attached the details for your invoice from Webflare Design Co.</p>
                <ul>
                    <li><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</li>
                    <li><strong>Project:</strong> ${invoice.projectId.title}</li>
                    <li><strong>Amount Due:</strong> $${invoice.amount.toFixed(2)}</li>
                    <li><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</li>
                    <li><strong>Status:</strong> ${invoice.status}</li>
                </ul>
                <p>You can view your invoice details by logging into your client portal.</p>
                <p>Thank you for your business!</p>
                <p>Regards,</p>
                <p>The Webflare Design Co. Team</p>
            `
        };

        await transporter.sendMail(mailOptions);
        res.json({ msg: `Invoice sent successfully to ${client.email}.` });

    } catch (err) {
        console.error('Error sending invoice email:', err);
        res.status(500).send('Server error sending invoice email.');
    }
};