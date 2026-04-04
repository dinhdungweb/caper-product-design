import React from 'react';
import { 
  AlignLeft, AlignCenter, AlignRight, 
  Trash2, ChevronUp, ChevronDown, 
  Minus, Plus 
} from 'lucide-react';

interface Props {
  activeObject: any;
  onUpdate: (props: any) => void;
  onDelete: () => void;
  onSetCurvature: (val: number) => void;
}

const FONTS = ['Outfit', 'Roboto', 'Inter', 'Serif', 'Cursive', 'Monospace'];
const COLORS = [
  '#ffffff', '#000000', '#1e293b', '#64748b', '#ef4444', 
  '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899',
  '#78350f', '#064e3b', '#1e3a8a'
];

const TextEditor: React.FC<Props> = ({ activeObject, onUpdate, onDelete, onSetCurvature }) => {
  if (!activeObject || activeObject.type !== 'text') return null;

  return (
    <div className="text-editor fade-in">
      <div className="editor-section">
        <textarea 
          className="text-input"
          value={activeObject.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          placeholder="Nhập nội dung..."
        />
      </div>

      <div className="editor-section">
        <label className="section-title">Phông chữ</label>
        <div className="font-selector">
          <select 
            value={activeObject.fontFamily}
            onChange={(e) => onUpdate({ fontFamily: e.target.value })}
          >
            {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </div>

      <div className="editor-row">
        <div className="editor-col">
          <label className="section-title">Kích thước</label>
          <div className="size-control">
            <button onClick={() => onUpdate({ fontSize: Math.max(8, activeObject.fontSize - 2) })}><Minus size={14}/></button>
            <input type="number" value={activeObject.fontSize} readOnly />
            <button onClick={() => onUpdate({ fontSize: activeObject.fontSize + 2 })}><Plus size={14}/></button>
          </div>
        </div>
        <div className="editor-col">
          <label className="section-title">Căn lề</label>
          <div className="align-control">
            <button 
              className={activeObject.textAlign === 'left' ? 'active' : ''} 
              onClick={() => onUpdate({ textAlign: 'left' })}
            ><AlignLeft size={16}/></button>
            <button 
              className={activeObject.textAlign === 'center' ? 'active' : ''} 
              onClick={() => onUpdate({ textAlign: 'center' })}
            ><AlignCenter size={16}/></button>
            <button 
              className={activeObject.textAlign === 'right' ? 'active' : ''} 
              onClick={() => onUpdate({ textAlign: 'right' })}
            ><AlignRight size={16}/></button>
          </div>
        </div>
      </div>

      <div className="editor-section">
        <label className="section-title">Độ cong (Arc)</label>
        <div className="arc-control">
           <input 
             type="range" 
             min="-100" 
             max="100" 
             value={activeObject.curvature || 0} 
             onChange={(e) => onSetCurvature(parseInt(e.target.value))}
           />
        </div>
      </div>

      <div className="editor-section">
        <label className="section-title">Màu chỉ thêu / in</label>
        <div className="color-palette">
          {COLORS.map(c => (
            <button 
              key={c} 
              className={`color-btn ${activeObject.fill === c ? 'active' : ''}`}
              style={{ backgroundColor: c }}
              onClick={() => onUpdate({ fill: c })}
            />
          ))}
        </div>
      </div>

      <div className="editor-section actions-footer">
        <div className="action-grid-sm">
           <button className="btn-action-sm" title="Đưa lên lớp trên"><ChevronUp size={16}/></button>
           <button className="btn-action-sm" title="Đưa xuống lớp dưới"><ChevronDown size={16}/></button>
           <button className="btn-action-sm danger" onClick={onDelete} title="Xóa"><Trash2 size={16}/></button>
        </div>
      </div>
    </div>
  );
};

export default TextEditor;
