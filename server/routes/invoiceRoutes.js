const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { authMiddleware, adminOnlyMiddleware } = require('../middleware/authMiddleware');

router.route('/')
    .get(authMiddleware, adminOnlyMiddleware, invoiceController.getInvoices)
    .post(authMiddleware, adminOnlyMiddleware, invoiceController.createInvoice);
// ... (Add other invoice routes for update, delete, get by id)
router.post('/:id/send-email', authMiddleware, adminOnlyMiddleware, invoiceController.sendInvoiceEmail);

module.exports = router;