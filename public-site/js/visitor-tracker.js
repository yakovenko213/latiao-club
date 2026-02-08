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
 * Track visitor to Firestore - ONCE per session
 * Writes to 'analytics_sessions' collection (existing collection)
 * Uses sessionStorage to prevent duplicate logs
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
    
    // Prepare data for logging
    const deviceData = {
      deviceType: deviceType,
      timestamp: serverTimestamp(),
      page: window.location.href,
      referrer: document.referrer || 'direct',
      userAgent: navigator.userAgent,
      platform: navigator.platform || 'unknown',
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      // Add trackedBy field to distinguish from session heartbeats
      trackedBy: 'visitor-tracker-v1'
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
    
    // Write to analytics_sessions collection (existing and publicly writable)
    console.log('🔍 Calling addDoc(collection(db, "analytics_sessions"), deviceData)...');
    await addDoc(collection(db, 'analytics_sessions'), deviceData);
    
    // ✅ Mark as tracked in this session
    sessionStorage.setItem('deviceTracked', 'true');
    console.log('✅ Device tracked successfully:', deviceType);
    
  } catch (error) {
    console.error('❌ Error tracking device:', error);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error message:', error.message);
    console.error('❌ Full error object:', JSON.stringify(error, null, 2));
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

