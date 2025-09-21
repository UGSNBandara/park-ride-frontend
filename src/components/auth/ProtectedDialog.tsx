import React from 'react'

const ProtectedDialog: React.FC<{open: boolean; onClose: () => void}> = ({open, onClose}) => {
  if (!open) return null
  return (
    <div className="modal-backdrop" role="dialog" aria-modal>
      <div className="modal">
        <h3>Access restricted</h3>
        <p>Only parking officers can access this section. Please login first.</p>
        <div className="modal-actions">
          <button className="modal-primary" onClick={onClose}>OK</button>
        </div>
      </div>
    </div>
  )
}

export default ProtectedDialog
