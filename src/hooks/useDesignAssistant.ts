import { useState, useEffect, useCallback } from 'react';
import { calculateDesignScore, DesignSuggestion } from '../utils/designAssistant';

/**
 * Hook to manage AI design assistant features
 * Provides real-time feedback and suggestions
 */
export const useDesignAssistant = (
  objects: any[],
  viewId: string,
  enabled: boolean = true
) => {
  const [score, setScore] = useState<number>(100);
  const [suggestions, setSuggestions] = useState<DesignSuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Analyze design when objects change
  useEffect(() => {
    if (!enabled || !objects.length) {
      setScore(100);
      setSuggestions([]);
      return;
    }

    setIsAnalyzing(true);
    
    // Debounce analysis slightly for performance
    const timer = setTimeout(() => {
      const result = calculateDesignScore(objects, viewId);
      setScore(result.score);
      setSuggestions(result.suggestions);
      setIsAnalyzing(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [objects, viewId, enabled]);

  // Get score color based on value
  const getScoreColor = useCallback((s: number): string => {
    if (s >= 90) return '#2ecc71'; // Green - Excellent
    if (s >= 70) return '#f39c12'; // Orange - Good
    if (s >= 50) return '#e67e22'; // Dark Orange - Fair
    return '#e74c3c'; // Red - Needs Improvement
  }, []);

  // Get score label
  const getScoreLabel = useCallback((s: number): string => {
    if (s >= 90) return 'Tuyệt vời';
    if (s >= 70) return 'Tốt';
    if (s >= 50) return 'Khá';
    return 'Cần cải thiện';
  }, []);

  return {
    score,
    suggestions,
    isAnalyzing,
    scoreColor: getScoreColor(score),
    scoreLabel: getScoreLabel(score),
    hasIssues: suggestions.length > 0
  };
};

/**
 * Hook for bulk pricing calculations
 */
import { calculateBulkPricing, PricingResult, estimateStitchCount } from '../utils/pricingCalculator';

export const useBulkPricing = (
  objects: any[],
  technique: string,
  quantity: number = 1
) => {
  const [pricing, setPricing] = useState<PricingResult | null>(null);

  useEffect(() => {
    if (!technique || !objects.length) {
      setPricing(null);
      return;
    }

    const result = calculateBulkPricing(quantity, objects, technique);
    setPricing(result);
  }, [objects, technique, quantity]);

  return pricing;
};

/**
 * Hook for auto-save functionality with cloud sync
 */
export const useAutoSave = (
  data: any,
  saveKey: string,
  onSave?: (data: any) => Promise<void>,
  delay: number = 5000
) => {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (!data) return;

    setHasUnsavedChanges(true);

    const timer = setTimeout(async () => {
      setIsSaving(true);
      try {
        // Save to localStorage first (always available)
        localStorage.setItem(saveKey, JSON.stringify({
          data,
          timestamp: Date.now()
        }));

        // Then sync to cloud if callback provided
        if (onSave) {
          await onSave(data);
        }

        setLastSaved(new Date());
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        setIsSaving(false);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [data, saveKey, onSave, delay]);

  // Load saved data on mount
  const loadSavedData = useCallback(() => {
    try {
      const saved = localStorage.getItem(saveKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.data;
      }
    } catch (error) {
      console.error('Failed to load saved data:', error);
    }
    return null;
  }, [saveKey]);

  // Clear saved data
  const clearSavedData = useCallback(() => {
    localStorage.removeItem(saveKey);
    setLastSaved(null);
    setHasUnsavedChanges(false);
  }, [saveKey]);

  return {
    lastSaved,
    isSaving,
    hasUnsavedChanges,
    loadSavedData,
    clearSavedData
  };
};
