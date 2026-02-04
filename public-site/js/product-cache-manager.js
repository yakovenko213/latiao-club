/**
 * ====================================================
 * PRODUCT CACHE MANAGER - IndexedDB + localStorage
 * ====================================================
 * High-performance caching for instant category switching
 * Production-safe: Minimal logging
 * Date: 04.02.2026
 */

// Development logging helper
const devLog = (...args) => {
  if (window.__consoleMode === 'development' || window.location.search.includes('debug=1')) {
    console.log(...args);
  }
};

class ProductCacheManager {
  constructor() {
    this.dbName = 'latiao_products_cache';
    this.dbVersion = 1;
    this.storeName = 'products';
    this.cacheExpiry = 60 * 60 * 1000; // 1 hour in milliseconds
    this.db = null;
    this.initPromise = this.initDB();
  }

  /**
   * Initialize IndexedDB
   */
  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('❌ IndexedDB failed to open');
        reject(request.error);
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        devLog('✅ IndexedDB initialized');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const objectStore = db.createObjectStore(this.storeName, { keyPath: 'cacheKey' });
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
          devLog('📦 Created IndexedDB object store');
        }
      };
    });
  }

  /**
   * Get cached data for a category (INSTANT)
   */
  async getCached(categorySlug) {
    try {
      await this.initPromise;
      
      const cacheKey = `category_${categorySlug}`;
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readonly');
        const objectStore = transaction.objectStore(this.storeName);
        const request = objectStore.get(cacheKey);

        request.onsuccess = () => {
          const data = request.result;
          
          if (!data) {
            resolve(null);
            return;
          }

          // Check if cache is still valid
          const age = Date.now() - data.timestamp;
          if (age > this.cacheExpiry) {
            devLog('🕐 Cache expired (age:', Math.round(age / 1000), 'seconds)');
            resolve(null);
            return;
          }

          devLog('⚡ Cache HIT (age:', Math.round(age / 1000), 'seconds)');
          resolve(data);
        };

        request.onerror = () => {
          console.warn('⚠️ IndexedDB read error');
          resolve(null);
        };
      });
    } catch (error) {
      console.warn('⚠️ Cache read failed:', error);
      return null;
    }
  }

  /**
   * Save data to cache
   */
  async setCached(categorySlug, categoryData, products) {
    try {
      await this.initPromise;
      
      const cacheKey = `category_${categorySlug}`;
      const data = {
        cacheKey,
        categorySlug,
        categoryData,
        products,
        timestamp: Date.now()
      };

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const objectStore = transaction.objectStore(this.storeName);
        const request = objectStore.put(data);

        request.onsuccess = () => {
          devLog('💾 Cached', products.length, 'products for', categorySlug);
          resolve(true);
        };

        request.onerror = () => {
          console.warn('⚠️ Failed to cache data');
          resolve(false);
        };
      });
    } catch (error) {
      console.warn('⚠️ Cache write failed:', error);
      return false;
    }
  }

  /**
   * Clear old cache entries
   */
  async clearExpired() {
    try {
      await this.initPromise;
      
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);
      const index = objectStore.index('timestamp');
      const cutoffTime = Date.now() - this.cacheExpiry;
      
      const request = index.openCursor();
      let cleared = 0;

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          if (cursor.value.timestamp < cutoffTime) {
            cursor.delete();
            cleared++;
          }
          cursor.continue();
        } else {
          if (cleared > 0) {
            devLog('🗑️ Cleared', cleared, 'expired cache entries');
          }
        }
      };
    } catch (error) {
      console.warn('⚠️ Failed to clear expired cache:', error);
    }
  }

  /**
   * Clear all cache
   */
  async clearAll() {
    try {
      await this.initPromise;
      
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.clear();

      return new Promise((resolve) => {
        request.onsuccess = () => {
          devLog('🗑️ All cache cleared');
          resolve(true);
        };
        request.onerror = () => {
          console.warn('⚠️ Failed to clear cache');
          resolve(false);
        };
      });
    } catch (error) {
      console.warn('⚠️ Cache clear failed:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    try {
      await this.initPromise;
      
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);
      
      return new Promise((resolve) => {
        const countRequest = objectStore.count();
        
        countRequest.onsuccess = () => {
          const count = countRequest.result;
          resolve({
            entries: count,
            expiryMinutes: this.cacheExpiry / 60000
          });
        };
        
        countRequest.onerror = () => resolve({ entries: 0 });
      });
    } catch (error) {
      return { entries: 0 };
    }
  }
}

// Create global instance
window.productCache = new ProductCacheManager();

// Clear expired cache on page load (async, non-blocking)
setTimeout(() => {
  window.productCache.clearExpired();
}, 2000);
