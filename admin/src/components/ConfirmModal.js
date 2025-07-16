import React from 'react';
import './ConfirmModal.css';

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="modal-backdrop">
      <div className="modal-content confirm-modal">
        <p>{message}</p>
        <div className="confirm-modal-actions">
          <button onClick={onCancel} className="cancel-button">Cancel</button>
          <button onClick={onConfirm} className="confirm-button">Confirm</button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;