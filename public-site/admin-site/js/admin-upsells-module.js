/**
 * ============================================
 * ADMIN UPSELLS MODULE
 * ============================================
 * Handles all upsell rules functionality:
 * - Creating and editing upsell rules
 * - Product search and selection
 * - Display location management
 * - Analytics and statistics
 * ============================================
 */

import { 
  doc, 
  getDoc, 
  getDocs, 
  collection, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  addDoc, 
  serverTimestamp,
  orderBy,
  setDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// ============================================
// GLOBAL STATE
// ============================================
let editingUpsellId = null;
let allProducts = [];
let selectedTriggerProduct = null;
let selectedSuggestedProducts = [];
let allUpsells = []; // Store all upsells for filtering

// Task 1: Real-time listener for display settings
let settingsUnsubscribe = null; // Store unsubscribe function
let currentSettings = {}; // Current settings from Firestore (single source of truth)

// Access global Firebase instances
const db = window.db;
const auth = window.auth;

// Verify Firebase is initialized
if (!db) {
  console.error('❌ Upsells Module: Firebase db is not initialized!');
}
if (!auth) {
  console.error('❌ Upsells Module: Firebase auth is not initialized!');
}

console.log('🛍️ Upsells Module: Initialized');

// ============================================
// UPSELL DISPLAY SETTINGS - REAL-TIME SYNC
// ============================================

/**
 * Task 1: Real-time Data Listener with onSnapshot
 * Firestore is the Single Source of Truth
 */
function initDisplaySettingsListener() {
  console.log('🔄 [initDisplaySettingsListener] Setting up real-time listener...');
  
  // Unsubscribe from previous listener if exists
  if (settingsUnsubscribe) {
    settingsUnsubscribe();
  }
  
  const settingsRef = doc(db, 'settings', 'upsellDisplayConfig');
  
  // Task 1: onSnapshot for real-time updates
  settingsUnsubscribe = onSnapshot(settingsRef, (docSnapshot) => {
    if (docSnapshot.exists()) {
      const settings = docSnapshot.data();
      currentSettings = settings;
      
      console.log('🔥 [onSnapshot] REALLY loaded from DB:', settings);
      
      // Task 3: Strict UI Control - Update toggles from Firestore
      updateTogglesFromFirestore(settings);
      
    } else {
      console.warn('⚠️ [onSnapshot] Document does not exist, creating defaults...');
      
      // Create default document
      const defaultSettings = {
        showOnProductPage: true,
        showOnCart: false,
        showOnCheckout: false,
        showOnThankYou: false
      };
      
      // This will trigger onSnapshot again with the new data
      setDoc(settingsRef, defaultSettings).catch(error => {
        console.error('❌ Error creating default settings:', error);
      });
    }
  }, (error) => {
    console.error('❌ [onSnapshot] Listener error:', error);
  });
  
  console.log('✅ [initDisplaySettingsListener] Real-time listener active');
}

/**
 * Update UI toggles from Firestore data
 * Task 3: Strict UI Control
 */
function updateTogglesFromFirestore(settings) {
  const productToggle = document.getElementById('display-product-page');
  const cartToggle = document.getElementById('display-cart');
  const checkoutToggle = document.getElementById('display-checkout');
  const thankYouToggle = document.getElementById('display-thank-you');
  
  if (productToggle) productToggle.checked = settings.showOnProductPage || false;
  if (cartToggle) cartToggle.checked = settings.showOnCart || false;
  if (checkoutToggle) checkoutToggle.checked = settings.showOnCheckout || false;
  if (thankYouToggle) thankYouToggle.checked = settings.showOnThankYou || false;
  
  console.log('✅ [updateTogglesFromFirestore] UI updated:', {
    productPage: productToggle?.checked,
    cart: cartToggle?.checked,
    checkout: checkoutToggle?.checked,
    thankYou: thankYouToggle?.checked
  });
}

/**
 * Task 2: Direct Update Function
 * Single function that handles all toggle changes
 * Firestore is Single Source of Truth - onSnapshot will update UI automatically
 */
async function toggleSetting(fieldName, currentValue) {
  try {
    const newValue = !currentValue;
    console.log(`💾 [toggleSetting] User clicked: ${fieldName} -> ${newValue}`);
    
    const settingsRef = doc(db, 'settings', 'upsellDisplayConfig');
    
    // Task 2: Use setDoc with merge:true to update single field
    // This creates document if missing, or updates existing
    await setDoc(settingsRef, {
      [fieldName]: newValue
    }, { merge: true });
    
    console.log(`✅ [toggleSetting] ${fieldName} updated to ${newValue} in Firestore`);
    console.log('🔥 onSnapshot will automatically update UI...');
    
    // Show success toast
    showToast('✅ Налаштування збережено', 'success');
    
  } catch (error) {
    console.error('❌ [toggleSetting] Error updating Firestore:', error);
    
    // Show error toast
    const errorMsg = error.code === 'permission-denied' 
      ? '❌ Немає доступу. Увійдіть як адміністратор!'
      : '❌ Помилка: ' + error.message;
    
    showToast(errorMsg, 'error');
    
    // onSnapshot will revert the UI to the correct state automatically
  }
}

/**
 * Task 4: Diagnostics - Manual Save Test
 * Global function accessible from HTML onclick
 */
window.testManualSave = async function() {
  try {
    console.log('🧪 [testManualSave] Testing direct DB write...');
    
    // Check if db is available
    if (!window.db) {
      alert('❌ Database not initialized! Reload the page.');
      console.error('❌ window.db is not available');
      return;
    }
    
    const settingsRef = doc(window.db, 'settings', 'upsellDisplayConfig');
    await setDoc(settingsRef, {
      test: true,
      testTimestamp: new Date().toISOString(),
      manualTestValue: Math.random()
    }, { merge: true });
    
    console.log('✅ [testManualSave] Write successful! Check Firestore Console.');
    alert('✅ Test успішний! Перевірте Firestore Console: settings/upsellDisplayConfig');
    
  } catch (error) {
    console.error('❌ [testManualSave] Error:', error);
    alert('❌ Test провалено: ' + error.message);
  }
}

// ============================================
// UPSELL RULES MANAGEMENT
// ============================================

/**
 * Show toast notification
 */
function showToast(message, type = 'success') {
  // Create toast element if it doesn't exist
  let toast = document.getElementById('upsell-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'upsell-toast';
    toast.className = 'fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-xl z-50 transform translate-y-20 opacity-0 transition-all duration-300';
    document.body.appendChild(toast);
  }
  
  // Update colors based on type
  if (type === 'error') {
    toast.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-xl z-50 transform transition-all duration-300';
  } else {
    toast.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-xl z-50 transform transition-all duration-300';
  }
  
  toast.textContent = message;
  toast.classList.remove('translate-y-20', 'opacity-0');
  
  setTimeout(() => {
    toast.classList.add('translate-y-20', 'opacity-0');
  }, type === 'error' ? 4000 : 2000); // Longer duration for errors
}

/**
 * Load all upsell rules
 */
window.loadUpsellRules = async () => {
  try {
    // Task 1: Initialize real-time listener instead of one-time load
    initDisplaySettingsListener();
    
    const upsellsRef = collection(db, 'upsells');
    const q = query(upsellsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    const upsells = [];
    snapshot.forEach(doc => {
      upsells.push({ id: doc.id, ...doc.data() });
    });

    allUpsells = upsells; // Store globally for filtering
    await renderUpsellRules(upsells);
    updateUpsellStats(upsells);

  } catch (error) {
    console.error('Error loading upsell rules:', error);
    alert('Помилка завантаження правил допродажу: ' + error.message);
  }
};

/**
 * Filter upsells by placement type
 */
window.filterUpsellsByPlacement = async () => {
  const filterValue = document.getElementById('placement-filter').value;
  
  let filteredUpsells = allUpsells;
  
  if (filterValue !== 'all') {
    filteredUpsells = allUpsells.filter(u => u.placementType === filterValue);
  }
  
  await renderUpsellRules(filteredUpsells);
  updateUpsellStats(filteredUpsells);
};

/**
 * Render upsell rules table
 */
async function renderUpsellRules(upsells) {
  const tbody = document.getElementById('upsells-list');

  if (!upsells || upsells.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="px-6 py-12 text-center text-gray-500">
          <i data-lucide="shopping-bag" class="w-12 h-12 mx-auto mb-3 text-gray-300"></i>
          <p>Поки що немає правил допродажу</p>
          <p class="text-sm mt-1">Створіть перше правило для збільшення середнього чека</p>
        </td>
      </tr>
    `;
    lucide.createIcons();
    return;
  }

  // Load all products for display
  if (allProducts.length === 0) {
    await loadAllProducts();
  }

  tbody.innerHTML = upsells.map(upsell => {
    // Find trigger product
    const triggerProduct = allProducts.find(p => p.id === upsell.triggerId);
    const triggerName = triggerProduct?.name || 'Товар не знайдено';
    
    // Find suggested products
    const suggestedProducts = (upsell.suggestedIds || [])
      .map(id => allProducts.find(p => p.id === id))
      .filter(p => p)
      .slice(0, 3); // Show only first 3
    
    const suggestedText = suggestedProducts.length > 0 
      ? suggestedProducts.map(p => p.name).join(', ') + 
        (upsell.suggestedIds.length > 3 ? ` +${upsell.suggestedIds.length - 3} ще` : '')
      : 'Товари не вибрано';

    const discountText = upsell.discount > 0 ? `${upsell.discount}%` : '—';
    
    // Display placement type with human-readable label
    const placementLabels = {
      'product_page': 'Сторінка товару',
      'cart': 'Кошик',
      'checkout': 'Оформлення',
      'thank_you': 'Сторінка подяки'
    };
    const placementText = placementLabels[upsell.placementType] || 'Не вказано';
    
    const isActive = upsell.isActive ?? true;
    const statusBadge = isActive
      ? '<span class="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold"><i data-lucide="check-circle" class="w-3 h-3"></i> Активно</span>'
      : '<span class="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold"><i data-lucide="x-circle" class="w-3 h-3"></i> Пауза</span>';

    return `
      <tr class="hover:bg-gray-50 transition">
        <td class="px-6 py-4">
          <div class="flex items-center gap-2">
            <i data-lucide="package" class="w-4 h-4 text-green-600"></i>
            <span class="font-semibold text-gray-900">${triggerName}</span>
          </div>
        </td>
        <td class="px-6 py-4">
          <div class="text-sm text-gray-700 break-words whitespace-normal leading-relaxed max-w-[300px]">
            ${suggestedText}
          </div>
        </td>
        <td class="px-6 py-4 text-center">
          <span class="text-sm font-semibold text-gray-900">${discountText}</span>
        </td>
        <td class="px-6 py-4">
          <div class="text-sm font-medium text-gray-700">
            ${placementText}
          </div>
        </td>
        <td class="px-6 py-4 text-center">
          ${statusBadge}
        </td>
        <td class="px-6 py-4">
          <div class="flex items-center justify-center gap-2">
            <button 
              onclick="editUpsellRule('${upsell.id}')"
              class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
              title="Редагувати"
            >
              <i data-lucide="edit" class="w-4 h-4"></i>
            </button>
            <button 
              onclick="toggleUpsellStatus('${upsell.id}', ${!isActive})"
              class="p-2 ${isActive ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'} rounded-lg transition"
              title="${isActive ? 'Поставити на паузу' : 'Активувати'}"
            >
              <i data-lucide="${isActive ? 'pause' : 'play'}" class="w-4 h-4"></i>
            </button>
            <button 
              onclick="deleteUpsellRule('${upsell.id}')"
              class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
              title="Видалити"
            >
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  lucide.createIcons();
}

/**
 * Update upsell statistics
 */
function updateUpsellStats(upsells) {
  if (!upsells || !Array.isArray(upsells)) {
    document.getElementById('upsells-stat-total').textContent = '0';
    document.getElementById('upsells-stat-active').textContent = '0';
    document.getElementById('upsells-stat-views').textContent = '0';
    document.getElementById('upsells-stat-conversion').textContent = '0%';
    return;
  }

  const total = upsells.length;
  const active = upsells.filter(u => u?.isActive === true).length;
  
  document.getElementById('upsells-stat-total').textContent = total;
  document.getElementById('upsells-stat-active').textContent = active;
  document.getElementById('upsells-stat-views').textContent = '0'; // TODO: Add analytics
  document.getElementById('upsells-stat-conversion').textContent = '0%'; // TODO: Add analytics
}

// ============================================
// MODAL MANAGEMENT
// ============================================

/**
 * Open modal for creating new upsell rule
 */
window.openCreateUpsellModal = () => {
  editingUpsellId = null;
  selectedTriggerProduct = null;
  selectedSuggestedProducts = [];
  
  document.getElementById('upsell-modal-title').textContent = 'Створити правило допродажу';
  document.getElementById('create-upsell-modal').classList.remove('hidden');
  clearUpsellForm();
  document.getElementById('trigger-product-search').focus();
  lucide.createIcons();
};

/**
 * Close upsell modal
 */
window.closeCreateUpsellModal = () => {
  document.getElementById('create-upsell-modal').classList.add('hidden');
  clearUpsellForm();
  editingUpsellId = null;
  selectedTriggerProduct = null;
  selectedSuggestedProducts = [];
};

/**
 * Clear upsell form
 */
function clearUpsellForm() {
  document.getElementById('create-upsell-form').reset();
  document.getElementById('selected-trigger-product').classList.add('hidden');
  document.getElementById('selected-suggested-products').innerHTML = '<div class="text-sm text-gray-500 italic">Жоден товар поки що не вибрано</div>';
  document.getElementById('trigger-product-results').classList.add('hidden');
  document.getElementById('suggested-products-results').classList.add('hidden');
  updateDiscountPreview();
}

/**
 * Edit existing upsell rule
 */
window.editUpsellRule = async (upsellId) => {
  try {
    const upsellDoc = await getDoc(doc(db, 'upsells', upsellId));
    if (!upsellDoc.exists()) return;
    
    const upsellData = upsellDoc.data();
    editingUpsellId = upsellId;
    
    // Load products if needed
    if (allProducts.length === 0) {
      await loadAllProducts();
    }
    
    // Set trigger product
    selectedTriggerProduct = allProducts.find(p => p.id === upsellData.triggerId);
    if (selectedTriggerProduct) {
      displaySelectedTriggerProduct(selectedTriggerProduct);
    }
    
    // Set suggested products
    selectedSuggestedProducts = (upsellData.suggestedIds || [])
      .map(id => allProducts.find(p => p.id === id))
      .filter(p => p);
    displaySelectedSuggestedProducts();
    
    // Set form values
    document.getElementById('upsell-discount').value = upsellData.discount || 0;
    document.getElementById('upsell-placement-type').value = upsellData.placementType || 'product_page';
    document.getElementById('upsell-active').checked = upsellData.isActive ?? true;
    
    updateDiscountPreview();
    
    document.getElementById('upsell-modal-title').textContent = 'Редагувати правило допродажу';
    document.getElementById('create-upsell-modal').classList.remove('hidden');
    lucide.createIcons();
    
  } catch (error) {
    console.error('Error loading upsell rule:', error);
    alert('Помилка завантаження правила: ' + error.message);
  }
};

/**
 * Toggle upsell rule status
 */
window.toggleUpsellStatus = async (upsellId, newStatus) => {
  try {
    const upsellRef = doc(db, 'upsells', upsellId);
    await updateDoc(upsellRef, { isActive: newStatus });
    window.loadUpsellRules();
  } catch (error) {
    console.error('Error toggling status:', error);
    alert('Помилка зміни статусу: ' + error.message);
  }
};

/**
 * Delete upsell rule
 */
window.deleteUpsellRule = async (upsellId) => {
  if (!confirm('Видалити правило допродажу?\n\nЦю дію неможливо скасувати.')) {
    return;
  }

  try {
    await deleteDoc(doc(db, 'upsells', upsellId));
    alert('✅ Правило допродажу видалено');
    window.loadUpsellRules();
  } catch (error) {
    console.error('Error deleting upsell rule:', error);
    alert('Помилка видалення: ' + error.message);
  }
};

// ============================================
// PRODUCT SEARCH & SELECTION
// ============================================

/**
 * Load all products for search
 */
async function loadAllProducts() {
  try {
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);
    
    allProducts = [];
    snapshot.forEach(doc => {
      allProducts.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`Loaded ${allProducts.length} products for upsells`);
  } catch (error) {
    console.error('Error loading products:', error);
  }
}

/**
 * Search products by name
 */
function searchProducts(query, excludeIds = []) {
  if (!query || query.length < 2) return [];
  
  const lowerQuery = query.toLowerCase();
  return allProducts
    .filter(product => 
      !excludeIds.includes(product.id) &&
      product.name && 
      product.name.toLowerCase().includes(lowerQuery)
    )
    .slice(0, 10); // Limit to 10 results
}

/**
 * Display search results for trigger product
 */
function displayTriggerProductResults(products) {
  const resultsContainer = document.getElementById('trigger-product-results');
  
  if (products.length === 0) {
    resultsContainer.classList.add('hidden');
    return;
  }
  
  resultsContainer.innerHTML = products.map(product => `
    <div class="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0" onclick="selectTriggerProduct('${product.id}')">
      <div class="font-semibold text-gray-900">${product.name}</div>
      <div class="text-sm text-gray-500">ID: ${product.id}</div>
    </div>
  `).join('');
  
  resultsContainer.classList.remove('hidden');
}

/**
 * Display search results for suggested products
 */
function displaySuggestedProductResults(products) {
  const resultsContainer = document.getElementById('suggested-products-results');
  
  if (products.length === 0) {
    resultsContainer.classList.add('hidden');
    return;
  }
  
  resultsContainer.innerHTML = products.map(product => `
    <div class="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0" onclick="addSuggestedProduct('${product.id}')">
      <div class="font-semibold text-gray-900">${product.name}</div>
      <div class="text-sm text-gray-500">ID: ${product.id}</div>
    </div>
  `).join('');
  
  resultsContainer.classList.remove('hidden');
}

/**
 * Select trigger product
 */
window.selectTriggerProduct = (productId) => {
  selectedTriggerProduct = allProducts.find(p => p.id === productId);
  if (selectedTriggerProduct) {
    displaySelectedTriggerProduct(selectedTriggerProduct);
    document.getElementById('trigger-product-search').value = '';
    document.getElementById('trigger-product-results').classList.add('hidden');
  }
};

/**
 * Display selected trigger product
 */
function displaySelectedTriggerProduct(product) {
  const container = document.getElementById('selected-trigger-product');
  container.innerHTML = `
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <i data-lucide="package" class="w-5 h-5 text-green-600"></i>
        <div>
          <div class="font-semibold text-gray-900">${product.name}</div>
          <div class="text-sm text-gray-500">ID: ${product.id}</div>
        </div>
      </div>
      <button type="button" onclick="clearTriggerProduct()" class="p-2 text-red-600 hover:bg-red-50 rounded-lg">
        <i data-lucide="x" class="w-4 h-4"></i>
      </button>
    </div>
  `;
  container.classList.remove('hidden');
  lucide.createIcons();
}

/**
 * Clear trigger product selection
 */
window.clearTriggerProduct = () => {
  selectedTriggerProduct = null;
  document.getElementById('selected-trigger-product').classList.add('hidden');
  document.getElementById('trigger-product-search').value = '';
};

/**
 * Add suggested product
 */
window.addSuggestedProduct = (productId) => {
  if (selectedSuggestedProducts.length >= 5) {
    alert('Максимум 5 товарів для допродажу');
    return;
  }
  
  if (selectedSuggestedProducts.find(p => p.id === productId)) {
    alert('Цей товар вже додано');
    return;
  }
  
  if (selectedTriggerProduct && selectedTriggerProduct.id === productId) {
    alert('Неможна додати основний товар як допродаж');
    return;
  }
  
  const product = allProducts.find(p => p.id === productId);
  if (product) {
    selectedSuggestedProducts.push(product);
    displaySelectedSuggestedProducts();
    document.getElementById('suggested-products-search').value = '';
    document.getElementById('suggested-products-results').classList.add('hidden');
  }
};

/**
 * Remove suggested product
 */
window.removeSuggestedProduct = (productId) => {
  selectedSuggestedProducts = selectedSuggestedProducts.filter(p => p.id !== productId);
  displaySelectedSuggestedProducts();
};

/**
 * Display selected suggested products
 */
function displaySelectedSuggestedProducts() {
  const container = document.getElementById('selected-suggested-products');
  
  if (selectedSuggestedProducts.length === 0) {
    container.innerHTML = '<div class="text-sm text-gray-500 italic">Жоден товар поки що не вибрано</div>';
    return;
  }
  
  container.innerHTML = selectedSuggestedProducts.map((product, index) => `
    <div class="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200">
      <div class="flex items-center gap-3">
        <span class="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
          ${index + 1}
        </span>
        <div>
          <div class="font-semibold text-gray-900">${product.name}</div>
          <div class="text-sm text-gray-500">ID: ${product.id}</div>
        </div>
      </div>
      <button type="button" onclick="removeSuggestedProduct('${product.id}')" class="p-2 text-red-600 hover:bg-red-50 rounded-lg">
        <i data-lucide="x" class="w-4 h-4"></i>
      </button>
    </div>
  `).join('');
  
  lucide.createIcons();
}

/**
 * Update discount preview
 */
function updateDiscountPreview() {
  const discount = parseInt(document.getElementById('upsell-discount').value) || 0;
  const preview = document.getElementById('discount-preview');
  
  if (discount > 0) {
    preview.textContent = `Знижка ${discount}% на товари допродажу`;
  } else {
    preview.textContent = 'Без додаткової знижки';
  }
}

// ============================================
// FRONTEND INTEGRATION
// ============================================

/**
 * Get upsells for a specific product (for frontend use)
 * @param {string} productId - Product ID to get upsells for
 * @returns {Promise<Array>} Array of upsell rules
 */
window.getUpsellsForProduct = async (productId) => {
  try {
    const upsellsRef = collection(db, 'upsells');
    const q = query(
      upsellsRef, 
      where('triggerId', '==', productId),
      where('isActive', '==', true)
    );
    const snapshot = await getDocs(q);
    
    const upsells = [];
    snapshot.forEach(doc => {
      upsells.push({ id: doc.id, ...doc.data() });
    });
    
    return upsells;
    
  } catch (error) {
    console.error('Error fetching upsells for product:', error);
    return [];
  }
};

// ============================================
// EVENT LISTENERS & INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // Trigger product search
  const triggerSearch = document.getElementById('trigger-product-search');
  if (triggerSearch) {
    triggerSearch.addEventListener('input', async (e) => {
      const query = e.target.value.trim();
      
      if (allProducts.length === 0) {
        await loadAllProducts();
      }
      
      if (query.length >= 2) {
        const results = searchProducts(query, selectedTriggerProduct ? [selectedTriggerProduct.id] : []);
        displayTriggerProductResults(results);
      } else {
        document.getElementById('trigger-product-results').classList.add('hidden');
      }
    });
  }
  
  // Suggested products search
  const suggestedSearch = document.getElementById('suggested-products-search');
  if (suggestedSearch) {
    suggestedSearch.addEventListener('input', async (e) => {
      const query = e.target.value.trim();
      
      if (allProducts.length === 0) {
        await loadAllProducts();
      }
      
      if (query.length >= 2) {
        const excludeIds = [
          ...(selectedTriggerProduct ? [selectedTriggerProduct.id] : []),
          ...selectedSuggestedProducts.map(p => p.id)
        ];
        const results = searchProducts(query, excludeIds);
        displaySuggestedProductResults(results);
      } else {
        document.getElementById('suggested-products-results').classList.add('hidden');
      }
    });
  }
  
  // Discount preview update
  const discountInput = document.getElementById('upsell-discount');
  if (discountInput) {
    discountInput.addEventListener('input', updateDiscountPreview);
  }
  
  // Form submission
  const createForm = document.getElementById('create-upsell-form');
  if (createForm) {
    createForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Validation
      if (!selectedTriggerProduct) {
        alert('⚠️ Будь ласка, виберіть основний товар');
        return;
      }
      
      if (selectedSuggestedProducts.length === 0) {
        alert('⚠️ Будь ласка, виберіть принаймні один товар для допродажу');
        return;
      }
      
      const discount = parseInt(document.getElementById('upsell-discount').value) || 0;
      const placementType = document.getElementById('upsell-placement-type').value;
      const isActive = document.getElementById('upsell-active').checked;
      
      if (!placementType) {
        alert('⚠️ Будь ласка, виберіть місце розміщення');
        return;
      }
      
      try {
        const upsellsRef = collection(db, 'upsells');
        const upsellData = {
          triggerId: selectedTriggerProduct.id,
          suggestedIds: selectedSuggestedProducts.map(p => p.id),
          discount: discount,
          placementType: placementType,
          isActive: isActive,
          createdAt: serverTimestamp()
        };
        
        if (editingUpsellId) {
          // Update existing rule
          const upsellRef = doc(db, 'upsells', editingUpsellId);
          await updateDoc(upsellRef, upsellData);
          alert('✅ Правило допродажу оновлено!');
        } else {
          // Create new rule
          await addDoc(upsellsRef, upsellData);
          alert('✅ Правило допродажу створено!');
        }
        
        window.closeCreateUpsellModal();
        window.loadUpsellRules();
        
      } catch (error) {
        console.error('Error saving upsell rule:', error);
        alert('❌ Помилка збереження правила: ' + error.message);
      }
    });
  }
  
  // Close dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#trigger-product-search') && !e.target.closest('#trigger-product-results')) {
      document.getElementById('trigger-product-results').classList.add('hidden');
    }
    if (!e.target.closest('#suggested-products-search') && !e.target.closest('#suggested-products-results')) {
      document.getElementById('suggested-products-results').classList.add('hidden');
    }
  });
  
  // Task 3: Attach event listeners that call toggleSetting directly
  const toggleMappings = {
    'display-product-page': 'showOnProductPage',
    'display-cart': 'showOnCart',
    'display-checkout': 'showOnCheckout',
    'display-thank-you': 'showOnThankYou'
  };
  
  Object.keys(toggleMappings).forEach(toggleId => {
    const toggle = document.getElementById(toggleId);
    const fieldName = toggleMappings[toggleId];
    
    if (toggle) {
      toggle.addEventListener('change', (e) => {
        // Get current value from currentSettings (Firestore source of truth)
        const currentValue = currentSettings[fieldName] || false;
        toggleSetting(fieldName, currentValue);
      });
    }
  });
  
  // Attach event listener to "Create Rule" button as backup to onclick
  const createRuleButtons = document.querySelectorAll('[onclick*="openCreateUpsellModal"]');
  createRuleButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      if (typeof window.openCreateUpsellModal === 'function') {
        // onclick will handle it
        return;
      }
      // If onclick failed, handle it here
      e.preventDefault();
      window.openCreateUpsellModal();
    });
  });
  
  console.log('✅ Upsells Module: Initialization complete');
  console.log('✅ window.openCreateUpsellModal:', typeof window.openCreateUpsellModal);
  console.log('✅ window.loadUpsellRules:', typeof window.loadUpsellRules);
});