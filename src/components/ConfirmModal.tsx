import React from 'react';

interface Props {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<Props> = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay fade-in">
      <div className="confirm-modal">
        <div className="modal-content">
          <p className="modal-text">
            Thiết kế ở MẶT NÀY sẽ bị xóa khi chuyển sang kỹ thuật khác.
          </p>
          <p className="modal-subtext">Bạn có chắc muốn tiếp tục?</p>
        </div>
        <div className="modal-actions">
          <button className="btn-modal btn-cancel" onClick={onCancel}>Hủy</button>
          <button className="btn-modal btn-confirm" onClick={onConfirm}>Đồng ý</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
