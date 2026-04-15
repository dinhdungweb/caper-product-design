/**
 * Dynamic Bulk Pricing Calculator
 * Calculates embroidery cost based on stitch count, technique, and quantity
 */

export interface PricingConfig {
  basePrice: number;
  techniqueMultipliers: Record<string, number>;
  bulkDiscounts: Array<{ minQty: number; discount: number }>;
  stitchCostPerThousand: number;
}

export interface PricingResult {
  unitPrice: number;
  totalPrice: number;
  stitchCount: number;
  discountApplied: number;
  breakdown: {
    basePrice: number;
    techniqueExtra: number;
    stitchingCost: number;
    discount: number;
  };
}

// Default pricing configuration
const DEFAULT_CONFIG: PricingConfig = {
  basePrice: 589000, // Base hat price in VND
  techniqueMultipliers: {
    'embroidery': 1.0,
    '3d-embroidery': 1.3,
    'patch': 1.5,
    'dtf': 0.8,
    'engraving': 1.2
  },
  bulkDiscounts: [
    { minQty: 10, discount: 0.05 },   // 5% off for 10+ items
    { minQty: 20, discount: 0.10 },   // 10% off for 20+ items
    { minQty: 50, discount: 0.15 },   // 15% off for 50+ items
    { minQty: 100, discount: 0.20 }   // 20% off for 100+ items
  ],
  stitchCostPerThousand: 500 // 500 VND per 1000 stitches
};

/**
 * Estimate stitch count from design objects
 * This is a simplified estimation - in production, you'd use actual stitch generation
 */
export const estimateStitchCount = (objects: any[], technique: string): number => {
  let totalStitches = 0;

  objects.forEach(obj => {
    if (obj.type === 'i-text') {
      // Estimate based on text length and font size
      const textLength = (obj.text || '').length;
      const fontSize = obj.fontSize || 18;
      const stitchesPerChar = Math.floor(fontSize * 1.5); // Rough estimate
      totalStitches += textLength * stitchesPerChar;
    } else if (obj.type === 'image' || obj.type === 'fabric-image') {
      // Estimate based on image area
      const width = (obj.width || 0) * (obj.scaleX || 1);
      const height = (obj.height || 0) * (obj.scaleY || 1);
      const area = width * height;
      
      // Different densities for different techniques
      const densityMap: Record<string, number> = {
        'embroidery': 0.8,
        '3d-embroidery': 1.2,
        'patch': 0.5,
        'dtf': 0.3,
        'engraving': 0.6
      };
      
      totalStitches += Math.floor(area * (densityMap[technique] || 0.5));
    } else if (obj.type === 'circle' || obj.type === 'rect' || obj.type === 'polygon') {
      // Vector shapes - estimate perimeter-based stitching
      let perimeter = 0;
      if (obj.type === 'circle') {
        perimeter = 2 * Math.PI * (obj.radius || 0);
      } else if (obj.type === 'rect') {
        perimeter = 2 * ((obj.width || 0) + (obj.height || 0));
      } else if (obj.type === 'polygon') {
        // Simplified perimeter calculation
        perimeter = (obj.width || 0) * 2 + (obj.height || 0) * 2;
      }
      totalStitches += Math.floor(perimeter * 2); // 2 stitches per pixel of perimeter
    }
  });

  // Minimum stitch count for setup
  return Math.max(500, totalStitches);
};

/**
 * Calculate bulk pricing with discounts
 */
export const calculateBulkPricing = (
  quantity: number,
  objects: any[],
  technique: string,
  config: PricingConfig = DEFAULT_CONFIG
): PricingResult => {
  // Estimate stitch count
  const stitchCount = estimateStitchCount(objects, technique);
  
  // Base price
  const basePrice = config.basePrice;
  
  // Technique multiplier
  const techniqueMultiplier = config.techniqueMultipliers[technique] || 1.0;
  const techniqueExtra = basePrice * (techniqueMultiplier - 1);
  
  // Stitching cost
  const stitchingCost = (stitchCount / 1000) * config.stitchCostPerThousand;
  
  // Unit price before discount
  const unitPriceBeforeDiscount = basePrice + techniqueExtra + stitchingCost;
  
  // Apply bulk discount
  let discountRate = 0;
  for (const tier of config.bulkDiscounts) {
    if (quantity >= tier.minQty) {
      discountRate = tier.discount;
    }
  }
  
  const discountAmount = unitPriceBeforeDiscount * discountRate;
  const unitPrice = unitPriceBeforeDiscount - discountAmount;
  const totalPrice = unitPrice * quantity;
  
  return {
    unitPrice: Math.round(unitPrice),
    totalPrice: Math.round(totalPrice),
    stitchCount,
    discountApplied: discountRate,
    breakdown: {
      basePrice: Math.round(basePrice),
      techniqueExtra: Math.round(techniqueExtra),
      stitchingCost: Math.round(stitchingCost),
      discount: Math.round(discountAmount * quantity)
    }
  };
};

/**
 * Get available bulk discount tiers for display
 */
export const getDiscountTiers = (
  unitPrice: number,
  config: PricingConfig = DEFAULT_CONFIG
): Array<{ qty: number; pricePerUnit: number; savings: number }> => {
  return config.bulkDiscounts.map(tier => {
    const discountedPrice = unitPrice * (1 - tier.discount);
    const savings = (unitPrice - discountedPrice) * tier.minQty;
    
    return {
      qty: tier.minQty,
      pricePerUnit: Math.round(discountedPrice),
      savings: Math.round(savings)
    };
  });
};

/**
 * Generate quote for B2B orders
 */
export interface QuoteItem {
  viewId: string;
  technique: string;
  objects: any[];
  stitchCount: number;
}

export const generateB2BQuote = (
  items: QuoteItem[],
  quantity: number,
  config: PricingConfig = DEFAULT_CONFIG
): {
  subtotal: number;
  totalStitches: number;
  estimatedProductionTime: string;
  breakdown: QuoteItem[];
} => {
  let subtotal = 0;
  let totalStitches = 0;
  const breakdown: QuoteItem[] = [];
  
  items.forEach(item => {
    const stitchCount = estimateStitchCount(item.objects, item.technique);
    totalStitches += stitchCount;
    
    const pricing = calculateBulkPricing(quantity, item.objects, item.technique, config);
    subtotal += pricing.unitPrice;
    
    breakdown.push({
      ...item,
      stitchCount
    });
  });
  
  // Estimate production time (simplified: 1000 stitches = 1 minute, 8 hours/day)
  const totalMinutes = (totalStitches * quantity) / 1000;
  const totalHours = totalMinutes / 60;
  const workingDays = Math.ceil(totalHours / 8);
  
  let estimatedProductionTime = `${workingDays} ngày làm việc`;
  if (workingDays <= 1) {
    estimatedProductionTime = `${Math.ceil(totalHours)} giờ`;
  } else if (workingDays > 20) {
    const weeks = Math.ceil(workingDays / 5);
    estimatedProductionTime = `${weeks} tuần`;
  }
  
  return {
    subtotal: Math.round(subtotal),
    totalStitches,
    estimatedProductionTime,
    breakdown
  };
};
