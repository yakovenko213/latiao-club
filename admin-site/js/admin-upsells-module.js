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

// Access global Firebase instances
const db = window.db;
const auth = window.auth;

console.log('🛍️ Upsells Module: Initialized');

// ============================================
// UPSELL RULES MANAGEMENT
// ============================================

/**
 * Load display settings from Firestore
 */
async function loadDisplaySettings() {
  try {
    const settingsDoc = await getDoc(doc(db, 'settings', 'upsellDisplayConfig'));
    
    if (settingsDoc.exists()) {
      const settings = settingsDoc.data();
      
      // Update toggle switches
      document.getElementById('display-product-page').checked = settings.showOnProductPage ?? true;
      document.getElementById('display-cart').checked = settings.showOnCart ?? false;
      document.getElementById('display-checkout').checked = settings.showOnCheckout ?? false;
      document.getElementById('display-thank-you').checked = settings.showOnThankYou ?? false;
      
      console.log('✅ Display settings loaded:', settings);
    } else {
      // Initialize with default settings
      const defaultSettings = {
        showOnProductPage: true,
        showOnCart: false,
        showOnCheckout: false,
        showOnThankYou: false
      };
      
      await setDoc(doc(db, 'settings', 'upsellDisplayConfig'), defaultSettings);
      console.log('✅ Default display settings created');
    }
  } catch (error) {
    console.error('Error loading display settings:', error);
  }
}

/**
 * Save display settings to Firestore
 */
async function saveDisplaySettings() {
  try {
    const settings = {
      showOnProductPage: document.getElementById('display-product-page').checked,
      showOnCart: document.getElementById('display-cart').checked,
      showOnCheckout: document.getElementById('display-checkout').checked,
      showOnThankYou: document.getElementById('display-thank-you').checked
    };
    
    const settingsRef = doc(db, 'settings', 'upsellDisplayConfig');
    await updateDoc(settingsRef, settings, { merge: true });
    
    console.log('✅ Display settings saved:', settings);
    
    // Show success toast
    showToast('✅ Налаштування збережено');
  } catch (error) {
    console.error('Error saving display settings:', error);
    showToast('❌ Помилка збереження');
  }
}

/**
 * Show toast notification
 */
function showToast(message) {
  // Create toast element if it doesn't exist
  let toast = document.getElementById('upsell-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'upsell-toast';
    toast.className = 'fixed bottom-4 right-4 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-xl z-50 transform translate-y-20 opacity-0 transition-all duration-300';
    document.body.appendChild(toast);
  }
  
  toast.textContent = message;
  toast.classList.remove('translate-y-20', 'opacity-0');
  
  setTimeout(() => {
    toast.classList.add('translate-y-20', 'opacity-0');
  }, 2000);
}

/**
 * Load all upsell rules
 */
window.loadUpsellRules = async () => {
  try {
    // Load display settings first
    await loadDisplaySettings();
    
    const upsellsRef = collection(db, 'upsells');
    const q = query(upsellsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    const upsells = [];
    snapshot.forEach(doc => {
      upsells.push({ id: doc.id, ...doc.data() });
    });

    await renderUpsellRules(upsells);
    updateUpsellStats(upsells);

  } catch (error) {
    console.error('Error loading upsell rules:', error);
    alert('Помилка завантаження правил допродажу: ' + error.message);
  }
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
    
    // Display locations
    const locations = [];
    if (upsell.locations?.productPage) locations.push('Сторінка товару');
    if (upsell.locations?.cart) locations.push('Кошик');
    if (upsell.locations?.popup) locations.push('Pop-up');
    const locationsText = locations.length > 0 ? locations.join(', ') : 'Не налаштовано';
    
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
          <div class="text-xs text-gray-600 break-words whitespace-normal leading-relaxed">
            ${locationsText}
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
    document.getElementById('location-product-page').checked = upsellData.locations?.productPage || false;
    document.getElementById('location-cart').checked = upsellData.locations?.cart || false;
    document.getElementById('location-popup').checked = upsellData.locations?.popup || false;
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
      const locations = {
        productPage: document.getElementById('location-product-page').checked,
        cart: document.getElementById('location-cart').checked,
        popup: document.getElementById('location-popup').checked
      };
      const isActive = document.getElementById('upsell-active').checked;
      
      if (!locations.productPage && !locations.cart && !locations.popup) {
        alert('⚠️ Будь ласка, виберіть принаймні одну локацію відображення');
        return;
      }
      
      try {
        const upsellsRef = collection(db, 'upsells');
        const upsellData = {
          triggerId: selectedTriggerProduct.id,
          suggestedIds: selectedSuggestedProducts.map(p => p.id),
          discount: discount,
          locations: locations,
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
  
  // Display settings toggle listeners
  const displayToggles = [
    'display-product-page',
    'display-cart',
    'display-checkout',
    'display-thank-you'
  ];
  
  displayToggles.forEach(toggleId => {
    const toggle = document.getElementById(toggleId);
    if (toggle) {
      toggle.addEventListener('change', () => {
        saveDisplaySettings();
      });
    }
  });
      document.getElementById('suggested-products-results').classList.add('hidden');
    }
  });
});

console.log('🛍️ Upsells Module: Event listeners attached');