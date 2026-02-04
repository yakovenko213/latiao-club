/**
 * SCROLL REVEAL ANIMATIONS
 * Lightweight Intersection Observer for fade-in effects
 * Respects user's motion preferences
 */

(function() {
  'use strict';

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CHECK FOR REDUCED MOTION PREFERENCE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    console.log('🎬 Scroll animations disabled (user prefers reduced motion)');
    // Add visible class immediately to all animated elements
    document.querySelectorAll('.fade-in-up, .fade-in-left, .fade-in-right, .scale-in').forEach(el => {
      el.classList.add('visible');
    });
    return;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // INTERSECTION OBSERVER CONFIGURATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const observerOptions = {
    root: null, // viewport
    rootMargin: '0px 0px -100px 0px', // Trigger 100px before element enters viewport
    threshold: 0.15 // Trigger when 15% of element is visible
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // OBSERVER CALLBACK
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const observerCallback = (entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Add visible class to trigger animation
        entry.target.classList.add('visible');
        
        // Optional: Stop observing after animation (performance optimization)
        // Uncomment next line if you want one-time animations only
        // observer.unobserve(entry.target);
        
        // Debug logging (remove in production)
        // console.log('✨ Revealed:', entry.target.className);
      }
    });
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CREATE OBSERVER INSTANCE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const observer = new IntersectionObserver(observerCallback, observerOptions);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // OBSERVE ALL ANIMATED ELEMENTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  function observeElements() {
    // Select all elements with animation classes
    const animatedElements = document.querySelectorAll(
      '.fade-in-up, .fade-in-left, .fade-in-right, .scale-in'
    );

    animatedElements.forEach(el => {
      observer.observe(el);
    });

    console.log(`🎬 Observing ${animatedElements.length} elements for scroll animations`);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // INITIALIZE ON DOM READY
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeElements);
  } else {
    // DOM already loaded
    observeElements();
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RE-OBSERVE ON DYNAMIC CONTENT UPDATES
  // (Useful if you dynamically add products via JS)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  window.reObserveAnimations = function() {
    observeElements();
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FALLBACK FOR OLD BROWSERS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (!('IntersectionObserver' in window)) {
    console.warn('⚠️ IntersectionObserver not supported, revealing all elements immediately');
    document.querySelectorAll('.fade-in-up, .fade-in-left, .fade-in-right, .scale-in').forEach(el => {
      el.classList.add('visible');
    });
  }

})();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BONUS: CART ANIMATION HELPER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
window.animateCartUpdate = function() {
  const cartIcon = document.querySelector('.cart-icon, [data-cart-icon]');
  const cartBadge = document.querySelector('.cart-badge, [data-cart-count]');
  
  if (cartIcon) {
    cartIcon.classList.add('cart-update');
    setTimeout(() => cartIcon.classList.remove('cart-update'), 500);
  }
  
  if (cartBadge) {
    cartBadge.classList.add('badge-animate');
    setTimeout(() => cartBadge.classList.remove('badge-animate'), 400);
  }
};
