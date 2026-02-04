/**
 * ====================================
 * UTM TRACKING SYSTEM
 * ====================================
 * Captures UTM parameters from URL and stores them for order attribution
 * Author: Senior Fullstack Developer
 * Date: 04.02.2026
 */

(function() {
  'use strict';

  // UTM parameters to track
  const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  
  // Storage key for UTM data
  const STORAGE_KEY = 'latiao_utm_data';
  
  // Expiry time for UTM data (30 days in milliseconds)
  const EXPIRY_TIME = 30 * 24 * 60 * 60 * 1000;

  /**
   * Extract UTM parameters from current URL
   */
  function extractUTMFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const utmData = {};
    let hasUTM = false;

    console.log('🔍 [UTM] Checking URL for UTM parameters:', window.location.href);

    UTM_PARAMS.forEach(param => {
      const value = urlParams.get(param);
      if (value) {
        utmData[param] = value;
        hasUTM = true;
        console.log(`✅ [UTM] Found ${param}:`, value);
      }
    });

    if (!hasUTM) {
      console.log('ℹ️ [UTM] No UTM parameters found in URL');
    }

    return hasUTM ? utmData : null;
  }

  /**
   * Save UTM data to sessionStorage and localStorage with timestamp
   */
  function saveUTMData(utmData) {
    if (!utmData || Object.keys(utmData).length === 0) {
      console.log('⚠️ [UTM] No UTM data to save');
      return;
    }

    const dataToStore = {
      ...utmData,
      timestamp: Date.now(),
      landingPage: window.location.href
    };

    try {
      // Save to sessionStorage (lasts for browser session)
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
      
      // Save to localStorage (persists across sessions, expires after 30 days)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
      
      console.log('✅ [UTM] Data saved to storage:', dataToStore);
      console.log('💾 [UTM] sessionStorage check:', sessionStorage.getItem(STORAGE_KEY));
      console.log('💾 [UTM] localStorage check:', localStorage.getItem(STORAGE_KEY));
    } catch (error) {
      console.error('❌ [UTM] Failed to save UTM data:', error);
    }
  }

  /**
   * Retrieve UTM data from storage (checks expiry)
   */
  function getUTMData() {
    try {
      // Try sessionStorage first (most recent)
      let data = sessionStorage.getItem(STORAGE_KEY);
      
      // Fallback to localStorage if sessionStorage is empty
      if (!data) {
        data = localStorage.getItem(STORAGE_KEY);
      }

      if (!data) {
        return null;
      }

      const parsedData = JSON.parse(data);

      // Check if data has expired (30 days old)
      if (parsedData.timestamp && (Date.now() - parsedData.timestamp) > EXPIRY_TIME) {
        console.log('⚠️ UTM data expired, clearing...');
        clearUTMData();
        return null;
      }

      return parsedData;
    } catch (error) {
      console.error('❌ Failed to retrieve UTM data:', error);
      return null;
    }
  }

  /**
   * Clear UTM data from all storage
   */
  function clearUTMData() {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEY);
      console.log('🗑️ UTM data cleared');
    } catch (error) {
      console.error('❌ Failed to clear UTM data:', error);
    }
  }

  /**
   * Initialize UTM tracking on page load
   */
  function initUTMTracking() {
    console.log('🚀 [UTM] UTM Tracker initialized');
    console.log('📄 [UTM] Current page:', window.location.pathname);
    
    // Extract UTM from current URL
    const utmFromURL = extractUTMFromURL();

    if (utmFromURL) {
      // New UTM parameters found - save them
      saveUTMData(utmFromURL);
      console.log('🎯 [UTM] New UTM campaign detected and saved:', utmFromURL);
    } else {
      // No UTM in URL - check if we have stored data
      const existingUTM = getUTMData();
      if (existingUTM) {
        console.log('📊 [UTM] Using previously stored UTM data:', existingUTM);
        console.log('🕒 [UTM] Captured', Math.round((Date.now() - existingUTM.timestamp) / 60000), 'minutes ago');
      } else {
        console.log('ℹ️ [UTM] No UTM parameters detected (organic traffic)');
      }
    }
  }

  /**
   * Get formatted UTM data for order submission
   * Returns object ready to be added to Firestore
   */
  function getUTMForOrder() {
    console.log('📦 [UTM] getUTMForOrder() called');
    const utmData = getUTMData();
    
    console.log('📦 [UTM] Retrieved from storage:', utmData);
    
    if (!utmData) {
      console.log('⚠️ [UTM] No stored UTM data found - marking as organic');
      return {
        source: 'organic',
        medium: 'direct',
        campaign: null,
        content: null,
        term: null,
        landingPage: null,
        capturedAt: null
      };
    }

    const formattedData = {
      source: utmData.utm_source || 'unknown',
      medium: utmData.utm_medium || 'unknown',
      campaign: utmData.utm_campaign || null,
      content: utmData.utm_content || null,
      term: utmData.utm_term || null,
      landingPage: utmData.landingPage || null,
      capturedAt: utmData.timestamp ? new Date(utmData.timestamp).toISOString() : null
    };
    
    console.log('✅ [UTM] Formatted data for order:', formattedData);
    return formattedData;
  }

  /**
   * Debug function to display current UTM data
   */
  function debugUTMData() {
    const data = getUTMData();
    console.log('=== UTM DEBUG ===');
    console.log('Current URL:', window.location.href);
    console.log('Stored UTM:', data);
    console.log('Order format:', getUTMForOrder());
    console.log('================');
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUTMTracking);
  } else {
    initUTMTracking();
  }

  // Expose public API
  window.UTMTracker = {
    getUTMData: getUTMData,
    getUTMForOrder: getUTMForOrder,
    clearUTMData: clearUTMData,
    debug: debugUTMData
  };

})();
