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
  const API_URL = process.env.REACT_APP_API_URL;
  const componentRef = useRef();

  const fetchInvoices = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/invoices`, {
        headers: { 'x-auth-token': token },
      });
      if (!response.ok) throw new Error('Failed to fetch invoices');
      const data = await response.json();
      setInvoices(data);
    } catch (error) {
      console.error("Fetch Invoices Error:", error);
    }
  }, [token, API_URL]);

  const fetchProjects = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/projects`, {
        headers: { 'x-auth-token': token },
      });
      if (!response.ok) throw new Error('Failed to fetch projects');
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error("Fetch Projects Error:", error);
    }
  }, [token, API_URL]);

  useEffect(() => {
    fetchInvoices();
    fetchProjects();
  }, [fetchInvoices, fetchProjects]);

  const handleInputChange = (e) => {
    setNewInvoice({ ...newInvoice, [e.target.name]: e.target.value });
  };
  
  const handleEditInputChange = (e) => {
    setEditingInvoice({ ...editingInvoice, [e.target.name]: e.target.value });
  };
  
  const handleCloseModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setEditingInvoice(null);
  };
  
  const handleEditInvoice = (invoice) => {
    setEditingInvoice(invoice);
    setShowEditModal(true);
  };
  
  const handleAddNewInvoice = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify(newInvoice),
      });
      if (!response.ok) throw new Error('Failed to add invoice');
      fetchInvoices();
      handleCloseModals();
    } catch (error) {
      console.error("Add Invoice Error:", error);
    }
  };
  
  const handleUpdateInvoice = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/invoices/${editingInvoice._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify(editingInvoice),
      });
      if (!response.ok) throw new Error('Failed to update invoice');
      fetchInvoices();
      handleCloseModals();
    } catch (error) {
      console.error("Update Invoice Error:", error);
    }
  };
  
  const handleDeleteInvoice = (id) => {
    setInvoiceIdToDelete(id);
    setShowConfirmDeleteModal(true);
  };
  
  const executeDeleteInvoice = async () => {
    if (!invoiceIdToDelete) return;
    try {
      const response = await fetch(`${API_URL}/api/invoices/${invoiceIdToDelete}`, {
        method: 'DELETE',
        headers: { 'x-auth-token': token },
      });
      if (!response.ok) throw new Error('Failed to delete invoice');
      fetchInvoices();
    } catch (error) {
      console.error("Delete Invoice Error:", error);
    } finally {
      setShowConfirmDeleteModal(false);
      setInvoiceIdToDelete(null);
    }
  };
  
  const cancelDeleteInvoice = () => {
    setShowConfirmDeleteModal(false);
    setInvoiceIdToDelete(null);
  };

  const handleDownloadPdf = async (invoice) => {
    setInvoiceToPrint(invoice);
    setTimeout(async () => {
      if (componentRef.current) {
        const canvas = await html2canvas(componentRef.current);
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF();
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`invoice-${invoice.invoiceNumber}.pdf`);
        setInvoiceToPrint(null);
      }
    }, 500);
  };

  const handleSendEmail = (invoiceId) => {
    setInvoiceIdToSend(invoiceId);
    setShowConfirmSendModal(true);
  };
  
  const executeSendEmail = async () => {
    if (!invoiceIdToSend) return;
    
    setMessage('Sending...');
    setMessageType('info');
    
    try {
      const response = await fetch(`${API_URL}/api/invoices/${invoiceIdToSend}/send`, {
        method: 'POST',
        headers: { 'x-auth-token': token },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.msg || 'Failed to send email');
      
      setMessage(data.msg);
      setMessageType('success');
      fetchInvoices(); // Refresh to show updated status
    } catch (error) {
      setMessage(error.message);
      setMessageType('error');
    } finally {
      setShowConfirmSendModal(false);
      setInvoiceIdToSend(null);
    }
  };
  
  const cancelSendEmail = () => {
    setShowConfirmSendModal(false);
    setInvoiceIdToSend(null);
  };

  return (
    <div className="invoices-page">
      <div className="page-header">
        <h1>Invoices</h1>
        <button className="add-button" onClick={() => setShowAddModal(true)}>Add New Invoice</button>
      </div>

      {message && (
        <div className={`message-banner ${messageType}`}>
          {message}
          <button onClick={() => setMessage('')} className="close-message-btn">&times;</button>
        </div>
      )}

      <div className="content-box">
        <table>
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Project</th>
              <th>Amount</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(invoice => (
              <tr key={invoice._id}>
                <td>{invoice.invoiceNumber}</td>
                <td>{invoice.projectId?.title || 'N/A'}</td>
                <td>${invoice.amount.toFixed(2)}</td>
                <td>{new Date(invoice.dueDate).toLocaleDateString()}</td>
                <td><span className={`status-badge status-${invoice.status.toLowerCase()}`}>{invoice.status}</span></td>
                <td>
                  <button className="action-button" onClick={() => handleEditInvoice(invoice)}>Edit</button>
                  <button className="action-button" onClick={() => handleDownloadPdf(invoice)}>PDF</button>
                  <button className="action-button send-email" onClick={() => handleSendEmail(invoice._id)}>Send Email</button>
                  <button className="action-button delete" onClick={() => handleDeleteInvoice(invoice._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Add New Invoice</h2>
              <button className="close-button" onClick={handleCloseModals}>&times;</button>
            </div>
            <form onSubmit={handleAddNewInvoice}>
                <div className="form-group"><label>Project</label><select name="projectId" value={newInvoice.projectId} onChange={handleInputChange} required><option value="">Select a Project</option>{projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}</select></div>
                <div className="form-group"><label>Amount</label><input type="number" name="amount" value={newInvoice.amount} onChange={handleInputChange} required /></div>
                <div className="form-group"><label>Due Date</label><input type="date" name="dueDate" value={newInvoice.dueDate} onChange={handleInputChange} required /></div>
                <div className="form-group"><label>Status</label><select name="status" value={newInvoice.status} onChange={handleInputChange}><option>Draft</option><option>Sent</option><option>Paid</option><option>Overdue</option></select></div>
                <button type="submit" className="add-button">Add Invoice</button>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editingInvoice && (
        <div className="modal-backdrop"> {/* This div was missing */}
          <div className="modal-content">
            <div className="modal-header">
              <h2>Edit Invoice #{editingInvoice.invoiceNumber}</h2>
              <button className="close-button" onClick={handleCloseModals}>&times;</button>
            </div>
            <form onSubmit={handleUpdateInvoice}>
                <div className="form-group">
                  <label>Project</label>
                  <select name="projectId" value={editingInvoice.projectId._id} onChange={handleEditInputChange} required>
                    {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Amount</label><input type="number" name="amount" value={editingInvoice.amount} onChange={handleEditInputChange} required /></div>
                <div className="form-group"><label>Due Date</label><input type="date" name="dueDate" value={new Date(editingInvoice.dueDate).toISOString().split('T')[0]} onChange={handleEditInputChange} required /></div>
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