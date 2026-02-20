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
  onSnapshot,
  setDoc,
  updateDoc,
  addDoc,
  serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
import { getApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js'

// Use existing app instance (already initialized with auth)
const app = getApp()
const restockDb = getFirestore(app)

// Module state
let restockUnsubscribe = null
let productsCache = new Map()
let isLoading = false
let messageTemplate = 'Привіт! Товар "{productName}" знову в наявності! {link}'

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
        ${request.productId ? `<div class="text-xs text-gray-400 mt-0.5">ID: ${request.productId}</div>` : ''}
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
            id="sms-btn-${request.id}"
            onclick="window.sendRestockSMS('${phone}', '${productName.replace(/'/g, "\\'").replace(/"/g, '&quot;')}', '${request.id}', '${request.productId || ''}')"
            class="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i data-lucide="message-circle" class="w-4 h-4"></i>
            <span>Надіслати СМС</span>
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
            <button 
              onclick="window.openRestockSettings()" 
              class="p-2 hover:bg-gray-200 rounded-full transition-colors"
              title="Налаштування"
            >
              <i data-lucide="settings" class="w-5 h-5 text-gray-600"></i>
            </button>
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

  // Load message template from Firestore
  await loadMessageTemplate()

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
 * Send SMS notification to customer via TurboSMS API
 * @param {string} phone - Customer phone number
 * @param {string} productName - Product name
 * @param {string} requestId - Request ID
 * @param {string} productId - Product ID for generating link
 */
window.sendRestockSMS = async function(phone, productName, requestId, productId) {
  console.log('📱 [RESTOCK] Starting SMS sending process:', { phone, productName, requestId, productId })
  
  const btnId = `sms-btn-${requestId}`
  const btn = document.getElementById(btnId)
  
  if (!btn) {
    console.error('❌ [RESTOCK] Button not found:', btnId)
    return
  }
  
  // Disable button and show loading state
  btn.disabled = true
  const originalHTML = btn.innerHTML
  btn.innerHTML = `
    <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <span>Відправка...</span>
  `
  
  try {
    // Step 1: Fetch API Credentials from Firestore - MULTI-LOCATION SEARCH
    console.log('🔑 [RESTOCK] Starting TurboSMS credentials search...')
    console.log('📍 [RESTOCK] Will search in multiple collections: config, admin_settings, settings')
    
    let turboSmsToken = null
    let senderName = null
    let foundLocation = null
    
    // Search strategy: try multiple collections
    const collectionsToSearch = ['config', 'admin_settings', 'settings']
    
    for (const collectionName of collectionsToSearch) {
      console.log(`\n🔍 [RESTOCK] Searching in collection: "${collectionName}"...`)
      
      try {
        const querySnapshot = await getDocs(collection(restockDb, collectionName))
        
        if (querySnapshot.empty) {
          console.log(`   ⚠️ Collection "${collectionName}" is empty or doesn't exist`)
          continue
        }
        
        console.log(`   📋 Found ${querySnapshot.size} document(s) in "${collectionName}"`)
        
        // Check each document
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          console.log(`\n   📄 Document: ${collectionName}/${doc.id}`)
          console.log(`      • All fields: ${Object.keys(data).join(', ')}`)
          
          // Check for different possible field names
          const hasToken = data.turboSmsToken || data.sms_settings || data.apiKey || data.api_key
          const hasSender = data.senderName || data.sender || data.alphaName || data.alpha_name
          
          console.log(`      • Has token field: ${!!hasToken}`)
          console.log(`      • Has sender field: ${!!hasSender}`)
          
          // If we found both fields, use this document
          if (hasToken && hasSender && !turboSmsToken) {
            turboSmsToken = hasToken
            senderName = hasSender
            foundLocation = `${collectionName}/${doc.id}`
            console.log(`   ✅ FOUND CREDENTIALS in ${foundLocation}!`)
            console.log(`      • Token field: ${data.turboSmsToken ? 'turboSmsToken' : data.sms_settings ? 'sms_settings' : data.apiKey ? 'apiKey' : 'api_key'}`)
            console.log(`      • Sender field: ${data.senderName ? 'senderName' : data.sender ? 'sender' : data.alphaName ? 'alphaName' : 'alpha_name'}`)
          }
        })
        
        // If we found credentials, stop searching
        if (turboSmsToken && senderName) {
          break
        }
        
      } catch (error) {
        console.log(`   ❌ Error accessing collection "${collectionName}":`, error.message)
      }
    }
    
    // Validate that we found credentials
    if (!turboSmsToken || !senderName) {
      console.error('\n❌ [RESTOCK] CREDENTIALS NOT FOUND!')
      console.error('📋 [RESTOCK] Searched in: config, admin_settings, settings')
      console.error('🔍 [RESTOCK] Please check Firebase Console and verify:')
      console.error('   1. Collection exists (config, admin_settings, or settings)')
      console.error('   2. Document has field: turboSmsToken (or sms_settings, apiKey)')
      console.error('   3. Document has field: senderName (or sender, alphaName)')
      console.error('\n💡 [RESTOCK] Visit turbosms-setup.html to configure credentials')
      
      throw new Error('❌ TurboSMS налаштування не знайдено в жодній колекції. Відкрийте Firebase Console → Firestore і перевірте, що дані існують.')
    }
    
    console.log('\n✅ [RESTOCK] TurboSMS credentials found and validated')
    console.log(`   • Location: ${foundLocation}`)
    console.log('   • Found TurboSMS Token:', !!turboSmsToken)
    console.log('   • Using Sender Name:', senderName)
    console.log('   • Token length:', turboSmsToken.length, 'characters')
    
    // Step 2: Validate and format phone number
    let formattedPhone = phone.trim()
    
    // Ensure phone starts with +380
    if (!formattedPhone.startsWith('+')) {
      if (formattedPhone.startsWith('380')) {
        formattedPhone = '+' + formattedPhone
      } else if (formattedPhone.startsWith('0')) {
        formattedPhone = '+38' + formattedPhone
      } else {
        formattedPhone = '+380' + formattedPhone
      }
    }
    
    console.log('📞 [RESTOCK] Phone formatted:', phone, '→', formattedPhone)
    
    // Step 3: Fetch and compose message template
    console.log('📝 [RESTOCK] Fetching message template from admin_settings/restock_config...')
    const restockConfigRef = doc(restockDb, 'admin_settings', 'restock_config')
    const restockConfigSnap = await getDoc(restockConfigRef)
    
    let template = messageTemplate // Use cached template as fallback
    if (restockConfigSnap.exists() && restockConfigSnap.data().messageTemplate) {
      template = restockConfigSnap.data().messageTemplate
      console.log('✅ [RESTOCK] Custom template loaded from Firestore')
    } else {
      console.log('⚠️ [RESTOCK] Using default template (restock_config not found)')
    }
    
    // Generate product URL
    const baseUrl = 'https://latiao-snack.com.ua'
    const productUrl = productId ? `${baseUrl}/product.html?id=${productId}` : baseUrl
    
    // Replace placeholders
    const messageText = template
      .replace(/{productName}/g, productName)
      .replace(/{link}/g, productUrl)
    
    console.log('✅ [RESTOCK] Message composed:')
    console.log('   Template:', template)
    console.log('   Final message:', messageText)
    
    // Step 4: Send SMS via TurboSMS API
    console.log('🚀 [RESTOCK] Preparing TurboSMS API call...')
    console.log('   • Endpoint: https://api.turbosms.ua/message/send.json')
    console.log('   • Recipient:', formattedPhone)
    console.log('   • Sender:', senderName)
    console.log('   • Token (first 10 chars):', turboSmsToken.substring(0, 10) + '...')
    console.log('   • Message length:', messageText.length, 'characters')
    
    const apiResponse = await fetch('https://api.turbosms.ua/message/send.json', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + turboSmsToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipients: [formattedPhone],
        sms: {
          sender: senderName,
          text: messageText
        }
      })
    })
    
    const responseData = await apiResponse.json()
    console.log('📡 [RESTOCK] TurboSMS API Response:')
    console.log('   • Status:', apiResponse.status, apiResponse.statusText)
    console.log('   • Response:', JSON.stringify(responseData, null, 2))
    
    if (!apiResponse.ok) {
      throw new Error(`TurboSMS API Error: ${responseData.message || apiResponse.statusText} (HTTP ${apiResponse.status})`)
    }
    
    // Check for TurboSMS-specific response codes
    // 800 = SUCCESS, 801 = SUCCESS_MESSAGE_SENT
    const successCodes = [0, 800, 801]
    const responseCode = responseData.response_code
    
    console.log('🔍 [RESTOCK] Checking response code:', responseCode)
    
    if (responseCode && !successCodes.includes(responseCode)) {
      // This is an actual error (401 = unauthorized, 103 = insufficient balance, etc.)
      const errorDescription = responseData.response_status || responseData.message || 'Unknown error'
      throw new Error(`TurboSMS Error ${responseCode}: ${errorDescription}`)
    }
    
    console.log('✅ [RESTOCK] SMS sent successfully! (Code:', responseCode + ')')
    
    // Step 5: Log successful SMS to Firestore
    console.log('💾 [RESTOCK] Logging SMS transaction to sms_logs...')
    await addDoc(collection(restockDb, 'sms_logs'), {
      phone: formattedPhone,
      originalPhone: phone,
      productName: productName,
      productId: productId || null,
      message: messageText,
      sender: senderName,
      requestId: requestId,
      status: 'sent',
      sendType: 'MANUAL',
      apiResponse: responseData,
      timestamp: serverTimestamp(),
      sentAt: new Date().toISOString()
    })
    
    console.log('✅ [RESTOCK] SMS logged successfully')
    
    // Step 5.5: Update restock request status to 'sent_manual'
    console.log('📝 [RESTOCK] Updating request status...')
    try {
      await updateDoc(doc(restockDb, 'restock_requests', requestId), {
        status: 'sent_manual',
        sentAt: new Date().toISOString(),
        sentVia: 'manual'
      })
      console.log('✅ [RESTOCK] Request status updated')
    } catch (updateError) {
      console.error('⚠️ [RESTOCK] Failed to update request status:', updateError)
      // Don't fail the whole operation if status update fails
    }
    
    // Step 6: Update UI - Change button to show "Sent" status
    btn.disabled = true
    btn.classList.remove('bg-blue-500', 'hover:bg-blue-600')
    btn.classList.add('bg-green-500')
    btn.innerHTML = `
      <i data-lucide="check-circle" class="w-4 h-4"></i>
      <span>Надіслано</span>
    `
    if (typeof lucide !== 'undefined') {
      lucide.createIcons()
    }
    
    // Step 7: Show success toast
    if (typeof window.showToast === 'function') {
      window.showToast(`✅ СМС успішно відправлено на ${formattedPhone}!`, 'success')
    }
    
  } catch (error) {
    console.error('❌ [RESTOCK] SMS sending failed:', error)
    console.error('   • Error type:', error.constructor.name)
    console.error('   • Error message:', error.message)
    console.error('   • Stack trace:', error.stack)
    
    // Log failed attempt
    try {
      await addDoc(collection(restockDb, 'sms_logs'), {
        phone: phone,
        productName: productName,
        productId: productId || null,
        requestId: requestId,
        status: 'failed',
        error: error.message,
        errorStack: error.stack,
        timestamp: serverTimestamp(),
        attemptedAt: new Date().toISOString()
      })
      console.log('✅ [RESTOCK] Error logged to sms_logs')
    } catch (logError) {
      console.error('❌ [RESTOCK] Failed to log error:', logError)
    }
    
    // Show error toast with detailed message
    if (typeof window.showToast === 'function') {
      const errorMsg = error.message || 'Невідома помилка'
      window.showToast(`❌ Помилка відправки СМС: ${errorMsg}`, 'error')
    }
    
    // Restore button immediately on error
    btn.disabled = false
    btn.innerHTML = originalHTML
    if (typeof lucide !== 'undefined') {
      lucide.createIcons()
    }
  }
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
// SETTINGS MANAGEMENT
// ============================================

/**
 * Load message template from Firestore
 */
async function loadMessageTemplate() {
  try {
    const configRef = doc(restockDb, 'admin_settings', 'restock_config')
    const configSnap = await getDoc(configRef)
    
    if (configSnap.exists()) {
      const data = configSnap.data()
      if (data.messageTemplate) {
        messageTemplate = data.messageTemplate
        console.log('✅ [RESTOCK] Message template loaded:', messageTemplate)
      }
    }
  } catch (error) {
    console.error('❌ [RESTOCK] Error loading template:', error)
  }
}

/**
 * Open settings modal
 */
window.openRestockSettings = async function() {
  console.log('⚙️ [RESTOCK] Opening settings modal')
  
  // Create modal if it doesn't exist
  if (!document.getElementById('restock-settings-modal')) {
    createSettingsModal()
  }
  
  // Load current settings from Firestore
  try {
    const configRef = doc(restockDb, 'admin_settings', 'restock_config')
    const configSnap = await getDoc(configRef)
    
    if (configSnap.exists()) {
      const data = configSnap.data()
      
      // Populate template
      const textarea = document.getElementById('restock-template-textarea')
      if (textarea && data.messageTemplate) {
        textarea.value = data.messageTemplate
      } else if (textarea) {
        textarea.value = messageTemplate
      }
      
      // Populate auto-send toggle
      const toggle = document.getElementById('auto-send-toggle')
      if (toggle) {
        // Ensure boolean value (handle undefined/null)
        toggle.checked = (data.autoSendEnabled === true)
      }
    } else {
      // Use default values
      const textarea = document.getElementById('restock-template-textarea')
      if (textarea) {
        textarea.value = messageTemplate
      }
    }
  } catch (error) {
    console.error('❌ [RESTOCK] Error loading settings:', error)
  }
  
  // Show modal
  const modal = document.getElementById('restock-settings-modal')
  if (modal) {
    modal.classList.remove('hidden')
    document.body.style.overflow = 'hidden'
  }
}

/**
 * Close settings modal
 */
window.closeRestockSettings = function() {
  const modal = document.getElementById('restock-settings-modal')
  if (modal) {
    modal.classList.add('hidden')
    document.body.style.overflow = ''
  }
}

/**
 * Save message template to Firestore
 */
window.saveRestockTemplate = async function() {
  const textarea = document.getElementById('restock-template-textarea')
  const toggle = document.getElementById('auto-send-toggle')
  const saveBtn = document.getElementById('save-template-btn')
  
  if (!textarea) return
  
  const newTemplate = textarea.value.trim()
  // Ensure autoSendEnabled is always boolean (never undefined)
  const autoSendEnabled = toggle ? (toggle.checked === true) : false
  
  if (!newTemplate) {
    if (typeof window.showToast === 'function') {
      window.showToast('Шаблон не може бути порожнім', 'error')
    }
    return
  }
  
  // Disable button and show loading
  if (saveBtn) {
    saveBtn.disabled = true
    saveBtn.innerHTML = '<svg class="animate-spin h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>'
  }
  
  try {
    const configRef = doc(restockDb, 'admin_settings', 'restock_config')
    await setDoc(configRef, {
      messageTemplate: newTemplate,
      autoSendEnabled: autoSendEnabled,
      updatedAt: new Date().toISOString()
    }, { merge: true })
    
    // Update local variable
    messageTemplate = newTemplate
    
    const statusMsg = autoSendEnabled 
      ? 'Шаблон збережено! Автоматична розсилка увімкнена ⚡' 
      : 'Шаблон збережено!'
    
    if (typeof window.showToast === 'function') {
      window.showToast(statusMsg, 'success')
    }
    
    console.log('✅ [RESTOCK] Settings saved:', { autoSendEnabled })
    
    // Close modal after a short delay
    setTimeout(() => {
      window.closeRestockSettings()
    }, 1000)
    
  } catch (error) {
    console.error('❌ [RESTOCK] Error saving template:', error)
    
    if (typeof window.showToast === 'function') {
      window.showToast('Помилка збереження: ' + error.message, 'error')
    }
  } finally {
    // Re-enable button
    if (saveBtn) {
      saveBtn.disabled = false
      saveBtn.innerHTML = '<i data-lucide="save" class="w-4 h-4 mr-2"></i>Зберегти'
      if (typeof lucide !== 'undefined') {
        lucide.createIcons()
      }
    }
  }
}

/**
 * Create settings modal HTML
 */
function createSettingsModal() {
  const modalHTML = `
    <div id="restock-settings-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4" onclick="if(event.target === this) window.closeRestockSettings()">
      <div class="bg-white rounded-2xl w-full max-w-2xl shadow-2xl transform transition-all" onclick="event.stopPropagation()">
        
        <!-- Header -->
        <div class="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <i data-lucide="settings" class="w-5 h-5 text-blue-600"></i>
            </div>
            <div>
              <h3 class="text-lg font-bold text-gray-900">Налаштування розсилки</h3>
              <p class="text-sm text-gray-500">Шаблон повідомлень про наявність</p>
            </div>
          </div>
          <button onclick="window.closeRestockSettings()" class="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <i data-lucide="x" class="w-5 h-5 text-gray-400"></i>
          </button>
        </div>
        
        <!-- Content -->
        <div class="p-6">
          
          <!-- Auto-Send Toggle -->
          <div class="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <i data-lucide="zap" class="w-5 h-5 text-purple-600"></i>
                </div>
                <div>
                  <h4 class="text-sm font-bold text-gray-900">Автоматична розсилка</h4>
                  <p class="text-xs text-gray-600">Відправляти СМС автоматично при поповненні залишку</p>
                </div>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" id="auto-send-toggle" class="sr-only peer">
                <div class="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
            <div class="mt-3 text-xs text-gray-600 flex items-start gap-2">
              <i data-lucide="info" class="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5"></i>
              <span>Коли ви оновлюєте залишок товару на складі (≥ 1), система автоматично надішле СМС всім клієнтам, які очікують на повідомлення.</span>
            </div>
          </div>
          
          <div class="mb-4">
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Шаблон повідомлення
            </label>
            <textarea 
              id="restock-template-textarea"
              rows="5"
              class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none font-mono text-sm"
              placeholder="Введіть шаблон повідомлення..."
            ></textarea>
          </div>
          
          <!-- Info Box -->
          <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div class="flex items-start gap-3">
              <i data-lucide="info" class="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"></i>
              <div class="flex-1">
                <p class="text-sm font-semibold text-blue-900 mb-2">Доступні змінні:</p>
                <ul class="text-sm text-blue-700 space-y-1">
                  <li>• <code class="bg-blue-100 px-2 py-0.5 rounded font-mono">{productName}</code> - назва товару</li>
                  <li>• <code class="bg-blue-100 px-2 py-0.5 rounded font-mono">{link}</code> - посилання на товар</li>
                </ul>
                <p class="text-xs text-blue-600 mt-3">
                  Приклад: Привіт! Товар "{productName}" знову в наявності! {link}
                </p>
              </div>
            </div>
          </div>
          
          <!-- Action Buttons -->
          <div class="flex gap-3">
            <button 
              onclick="window.closeRestockSettings()" 
              class="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              Скасувати
            </button>
            <button 
              id="save-template-btn"
              onclick="window.saveRestockTemplate()" 
              class="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-center"
            >
              <i data-lucide="save" class="w-4 h-4 mr-2"></i>
              Зберегти
            </button>
          </div>
        </div>
        
      </div>
    </div>
  `
  
  document.body.insertAdjacentHTML('beforeend', modalHTML)
  
  // Reinitialize icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons()
  }
}

// ============================================
// AUTO-NOTIFICATION SYSTEM
// ============================================

/**
 * NEW: Check and send automatic SMS notifications based on product Article/SKU
 * Called from warehouse updateStock function
 * @param {string} article - Product SKU/Article that was restocked
 */
window.checkAndSendAutoNotifications = async function(article) {
  console.log('🤖 [AUTO-RESTOCK] Checking notifications for article:', article)
  
  if (!article) {
    console.error('   ❌ Article/SKU is required')
    return
  }
  
  try {
    // Step 1: Check if auto-send is enabled
    const configRef = doc(restockDb, 'admin_settings', 'restock_config')
    const configSnap = await getDoc(configRef)
    
    const autoSendEnabled = configSnap.exists() && (configSnap.data().autoSendEnabled === true)
    
    if (!autoSendEnabled) {
      console.log('   ⚠️ Auto-send is disabled, skipping notifications')
      return
    }
    
    console.log('   ✅ Auto-send is enabled, searching for pending requests...')
    
    // Step 2: Query restock_requests by productArticle (SKU)
    const requestsQuery = query(
      collection(restockDb, 'restock_requests'),
      where('productArticle', '==', article),
      where('status', '==', 'pending')
    )
    
    const requestsSnapshot = await getDocs(requestsQuery)
    
    if (requestsSnapshot.empty) {
      console.log('   ℹ️ No pending requests for this SKU')
      return
    }
    
    console.log(`   📋 Found ${requestsSnapshot.size} pending request(s) for SKU: ${article}`)
    
    // Step 3: Get product details (use first request's productId)
    let productName = 'Товар'
    let productId = null
    
    if (requestsSnapshot.docs.length > 0) {
      const firstRequest = requestsSnapshot.docs[0].data()
      productId = firstRequest.productId
      productName = firstRequest.productName || 'Товар'
      
      // Try to get fresh product name from products collection
      if (productId) {
        try {
          const productDoc = await getDoc(doc(restockDb, 'products', productId))
          if (productDoc.exists()) {
            productName = productDoc.data().name || productName
          }
        } catch (err) {
          console.warn('   ⚠️ Could not fetch product details, using cached name')
        }
      }
    }
    
    console.log('   📦 Product name:', productName)
    
    let successCount = 0
    let failCount = 0
    
    // Step 4: Process each request
    for (const requestDoc of requestsSnapshot.docs) {
      const request = requestDoc.data()
      const phone = request.phone || request.phoneNumber
      
      if (!phone) {
        console.warn(`   ⚠️ Request ${requestDoc.id} has no phone number`)
        failCount++
        continue
      }
      
      console.log(`   📱 Auto-sending SMS to ${phone}...`)
      
      try {
        await sendAutoRestockSMS(phone, productName, requestDoc.id, productId)
        successCount++
      } catch (error) {
        console.error(`   ❌ Failed to send to ${phone}:`, error.message)
        failCount++
      }
    }
    
    // Step 5: Show summary toast
    if (typeof window.showToast === 'function') {
      const message = `⚡ Автоматична розсилка: ${successCount} успішно, ${failCount} помилок`
      window.showToast(message, successCount > 0 ? 'success' : 'error')
    }
    
    console.log(`✅ [AUTO-RESTOCK] Completed: ${successCount} sent, ${failCount} failed`)
    
    // Step 6: Refresh UI if restock view is displayed
    if (document.getElementById('restock-container')) {
      console.log('   🔄 Restock view will auto-refresh via onSnapshot')
    }
    
  } catch (error) {
    console.error('❌ [AUTO-RESTOCK] Error:', error)
    if (typeof window.showToast === 'function') {
      window.showToast('Помилка автоматичної розсилки: ' + error.message, 'error')
    }
  }
}

/**
 * OLD: Trigger automatic SMS notifications when stock is updated (DEPRECATED - uses productId)
 * Kept for backward compatibility
 * @param {string} productId - Product ID that was restocked
 * @param {number} newStock - New stock value
 */
window.triggerAutoRestockNotifications = async function(productId, newStock) {
  console.log('🤖 [AUTO-RESTOCK] Checking for auto-notification trigger')
  console.log('   • Product ID:', productId)
  console.log('   • New Stock:', newStock)
  
  // Only trigger if stock is >= 1
  if (newStock < 1) {
    console.log('   ⚠️ Stock < 1, skipping auto-notifications')
    return
  }
  
  try {
    // Check if auto-send is enabled
    const configRef = doc(restockDb, 'admin_settings', 'restock_config')
    const configSnap = await getDoc(configRef)
    
    // Ensure boolean check (handle undefined/null/missing field)
    const autoSendEnabled = configSnap.exists() && (configSnap.data().autoSendEnabled === true)
    
    if (!autoSendEnabled) {
      console.log('   ⚠️ Auto-send is disabled, skipping notifications')
      return
    }
    
    console.log('   ✅ Auto-send is enabled, searching for pending requests...')
    
    // Query restock_requests for this product
    const requestsQuery = query(
      collection(restockDb, 'restock_requests'),
      where('productId', '==', productId),
      where('status', '==', 'pending')
    )
    
    const requestsSnapshot = await getDocs(requestsQuery)
    
    if (requestsSnapshot.empty) {
      console.log('   ℹ️ No pending restock requests found for this product')
      return
    }
    
    console.log(`   📋 Found ${requestsSnapshot.size} pending request(s)`)
    
    // Get product name for SMS
    const productDoc = await getDoc(doc(restockDb, 'products', productId))
    const productName = productDoc.exists() ? productDoc.data().name : 'Товар'
    
    let successCount = 0
    let failCount = 0
    
    // Process each request
    for (const requestDoc of requestsSnapshot.docs) {
      const request = requestDoc.data()
      const phone = request.phone
      
      console.log(`   📱 Auto-sending SMS to ${phone}...`)
      
      try {
        await sendAutoRestockSMS(phone, productName, requestDoc.id, productId)
        successCount++
      } catch (error) {
        console.error(`   ❌ Failed to send to ${phone}:`, error.message)
        failCount++
      }
    }
    
    // Show summary toast
    if (typeof window.showToast === 'function') {
      const message = `⚡ Автоматична розсилка: ${successCount} успішно, ${failCount} помилок`
      window.showToast(message, successCount > 0 ? 'success' : 'error')
    }
    
    console.log(`✅ [AUTO-RESTOCK] Completed: ${successCount} sent, ${failCount} failed`)
    
    // Refresh the restock view if it's currently displayed
    if (document.getElementById('restock-container')) {
      console.log('   🔄 Refreshing restock view...')
      // The onSnapshot listener will automatically update the UI
    }
    
  } catch (error) {
    console.error('❌ [AUTO-RESTOCK] Error:', error)
    if (typeof window.showToast === 'function') {
      window.showToast('Помилка автоматичної розсилки: ' + error.message, 'error')
    }
  }
}

/**
 * Send automated restock SMS (similar to sendRestockSMS but for automation)
 * @param {string} phone - Customer phone
 * @param {string} productName - Product name
 * @param {string} requestId - Request ID
 * @param {string} productId - Product ID
 */
async function sendAutoRestockSMS(phone, productName, requestId, productId) {
  console.log('   🤖 [AUTO-SMS] Sending automated SMS')
  
  try {
    // Step 1: Get credentials (reuse multi-location search)
    let turboSmsToken = null
    let senderName = null
    
    const collectionsToSearch = ['config', 'admin_settings', 'settings']
    
    for (const collectionName of collectionsToSearch) {
      try {
        const querySnapshot = await getDocs(collection(restockDb, collectionName))
        if (querySnapshot.empty) continue
        
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          const hasToken = data.turboSmsToken || data.sms_settings || data.apiKey || data.api_key
          const hasSender = data.senderName || data.sender || data.alphaName || data.alpha_name
          
          if (hasToken && hasSender && !turboSmsToken) {
            turboSmsToken = hasToken
            senderName = hasSender
          }
        })
        
        if (turboSmsToken && senderName) break
      } catch (error) {
        continue
      }
    }
    
    if (!turboSmsToken || !senderName) {
      throw new Error('TurboSMS credentials not found')
    }
    
    // Step 2: Format phone
    let formattedPhone = phone.trim()
    if (!formattedPhone.startsWith('+')) {
      if (formattedPhone.startsWith('380')) {
        formattedPhone = '+' + formattedPhone
      } else if (formattedPhone.startsWith('0')) {
        formattedPhone = '+38' + formattedPhone
      } else {
        formattedPhone = '+380' + formattedPhone
      }
    }
    
    // Step 3: Get template
    const restockConfigRef = doc(restockDb, 'admin_settings', 'restock_config')
    const restockConfigSnap = await getDoc(restockConfigRef)
    let template = messageTemplate
    if (restockConfigSnap.exists() && restockConfigSnap.data().messageTemplate) {
      template = restockConfigSnap.data().messageTemplate
    }
    
    // Step 4: Generate product URL
    const baseUrl = 'https://latiao-snack.com.ua'
    const productUrl = productId ? `${baseUrl}/product.html?id=${productId}` : baseUrl
    
    // Step 5: Compose message
    const messageText = template
      .replace(/{productName}/g, productName)
      .replace(/{link}/g, productUrl)
    
    // Step 6: Send SMS
    const apiResponse = await fetch('https://api.turbosms.ua/message/send.json', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + turboSmsToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipients: [formattedPhone],
        sms: {
          sender: senderName,
          text: messageText
        }
      })
    })
    
    const responseData = await apiResponse.json()
    
    if (!apiResponse.ok) {
      throw new Error(`TurboSMS API Error (HTTP ${apiResponse.status})`)
    }
    
    // Check for success codes (0, 800, 801)
    const successCodes = [0, 800, 801]
    const responseCode = responseData.response_code
    
    if (responseCode && !successCodes.includes(responseCode)) {
      throw new Error(`TurboSMS Error ${responseCode}`)
    }
    
    console.log(`      ✅ SMS API Response: ${responseCode} (SUCCESS)`)
    
    // Step 7: Update request status to 'completed' after successful SMS
    await updateDoc(doc(restockDb, 'restock_requests', requestId), {
      status: 'completed',
      sentAt: new Date().toISOString(),
      sentVia: 'auto-notification',
      completedAt: new Date().toISOString()
    })
    
    // Step 8: Log to sms_logs
    await addDoc(collection(restockDb, 'sms_logs'), {
      phone: formattedPhone,
      originalPhone: phone,
      productName: productName,
      productId: productId || null,
      message: messageText,
      sender: senderName,
      requestId: requestId,
      status: 'sent',
      sendType: 'AUTOMATED',
      apiResponse: responseData,
      timestamp: serverTimestamp(),
      sentAt: new Date().toISOString()
    })
    
    console.log(`      ✅ SMS sent successfully to ${formattedPhone}`)
    
  } catch (error) {
    // Log failed attempt
    try {
      await addDoc(collection(restockDb, 'sms_logs'), {
        phone: phone,
        productName: productName,
        productId: productId || null,
        requestId: requestId,
        status: 'failed',
        sendType: 'AUTOMATED',
        error: error.message,
        timestamp: serverTimestamp(),
        attemptedAt: new Date().toISOString()
      })
    } catch (logError) {
      console.error('      ❌ Failed to log error')
    }
    
    throw error
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
