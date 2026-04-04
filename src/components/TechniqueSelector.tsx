import React from 'react';
import { ChevronRight } from 'lucide-react';

interface Technique {
  id: string;
  name: string;
  description: string;
  icon: string;
  priceAdd: number;
}

interface Props {
  techniques: Technique[];
  selectedId: string;
  onSelect: (tech: Technique) => void;
}

const TechniqueSelector: React.FC<Props> = ({ techniques, selectedId, onSelect }) => {
  return (
    <div className="technique-list">
      {techniques.map((tech) => (
        <button 
          key={tech.id} 
          className={`technique-card ${selectedId === tech.id ? 'active' : ''}`}
          onClick={() => onSelect(tech)}
          type="button"
        >
          <div className="technique-info">
            <div className="technique-icon">
              {tech.icon}
            </div>
            <div className="technique-details">
              <h4>{tech.name}</h4>
              <p>{tech.description}</p>
            </div>
          </div>
          <ChevronRight size={18} className="chevron" />
        </button>
      ))}
    </div>
  );
};

export default TechniqueSelector;
