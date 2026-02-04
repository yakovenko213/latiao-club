/**
 * Mobile Scroll Manager
 * Handles body scroll locking and viewport height management
 */

class MobileScrollManager {
  constructor() {
    this.scrollPosition = 0;
    this.isLocked = false;
    
    // Initialize viewport height management
    this.initViewportHeight();
    
    // Bind methods
    this.lock = this.lock.bind(this);
    this.unlock = this.unlock.bind(this);
    this.updateViewportHeight = this.updateViewportHeight.bind(this);
  }
  
  /**
   * Initialize dynamic viewport height (fixes iOS 100vh issue)
   */
  initViewportHeight() {
    this.updateViewportHeight();
    
    // Update on resize and orientation change
    window.addEventListener('resize', this.updateViewportHeight);
    window.addEventListener('orientationchange', this.updateViewportHeight);
    
    // Update on load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', this.updateViewportHeight);
    }
  }
  
  /**
   * Update CSS custom property for viewport height
   */
  updateViewportHeight() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }
  
  /**
   * Lock body scroll (for modals, overlays, etc.)
   * @param {HTMLElement} scrollableContainer - Optional container that should remain scrollable
   */
  lock(scrollableContainer = null) {
    if (this.isLocked) return;
    
    // Save current scroll position
    this.scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    
    // Apply scroll lock to body
    document.body.classList.add('scroll-locked');
    document.body.style.top = `-${this.scrollPosition}px`;
    
    // If a scrollable container is provided, ensure it can scroll
    if (scrollableContainer) {
      scrollableContainer.classList.add('scroll-container');
    }
    
    this.isLocked = true;
    
    // Dispatch event for other scripts
    window.dispatchEvent(new CustomEvent('scrollLocked', {
      detail: { scrollPosition: this.scrollPosition }
    }));
  }
  
  /**
   * Unlock body scroll
   */
  unlock() {
    if (!this.isLocked) return;
    
    // Remove scroll lock
    document.body.classList.remove('scroll-locked');
    document.body.style.top = '';
    
    // Restore scroll position
    window.scrollTo(0, this.scrollPosition);
    
    // Remove scroll-container class from all elements
    document.querySelectorAll('.scroll-container').forEach(el => {
      el.classList.remove('scroll-container');
    });
    
    this.isLocked = false;
    this.scrollPosition = 0;
    
    // Dispatch event for other scripts
    window.dispatchEvent(new CustomEvent('scrollUnlocked'));
  }
  
  /**
   * Toggle scroll lock
   * @param {HTMLElement} scrollableContainer - Optional container that should remain scrollable
   */
  toggle(scrollableContainer = null) {
    if (this.isLocked) {
      this.unlock();
    } else {
      this.lock(scrollableContainer);
    }
  }
  
  /**
   * Check if scroll is currently locked
   * @returns {boolean}
   */
  isScrollLocked() {
    return this.isLocked;
  }
  
  /**
   * Cleanup (remove event listeners)
   */
  destroy() {
    window.removeEventListener('resize', this.updateViewportHeight);
    window.removeEventListener('orientationchange', this.updateViewportHeight);
    
    // Unlock if locked
    if (this.isLocked) {
      this.unlock();
    }
  }
}

// Create singleton instance
const scrollManager = new MobileScrollManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = scrollManager;
}

// Expose globally
window.MobileScrollManager = MobileScrollManager;
window.scrollManager = scrollManager;

// Export for ES6 modules
export default scrollManager;
