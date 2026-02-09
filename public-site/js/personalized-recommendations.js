/**
 * ============================================
 * 🎯 LATIAO SNACK - Simple Same-Category Recommendations
 * ============================================
 * 
 * Simplified recommendation system that shows products from the same category
 * with bulletproof stock filtering and randomization.
 * 
 * Usage:
 *   import { getPersonalizedRecommendations } from './personalized-recommendations.js';
 */

// ============================================
// CONSTANTS
// ============================================
const MAX_RECOMMENDATIONS = 5;
const DEFAULT_CATEGORY = 'latiao';

// ============================================
// CORE RECOMMENDATION FUNCTION
// ============================================

/**
 * Shuffle array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array (new array)
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Check if product is available (in stock and active)
 * @param {Object} product - Product object
 * @returns {boolean} True if available
 */
function isProductAvailable(product) {
  if (!product) return false;
  
  // Stock check: must be > 0 (handle both string and number)
  const stock = Number(product.stock) || 0;
  if (stock <= 0) return false;
  
  // Active check: must be true
  if (product.isActive !== true) return false;
  
  return true;
}

/**
 * Get current product's category
 * @param {Object} currentProduct - Current product object
 * @returns {string} Category name
 */
function getCurrentProductCategory(currentProduct) {
  if (!currentProduct) return DEFAULT_CATEGORY;
  
  // Handle both categories array and single category field
  if (Array.isArray(currentProduct.categories) && currentProduct.categories.length > 0) {
    return currentProduct.categories[0];
  }
  
  return currentProduct.category || DEFAULT_CATEGORY;
}

/**
 * Get personalized product recommendations (simplified)
 * @param {string} currentProductId - Current product ID to exclude
 * @param {Object} currentProduct - Current product data
 * @param {Function} fetchProducts - Function to fetch products from Firestore
 * @returns {Promise<Array>} Array of recommended products
 */
export async function getPersonalizedRecommendations(currentProductId, currentProduct = null, fetchProducts) {
  console.log('🎯 Generating same-category recommendations...');
  
  try {
    // Fetch all products
    let allProducts = [];
    if (typeof fetchProducts === 'function') {
      allProducts = await fetchProducts();
    }
    
    if (allProducts.length === 0) {
      console.warn('⚠️ No products available for recommendations');
      return [];
    }
    
    // Get current product's category
    const currentCategory = getCurrentProductCategory(currentProduct);
    console.log('📂 Current category:', currentCategory);
    
    // Filter: same category + available + exclude current
    const sameCategoryProducts = allProducts.filter(product => {
      // Exclude current product
      if (product.id === currentProductId) return false;
      
      // Must be available
      if (!isProductAvailable(product)) return false;
      
      // Must be in same category
      const productCategories = Array.isArray(product.categories) 
        ? product.categories 
        : [product.category || DEFAULT_CATEGORY];
      
      return productCategories.includes(currentCategory);
    });
    
    console.log(`📦 Found ${sameCategoryProducts.length} available products in category "${currentCategory}"`);
    
    let recommendations = [];
    
    // Take up to 5 products from same category (randomized)
    if (sameCategoryProducts.length > 0) {
      const shuffled = shuffleArray(sameCategoryProducts);
      const fromSameCategory = Math.min(MAX_RECOMMENDATIONS, shuffled.length);
      recommendations.push(...shuffled.slice(0, fromSameCategory));
    }
    
    // Fallback: fill remaining slots with products from other categories
    if (recommendations.length < MAX_RECOMMENDATIONS) {
      const remainingSlots = MAX_RECOMMENDATIONS - recommendations.length;
      console.log(`🔄 Need ${remainingSlots} more products, searching other categories...`);
      
      // Get available products from other categories
      const otherCategoryProducts = allProducts.filter(product => {
        // Exclude current product
        if (product.id === currentProductId) return false;
        
        // Exclude already selected products
        if (recommendations.find(r => r.id === product.id)) return false;
        
        // Must be available
        if (!isProductAvailable(product)) return false;
        
        // Must be from different category
        const productCategories = Array.isArray(product.categories) 
          ? product.categories 
          : [product.category || DEFAULT_CATEGORY];
        
        return !productCategories.includes(currentCategory);
      });
      
      // Add random products from other categories
      if (otherCategoryProducts.length > 0) {
        const shuffledOthers = shuffleArray(otherCategoryProducts);
        const fromOtherCategories = Math.min(remainingSlots, shuffledOthers.length);
        recommendations.push(...shuffledOthers.slice(0, fromOtherCategories));
        
        console.log(`📦 Added ${fromOtherCategories} products from other categories`);
      }
    }
    
    // Ensure exactly 5 products (or fewer if not enough available)
    recommendations = recommendations.slice(0, MAX_RECOMMENDATIONS);
    
    console.log(`✅ Final recommendations (${recommendations.length}/${MAX_RECOMMENDATIONS}):`, 
      recommendations.map(p => ({
        id: p.id,
        name: p.name, // Use p.name as requested
        category: p.category || p.categories?.[0],
        stock: Number(p.stock) || 0,
        price: p.price
      }))
    );
    
    return recommendations;
    
  } catch (error) {
    console.error('❌ Error generating recommendations:', error);
    return [];
  }
}

// ============================================
// UTILITY FUNCTIONS (Keep for compatibility)
// ============================================

/**
 * Minimal tracking function for compatibility
 * @param {string} productId - Product ID
 * @param {string|string[]} category - Product category
 * @param {number} price - Product price
 */
export function trackProductView(productId, category, price) {
  console.log('👁️ Product view tracked:', { productId, category, price });
}

/**
 * Minimal cart tracking for compatibility
 * @param {string} productId - Product ID
 * @param {number} price - Product price
 * @param {string} category - Product category
 */
export function trackCartAdd(productId, price, category) {
  console.log('🛒 Cart add tracked:', { productId, price, category });
}

/**
 * Get user type for UI (simplified)
 * @returns {Object} User type info
 */
export function getUserType() {
  return { type: 'new', label: 'Спеціально для вас' };
}

// ============================================
// GLOBAL WINDOW EXPOSURE
// ============================================

// Expose functions for debugging and compatibility
window.LatiaoRecommendations = {
  getPersonalizedRecommendations,
  trackProductView,
  trackCartAdd,
  getUserType,
  testRecommendations: async (currentProductId, currentProduct, fetchFn) => {
    return await getPersonalizedRecommendations(currentProductId, currentProduct, fetchFn);
  }
};

console.log('🎯 Simple Recommendations module loaded');