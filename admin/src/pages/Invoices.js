// jud15411/webflare-design-co-new/Webflare-Design-Co-New-2100d7f30c3a6542772817c09db5f1d9a53ddf69/admin/src/pages/Invoices.js

import React, { useState, useEffect, useCallback, useRef } from 'react';
import html2canvas from 'html2canvas'; // NEW Import: Import html2canvas
import { jsPDF } from 'jspdf';     // NEW Import: Import jsPDF
import InvoiceTemplate from '../components/InvoiceTemplate'; // Your existing InvoiceTemplate
import './Shared.css';

function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [newInvoice, setNewInvoice] = useState({ amount: 0, dueDate: '', projectId: '', status: 'Draft' });
  const [invoiceToPrint, setInvoiceToPrint] = useState(null); // State to hold the invoice data for the template

  const token = localStorage.getItem('token');
  const componentRef = useRef(); // Ref attached to the InvoiceTemplate to capture its content

  const fetchData = useCallback(async () => {
    const [invoicesRes, projectsRes] = await Promise.all([
      fetch(`${process.env.REACT_APP_API_URL}/api/invoices`, { headers: { 'x-auth-token': token } }),
      fetch(`${process.env.REACT_APP_API_URL}/api/projects`, { headers: { 'x-auth-token': token } })
    ]);
    const invoicesData = await invoicesRes.json();
    const projectsData = await projectsRes.json();
    setInvoices(invoicesData);
    setProjects(projectsData);
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // NEW: useEffect to handle PDF generation when invoiceToPrint state changes
  useEffect(() => {
    if (invoiceToPrint && componentRef.current) {
      console.log('Invoice data ready for PDF generation and ref is available:', invoiceToPrint);

      // Add a sufficient delay to ensure all content (especially images) in the template is rendered
      const timer = setTimeout(async () => {
        try {
          const element = componentRef.current; // The DOM element to capture
          console.log('Starting html2canvas capture of element:', element);

          // Use html2canvas to capture the content of the InvoiceTemplate
          const canvas = await html2canvas(element, {
            scale: 2, // Scale up for better resolution in the PDF
            useCORS: true, // Important if your logo or other images are from a different origin
            logging: true // Enable logging from html2canvas for debugging
          });
          console.log('html2canvas captured canvas:', canvas);

          const imgData = canvas.toDataURL('image/jpeg', 1.0); // Convert canvas to JPEG image data (quality 1.0)
          const pdf = new jsPDF('p', 'mm', 'a4'); // Initialize jsPDF: portrait, millimeters, A4 size

          const imgWidth = 210; // A4 width in mm
          const pageHeight = 297; // A4 height in mm
          const imgHeight = canvas.height * imgWidth / canvas.width; // Calculate image height to maintain aspect ratio
          let heightLeft = imgHeight; // Remaining height to be added to PDF

          let position = 0; // Current Y position on the PDF page

          // Add the first page
          pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;

          // Add subsequent pages if content overflows (for long invoices)
          while (heightLeft >= 0) {
            position = heightLeft - imgHeight; // Calculate position for the next page
            pdf.addPage(); // Add a new page
            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
          }

          pdf.save(`invoice_${invoiceToPrint.invoiceNumber}.pdf`); // Save the generated PDF file

          console.log('PDF generated and saved.');
          setInvoiceToPrint(null); // Clear the state after successful PDF generation
        } catch (error) {
          console.error('Error generating PDF:', error);
          alert('Failed to generate PDF. Please check the console for more details.');
          setInvoiceToPrint(null); // Clear state even on error to allow retries
        }
      }, 500); // 500ms delay to ensure all elements (especially images) are loaded before capture

      return () => clearTimeout(timer); // Cleanup function for the timeout to prevent memory leaks
    }
  }, [invoiceToPrint]); // Dependency array: this effect runs when invoiceToPrint changes

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (showEditModal) {
      setEditingInvoice({ ...editingInvoice, [name]: value });
    } else {
      setNewInvoice({ ...newInvoice, [name]: value });
    }
  };

  const handleAddInvoice = async (e) => {
    e.preventDefault();
    await fetch(`${process.env.REACT_APP_API_URL}/api/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
      body: JSON.stringify(newInvoice)
    });
    setShowAddModal(false);
    setNewInvoice({ amount: 0, dueDate: '', projectId: '', status: 'Draft' });
    fetchData();
  };

  const openEditModal = (invoice) => {
    const formattedInvoice = {
      ...invoice,
      dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : ''
    };
    setEditingInvoice(formattedInvoice);
    setShowEditModal(true);
  };

  const handleUpdateInvoice = async (e) => {
    e.preventDefault();
    await fetch(`${process.env.REACT_APP_API_URL}/api/invoices/${editingInvoice._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
      body: JSON.stringify(editingInvoice)
    });
    setShowEditModal(false);
    setEditingInvoice(null);
    fetchData();
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      await fetch(`${process.env.REACT_APP_API_URL}/api/invoices/${invoiceId}`, {
        method: 'DELETE',
        headers: { 'x-auth-token': token }
      });
      fetchData();
    }
  };
  
  // This function now just sets the invoice data to the state, which triggers the useEffect for PDF generation
  const triggerPrint = (invoice) => {
    console.log('Triggering PDF generation for invoice:', invoice);
    setInvoiceToPrint(invoice);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Invoices</h1>
        <button className="add-button" onClick={() => setShowAddModal(true)}>+ Add Invoice</button>
      </div>
      <div className="data-table-container">
        <table>
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Project</th>
              <th>Client</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Due Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(invoice => (
              <tr key={invoice._id}>
                <td>{invoice.invoiceNumber}</td>
                <td>{invoice.projectId?.title || 'N/A'}</td>
                <td>{invoice.projectId?.clientId?.name || 'N/A'}</td>
                <td>${invoice.amount ? invoice.amount.toFixed(2) : '0.00'}</td>
                <td>{invoice.status}</td>
                <td>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</td>
                <td className="actions-cell">
                  <button className="edit-button" onClick={() => openEditModal(invoice)}>Edit</button>
                  <button className="delete-button" onClick={() => handleDeleteInvoice(invoice._id)}>Delete</button>
                  <button onClick={() => triggerPrint(invoice)}>Print PDF</button> {/* Changed button text */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header"><h2 className="modal-title">Add New Invoice</h2><button className="close-button" onClick={() => setShowAddModal(false)}>&times;</button></div>
            <form onSubmit={handleAddInvoice}>
              <div className="form-group"><label>Project</label><select name="projectId" value={newInvoice.projectId} onChange={handleInputChange} required><option value="">Select a Project</option>{projects.map(project => (<option key={project._id} value={project._id}>{project.title}</option>))}</select></div>
              <div className="form-group"><label>Amount ($)</label><input type="number" name="amount" value={newInvoice.amount} onChange={handleInputChange} required /></div>
              <div className="form-group"><label>Due Date</label><input type="date" name="dueDate" value={newInvoice.dueDate} onChange={handleInputChange} required /></div>
              <div className="form-group"><label>Status</label><select name="status" value={newInvoice.status} onChange={handleInputChange}><option>Draft</option><option>Sent</option><option>Paid</option><option>Overdue</option></select></div>
              <button type="submit" className="add-button">Save Invoice</button>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editingInvoice && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header"><h2 className="modal-title">Edit Invoice</h2><button className="close-button" onClick={() => setShowEditModal(false)}>&times;</button></div>
            <form onSubmit={handleUpdateInvoice}>
                <div className="form-group"><label>Invoice Number</label><input type="text" name="invoiceNumber" value={editingInvoice.invoiceNumber} readOnly /></div>
                <div className="form-group"><label>Project</label><select name="projectId" value={editingInvoice.projectId?._id} onChange={handleInputChange} required><option value="">Select a Project</option>{projects.map(project => (<option key={project._id} value={project._id}>{project.title}</option>))}</select></div>
                <div className="form-group"><label>Amount ($)</label><input type="number" name="amount" value={editingInvoice.amount} onChange={handleInputChange} required /></div>
                <div className="form-group"><label>Due Date</label><input type="date" name="dueDate" value={editingInvoice.dueDate} onChange={handleInputChange} required /></div>
                <div className="form-group"><label>Status</label><select name="status" value={editingInvoice.status} onChange={handleInputChange}><option>Draft</option><option>Sent</option><option>Paid</option><option>Overdue</option></select></div>
                <button type="submit" className="add-button">Update Invoice</button>
            </form>
          </div>
        </div>
      )}

      {/* IMPORTANT: Only render the InvoiceTemplate when invoiceToPrint has a value.
          This ensures the component mounts and the ref is attached ONLY when needed. */}
      {invoiceToPrint && (
        <div className="hidden-for-print">
          <InvoiceTemplate ref={componentRef} invoice={invoiceToPrint} />
        </div>
      )}
    </div>
  );
}

export default Invoices;