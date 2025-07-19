const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { authMiddleware, adminOnlyMiddleware } = require('../middleware/authMiddleware');

// Route for getting all invoices and creating a new one
router.route('/')
    .get(authMiddleware, adminOnlyMiddleware, invoiceController.getInvoices)
    .post(authMiddleware, adminOnlyMiddleware, invoiceController.createInvoice);

// Route for updating and deleting a specific invoice
router.route('/:id')
    .put(authMiddleware, adminOnlyMiddleware, invoiceController.updateInvoice)
    .delete(authMiddleware, adminOnlyMiddleware, invoiceController.deleteInvoice);

// Route to send an invoice via email
router.post('/:id/send-email', authMiddleware, adminOnlyMiddleware, invoiceController.sendInvoiceEmail);

module.exports = router;