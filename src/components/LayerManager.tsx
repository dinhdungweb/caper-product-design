import React from 'react';
import { Copy, Edit2, Trash2, Type, Image as ImageIcon } from 'lucide-react';

interface Layer {
  id: string;
  type: 'text' | 'image';
  text: string;
}

interface Props {
  layers: Layer[];
  onSelect: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

const LayerManager: React.FC<Props> = ({ layers, onSelect, onDuplicate, onDelete }) => {
  if (layers.length === 0) return null;

  return (
    <div className="layer-manager fade-in">
      <div className="layer-list">
        {layers.map((layer) => (
          <div key={layer.id} className="layer-item">
            <div className="layer-info" onClick={() => onSelect(layer.id)}>
              <div className="layer-icon-box">
                {layer.type === 'text' ? <Type size={14} /> : <ImageIcon size={14} />}
              </div>
              <span className="layer-name">{layer.text.substring(0, 15)}{layer.text.length > 15 ? '...' : ''}</span>
            </div>
            <div className="layer-actions">
              <button className="layer-btn" title="Nhân bản" onClick={(e) => { e.stopPropagation(); onDuplicate(layer.id); }}>
                <Copy size={14} />
              </button>
              <button className="layer-btn" title="Chỉnh sửa" onClick={(e) => { e.stopPropagation(); onSelect(layer.id); }}>
                <Edit2 size={14} />
              </button>
              <button className="layer-btn danger" title="Xóa" onClick={(e) => { e.stopPropagation(); onDelete(layer.id); }}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="layer-divider"></div>
    </div>
  );
};

export default LayerManager;
