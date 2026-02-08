// ============================================
// LATIAO SNACK - Visitor Device Tracking
// Lightweight script to track ALL visitors
// Logs ONCE per session using sessionStorage
// USES WINDOW.FIREBASEINIT - NO IMPORTS
// ============================================

/**
 * Detect device type from User-Agent
 * @returns {string} 'mobile' | 'tablet' | 'desktop'
 */
function detectDeviceType() {
  const ua = navigator.userAgent.toLowerCase();
  
  // Tablets (must check before mobile)
  if (/(ipad|tablet|playbook|silk)|(android(?!.*mobile))/i.test(ua)) {
    return 'tablet';
  }
  
  // Mobile devices
  if (/mobile|iphone|ipod|android|blackberry|opera mini|windows phone|palm|smartphone|iemobile|fennec/i.test(ua)) {
    return 'mobile';
  }
  
  // Desktop (default)
  return 'desktop';
}

/**
 * Fetch location data from IP Geolocation API
 * Uses ip-api.com (more stable for Ukraine)
 * @returns {Promise<Object>} Location data with city, regionName
 */
async function fetchLocationData() {
  let geoData = { city: 'Київ (Default)', regionName: 'Київська обл.' };
  
  try {
    const response = await fetch('http://ip-api.com/json/?fields=status,regionName,city', {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    const data = await response.json();
    
    if (data.status === 'success') {
      geoData = { 
        city: data.city || 'Київ (Default)', 
        regionName: data.regionName || 'Київська обл.' 
      };
      console.log('✅ Geo-IP success:', geoData);
    } else {
      console.warn('⚠️ Geo-IP status not success, using defaults');
    }
  } catch (err) {
    console.warn('⚠️ Geo API blocked or failed, using defaults:', err);
  }
  
  return geoData;
}

/**
 * Track visitor to Firestore - ONCE per session
 * Writes to 'analytics_sessions' collection (existing collection)
 * Uses sessionStorage to prevent duplicate logs
 * Now includes IP-based geolocation data
 */
async function trackDevice() {
  try {
    // ✅ Check if device already tracked this session
    if (sessionStorage.getItem('deviceTracked')) {
      console.log('📊 Device already tracked this session');
      return;
    }
    
    // Wait for Firebase initialization (max 3 seconds)
    let attempts = 0;
    while (!window.firebaseInit && attempts < 30) {
      await new Promise(r => setTimeout(r, 100));
      attempts++;
    }
    
    if (!window.firebaseInit) {
      console.warn('📊 Device tracking: Firebase not ready');
      return;
    }
    
    const { db, collection, addDoc, serverTimestamp } = window.firebaseInit;
    
    // 🔍 DEBUG: Check database object
    console.log('🔍 Database object:', db);
    console.log('🔍 Database type:', typeof db);
    console.log('🔍 Database app:', db?.app?.name);
    
    if (!db || !collection || !addDoc || !serverTimestamp) {
      console.warn('📊 Device tracking: Missing Firestore functions');
      return;
    }
    
    // Detect device type
    const deviceType = detectDeviceType();
    
    // Fetch location data
    console.log('🌍 Fetching geolocation data...');
    const locationData = await fetchLocationData();
    
    // Extract page path and type for content analytics
    const currentPath = window.location.pathname;
    let pageType = 'other';
    let contentId = null;
    let contentTitle = null;
    
    // Detect category pages
    if (currentPath.includes('/category/')) {
      pageType = 'category';
      const match = currentPath.match(/\/category\/([^\/\?#]+)/);
      if (match) {
        contentId = match[1];
        // Try to get category title from page
        const titleEl = document.querySelector('h1, .category-title, [data-category-title]');
        contentTitle = titleEl?.textContent?.trim() || contentId;
      }
    }
    // Detect info pages
    else if (currentPath.includes('/pages/')) {
      pageType = 'page';
      const match = currentPath.match(/\/pages\/([^\/\?#]+)/);
      if (match) {
        contentId = match[1];
        // Try to get page title
        const titleEl = document.querySelector('h1, .page-title, [data-page-title]');
        contentTitle = titleEl?.textContent?.trim() || document.title || contentId;
      }
    }
    // Homepage
    else if (currentPath === '/' || currentPath === '/index.html') {
      pageType = 'home';
      contentTitle = 'Головна сторінка';
    }
    
    console.log('📄 Page tracking:', { pageType, contentId, contentTitle });
    
    // FORCE write to analytics_sessions with EXACT field names
    const deviceData = {
      city: locationData.city,
      region: locationData.regionName,
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent,
      deviceType: deviceType,
      page: window.location.href,
      pagePath: currentPath,
      pageType: pageType,
      contentId: contentId,
      contentTitle: contentTitle,
      referrer: document.referrer || 'direct'
    };
    
    // 🔍 DEBUG: Log data before attempting to write
    console.log('🔍 Attempting to log visit to collection: "analytics_sessions"');
    console.log('🔍 Device data to be sent:', {
      ...deviceData,
      timestamp: '[serverTimestamp()]' // Can't log function directly
    });
    console.log('🔍 Firebase functions available:', {
      db: !!db,
      collection: !!collection,
      addDoc: !!addDoc,
      serverTimestamp: !!serverTimestamp
    });
    
    // FORCE write to analytics_sessions
    console.log('🔍 Writing to analytics_sessions...');
    try {
      await addDoc(collection(db, 'analytics_sessions'), deviceData);
      sessionStorage.setItem('deviceTracked', 'true');
      console.log('✅ Live visit recorded:', locationData.city);
    } catch (e) {
      console.error('❌ Firestore write failed:', e);
      // Still mark as tracked to prevent spam
      sessionStorage.setItem('deviceTracked', 'true');
    }
    
  } catch (error) {
    console.error('❌ Error tracking device:', error);
    sessionStorage.setItem('deviceTracked', 'true');
  }
}

// ============================================
// AUTO-EXECUTE: Track device when page fully loads
// ============================================
window.addEventListener('load', () => {
  // Small delay to ensure Firebase is fully ready
  setTimeout(trackDevice, 500);
});

// Export function for manual calls if needed
window.trackDevice = trackDevice;

// ============================================
// VIEW COUNTER SYSTEM
// High-performance view tracking using Firebase increment
// Stores counters directly in category/page documents
// ============================================

/**
 * Increment view count for a category or page
 * Auto-creates viewCount field if it doesn't exist using setDoc with merge
 * Uses sessionStorage to prevent duplicate counts from same session
 * @param {string} collectionName - 'categories' or 'pages'
 * @param {string} docId - Document ID (slug)
 */
async function incrementViewCount(collectionName, docId) {
  if (!collectionName || !docId) {
    console.warn('⚠️ incrementViewCount: missing params', { collectionName, docId });
    return;
  }

  // Check if already counted in this session
  const sessionKey = `viewCounted_${collectionName}_${docId}`;
  if (sessionStorage.getItem(sessionKey)) {
    console.log(`✅ View already counted in this session: ${collectionName}/${docId}`);
    return;
  }

  try {
    // Wait for Firebase to be ready
    let attempts = 0;
    while (!window.firebaseInit && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (!window.firebaseInit) {
      console.warn('⚠️ Firebase not available for view counting');
      return;
    }

    const { db, doc, setDoc, increment } = window.firebaseInit;

    if (!db || !doc || !setDoc || !increment) {
      console.warn('⚠️ Firebase functions not available:', { 
        db: !!db, 
        doc: !!doc, 
        setDoc: !!setDoc,
        increment: !!increment 
      });
      return;
    }

    const docRef = doc(db, collectionName, docId);
    
    console.log(`📊 Incrementing view count for: ${collectionName}/${docId}`);
    
    // Use setDoc with merge:true - this is atomic and handles missing fields perfectly
    // If field doesn't exist, increment treats it as 0 and adds 1
    // If field exists, it increments the value
    await setDoc(docRef, {
      viewCount: increment(1),
      lastViewed: new Date()
    }, { merge: true });
    
    console.log(`✅ View count incremented: ${collectionName}/${docId}`);
    
    // Mark as counted in session
    sessionStorage.setItem(sessionKey, 'true');

  } catch (error) {
    console.error(`❌ Error incrementing view count for ${collectionName}/${docId}:`, error);
    
    // Still mark as counted to prevent spam attempts
    sessionStorage.setItem(sessionKey, 'true');
  }
}

// Export function globally
window.incrementViewCount = incrementViewCount;
