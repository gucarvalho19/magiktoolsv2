/**
 * Global utility for scroll-to-top functionality
 * Forces page to scroll to top on component mount
 * Prevents auto-scroll issues and ensures consistent UX
 * 
 * IMPLEMENTATION PATTERN FOR ALL TOOLS:
 * 
 * 1. Import the hook: import { useCompleteScrollToTop } from '@/lib/scrollToTop';
 * 2. Call it at the start of your component function: useCompleteScrollToTop();
 * 3. Avoid autoFocus on inputs that might trigger unwanted scrolling
 * 4. For chat interfaces, delay scrollIntoView to prevent conflicts
 * 
 * This ensures all tools start at the top of the page consistently.
 */

import { useEffect } from 'react';

/**
 * Hook that scrolls to top on component mount
 * Uses 'auto' behavior for immediate scroll without animation
 * Executes only once when component mounts
 */
export function useScrollToTop() {
  useEffect(() => {
    // Force scroll to top immediately
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []); // Empty dependencies - execute only on mount
}

/**
 * Manual function to scroll to top
 * Can be called programmatically when needed
 */
export function scrollToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
}

/**
 * Utility to prevent auto-scroll sources
 * Call this to remove common causes of unwanted scrolling
 */
export function preventAutoScroll() {
  // Disable scroll restoration if supported
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  
  // Remove any hash from URL that might cause auto-scroll
  if (window.location.hash) {
    // Use replaceState to avoid triggering history changes
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }
}

/**
 * Complete scroll-to-top setup
 * Combines scroll to top with auto-scroll prevention
 */
export function useCompleteScrollToTop() {
  useEffect(() => {
    // Prevent auto-scroll sources first
    preventAutoScroll();
    
    // Then force scroll to top
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);
}