import React, { useState, useEffect } from 'react';
import './Shared.css';

function Contracts() {
  const [contracts, setContracts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [newContract, setNewContract] = useState({ title: '', projectId: '', status: 'Draft', startDate: '', endDate: '' });

  const token = localStorage.getItem('token');

  const fetchData = async () => {
    const [contractsRes, projectsRes] = await Promise.all([
      fetch('http://localhost:8080/api/contracts', { headers: { 'x-auth-token': token } }),
      fetch('http://localhost:8080/api/projects', { headers: { 'x-auth-token': token } })
    ]);
    const contractsData = await contractsRes.json();
    const projectsData = await projectsRes.json();
    setContracts(contractsData);
    setProjects(projectsData);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (editingContract) {
      setEditingContract({ ...editingContract, [name]: value });
    } else {
      setNewContract({ ...newContract, [name]: value });
    }
  };

  const handleAddContract = async (e) => {
    e.preventDefault();
    await fetch('http://localhost:8080/api/contracts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
      body: JSON.stringify(newContract)
    });
    setShowAddModal(false);
    fetchData();
  };

  const openEditModal = (contract) => {
    const formattedContract = {
      ...contract,
      startDate: contract.startDate ? new Date(contract.startDate).toISOString().split('T')[0] : '',
      endDate: contract.endDate ? new Date(contract.endDate).toISOString().split('T')[0] : ''
    };
    setEditingContract(formattedContract);
    setShowEditModal(true);
  };
  
  const handleUpdateContract = async (e) => {
    e.preventDefault();
    await fetch(`http://localhost:8080/api/contracts/${editingContract._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
      body: JSON.stringify(editingContract)
    });
    setShowEditModal(false);
    setEditingContract(null);
    fetchData();
  };

  const handleDeleteContract = async (contractId) => {
    if (window.confirm('Are you sure you want to delete this contract?')) {
      await fetch(`http://localhost:8080/api/contracts/${contractId}`, {
        method: 'DELETE',
        headers: { 'x-auth-token': token }
      });
      fetchData();
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Contracts</h1>
        <button className="add-button" onClick={() => setShowAddModal(true)}>+ Add Contract</button>
      </div>
      <div className="data-table-container">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Project</th>
              <th>Client</th>
              <th>Status</th>
              <th>End Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map(contract => (
              <tr key={contract._id}>
                <td>{contract.title}</td>
                <td>{contract.projectId?.title || 'N/A'}</td>
                <td>{contract.projectId?.clientId?.name || 'N/A'}</td>
                <td>{contract.status}</td>
                <td>{contract.endDate ? new Date(contract.endDate).toLocaleDateString() : 'N/A'}</td>
                <td className="actions-cell">
                  <button className="edit-button" onClick={() => openEditModal(contract)}>Edit</button>
                  <button className="delete-button" onClick={() => handleDeleteContract(contract._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add & Edit Modals */}
      { (showAddModal || (showEditModal && editingContract)) && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header"><h2 className="modal-title">{showEditModal ? 'Edit Contract' : 'Add New Contract'}</h2><button className="close-button" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>&times;</button></div>
            <form onSubmit={showEditModal ? handleUpdateContract : handleAddContract}>
              <div className="form-group"><label>Contract Title</label><input type="text" name="title" value={editingContract?.title || newContract.title} onChange={handleInputChange} required /></div>
              <div className="form-group"><label>Project</label><select name="projectId" value={editingContract?.projectId._id || newContract.projectId} onChange={handleInputChange} required><option value="">Select a Project</option>{projects.map(project => (<option key={project._id} value={project._id}>{project.title}</option>))}</select></div>
              <div className="form-group"><label>Start Date</label><input type="date" name="startDate" value={editingContract?.startDate || newContract.startDate} onChange={handleInputChange} required /></div>
              <div className="form-group"><label>End Date</label><input type="date" name="endDate" value={editingContract?.endDate || newContract.endDate} onChange={handleInputChange} required /></div>
              <div className="form-group"><label>Status</label><select name="status" value={editingContract?.status || newContract.status} onChange={handleInputChange}><option>Draft</option><option>Sent</option><option>Active</option><option>Expired</option></select></div>
              <button type="submit" className="add-button">{showEditModal ? 'Update Contract' : 'Save Contract'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Contracts;