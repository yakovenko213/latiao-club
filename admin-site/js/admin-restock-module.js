/**
 * ============================================
 * RESTOCK NOTIFICATIONS MODULE
 * ============================================
 * 
 * Standalone module for managing customer restock notification requests
 * in the Admin Panel. Displays customers who want to be notified when
 * out-of-stock products become available again.
 * 
 * Dependencies:
 * - Firebase App (getApp) - must be initialized before loading this module
 * - Global exports: window.db, window.showToast
 * - Lucide Icons (lucide.createIcons)
 * 
 * Exports:
 * - window.initRestockView() - Main initialization function
 * - window.sendRestockSMS() - Send SMS notification to customer
 * - window.deleteRestockRequest() - Remove a restock request
 * 
 * @author Admin Panel Team
 * @version 1.0
 */

import { 
  getFirestore, 
  collection, 
  getDocs, 
  getDoc, 
  deleteDoc,
  doc, 
  query, 
  where, 
  orderBy, 
  onSnapshot 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
import { getApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js'

// Use existing app instance (already initialized with auth)
const app = getApp()
const restockDb = getFirestore(app)

// Module state
let restockUnsubscribe = null
let productsCache = new Map()
let isLoading = false

// ============================================
// PRODUCTS CACHE
// ============================================

/**
 * Fetch product by ID with caching
 * @param {string} productId - The product document ID
 * @returns {Promise<Object|null>} Product data or null if not found
 */
async function fetchProductById(productId) {
  if (!productId) return null
  
  // Check cache first
  if (productsCache.has(productId)) {
    return productsCache.get(productId)
  }
  
  try {
    const productDoc = await getDoc(doc(restockDb, 'products', productId))
    if (productDoc.exists()) {
      const productData = { 
        id: productDoc.id, 
        ...productDoc.data() 
      }
      productsCache.set(productId, productData)
      return productData
    } else {
      // Cache null result to avoid repeated lookups
      productsCache.set(productId, null)
      return null
    }
  } catch (error) {
    console.error(`❌ [RESTOCK] Error fetching product ${productId}:`, error)
    return null
  }
}

/**
 * Batch fetch products for multiple requests
 * @param {Array} requests - Array of restock requests
 * @returns {Promise<Map>} Map of productId to product data
 */
async function batchFetchProducts(requests) {
  const productIds = [...new Set(requests.map(r => r.productId).filter(Boolean))]
  const results = new Map()
  
  // Separate cached and uncached
  const toFetch = []
  for (const id of productIds) {
    if (productsCache.has(id)) {
      results.set(id, productsCache.get(id))
    } else {
      toFetch.push(id)
    }
  }
  
  // Fetch uncached products
  if (toFetch.length > 0) {
    const fetchPromises = toFetch.map(id => fetchProductById(id))
    const products = await Promise.all(fetchPromises)
    
    products.forEach((product, index) => {
      if (product) {
        results.set(toFetch[index], product)
      }
    })
  }
  
  return results
}

// ============================================
// UI RENDERING
// ============================================

/**
 * Render loading state
 */
function renderLoading() {
  return `
    <div class="flex items-center justify-center py-16">
      <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-500 mb-4"></div>
        <p class="text-gray-600 font-medium">Завантаження запитів...</p>
      </div>
    </div>
  `
}

/**
 * Render empty state
 */
function renderEmptyState() {
  return `
    <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
      <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <i data-lucide="bell-off" class="w-10 h-10 text-gray-400"></i>
      </div>
      <h3 class="text-xl font-bold text-gray-900 mb-2">Наразі немає запитів на сповіщення</h3>
      <p class="text-gray-500">Коли клієнти залишать запити про наявність товару, вони з'являться тут</p>
    </div>
  `
}

/**
 * Format date as DD.MM.YYYY HH:mm
 * @param {Date} date - Date object
 * @returns {string} Formatted date string
 */
function formatDateTime(date) {
  if (!date || !(date instanceof Date)) return 'N/A'
  
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  
  return `${day}.${month}.${year} ${hours}:${minutes}`
}

/**
 * Render single restock request row
 * @param {Object} request - Restock request data
 * @param {Object} product - Product data
 * @returns {string} HTML for table row
 */
function renderRequestRow(request, product) {
  const productName = product?.name || 'Товар не знайдено'
  const productSKU = product?.sku || product?.SKU || 'N/A'
  const productImage = product?.image || 'https://via.placeholder.com/80?text=No+Image'
  const phone = request.phone || request.phoneNumber || 'Не вказано'
  const dateObj = request.requestedAt?.toDate ? request.requestedAt.toDate() : 
                  request.createdAt?.toDate ? request.createdAt.toDate() : new Date()
  const formattedDateTime = formatDateTime(dateObj)
  
  // Clean phone for links
  const cleanPhone = phone.replace(/\D/g, '')
  
  return `
    <tr class="hover:bg-gray-50 transition-colors" data-request-id="${request.id}">
      <!-- Photo -->
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="w-16 h-16 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
          <img 
            src="${productImage}" 
            alt="${productName}" 
            class="w-full h-full object-cover"
            onerror="this.src='https://via.placeholder.com/80?text=No+Image'"
          >
        </div>
      </td>

      <!-- Product Info -->
      <td class="px-6 py-4">
        <div class="text-sm font-semibold text-gray-900">${productName}</div>
        <div class="text-xs text-gray-500 mt-1">
          Артикул: <span class="font-mono">${productSKU}</span>
        </div>
      </td>

      <!-- Phone -->
      <td class="px-6 py-4 whitespace-nowrap">
        <a 
          href="tel:${cleanPhone}" 
          class="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline flex items-center gap-1.5"
        >
          <i data-lucide="phone" class="w-4 h-4"></i>
          ${phone}
        </a>
      </td>

      <!-- Date/Time -->
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm text-gray-700">${formattedDateTime}</div>
      </td>

      <!-- Actions -->
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="flex items-center gap-2">
          <button 
            onclick="window.sendRestockSMS('${phone}', '${productName.replace(/'/g, "\\'")}', '${request.id}')"
            class="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-all shadow-sm hover:shadow-md"
          >
            <i data-lucide="message-circle" class="w-4 h-4"></i>
            Надіслати СМС
          </button>
          <button 
            onclick="window.deleteRestockRequest('${request.id}')"
            class="inline-flex items-center justify-center w-9 h-9 text-red-600 hover:bg-red-50 rounded-lg transition-all"
            title="Видалити запит"
          >
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>
      </td>
    </tr>
  `
}

/**
 * Render main table with all requests
 * @param {Array} requests - Array of restock requests with product data
 * @returns {string} HTML for complete table
 */
function renderTable(requests) {
  return `
    <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-bold text-gray-900">Запити на повідомлення про наявність</h3>
            <p class="text-sm text-gray-500 mt-1">Всього активних запитів: ${requests.length}</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              <i data-lucide="bell" class="w-4 h-4 mr-1"></i>
              ${requests.length}
            </span>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Фото</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Товар</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Телефон</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Дата/Час</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Дія</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200" id="restock-table-body">
            ${requests.map(req => renderRequestRow(req, req.product)).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `
}

/**
 * Render error state
 * @param {string} message - Error message
 */
function renderError(message) {
  return `
    <div class="bg-white rounded-2xl border border-red-200 shadow-sm p-12 text-center">
      <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <i data-lucide="alert-circle" class="w-10 h-10 text-red-600"></i>
      </div>
      <h3 class="text-xl font-bold text-gray-900 mb-2">Помилка завантаження</h3>
      <p class="text-gray-600 mb-4">${message}</p>
      <button 
        onclick="window.initRestockView()" 
        class="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all shadow-sm"
      >
        Спробувати ще раз
      </button>
    </div>
  `
}

// ============================================
// DATA MANAGEMENT
// ============================================

/**
 * Update the UI with new data
 * @param {Array} requests - Array of restock requests
 */
async function updateUI(requests) {
  const container = document.getElementById('restock-container')
  if (!container) {
    console.error('❌ [RESTOCK] Container not found')
    return
  }

  if (requests.length === 0) {
    container.innerHTML = renderEmptyState()
  } else {
    // Fetch product data for all requests
    const productsMap = await batchFetchProducts(requests)
    
    // Attach product data to requests
    const enrichedRequests = requests.map(req => ({
      ...req,
      product: productsMap.get(req.productId)
    }))
    
    container.innerHTML = renderTable(enrichedRequests)
  }

  // Reinitialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons()
  }
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Main initialization function
 * Sets up real-time listener for restock requests
 */
window.initRestockView = async function() {
  console.log('🔔 [RESTOCK] Initializing Restock Requests view...')
  
  const container = document.getElementById('restock-container')
  if (!container) {
    console.error('❌ [RESTOCK] Container element not found')
    return
  }

  // Show loading state
  isLoading = true
  container.innerHTML = renderLoading()

  // Clean up existing listener
  if (restockUnsubscribe) {
    restockUnsubscribe()
    restockUnsubscribe = null
  }

  try {
    // Create query - use 'createdAt' as primary field (common in Firestore)
    // If your collection uses 'requestedAt', change this accordingly
    const restockQuery = query(
      collection(restockDb, 'restock_requests'),
      orderBy('createdAt', 'desc')
    )
    
    // Set up real-time listener
    restockUnsubscribe = onSnapshot(
      restockQuery,
      (snapshot) => {
        console.log(`🔔 [RESTOCK] Received ${snapshot.size} requests`)
        
        const requests = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        
        isLoading = false
        updateUI(requests)
      },
      (error) => {
        console.error('❌ [RESTOCK] Snapshot error:', error)
        isLoading = false
        
        if (error.code === 'permission-denied') {
          container.innerHTML = renderError('Помилка доступу: Перевірте права доступу до Firestore')
        } else {
          container.innerHTML = renderError(error.message)
        }
        
        // Reinitialize icons
        if (typeof lucide !== 'undefined') {
          lucide.createIcons()
        }
      }
    )
    
  } catch (error) {
    console.error('❌ [RESTOCK] Initialization error:', error)
    isLoading = false
    container.innerHTML = renderError(error.message)
    
    // Reinitialize icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons()
    }
  }
}

/**
 * Send SMS notification to customer (placeholder)
 * @param {string} phone - Customer phone number
 * @param {string} productName - Product name
 * @param {string} requestId - Request ID
 */
window.sendRestockSMS = function(phone, productName, requestId) {
  console.log('📱 [RESTOCK] Sending SMS:', { phone, productName, requestId })
  
  // Show toast notification
  if (typeof window.showToast === 'function') {
    window.showToast(`Відкриття сервісу розсилки для ${phone}...`, 'info')
  }
  
  // Create SMS link and open it
  const smsText = encodeURIComponent(`Привіт! Товар "${productName}" знову в наявності! Замовляйте на latiao.club`)
  const smsLink = `sms:${phone}?body=${smsText}`
  
  // Open SMS app
  window.open(smsLink, '_blank')
  
  // Log to console
  console.log('📱 [RESTOCK] SMS link opened:', smsLink)
}

/**
 * Delete a restock request
 * @param {string} requestId - Request ID to delete
 */
window.deleteRestockRequest = async function(requestId) {
  console.log('🗑️ [RESTOCK] Deleting request:', requestId)
  
  if (!confirm('Видалити цей запит на сповіщення?')) {
    return
  }
  
  try {
    await deleteDoc(doc(restockDb, 'restock_requests', requestId))
    
    if (typeof window.showToast === 'function') {
      window.showToast('Запит успішно видалено', 'success')
    }
    
    console.log('✅ [RESTOCK] Request deleted successfully')
  } catch (error) {
    console.error('❌ [RESTOCK] Delete error:', error)
    
    if (typeof window.showToast === 'function') {
      window.showToast('Помилка видалення: ' + error.message, 'error')
    }
  }
}

// ============================================
// CLEANUP
// ============================================

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  if (restockUnsubscribe) {
    restockUnsubscribe()
  }
})

console.log('✅ [RESTOCK] Module loaded successfully')
