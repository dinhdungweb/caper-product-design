/**
 * AI Design Assistant & Smart Placement Utilities
 * Provides intelligent design suggestions and auto-alignment
 */

export interface DesignSuggestion {
  type: 'color' | 'placement' | 'size' | 'contrast';
  message: string;
  suggestion?: any;
}

/**
 * Define safe zones for hat embroidery (in canvas coordinates)
 * Standard hat front: 500x500 canvas, hat image centered
 */
const HAT_SAFE_ZONES = {
  front: { x: 150, y: 150, width: 200, height: 120 }, // Front panel area
  side: { x: 180, y: 160, width: 140, height: 100 },   // Side panel
  back: { x: 160, y: 170, width: 180, height: 90 }     // Back strap area
};

/**
 * Check if an object is within the safe zone for the given view
 */
export const isWithinSafeZone = (
  obj: any,
  viewId: string
): boolean => {
  const zone = HAT_SAFE_ZONES[viewId as keyof typeof HAT_SAFE_ZONES];
  if (!zone) return true;

  const objLeft = obj.left || 0;
  const objTop = obj.top || 0;
  const objWidth = (obj.width || 0) * (obj.scaleX || 1);
  const objHeight = (obj.height || 0) * (obj.scaleY || 1);

  return (
    objLeft - objWidth / 2 >= zone.x &&
    objLeft + objWidth / 2 <= zone.x + zone.width &&
    objTop - objHeight / 2 >= zone.y &&
    objTop + objHeight / 2 <= zone.y + zone.height
  );
};

/**
 * Auto-center object within the safe zone
 */
export const smartPlacement = (
  obj: any,
  viewId: string
): { left: number; top: number } => {
  const zone = HAT_SAFE_ZONES[viewId as keyof typeof HAT_SAFE_ZONES];
  if (!zone) {
    return { left: 250, top: 250 }; // Default center
  }

  const centerX = zone.x + zone.width / 2;
  const centerY = zone.y + zone.height / 2;

  return { left: centerX, top: centerY };
};

/**
 * Analyze color contrast between design elements and background
 * Returns suggestions for better visibility
 */
export const analyzeColorContrast = (
  designColor: string,
  backgroundColor: string
): DesignSuggestion | null => {
  // Simple luminance calculation
  const getLuminance = (hex: string) => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = rgb & 0xff;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  };

  try {
    const lum1 = getLuminance(designColor.startsWith('#') ? designColor : '#000000');
    const lum2 = getLuminance(backgroundColor.startsWith('#') ? backgroundColor : '#ffffff');
    
    const contrastRatio = Math.max(lum1, lum2) / Math.min(lum1, lum2);
    
    if (contrastRatio < 2.5) {
      return {
        type: 'contrast',
        message: `Độ tương phản thấp (${contrastRatio.toFixed(1)}:1). Đề xuất thay đổi màu để dễ nhìn hơn.`,
        suggestion: lum1 > 0.5 ? '#000000' : '#ffffff'
      };
    }
  } catch (e) {
    // Ignore invalid colors
  }
  
  return null;
};

/**
 * Suggest optimal text size based on content length and safe zone
 */
export const suggestTextSize = (
  text: string,
  viewId: string
): number => {
  const zone = HAT_SAFE_ZONES[viewId as keyof typeof HAT_SAFE_ZONES];
  if (!zone) return 18;

  const maxWidth = zone.width * 0.8; // Use 80% of safe zone width
  const avgCharWidth = 10; // Approximate pixels per character
  
  const idealFontSize = Math.floor(maxWidth / (text.length * (avgCharWidth / 18)));
  
  // Clamp between reasonable bounds
  return Math.max(12, Math.min(36, idealFontSize));
};

/**
 * Generate design quality score (0-100)
 */
export const calculateDesignScore = (
  objects: any[],
  viewId: string
): { score: number; suggestions: DesignSuggestion[] } => {
  let score = 100;
  const suggestions: DesignSuggestion[] = [];

  objects.forEach(obj => {
    // Check placement
    if (!isWithinSafeZone(obj, viewId)) {
      score -= 15;
      suggestions.push({
        type: 'placement',
        message: 'Thiết kế nằm ngoài vùng an toàn. Có thể bị cắt khi thêu.',
        suggestion: smartPlacement(obj, viewId)
      });
    }

    // Check size
    const objWidth = (obj.width || 0) * (obj.scaleX || 1);
    const objHeight = (obj.height || 0) * (obj.scaleY || 1);
    
    if (objWidth > 250 || objHeight > 150) {
      score -= 10;
      suggestions.push({
        type: 'size',
        message: 'Thiết kế quá lớn. Đề xuất thu nhỏ để phù hợp với mũ.'
      });
    }

    // Color contrast check for text
    if (obj.type === 'i-text' && obj.fill) {
      const contrast = analyzeColorContrast(obj.fill, '#000000'); // Assume dark hat
      if (contrast) {
        score -= 10;
        suggestions.push(contrast);
      }
    }
  });

  // Bonus for multiple well-placed elements
  if (objects.length > 1 && suggestions.length === 0) {
    score = Math.min(100, score + 5);
  }

  return {
    score: Math.max(0, score),
    suggestions
  };
};

/**
 * Auto-generate color palette based on base color
 */
export const generateColorPalette = (baseColor: string): string[] => {
  const palettes: Record<string, string[]> = {
    black: ['#ffffff', '#ff6b6b', '#4ecdc4', '#ffe66d', '#95a5a6'],
    white: ['#000000', '#e74c3c', '#3498db', '#f39c12', '#2ecc71'],
    navy: ['#ffffff', '#f39c12', '#e74c3c', '#ecf0f1', '#95a5a6'],
    gray: ['#000000', '#e74c3c', '#3498db', '#f1c40f', '#ffffff']
  };

  // Simple color matching
  const lower = baseColor.toLowerCase();
  if (lower.includes('black') || lower === '#000000') return palettes.black;
  if (lower.includes('white') || lower === '#ffffff') return palettes.white;
  if (lower.includes('navy') || lower.includes('blue')) return palettes.navy;
  if (lower.includes('gray') || lower.includes('grey')) return palettes.gray;
  
  return palettes.black; // Default
};
