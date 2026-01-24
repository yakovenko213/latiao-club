// ============================================
// ADMIN PAGE GUARD SCRIPT
// Place this at the VERY TOP of <head> section
// This prevents unauthorized access before page renders
// ============================================

(function() {
  'use strict';
  
  // 🔐 CONFIGURATION - Replace with your admin UID
  const AUTHORIZED_ADMIN_UID = 'YOUR_ADMIN_UID_HERE'; // ⚠️ CHANGE THIS!
  
  // Prevent page rendering until auth check completes
  document.documentElement.style.visibility = 'hidden';
  
  // Wait for Firebase to initialize
  function checkAdminAccess() {
    // Check if Firebase is loaded
    if (typeof firebase === 'undefined' || !firebase.auth) {
      console.error('Firebase not loaded. Redirecting...');
      window.location.replace('/index.html');
      return;
    }
    
    // Wait for auth state
    firebase.auth().onAuthStateChanged(function(user) {
      if (!user) {
        // Not logged in - immediate redirect
        console.warn('Unauthorized access attempt - No user');
        window.location.replace('/index.html');
        return;
      }
      
      // Check if user UID matches admin UID
      if (user.uid !== AUTHORIZED_ADMIN_UID) {
        // Logged in but not admin - redirect
        console.warn('Unauthorized access attempt - UID: ' + user.uid);
        window.location.replace('/index.html');
        return;
      }
      
      // ✅ Authorized admin - show page
      console.log('✅ Admin access granted for UID: ' + user.uid);
      document.documentElement.style.visibility = 'visible';
    });
  }
  
  // Start auth check when DOM loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAdminAccess);
  } else {
    checkAdminAccess();
  }
  
  // Timeout fallback - redirect if auth takes too long
  setTimeout(function() {
    if (document.documentElement.style.visibility === 'hidden') {
      console.error('Auth timeout. Redirecting...');
      window.location.replace('/index.html');
    }
  }, 5000);
})();
