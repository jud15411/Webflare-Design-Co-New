import React, { useState, useEffect, useCallback } from 'react';
import './Shared.css';

function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [newInvoice, setNewInvoice] = useState({ invoiceNumber: '', amount: 0, dueDate: '', projectId: '', status: 'Draft' });

  const token = localStorage.getItem('token');

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (editingInvoice) {
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      { (showAddModal || (showEditModal && editingInvoice)) && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header"><h2 className="modal-title">{showEditModal ? 'Edit Invoice' : 'Add New Invoice'}</h2><button className="close-button" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>&times;</button></div>
            <form onSubmit={showEditModal ? handleUpdateInvoice : handleAddInvoice}>
              <div className="form-group"><label>Invoice Number</label><input type="text" name="invoiceNumber" value={showEditModal ? editingInvoice.invoiceNumber : newInvoice.invoiceNumber} onChange={handleInputChange} required /></div>
              <div className="form-group"><label>Project</label><select name="projectId" value={showEditModal ? editingInvoice.projectId._id : newInvoice.projectId} onChange={handleInputChange} required><option value="">Select a Project</option>{projects.map(project => (<option key={project._id} value={project._id}>{project.title}</option>))}</select></div>
              <div className="form-group"><label>Amount ($)</label><input type="number" name="amount" value={showEditModal ? editingInvoice.amount : newInvoice.amount} onChange={handleInputChange} required /></div>
              <div className="form-group"><label>Due Date</label><input type="date" name="dueDate" value={showEditModal ? editingInvoice.dueDate : newInvoice.dueDate} onChange={handleInputChange} required /></div>
              <div className="form-group"><label>Status</label><select name="status" value={showEditModal ? editingInvoice.status : newInvoice.status} onChange={handleInputChange}><option>Draft</option><option>Sent</option><option>Paid</option><option>Overdue</option></select></div>
              <button type="submit" className="add-button">{showEditModal ? 'Update Invoice' : 'Save Invoice'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Invoices;