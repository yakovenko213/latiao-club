// ============================================
// GLOBAL PRODUCTS CACHE MANAGER
// ============================================
// Centralized product caching with retry logic and exponential backoff
// Eliminates "Request Bombing" by caching products globally across all pages

import { db } from './firebase-init.js';
import {
    collection,
    getDocs,
    getDocsFromCache,
    query,
    where
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    CACHE_TTL: 5 * 60 * 1000, // 5 minutes cache lifetime
    MAX_RETRIES: 3, // Retry failed requests up to 3 times
    RETRY_DELAYS: [200, 500, 1000], // Exponential backoff: 200ms, 500ms, 1s
    CACHE_PRIORITY: true // Try cache first before network
};

// ============================================
// GLOBAL STATE
// ============================================
const globalProductsState = {
    products: null, // Cached products array
    categories: null, // Cached categories array
    lastFetch: {
        products: 0,
        categories: 0
    },
    fetchPromises: {
        products: null, // Ongoing fetch promise to prevent duplicate requests
        categories: null
    }
};

// Export to window for debugging
window.globalProductsState = globalProductsState;

// ============================================
// EXPONENTIAL BACKOFF RETRY WRAPPER
// ============================================
/**
 * Retry a Firestore operation with exponential backoff
 * @param {Function} operation - Async function to retry
 * @param {string} operationName - Name for logging
 * @returns {Promise<any>} - Result of the operation
 */
async function retryWithBackoff(operation, operationName = 'Firestore operation') {
    let lastError = null;

    for (let attempt = 0; attempt < CONFIG.MAX_RETRIES; attempt++) {
        try {
            console.log(`🔄 [Retry ${attempt + 1}/${CONFIG.MAX_RETRIES}] ${operationName}...`);
            const result = await operation();
            console.log(`✅ [Success] ${operationName} completed on attempt ${attempt + 1}`);
            return result;
        } catch (error) {
            lastError = error;
            console.warn(`⚠️ [Attempt ${attempt + 1}] ${operationName} failed:`, error.message);

            // Don't retry on permission errors
            if (error.code === 'permission-denied' || error.code === 'unauthenticated') {
                console.error(`🚫 [Fatal] ${operationName} - Permission denied, not retrying`);
                throw error;
            }

            // Wait before next retry (exponential backoff)
            if (attempt < CONFIG.MAX_RETRIES - 1) {
                const delay = CONFIG.RETRY_DELAYS[attempt];
                console.log(`⏳ Waiting ${delay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    // All retries failed
    console.error(`❌ [Failed] ${operationName} after ${CONFIG.MAX_RETRIES} attempts:`, lastError);
    throw lastError;
}

// ============================================
// SMART FETCH WITH CACHE FALLBACK
// ============================================
/**
 * Fetch documents with cache-first strategy and retry logic
 * @param {Query} firestoreQuery - Firestore query to execute
 * @param {string} queryName - Name for logging
 * @returns {Promise<QuerySnapshot>} - Firestore snapshot
 */
async function smartFetch(firestoreQuery, queryName = 'Query') {
    // STEP 1: Try cache first (instant load)
    if (CONFIG.CACHE_PRIORITY) {
        try {
            console.log(`💾 [Cache] Trying cache for ${queryName}...`);
            const cacheSnapshot = await getDocsFromCache(firestoreQuery);
            if (!cacheSnapshot.empty) {
                console.log(`✅ [Cache Hit] ${queryName} loaded from cache (${cacheSnapshot.size} docs)`);
                return cacheSnapshot;
            }
            console.log(`⚠️ [Cache Miss] ${queryName} cache empty, fetching from network...`);
        } catch (cacheError) {
            console.warn(`⚠️ [Cache Error] ${queryName}:`, cacheError.message);
        }
    }

    // STEP 2: Fetch from network with retry logic
    console.log(`🌐 [Network] Fetching ${queryName} from Firestore...`);
    return await retryWithBackoff(
        async () => await getDocs(firestoreQuery),
        `Fetch ${queryName}`
    );
}

// ============================================
// GET ALL PRODUCTS (Globally Cached)
// ============================================
/**
 * Fetch all products with global caching and retry logic
 * Prevents duplicate requests - if multiple pages call this simultaneously,
 * only one request is made and all callers receive the same result
 * @param {boolean} forceRefresh - Skip cache and force fresh fetch
 * @returns {Promise<Array>} - Array of product objects
 */
export async function getAllProducts(forceRefresh = false) {
    const now = Date.now();
    const cacheAge = now - globalProductsState.lastFetch.products;
    const isCacheValid = globalProductsState.products && cacheAge < CONFIG.CACHE_TTL;

    // Return cached data if still valid
    if (!forceRefresh && isCacheValid) {
        console.log(`✅ [Global Cache] Products loaded from memory (age: ${Math.round(cacheAge / 1000)}s)`);
        return globalProductsState.products;
    }

    // If a fetch is already in progress, wait for it instead of starting a new one
    if (globalProductsState.fetchPromises.products) {
        console.log(`⏳ [Wait] Products fetch already in progress, waiting...`);
        return await globalProductsState.fetchPromises.products;
    }

    // Start new fetch and cache the promise
    console.log(`🔄 [Fetch] Loading all products from Firestore...`);
    globalProductsState.fetchPromises.products = (async () => {
        try {
            const productsQuery = query(
                collection(db, 'products'),
                where('isVisible', '==', true)
            );

            const snapshot = await smartFetch(productsQuery, 'All Products');

            // Transform to array
            const products = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Update global cache
            globalProductsState.products = products;
            globalProductsState.lastFetch.products = Date.now();

            console.log(`✅ [Cached] ${products.length} products cached globally`);
            return products;

        } catch (error) {
            console.error('❌ [Error] Failed to fetch products:', error);
            // Return empty array on error to prevent app crashes
            return [];
        } finally {
            // Clear the fetch promise
            globalProductsState.fetchPromises.products = null;
        }
    })();

    return await globalProductsState.fetchPromises.products;
}

// ============================================
// GET ALL CATEGORIES (Globally Cached)
// ============================================
/**
 * Fetch all categories with global caching and retry logic
 * @param {boolean} forceRefresh - Skip cache and force fresh fetch
 * @returns {Promise<Array>} - Array of category objects
 */
export async function getAllCategories(forceRefresh = false) {
    const now = Date.now();
    const cacheAge = now - globalProductsState.lastFetch.categories;
    const isCacheValid = globalProductsState.categories && cacheAge < CONFIG.CACHE_TTL;

    // Return cached data if still valid
    if (!forceRefresh && isCacheValid) {
        console.log(`✅ [Global Cache] Categories loaded from memory (age: ${Math.round(cacheAge / 1000)}s)`);
        return globalProductsState.categories;
    }

    // If a fetch is already in progress, wait for it
    if (globalProductsState.fetchPromises.categories) {
        console.log(`⏳ [Wait] Categories fetch already in progress, waiting...`);
        return await globalProductsState.fetchPromises.categories;
    }

    // Start new fetch
    console.log(`🔄 [Fetch] Loading all categories from Firestore...`);
    globalProductsState.fetchPromises.categories = (async () => {
        try {
            const categoriesQuery = query(collection(db, 'categories'));
            const snapshot = await smartFetch(categoriesQuery, 'All Categories');

            // Transform to array
            const categories = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Update global cache
            globalProductsState.categories = categories;
            globalProductsState.lastFetch.categories = Date.now();

            console.log(`✅ [Cached] ${categories.length} categories cached globally`);
            return categories;

        } catch (error) {
            console.error('❌ [Error] Failed to fetch categories:', error);
            return [];
        } finally {
            globalProductsState.fetchPromises.categories = null;
        }
    })();

    return await globalProductsState.fetchPromises.categories;
}

// ============================================
// GET PRODUCTS BY CATEGORY (Filtered from Cache)
// ============================================
/**
 * Get products for a specific category (filters from global cache)
 * This avoids additional Firestore queries for category filtering
 * @param {string} categorySlug - Category slug (e.g., 'spicy-snacks')
 * @returns {Promise<Array>} - Filtered product array
 */
export async function getProductsByCategory(categorySlug) {
    console.log(`🔍 [Filter] Getting products for category: ${categorySlug}`);
    
    // First ensure products are cached
    const allProducts = await getAllProducts();
    
    // Filter by category (supports both old and new format)
    const filtered = allProducts.filter(product => {
        // New format: categories array
        if (product.categories && Array.isArray(product.categories)) {
            return product.categories.includes(categorySlug);
        }
        // Old format: single category field
        if (product.category) {
            return product.category === categorySlug;
        }
        return false;
    });

    console.log(`✅ [Filtered] ${filtered.length} products in category "${categorySlug}"`);
    return filtered;
}

// ============================================
// MANUAL CACHE CONTROL
// ============================================
/**
 * Clear the global cache (useful for debugging or after admin updates)
 */
export function clearCache() {
    console.log('🗑️ [Cache] Clearing global products cache...');
    globalProductsState.products = null;
    globalProductsState.categories = null;
    globalProductsState.lastFetch = { products: 0, categories: 0 };
    console.log('✅ [Cache] Global cache cleared');
}

/**
 * Preload products and categories in the background
 * Call this on app initialization for instant subsequent loads
 */
export async function preloadCache() {
    console.log('🚀 [Preload] Preloading products and categories...');
    try {
        await Promise.all([
            getAllProducts(),
            getAllCategories()
        ]);
        console.log('✅ [Preload] Cache preloaded successfully');
    } catch (error) {
        console.error('❌ [Preload] Failed to preload cache:', error);
    }
}

// Export to window for manual control
window.productsCache = {
    getAllProducts,
    getAllCategories,
    getProductsByCategory,
    clearCache,
    preloadCache,
    state: globalProductsState
};

console.log('✅ Products Cache Manager loaded');
console.log('💡 Use window.productsCache.clearCache() to reset cache');
console.log('💡 Use window.productsCache.preloadCache() to preload data');
