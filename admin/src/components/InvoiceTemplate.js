import React from 'react';
import './InvoiceTemplate.css';

const InvoiceTemplate = React.forwardRef(({ invoice }, ref) => {
  if (!invoice) {
    console.log("InvoiceTemplate: Returning null because invoice is null.");
    return null;
  }

  const client = invoice.projectId?.clientId;
  const project = invoice.projectId;
  
  return (
    <div ref={ref} className="invoice-wrapper">
      <header className="invoice-header">
        <div className="logo-container">
          <img src="/images/Webflare_Design_Co.webp" alt="Webflare Design Co. Logo" className="invoice-logo" />
          <h1>Webflare Design Co.</h1>
        </div>
        <div className="invoice-details">
          <h2>INVOICE</h2>
          <p><strong>Invoice #:</strong> {invoice.invoiceNumber}</p>
          <p><strong>Date Issued:</strong> {new Date().toLocaleDateString()}</p>
          <p><strong>Due Date:</strong> {new Date(invoice.dueDate).toLocaleDateString()}</p>
        </div>
      </header>

      <section className="billing-details">
        <div className="bill-to">
          <h3>Bill To:</h3>
          <p>{client?.name}</p>
          <p>{client?.contactPerson}</p>
          <p>{client?.email}</p>
        </div>
        <div className="bill-from">
          <h3>From:</h3>
          <p>Webflare Design Co.</p>
          <p>contact@webflaredesignco.com</p>
        </div>
      </section>

      <table className="invoice-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{project?.title}</td>
            <td>${invoice.amount?.toFixed(2)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td className="total-label">Total</td>
            <td className="total-amount">${invoice.amount?.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      <footer className="invoice-footer">
        <p>Thank you for your business!</p>
        <p>Please make payment by the due date.</p>
      </footer>
    </div>
  );
});

export default InvoiceTemplate;