/**
 * ====================================
 * BULLETPROOF UTM TRACKING SYSTEM v2.0
 * ====================================
 * Maximum visibility with localStorage persistence
 * Date: 04.02.2026
 */

(function() {
  'use strict';

  // Silent UTM tracking - no console spam in production
  const STORAGE_KEY = 'latiao_utm_data';
  const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

  /**
   * Extract UTM from URL with MAXIMUM VISIBILITY
   */
  function captureUTMFromURL() {
    const url = window.location.href;
    const urlParams = new URLSearchParams(window.location.search);
    
    const utmData = {};
    let foundAny = false;

    UTM_PARAMS.forEach(param => {
      const value = urlParams.get(param);
      if (value) {
        utmData[param] = value;
        foundAny = true;
      }
    });

    if (foundAny) {
      // Silent tracking - save to localStorage without alerts
      const dataToStore = {
        ...utmData,
        timestamp: Date.now(),
        capturedAt: new Date().toISOString(),
        landingPage: url
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
      return utmData;
    } else {
      return null;
    }
  }

  /**
   * Get UTM data from localStorage
   */
  function getStoredUTM() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      return null;
    } catch (e) {
      console.error('❌ Error reading localStorage:', e);
      return null;
    }
  }

  /**
   * Format UTM data for Firestore order
   */
  function getUTMForOrder() {
    const stored = getStoredUTM();
    
    if (!stored || !stored.utm_source) {
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
      source: stored.utm_source || 'unknown',
      medium: stored.utm_medium || 'unknown',
      campaign: stored.utm_campaign || null,
      content: stored.utm_content || null,
      term: stored.utm_term || null,
      landingPage: stored.landingPage || null,
      capturedAt: stored.capturedAt || null
    };

    return formattedData;
  }

  /**
   * Clear all UTM data
   */
  function clearUTM() {
    localStorage.removeItem(STORAGE_KEY);
    console.log('🗑️ UTM data cleared');
  }

  /**
   * Debug function
   */
  function debug() {
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #00BCD4; font-weight: bold;');
    console.log('%c🐛 UTM TRACKER DEBUG', 'color: #00BCD4; font-weight: bold; font-size: 16px;');
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #00BCD4; font-weight: bold;');
    console.log('📄 Current URL:', window.location.href);
    console.log('📂 localStorage key:', STORAGE_KEY);
    console.log('📊 Stored Data:');
    const stored = getStoredUTM();
    if (stored) {
      console.table(stored);
    } else {
      console.log('   (empty)');
    }
    console.log('📦 Order Format:');
    console.table(getUTMForOrder());
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #00BCD4; font-weight: bold;');
  }

  // ============================================
  // INITIALIZE IMMEDIATELY
  // ============================================
  captureUTMFromURL();

  // Expose global API
  window.UTMTracker = {
    getUTMForOrder: getUTMForOrder,
    getStoredUTM: getStoredUTM,
    clearUTM: clearUTM,
    debug: debug,
    capture: captureUTMFromURL
  };

})();
