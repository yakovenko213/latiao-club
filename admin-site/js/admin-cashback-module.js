/**
 * ============================================
 * 🪙 CASHBACK MODULE - Admin Panel
 * ============================================
 * 
 * This module handles all cashback-related functionality:
 * - Settings management (enable/disable, percentage, limits)
 * - Statistics calculation and display
 * - Client list with balances
 * - Manual credit/debit operations
 * - Audit and backfill utilities
 * 
 * Dependencies:
 * - Firebase (db, auth, Firestore functions)
 * - showNotification() - global notification function
 * - lucide - icon library
 */

(function() {
  'use strict';

  // ============================================
  // 🚀 MODULE LOAD DIAGNOSTIC
  // ============================================
  console.log("🚀 [CASHBACK_MODULE] File loaded successfully at " + new Date().getTime());
  console.log("🚀 [CASHBACK_MODULE] Module initialized at", new Date().toISOString());

  // ============================================
  // NOTIFICATION FALLBACK
  // ============================================
  const notify = (msg, type) => {
    if (typeof window.showNotification === 'function') {
      window.showNotification(msg, type);
    } else {
      const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
      console.log(`${prefix} [Notification fallback]: ${msg}`);
    }
  };

  // ============================================
  // DOM HELPER - Safe Element Update
  // ============================================
  const safeSetText = (id, value, context = '') => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = value;
      return true;
    } else {
      console.warn(`⚠️ [Cashback${context}] Element #${id} not found`);
      return false;
    }
  };

  // ============================================
  // TRANSACTION TYPE CONSTANTS
  // ============================================

  const TRANSACTION_TYPES = {
    EARNED: 'EARNED',                   // Cashback awarded after purchase
    USED_FOR_ORDER: 'USED_FOR_ORDER',   // Cashback used as discount on order
    ADMIN_ADJUSTMENT: 'ADMIN_ADJUSTMENT' // Manual admin credit/debit
  };

  // ============================================
  // MODULE STATE
  // ============================================

  let currentClientForCashback = null;
  let allCashbackClients = [];
  let filteredCashbackClients = [];
  let currentPage = 1;
  const itemsPerPage = 20;
  let currentSortField = null;
  let currentSortDirection = 'asc';
  
  // Firestore Pagination State
  let totalClientsCount = 0;
  let firstVisibleDoc = null;
  let lastVisibleDoc = null;
  let pageStack = []; // Stack to track page cursors for backward navigation
  let hasMorePages = false;

  // ============================================
  // 🪙 CASHBACK SETTINGS
  // ============================================

  /**
   * Load cashback settings from Firestore
   */
  window.loadCashbackSettings = async function() {
    try {
      console.log('🪙 [Cashback] Loading settings from Firestore...');
      
      // EXPLICIT CONFIG FETCH from settings/cashback_config
      const configDoc = await getDoc(doc(db, 'settings', 'cashback_config'));
      
      if (configDoc.exists()) {
        const data = configDoc.data();
        const isEnabled = data.isCashbackEnabled !== false;
        const percent = Number(data.cashbackPercent || 8);
        const maxEarnLimit = Number(data.maxCashbackPerOrder || 0);
        
        document.getElementById('cashback-enabled-toggle').checked = isEnabled;
        document.getElementById('cashback-percent-input').value = percent;
        document.getElementById('cashback-max-earn-input').value = maxEarnLimit;
        
        console.log('✅ [Cashback] Settings loaded:', { isEnabled, percent, maxEarnLimit });
      } else {
        console.warn('⚠️ [Cashback] Config document not found, using defaults');
        document.getElementById('cashback-enabled-toggle').checked = true;
        document.getElementById('cashback-percent-input').value = 8;
        document.getElementById('cashback-max-earn-input').value = 0;
      }
      
    } catch (error) {
      console.error('❌ [Cashback] Error loading settings:', error);
      notify('Помилка завантаження налаштувань кешбеку', 'error');
    }
  };

  /**
   * Save cashback settings to Firestore
   */
  window.saveCashbackSettings = async function() {
    try {
      console.log('💾 [Cashback] Saving settings...');
      
      const toggle = document.getElementById('cashback-enabled-toggle');
      const percentInput = document.getElementById('cashback-percent-input');
      const maxEarnInput = document.getElementById('cashback-max-earn-input');
      
      if (!toggle || !percentInput) {
        throw new Error('UI elements not found');
      }
      
      const isCashbackEnabled = toggle.checked;
      const cashbackPercent = Number(parseFloat(percentInput.value));
      const maxEarnLimit = Number(parseInt(maxEarnInput?.value) || 0);
      
      if (isNaN(cashbackPercent) || cashbackPercent < 0 || cashbackPercent > 100) {
        notify('❌ Невірний відсоток. Введіть значення від 0 до 100', 'error');
        return;
      }
      
      // Save to settings/cashback_config
      await setDoc(doc(db, 'settings', 'cashback_config'), {
        isCashbackEnabled: isCashbackEnabled,
        cashbackPercent: cashbackPercent,
        maxCashbackPerOrder: maxEarnLimit,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      // Also save to config/general_config for backwards compatibility
      await setDoc(doc(db, 'config', 'general_config'), {
        isCashbackEnabled: isCashbackEnabled,
        cashbackPercent: cashbackPercent,
        maxEarnLimit: maxEarnLimit,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      console.log('✅ [Cashback] Settings saved successfully:', {
        isCashbackEnabled,
        cashbackPercent,
        maxEarnLimit
      });
      
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl z-[100] flex items-center gap-3 animate-slide-in';
      toast.innerHTML = `
        <i data-lucide="check-circle" class="w-6 h-6"></i>
        <div>
          <p class="font-bold">Налаштування кешбеку збережено! ✅</p>
          <p class="text-sm text-green-100">Зміни застосовані миттєво на всіх сторінках</p>
        </div>
      `;
      document.body.appendChild(toast);
      lucide.createIcons();
      
      setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out forwards';
        setTimeout(() => toast.remove(), 300);
      }, 3000);
      
    } catch (error) {
      console.error('❌ [Cashback] Error saving settings:', error);
      notify('Помилка збереження: ' + error.message, 'error');
    }
  };

  // ============================================
  // � CASHBACK CALCULATION WITH RULES ENFORCEMENT
  // ============================================
  
  /**
   * Fetch latest cashback config and calculate cashback with all constraints
   * @param {number} orderTotal - The order total amount
   * @returns {Promise<Object>} - { finalCashback, potentialCashback, isEnabled, percent, maxLimit, isCapped }
   */
  window.calculateOrderCashbackWithRules = async function(orderTotal) {
    try {
      // STEP 1: EXPLICIT CONFIG FETCH from settings/cashback_config
      console.log('💰 [CASHBACK_CALC] Fetching latest config from settings/cashback_config...');
      const configDoc = await getDoc(doc(db, 'settings', 'cashback_config'));
      
      // STEP 2: STRICT DATA TYPE SAFETY with defaults
      const settings = configDoc.exists() ? configDoc.data() : {};
      const isEnabled = settings.isCashbackEnabled !== false;
      const cashbackPercent = Number(settings.cashbackPercent || 5);
      const maxCashbackPerOrder = Number(settings.maxCashbackPerOrder || 0);
      
      // Convert orderTotal to number
      const orderTotalNum = Number(orderTotal);
      
      console.log('💰 [CASHBACK_CALC] Config loaded:', {
        isEnabled,
        cashbackPercent: cashbackPercent + '%',
        maxCashbackPerOrder: maxCashbackPerOrder + ' грн',
        orderTotal: orderTotalNum + ' грн'
      });
      
      // STEP 3: Calculate potential cashback
      let amount = Math.floor(orderTotalNum * (cashbackPercent / 100));
      const potentialCashback = amount;
      
      // 📏 [MODULE DEBUG] Log calculation step
      console.log(`📏 [MODULE] Calculating for ${orderTotalNum} грн at ${cashbackPercent}% = ${amount} грн`);
      
      // STEP 4: STRICT CAPPING LOGIC - Apply Max Limit
      let isCapped = false;
      if (maxCashbackPerOrder > 0 && amount > maxCashbackPerOrder) {
        console.log(`📏 [MODULE] BEFORE cap: ${amount} грн, Limit: ${maxCashbackPerOrder} грн`);
        amount = maxCashbackPerOrder;
        isCapped = true;
        console.log(`⚠️ [CASHBACK_CALC] ✂️ LIMIT REACHED: ${potentialCashback} → ${maxCashbackPerOrder} грн`);
        console.log(`📏 [MODULE] AFTER cap: ${amount} грн`);
      }
      
      // STEP 5: Check if enabled
      if (!isEnabled) {
        amount = 0;
        console.log('⚠️ [CASHBACK_CALC] Cashback is DISABLED - setting to 0');
      }
      
      // STEP 6: ENFORCED LOGGING
      console.log(`📏 [MODULE] Result after limits: ${amount} грн (was ${potentialCashback} грн)`);
      console.log(`💰 [CASHBACK ENFORCED] Order: ${orderTotalNum} грн | Final Amount: ${amount} грн`);
      console.log(`💰 [CASHBACK_LOG] Total: ${orderTotalNum} грн, Calculated: ${potentialCashback} грн, Final (capped): ${amount} грн`);
      
      return {
        finalCashback: amount,
        potentialCashback: potentialCashback,
        isEnabled: isEnabled,
        percent: cashbackPercent,
        maxLimit: maxCashbackPerOrder,
        isCapped: isCapped
      };
      
    } catch (error) {
      console.error('❌ [CASHBACK_CALC] Error fetching config:', error);
      // Return safe defaults on error
      return {
        finalCashback: 0,
        potentialCashback: 0,
        isEnabled: false,
        percent: 0,
        maxLimit: 0,
        isCapped: false,
        error: error.message
      };
    }
  };

  // ============================================
  // �📊 CASHBACK STATISTICS
  // ============================================

  /**
   * Load and display cashback statistics
   */
  window.loadCashbackStatistics = async function() {
    console.log('📊 [Cashback Stats] Loading statistics...');
    
    // ============================================
    // INITIALIZATION GUARD - Check if elements exist
    // ============================================
    const loadingEl = document.getElementById('cashback-stats-loading');
    const contentEl = document.getElementById('cashback-stats-content');
    
    // Exit early if we're not on the cashback view
    if (!loadingEl || !contentEl) {
      console.warn('⚠️ [Cashback Stats] View elements not found - skipping load');
      return;
    }
    
    if (loadingEl) loadingEl.classList.remove('hidden');
    if (contentEl) contentEl.classList.add('opacity-50', 'pointer-events-none');
    
    await refreshCashbackStats();
    
    if (loadingEl) loadingEl.classList.add('hidden');
    if (contentEl) contentEl.classList.remove('opacity-50', 'pointer-events-none');
    
    lucide.createIcons();
    console.log('✅ [Cashback Stats] Statistics loaded');
  };

  /**
   * Calculate and refresh cashback statistics
   */
  async function refreshCashbackStats() {
    console.time('⏱️ StatsCalc');
    
    try {
      console.log('🔐 [Auth Check] Verifying admin permissions...');
      
      if (!auth || !auth.currentUser) {
        throw new Error('🔐 Ви не авторизовані. Будь ласка, увійдіть в систему.');
      }
      
      const userEmail = auth.currentUser.email;
      console.log('👤 Current user:', userEmail);
      console.log('🔢 [Cashback Stats] Starting calculation...');
      
      let totalAwarded = 0;
      let totalSpent = 0;
      let totalRevenue = 0;
      let paidOrdersCount = 0;
      let ordersWithCashbackUsed = 0;
      let adminAdjustments = 0; // Track manual adjustments separately
      
      const PAID_STATUSES = [
        'paid', 
        '💰 Оплачено',
        'completed', 
        'delivered', 
        'shipped', 
        'received',
        'Виконано',
        'Доставлено'
      ];
      
      const CANCELLED_STATUSES = [
        'cancelled',
        'Скасовано',
        '❌ Скасовано'
      ];
      
      // ============================================
      // STEP 1: Load Transactions (Correct Method)
      // ============================================
      console.log('📥 [Step 1] Fetching cashback_transactions...');
      
      try {
        const transactionsRef = collection(db, 'cashback_transactions');
        const transactionsSnapshot = await getDocs(transactionsRef);
        
        console.log(`📦 Total transactions: ${transactionsSnapshot.size}`);
        
        transactionsSnapshot.forEach((docSnap) => {
          const tx = docSnap.data();
          const type = tx.type;
          const amount = Number(tx.amount || 0);
          
          if (type === TRANSACTION_TYPES.EARNED || type === 'EARNED') {
            totalAwarded += amount;
          } else if (type === TRANSACTION_TYPES.USED_FOR_ORDER || type === 'USED_FOR_ORDER') {
            totalSpent += Math.abs(amount);
            ordersWithCashbackUsed++;
          } else if (type === TRANSACTION_TYPES.ADMIN_ADJUSTMENT || type === 'ADMIN_ADJUSTMENT') {
            // Track admin adjustments separately - do NOT include in totalSpent
            adminAdjustments += amount;
          }
        });
        
        console.log('📊 [Transaction Stats]', {
          totalAwarded,
          totalSpent,
          adminAdjustments,
          ordersWithCashbackUsed
        });
        
      } catch (txError) {
        console.warn('⚠️ [Cashback Stats] cashback_transactions not found, falling back to orders...');
      }
      
      // ============================================
      // STEP 2: Fallback to Orders (for backward compatibility)
      // ============================================
      console.log('📥 [Step 2] Fetching orders for revenue calculation...');
      const ordersRef = collection(db, 'orders');
      const ordersSnapshot = await getDocs(ordersRef);
      
      console.log(`📦 Total orders in collection: ${ordersSnapshot.size}`);
      
      ordersSnapshot.forEach((docSnap) => {
        const order = docSnap.data();
        const orderId = docSnap.id;
        const status = order.status || 'pending';
        
        const isPaidStatus = PAID_STATUSES.some(s => status.toLowerCase().includes(s.toLowerCase()));
        const isCancelled = CANCELLED_STATUSES.some(s => status.toLowerCase().includes(s.toLowerCase()));
        
        // Count awarded cashback from paid orders (if not already counted from transactions)
        if (isPaidStatus && !isCancelled) {
          const pointsEarned = Number(order.pointsEarned || 0);
          if (pointsEarned > 0) {
            paidOrdersCount++;
          }
        }
        
        // Calculate revenue from orders where cashback was used
        const cashbackUsed = Number(order.appliedCashback || order.cashbackUsed || 0);
        if (cashbackUsed > 0) {
          const orderTotal = Number(order.total || order.totalPrice || 0);
          if (orderTotal > 0) {
            totalRevenue += orderTotal;
          }
        }
      });
      
      const usageRatio = totalAwarded > 0 ? ((totalSpent / totalAwarded) * 100) : 0;
      
      console.log('📊 [Final Stats]', {
        totalAwarded,
        totalSpent,
        usageRatio: usageRatio.toFixed(2) + '%',
        totalRevenue,
        paidOrdersCount,
        ordersWithCashbackUsed
      });
      
      // ============================================
      // DEBUGGING: Log data before UI update
      // ============================================
      const statsData = {
        awarded: Math.floor(totalAwarded),
        spent: Math.floor(totalSpent),
        percentage: usageRatio.toFixed(1),
        revenue: Math.floor(totalRevenue)
      };
      console.log('📊 [CASHBACK] Data for UI:', statsData);
      
      // ============================================
      // UPDATE UI WITH NULL-SAFETY (Correct HTML IDs)
      // ============================================
      safeSetText('stat-awarded', Math.floor(totalAwarded).toLocaleString('uk-UA'), ' Stats');
      safeSetText('stat-spent', Math.floor(totalSpent).toLocaleString('uk-UA'), ' Stats');
      safeSetText('stat-percentage', usageRatio.toFixed(1), ' Stats'); // Note: % removed (HTML has separate text)
      safeSetText('stat-revenue', Math.floor(totalRevenue).toLocaleString('uk-UA'), ' Stats');
      
      console.timeEnd('⏱️ StatsCalc');
      
    } catch (error) {
      console.error('❌ [Cashback Stats] Error:', error);
      notify('Помилка завантаження статистики: ' + error.message, 'error');
      console.timeEnd('⏱️ StatsCalc');
    }
  }

  // ============================================
  // 👥 CASHBACK CLIENTS LIST
  // ============================================

  /**
   * Get total count of clients with cashback
   */
  async function getTotalCashbackClientsCount() {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      
      let count = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        const cashbackBalance = Number(data.cashbackBalance || 0);
        const totalAwarded = Number(data.totalCashbackAwarded || 0);
        const totalUsed = Number(data.totalCashbackUsed || 0);
        
        // Count users who have any cashback activity
        if (cashbackBalance > 0 || totalAwarded > 0 || totalUsed > 0) {
          count++;
        }
      });
      
      return count;
    } catch (error) {
      console.error('❌ Error counting cashback clients:', error);
      return 0;
    }
  }

  /**
   * Load and display cashback clients list with pagination
   */
  window.loadCashbackClients = async function(pageDirection = 'first') {
    console.log('👥 [Cashback Clients] Loading clients... (direction:', pageDirection, ')');
    
    const loadingEl = document.getElementById('cashback-clients-loading');
    const emptyEl = document.getElementById('cashback-clients-empty');
    const contentEl = document.getElementById('cashback-clients-content');
    const paginationEl = document.getElementById('cashback-clients-pagination');
    
    if (loadingEl) loadingEl.classList.remove('hidden');
    if (emptyEl) emptyEl.classList.add('hidden');
    if (contentEl) contentEl.classList.add('hidden');
    if (paginationEl) paginationEl.classList.add('hidden');
    
    try {
      // Get total count on first load
      if (pageDirection === 'first') {
        console.log('👥 [Cashback Clients] Counting total clients with cashback...');
        totalClientsCount = await getTotalCashbackClientsCount();
        console.log('👥 [Cashback Clients] Total clients with cashback:', totalClientsCount);
        currentPage = 1;
        pageStack = [];
      }
      
      console.log('👥 [Cashback Clients] Fetching page', currentPage);
      
      // Build query for users
      const usersRef = collection(db, 'users');
      let usersQuery = query(usersRef, limit(itemsPerPage + 1)); // +1 to check if there are more pages
      
      // If navigating to next page, start after last visible document
      if (pageDirection === 'next' && lastVisibleDoc) {
        usersQuery = query(usersRef, startAfter(lastVisibleDoc), limit(itemsPerPage + 1));
      }
      // If navigating to previous page, use the stored cursor
      else if (pageDirection === 'prev' && pageStack.length > 0) {
        const prevCursor = pageStack[pageStack.length - 1];
        if (prevCursor) {
          usersQuery = query(usersRef, startAfter(prevCursor), limit(itemsPerPage + 1));
        } else {
          // First page
          usersQuery = query(usersRef, limit(itemsPerPage + 1));
        }
      }
      
      const usersSnapshot = await getDocs(usersQuery);
      console.log('👥 [Cashback Clients] Fetched', usersSnapshot.size, 'users from Firestore');
      
      // Check if there are more pages
      hasMorePages = usersSnapshot.size > itemsPerPage;
      const usersToProcess = hasMorePages ? 
        Array.from(usersSnapshot.docs).slice(0, itemsPerPage) : 
        usersSnapshot.docs;
      
      // Fetch all orders for order count (can be optimized later with a separate orders index)
      console.log('👥 [Cashback Clients] Fetching orders...');
      const ordersRef = collection(db, 'orders');
      const ordersSnapshot = await getDocs(ordersRef);
      console.log('👥 [Cashback Clients] Found', ordersSnapshot.size, 'orders');
      
      const normalizePhone = (phone) => {
        if (!phone) return null;
        const digits = phone.replace(/\D/g, '');
        if (digits.length === 10) {
          return '+38' + digits;
        }
        if (digits.length === 12 && digits.startsWith('38')) {
          return '+' + digits;
        }
        return phone;
      };
      
      const ordersByUser = {};
      ordersSnapshot.forEach((doc) => {
        const order = doc.data();
        let phone = order.customer?.phone || order.phone || order.userId;
        
        if (!phone) return;
        
        phone = normalizePhone(phone);
        
        if (!ordersByUser[phone]) {
          ordersByUser[phone] = {
            count: 0,
            customerName: order.customer?.name || order.customer?.fullName || order.customerName || null
          };
        }
        
        if (!ordersByUser[phone].customerName && (order.customer?.name || order.customer?.fullName)) {
          ordersByUser[phone].customerName = order.customer.name || order.customer.fullName;
        }
        
        ordersByUser[phone].count++;
      });
      
      const clients = [];
      usersToProcess.forEach((doc) => {
        const userData = doc.data();
        const phone = doc.id;
        
        const cashbackBalance = Number(userData.cashbackBalance || 0);
        const totalAwarded = Number(userData.totalCashbackAwarded || 0);
        const totalUsed = Number(userData.totalCashbackUsed || 0);
        
        // Only include users with cashback activity
        if (cashbackBalance === 0 && totalAwarded === 0 && totalUsed === 0) {
          return;
        }
        
        let orderCount = 0;
        let customerName = userData.fullName || userData.name || null;
        
        const normalizedPhone = normalizePhone(phone);
        if (ordersByUser[normalizedPhone]) {
          orderCount = ordersByUser[normalizedPhone].count;
          if (!customerName && ordersByUser[normalizedPhone].customerName) {
            customerName = ordersByUser[normalizedPhone].customerName;
          }
        }
        
        if (!customerName) {
          customerName = phone;
        }
        
        clients.push({
          phone: phone,
          fullName: customerName,
          currentBalance: cashbackBalance,
          totalAwarded: totalAwarded,
          totalUsed: totalUsed,
          orderCount: orderCount,
          registeredAt: userData.createdAt || userData.registeredAt || null,
          _doc: doc // Store the document for pagination
        });
      });
      
      // Sort by balance descending
      clients.sort((a, b) => b.currentBalance - a.currentBalance);
      
      // Store pagination cursors
      if (clients.length > 0) {
        firstVisibleDoc = usersToProcess[0];
        lastVisibleDoc = usersToProcess[usersToProcess.length - 1];
      }
      
      allCashbackClients = clients;
      filteredCashbackClients = [...clients];
      
      console.log('✅ [Cashback Clients] Loaded', clients.length, 'clients for page', currentPage);
      
      if (clients.length === 0 && currentPage === 1) {
        if (loadingEl) loadingEl.classList.add('hidden');
        if (emptyEl) emptyEl.classList.remove('hidden');
        if (contentEl) contentEl.classList.add('hidden');
        if (paginationEl) paginationEl.classList.add('hidden');
      } else {
        if (loadingEl) loadingEl.classList.add('hidden');
        if (emptyEl) emptyEl.classList.add('hidden');
        if (contentEl) contentEl.classList.remove('hidden');
        if (paginationEl) paginationEl.classList.remove('hidden');
        
        displayCashbackClients();
      }
      
      lucide.createIcons();
      
    } catch (error) {
      console.error('❌ [Cashback Clients] Error:', error);
      notify('Помилка завантаження клієнтів: ' + error.message, 'error');
      
      if (loadingEl) loadingEl.classList.add('hidden');
      if (emptyEl) emptyEl.classList.remove('hidden');
      if (paginationEl) paginationEl.classList.add('hidden');
    }
  };

  /**
   * Display cashback clients
   */
  function displayCashbackClients() {
    const tbody = document.getElementById('cashback-clients-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    
    filteredCashbackClients.forEach((client, index) => {
      const globalIndex = startIndex + index + 1;
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="text-center text-gray-600">${globalIndex}</td>
        <td>
          <div class="font-semibold text-gray-900">${client.fullName}</div>
          <div class="text-xs text-gray-500">${client.phone}</div>
        </td>
        <td class="text-center">
          <span class="font-bold text-green-600">${client.currentBalance.toFixed(0)} грн</span>
        </td>
        <td class="text-center text-gray-700">${client.totalAwarded.toFixed(0)} грн</td>
        <td class="text-center text-gray-700">${client.totalUsed.toFixed(0)} грн</td>
        <td class="text-center text-gray-600">${client.orderCount}</td>
        <td class="text-center">
          <div class="flex items-center justify-center gap-2">
            <button 
              onclick="window.openManualCashbackModal(${JSON.stringify(client).replace(/"/g, '&quot;')})"
              class="cashback-action-btn cashback-action-btn-credit"
              title="Нарахувати кешбек">
              <i data-lucide="plus-circle" class="w-4 h-4"></i>
            </button>
            <button 
              onclick="window.openDebitCashbackModal(${JSON.stringify(client).replace(/"/g, '&quot;')})"
              class="cashback-action-btn cashback-action-btn-edit"
              title="Списати кешбек">
              <i data-lucide="minus-circle" class="w-4 h-4"></i>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });
    
    // Update pagination info
    const totalPages = Math.ceil(totalClientsCount / itemsPerPage);
    const endIndex = Math.min(startIndex + filteredCashbackClients.length, totalClientsCount);
    
    safeSetText('clients-showing-start', startIndex + 1, ' Pagination');
    safeSetText('clients-showing-end', endIndex, ' Pagination');
    safeSetText('clients-total-count', totalClientsCount, ' Pagination');
    safeSetText('clients-current-page', currentPage, ' Pagination');
    safeSetText('clients-total-pages', totalPages, ' Pagination');
    
    // Update button states
    const prevBtn = document.getElementById('clients-prev-page');
    const nextBtn = document.getElementById('clients-next-page');
    
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = !hasMorePages;
    
    lucide.createIcons();
  }

  /**
   * Navigate to next page
   */
  window.nextCashbackClientsPage = async function() {
    if (!hasMorePages) return;
    
    console.log('📄 [Pagination] Moving to next page');
    
    // Store current first document for backward navigation
    if (firstVisibleDoc) {
      pageStack.push(firstVisibleDoc);
    }
    
    currentPage++;
    await window.loadCashbackClients('next');
  };

  /**
   * Navigate to previous page
   */
  window.prevCashbackClientsPage = async function() {
    if (currentPage === 1) return;
    
    console.log('📄 [Pagination] Moving to previous page');
    
    // Remove the last cursor from stack
    pageStack.pop();
    
    currentPage--;
    await window.loadCashbackClients('prev');
  };

  /**
   * Filter clients by search query
   * Note: With Firestore pagination, filtering is done on current page only.
   * For full search across all pages, consider implementing a separate search function.
   */
  function filterCashbackClients(searchQuery) {
    console.log('🔍 [Filter] Searching for:', searchQuery);
    
    if (!searchQuery || searchQuery.trim() === '') {
      filteredCashbackClients = [...allCashbackClients];
    } else {
      const query = searchQuery.toLowerCase().trim();
      filteredCashbackClients = allCashbackClients.filter(client => {
        const nameMatch = client.fullName.toLowerCase().includes(query);
        const phoneMatch = client.phone.toLowerCase().includes(query);
        return nameMatch || phoneMatch;
      });
    }
    
    console.log(`🔍 [Filter] Found ${filteredCashbackClients.length} of ${allCashbackClients.length} clients on current page`);
    
    displayCashbackClients();
  }

  // ============================================
  // 💳 MANUAL CASHBACK OPERATIONS
  // ============================================

  /**
   * Open manual cashback credit modal
   */
  window.openManualCashbackModal = function(client) {
    console.log('💳 [Manual Cashback] Opening modal for:', client.fullName);
    
    currentClientForCashback = client;
    
    safeSetText('modal-client-name', client.fullName, ' Modal');
    safeSetText('modal-client-phone', client.phone, ' Modal');
    safeSetText('modal-client-balance', client.currentBalance.toFixed(0) + ' грн', ' Modal');
    
    document.getElementById('manual-cashback-amount').value = '';
    document.getElementById('manual-cashback-comment').value = '';
    
    const modal = document.getElementById('manual-cashback-modal');
    if (modal) {
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
    
    lucide.createIcons();
  };

  /**
   * Close manual cashback modal
   */
  window.closeManualCashbackModal = function() {
    const modal = document.getElementById('manual-cashback-modal');
    if (modal) {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    }
    currentClientForCashback = null;
  };

  /**
   * Open debit cashback modal
   */
  window.openDebitCashbackModal = function(client) {
    console.log('💳 [Debit Cashback] Opening modal for:', client.fullName);
    
    currentClientForCashback = client;
    
    safeSetText('debit-modal-client-name', client.fullName, ' Debit Modal');
    safeSetText('debit-modal-client-phone', client.phone, ' Debit Modal');
    safeSetText('debit-modal-client-balance', client.currentBalance.toFixed(0) + ' грн', ' Debit Modal');
    
    document.getElementById('debit-cashback-amount').value = '';
    document.getElementById('debit-cashback-comment').value = '';
    
    const modal = document.getElementById('debit-cashback-modal');
    if (modal) {
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
    
    lucide.createIcons();
  };

  /**
   * Close debit cashback modal
   */
  window.closeDebitCashbackModal = function() {
    const modal = document.getElementById('debit-cashback-modal');
    if (modal) {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    }
    currentClientForCashback = null;
  };

  /**
   * Process manual cashback credit
   */
  async function processManualCashback() {
    if (!currentClientForCashback) {
      console.error('❌ No client selected');
      return;
    }
    
    const amountInput = document.getElementById('manual-cashback-amount');
    const commentInput = document.getElementById('manual-cashback-comment');
    
    const amount = Number(amountInput.value);
    const comment = commentInput.value.trim();
    
    if (!amount || amount <= 0) {
      showNotification('Будь ласка, введіть коректну суму', 'error');
      amountInput.focus();
      return;
    }
    
    const confirmBtn = document.getElementById('confirm-manual-cashback');
    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.innerHTML = '<i data-lucide="loader" class="w-5 h-5 animate-spin"></i><span>Обробка...</span>';
      lucide.createIcons();
    }
    
    try {
      console.log('💰 [Manual Cashback] Processing:', { client: currentClientForCashback.phone, amount, comment });
      
      const userRef = doc(db, 'users', currentClientForCashback.phone);
      await updateDoc(userRef, {
        cashbackBalance: increment(amount),
        totalCashbackAwarded: increment(amount),
        updatedAt: serverTimestamp()
      });
      
      const transactionRef = collection(db, 'cashback_transactions');
      await addDoc(transactionRef, {
        userId: currentClientForCashback.phone,
        userName: currentClientForCashback.fullName,
        amount: amount,
        type: TRANSACTION_TYPES.ADMIN_ADJUSTMENT,
        adjustmentType: 'CREDIT',
        reason: comment || 'Ручне нарахування адміністратором',
        description: comment || 'Ручне нарахування адміністратором',
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.email || 'admin',
        metadata: {
          action: 'manual_credit',
          previousBalance: currentClientForCashback.currentBalance
        }
      });
      
      console.log('✅ [Manual Cashback] Successfully credited', amount, 'UAH');
      
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl z-[100] flex items-center gap-3';
      toast.innerHTML = `
        <i data-lucide="check-circle" class="w-6 h-6"></i>
        <div>
          <p class="font-bold">Кешбек нараховано! ✅</p>
          <p class="text-sm text-green-100">${amount} грн → ${currentClientForCashback.fullName}</p>
        </div>
      `;
      document.body.appendChild(toast);
      lucide.createIcons();
      
      setTimeout(() => toast.remove(), 3000);
      
      closeManualCashbackModal();
      await loadCashbackClients();
      
    } catch (error) {
      console.error('❌ [Manual Cashback] Error:', error);
      notify('Помилка нарахування кешбеку: ' + error.message, 'error');
      
      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = '<i data-lucide="check" class="w-5 h-5"></i><span>Підтвердити</span>';
        lucide.createIcons();
      }
    }
  }

  /**
   * Process cashback debit
   */
  async function processDebitCashback() {
    if (!currentClientForCashback) {
      console.error('❌ No client selected');
      return;
    }
    
    const amountInput = document.getElementById('debit-cashback-amount');
    const commentInput = document.getElementById('debit-cashback-comment');
    
    const amount = Number(amountInput.value);
    const comment = commentInput.value.trim();
    
    if (!amount || amount <= 0) {
      showNotification('Будь ласка, введіть коректну суму', 'error');
      amountInput.focus();
      return;
    }
    
    if (amount > currentClientForCashback.currentBalance) {
      showNotification('Сума перевищує поточний баланс клієнта', 'error');
      return;
    }
    
    const confirmBtn = document.getElementById('confirm-debit-cashback');
    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.innerHTML = '<i data-lucide="loader" class="w-5 h-5 animate-spin"></i><span>Обробка...</span>';
      lucide.createIcons();
    }
    
    try {
      console.log('💰 [Debit Cashback] Processing:', { client: currentClientForCashback.phone, amount, comment });
      
      // ⚠️ IMPORTANT: Manual debit does NOT increment totalCashbackUsed
      // totalCashbackUsed should ONLY track actual order usage (USED_FOR_ORDER transactions)
      const userRef = doc(db, 'users', currentClientForCashback.phone);
      await updateDoc(userRef, {
        cashbackBalance: increment(-amount),
        // totalCashbackUsed: NOT incremented - this is admin adjustment, not order usage
        updatedAt: serverTimestamp()
      });
      
      const transactionRef = collection(db, 'cashback_transactions');
      await addDoc(transactionRef, {
        userId: currentClientForCashback.phone,
        userName: currentClientForCashback.fullName,
        amount: -amount,
        type: TRANSACTION_TYPES.ADMIN_ADJUSTMENT,
        adjustmentType: 'DEBIT',
        reason: comment || 'Ручне списання адміністратором',
        description: comment || 'Ручне списання адміністратором',
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.email || 'admin',
        metadata: {
          action: 'manual_debit',
          previousBalance: currentClientForCashback.currentBalance
        }
      });
      
      console.log('✅ [Debit Cashback] Successfully debited', amount, 'UAH');
      
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-yellow-500 text-white px-6 py-4 rounded-xl shadow-2xl z-[100] flex items-center gap-3';
      toast.innerHTML = `
        <i data-lucide="minus-circle" class="w-6 h-6"></i>
        <div>
          <p class="font-bold">Кешбек списано! ✅</p>
          <p class="text-sm text-yellow-100">${amount} грн від ${currentClientForCashback.fullName}</p>
        </div>
      `;
      document.body.appendChild(toast);
      lucide.createIcons();
      
      setTimeout(() => toast.remove(), 3000);
      
      closeDebitCashbackModal();
      await loadCashbackClients();
      
    } catch (error) {
      console.error('❌ [Debit Cashback] Error:', error);
      showNotification('Помилка списання кешбеку: ' + error.message, 'error');
      
      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = '<i data-lucide="check" class="w-5 h-5"></i><span>Підтвердити</span>';
        lucide.createIcons();
      }
    }
  }

  // ============================================
  // 🔧 PAGINATION CONTROLS
  // ============================================

  window.goToPrevClientsPage = function() {
    if (currentPage > 1) {
      currentPage--;
      displayCashbackClients();
    }
  };

  window.goToNextClientsPage = function() {
    const totalPages = Math.ceil(filteredCashbackClients.length / itemsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      displayCashbackClients();
    }
  };

  // ============================================
  // 🎬 MODULE INITIALIZATION
  // ============================================

  /**
   * Initialize cashback module
   */
  function initCashbackModule() {
    console.log('🪙 [Cashback Module] Initializing...');    
    // ============================================
    // SAFETY CHECK: Only initialize if cashback view exists
    // ============================================
    const cashbackContainer = document.getElementById('cashback-view') || 
                             document.getElementById('cashback-stats-content');
    
    if (!cashbackContainer) {
      console.log('ℹ️ [Cashback Module] Cashback view not found in DOM - skipping initialization');
      return;
    }
    
    console.log('✅ [Cashback Module] Cashback view detected, proceeding with initialization');    
    // Setup save button listener
    const saveBtn = document.getElementById('save-cashback-settings');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        console.log('🔘 [Cashback] Save button clicked');
        window.saveCashbackSettings();
      });
      console.log('✅ [Cashback] Save button listener attached');
    }
    
    // Setup real-time toggle listener
    const cashbackEnabledToggle = document.getElementById('cashback-enabled-toggle');
    if (cashbackEnabledToggle) {
      cashbackEnabledToggle.addEventListener('change', async (event) => {
        const isEnabled = event.target.checked;
        console.log('🔄 [Cashback] Toggle changed:', isEnabled ? 'ON' : 'OFF');
        
        try {
          await setDoc(doc(db, 'config', 'general_config'), {
            isCashbackEnabled: isEnabled,
            updatedAt: new Date().toISOString()
          }, { merge: true });
          
          console.log('✅ [Cashback] Real-time update successful');
          
          const status = isEnabled ? 'Увімкнена' : 'Вимкнена';
          const bgColor = isEnabled ? 'bg-green-500' : 'bg-gray-500';
          
          const toast = document.createElement('div');
          toast.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-4 rounded-xl shadow-2xl z-[100] flex items-center gap-3`;
          toast.innerHTML = `
            <i data-lucide="${isEnabled ? 'check-circle' : 'x-circle'}" class="w-6 h-6"></i>
            <div>
              <p class="font-bold">${status}</p>
              <p class="text-sm opacity-90">Система кешбеку ${isEnabled ? 'активна' : 'неактивна'}</p>
            </div>
          `;
          document.body.appendChild(toast);
          lucide.createIcons();
          
          setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-out forwards';
            setTimeout(() => toast.remove(), 300);
          }, 3000);
          
        } catch (error) {
          console.error('❌ [Cashback] Error updating toggle:', error);
          event.target.checked = !isEnabled;
          notify('Помилка оновлення: ' + error.message, 'error');
        }
      });
      console.log('✅ [Cashback] Real-time toggle listener attached');
    }
    
    // Setup search filter
    const searchInput = document.getElementById('cashback-clients-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        filterCashbackClients(e.target.value);
      });
      console.log('✅ [Cashback] Search filter attached');
    }
    
    // Setup modal buttons
    const confirmBtn = document.getElementById('confirm-manual-cashback');
    const confirmDebitBtn = document.getElementById('confirm-debit-cashback');
    
    if (confirmBtn) {
      confirmBtn.addEventListener('click', processManualCashback);
      console.log('✅ [Cashback] Manual credit button attached');
    }
    
    if (confirmDebitBtn) {
      confirmDebitBtn.addEventListener('click', processDebitCashback);
      console.log('✅ [Cashback] Debit button attached');
    }
    
    console.log('✅ [Cashback Module] Initialization complete');
    console.log('✅ [Cashback Module] All functions ready:', {
      calculateOrderCashbackWithRules: typeof window.calculateOrderCashbackWithRules === 'function',
      loadCashbackSettings: typeof window.loadCashbackSettings === 'function',
      saveCashbackSettings: typeof window.saveCashbackSettings === 'function',
      loadCashbackStatistics: typeof window.loadCashbackStatistics === 'function',
      loadCashbackClients: typeof window.loadCashbackClients === 'function'
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCashbackModule);
  } else {
    initCashbackModule();
  }

})();
