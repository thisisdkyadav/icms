import Modal from './Modal';

function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', confirmVariant = 'primary', loading = false }) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
            <p className="modal-confirm-text">{message}</p>
            <div className="modal-form-actions">
                <button className="btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
                <button className={`btn-${confirmVariant}`} onClick={onConfirm} disabled={loading}>
                    {loading ? 'Please wait...' : confirmText}
                </button>
            </div>
        </Modal>
    );
}

export default ConfirmDialog;
