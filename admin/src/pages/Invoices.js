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
  const [invoiceToPrint, setInvoiceToPrint] = useState(null); // The invoice data to be printed

  const token = localStorage.getItem('token');
  const componentRef = useRef(); // Ref attached to the InvoiceTemplate

  // NEW: Memoize the content function to ensure stability and up-to-date ref value
  const getPrintContent = useCallback(() => {
    // This log confirms what the ref contains at the exact moment react-to-print needs it.
    console.log('getPrintContent called. Current ref inside content getter:', componentRef.current);
    return componentRef.current;
  }, [componentRef.current]); // KEY CHANGE: Add componentRef.current as a dependency

  const handlePrint = useReactToPrint({
    content: getPrintContent, // Use the memoized content getter
    onAfterPrint: () => {
      console.log('After print, clearing invoiceToPrint.');
      setInvoiceToPrint(null); // Clear the invoiceToPrint state after printing
    },
  });

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

  // Trigger print effect only when invoiceToPrint changes to a non-null value
  useEffect(() => {
    if (invoiceToPrint) { // Only trigger if invoiceToPrint has data
      console.log('useEffect triggered: invoiceToPrint is set.');
      // Add a slight delay to ensure React has fully rendered the InvoiceTemplate
      // and attached the ref before handlePrint attempts to use it.
      const timer = setTimeout(() => {
        // This log at line 58 should confirm ref validity before handlePrint() is triggered.
        if (componentRef.current) {
          console.log('Timeout fired. Ref is valid, calling handlePrint.');
          handlePrint(); // This line is Invoices.js:59
        } else {
          console.error('Timeout fired. Ref is still null. InvoiceTemplate may not have mounted or a re-render unmounted it.');
        }
      }, 100); // Increased delay slightly to 100ms for more robustness

      return () => clearTimeout(timer); // Cleanup the timeout if the component unmounts or state changes
    }
  }, [invoiceToPrint, handlePrint]); // Dependencies: re-run when invoiceToPrint or handlePrint changes

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
  
  const triggerPrint = (invoice) => {
    console.log('Triggering print for invoice:', invoice);
    setInvoiceToPrint(invoice); // This will trigger the useEffect
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