// jud15411/webflare-design-co-new/Webflare-Design-Co-New-2100d7f30c3a6542772817c09db5f1d9a53ddf69/admin/src/pages/Invoices.js

import React, { useState, useEffect, useCallback, useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import InvoiceTemplate from '../components/InvoiceTemplate';
import ConfirmModal from '../components/ConfirmModal'; // Import ConfirmModal
import './Shared.css';
import './Invoices.css';

function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [newInvoice, setNewInvoice] = useState({ amount: 0, dueDate: '', projectId: '', status: 'Draft' });
  const [invoiceToPrint, setInvoiceToPrint] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  
  // States for the custom confirmation modal (for sending email)
  const [showConfirmSendModal, setShowConfirmSendModal] = useState(false); // Renamed for clarity
  const [invoiceIdToSend, setInvoiceIdToSend] = useState(null);

  // New states for the custom confirmation modal (for deleting)
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [invoiceIdToDelete, setInvoiceIdToDelete] = useState(null);


  const token = localStorage.getItem('token');
  const componentRef = useRef();

  const fetchData = useCallback(async () => {
    try {
      const [invoicesRes, projectsRes] = await Promise.all([
        fetch(`${process.env.REACT_APP_API_URL}/api/invoices`, { headers: { 'x-auth-token': token } }),
        fetch(`${process.env.REACT_APP_API_URL}/api/projects`, { headers: { 'x-auth-token': token } })
      ]);

      if (!invoicesRes.ok || !projectsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const invoicesData = await invoicesRes.json();
      const projectsData = await projectsRes.json();

      setInvoices(invoicesData);
      setProjects(projectsData);
    } catch (error) {
      console.error("Error fetching data:", error);
      setMessage('Failed to load invoices or projects.');
      setMessageType('error');
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewInvoice(prevState => ({ ...prevState, [name]: value }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingInvoice(prevState => ({ ...prevState, [name]: value }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify(newInvoice),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Failed to add invoice');
      
      setNewInvoice({ amount: 0, dueDate: '', projectId: '', status: 'Draft' });
      setShowAddModal(false);
      fetchData();
      setMessage('Invoice added successfully!');
      setMessageType('success');
    } catch (error) {
      console.error("Error adding invoice:", error);
      setMessage(error.message || 'Error adding invoice.');
      setMessageType('error');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/invoices/${editingInvoice._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify(editingInvoice),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Failed to update invoice');
      
      setEditingInvoice(null);
      setShowEditModal(false);
      fetchData();
      setMessage('Invoice updated successfully!');
      setMessageType('success');
    } catch (error) {
      console.error("Error updating invoice:", error);
      setMessage(error.message || 'Error updating invoice.');
      setMessageType('error');
    }
  };

  // NEW: Function to initiate invoice deletion (shows custom modal)
  const confirmDeleteInvoice = (id) => {
    setInvoiceIdToDelete(id);
    setShowConfirmDeleteModal(true);
  };

  // NEW: Actual function to delete invoice after confirmation
  const executeDeleteInvoice = async () => {
    setShowConfirmDeleteModal(false); // Close the modal immediately
    setMessage('');
    setMessageType('');

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/invoices/${invoiceIdToDelete}`, {
        method: 'DELETE',
        headers: { 'x-auth-token': token },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Failed to delete invoice');
      
      fetchData();
      setMessage('Invoice deleted successfully!');
      setMessageType('success');
    } catch (error) {
      console.error("Error deleting invoice:", error);
      setMessage(error.message || 'Error deleting invoice.');
      setMessageType('error');
    } finally {
      setInvoiceIdToDelete(null); // Clear the stored invoice ID
    }
  };

  const cancelDeleteInvoice = () => {
    setShowConfirmDeleteModal(false);
    setInvoiceIdToDelete(null); // Clear the stored invoice ID
    setMessage('Invoice deletion cancelled.');
    setMessageType('info'); // Optional: show a cancellation message
  };

  const handlePrint = useCallback(async (invoice) => {
    setMessage('');
    setMessageType('');
    setInvoiceToPrint(invoice); // Set the invoice to be printed

    // Wait for the next tick to ensure the component is rendered
    setTimeout(async () => {
      if (componentRef.current) {
        try {
          const canvas = await html2canvas(componentRef.current, { scale: 2 });
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const imgProps = pdf.getImageProperties(imgData);
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.save(`invoice-${invoice.invoiceNumber}.pdf`);
          setMessage('Invoice PDF generated!');
          setMessageType('success');
        } catch (error) {
          console.error("Error generating PDF:", error);
          setMessage('Failed to generate PDF.');
          setMessageType('error');
        } finally {
          setInvoiceToPrint(null); // Clear the invoice after printing attempt
        }
      }
    }, 50); // Small delay to allow rendering
  }, []);

  // Handle sending invoice email
  const confirmSendEmail = (invoiceId) => {
    setInvoiceIdToSend(invoiceId);
    setShowConfirmSendModal(true);
  };

  // Actual function to send invoice email after confirmation
  const executeSendEmail = async () => {
    setShowConfirmSendModal(false); // Close the modal immediately
    setMessage('');
    setMessageType('');

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/invoices/${invoiceIdToSend}/send-email`, {
        method: 'POST', // Use POST for sending actions
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.msg || 'Failed to send invoice email.');
      }
      setMessage(data.msg);
      setMessageType('success');
    } catch (error) {
      console.error('Error sending invoice email:', error);
      setMessage(error.message);
      setMessageType('error');
    } finally {
      setInvoiceIdToSend(null); // Clear the stored invoice ID
    }
  };

  const cancelSendEmail = () => {
    setShowConfirmSendModal(false);
    setInvoiceIdToSend(null); // Clear the stored invoice ID
    setMessage('Invoice email sending cancelled.');
    setMessageType('info'); // Optional: show a cancellation message
  };


  return (
    <div className="invoices-page">
      <div className="page-header">
        <h1 className="page-title">Invoices</h1>
        <button onClick={() => setShowAddModal(true)} className="add-button">Add New Invoice</button>
      </div>

      {message && (
        <div className={`message-banner ${messageType}`}>
          {message}
          <button className="close-message" onClick={() => setMessage('')}>X</button>
        </div>
      )}

      <div className="data-table-container">
        <table>
          <thead>
            <tr>
              <th>Invoice No.</th>
              <th>Project</th>
              <th>Client</th>
              <th>Amount</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length > 0 ? (
              invoices.map(invoice => (
                <tr key={invoice._id}>
                  <td>{invoice.invoiceNumber}</td>
                  <td>{invoice.projectId ? invoice.projectId.title : 'N/A'}</td>
                  <td>{invoice.projectId && invoice.projectId.clientId ? invoice.projectId.clientId.name : 'N/A'}</td>
                  <td>${invoice.amount ? invoice.amount.toFixed(2) : '0.00'}</td>
                  <td>{new Date(invoice.dueDate).toLocaleDateString()}</td>
                  <td>{invoice.status}</td>
                  <td className="actions">
                    <button onClick={() => { setEditingInvoice(invoice); setShowEditModal(true); }} className="action-button edit">Edit</button>
                    <button onClick={() => confirmDeleteInvoice(invoice._id)} className="action-button delete">Delete</button> {/* Call custom confirmation for delete */}
                    <button onClick={() => handlePrint(invoice)} className="action-button print">Print PDF</button>
                    <button onClick={() => confirmSendEmail(invoice._id)} className="action-button send-email">Send Email</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7">No invoices found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Invoice Modal */}
      {showAddModal && (
        <div className="modal">
          <div className="modal-content">
            <span className="close-button" onClick={() => setShowAddModal(false)}>&times;</span>
            <h2>Add New Invoice</h2>
            <form onSubmit={handleAddSubmit}>
              <div className="form-group"><label>Amount ($)</label><input type="number" name="amount" value={newInvoice.amount} onChange={handleInputChange} required /></div>
              <div className="form-group">
                <label>Project</label>
                <select name="projectId" value={newInvoice.projectId} onChange={handleInputChange} required>
                  <option value="">Select a Project</option>
                  {projects.map(project => (
                    <option key={project._id} value={project._id}>{project.title}</option>
                  ))}
                </select>
              </div>
              <div className="form-group"><label>Due Date</label><input type="date" name="dueDate" value={newInvoice.dueDate} onChange={handleInputChange} required /></div>
              <div className="form-group">
                <label>Status</label>
                <select name="status" value={newInvoice.status} onChange={handleInputChange}>
                  <option>Draft</option><option>Sent</option><option>Paid</option><option>Overdue</option>
                </select>
              </div>
              <button type="submit" className="add-button">Add Invoice</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Invoice Modal */}
      {showEditModal && editingInvoice && (
        <div className="modal">
          <div className="modal-content">
            <span className="close-button" onClick={() => { setShowEditModal(false); setEditingInvoice(null); }}>&times;</span>
            <h2>Edit Invoice</h2>
            <form onSubmit={handleEditSubmit}>
                <div className="form-group"><label>Invoice No.</label><input type="text" name="invoiceNumber" value={editingInvoice.invoiceNumber} readOnly /></div>
                <div className="form-group">
                  <label>Project</label>
                  <select name="projectId" value={editingInvoice.projectId?._id} onChange={handleEditInputChange} required>
                    <option value="">Select a Project</option>
                    {projects.map(project => (
                      <option key={project._id} value={project._id}>{project.title}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group"><label>Amount ($)</label><input type="number" name="amount" value={editingInvoice.amount} onChange={handleEditInputChange} required /></div>
                <div className="form-group"><label>Due Date</label><input type="date" name="dueDate" value={editingInvoice.dueDate ? editingInvoice.dueDate.split('T')[0] : ''} onChange={handleEditInputChange} required /></div>
                <div className="form-group">
                  <label>Status</label>
                  <select name="status" value={editingInvoice.status} onChange={handleEditInputChange}>
                    <option>Draft</option><option>Sent</option><option>Paid</option><option>Overdue</option>
                  </select>
                </div>
                <button type="submit" className="add-button">Update Invoice</button>
            </form>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal (for sending email) */}
      <ConfirmModal
        isOpen={showConfirmSendModal}
        message="Are you sure you want to send this invoice to the client via email?"
        onConfirm={executeSendEmail}
        onCancel={cancelSendEmail}
      />

      {/* Custom Confirmation Modal (for deleting invoice) */}
      <ConfirmModal
        isOpen={showConfirmDeleteModal}
        message="Are you sure you want to permanently delete this invoice? This action cannot be undone."
        onConfirm={executeDeleteInvoice}
        onCancel={cancelDeleteInvoice}
      />

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