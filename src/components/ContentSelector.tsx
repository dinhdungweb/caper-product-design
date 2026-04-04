import React from 'react';
import { Type, Image as ImageIcon, Layout } from 'lucide-react';

interface Props {
  onAddText: () => void;
  onAddImage: () => void;
}

const ContentSelector: React.FC<Props> = ({ onAddText, onAddImage }) => {
  return (
    <div className="content-selector">
      <div className="action-grid">
        <button className="action-btn" onClick={onAddText}>
          <Type size={24} />
          <span>Văn bản</span>
        </button>
        <button className="action-btn">
          <Layout size={24} />
          <span>Thiết kế</span>
        </button>
        <button className="action-btn" onClick={onAddImage}>
          <ImageIcon size={24} />
          <span>Đa phương tiện/Tải lên</span>
        </button>
      </div>
    </div>
  );
};

export default ContentSelector;
