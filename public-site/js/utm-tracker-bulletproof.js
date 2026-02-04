/**
 * ====================================
 * BULLETPROOF UTM TRACKING SYSTEM v2.0
 * ====================================
 * Maximum visibility with localStorage persistence
 * Date: 04.02.2026
 */

(function() {
  'use strict';

  console.log('%c🎯 UTM TRACKER v2.0 LOADING...', 'background: #4CAF50; color: white; font-size: 16px; padding: 5px;');

  const STORAGE_KEY = 'latiao_utm_data';
  const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

  /**
   * Extract UTM from URL with MAXIMUM VISIBILITY
   */
  function captureUTMFromURL() {
    const url = window.location.href;
    const urlParams = new URLSearchParams(window.location.search);
    
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #FF6B00; font-weight: bold;');
    console.log('%c🔍 CHECKING URL FOR UTM PARAMETERS', 'color: #FF6B00; font-weight: bold; font-size: 14px;');
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #FF6B00; font-weight: bold;');
    console.log('📄 Full URL:', url);
    console.log('🔗 Query String:', window.location.search);
    
    const utmData = {};
    let foundAny = false;

    UTM_PARAMS.forEach(param => {
      const value = urlParams.get(param);
      if (value) {
        utmData[param] = value;
        foundAny = true;
        console.log(`%c✅ FOUND ${param.toUpperCase()}: ${value}`, 'color: #4CAF50; font-weight: bold; font-size: 13px;');
      }
    });

    if (foundAny) {
      // SHOW ALERT FOR MAXIMUM VISIBILITY
      const sourceValue = utmData.utm_source || 'unknown';
      alert('🎯 UTM DETECTED!\n\nSource: ' + sourceValue + '\n\nCheck console (F12) for full details.');
      
      // SHOW TABLE
      console.log('%c📊 UTM PARAMETERS DETECTED:', 'background: #2196F3; color: white; padding: 5px; font-size: 14px;');
      console.table(utmData);
      
      // Save to localStorage
      const dataToStore = {
        ...utmData,
        timestamp: Date.now(),
        capturedAt: new Date().toISOString(),
        landingPage: url
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
      console.log('%c💾 SAVED TO LOCALSTORAGE:', 'background: #9C27B0; color: white; padding: 5px;');
      console.log(dataToStore);
      
      return utmData;
    } else {
      console.log('%cℹ️ No UTM parameters in URL (Organic traffic)', 'color: #FF9800; font-size: 13px;');
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
        const parsed = JSON.parse(stored);
        console.log('%c📦 RETRIEVED FROM LOCALSTORAGE:', 'background: #673AB7; color: white; padding: 5px;');
        console.table(parsed);
        return parsed;
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
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #E91E63; font-weight: bold;');
    console.log('%c📦 PREPARING UTM DATA FOR ORDER', 'color: #E91E63; font-weight: bold; font-size: 14px;');
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #E91E63; font-weight: bold;');
    
    const stored = getStoredUTM();
    
    if (!stored || !stored.utm_source) {
      console.log('%c🌿 NO UTM DATA → ORGANIC TRAFFIC', 'background: #8BC34A; color: black; padding: 5px; font-size: 13px;');
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

    console.log('%c✅ UTM DATA READY FOR FIRESTORE:', 'background: #4CAF50; color: white; padding: 5px; font-size: 14px;');
    console.table(formattedData);
    
    // ALERT BEFORE ORDER
    alert('✅ UTM Data Ready!\n\nSource: ' + formattedData.source + '\nMedium: ' + formattedData.medium + '\n\nThis will be saved with your order.');

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

  console.log('%c✅ UTM TRACKER v2.0 READY', 'background: #4CAF50; color: white; font-size: 16px; padding: 5px;');

  // Expose global API
  window.UTMTracker = {
    getUTMForOrder: getUTMForOrder,
    getStoredUTM: getStoredUTM,
    clearUTM: clearUTM,
    debug: debug,
    capture: captureUTMFromURL
  };

})();
