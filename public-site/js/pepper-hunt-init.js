/**
 * ============================================
 * CHILI PEPPER HUNT - Main Initialization
 * ============================================
 * 
 * Master initialization script that:
 * 1. Checks if game is enabled
 * 2. Initializes game state
 * 3. Creates renderer
 * 4. Triggers pepper placement
 * 
 * Include this script on every page where peppers can appear.
 */

import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import PepperRenderer from './pepper-renderer.js';

/**
 * Initialize the Pepper Hunt game
 */
async function initPepperHunt() {
  try {
    console.log('═══════════════════════════════════════');
    console.log('🌶️ PEPPER HUNT - INITIALIZATION START');
    console.log('═══════════════════════════════════════');

    // Wait for Firebase to be initialized
    if (!window.firebaseApp) {
      console.log('⏳ [INIT] Waiting for Firebase App...');
      await waitForFirebase();
      console.log('✅ [INIT] Firebase App ready');
    } else {
      console.log('✅ [INIT] Firebase App already initialized');
    }

    // Get Firestore instance
    console.log('🔌 [INIT] Getting Firestore instance...');
    const db = getFirestore(window.firebaseApp);
    console.log('✅ [INIT] Firestore connected');
    
    // Initialize game state
    if (!window.pepperHuntGame) {
      console.error('❌ [INIT] CRITICAL: pepperHuntGame instance not found on window object!');
      console.log('💡 [INIT] Make sure pepper-hunt-game.js is loaded before pepper-hunt-init.js');
      return;
    }

    console.log('✅ [INIT] Game instance found');
    console.log('🎮 [INIT] Initializing game with Firestore...');
    
    const gameEnabled = await window.pepperHuntGame.init(db);
    
    if (!gameEnabled) {
      console.log('═══════════════════════════════════════');
      console.log('⚠️ PEPPER HUNT - GAME DISABLED');
      console.log('═══════════════════════════════════════');
      console.log('💡 To enable: Admin Panel → Peppers Game → Toggle ON');
      return;
    }

    console.log('✅ [INIT] Game is ENABLED and ready');

    // Create renderer
    if (!window.pepperRenderer) {
      console.log('🎨 [INIT] Creating pepper renderer...');
      window.pepperRenderer = new PepperRenderer(window.pepperHuntGame);
      console.log('✅ [INIT] Renderer created');
    } else {
      console.log('✅ [INIT] Renderer already exists');
    }

    // Show progress indicator (optional)
    const progress = window.pepperHuntGame.getProgress();
    console.log('📊 [INIT] Current progress:', progress);
    
    if (progress.found > 0 && progress.found < 8) {
      window.pepperRenderer.showProgressIndicator();
      console.log('📈 [INIT] Progress indicator shown');
    }

    console.log('═══════════════════════════════════════');
    console.log('🎉 PEPPER HUNT - READY TO PLAY!');
    console.log('═══════════════════════════════════════');
    console.log('Progress:', progress.found + '/8', '(' + progress.percentage + '%)');
    console.log('Random Products:', window.pepperHuntGame.randomProductIds);
    console.log('Note: Pepper placement handled by pepper-placer.js');

  } catch (error) {
    console.error('═══════════════════════════════════════');
    console.error('❌ PEPPER HUNT - INITIALIZATION ERROR');
    console.error('═══════════════════════════════════════');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
  }
}

/**
 * Wait for Firebase to be initialized
 */
function waitForFirebase(timeout = 10000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkFirebase = setInterval(() => {
      if (window.firebaseApp) {
        clearInterval(checkFirebase);
        resolve();
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkFirebase);
        reject(new Error('Firebase initialization timeout'));
      }
    }, 100);
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPepperHunt);
} else {
  initPepperHunt();
}

// Export for manual triggering if needed
window.initPepperHunt = initPepperHunt;
