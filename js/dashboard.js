/**
 * ============================================
 * DASHBOARD.JS - Customer Dashboard Logic
 * ============================================
 * Handles: Session, Avatar, Orders, Modal
 * 100% STANDALONE - Does NOT depend on admin.js
 */

// ============================================
// EXPLICIT FIREBASE IMPORTS (Standalone Mode)
// ============================================
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
  getFirestore,
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { 
  getAuth, 
  onAuthStateChanged,
  signInAnonymously
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// ============================================
// EXPLICIT FIREBASE INITIALIZATION (Standalone)
// ============================================
const firebaseConfig = {
  apiKey: "AIzaSyDyQvItRyL4IKl9NmEItswwPOEiKAbWkMw",
  authDomain: "my-magazin-81c96.firebaseapp.com",
  projectId: "my-magazin-81c96",
  storageBucket: "my-magazin-81c96.firebasestorage.app",
  messagingSenderId: "129061757346",
  appId: "1:129061757346:web:3e7bc5838cc5f7bda992fb"
};

// Initialize Firebase App (will reuse if already initialized)
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (e) {
  // App already initialized, get the existing instance
  app = initializeApp(firebaseConfig, 'dashboard-app');
}

const db = getFirestore(app);
const auth = getAuth(app);

console.log('🔥 Dashboard: Firebase initialized independently');

// ============================================
// AVATAR POOL - Funny meme avatars
// ============================================
const AVATAR_POOL = [
  "https://www.meme-arsenal.com/memes/cdcfda78a84cf35ca09a109439642ea6.jpg",
  "https://i1.sndcdn.com/artworks-Pm21pVGyLISZPmA8-mt4UhQ-t500x500.jpg",
  "https://www.meme-arsenal.com/memes/463e01e32c4ea517425162d27481d7b2.jpg",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQEN4_2MD_SBd-1dE0tr6BIF581wULKjW29Cw&s",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQEPijZKwJWqno9DLrxEsCOJ-e9w9I5l3lfSg&s"
];

/**
 * Get a random avatar URL from the pool
 */
function getRandomAvatar() {
  return AVATAR_POOL[Math.floor(Math.random() * AVATAR_POOL.length)];
}

// ============================================
// GLOBAL STATE
// ============================================
let userOrdersCache = [];
let currentUser = null;

// ============================================
// STATUS MAPPINGS
// ============================================
const STATUS_COLORS = {
  'new': 'bg-blue-100 text-blue-700',
  'pending': 'bg-blue-100 text-blue-700',
  'paid': 'bg-emerald-100 text-emerald-700',
  'processing': 'bg-yellow-100 text-yellow-700',
  'confirmed': 'bg-emerald-100 text-emerald-700',
  'shipped': 'bg-purple-100 text-purple-700',
  'preparing': 'bg-indigo-100 text-indigo-700',     // NP: Created/In process
  'delivering': 'bg-orange-100 text-orange-700',    // NP: In transit
  'delivered': 'bg-green-100 text-green-700',
  'completed': 'bg-green-100 text-green-700',
  'cancelled': 'bg-red-100 text-red-700',
  'canceled': 'bg-red-100 text-red-700',
  'refunded': 'bg-gray-100 text-gray-700'
};

const STATUS_LABELS = {
  'new': 'Новий',
  'pending': 'Очікує',
  'paid': 'Оплачено',
  'processing': 'В обробці',
  'confirmed': 'Підтверджено',
  'shipped': 'Відправлено',
  'preparing': 'Готується до відправки 📦',         // Dynamic NP status
  'delivering': 'Доставляється 🚚',                  // Dynamic NP status
  'delivered': 'Доставлено',
  'completed': 'Виконано ✅',
  'cancelled': 'Скасовано',
  'canceled': 'Скасовано',
  'refunded': 'Повернено'
};

// ============================================
// DYNAMIC STATUS HELPER (NP API Integration)
// ============================================

/**
 * Get display status based on DB status + optional Nova Poshta tracking info.
 * Maps 'shipped' status to more granular visuals based on real tracking.
 * 
 * @param {Object} order - Order object from Firestore
 * @param {Object|null} npStatus - Optional Nova Poshta status info { status, statusCode }
 * @returns {{ label: string, color: string }} Display status with label and color class
 */
function getDisplayStatus(order, npStatus = null) {
  const dbStatus = order.status || 'new';
  
  // If completed, always show completed
  if (dbStatus === 'completed') {
    return {
      label: STATUS_LABELS['completed'],
      color: STATUS_COLORS['completed']
    };
  }
  
  // If cancelled, always show cancelled
  if (dbStatus === 'cancelled' || dbStatus === 'canceled') {
    return {
      label: STATUS_LABELS['cancelled'],
      color: STATUS_COLORS['cancelled']
    };
  }
  
  // If shipped and we have NP status, show dynamic status
  if (dbStatus === 'shipped' && npStatus && !npStatus.error) {
    const statusLower = (npStatus.status || '').toLowerCase();
    const statusCode = parseInt(npStatus.statusCode, 10) || 0;
    
    // Received/Delivered statuses (9, 10, 11, 106)
    if ([9, 10, 11, 106].includes(statusCode)) {
      return {
        label: STATUS_LABELS['completed'],
        color: STATUS_COLORS['completed']
      };
    }
    
    // In transit / Delivering
    if (statusCode >= 4 && statusCode <= 8 || 
        statusLower.includes('прямує') || 
        statusLower.includes('в дорозі') ||
        statusLower.includes('відправлено') ||
        statusLower.includes('в місті')) {
      return {
        label: STATUS_LABELS['delivering'],
        color: STATUS_COLORS['delivering']
      };
    }
    
    // Created / Processing / Preparing
    if (statusCode >= 1 && statusCode <= 3 ||
        statusLower.includes('створено') ||
        statusLower.includes('прийнято') ||
        statusLower.includes('на складі')) {
      return {
        label: STATUS_LABELS['preparing'],
        color: STATUS_COLORS['preparing']
      };
    }
    
    // Default for shipped with unknown NP status
    return {
      label: STATUS_LABELS['shipped'],
      color: STATUS_COLORS['shipped']
    };
  }
  
  // Default: use DB status directly
  return {
    label: STATUS_LABELS[dbStatus] || dbStatus,
    color: STATUS_COLORS[dbStatus] || STATUS_COLORS['new']
  };
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Dashboard: Starting initialization...');
  
  // ===== STEP 1: Check local session first =====
  const sessionData = localStorage.getItem('user_session');
  
  if (!sessionData) {
    console.log('❌ Dashboard: No session found, redirecting to login...');
    window.location.href = './login.html';
    return;
  }
  
  try {
    currentUser = JSON.parse(sessionData);
    console.log('🔐 Dashboard: Session loaded from localStorage:', currentUser?.phone);
  } catch (e) {
    console.error('❌ Dashboard: Invalid session data:', e);
    localStorage.removeItem('user_session');
    window.location.href = './login.html';
    return;
  }
  
  // ===== STEP 2: Wait for Firebase Auth to resolve =====
  console.log('⏳ Dashboard: Waiting for Firebase Auth state...');
  
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      // User is authenticated (either anonymous or with credentials)
      console.log('✅ Dashboard: Firebase Auth confirmed. UID:', firebaseUser.uid);
      console.log('✅ Dashboard: Auth method:', firebaseUser.isAnonymous ? 'Anonymous' : 'Authenticated');
      
      // Proceed with dashboard initialization
      await initDashboardAfterAuth();
      
    } else {
      // No Firebase user - attempt anonymous sign-in for read access
      console.log('⚠️ Dashboard: No Firebase user. Attempting anonymous sign-in...');
      
      try {
        const anonResult = await signInAnonymously(auth);
        console.log('✅ Dashboard: Anonymous sign-in successful. UID:', anonResult.user.uid);
        
        // Now proceed with dashboard initialization
        await initDashboardAfterAuth();
        
      } catch (anonError) {
        console.error('❌ Dashboard: Anonymous sign-in failed:', anonError);
        console.error('🔥 Error code:', anonError.code);
        
        // Try to load anyway (might work if rules allow)
        console.log('🔄 Dashboard: Attempting to load without auth...');
        await initDashboardAfterAuth();
      }
    }
  });
});

/**
 * Main initialization function - called AFTER Auth is confirmed
 */
async function initDashboardAfterAuth() {
  console.log('🚀 Dashboard: Initializing after auth confirmation...');
  
  // 0. Log user activity (async, non-blocking)
  const userId = currentUser.id || currentUser.phone?.replace(/\+/g, '');
  if (userId) {
    logUserActivity(userId, 'dashboard_view').catch(err => 
      console.warn('⚠️ Activity log failed:', err)
    );
  }
  
  // 1. Handle Avatar (Self-Healing)
  await handleAvatarSelfHealing();
  
  // 2. Update UI with user data
  updateUserUI();
  
  // 3. Load orders from Firestore
  await loadUserOrders();
  
  // 4. Load personal promo codes
  await loadPersonalPromoCodes();
  
  // 5. Render floating support widget
  renderSupportWidget();

  console.log('✅ Dashboard: Ready!');
}

/**
 * @deprecated Use initDashboardAfterAuth instead
 * Kept for backwards compatibility
 */
async function initDashboard() {
  // This is now handled by DOMContentLoaded + onAuthStateChanged
  console.warn('⚠️ initDashboard() called directly - use DOMContentLoaded flow instead');
}

// ============================================
// AVATAR SELF-HEALING
// ============================================
async function handleAvatarSelfHealing() {
  if (!currentUser.avatarUrl) {
    console.log('🎨 No avatar in session, assigning random avatar...');
    const newAvatarUrl = getRandomAvatar();
    
    // Update local user object
    currentUser.avatarUrl = newAvatarUrl;
    
    // Update localStorage immediately
    localStorage.setItem('user_session', JSON.stringify(currentUser));
    console.log('💾 Avatar saved to localStorage');
    
    // Update Firestore asynchronously (don't block UI)
    updateAvatarInFirestore(newAvatarUrl);
  }
}

// ============================================
// USER ACTIVITY TRACKING
// ============================================

/**
 * Log user activity to Firestore for analytics
 * @param {string} userId - Customer document ID (phone without +)
 * @param {string} action - Action type: 'login' | 'dashboard_view'
 */
async function logUserActivity(userId, action = 'dashboard_view') {
  if (!userId) {
    console.warn('⚠️ logUserActivity: No userId provided');
    return;
  }
  
  try {
    const customerRef = doc(db, 'customers', userId);
    
    // Detect device type from userAgent
    const userAgent = navigator.userAgent || '';
    const isMobile = /Mobile|Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    // Create activity entry
    const activityEntry = {
      timestamp: new Date().toISOString(),
      userAgent: userAgent.substring(0, 200), // Limit to 200 chars
      device: isMobile ? 'mobile' : 'desktop',
      action: action
    };
    
    // Update customer document
    await updateDoc(customerRef, {
      lastActiveAt: serverTimestamp(),
      accessLog: arrayUnion(activityEntry)
    });
    
    console.log(`📊 Activity logged: ${action} for ${userId}`);
    
  } catch (error) {
    // Don't throw - this is non-critical
    console.warn('⚠️ Failed to log activity:', error.message);
  }
}

// Expose globally for login.js
window.logUserActivity = logUserActivity;

/**
 * Update avatar in Firestore (async, non-blocking)
 */
async function updateAvatarInFirestore(avatarUrl) {
  try {
    const customerId = currentUser.id || currentUser.phone?.replace(/\+/g, '');
    
    if (customerId) {
      const customerRef = doc(db, 'customers', customerId);
      await updateDoc(customerRef, { avatarUrl });
      console.log('✅ Avatar saved to Firestore:', avatarUrl);
    }
  } catch (error) {
    console.warn('⚠️ Could not save avatar to Firestore:', error);
  }
}

// ============================================
// UI UPDATES
// ============================================
function updateUserUI() {
  // Update greeting with user's name
  const greetingEl = document.getElementById('user-greeting');
  if (greetingEl) {
    if (currentUser.fullName) {
      const firstName = currentUser.fullName.split(' ')[0] || currentUser.fullName;
      greetingEl.textContent = `Привіт, 🌶️ ${firstName}!`;
    } else {
      greetingEl.textContent = `Привіт, 🌶️ Клієнт!`;
    }
  }
  
  // Update phone display
  const phoneEl = document.getElementById('user-phone');
  if (phoneEl && currentUser.phone) {
    phoneEl.textContent = formatPhone(currentUser.phone);
  }
  
  // Update avatar
  updateAvatarUI();
  
  console.log('👤 UI updated for:', currentUser.fullName || currentUser.phone);
}

/**
 * Format phone for display: +380 XX XXX XX XX
 */
function formatPhone(phone) {
  if (!phone) return '';
  
  if (phone.startsWith('+380')) {
    const digits = phone.replace(/\D/g, '').slice(2); // Get digits after 38
    if (digits.length === 10) {
      return `+380 ${digits.slice(0,2)} ${digits.slice(2,5)} ${digits.slice(5,7)} ${digits.slice(7,9)}`;
    }
  }
  return phone;
}

/**
 * Update avatar image or show initials fallback
 */
function updateAvatarUI() {
  const avatarImg = document.getElementById('user-avatar-img');
  const avatarInitials = document.getElementById('user-avatar-initials');
  
  if (currentUser.avatarUrl && avatarImg) {
    avatarImg.src = currentUser.avatarUrl;
    avatarImg.style.display = 'block';
    if (avatarInitials) avatarInitials.style.display = 'none';
    console.log('🖼️ Avatar loaded:', currentUser.avatarUrl);
  } else {
    // Fallback to initials
    if (avatarImg) avatarImg.style.display = 'none';
    if (avatarInitials) {
      const initial = currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'К';
      avatarInitials.textContent = initial;
      avatarInitials.style.display = 'flex';
    }
  }
}

// ============================================
// ORDER STATS (Count + Total Spent)
// ============================================

/**
 * Update stats cards with orders count and total spent
 * @param {Array} orders - Array of order objects
 */
function updateOrderStats(orders) {
  const ordersCountEl = document.getElementById('stat-orders-count');
  const totalSpentEl = document.getElementById('stat-total-spent');
  
  // Calculate count
  const totalCount = orders.length;
  
  // Calculate total spent (sum of all order totals)
  // Check multiple possible locations for the total value
  const totalSpent = orders.reduce((sum, order) => {
    // Try different possible field paths
    let orderTotal = 0;
    
    if (order.summary && order.summary.total !== undefined) {
      orderTotal = Number(order.summary.total) || 0;
    } else if (order.total !== undefined) {
      orderTotal = Number(order.total) || 0;
    } else if (order.totalAmount !== undefined) {
      orderTotal = Number(order.totalAmount) || 0;
    }
    
    return sum + orderTotal;
  }, 0);
  
  // Update DOM - Orders Count
  if (ordersCountEl) {
    ordersCountEl.textContent = totalCount.toString();
  }
  
  // Update DOM - Total Spent (formatted with Ukrainian locale)
  if (totalSpentEl) {
    const formattedTotal = totalSpent.toLocaleString('uk-UA');
    totalSpentEl.textContent = `${formattedTotal} ₴`;
  }
  
  console.log(`📊 Stats updated: ${totalCount} orders, ${totalSpent} ₴ spent`);
}

// ============================================
// ORDERS LOADING
// ============================================
async function loadUserOrders() {
  console.log('📦 Dashboard: Loading orders...');
  
  // ===== STEP 1: Get user phone from session =====
  const userPhone = currentUser?.phone;
  console.log('📱 Dashboard: User phone from session:', userPhone);
  
  if (!userPhone) {
    console.error('❌ Dashboard: No phone in session! Cannot load orders.');
    showEmptyState('Не вдалося знайти номер телефону');
    return;
  }
  
  const tableBody = document.getElementById('orders-table-body');
  const mobileCards = document.getElementById('orders-mobile-cards');
  
  // Show loading state
  const loadingHTML = `
    <div class="flex items-center justify-center gap-2 text-muted-foreground py-8">
      <div class="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      <span>Завантаження замовлень...</span>
    </div>
  `;
  
  if (tableBody) {
    tableBody.innerHTML = `<tr><td colspan="6" class="px-4 py-8 text-center">${loadingHTML}</td></tr>`;
  }
  if (mobileCards) {
    mobileCards.innerHTML = loadingHTML;
  }
  
  // ===== STEP 2: Normalize phone & create variants =====
  const phoneVariants = getPhoneVariants(userPhone);
  console.log('🔍 Dashboard: Searching orders for phone variants:', phoneVariants);
  
  try {
    // ===== STEP 3: Query Firestore directly =====
    const ordersRef = collection(db, 'orders');
    let allOrders = [];
    
    // Query for each phone format
    for (const phoneVariant of phoneVariants) {
      console.log(`🔎 Dashboard: Trying query with phone: "${phoneVariant}"`);
      
      try {
        // First try with orderBy
        const ordersQuery = query(
          ordersRef,
          where('customer.phone', '==', phoneVariant),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        
        const snapshot = await getDocs(ordersQuery);
        
        if (!snapshot.empty) {
          snapshot.forEach(doc => {
            if (!allOrders.find(o => o.id === doc.id)) {
              allOrders.push({ id: doc.id, ...doc.data() });
            }
          });
          console.log(`✅ Dashboard: Found ${snapshot.size} orders with phone: ${phoneVariant}`);
        } else {
          console.log(`📭 Dashboard: No orders found for: ${phoneVariant}`);
        }
      } catch (queryError) {
        console.warn(`⚠️ Dashboard: Ordered query failed for ${phoneVariant}:`, queryError.message);
        
        // Check if it's an index error
        if (queryError.message?.includes('requires an index')) {
          console.error('🔥 INDEX MISSING! Create composite index for orders collection.');
        }
        
        // Fallback: simple query without orderBy
        console.log(`🔄 Dashboard: Retrying simple query for: ${phoneVariant}`);
        try {
          const simpleQuery = query(
            ordersRef,
            where('customer.phone', '==', phoneVariant),
            limit(50)
          );
          const simpleSnapshot = await getDocs(simpleQuery);
          
          if (!simpleSnapshot.empty) {
            simpleSnapshot.forEach(doc => {
              if (!allOrders.find(o => o.id === doc.id)) {
                allOrders.push({ id: doc.id, ...doc.data() });
              }
            });
            console.log(`✅ Dashboard: Simple query found ${simpleSnapshot.size} orders for: ${phoneVariant}`);
          }
        } catch (e) {
          console.error(`❌ Dashboard: Both queries failed for ${phoneVariant}:`, e.message);
        }
      }
    }
    
    // ===== STEP 4: Sort and limit =====
    allOrders.sort((a, b) => {
      const dateA = parseOrderDate(a.createdAt);
      const dateB = parseOrderDate(b.createdAt);
      return dateB - dateA;
    });
    
    allOrders = allOrders.slice(0, 20);
    
    // Store in cache for modal access
    userOrdersCache = allOrders;
    
    // ===== STEP 5: Final Debug Summary =====
    console.log(`📋 Dashboard: Found ${allOrders.length} orders total`);
    
    if (allOrders.length === 0) {
      console.warn('⚠️ Dashboard: No orders found!');
      console.warn('🔍 Check if database phone format matches. Session phone:', userPhone);
      console.warn('🔍 Tried variants:', phoneVariants);
    } else {
      console.log('📦 Dashboard: Orders loaded successfully:', allOrders.map(o => ({
        id: o.id,
        phone: o.customer?.phone,
        status: o.status,
        date: o.createdAt
      })));
    }
    
    // Update stats cards
    updateOrderStats(allOrders);
    
    // Render orders
    renderUserOrders(allOrders);
    
  } catch (error) {
    console.error('🔥 Dashboard: CRITICAL ERROR loading orders:', error);
    console.error('🔥 Error Code:', error.code);
    console.error('🔥 Error Message:', error.message);
    
    if (error.code === 'permission-denied') {
      console.error('🚫 PERMISSION DENIED - Check Firestore Rules!');
    }
    
    // Show error to user
    const errorHTML = `
      <div class="p-4 text-center">
        <div class="text-red-500 font-medium mb-2">❌ Помилка завантаження</div>
        <div class="text-xs text-muted-foreground">${error.message || 'Спробуйте оновити сторінку'}</div>
      </div>
    `;
    
    if (tableBody) {
      tableBody.innerHTML = `<tr><td colspan="6">${errorHTML}</td></tr>`;
    }
    if (mobileCards) {
      mobileCards.innerHTML = errorHTML;
    }
  }
}

/**
 * Get all phone format variations for searching
 */
function getPhoneVariants(phone) {
  if (!phone) return [];
  
  let normalizedPhone = phone.replace(/\D/g, ''); // Remove all non-digits
  
  // Ensure we have the full format
  if (normalizedPhone.startsWith('380')) {
    normalizedPhone = '+' + normalizedPhone;
  } else if (normalizedPhone.startsWith('0')) {
    normalizedPhone = '+38' + normalizedPhone;
  } else if (normalizedPhone.length === 9) {
    normalizedPhone = '+380' + normalizedPhone;
  }
  
  const variants = [
    normalizedPhone,                              // +380XXXXXXXXX
    normalizedPhone.replace('+38', ''),           // 0XXXXXXXXX
    '0' + normalizedPhone.replace('+380', ''),    // 0XXXXXXXXX (alt)
    normalizedPhone.replace('+', ''),             // 380XXXXXXXXX
  ];
  
  // Remove duplicates
  return [...new Set(variants)];
}

/**
 * Parse order date from various formats
 */
function parseOrderDate(createdAt) {
  if (!createdAt) return new Date(0);
  if (createdAt.toDate) return createdAt.toDate();
  if (createdAt.seconds) return new Date(createdAt.seconds * 1000);
  return new Date(createdAt);
}

/**
 * Show empty state with custom message
 */
function showEmptyState(message = 'У вас поки немає замовлень') {
  const tableBody = document.getElementById('orders-table-body');
  const mobileCards = document.getElementById('orders-mobile-cards');
  const emptyState = document.getElementById('orders-empty-state');
  
  if (tableBody) tableBody.innerHTML = '';
  if (mobileCards) mobileCards.innerHTML = '';
  if (emptyState) {
    emptyState.classList.remove('hidden');
    const p = emptyState.querySelector('p');
    if (p) p.textContent = message;
  }
}

// ============================================
// DELIVERY SERVICE LOGOS
// ============================================
const DELIVERY_LOGOS = {
  nova_poshta: 'https://poletehnika.com.ua/image/catalog/e-mag/landing/np-logomark-red.png',
  ukr_poshta: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR19Fzy1r4-i6x9ytwyP3p-I0E4Df7UJKQqnQ&s'
};

/**
 * Get delivery service logo URL
 * @param {string} service - 'nova_poshta' or 'ukr_poshta'
 * @returns {string} Logo URL
 */
function getDeliveryLogo(service) {
  return DELIVERY_LOGOS[service] || DELIVERY_LOGOS.nova_poshta;
}

/**
 * Get delivery service name in Ukrainian
 * @param {string} service - 'nova_poshta' or 'ukr_poshta'
 * @returns {string} Service name
 */
function getDeliveryServiceName(service) {
  return service === 'ukr_poshta' ? 'Укрпошта' : 'Нова Пошта';
}

/**
 * Get tracking URL for the delivery service
 * @param {string} service - 'nova_poshta' or 'ukr_poshta'
 * @param {string} ttn - Tracking number
 * @returns {string} Tracking URL
 */
function getTrackingUrl(service, ttn) {
  if (service === 'ukr_poshta') {
    return `https://track.ukrposhta.ua/tracking_UA.html?barcode=${ttn}`;
  }
  return `https://novaposhta.ua/tracking/?cargo_number=${ttn}`;
}

// ============================================
// ORDERS RENDERING (Dual: Desktop + Mobile)
// ============================================
function renderUserOrders(orders) {
  const tableBody = document.getElementById('orders-table-body');
  const mobileCards = document.getElementById('orders-mobile-cards');
  const emptyState = document.getElementById('orders-empty-state');
  
  if (orders.length === 0) {
    showEmptyState('У вас поки немає замовлень');
    // Reset stats to zero when no orders
    updateOrderStats([]);
    return;
  }
  
  // Hide empty state
  if (emptyState) emptyState.classList.add('hidden');
  
  let desktopHTML = '';
  let mobileHTML = '';
  
  orders.forEach(order => {
    // DEBUG: Log order structure to find the correct price field
    console.log('📦 Order Data:', order.id, order);
    
    const orderId = order.id.slice(-6).toUpperCase();
    const date = parseOrderDate(order.createdAt);
    const formattedDate = date.toLocaleDateString('uk-UA', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
    
    // Extract total from multiple possible locations
    const total = Number(order.summary?.total) || Number(order.total) || Number(order.totalAmount) || Number(order.totalPrice) || 0;
    const formattedTotal = total.toLocaleString('uk-UA');
    console.log(`💰 Order ${orderId} total: ${total} (formatted: ${formattedTotal})`);
    
    // Use dynamic status display based on DB status
    // For table view, use basic status (detailed tracking shown in modal)
    const displayStatus = getDisplayStatus(order, null);
    const statusColor = displayStatus.color;
    const statusLabel = displayStatus.label;
    
    // Get TTN and delivery service from multiple possible locations
    const ttn = order.ttn || order.trackingNumber || order.delivery?.ttn || order.shipping?.ttn || null;
    const deliveryService = order.deliveryService || 'nova_poshta';
    const deliveryLogo = getDeliveryLogo(deliveryService);
    const trackingUrl = getTrackingUrl(deliveryService, ttn);
    const serviceName = getDeliveryServiceName(deliveryService);
    
    const ttnDisplay = ttn 
      ? `<div class="flex items-center gap-2">
          <img src="${deliveryLogo}" alt="${serviceName}" class="h-5 w-auto" title="${serviceName}">
          <a href="${trackingUrl}" target="_blank" rel="noopener" class="font-mono text-primary hover:underline" title="Відстежити">${ttn}</a>
        </div>`
      : '<span class="text-muted-foreground">—</span>';
    
    // Desktop Table Row
    desktopHTML += `
      <tr class="hover:bg-muted/50 transition-colors">
        <td class="px-4 py-3 text-sm font-medium text-foreground">#${orderId}</td>
        <td class="px-4 py-3 text-sm text-muted-foreground">${formattedDate}</td>
        <td class="px-4 py-3 text-sm text-muted-foreground">${order.customer?.fullName || '-'}</td>
        <td class="px-4 py-3 text-sm font-semibold text-foreground">${formattedTotal} грн</td>
        <td class="px-4 py-3 text-sm">${ttnDisplay}</td>
        <td class="px-4 py-3">
          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColor}">
            ${statusLabel}
          </span>
        </td>
        <td class="px-4 py-3">
          <div class="flex items-center justify-center gap-2">
            <button onclick="openOrderModal('${order.id}')" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-colors">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
              Деталі
            </button>
          </div>
        </td>
      </tr>
    `;
    
    // Mobile Card - TTN row for mobile with delivery service logo
    const mobileTtnRow = ttn 
      ? `<div class="flex items-center gap-2 text-sm text-muted-foreground mb-3 bg-muted/50 rounded-lg p-2">
          <img src="${deliveryLogo}" alt="${serviceName}" class="h-5 w-auto">
          <span>ТТН:</span>
          <a href="${trackingUrl}" target="_blank" rel="noopener" class="font-mono text-primary hover:underline">${ttn}</a>
        </div>`
      : '';
    
    mobileHTML += `
      <div class="bg-muted/30 rounded-xl p-4 border border-border/50 hover:border-primary/30 transition-colors">
        <!-- Top Row: Order ID + Status Badge -->
        <div class="flex items-center justify-between mb-3">
          <span class="font-bold text-foreground text-base">#${orderId}</span>
          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColor}">
            ${statusLabel}
          </span>
        </div>
        
        <!-- Middle: Date + Total -->
        <div class="flex items-center justify-between text-sm mb-3">
          <span class="text-muted-foreground flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            ${formattedDate}
          </span>
          <span class="font-bold text-primary text-lg">${formattedTotal} грн</span>
        </div>
        
        <!-- TTN Row (only if exists) -->
        ${mobileTtnRow}
        
        <!-- Bottom: Action Button -->
        <div>
          <!-- Details Button -->
          <button 
            onclick="openOrderModal('${order.id}')" 
            class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            Переглянути деталі
          </button>
        </div>
      </div>
    `;
  });
  
  // Inject into DOM
  if (tableBody) tableBody.innerHTML = desktopHTML;
  if (mobileCards) mobileCards.innerHTML = mobileHTML;
  
  console.log(`✅ Rendered ${orders.length} orders (desktop + mobile)`);
}

// ============================================
// REPEAT ORDER FEATURE
// ============================================

/**
 * Repeat Order - adds all items from a past order to the shopping cart
 * Uses the same localStorage key as layout.js (latiao_cart)
 * @param {string} orderId - The order ID to repeat
 */
function repeatOrder(orderId) {
  // Find order from cache
  const order = userOrdersCache.find(o => o.id === orderId);
  if (!order) {
    console.error('❌ Order not found for repeat:', orderId);
    alert('Помилка: замовлення не знайдено');
    return;
  }

  // Get items from order
  const orderItems = order.items || order.products || [];
  if (orderItems.length === 0) {
    alert('У цьому замовленні немає товарів для повторення');
    return;
  }

  // Get current cart from localStorage (key: latiao_cart - same as layout.js)
  let cart = [];
  try {
    const cartData = localStorage.getItem('latiao_cart');
    cart = cartData ? JSON.parse(cartData) : [];
    // Ensure it's an array
    if (!Array.isArray(cart)) cart = [];
  } catch (e) {
    console.error('Error parsing cart:', e);
    cart = [];
  }

  // Track how many items were added/updated
  let addedCount = 0;
  let updatedCount = 0;

  // Merge items into cart (Smart Add logic)
  orderItems.forEach(orderItem => {
    // FALLBACK: Use SKU if ID is missing (historical orders may use sku)
    const uniqueId = orderItem.id || orderItem.productId || orderItem.sku;
    const itemName = orderItem.name || orderItem.title || 'Unknown';
    const itemPrice = Number(orderItem.price) || 0;
    const itemQuantity = Number(orderItem.quantity) || Number(orderItem.qty) || 1;
    const itemImage = orderItem.image || orderItem.imageUrl || orderItem.img || '';
    const itemVariant = orderItem.variant || orderItem.selectedVariant || null;
    const itemIsGift = orderItem.isGift === true;
    const itemSku = orderItem.sku || uniqueId;

    if (!uniqueId) {
      console.warn('Skipping item without ID or SKU:', orderItem);
      return;
    }

    // Skip gift items from repeat (they'll be auto-added if eligible)
    if (itemIsGift) {
      console.log('⚠️ Skipping gift item:', itemName);
      return;
    }

    // Check if item already exists in cart (match by ID or SKU, and isGift status)
    const existingIndex = cart.findIndex(cartItem => {
      const cartItemId = cartItem.id || cartItem.productId || cartItem.sku;
      const cartIsGift = cartItem.isGift === true;
      return (cartItemId === uniqueId || cartItem.sku === uniqueId) && cartIsGift === itemIsGift;
    });

    if (existingIndex >= 0) {
      // Item exists - increase quantity
      const currentQty = Number(cart[existingIndex].quantity) || Number(cart[existingIndex].qty) || 1;
      if ('quantity' in cart[existingIndex]) {
        cart[existingIndex].quantity = currentQty + itemQuantity;
      } else {
        cart[existingIndex].qty = currentQty + itemQuantity;
      }
      updatedCount++;
    } else {
      // New item - add to cart with exact structure expected by cart.html
      cart.push({
        id: uniqueId,      // Important: Cart expects 'id'
        sku: itemSku,      // Preserve SKU for reference
        name: itemName,
        price: itemPrice,
        quantity: itemQuantity,
        image: itemImage,
        variant: itemVariant,
        isGift: false
      });
      addedCount++;
    }
  });

  // Save updated cart to localStorage (same key as layout.js)
  localStorage.setItem('latiao_cart', JSON.stringify(cart));

  // Update window.cart if it exists (for header badge)
  if (typeof window.cart !== 'undefined') {
    window.cart = cart;
  }

  // Update cart badge and render cart if functions exist
  if (typeof window.updateBadges === 'function') {
    window.updateBadges();
  }
  if (typeof window.renderCart === 'function') {
    window.renderCart();
  }

  // Show success notification
  showRepeatOrderToast(addedCount, updatedCount);

  console.log(`✅ Repeat order ${orderId}: added ${addedCount} new items, updated ${updatedCount} existing items`);

  // Ask user if they want to go to cart
  setTimeout(() => {
    if (confirm('Товари додано до кошика! 🛒\n\nПерейти до оформлення?')) {
      window.location.href = '/checkout.html';
    }
  }, 300);
}

/**
 * Show toast notification for repeat order success
 */
function showRepeatOrderToast(addedCount, updatedCount) {
  const totalItems = addedCount + updatedCount;
  const message = updatedCount > 0 
    ? `Додано ${addedCount} нових товарів, оновлено ${updatedCount} існуючих`
    : `${totalItems} ${totalItems === 1 ? 'товар доданий' : totalItems < 5 ? 'товари додані' : 'товарів додано'} в кошик`;

  // Remove existing toast if any
  const existingToast = document.getElementById('repeat-order-toast');
  if (existingToast) existingToast.remove();

  // Create toast element
  const toast = document.createElement('div');
  toast.id = 'repeat-order-toast';
  toast.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-3 animate-fade-in';
  toast.innerHTML = `
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
    <div>
      <div class="font-bold">Товари додано в кошик! 🛒</div>
      <div class="text-sm opacity-90">${message}</div>
    </div>
  `;

  document.body.appendChild(toast);

  // Auto-remove after 4 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translate(-50%, 20px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ============================================
// NOVA POSHTA TRACKING API
// ============================================

/**
 * Fetch real-time tracking status from Nova Poshta API
 * @param {string} ttn - Tracking number (TTN)
 * @returns {Promise<{status: string, scheduledDate: string|null, warehouse: string|null, statusCode: number|null, error: boolean}>}
 * 
 * // TODO: REPLACE 'YOUR_API_KEY' WITH YOUR REAL KEY for extended features
 * // Public tracking works without API key for basic status
 */
async function fetchNPStatus(ttn) {
  // Nova Poshta API Key (empty for public tracking, add your key for extended features)
  const NP_API_KEY = ''; // TODO: Add your Nova Poshta API key here for extended tracking
  
  try {
    const response = await fetch('https://api.novaposhta.ua/v2.0/json/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        apiKey: NP_API_KEY,
        modelName: 'TrackingDocument',
        calledMethod: 'getStatusDocuments',
        methodProperties: {
          Documents: [{ DocumentNumber: ttn }]
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();

    if (data.success && data.data && data.data.length > 0) {
      const trackingInfo = data.data[0];
      
      // StatusCode meanings:
      // 1 - Нова пошта очікує надходження
      // 2 - Видалено
      // 3 - Номер не знайдено
      // 4 - Прибув на відділення відправника
      // 5 - Відправлення відправлено
      // 6 - Прибув на склад
      // 7 - Прибув на відділення
      // 8 - Прибув на пошту (поштомат)
      // 9 - Одержано
      // 10 - Одержано (підпис)
      // 11 - Одержано (підпис + SMS)
      // 102 - Відмова
      // 103 - Повернення
      // 104 - Змінено адресу
      // 105 - Припинено зберігання
      // 106 - Одержано і оплачено
      
      return {
        status: trackingInfo.Status || 'Невідомий статус',
        statusCode: parseInt(trackingInfo.StatusCode) || null,
        scheduledDate: trackingInfo.ScheduledDeliveryDate || trackingInfo.DateScheduledDelivery || null,
        actualDate: trackingInfo.ActualDeliveryDate || null,
        warehouse: trackingInfo.WarehouseRecipient || trackingInfo.CityRecipient || null,
        warehouseNumber: trackingInfo.RecipientWarehouseNumber || null,
        recipientCity: trackingInfo.CityRecipient || null,
        senderCity: trackingInfo.CitySender || null,
        weight: trackingInfo.DocumentWeight || null,
        cost: trackingInfo.DocumentCost || null,
        announcedPrice: trackingInfo.AnnouncedPrice || null,
        paymentStatus: trackingInfo.PaymentStatus || null,
        error: false
      };
    } else {
      // API returned success=false or no data
      const errorMsg = data.errors && data.errors.length > 0 
        ? data.errors[0] 
        : 'ТТН не знайдено';
      return {
        status: errorMsg,
        statusCode: null,
        scheduledDate: null,
        warehouse: null,
        error: true
      };
    }
  } catch (err) {
    console.error('❌ Nova Poshta API error:', err);
    return {
      status: 'Помилка отримання статусу',
      statusCode: null,
      scheduledDate: null,
      warehouse: null,
      error: true
    };
  }
}

/**
 * Get tracking state based on status code
 * @param {number} statusCode - Nova Poshta status code
 * @returns {{state: string, isMoving: boolean, isCompleted: boolean, isError: boolean}}
 */
function getTrackingState(statusCode) {
  // Completed states (parcel received)
  const completedCodes = [9, 10, 11, 106];
  // Moving states (in transit)
  const movingCodes = [1, 4, 5, 6, 7, 8];
  // Error/Problem states
  const errorCodes = [2, 3, 102, 103, 105];
  
  if (completedCodes.includes(statusCode)) {
    return { state: 'completed', isMoving: false, isCompleted: true, isError: false };
  } else if (movingCodes.includes(statusCode)) {
    return { state: 'moving', isMoving: true, isCompleted: false, isError: false };
  } else if (errorCodes.includes(statusCode)) {
    return { state: 'error', isMoving: false, isCompleted: false, isError: true };
  }
  return { state: 'pending', isMoving: false, isCompleted: false, isError: false };
}

/**
 * Get CSS classes for status based on content
 * @param {string} status - Status text
 * @param {boolean} isError - Is error response
 * @returns {string} CSS classes
 */
function getNPStatusColorClasses(status, isError) {
  if (isError) return 'bg-red-50 border-red-100 text-red-700';
  
  const lowerStatus = status.toLowerCase();
  
  // Rejection/Problem statuses
  if (lowerStatus.includes('відмова') || 
      lowerStatus.includes('проблем') ||
      lowerStatus.includes('неможливо')) {
    return 'bg-red-50 border-red-100 text-red-700';
  }
  
  // Arrived/Delivered statuses
  if (lowerStatus.includes('прибув') || 
      lowerStatus.includes('отримано') ||
      lowerStatus.includes('одержано') ||
      lowerStatus.includes('доставлен')) {
    return 'bg-green-50 border-green-100 text-green-700';
  }
  
  // Default - in transit
  return 'bg-blue-50 border-blue-100 text-blue-700';
}

/**
 * Format date to DD.MM.YYYY
 * @param {string} dateStr - Date string from API
 * @returns {string} Formatted date or empty string
 */
function formatNPDate(dateStr) {
  if (!dateStr) return '';
  try {
    // Nova Poshta returns dates like "2024-01-15 12:00:00" or "15-01-2024"
    const parts = dateStr.split(/[-\s]/);
    if (parts.length >= 3) {
      // Check if first part is year (YYYY-MM-DD)
      if (parts[0].length === 4) {
        return `${parts[2]}.${parts[1]}.${parts[0]}`;
      }
      // Otherwise assume DD-MM-YYYY
      return `${parts[0]}.${parts[1]}.${parts[2]}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

// ============================================
// ORDER DETAILS MODAL
// ============================================
function openOrderModal(orderId) {
  console.log('🔍 Modal Opened for Order:', orderId);
  
  const order = userOrdersCache.find(o => o.id === orderId);
  if (!order) {
    console.error('❌ Order not found in cache:', orderId);
    console.log('📦 Cache contents:', userOrdersCache.map(o => o.id));
    return;
  }

  console.log('📋 Opening order details:', order);

  const modal = document.getElementById('order-details-modal');
  if (!modal) {
    console.error('❌ Modal element #order-details-modal not found in DOM');
    // Fallback to old modal ID
    const fallbackModal = document.getElementById('order-modal');
    if (fallbackModal) {
      console.warn('⚠️ Using fallback modal #order-modal');
    }
    return;
  }
  
  console.log('✅ Modal element found:', modal);

  // Order ID
  const orderIdDisplay = order.id.slice(-6).toUpperCase();
  const orderIdEl = modal.querySelector('#modal-order-id');
  if (orderIdEl) orderIdEl.textContent = `#${orderIdDisplay}`;

  // Date
  const orderDate = parseOrderDate(order.createdAt);
  const orderDateEl = modal.querySelector('#modal-order-date');
  if (orderDateEl) {
    orderDateEl.textContent = orderDate.toLocaleDateString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Status - Initial display (will be updated after NP API call if shipped)
  const status = order.status || 'new';
  const statusEl = modal.querySelector('#modal-order-status');
  const initialDisplayStatus = getDisplayStatus(order, null);
  if (statusEl) {
    statusEl.className = `inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${initialDisplayStatus.color}`;
    statusEl.textContent = initialDisplayStatus.label;
    statusEl.setAttribute('data-order-status', status); // Store original for reference
  }

  // Products list - Desktop + Mobile
  renderModalProducts(modal, order);

  // Financial Summary
  const items = order.items || order.products || [];
  let subtotal = items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);

  const subtotalEl = modal.querySelector('#modal-subtotal');
  if (subtotalEl) subtotalEl.textContent = `${subtotal} грн`;

  // Promo code row
  const promoRow = modal.querySelector('#modal-promo-row');
  const discount = order.discount || order.promoDiscount || 0;
  const promoCode = order.promoCode || order.promocode || null;

  if (promoRow) {
    if (promoCode || discount > 0) {
      promoRow.classList.remove('hidden');
      const promoCodeEl = modal.querySelector('#modal-promo-code');
      const promoDiscountEl = modal.querySelector('#modal-promo-discount');
      if (promoCodeEl) promoCodeEl.textContent = promoCode ? `(${promoCode})` : '';
      if (promoDiscountEl) promoDiscountEl.textContent = `-${discount} грн`;
    } else {
      promoRow.classList.add('hidden');
    }
  }

  // Total - check multiple sources: order.total, order.summary.total, order.totalAmount, or calculate
  const total = Number(order.total) || Number(order.summary?.total) || Number(order.totalAmount) || (subtotal - discount);
  const totalEl = modal.querySelector('#modal-total');
  if (totalEl) totalEl.textContent = `${total} грн`;

  // Delivery cost - Dynamic based on order total (FREE if >= 1100)
  const FREE_SHIPPING_THRESHOLD = 1100;
  const deliveryCostEl = modal.querySelector('#modal-delivery-cost');
  if (deliveryCostEl) {
    if (total >= FREE_SHIPPING_THRESHOLD) {
      deliveryCostEl.innerHTML = `<span class="text-green-600 font-bold">🎉 Безкоштовна доставка</span>`;
    } else {
      const remaining = FREE_SHIPPING_THRESHOLD - total;
      deliveryCostEl.innerHTML = `<span class="text-gray-600">За тарифами перевізника</span>
        <span class="block text-xs text-muted-foreground mt-1">Ще ${remaining} грн до безкоштовної доставки</span>`;
    }
  }

  // Shipping Info
  const customer = order.customer || {};
  const shipping = order.shipping || {};
  const delivery = order.delivery || {};
  
  const customerNameEl = modal.querySelector('#modal-customer-name');
  const customerPhoneEl = modal.querySelector('#modal-customer-phone');
  const shippingCityEl = modal.querySelector('#modal-shipping-city');
  const shippingWarehouseEl = modal.querySelector('#modal-shipping-warehouse');
  
  if (customerNameEl) customerNameEl.textContent = customer.fullName || customer.name || delivery.name || '-';
  if (customerPhoneEl) customerPhoneEl.textContent = customer.phone || delivery.phone || '-';
  
  // City: try delivery, shipping, customer objects
  const city = delivery.city || shipping.city || customer.city || customer.novaPoshtaCity?.Description || '-';
  if (shippingCityEl) shippingCityEl.textContent = city !== '-' ? `м. ${city}` : city;
  
  // Warehouse/Address: prefer branch, fallback to address, then warehouse, with warehouse number
  let warehouseOrAddress = delivery.branch || delivery.address || shipping.warehouse || customer.warehouse || customer.novaPoshtaWarehouse?.Description || '';
  
  // If we have warehouseNumber but no branch text, construct it
  if (!warehouseOrAddress && delivery.warehouseNumber) {
    warehouseOrAddress = `Відділення №${delivery.warehouseNumber}`;
  }
  
  if (shippingWarehouseEl) shippingWarehouseEl.textContent = warehouseOrAddress || '-';
  
  // Full delivery address display (combined city + address)
  const fullAddressEl = modal.querySelector('#modal-full-address');
  if (fullAddressEl) {
    const fullAddress = city !== '-' && warehouseOrAddress 
      ? `м. ${city}, ${warehouseOrAddress}` 
      : (city !== '-' ? `м. ${city}` : warehouseOrAddress || '-');
    fullAddressEl.textContent = fullAddress;
  }
  
  // TTN (tracking number) with delivery service logo
  const ttn = order.ttn || order.trackingNumber || shipping.ttn || null;
  const deliveryService = order.deliveryService || 'nova_poshta';
  const deliveryLogo = getDeliveryLogo(deliveryService);
  const trackingUrl = getTrackingUrl(deliveryService, ttn);
  const serviceName = getDeliveryServiceName(deliveryService);
  
  const ttnRow = modal.querySelector('#modal-ttn-row');
  const ttnEl = modal.querySelector('#modal-ttn');
  
  if (ttnRow) {
    if (ttn) {
      ttnRow.classList.remove('hidden');
      if (ttnEl) {
        ttnEl.innerHTML = `
          <a href="${trackingUrl}" target="_blank" rel="noopener" class="inline-flex items-center gap-2 hover:underline">
            <img src="${deliveryLogo}" alt="${serviceName}" class="h-6 w-auto">
            <span class="font-mono">${ttn}</span>
          </a>
        `;
      }
    } else {
      ttnRow.classList.add('hidden');
    }
  }

  // ==========================================
  // NOVA POSHTA REAL-TIME TRACKING (FULL-WIDTH PREMIUM)
  // ==========================================
  try {
    // Get the dedicated tracking container
    const trackingContainer = modal.querySelector('#np-tracking-container');
    
    // Only fetch if TTN exists and container found
    if (ttn && trackingContainer) {
      console.log('🚚 Starting Nova Poshta tracking for TTN:', ttn);
      
      // Show container and set loading state
      trackingContainer.classList.remove('hidden');
      trackingContainer.className = 'p-5 border-t border-border bg-gradient-to-br from-blue-50/50 to-primary/5';
      trackingContainer.innerHTML = `
        <div class="flex items-center gap-3 mb-4">
          <div class="p-2 bg-primary/10 rounded-xl">
            <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"/>
            </svg>
          </div>
          <div>
            <h3 class="font-semibold text-foreground">🔴 Live Відстеження</h3>
            <p class="text-xs text-muted-foreground">Статус посилки в реальному часі</p>
          </div>
        </div>
        <div id="np-tracking-content" class="w-full bg-white/80 rounded-xl border border-blue-100 p-4">
          <div class="flex items-center justify-center gap-3 text-blue-600 py-4">
            <svg class="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="font-medium">Перевіряємо статус у Новій Пошті...</span>
          </div>
        </div>
      `;

      // Fetch status asynchronously (non-blocking) with error handling
      fetchNPStatus(ttn).then(result => {
        console.log('📍 Nova Poshta API response:', result);
        
        // Check if content container still exists (modal might be closed)
        const contentBlock = document.querySelector('#np-tracking-content');
        if (!contentBlock) {
          console.log('⚠️ Tracking block removed (modal closed)');
          return;
        }

        const trackingState = getTrackingState(result.statusCode);
        const formattedDate = formatNPDate(result.scheduledDate);
        
        console.log('🔄 Tracking state:', trackingState);
        
        // Determine colors and styles based on state
        let containerBg = 'bg-blue-50/50';
        let statusBadgeClasses = 'bg-blue-100 text-blue-700 border-blue-200';
        let statusIcon = '📦';
        let truckSection = '';
        
        if (result.error) {
          containerBg = 'bg-yellow-50/50';
          statusBadgeClasses = 'bg-yellow-100 text-yellow-700 border-yellow-200';
          statusIcon = '⚠️';
        } else if (trackingState.isCompleted) {
          containerBg = 'bg-green-50/50';
          statusBadgeClasses = 'bg-green-100 text-green-700 border-green-200';
          statusIcon = '✅';
          // Completed: Green static truck with checkmark
          truckSection = `
            <div class="flex flex-col md:flex-row items-center gap-4 mt-4 p-4 bg-green-100/50 rounded-xl border border-green-200">
              <div class="relative flex-shrink-0">
                <svg class="w-16 h-16 md:w-20 md:h-20 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"/>
                </svg>
                <span class="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                  </svg>
                </span>
              </div>
              <div class="text-center md:text-left">
                <p class="text-lg font-bold text-green-700">🎉 Посилку отримано!</p>
                <p class="text-sm text-green-600 mt-1">Дякуємо за замовлення</p>
              </div>
            </div>
          `;
        } else if (trackingState.isMoving) {
          statusIcon = '🚚';
          // In Transit: Animated blue truck driving across the full width
          truckSection = `
            <div class="mt-4 p-4 bg-blue-100/50 rounded-xl border border-blue-200 overflow-hidden">
              <div class="relative h-20 md:h-24">
                <!-- Road/Track -->
                <div class="absolute bottom-4 left-0 right-0 h-2 bg-gray-300 rounded-full"></div>
                <div class="absolute bottom-4 left-0 w-1/2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                
                <!-- Animated Truck -->
                <div class="absolute bottom-6 truck-animate">
                  <svg class="w-14 h-14 md:w-16 md:h-16 text-blue-600 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"/>
                  </svg>
                </div>
                
                <!-- Destination marker -->
                <div class="absolute bottom-6 right-4">
                  <svg class="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                </div>
              </div>
              <p class="text-center text-sm font-medium text-blue-700 mt-2">🚀 Посилка прямує до вас!</p>
            </div>
            <style>
              @keyframes truck-drive {
                0% { left: 0%; }
                50% { left: 45%; }
                100% { left: 0%; }
              }
              .truck-animate {
                animation: truck-drive 4s ease-in-out infinite;
              }
            </style>
          `;
        } else if (trackingState.isError) {
          containerBg = 'bg-red-50/50';
          statusBadgeClasses = 'bg-red-100 text-red-700 border-red-200';
          statusIcon = '❌';
          truckSection = `
            <div class="flex items-center gap-4 mt-4 p-4 bg-red-100/50 rounded-xl border border-red-200">
              <svg class="w-12 h-12 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <div>
                <p class="font-bold text-red-700">Виникла проблема</p>
                <p class="text-sm text-red-600">Зверніться до служби підтримки</p>
              </div>
            </div>
          `;
        }
        
        // Build location info
        const locationInfo = result.warehouse ? `
          <div class="flex items-center gap-2 text-muted-foreground">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            </svg>
            <span class="text-sm">${result.warehouse}</span>
          </div>
        ` : '';
        
        // Build date info
        const dateInfo = formattedDate ? `
          <div class="flex items-center gap-2 text-muted-foreground">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            <span class="text-sm">Орієнтовно: <strong>${formattedDate}</strong></span>
          </div>
        ` : '';

        // Render the full-width tracking content
        contentBlock.className = `w-full ${containerBg} rounded-xl border border-border p-4`;
        contentBlock.innerHTML = `
          <div class="flex flex-col md:flex-row md:items-start gap-4">
            <!-- Status Info (Left/Top) -->
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-3">
                <span class="text-2xl">${statusIcon}</span>
                <div>
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusBadgeClasses}">
                    ${result.status}
                  </span>
                </div>
              </div>
              <div class="space-y-2">
                ${locationInfo}
                ${dateInfo}
              </div>
            </div>
            
            <!-- TTN Info (Right/Bottom) -->
            <div class="flex-shrink-0 text-right md:text-left">
              <p class="text-xs text-muted-foreground mb-1">Номер відстеження</p>
              <code class="text-sm font-mono bg-muted px-2 py-1 rounded">${ttn}</code>
            </div>
          </div>
          
          ${truckSection}
        `;

      // ==========================================
      // DYNAMIC STATUS BADGE UPDATE (Header)
      // ==========================================
      // Update the status badge in modal header based on NP tracking
      const modalStatusEl = document.querySelector('#modal-order-status');
      if (modalStatusEl && !result.error) {
        const currentDbStatus = modalStatusEl.getAttribute('data-order-status');
        
        // Only update if the order is 'shipped' (not already completed in DB)
        if (currentDbStatus === 'shipped') {
          const dynamicStatus = getDisplayStatus(
            { status: currentDbStatus }, 
            { status: result.status, statusCode: result.statusCode }
          );
          
          modalStatusEl.className = `inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${dynamicStatus.color}`;
          modalStatusEl.textContent = dynamicStatus.label;
          
          console.log(`🏷️ Modal status badge updated: ${currentDbStatus} → ${dynamicStatus.label}`);
        }
      }

      console.log('📍 Nova Poshta tracking loaded:', result);
    }).catch(trackingError => {
      console.error('❌ Tracking fetch error:', trackingError);
      // Show error state in tracking container
      const contentBlock = document.querySelector('#np-tracking-content');
      if (contentBlock) {
        contentBlock.className = 'w-full bg-yellow-50/50 rounded-xl border border-yellow-200 p-4';
        contentBlock.innerHTML = `
          <div class="flex items-center gap-4">
            <svg class="w-10 h-10 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <div>
              <p class="font-medium text-yellow-700">Не вдалося завантажити статус</p>
              <p class="text-sm text-yellow-600">Спробуйте оновити сторінку</p>
            </div>
          </div>
        `;
      }
    });
    } else {
      // No TTN - hide tracking container
      const trackingContainer = modal.querySelector('#np-tracking-container');
      if (trackingContainer) {
        trackingContainer.classList.add('hidden');
      }
    }
  } catch (trackingSetupError) {
    console.error('❌ Tracking setup error:', trackingSetupError);
    // Continue showing modal even if tracking fails
  }

  // Show modal
  console.log('🎉 Showing modal now');
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

/**
 * Render products in modal (Desktop table + Mobile cards)
 */
function renderModalProducts(modal, order) {
  const productsDesktop = modal.querySelector('#modal-products-list');
  const productsMobile = modal.querySelector('#modal-products-mobile');
  
  const items = order.items || order.products || [];
  let desktopHTML = '';
  let mobileHTML = '';

  if (items.length === 0) {
    const emptyMsg = 'Товари не знайдено';
    if (productsDesktop) productsDesktop.innerHTML = `<tr><td colspan="4" class="py-4 text-center text-muted-foreground">${emptyMsg}</td></tr>`;
    if (productsMobile) productsMobile.innerHTML = `<p class="py-4 text-center text-muted-foreground">${emptyMsg}</p>`;
    return;
  }

  items.forEach(item => {
    const itemTotal = (item.price || 0) * (item.quantity || 1);
    const imgSrc = item.image || item.imageUrl || 'https://placehold.co/48x48?text=🌶️';
    const itemName = item.name || item.title || 'Товар';
    
    // Desktop table row
    desktopHTML += `
      <tr class="border-b border-border/50 last:border-0">
        <td class="py-3 pr-3">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
              <img src="${imgSrc}" alt="${itemName}" class="w-full h-full object-cover" onerror="this.src='https://placehold.co/48x48?text=🌶️'">
            </div>
            <div>
              <p class="font-medium text-foreground text-sm">${itemName}</p>
              ${item.variant ? `<p class="text-xs text-muted-foreground">${item.variant}</p>` : ''}
            </div>
          </div>
        </td>
        <td class="py-3 px-3 text-center text-sm text-muted-foreground">${item.quantity || 1}</td>
        <td class="py-3 px-3 text-right text-sm text-muted-foreground">${item.price || 0} грн</td>
        <td class="py-3 pl-3 text-right text-sm font-medium text-foreground">${itemTotal} грн</td>
      </tr>
    `;
    
    // Mobile card
    mobileHTML += `
      <div class="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
        <div class="w-14 h-14 rounded-lg bg-muted overflow-hidden flex-shrink-0">
          <img src="${imgSrc}" alt="${itemName}" class="w-full h-full object-cover" onerror="this.src='https://placehold.co/48x48?text=🌶️'">
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-medium text-foreground text-sm truncate">${itemName}</p>
          ${item.variant ? `<p class="text-xs text-muted-foreground">${item.variant}</p>` : ''}
          <div class="flex items-center justify-between mt-1">
            <span class="text-xs text-muted-foreground">${item.quantity || 1} × ${item.price || 0} грн</span>
            <span class="font-semibold text-primary text-sm">${itemTotal} грн</span>
          </div>
        </div>
      </div>
    `;
  });
  
  if (productsDesktop) productsDesktop.innerHTML = desktopHTML;
  if (productsMobile) productsMobile.innerHTML = mobileHTML;
}

/**
 * Close order modal
 */
function closeOrderModal() {
  const modal = document.getElementById('order-details-modal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

// ============================================
// UI UTILITIES
// ============================================

/**
 * Tab switching function
 */
function switchTab(tabName) {
  // Hide all content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  
  // Reset all tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('bg-primary', 'text-primary-foreground', 'shadow-lg');
    btn.classList.add('bg-card', 'text-muted-foreground', 'border', 'border-border');
    btn.style.boxShadow = 'none';
  });
  
  // Show selected content
  const content = document.getElementById('content-' + tabName);
  if (content) content.classList.add('active');
  
  // Style active tab
  const activeTab = document.getElementById('tab-' + tabName);
  if (activeTab) {
    activeTab.classList.remove('bg-card', 'text-muted-foreground', 'border', 'border-border');
    activeTab.classList.add('bg-primary', 'text-primary-foreground', 'shadow-lg');
    activeTab.style.boxShadow = '0 10px 25px -5px rgba(255, 107, 0, 0.25)';
  }
}

/**
 * Copy code to clipboard
 */
function copyCode(code, button) {
  navigator.clipboard.writeText(code).then(() => {
    const copyIcon = button.querySelector('.copy-icon');
    const checkIcon = button.querySelector('.check-icon');
    const btnText = button.querySelector('.btn-text');
    
    if (copyIcon) copyIcon.classList.add('hidden');
    if (checkIcon) checkIcon.classList.remove('hidden');
    if (btnText) btnText.textContent = 'Скопійовано';
    
    button.classList.add('bg-emerald-100', 'text-emerald-700', 'border-emerald-200');
    
    setTimeout(() => {
      if (copyIcon) copyIcon.classList.remove('hidden');
      if (checkIcon) checkIcon.classList.add('hidden');
      if (btnText) btnText.textContent = 'Копіювати';
      button.classList.remove('bg-emerald-100', 'text-emerald-700', 'border-emerald-200');
    }, 2000);
  });
}

/**
 * Logout handler
 */
function handleLogout() {
  localStorage.removeItem('user_session');
  localStorage.removeItem('userPhone');
  localStorage.removeItem('customToken');
  
  console.log('👋 User logged out');
  window.location.href = './index.html';
}

// ============================================
// PERSONAL PROMO CODES
// ============================================

/**
 * Load personal promo codes for current user
 */
async function loadPersonalPromoCodes() {
  console.log('🎟️ Loading personal promo codes...');
  
  const promosContainer = document.getElementById('content-promos');
  if (!promosContainer) return;
  
  try {
    // Get all phone variants for current user
    const phoneVariants = getPhoneVariants(currentUser.phone);
    console.log('🔍 Searching personal promos for phones:', phoneVariants);
    
    const personalPromosRef = collection(db, 'personal_promocodes');
    let allPromos = [];
    
    // Query for each phone format
    for (const phoneVariant of phoneVariants) {
      try {
        const promoQuery = query(
          personalPromosRef,
          where('targetPhone', '==', phoneVariant),
          where('isActive', '==', true)
        );
        
        const snapshot = await getDocs(promoQuery);
        
        if (!snapshot.empty) {
          snapshot.forEach(docSnap => {
            if (!allPromos.find(p => p.id === docSnap.id)) {
              allPromos.push({ id: docSnap.id, ...docSnap.data() });
            }
          });
          console.log(`✅ Found ${snapshot.size} personal promos for: ${phoneVariant}`);
        }
      } catch (queryError) {
        console.warn(`⚠️ Query failed for ${phoneVariant}:`, queryError.message);
      }
    }
    
    // Render promos or show empty state
    renderPersonalPromos(allPromos);
    
  } catch (error) {
    console.error('❌ Error loading personal promos:', error);
    renderPersonalPromos([]);
  }
}

/**
 * Render personal promo codes or empty state
 */
function renderPersonalPromos(promos) {
  const container = document.getElementById('content-promos');
  if (!container) return;
  
  // Filter out expired promos - client should NEVER see them
  const now = new Date();
  const validPromos = promos.filter(promo => {
    // Skip used promos
    if (promo.isUsed === true) return false;
    
    // Skip expired promos
    if (promo.expiryDate) {
      const expDate = promo.expiryDate.toDate ? promo.expiryDate.toDate() : new Date(promo.expiryDate);
      if (expDate < now) {
        console.log(`🚫 Hiding expired promo from client: ${promo.code}`);
        return false;
      }
    }
    return true;
  });
  
  if (validPromos.length === 0) {
    // Empty state
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center text-center py-12 px-4">
        <div class="text-7xl mb-6 animate-bounce">🌶️</div>
        <h3 class="text-xl font-bold text-foreground mb-3">Ой, тут поки пусто! 🌶️</h3>
        <p class="text-gray-500 max-w-md leading-relaxed">
          Ми ще не нарахували вам персональних знижок, але готуємо щось гостреньке. Слідкуйте за новинами!
        </p>
      </div>
    `;
    return;
  }
  
  // Render promo cards
  const promoCardsHTML = validPromos.map(promo => {
    const discount = promo.discount || promo.value || 0;
    const code = promo.code || 'PROMO';
    const isUsed = promo.isUsed === true;
    
    // Get expiry info (we already filtered expired ones, but still format for display)
    let expiryText = '';
    if (promo.expiryDate) {
      const expDate = promo.expiryDate.toDate ? promo.expiryDate.toDate() : new Date(promo.expiryDate);
      expiryText = expDate.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    
    // Min order amount
    const minOrderAmount = promo.minOrderAmount || 0;
    
    // Format creation date if available
    let dateText = '';
    if (promo.createdAt) {
      const date = promo.createdAt.toDate ? promo.createdAt.toDate() : new Date(promo.createdAt);
      dateText = date.toLocaleDateString('uk-UA', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    
    // All visible promos are active (we filtered out used/expired)
    return `
      <div class="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30 border-2 border-dashed rounded-2xl p-6 relative overflow-hidden">
        
        <!-- Discount Badge -->
        <div class="flex items-center gap-3 mb-4">
          <div class="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
            <span class="text-white font-bold text-lg">₴</span>
          </div>
          <div>
            <p class="text-3xl font-black text-primary">${discount} грн</p>
            <p class="text-sm text-muted-foreground">знижка на замовлення</p>
          </div>
        </div>
        
        <!-- Conditions: Expiry & Min Order -->
        ${expiryText || minOrderAmount > 0 ? `
        <div class="bg-white/50 rounded-xl p-3 mb-3 space-y-1">
          ${expiryText ? `
            <p class="text-xs flex items-center gap-2 text-muted-foreground">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              Дійсний до: ${expiryText}
            </p>
          ` : ''}
          ${minOrderAmount > 0 ? `
            <p class="text-xs flex items-center gap-2 text-muted-foreground">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
              Мін. замовлення: ${minOrderAmount} грн
            </p>
          ` : ''}
        </div>
        ` : ''}
        
        <!-- Code -->
        <div class="bg-white/70 rounded-xl p-4 mb-4 backdrop-blur-sm">
          <p class="text-xs text-muted-foreground uppercase tracking-wider mb-1">Ваш промокод</p>
          <div class="flex items-center justify-between gap-3">
            <code class="text-2xl font-mono font-bold text-foreground tracking-widest">${code}</code>
            <button 
              onclick="copyCode('${code}', this)" 
              class="flex items-center gap-2 px-4 py-2 bg-card hover:bg-muted border border-border rounded-xl transition-all text-sm font-medium"
            >
              <svg class="w-4 h-4 copy-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
              </svg>
              <svg class="w-4 h-4 check-icon hidden text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span class="btn-text">Копіювати</span>
            </button>
          </div>
        </div>
        
        <!-- Info -->
        <div class="flex items-center justify-between text-sm">
          <span class="text-muted-foreground">
            <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Персональна знижка
          </span>
          ${dateText ? `<span class="text-muted-foreground">${dateText}</span>` : ''}
        </div>
      </div>
    `;
  }).join('');
  
  container.innerHTML = `
    <div class="mb-6">
      <h3 class="text-lg font-bold text-foreground mb-1">Ваші персональні промокоди</h3>
      <p class="text-sm text-muted-foreground">Використайте ці коди при оформленні замовлення для отримання знижки</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      ${promoCardsHTML}
    </div>
  `;
  
  console.log(`🎟️ Rendered ${promos.length} personal promo cards`);
}

// ============================================
// FLOATING SUPPORT WIDGET (Telegram)
// ============================================
/**
 * Render floating Telegram support button in bottom-right corner
 */
function renderSupportWidget() {
  // Check if already rendered
  if (document.getElementById('support-widget')) {
    console.log('💬 Support widget already exists');
    return;
  }
  
  const widget = document.createElement('a');
  widget.id = 'support-widget';
  widget.href = 'https://t.me/sales_latiao';
  widget.target = '_blank';
  widget.rel = 'noopener noreferrer';
  widget.className = `
    fixed bottom-6 right-6 z-50
    flex items-center gap-3
    px-5 py-3
    bg-gradient-to-r from-[#24A1DE] to-[#0088CC]
    text-white font-medium text-sm
    rounded-full
    shadow-lg shadow-blue-500/30
    hover:shadow-xl hover:shadow-blue-500/40
    hover:scale-105
    active:scale-95
    transition-all duration-300 ease-out
    group
  `.replace(/\s+/g, ' ').trim();
  
  widget.innerHTML = `
    <!-- Telegram Icon -->
    <div class="relative">
      <svg class="w-6 h-6 transition-transform group-hover:rotate-12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.03-1.99 1.27-5.62 3.72-.53.36-1.01.54-1.44.53-.47-.01-1.38-.27-2.06-.49-.83-.27-1.49-.42-1.43-.88.03-.24.37-.49 1.02-.74 3.99-1.74 6.65-2.88 7.98-3.44 3.8-1.58 4.59-1.86 5.1-1.87.11 0 .37.03.53.17.14.12.18.28.2.46-.01.06.01.24 0 .38z" fill="white"/>
      </svg>
      <!-- Pulse animation -->
      <span class="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse border-2 border-white"></span>
    </div>
    
    <!-- Text -->
    <span class="hidden sm:inline whitespace-nowrap">
      Є питання? Напишіть нам
    </span>
    
    <!-- Mobile: Short text -->
    <span class="sm:hidden whitespace-nowrap">
      Підтримка
    </span>
  `;
  
  document.body.appendChild(widget);
  console.log('💬 Support widget rendered');
}

// ============================================
// EVENT LISTENERS
// ============================================

// Close modal on backdrop click
document.addEventListener('click', (e) => {
  const modal = document.getElementById('order-details-modal');
  if (modal && e.target === modal) {
    closeOrderModal();
  }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeOrderModal();
  }
});

// Initialize Lucide icons when available
if (typeof lucide !== 'undefined') {
  lucide.createIcons();
}

// ============================================
// CART BADGE SYNC (uses layout.js cart)
// ============================================

const CART_KEY = 'latiao_cart';

/**
 * Update cart badge in header (rendered by layout.js)
 * This ensures badge shows correct count after dashboard.js loads
 */
function updateAllCartBadges() {
  const cartData = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  const totalItems = cartData.reduce((sum, item) => sum + (item.quantity || 1), 0);
  
  // Update header badge (from layout.js)
  const headerBadge = document.getElementById('cart-badge');
  if (headerBadge) {
    headerBadge.textContent = totalItems;
    if (totalItems === 0) {
      headerBadge.classList.add('hidden');
    } else {
      headerBadge.classList.remove('hidden');
    }
  }
  
  console.log('🛒 Cart badge updated:', totalItems, 'items');
}

/**
 * Initialize cart badge sync
 */
function initCartBadgeSync() {
  // Initial update
  updateAllCartBadges();
  
  // Retry after layout.js renders
  setTimeout(updateAllCartBadges, 100);
  setTimeout(updateAllCartBadges, 500);
  setTimeout(updateAllCartBadges, 1000);
  
  // Listen for cart updates
  window.addEventListener('storage', (e) => {
    if (e.key === CART_KEY) {
      updateAllCartBadges();
    }
  });
  
  window.addEventListener('cartUpdated', updateAllCartBadges);
  
  // MutationObserver for header badge
  const observer = new MutationObserver(() => {
    if (document.getElementById('cart-badge')) {
      updateAllCartBadges();
      observer.disconnect();
    }
  });
  
  if (!document.getElementById('cart-badge')) {
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 5000);
  }
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', initCartBadgeSync);

// ============================================
// EXPORTS (for global access)
// ============================================
window.openOrderModal = openOrderModal;
window.closeOrderModal = closeOrderModal;
window.switchTab = switchTab;
window.copyCode = copyCode;
window.handleLogout = handleLogout;
window.loadPersonalPromoCodes = loadPersonalPromoCodes;
window.updateAllCartBadges = updateAllCartBadges;
