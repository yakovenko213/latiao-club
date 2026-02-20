// ============================================
// FAVORITES PAGE LOGIC
// ============================================

import { db } from './firebase-init.js';
import { collection, query, where, getDocs, documentId, doc, setDoc, getDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// ============================================
// CONSTANTS
// ============================================
const FAVORITES_KEY = 'latiao_favorites';
const CLOUD_COLLECTION = 'user_favorites';

// ============================================
// GET FAVORITES FROM LOCALSTORAGE
// ============================================
function getFavorites() {
  try {
    const favorites = localStorage.getItem(FAVORITES_KEY);
    return favorites ? JSON.parse(favorites) : [];
  } catch (error) {
    console.error('Error reading favorites:', error);
    return [];
  }
}

// ============================================
// SAVE FAVORITES TO LOCALSTORAGE
// ============================================
function saveFavorites(favorites) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    // Update favorites counter in header
    if (window.updateFavoritesCounter) {
      window.updateFavoritesCounter();
    }
  } catch (error) {
    console.error('Error saving favorites:', error);
  }
}

// ============================================
// REMOVE FROM FAVORITES
// ============================================
window.removeFavorite = function(productId, cardElement) {
  const favorites = getFavorites();
  const index = favorites.indexOf(productId);
  
  if (index > -1) {
    // Remove from array
    favorites.splice(index, 1);
    saveFavorites(favorites);
    
    // Animate card removal
    if (cardElement) {
      cardElement.classList.add('removing');
      setTimeout(() => {
        cardElement.remove();
        
        // Update count
        const count = favorites.length;
        const countEl = document.getElementById('products-count');
        if (countEl) countEl.textContent = count;
        
        // Show empty state if no more favorites
        if (count === 0) {
          document.getElementById('products-section').classList.add('hidden');
          document.getElementById('empty-state').classList.remove('hidden');
        }
      }, 300);
    }
    
    console.log('❤️ Removed from favorites:', productId);
  }
}

// ============================================
// CLEAR ALL FAVORITES
// ============================================
window.clearAllFavorites = function() {
  if (confirm('Ви впевнені, що хочете видалити всі товари з обраного?')) {
    localStorage.removeItem(FAVORITES_KEY);
    saveFavorites([]);
    
    // Hide products, show empty state
    document.getElementById('products-section').classList.add('hidden');
    document.getElementById('empty-state').classList.remove('hidden');
    document.getElementById('loading-state').style.display = 'none';
    
    console.log('❤️ All favorites cleared');
  }
}

// ============================================
// RENDER SPICINESS
// ============================================
function renderSpiciness(level) {
  const maxChilies = 5;
  const spicyLevel = Math.min(level || 1, maxChilies);
  let html = '';
  for (let i = 1; i <= maxChilies; i++) {
    html += `<span class="${i <= spicyLevel ? '' : 'opacity-30'}">🌶️</span>`;
  }
  return html;
}

// ============================================
// FORMAT DATE
// ============================================
function formatUkrainianDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const months = [
    'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
    'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  return `${day} ${month}`;
}

function isDateInFuture(dateString) {
  if (!dateString) return false;
  const arrivalDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return arrivalDate >= today;
}

// ============================================
// RENDER PRODUCTS
// ============================================
function renderProducts(products) {
  const grid = document.getElementById('favorites-grid');
  const countEl = document.getElementById('products-count');
  
  if (countEl) countEl.textContent = products.length;
  
  if (products.length === 0) {
    document.getElementById('products-section').classList.add('hidden');
    document.getElementById('empty-state').classList.remove('hidden');
    return;
  }
  
  grid.innerHTML = products.map((product, index) => {
    try {
      // Stock logic
      const stockAmount = product.stock ?? product.quantity ?? 0;
      const inStock = stockAmount > 0;
      
      // Handle both new 'images' array and legacy 'image' field
      const images = product.images && product.images.length > 0 ? product.images : [];
      const img = images[0] || product.image || product.imageUrl || 'https://placehold.co/400x400/fff3e8/ff6b00?text=Latiao';
      
      // Generate spiciness HTML
      const spicinessHTML = renderSpiciness(product.spiciness);
      
      // Cashback calculation
      const cashbackPercent = window.cashbackPercent || 0;
      const isEnabled = window.cashbackEnabled !== false;
      let cashbackHTML = '';
      
      if (isEnabled && cashbackPercent > 0) {
        const finalPrice = product.originalPrice && product.price < product.originalPrice ? product.price : product.price;
        const cashbackAmount = Math.floor(finalPrice * (cashbackPercent / 100));
        
        if (cashbackAmount > 0) {
          cashbackHTML = `
            <div class="mb-3 flex items-center justify-start gap-2 px-2 py-1" style="background-color: #FFF9E6; border: 1px solid #FFD700; border-radius: 8px; width: fit-content; max-width: 100%;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="flex-shrink: 0;">
                <circle cx="12" cy="12" r="10" fill="#E67E22" stroke="#D48806" stroke-width="1.5"/>
                <text x="12" y="16" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12" font-weight="bold">₴</text>
              </svg>
              <span style="color: #5C4033; font-size: 12px; font-weight: 500; line-height: 1;">Кешбек: +${cashbackAmount} грн</span>
            </div>
          `;
        }
      }
      
      // Arrival date message
      let arrivalHTML = '';
      if (stockAmount === 0 && product.is_expected && product.arrival_date && isDateInFuture(product.arrival_date)) {
        arrivalHTML = `
          <div class="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg px-2.5 md:px-3 py-2 mb-3 shadow-sm hover:shadow-md transition-shadow duration-200">
            <p class="text-[10px] md:text-sm font-medium text-gray-700 flex items-center gap-1 md:gap-1.5">
              <span class="text-sm md:text-base flex-shrink-0">✈️</span>
              <span class="flex-1">
                <span class="hidden md:inline">Очікуємо поставку</span>
                <span class="md:hidden">Поставка</span>
                <span class="text-[#ff6b00] font-semibold ml-1">${formatUkrainianDate(product.arrival_date)}</span>
              </span>
            </p>
          </div>
        `;
      }
      
      return `
        <article class="product-card opacity-0 bg-white rounded-3xl shadow-lg overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl group flex flex-col h-full" style="animation-delay: ${index * 0.1}s" data-product-id="${product.id}">
          <!-- Clickable Image & Title Area -->
          <a href="product.html?id=${product.id}" class="block">
            <div class="relative overflow-hidden aspect-square bg-gray-100">
              <img 
                src="${img}" 
                loading="lazy"
                decoding="async"
                class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 ${!inStock ? 'grayscale opacity-50' : ''}" 
                alt="${product.name}"
                onerror="this.src='https://placehold.co/400x400/fff3e8/ff6b00?text=Latiao'"
              >
              
              <span class="absolute top-2 left-2 md:top-3 md:left-3 text-white text-[10px] md:text-xs font-semibold px-2 md:px-3 py-0.5 md:py-1 rounded-full shadow-md ${inStock ? 'bg-green-500' : 'bg-red-500'}">
                ${inStock ? 'В наявності' : 'Немає в наявності'}
              </span>
              
              <!-- Favorite Button (Always Red/Active) -->
              <button 
                onclick="event.preventDefault(); event.stopPropagation(); removeFavorite('${product.id}', this.closest('[data-product-id]'))"
                data-favorite-id="${product.id}"
                class="favorite-btn favorite-active absolute top-2 right-2 md:top-3 md:right-3 w-9 h-9 md:w-10 md:h-10 flex items-center justify-center bg-white/70 backdrop-blur-sm hover:bg-white/90 rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 z-10"
                aria-label="Видалити з обраного"
              >
                <i data-lucide="heart" class="w-4 h-4 md:w-5 md:h-5 text-red-500" fill="currentColor"></i>
              </button>
            </div>
          </a>

          <div class="p-3 md:p-5 flex flex-col flex-1">
            <div class="flex-1">
              <a href="product.html?id=${product.id}" class="block hover:text-orange-600 transition-colors">
                <h3 class="text-sm md:text-lg font-bold text-gray-900 mb-1 md:mb-2 line-clamp-2">${product.name}</h3>
              </a>
              ${(product.originalPrice && product.originalPrice > product.price)
          ? `<div class="flex items-center gap-2 mb-2 md:mb-3">
                     <span class="text-red-500 line-through text-sm md:text-base">₴ ${product.originalPrice}</span>
                     <span class="text-xl md:text-2xl font-extrabold text-green-600">₴ ${product.price}</span>
                     <span class="bg-red-100 text-red-600 text-[10px] md:text-xs font-bold px-1.5 py-0.5 rounded-full">-${Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%</span>
                   </div>`
          : `<p class="text-xl md:text-2xl font-extrabold text-[#ff6b00] mb-2 md:mb-3">₴ ${product.price} <span class="text-xs md:text-sm font-normal text-gray-500">грн</span></p>`
        }
              
              <div class="flex items-center gap-0.5 md:gap-1 mb-2 md:mb-3 text-sm md:text-lg">
                ${spicinessHTML}
              </div>
              
              <!-- Stock Status -->
              <div class="mb-3 flex items-center gap-1 text-xs md:text-sm font-semibold ${inStock ? 'text-green-600' : 'text-red-500'}">
                ${inStock ? '✅ Готово до відправки' : '⛔ Немає в наявності'}
              </div>

              ${cashbackHTML}
              ${arrivalHTML}
            </div>

            <button 
              class="add-to-cart-btn w-full font-bold text-xs md:text-base py-2 md:py-3 px-3 md:px-4 rounded-xl md:rounded-2xl transition-all duration-200 hover:shadow-lg active:scale-95 ${inStock ? 'bg-gradient-to-r from-[#ff6b00] to-[#e53e3e] text-white hover:shadow-orange-300/50' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}"
              data-id="${product.id}"
              data-name="${product.name.replace(/"/g, '&quot;')}"
              data-price="${product.price}"
              data-image="${img}"
              data-stock="${stockAmount}"
              data-spiciness="${product.spiciness || 1}"
              data-sku="${product.sku || product.id}"
              ${!inStock ? 'disabled' : ''}
            >
              ${inStock ? 'Додати в кошик' : 'Немає в наявності'}
            </button>
          </div>
        </article>
      `;
    } catch (productError) {
      console.error('❌ Error rendering product:', product.id, productError);
      return '';
    }
  }).join('');
  
  // Re-init Lucide icons
  setTimeout(() => {
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }, 100);
}

// ============================================
// LOAD FAVORITES
// ============================================
async function loadFavorites() {
  const loadingEl = document.getElementById('loading-state');
  const productsSection = document.getElementById('products-section');
  const emptyState = document.getElementById('empty-state');
  
  try {
    console.log('❤️ Loading favorites...');
    
    // Get favorites from localStorage
    const favoriteIds = getFavorites();
    
    // Check if empty
    if (favoriteIds.length === 0) {
      console.log('❤️ No favorites found');
      loadingEl.style.display = 'none';
      emptyState.classList.remove('hidden');
      return;
    }
    
    console.log(`❤️ Found ${favoriteIds.length} favorites:`, favoriteIds);
    
    // Fetch products from Firestore
    // Firestore 'in' query has a limit of 10, so split into batches
    const batchSize = 10;
    const batches = [];
    
    for (let i = 0; i < favoriteIds.length; i += batchSize) {
      const batch = favoriteIds.slice(i, i + batchSize);
      batches.push(batch);
    }
    
    console.log(`❤️ Fetching ${batches.length} batches...`);
    
    let allProducts = [];
    
    for (const batch of batches) {
      const q = query(
        collection(db, 'products'),
        where(documentId(), 'in', batch)
      );
      
      const snapshot = await getDocs(q);
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      allProducts = allProducts.concat(products);
    }
    
    console.log(`✅ Fetched ${allProducts.length} products`);
    
    // Filter visible products
    const visibleProducts = allProducts.filter(p => p.isVisible !== false);
    
    // Sort by order in favorites array
    visibleProducts.sort((a, b) => {
      return favoriteIds.indexOf(a.id) - favoriteIds.indexOf(b.id);
    });
    
    // Hide loading, show products
    loadingEl.style.display = 'none';
    productsSection.classList.remove('hidden');
    
    // Render products
    renderProducts(visibleProducts);
    
  } catch (error) {
    console.error('❌ Error loading favorites:', error);
    loadingEl.innerHTML = `
      <div class="text-center py-10">
        <p class="text-red-500 font-bold mb-2">❌ Помилка завантаження</p>
        <p class="text-gray-500 mb-4">${error.message}</p>
        <button onclick="location.reload()" class="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
          Спробувати ще раз
        </button>
      </div>
    `;
  }
}

// ============================================
// ADD TO CART (Event Delegation)
// ============================================
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.add-to-cart-btn');
  
  if (btn && !btn.disabled) {
    e.preventDefault();
    
    const product = {
      id: btn.dataset.id,
      name: btn.dataset.name,
      price: parseFloat(btn.dataset.price),
      image: btn.dataset.image,
      stock: parseInt(btn.dataset.stock) || 0,
      spiciness: parseInt(btn.dataset.spiciness) || 1,
      sku: btn.dataset.sku
    };
    
    if (window.addToCart) {
      window.addToCart(product, 'favorites');
      console.log('✅ Item added via delegated click:', product.name);
    } else {
      console.error('❌ window.addToCart function not found!');
    }
  }
});

// ============================================
// CLOUD SYNC FUNCTIONALITY
// ============================================

// Validate and format phone number
function validateAndFormatPhone(phone) {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Handle different formats
  if (cleaned.startsWith('380')) {
    // Already has country code
  } else if (cleaned.startsWith('0')) {
    // Remove leading 0 and add 380
    cleaned = '380' + cleaned.substring(1);
  } else if (cleaned.length === 9) {
    // Just the 9 digits, add 380
    cleaned = '380' + cleaned;
  }
  
  // Validate length (should be 12 digits: 380XXXXXXXXX)
  if (cleaned.length !== 12 || !cleaned.startsWith('380')) {
    return null;
  }
  
  return cleaned;
}

// Format phone for display
function formatPhoneDisplay(phone) {
  if (phone.length === 12) {
    return `+${phone.substring(0, 3)} ${phone.substring(3, 5)} ${phone.substring(5, 8)} ${phone.substring(8, 10)} ${phone.substring(10, 12)}`;
  }
  return phone;
}

// Switch between save and restore tabs
window.switchSyncTab = function(tab) {
  const saveTab = document.getElementById('tab-save');
  const restoreTab = document.getElementById('tab-restore');
  const saveForm = document.getElementById('save-form');
  const restoreForm = document.getElementById('restore-form');
  
  if (tab === 'save') {
    saveTab.classList.add('active');
    restoreTab.classList.remove('active');
    saveForm.classList.remove('hidden');
    restoreForm.classList.add('hidden');
  } else {
    restoreTab.classList.add('active');
    saveTab.classList.remove('active');
    restoreForm.classList.remove('hidden');
    saveForm.classList.add('hidden');
  }
}

// Show message
function showMessage(elementId, message, type = 'success') {
  const messageEl = document.getElementById(elementId);
  if (!messageEl) return;
  
  const bgColor = type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700';
  const icon = type === 'success' ? '✅' : '❌';
  
  messageEl.innerHTML = `
    <div class="${bgColor} border-2 rounded-xl p-3 flex items-center gap-2 animate-fadeIn">
      <span class="text-lg">${icon}</span>
      <span class="text-sm font-medium">${message}</span>
    </div>
  `;
  messageEl.classList.remove('hidden');
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    messageEl.classList.add('hidden');
  }, 5000);
}

// Set button loading state
function setButtonLoading(buttonId, isLoading) {
  const btn = document.getElementById(buttonId);
  if (!btn) return;
  
  if (isLoading) {
    btn.disabled = true;
    btn.classList.add('opacity-70', 'cursor-not-allowed');
    const originalContent = btn.innerHTML;
    btn.dataset.originalContent = originalContent;
    btn.innerHTML = `
      <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span>Обробка...</span>
    `;
  } else {
    btn.disabled = false;
    btn.classList.remove('opacity-70', 'cursor-not-allowed');
    if (btn.dataset.originalContent) {
      btn.innerHTML = btn.dataset.originalContent;
    }
  }
}

// Save favorites to cloud
window.saveFavoritesToCloud = async function() {
  const phoneInput = document.getElementById('save-phone');
  const phone = phoneInput.value.trim();
  
  if (!phone) {
    showMessage('save-message', 'Будь ласка, введіть номер телефону', 'error');
    return;
  }
  
  const validatedPhone = validateAndFormatPhone(phone);
  if (!validatedPhone) {
    showMessage('save-message', 'Невірний формат номера. Використовуйте: +380 XX XXX XX XX', 'error');
    return;
  }
  
  const favorites = getFavorites();
  if (favorites.length === 0) {
    showMessage('save-message', 'У вас немає обраних товарів для збереження', 'error');
    return;
  }
  
  try {
    setButtonLoading('save-btn', true);
    
    // Save to Firestore
    const docRef = doc(db, CLOUD_COLLECTION, validatedPhone);
    await setDoc(docRef, {
      items: favorites,
      updatedAt: serverTimestamp(),
      phone: formatPhoneDisplay(validatedPhone),
      itemCount: favorites.length
    });
    
    console.log('✅ Favorites saved to cloud:', validatedPhone);
    showMessage('save-message', `Ваш список успішно зафіксовано! ✨ (${favorites.length} товарів)`, 'success');
    phoneInput.value = '';
    
  } catch (error) {
    console.error('❌ Error saving to cloud:', error);
    showMessage('save-message', 'Помилка збереження. Спробуйте ще раз.', 'error');
  } finally {
    setButtonLoading('save-btn', false);
  }
}

// Restore favorites from cloud
window.restoreFavoritesFromCloud = async function() {
  const phoneInput = document.getElementById('restore-phone');
  const phone = phoneInput.value.trim();
  
  if (!phone) {
    showMessage('restore-message', 'Будь ласка, введіть номер телефону', 'error');
    return;
  }
  
  const validatedPhone = validateAndFormatPhone(phone);
  if (!validatedPhone) {
    showMessage('restore-message', 'Невірний формат номера. Використовуйте: +380 XX XXX XX XX', 'error');
    return;
  }
  
  try {
    setButtonLoading('restore-btn', true);
    
    // Fetch from Firestore
    const docRef = doc(db, CLOUD_COLLECTION, validatedPhone);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      showMessage('restore-message', 'Дані за цим номером не знайдені', 'error');
      return;
    }
    
    const data = docSnap.data();
    const cloudFavorites = data.items || [];
    
    if (cloudFavorites.length === 0) {
      showMessage('restore-message', 'Збережений список порожній', 'error');
      return;
    }
    
    // Merge with current favorites (prevent duplicates)
    const currentFavorites = getFavorites();
    const mergedFavorites = [...new Set([...currentFavorites, ...cloudFavorites])];
    
    // Save merged list
    saveFavorites(mergedFavorites);
    
    console.log('✅ Favorites restored from cloud:', validatedPhone);
    showMessage('restore-message', `Відновлено ${cloudFavorites.length} товарів! 🎉`, 'success');
    phoneInput.value = '';
    
    // Reload page to show restored favorites
    setTimeout(() => {
      window.location.reload();
    }, 1500);
    
  } catch (error) {
    console.error('❌ Error restoring from cloud:', error);
    showMessage('restore-message', 'Помилка відновлення. Спробуйте ще раз.', 'error');
  } finally {
    setButtonLoading('restore-btn', false);
  }
}

// Add phone input auto-formatting
document.addEventListener('DOMContentLoaded', () => {
  const phoneInputs = ['save-phone', 'restore-phone'];
  
  phoneInputs.forEach(inputId => {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    input.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      
      // Auto-format as user types
      if (value.length > 0) {
        if (value.startsWith('380')) {
          value = value.substring(3);
        } else if (value.startsWith('0')) {
          value = value.substring(1);
        }
        
        // Limit to 9 digits
        value = value.substring(0, 9);
        
        // Format: +380 XX XXX XX XX
        let formatted = '+380';
        if (value.length > 0) formatted += ' ' + value.substring(0, 2);
        if (value.length > 2) formatted += ' ' + value.substring(2, 5);
        if (value.length > 5) formatted += ' ' + value.substring(5, 7);
        if (value.length > 7) formatted += ' ' + value.substring(7, 9);
        
        e.target.value = formatted;
      }
    });
    
    // Handle Enter key
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        if (inputId === 'save-phone') {
          window.saveFavoritesToCloud();
        } else {
          window.restoreFavoritesFromCloud();
        }
      }
    });
  });
});

// ============================================
// INIT
// ============================================
async function initPage() {
  // Wait for Firebase
  if (!db || typeof db !== 'object') {
    console.log('⏳ Waiting for Firebase...');
    for (let i = 0; i < 20; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (db && typeof db === 'object') {
        console.log('✅ Firebase ready');
        break;
      }
    }
  }
  
  if (!db) {
    console.error('❌ Firebase timeout');
    document.getElementById('loading-state').innerHTML = `
      <div class="text-center py-10">
        <p class="text-red-500 font-bold">❌ Помилка підключення до бази даних</p>
      </div>
    `;
    return;
  }
  
  // Load favorites
  await loadFavorites();
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPage);
} else {
  initPage();
}
