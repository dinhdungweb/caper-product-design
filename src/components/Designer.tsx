import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import * as fabric from 'fabric';
// Trash2 not used

export interface DesignerHandle {
  getDesign: () => { json: any; image: string } | null;
  addText: () => void;
  triggerImageUpload: () => void;
  updateObject: (props: any) => void;
  setCurvature: (value: number) => void;
  deleteSelected: () => void;
  selectObject: (id: string) => void;
  deselectAll: () => void;
  duplicateObject: (id: string) => void;
  getObjectsJson: () => any[];
  loadObjectsJson: (objects: any[]) => void;
  getPreviewImage: () => string | null;
}

interface Props {
  technique: string;
  patchOptions?: { shape: string; color: string; material: string };
  productImage?: string;
  onSelection?: (obj: any) => void;
  onLayersUpdate?: (layers: any[]) => void;
}

// Custom Fabric Control: Trash Icon for object deletion
const renderDeleteIcon = (ctx: CanvasRenderingContext2D, left: number, top: number, _styleOverride: any, _fabricObject: fabric.FabricObject) => {
    const size = 28;
    ctx.save();
    ctx.translate(left, top);
    
    // Draw orange circle background for the button
    ctx.beginPath();
    ctx.arc(0, 0, size/2, 0, 2 * Math.PI, false);
    ctx.fillStyle = '#ff7043'; // Orange color from user sample
    ctx.fill();
    ctx.shadowColor = 'rgba(0,0,0,0.1)';
    ctx.shadowBlur = 4;
    
    // Draw simple white trash icon inside
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    // Lid
    ctx.moveTo(-5, -5); ctx.lineTo(5, -5);
    // Body
    ctx.moveTo(-4.5, -5); ctx.lineTo(-4, 6); ctx.lineTo(4, 6); ctx.lineTo(4.5, -5);
    // Vertical lines
    ctx.moveTo(-1.5, -3); ctx.lineTo(-1.5, 3);
    ctx.moveTo(1.5, -3); ctx.lineTo(1.5, 3);
    ctx.stroke();
    
    ctx.restore();
};

const deleteObject = (_eventData: fabric.TPointerEvent, transform: fabric.Transform) => {
    const target = transform.target;
    if (target && target.canvas) {
        target.canvas.remove(target);
        target.canvas.requestRenderAll();
    }
    return true;
};

// Ensure default controls exist and add deleteControl to all relevant classes
const applyDeleteControl = (klass: any) => {
    if (!klass.prototype.controls) klass.prototype.controls = {};
    klass.prototype.controls.deleteControl = new fabric.Control({
        x: -0.5, 
        y: -0.5,
        offsetY: -16,
        offsetX: -16,
        cursorStyle: 'pointer',
        mouseUpHandler: deleteObject,
        render: renderDeleteIcon,
    });
};

applyDeleteControl(fabric.FabricObject);
if ((fabric as any).IText) applyDeleteControl((fabric as any).IText);
if ((fabric as any).FabricImage) applyDeleteControl((fabric as any).FabricImage);

// Fixed patch mapping

export const Designer = forwardRef<DesignerHandle, Props>(({ technique, patchOptions, productImage, onSelection, onLayersUpdate }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [patchObject, setPatchObject] = useState<fabric.Object | null>(null);
  const onSelectionRef = useRef(onSelection);
  const onLayersUpdateRef = useRef(onLayersUpdate);

  // Keep refs in sync with latest props
  useEffect(() => { onSelectionRef.current = onSelection; }, [onSelection]);
  useEffect(() => { onLayersUpdateRef.current = onLayersUpdate; }, [onLayersUpdate]);

  useImperativeHandle(ref, () => ({
    getDesign: () => {
      if (!canvas) return null;
      return {
        json: canvas.toJSON(),
        image: canvas.toDataURL({ multiplier: 2, format: 'png' })
      };
    },
    addText: () => handleAddText(),
    triggerImageUpload: () => fileInputRef.current?.click(),
    updateObject: (props) => {
        const active = canvas?.getActiveObject() as any;
        if (active) {
            active.set(props);
            canvas?.requestRenderAll();
        }
    },
    setCurvature: (value) => handleSetCurvature(value),
    deleteSelected: () => {
        const active = canvas?.getActiveObject();
        if (active) {
            canvas?.remove(active);
            canvas?.requestRenderAll();
        }
    },
    selectObject: (id) => {
        const obj = canvas?.getObjects().find(o => (o as any).id === id);
        if (obj && canvas) {
            canvas.discardActiveObject(); // Clear any phantom selection
            canvas.setActiveObject(obj);
            canvas.requestRenderAll();
            // Manually fire selection events to ensure App state syncs immediately
            canvas.fire('selection:created', { selected: [obj] });
        }
    },
    deselectAll: () => {
        canvas?.discardActiveObject();
        canvas?.requestRenderAll();
    },
    duplicateObject: (id) => {
        const obj = canvas?.getObjects().find(o => (o as any).id === id) as any;
        if (obj) {
            obj.clone().then((cloned: any) => {
                cloned.set({
                    left: obj.left + 10,
                    top: obj.top + 10,
                    id: `copy-${Date.now()}`
                });
                canvas?.add(cloned);
                canvas?.setActiveObject(cloned);
            });
        }
    },
    getObjectsJson: () => {
        if (!canvas) return [];
        return canvas.getObjects()
            .filter(obj => obj.get('name') !== 'background')
            .map(obj => obj.toJSON());
    },
    loadObjectsJson: (objectsJson) => {
        if (!canvas) return;
        // Remove existing non-background objects
        canvas.getObjects().forEach(obj => {
            if (obj.get('name') !== 'background') {
                canvas.remove(obj);
            }
        });
        
        // Add new objects
        fabric.util.enlivenObjects(objectsJson).then((objects) => {
            (objects as fabric.FabricObject[]).forEach(obj => {
                if (obj && typeof obj.setCoords === 'function') {
                    canvas.add(obj);
                }
            });
            canvas.requestRenderAll();
        });
    },
    getPreviewImage: () => {
        if (!canvas) return null;
        return canvas.toDataURL({
            format: 'png',
            quality: 0.7,
            multiplier: 0.4 // Small preview for thumbnails
        });
    }
  }));

  useEffect(() => {
    if (!canvasRef.current) return;
    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: 500,
      height: 500,
      backgroundColor: 'transparent',
    });
    setCanvas(fabricCanvas);

    // Dynamic Injection: Ensure every object added has the delete control and a unique ID
    fabricCanvas.on('object:added', (e: any) => {
        const obj = e.target;
        if (obj && obj.get('name') !== 'background') {
            // Assign ID if missing
            if (!(obj as any).id) {
                (obj as any).id = `layer-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;
            }
            
            // Re-populate default controls if missing, then add delete button
            obj.controls = { 
                ...fabric.controlsUtils.createObjectDefaultControls(),
                deleteControl: new fabric.Control({
                    x: -0.5,
                    y: -0.5,
                    offsetY: -24,
                    offsetX: -24,
                    cursorStyle: 'pointer',
                    mouseUpHandler: deleteObject,
                    render: renderDeleteIcon,
                })
            };
        }
    });

    // Initial Load - Using provided image or default
    const imgUrl = productImage || '/hat_base_black.png';
    const initImage = async () => {
        await loadProductImage(fabricCanvas, imgUrl);
    };
    initImage();

    // Selection Events
    const handleSelection = () => {
        const active = fabricCanvas.getActiveObject();
        if (active && onSelectionRef.current) {
            onSelectionRef.current({
                type: active.get('type') === 'i-text' ? 'text' : 'image',
                text: (active as any).text || '',
                fontFamily: (active as any).fontFamily,
                fontSize: (active as any).fontSize,
                fill: (active as any).fill,
                textAlign: (active as any).textAlign,
                curvature: (active as any).curvature || 0,
                id: (active as any).id
            });
        }
    };

    fabricCanvas.on('selection:created', handleSelection);
    fabricCanvas.on('selection:updated', handleSelection);
    fabricCanvas.on('selection:cleared', () => onSelectionRef.current?.(null));

    const syncLayers = () => {
        if (onLayersUpdateRef.current) {
            const layers = fabricCanvas.getObjects()
                .filter(obj => obj.get('name') !== 'background')
                .map(obj => ({
                    id: (obj as any).id,
                    type: obj.get('type') === 'i-text' ? 'text' : 'image',
                    text: (obj as any).text || 'Thiết kế',
                }));
            onLayersUpdateRef.current(layers);
        }
    };

    fabricCanvas.on('object:added', (e: any) => {
        if (e.target?.get('name') !== 'background') syncLayers();
    });
    fabricCanvas.on('object:removed', (e: any) => {
        if (e.target?.get('name') !== 'background') syncLayers();
    });
    fabricCanvas.on('object:modified', syncLayers);

    return () => {
        fabricCanvas.dispose();
    }
  }, []); // Static dependency to avoid "changed size" error

  // Update product image if changed
  useEffect(() => {
    if (canvas && productImage) {
        const background = canvas.getObjects().find(obj => obj.get('name') === 'background');
        if (background) canvas.remove(background);
        loadProductImage(canvas, productImage);
    }
  }, [productImage]);

  // Handle Patch Creation/Update
  useEffect(() => {
    if (!canvas) return;
    
    if (technique === 'patch' && patchOptions) {
        updatePatch(canvas, patchOptions);
    } else if (patchObject) {
        canvas.remove(patchObject);
        setPatchObject(null);
    }
  }, [technique, patchOptions, canvas]);

  const loadProductImage = async (fCanvas: fabric.Canvas, url: string) => {
    const img = await fabric.FabricImage.fromURL(url);
    const scale = Math.min(500 / img.get('width'), 500 / img.get('height'));
    img.set({
      scaleX: scale, scaleY: scale,
      selectable: false, evented: false,
      originX: 'center', originY: 'center',
      left: 250, top: 250,
      name: 'background'
    });
    fCanvas.add(img);
    fCanvas.sendObjectToBack(img);
    fCanvas.requestRenderAll();
  };

  const updatePatch = (fCanvas: fabric.Canvas, options: any) => {
    if (patchObject) fCanvas.remove(patchObject);

    let newPatch: fabric.FabricObject;
    const style = {
        fill: options.color,
        stroke: '#333',
        strokeWidth: 2,
        originX: 'center' as const,
        originY: 'center' as const,
        left: 250,
        top: 210, // Adjusted for hat front
        name: 'patch-base',
        selectable: false,
        evented: false,
    };

    if (options.shape === 'circle') {
        newPatch = new fabric.Circle({ ...style, radius: 60 });
    } else if (options.shape === 'hexagon') {
        newPatch = new fabric.Polygon([
            {x: 0, y: -60}, {x: 52, y: -30}, {x: 52, y: 30},
            {x: 0, y: 60}, {x: -52, y: 30}, {x: -52, y: -30}
        ], style);
    } else {
        newPatch = new fabric.Rect({ ...style, width: 150, height: 100, rx: 5, ry: 5 });
    }

    fCanvas.add(newPatch);
    // Put patch behind text/logos but above background
    const objects = fCanvas.getObjects();
    const backgroundIdx = objects.indexOf(objects.find(o => o.get('name') === 'background')!);
    
    // In v7, use moveObjectTo
    fCanvas.moveObjectTo(newPatch, backgroundIdx + 1);
    
    setPatchObject(newPatch);
    fCanvas.requestRenderAll();
  };

  const handleAddText = () => {
    if (!canvas) return;
    const text = new fabric.IText('Your Text', {
      left: 250, top: 210, originX: 'center', originY: 'center',
      fontFamily: 'Outfit', fontSize: 18,
      fill: technique === 'patch' ? '#333' : '#fff',
      id: `text-${Date.now()}`
    } as any);
    canvas.add(text);
    canvas.setActiveObject(text);
  };

  const handleSetCurvature = (value: number) => {
    const active = canvas?.getActiveObject() as any;
    if (!active || active.type !== 'i-text') return;

    active.curvature = value;
    if (value === 0) {
      active.set({ path: undefined });
    } else {
      // Calculate a simple quadratic path for the arc
      // value ranges from -100 to 100
      const w = active.width * active.scaleX;
      const h = value * 1.5; 
      const pathData = `M 0 0 Q ${w/2} ${h} ${w} 0`;
      active.set({ 
          path: new fabric.Path(pathData, {
              visible: false,
              strokeWidth: 0,
          }),
          pathSide: 'left',
          pathAlign: 'center'
      });
    }
    canvas?.requestRenderAll();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canvas || !e.target.files) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (f) => {
      fabric.FabricImage.fromURL(f.target?.result as string).then((img) => {
        img.scaleToWidth(60);
        img.set({ 
            originX: 'center', originY: 'center', 
            left: 250, top: 210,
            id: `img-${Date.now()}`
        } as any);
        canvas.add(img);
        canvas.setActiveObject(img);
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="designer-canvas-wrapper">
      <div className="canvas-container">
        <canvas ref={canvasRef} />
      </div>
      <input type="file" ref={fileInputRef} hidden onChange={handleImageUpload} accept="image/*" />
    </div>
  );
});

export default Designer;
