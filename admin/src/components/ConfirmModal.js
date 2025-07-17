// admin/src/components/ConfirmModal.js
import React from 'react';
import './ConfirmModal.css'; // We'll create this CSS file next

function ConfirmModal({ isOpen, message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content-confirm">
        <p>{message}</p>
        <div className="modal-actions">
          <button onClick={onConfirm} className="modal-button confirm">Yes</button>
          <button onClick={onCancel} className="modal-button cancel">No</button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;