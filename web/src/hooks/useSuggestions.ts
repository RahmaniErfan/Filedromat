import { useState, useEffect, useRef } from 'react';
import { fetchSuggestions } from '../lib/api';

export function useSuggestions(path: string) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const timeoutRef = useRef<any>(null);

  const fetch = async (currentPath: string) => {
    try {
      setIsLoading(true);
      const results = await fetchSuggestions(currentPath);
      console.log(`[useSuggestions] Found ${results.length} results for:`, currentPath || 'root');
      setSuggestions(results);
    } catch (error) {
      console.error('[useSuggestions] Failed to fetch:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // No debounce for empty path to make focus immediate
    if (!path) {
      fetch('');
      return;
    }

    console.log('[useSuggestions] Path changed:', path);
    timeoutRef.current = setTimeout(() => fetch(path), 150);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [path, refreshCount]);

  return { 
    suggestions, 
    isLoading, 
    refresh: () => setRefreshCount(c => c + 1) 
  };
}
