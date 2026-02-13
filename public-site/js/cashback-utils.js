// ============================================
// SHARED CASHBACK UTILITIES
// ============================================
// Common functions for managing cashback display across pages

/**
 * Update cashback display based on global config
 * @param {number} total - Total amount in UAH
 * @param {string} amountElementId - ID of element showing cashback amount
 * @param {string} badgeElementId - ID of the badge container
 * @param {boolean} forceShow - Force show even if total is 0
 */
export function updateCashbackDisplay(total, amountElementId, badgeElementId, forceShow = false) {
  const isCashbackEnabled = window.cashbackEnabled !== false; // default true
  
  console.log(`🪙 [Cashback] Updating display - Enabled: ${isCashbackEnabled}, Total: ${total}`);
  
  const amountEl = document.getElementById(amountElementId);
  const badgeEl = document.getElementById(badgeElementId);
  
  if (!badgeEl) {
    console.warn(`⚠️ [Cashback] Badge element #${badgeElementId} not found`);
    return;
  }
  
  if (!isCashbackEnabled) {
    // Hide cashback badge
    badgeEl.classList.add('hidden');
    badgeEl.style.display = 'none';
    console.log(`🙈 [Cashback] Hidden badge #${badgeElementId} (disabled by admin)`);
    return;
  }
  
  // Cashback is enabled - calculate and show
  if (total > 0 || forceShow) {
    const cashback = Math.floor(total * 0.08);
    
    // Update amount
    if (amountEl) {
      amountEl.textContent = cashback;
      console.log(`✅ [Cashback] Updated #${amountElementId}: ${cashback} грн`);
    }
    
    // Show badge
    badgeEl.classList.remove('hidden');
    badgeEl.style.display = '';
    console.log(`👁️ [Cashback] Showing badge #${badgeElementId}`);
  } else {
    // Hide when total is 0
    badgeEl.classList.add('hidden');
    console.log(`🙈 [Cashback] Hidden badge #${badgeElementId} (total is 0)`);
  }
}

/**
 * Hide cashback badge (force)
 */
export function hideCashbackBadge(badgeElementId) {
  const badgeEl = document.getElementById(badgeElementId);
  if (badgeEl) {
    badgeEl.classList.add('hidden');
    badgeEl.style.display = 'none';
    console.log(`🙈 [Cashback] Force-hidden badge #${badgeElementId}`);
  }
}

/**
 * Setup cashback listener for a page
 * @param {Function} updateCallback - Function to call when cashback state changes
 */
export function setupCashbackListener(updateCallback) {
  // Import will be handled by the page
  const checkInterval = setInterval(() => {
    if (window.onCashbackStateChange) {
      clearInterval(checkInterval);
      window.onCashbackStateChange((isEnabled) => {
        console.log(`🔄 [Cashback] State changed: ${isEnabled}`);
        updateCallback(isEnabled);
      });
    }
  }, 100);
  
  // Timeout after 5 seconds
  setTimeout(() => clearInterval(checkInterval), 5000);
}
