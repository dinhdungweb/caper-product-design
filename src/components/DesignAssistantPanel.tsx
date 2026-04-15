import React from 'react';
import { CheckCircle, AlertTriangle, Lightbulb, X } from 'lucide-react';

interface DesignAssistantPanelProps {
  score: number;
  scoreLabel: string;
  scoreColor: string;
  suggestions: Array<{
    type: string;
    message: string;
    suggestion?: any;
  }>;
  onApplySuggestion?: (suggestion: any) => void;
  isVisible: boolean;
}

const DesignAssistantPanel: React.FC<DesignAssistantPanelProps> = ({
  score,
  scoreLabel,
  scoreColor,
  suggestions,
  onApplySuggestion,
  isVisible
}) => {
  if (!isVisible) return null;

  return (
    <div className="design-assistant-panel" style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      width: '300px',
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      padding: '16px',
      zIndex: 1000,
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Score Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px',
        paddingBottom: '12px',
        borderBottom: '1px solid #eee'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: `conic-gradient(${scoreColor} ${score * 3.6}deg, #eee ${score * 3.6}deg)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '14px',
              color: scoreColor
            }}>
              {score}
            </div>
          </div>
          <div>
            <div style={{ fontWeight: '600', fontSize: '16px' }}>Chất lượng thiết kế</div>
            <div style={{ color: scoreColor, fontSize: '14px', fontWeight: '500' }}>{scoreLabel}</div>
          </div>
        </div>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 ? (
        <div style={{ marginTop: '12px' }}>
          <div style={{ 
            fontSize: '13px', 
            fontWeight: '600', 
            color: '#666',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Lightbulb size={14} />
            Đề xuất cải thiện ({suggestions.length})
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {suggestions.map((suggestion, idx) => (
              <div
                key={idx}
                style={{
                  background: suggestion.type === 'contrast' ? '#fff3cd' : 
                             suggestion.type === 'placement' ? '#d1ecf1' : 
                             suggestion.type === 'size' ? '#f8d7da' : '#e2e3e5',
                  borderLeft: `3px solid ${
                    suggestion.type === 'contrast' ? '#ffc107' : 
                    suggestion.type === 'placement' ? '#17a2b8' : 
                    suggestion.type === 'size' ? '#dc3545' : '#6c757d'
                  }`,
                  borderRadius: '6px',
                  padding: '10px',
                  fontSize: '13px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <AlertTriangle 
                    size={14} 
                    style={{ 
                      flexShrink: 0, 
                      marginTop: '2px',
                      color: suggestion.type === 'contrast' ? '#856404' : 
                            suggestion.type === 'placement' ? '#0c5460' : 
                            suggestion.type === 'size' ? '#721c24' : '#383d41'
                    }} 
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      color: suggestion.type === 'contrast' ? '#856404' : 
                            suggestion.type === 'placement' ? '#0c5460' : 
                            suggestion.type === 'size' ? '#721c24' : '#383d41',
                      marginBottom: '6px'
                    }}>
                      {suggestion.message}
                    </div>
                    
                    {suggestion.suggestion && onApplySuggestion && (
                      <button
                        onClick={() => onApplySuggestion(suggestion.suggestion)}
                        style={{
                          background: 'white',
                          border: '1px solid currentColor',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          color: suggestion.type === 'contrast' ? '#856404' : 
                                suggestion.type === 'placement' ? '#0c5460' : 
                                suggestion.type === 'size' ? '#721c24' : '#383d41',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = suggestion.type === 'contrast' ? '#ffeeba' : 
                                                           suggestion.type === 'placement' ? '#bee5eb' : 
                                                           suggestion.type === 'size' ? '#f5c6cb' : '#dae0e5';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'white';
                        }}
                      >
                        Áp dụng ngay
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '20px 0',
          color: '#2ecc71'
        }}>
          <CheckCircle size={32} style={{ margin: '0 auto 8px' }} />
          <div style={{ fontWeight: '500' }}>Thiết kế tuyệt vời!</div>
          <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
            Không có vấn đề cần sửa
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignAssistantPanel;
