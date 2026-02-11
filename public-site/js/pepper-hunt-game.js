/**
 * ============================================
 * CHILI PEPPER HUNT GAME - Game State Manager
 * ============================================
 * 
 * A gamification feature where 8 peppers are hidden across the website.
 * Players must find all peppers to win.
 * 
 * Pepper Locations:
 * 1. FAQ Section - Inside "Чи можна латяо дітям?"
 * 2. Delivery Page - Middle of content
 * 3. About Us Page - Brand story section
 * 4-6. Product Pages (DYNAMIC) - Randomly assigned products
 * 7. Checkout Page - Order summary section
 * 8. Stats Page - User dashboard
 * 
 * @module PepperHuntGame
 */

import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, getDocs, query, where, serverTimestamp, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

class PepperHuntGame {
  constructor() {
    this.gameKey = 'pepperhunt_progress';
    this.randomProductsKey = 'pepperhunt_random_products';
    this.db = null;
    this.isEnabled = false;
    this.progress = this.loadProgress();
    this.randomProductIds = this.loadRandomProducts();
    this.playerPhone = this.getPlayerPhone();
    this.startTime = Date.now();
  }

  /**
   * Initialize the game
   */
  async init(firebaseDb) {
    console.log('🌶️ [INIT] Starting game initialization...');
    this.db = firebaseDb;
    
    if (!this.db) {
      console.error('❌ [INIT] Firestore database not provided!');
      return false;
    }
    
    console.log('✅ [INIT] Firestore connected');
    
    // Check if game is enabled
    const isEnabled = await this.checkGameStatus();
    
    if (!isEnabled) {
      console.log('⚠️ [INIT] Game is currently disabled in Firestore (isEnabled: false)');
      console.log('💡 [INIT] Enable the game in Admin Panel → Peppers Game section');
      return false;
    }

    console.log('✅ [INIT] Game is ENABLED in Firestore');

    // Initialize random products for peppers 4-6 if not set
    if (!this.randomProductIds || this.randomProductIds.length === 0) {
      console.log('🎲 [INIT] Initializing random products for peppers 4-6...');
      await this.initializeRandomProducts();
    } else {
      console.log('✅ [INIT] Random products already set:', this.randomProductIds);
    }

    console.log('🎉 [INIT] Pepper Hunt Game initialized successfully!', {
      found: this.progress.found.length,
      total: 8,
      randomProducts: this.randomProductIds,
      isEnabled: this.isEnabled
    });

    // Set up real-time listener for game status changes
    this.setupGameStatusListener();

    return true;
  }

  /**
   * Check if game is enabled in Firestore
   */
  async checkGameStatus() {
    try {
      console.log('🔍 [STATUS] Checking game status in Firestore...');
      
      if (!this.db) {
        console.error('❌ [STATUS] Database not initialized');
        return false;
      }
      
      const configRef = doc(this.db, 'settings', 'peppersGameConfig');
      console.log('📄 [STATUS] Fetching document: settings/peppersGameConfig');
      
      const configSnap = await getDoc(configRef);
      
      if (configSnap.exists()) {
        const data = configSnap.data();
        this.isEnabled = data.isEnabled || false;
        console.log('✅ [STATUS] Game status from DB:', {
          isEnabled: this.isEnabled,
          fullData: data
        });
      } else {
        console.warn('⚠️ [STATUS] Config document does not exist!');
        console.log('💡 [STATUS] Run setup-pepper-hunt.html to initialize');
        this.isEnabled = false;
      }
      
      return this.isEnabled;
    } catch (error) {
      console.error('❌ [STATUS] Error checking game status:', error);
      return false;
    }
  }

  /**
   * Setup real-time listener for game status changes
   */
  setupGameStatusListener() {
    if (!this.db) return;
    
    console.log('👂 [LISTENER] Setting up real-time game status listener...');
    
    const configRef = doc(this.db, 'settings', 'peppersGameConfig');
    
    onSnapshot(configRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const newStatus = data.isEnabled || false;
        
        console.log('🔔 [LISTENER] Game status update received:', {
          old: this.isEnabled,
          new: newStatus
        });
        
        if (this.isEnabled !== newStatus) {
          this.isEnabled = newStatus;
          
          if (newStatus) {
            console.log('🎉 [LISTENER] Game was enabled! Reloading page...');
            window.location.reload();
          } else {
            console.log('⚠️ [LISTENER] Game was disabled');
          }
        }
      }
    }, (error) => {
      console.error('❌ [LISTENER] Error in status listener:', error);
    });
  }

  /**
   * Load progress from localStorage
   */
  loadProgress() {
    try {
      const saved = localStorage.getItem(this.gameKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
    
    return {
      found: [], // Array of pepper IDs (1-8)
      startedAt: Date.now(),
      goldenPeppers: 0
    };
  }

  /**
   * Save progress to localStorage
   */
  saveProgress() {
    try {
      localStorage.setItem(this.gameKey, JSON.stringify(this.progress));
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }

  /**
   * Load random product IDs for peppers 4-6
   */
  loadRandomProducts() {
    try {
      const saved = localStorage.getItem(this.randomProductsKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading random products:', error);
    }
    return [];
  }

  /**
   * Initialize random products for peppers 4-6
   */
  async initializeRandomProducts() {
    try {
      console.log('🎲 [RANDOM] Initializing random products for dynamic peppers...');
      
      if (!this.db) {
        console.warn('⚠️ [RANDOM] Firestore not initialized, using fallback products');
        this.randomProductIds = ['latiao-classic-original', 'latiao-spicy-fire', 'latiao-bbq-flavor'];
        localStorage.setItem(this.randomProductsKey, JSON.stringify(this.randomProductIds));
        console.log('✅ [RANDOM] Fallback products set:', this.randomProductIds);
        return;
      }

      console.log('📦 [RANDOM] Fetching products from Firestore...');
      
      // Fetch all products from Firestore
      const productsRef = collection(this.db, 'products');
      const productsSnap = await getDocs(productsRef);
      
      const allProducts = [];
      productsSnap.forEach(doc => {
        allProducts.push(doc.id);
      });

      console.log('✅ [RANDOM] Found', allProducts.length, 'products in database');

      if (allProducts.length < 3) {
        console.warn('⚠️ [RANDOM] Not enough products, using available ones');
        this.randomProductIds = allProducts.length > 0 ? allProducts : ['latiao-classic-original', 'latiao-spicy-fire', 'latiao-bbq-flavor'];
      } else {
        // Randomly select 3 unique products
        this.randomProductIds = this.selectRandomProducts(allProducts, 3);
      }

      // Save to localStorage
      localStorage.setItem(this.randomProductsKey, JSON.stringify(this.randomProductIds));
      
      console.log('🎉 [RANDOM] Random products saved to localStorage:', this.randomProductIds);
    } catch (error) {
      console.error('❌ [RANDOM] Error initializing random products:', error);
      // Fallback
      this.randomProductIds = ['latiao-classic-original', 'latiao-spicy-fire', 'latiao-bbq-flavor'];
      localStorage.setItem(this.randomProductsKey, JSON.stringify(this.randomProductIds));
      console.log('✅ [RANDOM] Using fallback products:', this.randomProductIds);
    }
  }

  /**
   * Select N random items from array
   */
  selectRandomProducts(array, count) {
    const shuffled = [...array].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  /**
   * Check if a pepper should be shown based on location
   */
  shouldShowPepper(pepperId, context = {}) {
    console.log(`🔍 [PEPPER #${pepperId}] Checking if should show...`, {
      pepperId,
      context,
      alreadyFound: this.progress.found.includes(pepperId),
      randomProducts: this.randomProductIds
    });
    
    // Don't show if already found
    if (this.progress.found.includes(pepperId)) {
      console.log(`⚠️ [PEPPER #${pepperId}] Already found, skipping`);
      return false;
    }

    // For peppers 4-6, check if current product matches
    if (pepperId >= 4 && pepperId <= 6) {
      const { productId } = context;
      
      if (!productId) {
        console.warn(`⚠️ [PEPPER #${pepperId}] No productId in context, cannot show`);
        return false;
      }
      
      const pepperIndex = pepperId - 4; // 0, 1, or 2
      const expectedProduct = this.randomProductIds[pepperIndex];
      const matches = expectedProduct === productId;
      
      console.log(`🎲 [PEPPER #${pepperId}] Dynamic pepper check:`, {
        currentProduct: productId,
        expectedProduct: expectedProduct,
        matches: matches
      });
      
      return matches;
    }

    console.log(`✅ [PEPPER #${pepperId}] Should show (fixed location)`);
    return true;
  }

  /**
   * Mark a pepper as found
   */
  async foundPepper(pepperId, isGolden = false) {
    if (this.progress.found.includes(pepperId)) {
      console.log('🌶️ Pepper already found:', pepperId);
      return false;
    }

    // Add to found list
    this.progress.found.push(pepperId);
    
    if (isGolden) {
      this.progress.goldenPeppers = (this.progress.goldenPeppers || 0) + 1;
    }

    this.saveProgress();

    console.log(`🌶️ Found pepper ${pepperId}! Progress: ${this.progress.found.length}/8`);

    // Check for victory
    if (this.progress.found.length === 8) {
      await this.handleVictory();
    }

    return true;
  }

  /**
   * Handle victory (all 8 peppers found)
   */
  async handleVictory() {
    console.log('🎉🌶️ VICTORY! All peppers found!');
    
    const timeSpent = Math.floor((Date.now() - this.progress.startedAt) / 1000);
    
    // Show victory modal/notification
    this.showVictoryAnimation();

    // Save to Firestore
    if (this.db && this.playerPhone) {
      try {
        const playerRef = doc(this.db, 'game_players', this.playerPhone);
        await setDoc(playerRef, {
          phone: this.playerPhone,
          peppersFound: 8,
          goldenPeppersFound: this.progress.goldenPeppers || 0,
          timeSpent: timeSpent,
          joinedAt: serverTimestamp(),
          completedAt: serverTimestamp(),
          telegram: this.getPlayerTelegram()
        }, { merge: true });
        
        console.log('✅ Victory saved to Firestore!');
      } catch (error) {
        console.error('Error saving victory:', error);
      }
    }
  }

  /**
   * Show victory animation
   */
  showVictoryAnimation() {
    // Create victory modal
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.3s ease;
    `;

    modal.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #ff6b00 0%, #ff8533 100%);
        padding: 40px;
        border-radius: 20px;
        text-align: center;
        max-width: 90%;
        animation: slideUp 0.5s ease;
      ">
        <div style="font-size: 80px; margin-bottom: 20px;">🎉🌶️🏆</div>
        <h2 style="color: white; font-size: 32px; font-weight: bold; margin-bottom: 10px;">ВІТАЄМО!</h2>
        <p style="color: white; font-size: 20px; margin-bottom: 20px;">Ви знайшли всі 8 перчиків!</p>
        <p style="color: white; font-size: 16px; opacity: 0.9;">Очікуйте на спеціальний приз! 🎁</p>
        <button onclick="this.parentElement.parentElement.remove()" style="
          margin-top: 30px;
          padding: 15px 40px;
          background: white;
          color: #ff6b00;
          border: none;
          border-radius: 10px;
          font-size: 18px;
          font-weight: bold;
          cursor: pointer;
        ">Закрити</button>
      </div>
    `;

    document.body.appendChild(modal);
  }

  /**
   * Get player phone (from localStorage or session)
   */
  getPlayerPhone() {
    try {
      // Try to get from checkout data or user session
      const checkoutData = localStorage.getItem('latiao_checkout_phone');
      if (checkoutData) return checkoutData;

      const userData = localStorage.getItem('latiao_user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.phone || null;
      }
    } catch (error) {
      console.error('Error getting player phone:', error);
    }
    return null;
  }

  /**
   * Get player telegram
   */
  getPlayerTelegram() {
    try {
      const userData = localStorage.getItem('latiao_user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.telegram || null;
      }
    } catch (error) {
      console.error('Error getting player telegram:', error);
    }
    return null;
  }

  /**
   * Get progress status
   */
  getProgress() {
    return {
      found: this.progress.found.length,
      total: 8,
      percentage: Math.round((this.progress.found.length / 8) * 100),
      peppers: this.progress.found,
      goldenPeppers: this.progress.goldenPeppers || 0
    };
  }

  /**
   * Reset game (for testing or new player)
   */
  resetGame() {
    this.progress = {
      found: [],
      startedAt: Date.now(),
      goldenPeppers: 0
    };
    this.saveProgress();
    localStorage.removeItem(this.randomProductsKey);
    console.log('🌶️ Game reset!');
  }
}

// ============================================
// GLOBAL INSTANCE
// ============================================
window.pepperHuntGame = new PepperHuntGame();

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideUp {
    from { 
      opacity: 0;
      transform: translateY(50px);
    }
    to { 
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(style);

export default PepperHuntGame;
