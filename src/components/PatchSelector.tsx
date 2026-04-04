import React from 'react';
import { Circle, Square, Hexagon, Star, Heart } from 'lucide-react';

const SHAPES = [
  { id: 'rect', icon: <Square size={20} /> },
  { id: 'rect-round', icon: <Square size={20} /> },
  { id: 'circle', icon: <Circle size={20} /> },
  { id: 'hexagon', icon: <Hexagon size={20} /> },
  { id: 'star', icon: <Star size={20} /> },
  { id: 'heart', icon: <Heart size={20} /> },
];

const COLORS = [
  '#ffffff', '#000000', '#10b981', '#3b82f6', '#ef4444', 
  '#f59e0b', '#8b5cf6', '#ec4899'
];

const MATERIALS = [
  { id: 'suede', name: 'Suede' },
  { id: 'leatherette', name: 'Leatherette' },
];

interface Props {
  options: { shape: string; color: string; material: string };
  onChange: (options: any) => void;
}

const PatchSelector: React.FC<Props> = ({ options, onChange }) => {
  return (
    <div className="patch-selector">
      <div className="option-section">
        <label className="section-title">Hình dạng</label>
        <div className="shape-grid">
          {SHAPES.map((s) => (
            <button 
              key={s.id} 
              className={`shape-btn ${options.shape === s.id ? 'active' : ''}`}
              onClick={() => onChange({ ...options, shape: s.id })}
            >
              {s.icon}
            </button>
          ))}
        </div>
      </div>

      <div className="option-section" style={{ marginTop: '1.5rem' }}>
        <label className="section-title">Màu nền</label>
        <div className="color-palette">
          {COLORS.map((c) => (
            <button 
              key={c} 
              className={`color-btn ${options.color === c ? 'active' : ''}`}
              style={{ backgroundColor: c }}
              onClick={() => onChange({ ...options, color: c })}
            />
          ))}
        </div>
      </div>

      <div className="option-section" style={{ marginTop: '1.5rem' }}>
        <label className="section-title">Chất liệu</label>
        <div className="material-toggle">
          {MATERIALS.map((m) => (
            <button 
              key={m.id} 
              className={`material-btn ${options.material === m.id ? 'active' : ''}`}
              onClick={() => onChange({ ...options, material: m.id })}
            >
              {m.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PatchSelector;
