// jud15411/webflare-design-co-new/Webflare-Design-Co-New-2100d7f30c3a6542772817c09db5f1d9a53ddf69/admin/src/pages/Invoices.js

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import InvoiceTemplate from '../components/InvoiceTemplate';
import './Shared.css';

function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [newInvoice, setNewInvoice] = useState({ amount: 0, dueDate: '', projectId: '', status: 'Draft' });
  const [invoiceToPrint, setInvoiceToPrint] = useState(null); // State to hold the invoice data for printing

  const token = localStorage.getItem('token');
  const componentRef = useRef();

  // This is the useReactToPrint hook, correctly set up to use the ref.
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    onAfterPrint: () => setInvoiceToPrint(null), // Clear the invoiceToPrint state after printing
  });

  // Fetch data for invoices and projects
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

  // NEW: useEffect to trigger print when invoiceToPrint is set
  useEffect(() => {
    if (invoiceToPrint) { // Only trigger if invoiceToPrint has data
      handlePrint();
    }
  }, [invoiceToPrint, handlePrint]); // Dependency array: re-run when invoiceToPrint or handlePrint changes

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
  
  // This function now just sets the invoice to print, the useEffect will handle the actual print trigger
  const triggerPrint = (invoice) => {
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
                  <button onClick={() => triggerPrint(invoice)}>Print</button>
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

      {/* This div needs to be rendered, but can be hidden visually. */}
      {/* The InvoiceTemplate will only render its content if invoiceToPrint is not null. */}
      <div className="hidden-for-print">
        <InvoiceTemplate ref={componentRef} invoice={invoiceToPrint} />
      </div>
    </div>
  );
}

export default Invoices;