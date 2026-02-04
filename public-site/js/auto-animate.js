/**
 * AUTO-ADD ANIMATION CLASSES TO PRODUCT CARDS
 * Automatically adds scroll reveal classes to dynamically rendered products
 */

(function() {
  'use strict';

  // Wait for products to be rendered
  const addAnimationClasses = () => {
    // Find all product cards (adjust selector based on your HTML structure)
    const productCards = document.querySelectorAll(
      '[data-product-card], .product-card, [class*="bg-white rounded-2xl shadow"]'
    );

    // Find all section headers
    const headers = document.querySelectorAll('h2, h3.text-2xl, h3.text-3xl');

    // Find all category sections
    const sections = document.querySelectorAll('[data-category], section');

    // Add fade-in-up to product cards
    productCards.forEach((card, index) => {
      if (!card.classList.contains('fade-in-up')) {
        card.classList.add('fade-in-up');
      }
    });

    // Add fade-in-up to headers
    headers.forEach(header => {
      if (!header.classList.contains('fade-in-up')) {
        header.classList.add('fade-in-up');
      }
    });

    console.log(`✨ Added animation classes to ${productCards.length} products and ${headers.length} headers`);

    // Re-trigger observer if it exists
    if (window.reObserveAnimations) {
      window.reObserveAnimations();
    }
  };

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(addAnimationClasses, 100);
    });
  } else {
    setTimeout(addAnimationClasses, 100);
  }

  // Also run after products are dynamically loaded
  // Listen for custom event from your product rendering code
  document.addEventListener('productsRendered', addAnimationClasses);

  // Expose globally for manual triggering
  window.addAnimationClasses = addAnimationClasses;

})();
