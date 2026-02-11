/**
 * ============================================
 * CHILI PEPPER HUNT - Pepper Placement Script
 * ============================================
 * 
 * Automatically places peppers in the correct locations
 * across different pages.
 * 
 * PEPPER LOCATIONS:
 * 1. Homepage FAQ: "Чи можна латяо дітям?" answer
 * 2. Delivery Page: Shipping information section
 * 3. About Page: Brand story
 * 4. Product Page A (Random): Description tab
 * 5. Product Page B (Random): Ingredients tab
 * 6. Product Page C (Random): Reviews section
 * 7. Checkout Page: Order summary
 * 8. Dashboard: User stats
 * 
 * @module PepperPlacer
 */

class PepperPlacer {
  constructor() {
    this.placementAttempts = 0;
    this.maxAttempts = 10;
  }

  /**
   * Initialize pepper placement based on current page
   */
  async initializePage() {
    console.log('🚀 [PLACER] Starting pepper placement initialization...');
    
    // Determine page type
    const path = window.location.pathname;
    console.log('📍 [PLACER] Current path:', path);
    
    const currentPage = this.detectPageType(path);
    console.log(`🎯 [PLACER] Detected page type: ${currentPage}`);

    // Wait for game initialization
    if (!window.pepperHuntGame || !window.pepperRenderer) {
      console.error('❌ [PLACER] Game or Renderer not initialized!', {
        game: !!window.pepperHuntGame,
        renderer: !!window.pepperRenderer
      });
      return;
    }

    console.log('✅ [PLACER] Game and Renderer are ready');
    
    // Check if game is enabled
    if (!window.pepperHuntGame.isEnabled) {
      console.warn('⚠️ [PLACER] Game is disabled, skipping pepper placement');
      return;
    }

    console.log('✅ [PLACER] Game is enabled, placing peppers...');

    // Place peppers based on page type
    switch (currentPage) {
      case 'homepage':
        console.log('🏠 [PLACER] Placing homepage peppers...');
        this.placeHomepagePeppers();
        break;
      case 'product':
        console.log('📦 [PLACER] Placing product page peppers...');
        this.placeProductPeppers();
        break;
      case 'checkout':
        console.log('🛒 [PLACER] Placing checkout peppers...');
        this.placeCheckoutPeppers();
        break;
      case 'dashboard':
        console.log('📊 [PLACER] Placing dashboard peppers...');
        this.placeDashboardPeppers();
        break;
      case 'delivery':
        console.log('🚚 [PLACER] Placing delivery page peppers...');
        this.placeDeliveryPeppers();
        break;
      case 'about':
        console.log('ℹ️ [PLACER] Placing about page peppers...');
        this.placeAboutPeppers();
        break;
      default:
        console.log('⚠️ [PLACER] No peppers configured for this page type:', currentPage);
    }
  }

  /**
   * Detect page type from path or content
   */
  detectPageType(path) {
    if (path === '/' || path.includes('index.html')) return 'homepage';
    if (path.includes('product.html')) return 'product';
    if (path.includes('checkout.html')) return 'checkout';
    if (path.includes('dashboard.html')) return 'dashboard';
    
    // Check for page.html with specific slug
    if (path.includes('page.html')) {
      const params = new URLSearchParams(window.location.search);
      const slug = params.get('slug');
      
      if (slug === 'delivery-and-payment' || slug === 'dostavka-ta-oplata') return 'delivery';
      if (slug === 'about-us' || slug === 'pro-nas') return 'about';
    }
    
    // Check for specific pages by content
    if (document.querySelector('[data-page="delivery"]')) return 'delivery';
    if (document.querySelector('[data-page="about"]')) return 'about';
    
    // Check URL params (fallback)
    const params = new URLSearchParams(window.location.search);
    if (params.get('page') === 'delivery') return 'delivery';
    if (params.get('page') === 'about') return 'about';
    
    return 'unknown';
  }

  /**
   * Place pepper #1 on homepage (FAQ section)
   */
  placeHomepagePeppers() {
    console.log('🏠 [PLACE #1] Attempting to place homepage pepper in FAQ...');
    
    // Wait for FAQ section to load
    this.waitForElement('.accordion-content', 
      () => {
        console.log('✅ [PLACE #1] FAQ section found, searching for target answer...');
        
        // Find the FAQ answer about "Чи можна латяо дітям?"
        const faqAnswers = document.querySelectorAll('.accordion-content p');
        console.log(`🔍 [PLACE #1] Found ${faqAnswers.length} FAQ answer paragraphs`);
        
        for (const answer of faqAnswers) {
          if (answer.textContent.includes('Так! Підходить з 6 років')) {
            console.log('✅ [PLACE #1] Target FAQ answer found!');
            
            // Check if pepper should be shown
            const shouldShow = window.pepperHuntGame.shouldShowPepper(1, {});
            if (!shouldShow) {
              console.log('⚠️ [PLACE #1] Pepper #1 should not be shown (already found)');
              return;
            }
            
            // Insert pepper inside the answer text
            const space = document.createTextNode(' ');
            answer.appendChild(space);
            const pepper = window.pepperRenderer.createPepper(1, false);
            answer.appendChild(pepper);
            console.log('🎉 [PLACE #1] Pepper #1 successfully placed in FAQ!');
            break;
          }
        }
      },
      () => {
        console.warn('⚠️ [PLACE #1] FAQ section not found after timeout');
      }
    );
  }

  /**
   * Place pepper #2 on delivery page
   */
  placeDeliveryPeppers() {
    this.waitForElement('.delivery-content, .shipping-info, main', () => {
      // Look for delivery information section
      const deliverySection = document.querySelector('.delivery-content') || 
                             document.querySelector('.shipping-info') ||
                             document.querySelector('main');
      
      if (deliverySection) {
        // Find a paragraph in the middle of content
        const paragraphs = deliverySection.querySelectorAll('p');
        if (paragraphs.length > 0) {
          const middleIndex = Math.floor(paragraphs.length / 2);
          const targetP = paragraphs[middleIndex];
          
          const space = document.createTextNode(' ');
          targetP.appendChild(space);
          const pepper = window.pepperRenderer.createPepper(2, false);
          targetP.appendChild(pepper);
          console.log('🌶️ Pepper #2 placed on delivery page');
        }
      }
    });
  }

  /**
   * Place pepper #3 on about page
   */
  placeAboutPeppers() {
    this.waitForElement('.about-content, .brand-story, main', () => {
      // Look for about/brand story section
      const aboutSection = document.querySelector('.about-content') || 
                          document.querySelector('.brand-story') ||
                          document.querySelector('main');
      
      if (aboutSection) {
        const paragraphs = aboutSection.querySelectorAll('p');
        if (paragraphs.length > 0) {
          // Place in first substantial paragraph
          const targetP = paragraphs[0];
          
          const space = document.createTextNode(' ');
          targetP.appendChild(space);
          const pepper = window.pepperRenderer.createPepper(3, false);
          targetP.appendChild(pepper);
          console.log('🌶️ Pepper #3 placed on about page');
        }
      }
    });
  }

  /**
   * Place peppers #4, #5, #6 on product pages (dynamic)
   */
  placeProductPeppers() {
    const productId = this.getCurrentProductId();
    if (!productId) return;

    const randomProducts = window.pepperHuntGame.randomProductIds;
    
    // Check which pepper this product should have
    const pepperIndex = randomProducts.indexOf(productId);
    if (pepperIndex === -1) {
      console.log('No pepper for this product');
      return;
    }

    const pepperId = 4 + pepperIndex; // 4, 5, or 6
    
    // Place based on pepper ID
    switch (pepperId) {
      case 4:
        // Place in description/опис accordion
        this.waitForElement('.product-description, [data-tab="description"]', () => {
          const descSection = document.querySelector('.product-description') ||
                             document.querySelector('[data-tab="description"]');
          if (descSection) {
            const p = descSection.querySelector('p');
            if (p) {
              const space = document.createTextNode(' ');
              p.appendChild(space);
              const pepper = window.pepperRenderer.createPepper(4, false);
              p.appendChild(pepper);
              console.log('🌶️ Pepper #4 placed in product description');
            }
          }
        });
        break;
        
      case 5:
        // Place in ingredients/склад accordion
        this.waitForElement('.product-ingredients, [data-tab="ingredients"]', () => {
          const ingrSection = document.querySelector('.product-ingredients') ||
                             document.querySelector('[data-tab="ingredients"]');
          if (ingrSection) {
            const p = ingrSection.querySelector('p, li');
            if (p) {
              const space = document.createTextNode(' ');
              p.appendChild(space);
              const pepper = window.pepperRenderer.createPepper(5, true); // Golden!
              p.appendChild(pepper);
              console.log('🌶️ Pepper #5 (GOLDEN) placed in ingredients');
            }
          }
        });
        break;
        
      case 6:
        // Place in reviews section
        this.waitForElement('.product-reviews, .reviews-container', () => {
          const reviewsSection = document.querySelector('.product-reviews') ||
                                document.querySelector('.reviews-container');
          if (reviewsSection) {
            // Insert before first review or at top
            const firstReview = reviewsSection.querySelector('.review-item, .review');
            if (firstReview) {
              const pepperContainer = document.createElement('div');
              pepperContainer.style.cssText = 'text-align: center; padding: 10px;';
              const pepper = window.pepperRenderer.createPepper(6, false);
              pepperContainer.appendChild(pepper);
              firstReview.parentNode.insertBefore(pepperContainer, firstReview);
              console.log('🌶️ Pepper #6 placed in reviews section');
            }
          }
        });
        break;
    }
  }

  /**
   * Place pepper #7 on checkout page
   */
  placeCheckoutPeppers() {
    this.waitForElement('.order-summary, .checkout-summary, #order-total', () => {
      // Find order summary section
      const summarySection = document.querySelector('.order-summary') ||
                            document.querySelector('.checkout-summary') ||
                            document.querySelector('#order-total')?.closest('div');
      
      if (summarySection) {
        // Create a stylish container for the pepper
        const pepperContainer = document.createElement('div');
        pepperContainer.style.cssText = 'text-align: center; padding: 15px; margin: 10px 0;';
        pepperContainer.innerHTML = '<p style="font-size: 14px; margin-bottom: 5px; color: #666;">Майже готово! 🔥</p>';
        
        const pepper = window.pepperRenderer.createPepper(7, false);
        pepperContainer.appendChild(pepper);
        
        summarySection.appendChild(pepperContainer);
        console.log('🌶️ Pepper #7 placed on checkout page');
      }
    });
  }

  /**
   * Place pepper #8 on dashboard/stats page
   */
  placeDashboardPeppers() {
    this.waitForElement('.user-dashboard, .stats-container, main', () => {
      // Find dashboard stats area
      const dashboardSection = document.querySelector('.user-dashboard') ||
                              document.querySelector('.stats-container') ||
                              document.querySelector('main');
      
      if (dashboardSection) {
        // Find stats cards or create container
        const statsCards = dashboardSection.querySelector('.stats-grid, .dashboard-stats');
        if (statsCards) {
          const pepperContainer = document.createElement('div');
          pepperContainer.style.cssText = 'grid-column: span all; text-align: center; padding: 20px;';
          
          const pepper = window.pepperRenderer.createPepper(8, true); // Golden!
          pepperContainer.appendChild(pepper);
          
          statsCards.appendChild(pepperContainer);
          console.log('🌶️ Pepper #8 (GOLDEN) placed on dashboard');
        }
      }
    });
  }

  /**
   * Get current product ID from URL
   */
  getCurrentProductId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') || params.get('productId');
  }

  /**
   * Wait for element to appear in DOM
   */
  waitForElement(selector, callback, errorCallback = null, timeout = 5000) {
    console.log(`⏳ [WAIT] Waiting for element: ${selector}`);
    const startTime = Date.now();
    
    const checkExist = setInterval(() => {
      const element = document.querySelector(selector);
      if (element) {
        clearInterval(checkExist);
        console.log(`✅ [WAIT] Element found: ${selector}`);
        callback();
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkExist);
        console.warn(`⏱️ [WAIT] Timeout waiting for: ${selector}`);
        if (errorCallback) {
          errorCallback();
        }
      }
    }, 100);
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    const placer = new PepperPlacer();
    await placer.initializePage();
  });
} else {
  const placer = new PepperPlacer();
  placer.initializePage();
}

window.pepperPlacer = new PepperPlacer();

export default PepperPlacer;
