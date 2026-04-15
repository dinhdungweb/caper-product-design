import { useState, useRef, useEffect } from 'react';
import { Designer } from './components/Designer';
import type { DesignerHandle } from './components/Designer';
import TechniqueSelector from './components/TechniqueSelector';
import PatchSelector from './components/PatchSelector';
import ContentSelector from './components/ContentSelector';
import TextEditor from './components/TextEditor';
import LayerManager from './components/LayerManager';
import ConfirmModal from './components/ConfirmModal';
import DesignAssistantPanel from './components/DesignAssistantPanel';
import { RefreshCcw, Save, MessageSquare, ChevronLeft } from 'lucide-react';
import axios from 'axios';
import { useDesignAssistant } from './hooks/useDesignAssistant';
import './index.css';

const TECHNIQUES = [
  { id: 'embroidery', name: 'Đồ thêu', description: 'Thêu trực tiếp lên vải', icon: '🧵', priceAdd: 50000 },
  { id: '3d-embroidery', name: '3D Embroidery', description: 'Thêu nổi 3D', icon: '🧶', priceAdd: 80000 },
  { id: 'patch', name: 'Chỉnh sửa bản vá', description: 'Tùy chỉnh bản vá cố định', icon: '🛡️', priceAdd: 120000 },
  { id: 'dtf', name: 'DTF - Transfer Print', description: 'In chuyển nhiệt DTF', icon: '🖨️', priceAdd: 30000 },
  { id: 'engraving', name: 'Điêu khắc', description: 'Khắc laser lên chất liệu', icon: '🔥', priceAdd: 40000 },
];

const DEFAULT_VIEWS = [
  { id: 'front', name: 'Mặt trước', image: '/hat_front.png' },
  { id: 'side', name: 'Mặt bên', image: '/hat_side.png' },
  { id: 'back', name: 'Mặt sau', image: '/hat_back.png' },
];

function App() {
  const [hatViews, setHatViews] = useState(DEFAULT_VIEWS);
  const [apiUrl, setApiUrl] = useState('http://localhost:5000/api');
  const [currentView, setCurrentView] = useState(0);
  const [viewDesigns, setViewDesigns] = useState<Record<string, any[]>>({
    'front': [], 'side': [], 'back': []
  });
  const [viewPreviews, setViewPreviews] = useState<Record<string, string>>({});
  
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [pendingTech, setPendingTech] = useState<any>(null);

  const [view, setView] = useState<'list' | 'options'>('list');
  const [viewTechniques, setViewTechniques] = useState<Record<string, any | null>>({
    'front': null,
    'side': null,
    'back': null
  });
  const [patchOptions, setPatchOptions] = useState({
    shape: 'rect', color: '#ffffff', material: 'leatherette',
  });
  
  const [layers, setLayers] = useState<any[]>([]);
  const [activeObject, setActiveObject] = useState<any>(null);
  const [basePrice] = useState(589000);
  const designerRef = useRef<DesignerHandle>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showAssistant, setShowAssistant] = useState(true);

  // AI Design Assistant Hook - will be called after currentViewId is defined
  const aiAssistant = useDesignAssistant(layers, '', showAssistant);

  // Initialize Shopify data
  useEffect(() => {
    const shopify = (window as any).ShopifyProduct;
    if (shopify) {
        if (shopify.apiUrl) setApiUrl(shopify.apiUrl);
        if (shopify.images && shopify.images.length > 0) {
            const mapped = [
                { id: 'front', name: 'Mặt trước', image: shopify.images[0] },
                { id: 'side', name: 'Mặt bên', image: shopify.images[1] || shopify.images[0] },
                { id: 'back', name: 'Mặt sau', image: shopify.images[2] || shopify.images[0] },
            ];
            setHatViews(mapped);
        }
    }
  }, []);

  // Current view ID and its technique
  const currentViewId = hatViews[currentView].id;
  const currentTechnique = viewTechniques[currentViewId];

  // Update AI assistant when currentViewId changes
  useEffect(() => {
    if (currentViewId) {
      aiAssistant.updateViewId(currentViewId);
    }
  }, [currentViewId]);

  // Destructure AI assistant values
  const { score, suggestions, scoreColor, scoreLabel } = aiAssistant;

  // Logic: Sum base price + (priceAdd of techniques for views that HAVE designs)
  const totalPrice = (() => {
    let extra = 0;
    hatViews.forEach((v: any) => {
        const vTech = viewTechniques[v.id];
        const hasContent = (v.id === currentViewId ? layers.length > 0 : (viewDesigns[v.id]?.length > 0));
        if (hasContent && vTech) {
            extra += vTech.priceAdd;
        }
    });
    return basePrice + extra;
  })();

  const handleSelectTechnique = (tech: any) => {
    // If selecting the same technique for this specific view, just enter options view
    if (currentTechnique && tech.id === currentTechnique.id) {
        setView('options');
        return;
    }

    // Check if CURRENT view has any design elements
    const hasDesignsOnThisView = layers.length > 0;
    
    if (hasDesignsOnThisView) {
        setPendingTech(tech);
        setShowSwitchModal(true);
    } else {
        setViewTechniques(prev => ({ ...prev, [currentViewId]: tech }));
        setView('options');
    }
  };

  const confirmSwitch = () => {
    if (pendingTech) {
        // Clear design ONLY for current view
        setLayers([]);
        setViewDesigns(prev => ({ ...prev, [currentViewId]: [] }));
        // Redraw canvas background (to clear object layer but keep phôi)
        designerRef.current?.loadObjectsJson([]);
        
        setViewTechniques(prev => ({ ...prev, [currentViewId]: pendingTech }));
        setShowSwitchModal(false);
        setPendingTech(null);
        setView('options');
    }
  };

  const handleViewChange = (newIdx: number) => {
    if (!designerRef.current) return;
    
    // 1. Save current view design + thumbnail
    const currentViewId = hatViews[currentView].id;
    const currentObjects = designerRef.current.getObjectsJson();
    const currentPreview = designerRef.current.getPreviewImage();
    
    setViewDesigns(prev => ({
        ...prev,
        [currentViewId]: currentObjects
    }));
    
    if (currentPreview) {
        setViewPreviews(prev => ({
            ...prev,
            [currentViewId]: currentPreview
        }));
    }

    // 2. Switch View
    setCurrentView(newIdx);
    
    // 3. Logic: If the next view is empty, show Technique List. If it has designs, show Design Tools.
    const nextViewId = hatViews[newIdx].id;
    const nextObjects = viewDesigns[nextViewId] || [];
    
    if (nextObjects.length === 0) {
        setView('list');
    } else {
        setView('options');
    }

    // 4. Load next view design (after a tiny delay for canvas background update)
    setTimeout(() => {
        designerRef.current?.loadObjectsJson(nextObjects);
    }, 50);
  };

  useEffect(() => {
    if (activeObject) setView('options');
  }, [activeObject]);

  const handleLayersUpdate = (newLayers: any[]) => {
    setLayers(newLayers);
    // Auto-update thumbnail of current view
    if (designerRef.current) {
        const preview = designerRef.current.getPreviewImage();
        if (preview) {
            setViewPreviews(prev => ({
                ...prev,
                [hatViews[currentView].id]: preview
            }));
        }
    }
  };

  // Apply AI suggestion (e.g., auto-center object)
  const handleApplySuggestion = (suggestion: any) => {
    if (!designerRef.current || !activeObject) return;
    
    if (suggestion.left && suggestion.top) {
      // Smart placement - move object to safe zone center
      designerRef.current.selectObject(activeObject.id);
      const canvas = designerRef.current as any;
      // Note: This would need to be implemented in Designer component
      console.log('Applying smart placement:', suggestion);
    }
  };

  // Helper to add product to Shopify cart
  const addToShopifyCart = async (designId: string) => {
    // Get product from Shopify globally set in Liquid
    const shopifyProduct = (window as any).ShopifyProduct;
    if (!shopifyProduct) {
        console.warn('ShopifyProduct not found, skipping sync to Shopify cart');
        return;
    }
    
    const variantId = shopifyProduct.variants[0].id; // Primary variant

    try {
        const formData = {
            'items': [{
                'id': variantId,
                'quantity': 1,
                'properties': {
                    '_design_id': designId,
                    'Note': `Thiết kế tùy chỉnh - ID: ${designId}`
                }
            }]
        };

        const response = await fetch(window.location.origin + '/cart/add.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            console.log('Sync to Shopify cart successful');
            window.location.href = '/cart';
        } else {
            console.error('Failed to sync to Shopify cart', await response.text());
        }
    } catch (e) {
        console.error('Error syncing to Shopify cart', e);
    }
  };

  const handleAddToCart = async () => {
    if (!designerRef.current) return;
    
    // 1. Get latest state of the CURRENT view from canvas
    const currentDesign = designerRef.current.getDesign();
    if (!currentDesign) return;

    // 2. Prepare full package with all views synced
    const finalViews = {
        ...viewDesigns,
        [hatViews[currentView].id]: currentDesign.json
    };
    const finalPreviews = {
        ...viewPreviews,
        [hatViews[currentView].id]: currentDesign.image
    };

    setIsSaving(true);
    try {
      const response = await axios.post(`${apiUrl}/designs`, {
        views: finalViews,
        viewPreviews: finalPreviews,
        viewTechniques: viewTechniques,
        totalPrice: totalPrice,
        options: patchOptions
      });
      
      const designId = response.data.design_id;
      
      // Step 2: Sync to Shopify Cart
      setIsSaving(true); // Keep spinner active
      await addToShopifyCart(designId);
      
      alert(`Thiết kế đã được lưu và thêm vào giỏ hàng!`);
    } catch (error) {
      console.error('Save error:', error);
      alert('Lỗi khi lưu bộ thiết kế. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateObject = (props: any) => {
    if (activeObject) {
        setActiveObject({ ...activeObject, ...props });
        designerRef.current?.updateObject(props);
    }
  };

  const handleSetCurvature = (val: number) => {
    if (activeObject) {
        setActiveObject({ ...activeObject, curvature: val });
        designerRef.current?.setCurvature(val);
    }
  };

  const handleBack = () => {
    if (activeObject) {
        // Deselect object on canvas AND clear state
        designerRef.current?.deselectAll();
        setActiveObject(null);
    } else {
        setView('list');
    }
  };

  return (
    <div className="app-container">
      <main className="preview-panel">
        <div className="header-utility">
          <button className="btn-u"><MessageSquare size={14} /> Phản hồi</button>
          <button className="btn-u"><Save size={14} /> Lưu</button>
        </div>
        <div className="canvas-container" style={{ position: 'relative' }}>
            <Designer 
              ref={designerRef} 
              technique={currentTechnique?.id || ''} 
              patchOptions={patchOptions}
              productImage={hatViews[currentView].image}
              onSelection={setActiveObject}
              onLayersUpdate={handleLayersUpdate}
              viewId={currentViewId}
            />
            
            {/* AI Design Assistant Panel */}
            {showAssistant && !activeObject && (
              <DesignAssistantPanel
                score={score}
                scoreLabel={scoreLabel}
                scoreColor={scoreColor}
                suggestions={suggestions}
                onApplySuggestion={handleApplySuggestion}
                isVisible={showAssistant}
              />
            )}
        </div>
        
        <div className="view-selector-strip">
          {hatViews.map((v, idx) => (
            <button 
              key={v.id} 
              className={`view-thumb ${currentView === idx ? 'active' : ''}`}
              onClick={() => handleViewChange(idx)}
            >
              <img src={viewPreviews[v.id] || v.image} alt={v.name} />
            </button>
          ))}
          <div className="thumb-divider"></div>
          <button className="btn-u-sm"><RefreshCcw size={14} /> Thay đổi phôi</button>
        </div>
      </main>

      <aside className="controls-panel">
        {view === 'list' && !activeObject ? (
          <div className="control-group">
            <label className="section-title">Chọn kỹ thuật</label>
            <TechniqueSelector 
              techniques={TECHNIQUES} 
              selectedId={currentTechnique?.id || ''} 
              onSelect={handleSelectTechnique} 
            />
          </div>
        ) : (
          <div className="control-group fade-in">
            <div className="view-header">
                <button className="btn-back-sidebar" onClick={handleBack}>
                    <ChevronLeft size={18} /> Quay lại
                </button>
                <span className="view-title">
                    {activeObject ? 'Chỉnh sửa văn bản' : (currentTechnique?.id === 'patch' ? 'Chỉnh sửa bản vá' : 'Thêm thiết kế')}
                </span>
            </div>

            <div className="options-content">
                {activeObject && activeObject.type === 'text' ? (
                    <div className="editor-area fade-in">
                        <TextEditor 
                            activeObject={activeObject} 
                            onUpdate={handleUpdateObject}
                            onDelete={() => designerRef.current?.deleteSelected()}
                            onSetCurvature={handleSetCurvature}
                        />
                    </div>
                ) : (
                    <>
                        <LayerManager 
                            layers={layers}
                            onSelect={(id) => designerRef.current?.selectObject(id)}
                            onDuplicate={(id) => designerRef.current?.duplicateObject(id)}
                            onDelete={(id) => {
                                designerRef.current?.selectObject(id);
                                setTimeout(() => designerRef.current?.deleteSelected(), 10);
                            }}
                        />

                        <div className="editor-area fade-in">
                            {currentTechnique?.id === 'patch' && (
                                <PatchSelector options={patchOptions} onChange={setPatchOptions} />
                            )}
                            <div style={{ marginTop: '1.5rem' }}>
                                <label className="section-title">Thêm nội dung thiết kế</label>
                                <ContentSelector 
                                    onAddText={() => designerRef.current?.addText()}
                                    onAddImage={() => designerRef.current?.triggerImageUpload()}
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>
          </div>
        )}

        <div className="btn-primary-sticky">
          <div className="price-summary">
            <span className="label-muted">Tổng cộng</span>
            <span className="price-value">{totalPrice.toLocaleString()} đ</span>
          </div>
          <button className="btn-add-cart" onClick={handleAddToCart} disabled={isSaving}>
            {isSaving ? 'ĐANG LƯU...' : 'THÊM VÀO GIỎ HÀNG'}
          </button>
        </div>
      </aside>

      <ConfirmModal 
        isOpen={showSwitchModal}
        onConfirm={confirmSwitch}
        onCancel={() => setShowSwitchModal(false)}
      />
    </div>
  );
}

export default App;
