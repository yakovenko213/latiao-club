/**
 * ====================================================
 * PERFORMANCE MONITOR - Category Switching Speed
 * ====================================================
 * Test and measure category loading performance
 * Usage: Open browser console and run window.testCategorySwitching()
 * Date: 04.02.2026
 */

window.performanceMonitor = {
  /**
   * Measure category switching time
   */
  async measureCategoryLoad(categorySlug) {
    const startTime = performance.now();
    
    // Simulate category page load
    const cached = await window.productCache.getCached(categorySlug);
    const cacheTime = performance.now() - startTime;
    
    console.log(`⚡ Cache lookup: ${cacheTime.toFixed(2)}ms`);
    
    return {
      categorySlug,
      cacheTime,
      cacheHit: !!cached,
      productsCount: cached?.products?.length || 0
    };
  },

  /**
   * Test multiple category switches
   */
  async testCategorySwitching(categories = ['snacks', 'ramen', 'drinks']) {
    console.log('🧪 Testing category switching performance...\n');
    
    const results = [];
    
    for (const slug of categories) {
      const result = await this.measureCategoryLoad(slug);
      results.push(result);
      
      console.log(`📊 Category: ${slug}`);
      console.log(`   Cache Hit: ${result.cacheHit ? '✅ YES' : '❌ NO'}`);
      console.log(`   Load Time: ${result.cacheTime.toFixed(2)}ms`);
      console.log(`   Products: ${result.productsCount}\n`);
    }
    
    const avgTime = results.reduce((sum, r) => sum + r.cacheTime, 0) / results.length;
    const cacheHitRate = results.filter(r => r.cacheHit).length / results.length * 100;
    
    console.log('📈 SUMMARY:');
    console.log(`   Average Load Time: ${avgTime.toFixed(2)}ms`);
    console.log(`   Cache Hit Rate: ${cacheHitRate.toFixed(0)}%`);
    console.log(`   Goal (< 100ms): ${avgTime < 100 ? '✅ PASSED' : '❌ FAILED'}\n`);
    
    return results;
  },

  /**
   * Benchmark image lazy loading
   */
  monitorImageLoading() {
    const images = document.querySelectorAll('img[loading="lazy"]');
    console.log(`🖼️ Monitoring ${images.length} lazy-loaded images...\n`);
    
    let loaded = 0;
    const startTime = performance.now();
    
    images.forEach((img, index) => {
      if (img.complete) {
        loaded++;
      } else {
        img.addEventListener('load', () => {
          loaded++;
          const loadTime = performance.now() - startTime;
          console.log(`  [${index + 1}/${images.length}] Loaded in ${loadTime.toFixed(0)}ms`);
          
          if (loaded === images.length) {
            console.log(`\n✅ All images loaded in ${loadTime.toFixed(0)}ms`);
          }
        });
      }
    });
    
    if (loaded === images.length) {
      console.log('✅ All images already loaded (cached)');
    }
  },

  /**
   * Monitor Firestore query performance
   */
  async benchmarkFirestoreQuery(categorySlug) {
    console.log(`🔥 Benchmarking Firestore query for: ${categorySlug}\n`);
    
    const startTime = performance.now();
    
    try {
      const { collection, query, where, getDocs } = window.firebaseInit;
      const db = window.db;
      
      const queryStart = performance.now();
      const snapshot = await getDocs(
        query(collection(db, 'products'), where('categories', 'array-contains', categorySlug))
      );
      const queryTime = performance.now() - queryStart;
      
      console.log(`📊 Firestore Query Results:`);
      console.log(`   Query Time: ${queryTime.toFixed(2)}ms`);
      console.log(`   Documents: ${snapshot.size}`);
      console.log(`   Bytes Read: ~${(snapshot.size * 2000).toLocaleString()} bytes (estimated)\n`);
      
      return {
        queryTime,
        documentsCount: snapshot.size,
        success: true
      };
    } catch (error) {
      console.error('❌ Firestore query failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Full performance audit
   */
  async fullAudit(categorySlug = 'snacks') {
    console.log('🔍 FULL PERFORMANCE AUDIT\n');
    console.log('━'.repeat(50) + '\n');
    
    // 1. Cache Performance
    console.log('1️⃣ CACHE PERFORMANCE');
    const cacheStats = await window.getCacheStats();
    console.log('');
    
    // 2. Category Load Time
    console.log('2️⃣ CATEGORY LOAD TIME');
    await this.measureCategoryLoad(categorySlug);
    console.log('');
    
    // 3. Firestore Query
    console.log('3️⃣ FIRESTORE QUERY');
    await this.benchmarkFirestoreQuery(categorySlug);
    
    // 4. Image Loading
    console.log('4️⃣ IMAGE LOADING');
    this.monitorImageLoading();
    console.log('');
    
    // 5. Network Analysis
    console.log('5️⃣ NETWORK ANALYSIS');
    if (navigator.connection) {
      const conn = navigator.connection;
      console.log(`   Connection Type: ${conn.effectiveType}`);
      console.log(`   Downlink: ${conn.downlink} Mbps`);
      console.log(`   RTT: ${conn.rtt}ms`);
      console.log(`   Save Data: ${conn.saveData ? 'ON' : 'OFF'}\n`);
    }
    
    console.log('━'.repeat(50));
    console.log('✅ Audit Complete!\n');
  }
};

// Expose shortcuts
window.testPerf = () => window.performanceMonitor.fullAudit();
window.testCache = (slug) => window.performanceMonitor.measureCategoryLoad(slug);
window.testSwitch = () => window.performanceMonitor.testCategorySwitching();

console.log('%c🎯 Performance Monitor Loaded', 'background: #4CAF50; color: white; padding: 5px; font-weight: bold;');
console.log('Commands:');
console.log('  window.testPerf()         - Full performance audit');
console.log('  window.testCache("slug")  - Test cache for category');
console.log('  window.testSwitch()       - Test category switching speed');
