/**
 * VERSION CHECKER
 * Automatically detects new versions and prompts user to reload
 * Prevents users from working with outdated cached code
 */

(function() {
  'use strict';

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CONFIGURATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes
  const VERSION_KEY = 'latiao_app_version';
  const VERSION_CHECK_URL = '/version.json';

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // GET CURRENT VERSION FROM STORAGE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  function getCurrentVersion() {
    return localStorage.getItem(VERSION_KEY);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SAVE VERSION TO STORAGE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  function saveVersion(version) {
    localStorage.setItem(VERSION_KEY, version);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FETCH LATEST VERSION FROM SERVER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  async function checkForUpdate() {
    try {
      const response = await fetch(VERSION_CHECK_URL + '?t=' + Date.now(), {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        console.warn('⚠️ Version check failed:', response.status);
        return null;
      }

      const data = await response.json();
      return data.timestamp.toString();
    } catch (error) {
      console.warn('⚠️ Version check error:', error.message);
      return null;
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SHOW UPDATE NOTIFICATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  function showUpdateNotification() {
    // Check if notification already shown
    if (document.getElementById('version-update-banner')) {
      return;
    }

    const banner = document.createElement('div');
    banner.id = 'version-update-banner';
    banner.className = 'fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 shadow-lg z-[9999] animate-slide-down';
    banner.innerHTML = `
      <div class="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <svg class="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          <div>
            <p class="font-bold text-sm">🎉 Нова версія доступна!</p>
            <p class="text-xs opacity-90">Оновіть сторінку, щоб отримати останні функції та виправлення</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="location.reload(true)" class="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-all hover:scale-105 active:scale-95">
            Оновити зараз
          </button>
          <button onclick="this.closest('#version-update-banner').remove()" class="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>
    `;

    // Add slide-down animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slide-down {
        from {
          transform: translateY(-100%);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      .animate-slide-down {
        animation: slide-down 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(banner);

    console.log('🔔 Update notification shown');

    // Auto-reload after 30 seconds if user ignores
    setTimeout(() => {
      if (document.getElementById('version-update-banner')) {
        console.log('🔄 Auto-reloading after 30 seconds...');
        location.reload(true);
      }
    }, 30000);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PERFORM VERSION CHECK
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  async function performVersionCheck() {
    const currentVersion = getCurrentVersion();
    const latestVersion = await checkForUpdate();

    if (!latestVersion) {
      // Failed to fetch, skip this check
      return;
    }

    console.log('📦 Version check:', {
      current: currentVersion || 'none',
      latest: latestVersion
    });

    if (!currentVersion) {
      // First visit, save version
      saveVersion(latestVersion);
      console.log('✅ Version saved:', latestVersion);
      return;
    }

    if (currentVersion !== latestVersion) {
      // New version detected!
      console.log('🎉 NEW VERSION DETECTED!');
      console.log('   Current:', currentVersion);
      console.log('   Latest:', latestVersion);
      
      // Update stored version
      saveVersion(latestVersion);
      
      // Show notification
      showUpdateNotification();
    } else {
      console.log('✅ Version up to date');
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // INITIALIZE VERSION CHECKER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  function init() {
    // Perform initial check after page load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(performVersionCheck, 2000); // Wait 2 seconds after page load
      });
    } else {
      setTimeout(performVersionCheck, 2000);
    }

    // Set up periodic checks
    setInterval(performVersionCheck, CHECK_INTERVAL);

    console.log('🔍 Version checker initialized');
    console.log(`   Check interval: ${CHECK_INTERVAL / 1000 / 60} minutes`);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FORCE CHECK (exposed globally)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  window.checkForAppUpdate = performVersionCheck;

  // Start checker
  init();

})();
