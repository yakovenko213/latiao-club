/**
 * ============================================
 * REVIEWS MANAGEMENT MODULE
 * ============================================
 * 
 * Standalone module for managing review requests, pending reviews,
 * published reviews, and review statistics in the Admin Panel.
 * 
 * Dependencies:
 * - Firebase App (getApp) - must be initialized before loading this module
 * - Global exports from admin.js: window.db, window.doc, window.updateDoc, window.deleteField, window.showToast
 * - Lucide Icons (lucide.createIcons)
 * 
 * Exports:
 * - window.loadReviewsView() - Main initialization function
 * - window.switchReviewTab() - Tab switching logic
 * - window.sendReviewRequest() - Send SMS review request
 * - window.resetOrderStats() - Reset order statistics
 * - window.cancelScheduledSms() - Cancel scheduled SMS
 * - window.resetReviewStatus() - Reset review status for order
 * - And many more review management functions...
 * 
 * @author Admin Panel Team
 * @version 2.0
 */

import { 
  getFirestore, collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, limit, serverTimestamp, onSnapshot, setDoc, arrayUnion, Timestamp 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js'
import { getApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js'
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js'

// Use existing app instance (already initialized with auth)
const app = getApp()
const db = getFirestore(app)
const storage = getStorage(app)
const auth = getAuth(app)

let currentReviewRating = 5
let allReviews = []
let pendingReviews = []
let deliveredOrders = []
let currentView = 'active'  // 'active' or 'archive'

// ============================================
// PRODUCTS CACHE FOR REVIEW PRODUCT INFO
// ============================================
const reviewProductsCache = new Map()

/**
 * Fetch product by ID from Firestore with caching
 * @param {string} productId - The product document ID
 * @returns {Promise<Object|null>} Product data or null if not found
 */
async function fetchProductById(productId) {
  if (!productId) return null
  
  // Check cache first
  if (reviewProductsCache.has(productId)) {
    return reviewProductsCache.get(productId)
  }
  
  try {
    const productDoc = await getDoc(doc(db, 'products', productId))
    if (productDoc.exists()) {
      const productData = { id: productDoc.id, ...productDoc.data() }
      reviewProductsCache.set(productId, productData)
      return productData
    } else {
      // Mark as deleted in cache to avoid repeated lookups
      reviewProductsCache.set(productId, { deleted: true, id: productId })
      return { deleted: true, id: productId }
    }
  } catch (error) {
    console.error(`❌ Error fetching product ${productId}:`, error)
    return null
  }
}

/**
 * Fetch multiple products by IDs (batch optimization)
 * @param {string[]} productIds - Array of product IDs
 * @returns {Promise<Map<string, Object>>} Map of productId to product data
 */
async function fetchProductsByIds(productIds) {
  const results = new Map()
  const idsToFetch = []
  
  // Check cache first
  for (const id of productIds) {
    if (reviewProductsCache.has(id)) {
      results.set(id, reviewProductsCache.get(id))
    } else if (id && id.length > 0) {
      idsToFetch.push(id)
    }
  }
  
  // Fetch uncached products
  if (idsToFetch.length > 0) {
    const fetchPromises = idsToFetch.map(id => fetchProductById(id))
    const fetchedProducts = await Promise.all(fetchPromises)
    
    idsToFetch.forEach((id, index) => {
      if (fetchedProducts[index]) {
        results.set(id, fetchedProducts[index])
      }
    })
  }
  
  return results
}

/**
 * Update product info bar in a review card after fetching product data
 * @param {string} reviewId - The review ID
 * @param {string} productId - The product ID to fetch and display
 */
async function updateReviewProductInfo(reviewId, productId) {
  const container = document.getElementById(`product-info-${reviewId}`)
  if (!container) return
  
  const product = await fetchProductById(productId)
  
  if (!product) {
    container.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: #fef2f2; border-radius: 8px; border: 1px solid #fecaca;">
        <span style="font-size: 16px;">⚠️</span>
        <span style="font-size: 12px; color: #991b1b;">Помилка завантаження товару</span>
      </div>
    `
    return
  }
  
  if (product.deleted) {
    container.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: #fef2f2; border-radius: 8px; border: 1px solid #fecaca;">
        <span style="font-size: 16px;">📦</span>
        <div>
          <span style="font-size: 12px; color: #991b1b; font-weight: 500;">Товар видалено</span>
          <span style="font-size: 10px; color: #b91c1c; display: block; font-family: monospace;">ID: ${productId.substring(0, 12)}...</span>
        </div>
      </div>
    `
    return
  }
  
  // Render product with image and name
  const imageUrl = product.images?.[0] || product.image || product.imageUrl || ''
  const productName = product.name || 'Без назви'
  
  container.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 8px; border: 1px solid #6ee7b7;">
      ${imageUrl ? `
        <img src="${imageUrl}" alt="${productName}" style="
          width: 40px;
          height: 40px;
          object-fit: cover;
          border-radius: 6px;
          border: 1px solid #a7f3d0;
          flex-shrink: 0;
        " onerror="this.style.display='none'">
      ` : `
        <div style="
          width: 40px;
          height: 40px;
          background: #d1fae5;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        ">
          <i data-lucide="package" style="width: 20px; height: 20px; color: #059669;"></i>
        </div>
      `}
      <div style="flex: 1; min-width: 0;">
        <p style="font-size: 13px; font-weight: 600; color: #065f46; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${productName}
        </p>
        <p style="font-size: 10px; color: #059669; margin: 2px 0 0 0;">
          ✓ Відгук на товар
        </p>
      </div>
    </div>
  `
  
  // Reinitialize Lucide icons for the new content
  lucide.createIcons()
}

// ============================================
// MAIN LOAD FUNCTION
// ============================================
window.loadReviewsView = async function() {
  console.log('📝 Loading reviews view...')
  await Promise.all([
    loadReviewRequests(),
    loadPendingReviews(),
    loadPublishedReviews(),
    loadReviewsVisibility() // Load global visibility toggle
  ])
  
  // ✅ Start automatic scheduler for scheduled SMS
  startScheduler()
  
  lucide.createIcons()
}

// ============================================
// TAB SWITCHING
// ============================================
window.switchReviewTab = function(tab) {
  const requestsTab = document.getElementById('tab-review-requests')
  const pendingTab = document.getElementById('tab-pending-reviews')
  const publishedTab = document.getElementById('tab-published-reviews')
  const requestsContent = document.getElementById('review-requests-content')
  const pendingContent = document.getElementById('pending-reviews-content')
  const publishedContent = document.getElementById('published-reviews-content')

  // Reset all tabs
  const allTabs = [requestsTab, pendingTab, publishedTab]
  const allContents = [requestsContent, pendingContent, publishedContent]
  
  allTabs.forEach(t => {
    if (t) {
      t.classList.remove('border-spicy', 'text-spicy')
      t.classList.add('border-transparent', 'text-gray-500')
    }
  })
  allContents.forEach(c => {
    if (c) c.classList.add('hidden')
  })

  // Activate selected tab
  if (tab === 'requests' && requestsTab && requestsContent) {
    requestsTab.classList.add('border-spicy', 'text-spicy')
    requestsTab.classList.remove('border-transparent', 'text-gray-500')
    requestsContent.classList.remove('hidden')
  } else if (tab === 'pending' && pendingTab && pendingContent) {
    pendingTab.classList.add('border-spicy', 'text-spicy')
    pendingTab.classList.remove('border-transparent', 'text-gray-500')
    pendingContent.classList.remove('hidden')
    loadPendingReviews() // Refresh on tab switch
  } else if (tab === 'published' && publishedTab && publishedContent) {
    publishedTab.classList.add('border-spicy', 'text-spicy')
    publishedTab.classList.remove('border-transparent', 'text-gray-500')
    publishedContent.classList.remove('hidden')
  }
  
  lucide.createIcons()
}

// ============================================
// REVIEW REQUESTS (Completed Orders) - Real-time
// ============================================
let reviewRequestsUnsubscribe = null
let reviewedOrderIds = new Set()  // Store orderIds that have reviews

async function loadReviewRequests() {
  // Unsubscribe from previous listener
  if (reviewRequestsUnsubscribe) {
    reviewRequestsUnsubscribe()
    console.log('🔄 Unsubscribed from review requests listener')
  }
  
  console.log(`📡 Initializing review requests real-time listener... (Current view: ${currentView})`)
  
  try {
    // STEP 1: Fetch all reviews and store orderIds in Set
    console.log('📚 Fetching existing reviews...')
    const reviewsQuery = query(collection(db, 'reviews'))
    const reviewsSnapshot = await getDocs(reviewsQuery)
    
    reviewedOrderIds = new Set(
      reviewsSnapshot.docs
        .map(doc => doc.data().orderId)
        .filter(id => id)  // Filter out undefined/null
    )
    
    console.log(`✅ Loaded ${reviewedOrderIds.size} reviewed orders`)
    
    // STEP 2: Query for completed orders (with archive filter)
    let ordersQuery
    
    if (currentView === 'archive') {
      // Show ONLY archived orders
      ordersQuery = query(
        collection(db, 'orders'),
        where('status', 'in', ['completed', 'delivered', 'Доставлено', 'Виконано']),
        where('isArchived', '==', true),
        orderBy('createdAt', 'desc'),
        limit(100)
      )
    } else {
      // Show non-archived orders (active view)
      ordersQuery = query(
        collection(db, 'orders'),
        where('status', 'in', ['completed', 'delivered', 'Доставлено', 'Виконано']),
        orderBy('createdAt', 'desc'),
        limit(100)
      )
    }

    // Real-time listener
    reviewRequestsUnsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      console.log(`📦 Review requests update: ${snapshot.docs.length} completed orders`)
      
      deliveredOrders = []
      snapshot.forEach(doc => {
        const orderData = doc.data()
        // Filter based on current view
        if (currentView === 'archive') {
          // In archive view, show only archived
          if (orderData.isArchived === true) {
            deliveredOrders.push({ id: doc.id, ...orderData })
          }
        } else {
          // In active view, exclude archived
          if (!orderData.isArchived) {
            deliveredOrders.push({ id: doc.id, ...orderData })
          }
        }
      })

      renderReviewRequests()
      updateReviewRequestsCounts()
      updateArchiveTabsUI()
      
    }, (error) => {
      console.error('❌ Review requests listener error:', error)
      // Fallback to one-time fetch
      loadReviewRequestsOnce()
    })

  } catch (error) {
    console.error('Error setting up review requests listener:', error)
    loadReviewRequestsOnce()
  }
}

// Fallback one-time fetch
async function loadReviewRequestsOnce() {
  try {
    // Fetch reviews first
    const reviewsQuery = query(collection(db, 'reviews'))
    const reviewsSnapshot = await getDocs(reviewsQuery)
    
    reviewedOrderIds = new Set(
      reviewsSnapshot.docs
        .map(doc => doc.data().orderId)
        .filter(id => id)
    )
    
    console.log(`✅ Loaded ${reviewedOrderIds.size} reviewed orders (fallback)`)
    
    // Query with archive filter
    let ordersQuery
    if (currentView === 'archive') {
      ordersQuery = query(
        collection(db, 'orders'),
        where('status', 'in', ['completed', 'delivered', 'Доставлено', 'Виконано']),
        where('isArchived', '==', true),
        orderBy('createdAt', 'desc'),
        limit(100)
      )
    } else {
      ordersQuery = query(
        collection(db, 'orders'),
        where('status', 'in', ['completed', 'delivered', 'Доставлено', 'Виконано']),
        orderBy('createdAt', 'desc'),
        limit(100)
      )
    }

    const snapshot = await getDocs(ordersQuery)
    deliveredOrders = []

    snapshot.forEach(doc => {
      const orderData = doc.data()
      // Double-check filter
      if (currentView === 'archive') {
        if (orderData.isArchived === true) {
          deliveredOrders.push({ id: doc.id, ...orderData })
        }
      } else {
        if (!orderData.isArchived) {
          deliveredOrders.push({ id: doc.id, ...orderData })
        }
      }
    })

    renderReviewRequests()
    updateReviewRequestsCounts()
    updateArchiveTabsUI()

  } catch (error) {
    console.error('Error loading review requests:', error)
    document.getElementById('review-requests-waiting-table').innerHTML = `
      <tr><td colspan="8" class="px-4 py-12 text-center text-red-500">
        <i data-lucide="alert-circle" class="w-8 h-8 mx-auto mb-2"></i>
        <p>Помилка завантаження: ${error.message}</p>
      </td></tr>`
    lucide.createIcons()
  }
}

// Manual refresh
window.refreshReviewRequests = function() {
  loadReviewRequests()
}

// ============================================
// ARCHIVE MANAGEMENT
// ============================================

/**
 * Switch between Active and Archive tabs
 */
window.switchReviewArchiveTab = function(view) {
  if (view !== 'active' && view !== 'archive') {
    console.error('Invalid view:', view)
    return
  }
  
  currentView = view
  console.log(`📑 Switched to ${view} view`)
  
  // Reload data with new filter
  loadReviewRequests()
}

/**
 * Update tab UI styling and counter badges
 */
function updateArchiveTabsUI() {
  const activeTab = document.getElementById('review-active-tab')
  const archiveTab = document.getElementById('review-archive-tab')
  const bulkArchiveBtn = document.getElementById('bulk-archive-btn')
  
  if (!activeTab || !archiveTab) return
  
  if (currentView === 'active') {
    // Style Active tab as selected
    activeTab.className = 'flex items-center gap-2 px-6 py-4 bg-orange-100 text-orange-700 font-semibold border-b-4 border-orange-500 transition-all hover:bg-orange-50'
    archiveTab.className = 'flex items-center gap-2 px-6 py-4 bg-gray-50 text-gray-500 font-medium border-b-4 border-transparent transition-all hover:bg-gray-100'
    
    // Show bulk archive button in active view
    if (bulkArchiveBtn) {
      bulkArchiveBtn.classList.remove('hidden')
    }
  } else {
    // Style Archive tab as selected
    activeTab.className = 'flex items-center gap-2 px-6 py-4 bg-gray-50 text-gray-500 font-medium border-b-4 border-transparent transition-all hover:bg-gray-100'
    archiveTab.className = 'flex items-center gap-2 px-6 py-4 bg-blue-100 text-blue-700 font-semibold border-b-4 border-blue-500 transition-all hover:bg-blue-50'
    
    // Hide bulk archive button in archive view
    if (bulkArchiveBtn) {
      bulkArchiveBtn.classList.add('hidden')
    }
  }
  
  lucide.createIcons()
}

/**
 * Archive a single order
 */
window.archiveOrder = async function(orderId, event) {
  if (event) {
    event.preventDefault()
    event.stopPropagation()
  }
  
  if (!confirm('Перенести це замовлення в архів?\\n\\nВи зможете повернути його пізніше через перегляд архіву.')) {
    return
  }
  
  console.log('📁 Archiving order:', orderId)
  
  try {
    const orderRef = doc(db, 'orders', orderId)
    await updateDoc(orderRef, {
      isArchived: true,
      archivedAt: serverTimestamp()
    })
    
    console.log('✅ Order archived successfully')
    
    if (window.showToast) {
      window.showToast('Замовлення переміщено в архів', 'success')
    }
    
    // Real-time listener will auto-update UI
    
  } catch (error) {
    console.error('❌ Error archiving order:', error)
    alert('Помилка: ' + error.message)
  }
}

/**
 * Restore order from archive
 */
window.restoreOrder = async function(orderId, event) {
  if (event) {
    event.preventDefault()
    event.stopPropagation()
  }
  
  if (!confirm('Відновити це замовлення з архіву?')) {
    return
  }
  
  console.log('📤 Restoring order:', orderId)
  
  try {
    const orderRef = doc(db, 'orders', orderId)
    await updateDoc(orderRef, {
      isArchived: false,
      archivedAt: null
    })
    
    console.log('✅ Order restored successfully')
    
    if (window.showToast) {
      window.showToast('Замовлення відновлено з архіву', 'success')
    }
    
    // Real-time listener will auto-update UI
    
  } catch (error) {
    console.error('❌ Error restoring order:', error)
    alert('Помилка: ' + error.message)
  }
}

/**
 * Bulk archive orders (older than 30 days or already reviewed)
 */
window.bulkArchiveOrders = async function() {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  // Find orders to archive
  const ordersToArchive = deliveredOrders.filter(order => {
    // Skip already archived
    if (order.isArchived) return false
    
    // Archive if has review
    if (reviewedOrderIds.has(order.id)) return true
    
    // Archive if older than 30 days
    const completedAt = order.completedAt || order.updatedAt || order.createdAt
    if (completedAt) {
      const completedDate = completedAt?.toDate ? completedAt.toDate() : new Date(completedAt)
      if (completedDate < thirtyDaysAgo) return true
    }
    
    return false
  })
  
  if (ordersToArchive.length === 0) {
    alert('Немає замовлень для архівування.\\n\\nКритерії: старше 30 днів або вже отримано відгук.')
    return
  }
  
  const message = `Знайдено ${ordersToArchive.length} замовлень для архівування:\\n\\n` +
    `• Відгуки отримано: ${ordersToArchive.filter(o => reviewedOrderIds.has(o.id)).length}\\n` +
    `• Старше 30 днів: ${ordersToArchive.filter(o => {
      const completedAt = o.completedAt || o.updatedAt || o.createdAt
      if (!completedAt) return false
      const completedDate = completedAt?.toDate ? completedAt.toDate() : new Date(completedAt)
      return completedDate < thirtyDaysAgo && !reviewedOrderIds.has(o.id)
    }).length}\\n\\n` +
    'Продовжити архівування?'
  
  if (!confirm(message)) {
    return
  }
  
  console.log(`📦 Bulk archiving ${ordersToArchive.length} orders...`)
  
  const bulkBtn = document.getElementById('bulk-archive-btn')
  const originalHTML = bulkBtn ? bulkBtn.innerHTML : ''
  
  if (bulkBtn) {
    bulkBtn.disabled = true
    bulkBtn.innerHTML = `
      <div class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
      <span>Архівування...</span>
    `
  }
  
  try {
    let successCount = 0
    let errorCount = 0
    
    for (const order of ordersToArchive) {
      try {
        const orderRef = doc(db, 'orders', order.id)
        await updateDoc(orderRef, {
          isArchived: true,
          archivedAt: serverTimestamp()
        })
        successCount++
      } catch (error) {
        console.error(`Error archiving order ${order.id}:`, error)
        errorCount++
      }
    }
    
    console.log(`✅ Bulk archive complete: ${successCount} archived, ${errorCount} failed`)
    
    if (window.showToast) {
      window.showToast(
        `Архівовано: ${successCount} замовлень` + (errorCount > 0 ? ` (${errorCount} помилок)` : ''),
        errorCount > 0 ? 'warning' : 'success'
      )
    }
    
  } catch (error) {
    console.error('❌ Bulk archive error:', error)
    alert('Помилка масового архівування: ' + error.message)
  } finally {
    if (bulkBtn) {
      bulkBtn.disabled = false
      bulkBtn.innerHTML = originalHTML
      lucide.createIcons()
    }
  }
}

// ============================================
// RESET ORDER STATISTICS
// ============================================
/**
 * Reset view statistics for a specific order
 * Removes linkOpened, linkOpenedAt tracking data
 */
window.resetOrderStats = async function(orderId, event) {
  // Prevent event bubbling
  if (event) {
    event.preventDefault()
    event.stopPropagation()
  }
  
  // Confirmation dialog
  if (!confirm('Скинути дані про перегляд для цього замовлення?\n\nЦе приховає інформацію про те, що клієнт відкривав посилання на відгук.')) {
    return
  }
  
  console.log('🔄 Resetting stats for order:', orderId)
  
  try {
    // Update Firestore document
    const orderRef = window.doc(window.db, 'orders', orderId)
    
    await window.updateDoc(orderRef, {
      linkOpened: false,
      linkOpenedAt: window.deleteField(),
      lastOpened: window.deleteField()
    })
    
    console.log('✅ Order stats reset successfully')
    
    // Show success toast if available
    if (window.showToast) {
      window.showToast('Статистику скинуто', 'success')
    }
    
    // Force refresh the review requests table
    // The real-time listener will automatically update the UI
    // But we call this for immediate feedback
    setTimeout(() => {
      renderReviewRequests()
    }, 100)
    
  } catch (error) {
    console.error('❌ Error resetting order stats:', error)
    alert('Помилка: ' + error.message)
  }
}

// Update counts for both categories
function updateReviewRequestsCounts() {
  const waitingOrders = deliveredOrders.filter(order => !reviewedOrderIds.has(order.id))
  const reviewedOrders = deliveredOrders.filter(order => reviewedOrderIds.has(order.id))
  
  document.getElementById('waiting-count').textContent = waitingOrders.length
  document.getElementById('reviewed-count').textContent = reviewedOrders.length
  document.getElementById('requests-count-badge').textContent = deliveredOrders.length
  
  // Update tab counters
  updateArchiveCounters()
}

/**
 * Update counter badges on tabs
 * Shows total active and archived order counts
 */
async function updateArchiveCounters() {
  try {
    // Query ALL completed orders to get accurate counts
    const allOrdersQuery = query(
      collection(db, 'orders'),
      where('status', 'in', ['completed', 'delivered', 'Доставлено', 'Виконано'])
    )
    
    const snapshot = await getDocs(allOrdersQuery)
    
    let activeCount = 0
    let archivedCount = 0
    
    snapshot.forEach(doc => {
      const orderData = doc.data()
      if (orderData.isArchived === true) {
        archivedCount++
      } else {
        activeCount++
      }
    })
    
    const activeCountEl = document.getElementById('active-orders-count')
    const archivedCountEl = document.getElementById('archived-orders-count')
    
    if (activeCountEl) activeCountEl.textContent = activeCount
    if (archivedCountEl) archivedCountEl.textContent = archivedCount
    
    console.log(`📊 Tab counters updated: ${activeCount} active, ${archivedCount} archived`)
    
  } catch (error) {
    console.error('Error updating archive counters:', error)
  }
}

function renderReviewRequests() {
  // Split orders into two categories based on reviewedOrderIds Set
  const waitingOrders = deliveredOrders.filter(order => !reviewedOrderIds.has(order.id))
  const reviewedOrders = deliveredOrders.filter(order => reviewedOrderIds.has(order.id))
  
  console.log(`📊 Orders split: ${waitingOrders.length} waiting, ${reviewedOrders.length} reviewed`)
  
  // Render waiting for review table
  renderOrdersTable('review-requests-waiting-table', waitingOrders, 'waiting')
  
  // Render reviewed orders table
  renderOrdersTable('review-requests-reviewed-table', reviewedOrders, 'reviewed')
  
  lucide.createIcons()
}

function renderOrdersTable(tableId, orders, category) {
  const tbody = document.getElementById(tableId)
  
  if (!tbody) {
    console.error(`Table ${tableId} not found`)
    return
  }
  
  if (orders.length === 0) {
    const emptyMessage = category === 'waiting' 
      ? 'Всі клієнти вже залишили відгуки! 🎉'
      : 'Ще немає отриманих відгуків'
    
    tbody.innerHTML = `
      <tr><td colspan="7" class="px-4 py-12 text-center text-gray-400">
        <i data-lucide="${category === 'waiting' ? 'party-popper' : 'inbox'}" class="w-12 h-12 mx-auto mb-3"></i>
        <p>${emptyMessage}</p>
      </td></tr>`
    return
  }

  tbody.innerHTML = orders.map((order, index) => {
    const customer = order.customer || {}
    const total = order.summary?.total || order.total || 0
    
    // Format order number
    const orderNumber = order.orderNumber || `#${(index + 1).toString().padStart(4, '0')}`
    const orderId = order.id.substring(0, 8).toUpperCase()
    
    // ✅ TASK 1 & 2: Format completion date with fallback
    let completionDateHtml = ''
    const completedAt = order.completedAt || order.updatedAt || order.createdAt
    if (completedAt) {
      const completedDate = completedAt?.toDate ? completedAt.toDate() : new Date(completedAt)
      const dateStr = completedDate.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' })
      const timeStr = completedDate.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
      completionDateHtml = `<div class="text-xs text-gray-400 mt-0.5" title="Дата виконання замовлення">📅 ${dateStr} ${timeStr}</div>`
    }
    
    // Format items list
    const itemsHtml = formatOrderItems(order.items || [])
    
    // Different styling based on category
    const rowClass = category === 'reviewed' 
      ? 'hover:bg-gray-50 transition opacity-70' 
      : 'hover:bg-gray-50 transition'
    
    // ✅ TASK 1: Format STATUS cell - SMS delivery state
    const requestCount = order.reviewRequestCount || 0
    const lastSentAt = order.reviewRequestLastSentAt || order.reviewRequestSentAt
    let statusCellHtml = ''
    
    if (category === 'waiting') {
      // Check for scheduled status FIRST
      if (order.reviewRequestStatus === 'scheduled' && order.reviewRequestScheduledFor) {
        // ✅ SCHEDULED - Show when SMS will be sent with cancel button
        const scheduledFor = order.reviewRequestScheduledFor?.toDate ? order.reviewRequestScheduledFor.toDate() : new Date(order.reviewRequestScheduledFor)
        const dateStr = scheduledFor.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' })
        const timeStr = scheduledFor.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
        
        statusCellHtml = `
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium whitespace-nowrap">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              ⏳ ${dateStr} ${timeStr}
            </span>
            <button 
              onclick="cancelScheduledSms('${order.id}', event)" 
              class="flex items-center justify-center w-6 h-6 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-all duration-200"
              type="button"
              title="Скасувати заплановану відправку"
              style="background: none; border: none; cursor: pointer; font-size: 16px;">
              ✕
            </button>
          </div>
        `
      } else if (lastSentAt) {
        // ✅ SENT: Compact format "📅 05.02 14:30 (№2)" - single line
        const sentDate = lastSentAt?.toDate ? lastSentAt.toDate() : new Date(lastSentAt)
        const dateStr = sentDate.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' })
        const timeStr = sentDate.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
        
        // Compact single-line format with optional counter
        const counterHtml = requestCount > 1 
          ? `<span class="status-count" title="Всього відправлено: ${requestCount}">(№${requestCount})</span>` 
          : ''
        
        const clickHandler = requestCount > 1 
          ? `onclick="showReviewRequestHistory('${order.id}')" style="cursor: pointer;"` 
          : ''
        
        statusCellHtml = `
          <div class="status-container" ${clickHandler}>
            <svg class="w-3.5 h-3.5 flex-shrink-0 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span class="status-date">${dateStr} ${timeStr}</span>
            ${counterHtml}
          </div>
        `
      } else {
        // ✅ NOT SENT: Show "Очікує запиту" with gray styling
        statusCellHtml = `
          <span class="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-500 rounded-full text-xs font-medium whitespace-nowrap">
            <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse"></span>
            Очікує запиту
          </span>
        `
      }
    } else {
      // Category: reviewed
      statusCellHtml = `
        <span class="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-medium whitespace-nowrap">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          Відгук вже є
        </span>
      `
    }

    // ✅ TASK 2: STATISTICS Cell - Customer interaction ONLY (link tracking)
    let statisticsCellHtml = ''
    
    if (order.linkOpened) {
      // ✅ Link was opened - show green badge with date + reset button
      const openedAt = order.linkOpenedAt
      if (openedAt) {
        const openedDate = openedAt?.toDate ? openedAt.toDate() : new Date(openedAt)
        const dateStr = openedDate.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' })
        const timeStr = openedDate.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
        
        statisticsCellHtml = `
          <div class="flex items-center gap-2">
            <div class="flex flex-col items-start gap-1">
              <span class="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium whitespace-nowrap">
                <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                👁️ Переглянуто
              </span>
              <span class="text-xs text-gray-500">${dateStr} ${timeStr}</span>
            </div>
            <button 
              onclick="resetOrderStats('${order.id}', event)" 
              class="text-red-500 hover:text-red-700 hover:bg-red-50 rounded p-1 transition-colors"
              style="font-size: 12px; cursor: pointer;"
              title="Скинути статистику переглядів"
              type="button">
              &#10006;
            </button>
          </div>
        `
      } else {
        statisticsCellHtml = `
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium whitespace-nowrap">
              <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              👁️ Переглянуто
            </span>
            <button 
              onclick="resetOrderStats('${order.id}', event)" 
              class="text-red-500 hover:text-red-700 hover:bg-red-50 rounded p-1 transition-colors"
              style="font-size: 12px; cursor: pointer;"
              title="Скинути статистику переглядів"
              type="button">
              &#10006;
            </button>
          </div>
        `
      }
    } else if (lastSentAt && !order.reviewRequestStatus) {
      // ✅ SMS sent but link not opened yet (and not scheduled)
      statisticsCellHtml = `
        <span class="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-500 rounded-md text-xs font-medium whitespace-nowrap">
          <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
          </svg>
          📩 Надіслано
        </span>
      `
    } else {
      // ✅ Nothing to show - no interaction yet
      statisticsCellHtml = `
        <span class="text-gray-400 text-sm">—</span>
      `
    }

    return `
      <tr class="${rowClass}">
        <td class="px-4 py-4">
          <div class="font-bold text-gray-900">${orderNumber}</div>
          <div class="text-xs text-gray-400 font-mono">${orderId}</div>
          ${completionDateHtml}
        </td>
        <td class="px-4 py-4">
          <div class="font-medium text-gray-900">${customer.fullName || 'Невідомий'}</div>
          <div class="text-xs text-gray-500 flex items-center gap-1">
            <i data-lucide="phone" class="w-3 h-3"></i>
            ${customer.phone || 'Немає телефону'}
          </div>
        </td>
        <td class="px-4 py-4">
          <div class="max-w-xs">${itemsHtml}</div>
        </td>
        <td class="px-4 py-4">
          <div class="font-bold text-lg text-spicy">${total.toFixed(0)} ₴</div>
        </td>
        <td class="px-4 py-4">
          ${statusCellHtml}
        </td>
        <td class="px-4 py-4">
          ${statisticsCellHtml}
        </td>
        <td class="px-4 py-4 text-center">
          ${category === 'waiting' ? `
            <div class="flex flex-col items-center gap-2">
              <button 
                onclick="sendReviewRequest('${order.id}', event)" 
                data-order-id="${order.id}"
                class="review-request-btn btn-base"
                type="button">
                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                </svg>
                <span class="btn-text-desktop">Надіслати запит</span>
                <span class="btn-text-mobile">Надіслати</span>
              </button>
              ${currentView === 'active' ? `
                <button 
                  onclick="archiveOrder('${order.id}', event)" 
                  class="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg transition-colors border border-orange-300"
                  type="button"
                  title="Перемістити в архів">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="21 8 21 21 3 21 3 8"></polyline>
                    <rect x="1" y="3" width="22" height="5"></rect>
                    <line x1="10" y1="12" x2="14" y2="12"></line>
                  </svg>
                  В архів
                </button>
              ` : `
                <button 
                  onclick="restoreOrder('${order.id}', event)" 
                  class="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors border border-blue-300"
                  type="button"
                  title="Відновити з архіву">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 14 4 9 9 4"></polyline>
                    <path d="M20 20v-7a4 4 0 0 0-4-4H4"></path>
                  </svg>
                  Відновити
                </button>
              `}
            </div>
          ` : `
            <div class="flex flex-col items-center gap-2">
              <span class="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-200">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Відгук отримано
              </span>
              <button 
                onclick="resetReviewStatus('${order.id}')" 
                class="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
                type="button"
                title="Видалити відгук і повернути в чергу">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                </svg>
                Скинути статус
              </button>
              ${currentView === 'active' ? `
                <button 
                  onclick="archiveOrder('${order.id}', event)" 
                  class="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg transition-colors border border-orange-300"
                  type="button"
                  title="Перемістити в архів">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="21 8 21 21 3 21 3 8"></polyline>
                    <rect x="1" y="3" width="22" height="5"></rect>
                    <line x1="10" y1="12" x2="14" y2="12"></line>
                  </svg>
                  В архів
                </button>
              ` : `
                <button 
                  onclick="restoreOrder('${order.id}', event)" 
                  class="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors border border-blue-300"
                  type="button"
                  title="Відновити з архіву">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 14 4 9 9 4"></polyline>
                    <path d="M20 20v-7a4 4 0 0 0-4-4H4"></path>
                  </svg>
                  Відновити
                </button>
              `}
            </div>
          `}
        </td>
      </tr>`
  }).join('')
}

// Format order items for display
function formatOrderItems(items) {
  if (!items || items.length === 0) {
    return '<span class="text-gray-400 text-sm italic">Немає товарів</span>'
  }
  
  const maxVisible = 3
  const visibleItems = items.slice(0, maxVisible)
  const hiddenCount = items.length - maxVisible
  
  const itemsHtml = visibleItems.map(item => {
    const sku = item.sku || item.article || item.id?.substring(0, 6) || '0000'
    const name = item.name || item.title || 'Товар'
    const qty = item.quantity || item.qty || 1
    return `
      <div class="flex items-center gap-2 text-sm py-1">
        <span class="text-gray-400 text-xs font-mono">(арт:${sku})</span>
        <span class="text-gray-700 truncate max-w-[150px]" title="${name}">${name}</span>
        <span class="text-spicy font-medium">×${qty}</span>
      </div>
    `
  }).join('')
  
  const moreHtml = hiddenCount > 0 
    ? `<div class="text-xs text-gray-400 mt-1">+${hiddenCount} ще товар(ів)</div>` 
    : ''
  
  return itemsHtml + moreHtml
}

// ============================================
// SHOW REVIEW REQUEST HISTORY
// ============================================
window.showReviewRequestHistory = async function(orderId) {
  try {
    const orderDoc = await getDoc(doc(db, 'orders', orderId))
    
    if (!orderDoc.exists()) {
      showToast('Замовлення не знайдено', 'error')
      return
    }
    
    const orderData = orderDoc.data()
    const history = orderData.reviewRequestHistory || []
    
    if (history.length === 0) {
      showToast('Історія відправок порожня', 'warning')
      return
    }
    
    // Build history HTML
    let historyHtml = history.map((entry, index) => {
      const sentDate = entry.sentAt?.toDate ? entry.sentAt.toDate() : new Date(entry.sentAt)
      const dateStr = sentDate.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' })
      const timeStr = sentDate.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
      
      return `
        <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
          <div class="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
            ${history.length - index}
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <svg class="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
              </svg>
              <span class="font-semibold text-gray-900">${dateStr} о ${timeStr}</span>
            </div>
            <div class="text-xs text-gray-600 space-y-1">
              <div>📱 Телефон: ${entry.phone || 'N/A'}</div>
              <div>📨 Метод: ${entry.method || 'sms'}</div>
              <div>✅ Статус: ${entry.status || 'sent'}</div>
              ${entry.apiResponse ? `<div>💬 API: ${entry.apiResponse}</div>` : ''}
            </div>
          </div>
        </div>
      `
    }).reverse().join('')
    
    // Show modal
    const modal = `
      <div id="review-history-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
          <div class="p-6 border-b border-gray-200 flex items-center justify-between">
            <h3 class="text-xl font-bold text-gray-900 flex items-center gap-2">
              <svg class="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 3v18h18"/>
                <path d="M18 17V9"/>
                <path d="M13 17V5"/>
                <path d="M8 17v-3"/>
              </svg>
              Історія запитів на відгук
            </h3>
            <button onclick="closeReviewHistoryModal()" class="p-2 hover:bg-gray-100 rounded-lg transition">
              <svg class="w-6 h-6 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="p-6 overflow-y-auto flex-1">
            <div class="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div class="flex items-center gap-2 text-sm text-blue-900">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                <span><strong>Всього відправлено:</strong> ${history.length} запит(ів)</span>
              </div>
            </div>
            <div class="space-y-3">
              ${historyHtml}
            </div>
          </div>
          <div class="p-6 border-t border-gray-200 flex justify-end">
            <button onclick="closeReviewHistoryModal()" class="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition">
              Закрити
            </button>
          </div>
        </div>
      </div>
    `
    
    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modal)
    
  } catch (error) {
    console.error('Error showing history:', error)
    showToast(`Помилка: ${error.message}`, 'error')
  }
}

// Close history modal
window.closeReviewHistoryModal = function() {
  const modal = document.getElementById('review-history-modal')
  if (modal) {
    modal.remove()
  }
}

// ============================================
// SMART SENDING - WORKING HOURS
// ============================================

// Working hours are now configured in Settings Modal (Section 4)
// and stored in reviewSettings.timeWindow { start: 'HH:MM', end: 'HH:MM' }

/**
 * Check if current time is within working hours
 * @returns {boolean} true if within working hours
 */
function isWorkingHours() {
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinutes = now.getMinutes()
  
  // Get time window from settings or use defaults
  // Safe access with multiple fallback levels
  const startTime = (reviewSettings && reviewSettings.timeWindow && reviewSettings.timeWindow.start) || '09:00'
  const endTime = (reviewSettings && reviewSettings.timeWindow && reviewSettings.timeWindow.end) || '17:00'
  
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)
  
  const currentMinTotal = currentHour * 60 + currentMinutes
  const startMinTotal = startHour * 60 + startMin
  const endMinTotal = endHour * 60 + endMin
  
  const isWorking = currentMinTotal >= startMinTotal && currentMinTotal < endMinTotal
  
  console.log('🕒 Time check:', {
    currentTime: now.toLocaleTimeString('uk-UA'),
    workingHours: `${startTime} - ${endTime}`,
    isWorkingHours: isWorking,
    settingsLoaded: !!reviewSettings?.timeWindow
  })
  
  return isWorking
}

/**
 * Calculate next working hours start time
 * @returns {Date} Next working hours start
 */
function getNextWorkingHoursStart() {
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinutes = now.getMinutes()
  
  // Get time window from settings or use defaults
  // Safe access with multiple fallback levels
  const startTime = (reviewSettings && reviewSettings.timeWindow && reviewSettings.timeWindow.start) || '09:00'
  const endTime = (reviewSettings && reviewSettings.timeWindow && reviewSettings.timeWindow.end) || '17:00'
  
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)
  
  const currentMinTotal = currentHour * 60 + currentMinutes
  const startMinTotal = startHour * 60 + startMin
  const endMinTotal = endHour * 60 + endMin
  
  let nextStart = new Date()
  nextStart.setSeconds(0)
  nextStart.setMilliseconds(0)
  
  if (currentMinTotal < startMinTotal) {
    // Before work starts today - schedule for today at start time
    nextStart.setHours(startHour, startMin)
  } else {
    // After work starts/ends - schedule for tomorrow at start time
    nextStart.setDate(nextStart.getDate() + 1)
    nextStart.setHours(startHour, startMin)
  }
  
  console.log('📅 Next working hours:', nextStart.toLocaleString('uk-UA'))
  
  return nextStart
}

/**
 * Schedule SMS sending for next working hours
 * @param {string} orderId - Order ID
 * @param {Object} smsData - SMS data (phone, message, etc.)
 */
async function scheduleSmsForWorkingHours(orderId, smsData) {
  const nextStart = getNextWorkingHoursStart()
  
  console.log('⏳ Scheduling SMS for:', nextStart.toLocaleString('uk-UA'))
  
  // Update order with scheduled status
  await updateDoc(doc(db, 'orders', orderId), {
    reviewRequestStatus: 'scheduled',
    reviewRequestScheduledFor: Timestamp.fromDate(nextStart),
    reviewRequestScheduledAt: serverTimestamp(),
    reviewRequestPhone: smsData.phone,
    reviewRequestMessage: smsData.message
  })
  
  console.log('✅ SMS scheduled successfully')
  
  return nextStart
}

// ============================================
// AUTO SCHEDULER - Process scheduled messages
// ============================================

let schedulerInterval = null

/**
 * Process scheduled review requests
 * Sends pending SMS that are scheduled for current time
 */
async function processScheduledReviews() {
  try {
    console.log('⏰ [SCHEDULER] Checking for scheduled review requests...')
    
    if (!isWorkingHours()) {
      console.log('⏰ [SCHEDULER] Outside working hours - skipping')
      return
    }
    
    const now = new Date()
    
    // Query orders with scheduled status and time <= now
    const scheduledQuery = query(
      collection(db, 'orders'),
      where('reviewRequestStatus', '==', 'scheduled')
    )
    
    const snapshot = await getDocs(scheduledQuery)
    console.log(`⏰ [SCHEDULER] Found ${snapshot.size} scheduled requests`)
    
    for (const orderDoc of snapshot.docs) {
      const order = orderDoc.data()
      const scheduledFor = order.reviewRequestScheduledFor?.toDate()
      
      if (!scheduledFor) continue
      
      // Check if it's time to send
      if (scheduledFor <= now) {
        console.log(`📤 [SCHEDULER] Sending scheduled SMS for order: ${orderDoc.id}`)
        
        try {
          // Send SMS using stored data
          await sendScheduledSms(orderDoc.id, order)
          
          // Update status to remove from scheduled queue
          await updateDoc(doc(db, 'orders', orderDoc.id), {
            reviewRequestStatus: 'sent'
          })
          
          console.log(`✅ [SCHEDULER] Successfully sent scheduled SMS for: ${orderDoc.id}`)
        } catch (error) {
          console.error(`❌ [SCHEDULER] Failed to send scheduled SMS:`, error)
          
          // Update status to failed
          await updateDoc(doc(db, 'orders', orderDoc.id), {
            reviewRequestStatus: 'failed',
            reviewRequestError: error.message
          })
        }
      }
    }
    
  } catch (error) {
    console.error('❌ [SCHEDULER] Error processing scheduled reviews:', error)
  }
}

/**
 * Send scheduled SMS
 * @param {string} orderId - Order ID
 * @param {Object} order - Order data with stored message
 */
async function sendScheduledSms(orderId, order) {
  const phone = order.reviewRequestPhone
  const messageText = order.reviewRequestMessage
  
  if (!phone || !messageText) {
    throw new Error('Missing phone or message in scheduled data')
  }
  
  // Get API credentials
  const settingsDoc = await getDoc(doc(db, 'settings', 'config'))
  if (!settingsDoc.exists()) {
    throw new Error('Settings not found')
  }
  
  const settings = settingsDoc.data()
  const apiKey = settings.turboSmsToken
  const alphaName = settings.senderName || 'Latiao'
  
  // Send SMS via TurboSMS API
  const response = await fetch('https://api.turbosms.ua/message/send.json', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      recipients: [phone],
      sms: {
        sender: alphaName,
        text: messageText
      }
    })
  })
  
  const result = await response.json()
  
  // Check success
  const isSuccess = (
    result.response_code === 0 || 
    result.response_code === '0' || 
    result.response_code === 801 ||
    result.response_code === '801' ||
    result.response_status === 'OK' ||
    result.response_status === 'SUCCESS' ||
    result.response_status === 'SUCCESS_MESSAGE_SENT'
  )
  
  if (!isSuccess) {
    throw new Error(result.response_status || 'TurboSMS API error')
  }
  
  // Update order with sent status
  const newHistoryEntry = {
    sentAt: new Date().toISOString(),
    type: 'sms',
    method: 'turbosms-scheduled',
    phone: phone,
    status: 'sent',
    messageLength: messageText.length,
    apiResponse: result.response_status || 'OK'
  }
  
  await updateDoc(doc(db, 'orders', orderId), {
    review_request_sent: true,
    reviewRequestSent: true,
    reviewRequestSentAt: serverTimestamp(),
    reviewRequestLastSentAt: serverTimestamp(),
    lastReviewRequestSent: serverTimestamp(),
    reviewRequestMethod: 'turbosms-scheduled',
    reviewRequestHistory: arrayUnion(newHistoryEntry),
    reviewRequestCount: (order.reviewRequestCount || 0) + 1
  })
}

/**
 * Start automatic scheduler
 * Checks every 60 seconds for scheduled messages
 */
function startScheduler() {
  if (schedulerInterval) {
    console.log('⏰ [SCHEDULER] Already running')
    return
  }
  
  console.log('⏰ [SCHEDULER] Starting automatic scheduler...')
  
  // Run immediately
  processScheduledReviews()
  
  // Then run every 60 seconds
  schedulerInterval = setInterval(() => {
    processScheduledReviews()
  }, 60000)  // 60 seconds
  
  console.log('✅ [SCHEDULER] Scheduler started (checks every 60 seconds)')
}

/**
 * Stop automatic scheduler
 */
function stopScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval)
    schedulerInterval = null
    console.log('⏰ [SCHEDULER] Scheduler stopped')
  }
}

// ============================================
// RESET REVIEW STATUS
// ============================================
window.resetReviewStatus = async function(orderId) {
  // Show confirmation dialog
  const confirmed = confirm(
    'Ви впевнені, що хочете видалити цей відгук і повернути замовлення в чергу?\n\n' +
    'Це дія незворотна і видалить всі відгуки, пов\'язані з цим замовленням.'
  )
  
  if (!confirmed) {
    return
  }
  
  try {
    console.log(`🔄 Resetting review status for order: ${orderId}`)
    
    // Find all reviews with this orderId
    const reviewsQuery = query(
      collection(db, 'reviews'),
      where('orderId', '==', orderId)
    )
    
    const reviewsSnapshot = await getDocs(reviewsQuery)
    console.log(`📚 Found ${reviewsSnapshot.size} review(s) to delete`)
    
    if (reviewsSnapshot.empty) {
      showToast('Відгуків для цього замовлення не знайдено', 'warning')
      return
    }
    
    // Delete all reviews for this order
    const deletePromises = []
    reviewsSnapshot.forEach(reviewDoc => {
      console.log(`🗑️ Deleting review: ${reviewDoc.id}`)
      deletePromises.push(deleteDoc(doc(db, 'reviews', reviewDoc.id)))
    })
    
    await Promise.all(deletePromises)
    
    console.log(`✅ Successfully deleted ${deletePromises.length} review(s)`)
    
    // Remove orderId from reviewedOrderIds Set
    reviewedOrderIds.delete(orderId)
    
    // Update UI
    updateReviewRequestsCounts()
    renderReviewRequests()
    
    showToast(`Статус скинуто! Замовлення повернуто в очікування (${deletePromises.length} відгук(ів) видалено)`, 'success')
    
  } catch (error) {
    console.error('❌ Error resetting review status:', error)
    showToast(`Помилка: ${error.message}`, 'error')
  }
}

// ============================================
// CANCEL SCHEDULED SMS
// ============================================
window.cancelScheduledSms = async function(orderId, evt) {
  // Prevent event bubbling
  if (evt) {
    evt.stopPropagation()
  }
  
  // Show confirmation dialog
  const confirmed = confirm(
    'Ви впевнені, що хочете скасувати заплановану відправку СМС?\n\n' +
    'Запит на відгук не буде відправлено автоматично.'
  )
  
  if (!confirmed) {
    return
  }
  
  try {
    console.log(`🚫 Cancelling scheduled SMS for order: ${orderId}`)
    
    // ✅ TASK 3: Update Firestore - remove ALL scheduling fields using deleteField()
    await updateDoc(doc(db, 'orders', orderId), {
      reviewRequestStatus: window.deleteField(),
      reviewRequestScheduledFor: window.deleteField(),
      reviewRequestScheduledAt: window.deleteField(),
      reviewRequestPhone: window.deleteField(),
      reviewRequestMessage: window.deleteField()
    })
    
    console.log('✅ Scheduled SMS cancelled in Firestore')
    
    // Update local cache - remove scheduling properties
    const orderIndex = deliveredOrders.findIndex(o => o.id === orderId)
    if (orderIndex !== -1) {
      delete deliveredOrders[orderIndex].reviewRequestStatus
      delete deliveredOrders[orderIndex].reviewRequestScheduledFor
      delete deliveredOrders[orderIndex].reviewRequestScheduledAt
      delete deliveredOrders[orderIndex].reviewRequestPhone
      delete deliveredOrders[orderIndex].reviewRequestMessage
    }
    
    // Refresh table UI - will show "Очікує запиту" status
    renderReviewRequests()
    
    showToast('✅ Відправку скасовано', 'success')
    
  } catch (error) {
    console.error('❌ Error cancelling scheduled SMS:', error)
    showToast(`Помилка: ${error.message}`, 'error')
  }
}

// ============================================
// SEND REVIEW REQUEST
// ============================================
window.sendReviewRequest = async function(orderId, evt) {
  const order = deliveredOrders.find(o => o.id === orderId)
  if (!order) {
    showToast('Замовлення не знайдено', 'error')
    return
  }

  // ✅ FIX: Clean phone number - remove ALL non-digits (spaces, +, -, etc.)
  let phone = order.customer?.phone?.replace(/\D/g, '') || ''
  
  // ✅ FIX: Validate phone exists
  if (!phone) {
    showToast('Номер телефону клієнта відсутній', 'error')
    return
  }

  // ✅ FIX: Ensure phone is in international format (380XXXXXXXXX)
  if (!phone.startsWith('380')) {
    if (phone.startsWith('0')) {
      phone = '380' + phone.substring(1)
    } else if (phone.startsWith('80')) {
      phone = '3' + phone
    } else {
      phone = '380' + phone
    }
  }
  
  // ✅ FIX: Final validation - ensure clean string without spaces/special chars
  phone = phone.trim().replace(/[^0-9]/g, '')
  
  // ✅ FIX: Validate phone format (should be 12 digits: 380XXXXXXXXX)
  if (phone.length !== 12) {
    showToast(`Невірний формат номера телефону: ${phone}`, 'error')
    console.error('❌ Invalid phone format:', phone, 'Length:', phone.length)
    return
  }

  let button = null
  try {
    // Get button element and set loading state
    button = evt?.target?.closest('button')
    if (button) {
      button.disabled = true
      // Remove all state classes
      button.classList.remove('btn-base', 'btn-success', 'btn-error')
      // Add loading class
      button.classList.add('btn-loading')
      button.innerHTML = `
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
          <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
        </svg>
        <span>Надсилаю...</span>
      `
    }

    // Fetch API credentials from settings/config
    const settingsDoc = await getDoc(doc(db, 'settings', 'config'))
    if (!settingsDoc.exists()) {
      throw new Error('Будь ласка, налаштуйте TurboSMS в загальних налаштуваннях')
    }

    const settings = settingsDoc.data()
    const apiKey = settings.turboSmsToken
    const alphaName = settings.senderName || 'Latiao'

    if (!apiKey) {
      throw new Error('Будь ласка, налаштуйте TurboSMS API Token в загальних налаштуваннях')
    }

    // Fetch message template from settings/review_automation or use default
    let messageText = 'Привіт, {customer_name}! Дякуємо за покупку в Latiao Snack 🌶️ Залиште відгук тут: {review_link}'
    
    try {
      const templatesDoc = await getDoc(doc(db, 'settings', 'review_automation'))
      if (templatesDoc.exists() && templatesDoc.data().defaultTemplate) {
        messageText = templatesDoc.data().defaultTemplate
      } else if (templatesDoc.exists() && templatesDoc.data().templates?.length > 0) {
        // Use first template if available
        messageText = templatesDoc.data().templates[0].text || messageText
      }
    } catch (e) {
      console.log('Using default template, no custom templates found')
    }

    // Replace placeholders
    const customerName = order.customer?.fullName?.split(' ')[0] || 'шановний клієнт'
    const orderNumber = order.orderNumber || `#${order.id.substring(0, 8).toUpperCase()}`
    const reviewLink = `https://latiao-snack.com.ua/leave-review.html?orderId=${orderId}`
    
    messageText = messageText
      .replace(/\{customer_name\}/g, customerName)
      .replace(/\{order_id\}/g, orderNumber)
      .replace(/\{order_number\}/g, orderNumber)
      .replace(/\{review_link\}/g, reviewLink)

    console.log('📤 Sending SMS to:', phone)
    console.log('📝 Message:', messageText)

    // ✅ TASK 1: TIME CHECK LOGIC - Smart Sending
    console.log('═══════════════════════════════════════')
    console.log('🕒 SMART SENDING - Checking working hours...')
    console.log('═══════════════════════════════════════')
    
    if (!isWorkingHours()) {
      // ❌ OUTSIDE WORKING HOURS - Schedule for later
      console.log('⚠️  Outside working hours - scheduling SMS...')
      
      const nextStart = await scheduleSmsForWorkingHours(orderId, {
        phone: phone,
        message: messageText,
        customerName: customerName,
        orderNumber: orderNumber
      })
      
      // Get scheduled time for display
      const scheduledTimeStr = nextStart.toLocaleTimeString('uk-UA', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
      
      // ✅ TASK 2: UI FEEDBACK - Show scheduled status
      if (button) {
        button.disabled = false
        button.classList.remove('btn-loading', 'btn-error')
        button.classList.add('btn-success')
        button.innerHTML = `
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span>⏳ Заплановано на ${scheduledTimeStr}</span>
        `
      }
      
      // Update local cache
      const idx = deliveredOrders.findIndex(o => o.id === orderId)
      if (idx !== -1) {
        deliveredOrders[idx].reviewRequestStatus = 'scheduled'
        deliveredOrders[idx].reviewRequestScheduledFor = nextStart
      }
      
      // Refresh table
      renderReviewRequests()
      
      // Show notification
      const timeStr = nextStart.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
      showToast(`⏳ Зараз неробочий час. СМС буде надіслано автоматично о ${timeStr}`, 'info')
      
      console.log('✅ SMS scheduled successfully for:', nextStart.toLocaleString('uk-UA'))
      console.log('═══════════════════════════════════════')
      
      return  // Exit early - don't send now
    }
    
    // ✅ WITHIN WORKING HOURS - Send immediately
    console.log('✅ Within working hours - sending SMS immediately...')
    console.log('═══════════════════════════════════════')

    // Send SMS via TurboSMS API
    const response = await fetch('https://api.turbosms.ua/message/send.json', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipients: [phone],
        sms: {
          sender: alphaName,
          text: messageText
        }
      })
    })

    // Parse response - TurboSMS always returns JSON, even for errors
    let result
    try {
      result = await response.json()
    } catch (parseError) {
      console.error('❌ Failed to parse TurboSMS response:', parseError)
      throw new Error('Отримано невалідну відповідь від TurboSMS API')
    }

    console.log('📥 TurboSMS Full Response:', JSON.stringify(result, null, 2))
    console.log('📊 Response Code:', result.response_code, '(type:', typeof result.response_code, ')')
    console.log('📊 Response Status:', result.response_status)
    console.log('📊 HTTP Status:', response.status)
    console.log('📊 Success Field:', result.success)

    // TurboSMS API Success Indicators (COMPREHENSIVE):
    // - response_code: 0 (number) or "0" (string) = success
    // - response_code: 801 = SUCCESS_MESSAGE_SENT (success)
    // - response_status: "OK" or "SUCCESS" or "SUCCESS_MESSAGE_SENT" = success
    // - success: true (some endpoints)
    // - HTTP status: 200-299 = typically success
    // - result_array with message_id = success
    const isSuccess = (
      result.response_code === 0 || 
      result.response_code === '0' || 
      result.response_code === 801 ||           // ✅ FIXED: 801 is success
      result.response_code === '801' ||         // ✅ FIXED: string version
      String(result.response_code) === '0' ||
      String(result.response_code) === '801' || // ✅ FIXED: ensure string comparison
      result.response_status === 'OK' ||
      result.response_status === 'SUCCESS' ||
      result.response_status === 'SUCCESS_MESSAGE_SENT' || // ✅ FIXED: new status
      result.success === true ||
      (response.status >= 200 && response.status < 300 && result.result_array && result.result_array.length > 0) ||
      (response.status >= 200 && response.status < 300 && !result.error && !result.response_code)
    )

    if (isSuccess) {
      console.log('✅ TurboSMS Success detected!')
      
      // Get existing history or create new array
      const orderDoc = await getDoc(doc(db, 'orders', orderId))
      const existingHistory = orderDoc.exists() && orderDoc.data().reviewRequestHistory 
        ? orderDoc.data().reviewRequestHistory 
        : []
      
      // ✅ FIX: Use new Date().toISOString() instead of serverTimestamp() inside arrayUnion
      // serverTimestamp() can ONLY be used with top-level fields in update()/set()
      const newHistoryEntry = {
        sentAt: new Date().toISOString(),  // ✅ FIXED: Use ISO string instead of serverTimestamp()
        type: 'sms',
        method: 'turbosms',
        phone: phone,
        status: 'sent',
        messageLength: messageText.length,
        apiResponse: result.response_status || 'OK'
      }
      
      console.log('💾 Updating order with history entry:', newHistoryEntry)
      
      // ✅ FIX: Update order in Firestore with history
      // serverTimestamp() only for TOP-LEVEL fields, ISO string inside arrayUnion
      await updateDoc(doc(db, 'orders', orderId), {
        review_request_sent: true,
        reviewRequestSent: true,
        reviewRequestSentAt: serverTimestamp(),      // ✅ TOP-LEVEL: serverTimestamp() OK
        reviewRequestLastSentAt: serverTimestamp(),  // ✅ TOP-LEVEL: serverTimestamp() OK
        lastReviewRequestSent: serverTimestamp(),    // ✅ TOP-LEVEL: serverTimestamp() OK (renamed for clarity)
        reviewRequestMethod: 'turbosms',
        reviewRequestPhone: phone,
        reviewRequestHistory: arrayUnion(newHistoryEntry),  // ✅ INSIDE arrayUnion: ISO string
        reviewRequestCount: (orderDoc.data()?.reviewRequestCount || 0) + 1  // Increment counter
      })

      // Update local cache with history data
      const idx = deliveredOrders.findIndex(o => o.id === orderId)
      if (idx !== -1) {
        deliveredOrders[idx].review_request_sent = true
        deliveredOrders[idx].reviewRequestSent = true
        deliveredOrders[idx].reviewRequestLastSentAt = new Date()  // For immediate UI update
        deliveredOrders[idx].reviewRequestCount = (deliveredOrders[idx].reviewRequestCount || 0) + 1
      }

      // Update button to permanent success state (prevent double-sending)
      if (button) {
        button.disabled = true
        button.classList.remove('btn-loading', 'btn-error')
        button.classList.add('btn-success')
        button.innerHTML = `
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <span>✅ Надіслано</span>
        `
      }

      // Refresh table to show updated status
      renderReviewRequests()

      // Show SUCCESS notification with send count
      const sendCount = (orderDoc.data()?.reviewRequestCount || 0) + 1
      showToast(`✅ Запит на відгук успішно надіслано! (Всього: ${sendCount})`, 'success')
      
    } else {
      // Real API error - construct detailed error message
      console.error('❌ TurboSMS API Error:', result)
      console.error('❌ Full error response:', JSON.stringify(result, null, 2))
      
      let errorMsg = 'Помилка відправки SMS'
      
      // Extract error details from response
      if (result.response_status && result.response_status !== 'SUCCESS_MESSAGE_SENT') {
        errorMsg = result.response_status
      } else if (result.message) {
        errorMsg = result.message
      } else if (result.error) {
        errorMsg = result.error
      } else if (result.response_code && result.response_code !== 801 && result.response_code !== '801') {
        // Map known error codes (excluding 801 which is success)
        const errorCodes = {
          '1': 'Помилка авторизації - перевірте API Token',
          '2': 'Недостатньо коштів на балансі',
          '3': 'Невірний формат номеру телефону',
          '4': 'Невірний текст повідомлення',
          '5': 'Невірний sender name (Alpha Name)',
          '801': 'SUCCESS_MESSAGE_SENT (це успіх, не помилка!)'  // Safety guard
        }
        errorMsg = errorCodes[String(result.response_code)] || `Код помилки: ${result.response_code}`
      }

      throw new Error(errorMsg)
    }

  } catch (error) {
    console.error('❌ Error sending review request:', error)
    
    // Construct user-friendly error message
    let userMessage = error.message
    
    // Network errors
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      userMessage = 'Помилка з\'єднання з TurboSMS. Перевірте інтернет-з\'єднання.'
    }
    // Configuration errors
    else if (error.message.includes('налаштуйте')) {
      userMessage = error.message // Already user-friendly
    }
    // API errors - add helpful hints
    else if (error.message.includes('авторизації') || error.message.includes('Token')) {
      userMessage = `${error.message}\n\n💡 Перевірте API Token в налаштуваннях (⚙️ Settings)`
    }
    else if (error.message.includes('коштів') || error.message.includes('balance')) {
      userMessage = `${error.message}\n\n💡 Поповніть баланс TurboSMS акаунту`
    }
    else if (error.message.includes('sender') || error.message.includes('Alpha')) {
      userMessage = `${error.message}\n\n💡 Перевірте Alpha Name в налаштуваннях`
    }
    
    // Show ERROR notification
    showToast(`Помилка: ${userMessage}`, 'error')
    
    // Set button to error state with shake animation
    if (button) {
      button.disabled = false
      button.classList.remove('btn-loading', 'btn-success')
      button.classList.add('btn-error')
      button.innerHTML = `
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>Спробувати знову</span>
      `
      
      // Revert to base state after animation completes
      setTimeout(() => {
        if (button && button.classList.contains('btn-error')) {
          button.classList.remove('btn-error')
          button.classList.add('btn-base')
          button.innerHTML = `
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
            </svg>
            <span class="btn-text-desktop">Запит відгуку</span>
            <span class="btn-text-mobile">Надіслати</span>
          `
        }
      }, 3000) // Revert after 3 seconds
    }
  }
}

// Resend review request
window.resendReviewRequest = async function(orderId) {
  const order = deliveredOrders.find(o => o.id === orderId)
  if (!order) {
    showToast('Замовлення не знайдено', 'error')
    return
  }

  const confirmed = confirm('Надіслати повторний запит на відгук?')
  if (!confirmed) return

  let phone = order.customer?.phone?.replace(/\D/g, '') || ''
  if (!phone) {
    showToast('Номер телефону клієнта відсутній', 'error')
    return
  }

  // Ensure phone is in international format
  if (!phone.startsWith('380')) {
    if (phone.startsWith('0')) {
      phone = '380' + phone.substring(1)
    } else if (phone.startsWith('80')) {
      phone = '3' + phone
    } else {
      phone = '380' + phone
    }
  }

  try {
    // Fetch API credentials from settings/config
    const settingsDoc = await getDoc(doc(db, 'settings', 'config'))
    if (!settingsDoc.exists()) {
      throw new Error('Будь ласка, налаштуйте TurboSMS в загальних налаштуваннях')
    }

    const settings = settingsDoc.data()
    const apiKey = settings.turboSmsToken
    const alphaName = settings.senderName || 'Latiao'

    if (!apiKey) {
      throw new Error('Будь ласка, налаштуйте TurboSMS API Token в загальних налаштуваннях')
    }

    // Fetch message template
    let messageText = 'Привіт, {customer_name}! Дякуємо за покупку в Latiao Snack 🌶️ Будемо вдячні за ваш відгук: https://latiao-snack.com.ua/reviews'
    
    try {
      const templatesDoc = await getDoc(doc(db, 'settings', 'review_automation'))
      if (templatesDoc.exists() && templatesDoc.data().defaultTemplate) {
        messageText = templatesDoc.data().defaultTemplate
      } else if (templatesDoc.exists() && templatesDoc.data().templates?.length > 0) {
        messageText = templatesDoc.data().templates[0].text || messageText
      }
    } catch (e) {
      console.log('Using default template')
    }

    const customerName = order.customer?.fullName?.split(' ')[0] || 'шановний клієнт'
    const orderNumber = order.orderNumber || `#${order.id.substring(0, 8).toUpperCase()}`
    
    messageText = messageText
      .replace(/\{customer_name\}/g, customerName)
      .replace(/\{order_id\}/g, orderNumber)
      .replace(/\{order_number\}/g, orderNumber)

    console.log('📤 Resending SMS to:', phone)

    // Send SMS via TurboSMS API
    const response = await fetch('https://api.turbosms.ua/message/send.json', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipients: [phone],
        sms: {
          sender: alphaName,
          text: messageText
        }
      })
    })

    const result = await response.json()
    console.log('📥 TurboSMS response:', result)

    if (response.ok && (result.response_code === 0 || result.response_status === 'OK' || result.response_code === '0')) {
      // Update resend count
      const resendCount = (order.reviewRequestResendCount || 0) + 1
      await updateDoc(doc(db, 'orders', orderId), {
        reviewRequestResendCount: resendCount,
        reviewRequestLastSentAt: serverTimestamp()
      })
      
      showToast('✅ Повторний запит надіслано', 'success')
    } else {
      const errorMsg = result.response_status || result.message || 'Невідома помилка TurboSMS API'
      throw new Error(errorMsg)
    }
  } catch (error) {
    console.error('❌ Error resending review request:', error)
    showToast(`Помилка: ${error.message}`, 'error')
  }
}

// ============================================
// REVIEW TEMPLATE - REMOVED
// Template editor UI and related functions removed for simplicity.
// Templates are now managed directly in TurboSMS settings.
// ============================================

// ============================================
// REVIEW SETTINGS MODAL
// ============================================
// Global configuration object with defaults
let reviewSettings = {
  templates: [],
  automation: {
    enabled: false,
    days: 1,
    hours: 0
  },
  reviewLink: {
    enabled: true,
    baseUrl: 'https://latiao-snack.com.ua/review'
  },
  timeWindow: {
    start: '09:00',
    end: '17:00'
  }
}

// Open Settings Modal
window.openReviewSettingsModal = async function() {
  const modal = document.getElementById('review-settings-modal')
  modal.classList.remove('hidden')
  document.body.style.overflow = 'hidden'
  
  // Load settings from Firestore
  await loadReviewSettings()
  
  // Render templates
  renderTemplatesList()
  
  // Update time window status
  updateTimeWindowStatus()
  
  // Add event listeners for time inputs to update status in real-time
  const startInput = document.getElementById('sms-window-start')
  const endInput = document.getElementById('sms-window-end')
  
  if (startInput && endInput) {
    // Remove old listeners if any
    startInput.removeEventListener('change', handleTimeWindowChange)
    endInput.removeEventListener('change', handleTimeWindowChange)
    
    // Add new listeners
    startInput.addEventListener('change', handleTimeWindowChange)
    endInput.addEventListener('change', handleTimeWindowChange)
  }
  
  // Re-initialize icons
  lucide.createIcons()
}

/**
 * Handle time window input changes
 */
function handleTimeWindowChange() {
  // Update reviewSettings with new values
  const startTime = document.getElementById('sms-window-start').value
  const endTime = document.getElementById('sms-window-end').value
  
  if (reviewSettings && reviewSettings.timeWindow) {
    reviewSettings.timeWindow.start = startTime
    reviewSettings.timeWindow.end = endTime
  }
  
  // Update status display
  updateTimeWindowStatus()
}

/**
 * Update time window status display
 */
function updateTimeWindowStatus() {
  const statusEl = document.getElementById('time-window-status')
  if (!statusEl) return
  
  const now = new Date()
  const currentTime = now.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
  
  const startTime = reviewSettings?.timeWindow?.start || '09:00'
  const endTime = reviewSettings?.timeWindow?.end || '17:00'
  
  const currentHour = now.getHours()
  const currentMinutes = now.getMinutes()
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)
  
  const currentMinTotal = currentHour * 60 + currentMinutes
  const startMinTotal = startHour * 60 + startMin
  const endMinTotal = endHour * 60 + endMin
  
  const isWorking = currentMinTotal >= startMinTotal && currentMinTotal < endMinTotal
  
  if (isWorking) {
    statusEl.innerHTML = `\n          <span class=\"inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium\">\n            <span class=\"w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse\"></span>\n            Робочий час (\u0437\u0430\u0440\u0430\u0437 ${currentTime})\n          </span>\n        `
  } else {
    statusEl.innerHTML = `\n          <span class=\"inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium\">\n            <span class=\"w-1.5 h-1.5 bg-amber-500 rounded-full\"></span>\n            \u041d\u0435\u0440\u043e\u0431\u043e\u0447\u0438\u0439 \u0447\u0430\u0441 (\u0437\u0430\u0440\u0430\u0437 ${currentTime})\n          </span>\n        `
  }
}

// Close Settings Modal
window.closeReviewSettingsModal = function() {
  const modal = document.getElementById('review-settings-modal')
  modal.classList.add('hidden')
  document.body.style.overflow = ''
}

// Load Settings from Firestore
async function loadReviewSettings() {
  try {
    console.log('🔄 Loading review settings from Firestore...')
    const settingsDoc = await getDoc(doc(db, 'settings', 'review_automation'))
    
    if (settingsDoc.exists()) {
      const data = settingsDoc.data()
      reviewSettings = {
        templates: data.templates || [],
        automation: data.automation || { enabled: false, days: 1, hours: 0 },
        reviewLink: data.reviewLink || { enabled: true, baseUrl: 'https://latiao-snack.com.ua/review' },
        timeWindow: data.timeWindow || { start: '09:00', end: '17:00' }
      }
      
      console.log('✅ Review settings loaded:', {
        timeWindow: reviewSettings.timeWindow,
        automation: reviewSettings.automation.enabled,
        templates: reviewSettings.templates.length
      })
      
      // Update UI elements if they exist (modal might not be open)
      const daysInput = document.getElementById('auto-send-days')
      const hoursInput = document.getElementById('auto-send-hours')
      const startInput = document.getElementById('sms-window-start')
      const endInput = document.getElementById('sms-window-end')
      
      if (daysInput) daysInput.value = reviewSettings.automation.days
      if (hoursInput) hoursInput.value = reviewSettings.automation.hours
      if (startInput) startInput.value = reviewSettings.timeWindow.start
      if (endInput) endInput.value = reviewSettings.timeWindow.end
      
      // Update time window status if element exists
      updateTimeWindowStatus()
      
      if (reviewSettings.automation.enabled) {
        enableAutoSendUI()
      } else {
        disableAutoSendUI()
      }
      
      // Update review link toggle
      if (reviewSettings.reviewLink.enabled) {
        enableReviewLinkUI()
      } else {
        disableReviewLinkUI()
      }
      
      updateTimingPreview()
    } else {
      console.log('⚠️ No settings document found, using defaults')
      // Ensure defaults are set even if document doesn't exist
      reviewSettings.timeWindow = { start: '09:00', end: '17:00' }
    }
  } catch (error) {
    console.error('❌ Error loading review settings:', error)
    // Ensure timeWindow exists even on error
    if (!reviewSettings.timeWindow) {
      reviewSettings.timeWindow = { start: '09:00', end: '17:00' }
    }
  }
}

// Export to window for use in main admin initialization
window.loadReviewSettings = loadReviewSettings

// Save Settings to Firestore
window.saveReviewSettings = async function() {
  try {
    // Collect automation settings
    reviewSettings.automation.days = parseInt(document.getElementById('auto-send-days').value) || 0
    reviewSettings.automation.hours = parseInt(document.getElementById('auto-send-hours').value) || 0
    
    // ✅ NEW: Collect time window settings
    reviewSettings.timeWindow = {
      start: document.getElementById('sms-window-start').value,
      end: document.getElementById('sms-window-end').value
    }
    
    // Validate time window
    if (!reviewSettings.timeWindow.start || !reviewSettings.timeWindow.end) {
      showToast('Вкажіть початок та кінець робочого дня', 'warning')
      return
    }
    
    // Save to Firestore
    await setDoc(doc(db, 'settings', 'review_automation'), {
      templates: reviewSettings.templates,
      automation: reviewSettings.automation,
      reviewLink: reviewSettings.reviewLink,
      timeWindow: reviewSettings.timeWindow,  // ✅ NEW
      updatedAt: serverTimestamp()
    })
    
    showToast('Налаштування збережено успішно', 'success')
    closeReviewSettingsModal()
    
  } catch (error) {
    console.error('Error saving review settings:', error)
    showToast('Помилка збереження налаштувань', 'error')
  }
}

// Add Message Template
window.addMessageTemplate = function() {
  const textarea = document.getElementById('new-template-text')
  const text = textarea.value.trim()
  
  if (!text) {
    showToast('Введіть текст шаблону', 'warning')
    return
  }
  
  // Add to templates array
  reviewSettings.templates.push({
    id: Date.now().toString(),
    text: text,
    createdAt: new Date().toISOString()
  })
  
  // Clear input
  textarea.value = ''
  
  // Re-render
  renderTemplatesList()
  
  showToast('Шаблон додано', 'success')
}

// Delete Template
window.deleteTemplate = function(templateId) {
  if (!confirm('Видалити цей шаблон?')) return
  
  reviewSettings.templates = reviewSettings.templates.filter(t => t.id !== templateId)
  renderTemplatesList()
  showToast('Шаблон видалено', 'success')
}

// Render Templates List
function renderTemplatesList() {
  const container = document.getElementById('templates-list')
  
  if (reviewSettings.templates.length === 0) {
    container.innerHTML = `
      <div class="text-center py-6 text-gray-400">
        <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2"></i>
        <p class="text-sm">Ще немає збережених шаблонів</p>
      </div>
    `
    lucide.createIcons()
    return
  }
  
  container.innerHTML = reviewSettings.templates.map(template => `
    <div class="bg-white rounded-lg p-3 border border-gray-200 hover:border-blue-300 transition">
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1">
          <p class="text-sm text-gray-700 mb-1">${template.text}</p>
          <p class="text-xs text-gray-400">
            <i data-lucide="clock" class="w-3 h-3 inline"></i>
            ${new Date(template.createdAt).toLocaleDateString('uk-UA')}
          </p>
        </div>
        <button onclick="deleteTemplate('${template.id}')" 
          class="p-1.5 hover:bg-red-100 rounded-lg transition text-red-500" title="Видалити">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      </div>
    </div>
  `).join('')
  
  lucide.createIcons()
}

// Toggle Auto Send
window.toggleAutoSend = function() {
  reviewSettings.automation.enabled = !reviewSettings.automation.enabled
  
  if (reviewSettings.automation.enabled) {
    enableAutoSendUI()
  } else {
    disableAutoSendUI()
  }
}

function enableAutoSendUI() {
  const toggle = document.getElementById('auto-send-toggle')
  const dot = document.getElementById('auto-send-toggle-dot')
  const timing = document.getElementById('automation-timing')
  
  toggle.classList.remove('bg-gray-300')
  toggle.classList.add('bg-purple-500')
  dot.classList.remove('translate-x-1')
  dot.classList.add('translate-x-6')
  
  timing.classList.remove('opacity-50', 'pointer-events-none')
  
  reviewSettings.automation.enabled = true
}

function disableAutoSendUI() {
  const toggle = document.getElementById('auto-send-toggle')
  const dot = document.getElementById('auto-send-toggle-dot')
  const timing = document.getElementById('automation-timing')
  
  toggle.classList.remove('bg-purple-500')
  toggle.classList.add('bg-gray-300')
  dot.classList.remove('translate-x-6')
  dot.classList.add('translate-x-1')
  
  timing.classList.add('opacity-50', 'pointer-events-none')
  
  reviewSettings.automation.enabled = false
}

// Update Timing Preview
function updateTimingPreview() {
  const days = parseInt(document.getElementById('auto-send-days').value) || 0
  const hours = parseInt(document.getElementById('auto-send-hours').value) || 0
  
  const daysText = days === 1 ? '1 день' : days === 0 ? '' : `${days} днів`
  const hoursText = hours === 1 ? '1 годину' : hours === 0 ? '' : `${hours} годин`
  
  let preview = ''
  if (daysText && hoursText) {
    preview = `${daysText} ${hoursText}`
  } else if (daysText) {
    preview = daysText
  } else if (hoursText) {
    preview = hoursText
  } else {
    preview = 'відразу'
  }
  
  document.getElementById('timing-preview').textContent = preview
}

// Listen to timing input changes
document.addEventListener('DOMContentLoaded', () => {
  const daysInput = document.getElementById('auto-send-days')
  const hoursInput = document.getElementById('auto-send-hours')
  
  if (daysInput) {
    daysInput.addEventListener('input', updateTimingPreview)
  }
  if (hoursInput) {
    hoursInput.addEventListener('input', updateTimingPreview)
  }
  
  // Preload CRM module for manual transfer functionality
  console.log('📦 Preloading CRM module...')
 import('/js/crm-module.js').then(module => {
    window.crmModule = module
    console.log('✅ CRM module preloaded and ready for manual transfers')
  }).catch(err => {
    console.warn('⚠️ CRM module preload failed:', err)
  })
})

// ============================================
// REVIEW LINK FUNCTIONALITY
// ============================================

// Generate personalized review link
function generateReviewLink(orderId) {
  const baseUrl = reviewSettings.reviewLink.baseUrl || 'https://latiao-snack.com.ua/review'
  return `${baseUrl}?orderId=${orderId}`
}

// Toggle Review Link
window.toggleReviewLink = function() {
  reviewSettings.reviewLink.enabled = !reviewSettings.reviewLink.enabled
  
  if (reviewSettings.reviewLink.enabled) {
    enableReviewLinkUI()
  } else {
    disableReviewLinkUI()
  }
}

function enableReviewLinkUI() {
  const toggle = document.getElementById('review-link-toggle')
  const dot = document.getElementById('review-link-toggle-dot')
  
  if (toggle && dot) {
    toggle.classList.remove('bg-gray-300')
    toggle.classList.add('bg-green-500')
    dot.classList.remove('translate-x-1')
    dot.classList.add('translate-x-6')
  }
  
  reviewSettings.reviewLink.enabled = true
}

function disableReviewLinkUI() {
  const toggle = document.getElementById('review-link-toggle')
  const dot = document.getElementById('review-link-toggle-dot')
  
  if (toggle && dot) {
    toggle.classList.remove('bg-green-500')
    toggle.classList.add('bg-gray-300')
    dot.classList.remove('translate-x-6')
    dot.classList.add('translate-x-1')
  }
  
  reviewSettings.reviewLink.enabled = false
}

// Process template with placeholders (including review link)
function processTemplateWithPlaceholders(template, order) {
  const orderId = order.id
  const customerName = order.customer?.fullName?.split(' ')[0] || 'Шановний клієнте'
  
  let processed = template
    .replace(/{customer_name}/g, customerName)
    .replace(/{order_id}/g, orderId)
  
  // Replace review link if enabled
  if (reviewSettings.reviewLink.enabled && template.includes('{review_link}')) {
    const reviewLink = generateReviewLink(orderId)
    processed = processed.replace(/{review_link}/g, reviewLink)
  }
  
  return processed
}

// ============================================
// GLOBAL REVIEWS VISIBILITY TOGGLE
// ============================================
let reviewsVisibilityState = true // Default to enabled

// Load reviews visibility status on page load
async function loadReviewsVisibility() {
  try {
    const configDoc = await getDoc(doc(db, 'settings', 'general_config'))
    if (configDoc.exists()) {
      const data = configDoc.data()
      reviewsVisibilityState = data.isReviewsEnabled !== undefined ? data.isReviewsEnabled : true
    }
    updateReviewsVisibilityUI(reviewsVisibilityState)
  } catch (error) {
    console.error('Error loading reviews visibility:', error)
    // Default to enabled on error
    updateReviewsVisibilityUI(true)
  }
}

// Toggle reviews visibility
window.toggleReviewsVisibility = async function() {
  const toggle = document.getElementById('reviews-visibility-toggle')
  const loading = document.getElementById('reviews-toggle-loading')
  
  // Show loading, disable toggle
  loading.classList.remove('hidden')
  toggle.disabled = true
  toggle.style.opacity = '0.5'
  toggle.style.cursor = 'not-allowed'

  try {
    // Toggle state
    reviewsVisibilityState = !reviewsVisibilityState

    // Update Firestore
    await setDoc(doc(db, 'settings', 'general_config'), {
      isReviewsEnabled: reviewsVisibilityState,
      updatedAt: serverTimestamp(),
      updatedBy: auth.currentUser?.email || 'admin'
    }, { merge: true })

    // Update UI
    updateReviewsVisibilityUI(reviewsVisibilityState)

    // Show success toast
    showToast(
      reviewsVisibilityState ? 'Відгуки увімкнено на сайті' : 'Відгуки вимкнено на сайті',
      'success'
    )

    console.log(`✅ Reviews visibility updated: ${reviewsVisibilityState}`)

  } catch (error) {
    console.error('Error toggling reviews visibility:', error)
    showToast('Помилка оновлення налаштувань', 'error')
    
    // Revert state on error
    reviewsVisibilityState = !reviewsVisibilityState
    updateReviewsVisibilityUI(reviewsVisibilityState)
  } finally {
    // Hide loading, enable toggle
    loading.classList.add('hidden')
    toggle.disabled = false
    toggle.style.opacity = '1'
    toggle.style.cursor = 'pointer'
  }
}

// Update UI based on visibility state
function updateReviewsVisibilityUI(isEnabled) {
  const toggle = document.getElementById('reviews-visibility-toggle')
  const dot = document.getElementById('reviews-toggle-dot')
  const badge = document.getElementById('reviews-status-badge')
  const icon = toggle?.closest('.bg-gradient-to-r')?.querySelector('[data-lucide]')

  if (isEnabled) {
    // ON state (green)
    toggle.classList.remove('bg-gray-300')
    toggle.classList.add('bg-green-500')
    dot.classList.remove('translate-x-1')
    dot.classList.add('translate-x-7')
    
    badge.classList.remove('bg-red-100', 'text-red-700')
    badge.classList.add('bg-green-100', 'text-green-700')
    badge.textContent = 'Увімкнено'

    // Update icon to 'eye'
    if (icon) {
      icon.setAttribute('data-lucide', 'eye')
    }
  } else {
    // OFF state (gray)
    toggle.classList.remove('bg-green-500')
    toggle.classList.add('bg-gray-300')
    dot.classList.remove('translate-x-7')
    dot.classList.add('translate-x-1')
    
    badge.classList.remove('bg-green-100', 'text-green-700')
    badge.classList.add('bg-red-100', 'text-red-700')
    badge.textContent = 'Вимкнено'

    // Update icon to 'eye-off'
    if (icon) {
      icon.setAttribute('data-lucide', 'eye-off')
    }
  }

  // Refresh Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons()
  }
}

// ============================================
// PENDING REVIEWS (Moderation) - Real-time
// ============================================
let pendingReviewsUnsubscribe = null

async function loadPendingReviews() {
  // Unsubscribe from previous listener
  if (pendingReviewsUnsubscribe) {
    pendingReviewsUnsubscribe()
  }
  
  console.log('📡 Loading pending reviews for moderation...')
  
  try {
    const pendingQuery = query(
      collection(db, 'reviews'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    )

    // Real-time listener for instant updates
    pendingReviewsUnsubscribe = onSnapshot(pendingQuery, (snapshot) => {
      console.log(`🕐 Pending reviews update: ${snapshot.docs.length} reviews`)
      
      pendingReviews = []
      snapshot.forEach(doc => {
        pendingReviews.push({ id: doc.id, ...doc.data() })
      })

      renderPendingReviews()
      
      // Update pending badge
      document.getElementById('pending-count-badge').textContent = pendingReviews.length
      document.getElementById('reviews-pending-count').textContent = pendingReviews.length
      
      // Update sidebar badge
      const sidebarBadge = document.getElementById('reviews-pending-badge')
      if (sidebarBadge) {
        if (pendingReviews.length > 0) {
          sidebarBadge.textContent = pendingReviews.length
          sidebarBadge.classList.remove('hidden')
        } else {
          sidebarBadge.classList.add('hidden')
        }
      }
      
    }, (error) => {
      console.error('❌ Pending reviews listener error:', error)
      renderPendingReviewsError(error.message)
    })

  } catch (error) {
    console.error('Error setting up pending reviews listener:', error)
    renderPendingReviewsError(error.message)
  }
}

// ============================================
// FILTER PENDING REVIEWS BY ORDER STATUS
// ============================================
function filterPendingReviews() {
  const checkbox = document.getElementById('filter-orders-only')
  const isOrdersOnly = checkbox?.checked || false
  
  console.log('🔍 Filtering reviews - Orders only:', isOrdersOnly)
  
  renderPendingReviews(isOrdersOnly)
}

// ============================================
// NAVIGATE TO SPECIFIC ORDER FROM REVIEW
// ============================================
window.navigateToOrder = function(orderId) {
  console.log('📦 Navigating to order:', orderId)
  
  // Switch to orders view
  showView('orders')
  
  // Wait for orders to load, then highlight the specific order
  setTimeout(() => {
    const orderCard = document.querySelector(`[data-order-id="${orderId}"]`)
    if (orderCard) {
      orderCard.scrollIntoView({ behavior: 'smooth', block: 'center' })
      orderCard.classList.add('ring-4', 'ring-blue-400', 'ring-offset-2')
      setTimeout(() => {
        orderCard.classList.remove('ring-4', 'ring-blue-400', 'ring-offset-2')
      }, 3000)
    } else {
      console.warn('⚠️ Order card not found in DOM, may need to load orders first')
      // Reload orders view to ensure data is loaded
      if (typeof loadOrders === 'function') {
        loadOrders()
      }
    }
  }, 300)
}

function renderPendingReviews(ordersOnly = false) {
  const grid = document.getElementById('pending-reviews-grid')
  
  console.log('🔍 Rendering pending reviews:', pendingReviews)
  console.log('🖼️ First review photos:', pendingReviews[0]?.photos, pendingReviews[0]?.photoUrl)
  console.log('🔍 Filter ordersOnly:', ordersOnly)
  
  // Filter reviews if ordersOnly is enabled
  let reviewsToShow = pendingReviews
  if (ordersOnly) {
    reviewsToShow = pendingReviews.filter(review => review.orderId)
    console.log(`📦 Filtered to ${reviewsToShow.length} reviews from orders`)
  }
  
  // Update verified count badge
  const verifiedCount = pendingReviews.filter(r => r.orderId).length
  const verifiedBadge = document.getElementById('verified-count-badge')
  if (verifiedBadge) {
    if (verifiedCount > 0) {
      verifiedBadge.textContent = verifiedCount
      verifiedBadge.classList.remove('hidden')
    } else {
      verifiedBadge.classList.add('hidden')
    }
  }
  
  if (reviewsToShow.length === 0) {
    const emptyMessage = ordersOnly 
      ? 'Немає відгуків з замовлень на модерацію'
      : 'Все перевірено! 🎉'
    const emptySubtext = ordersOnly
      ? 'Спробуйте вимкнути фільтр "Тільки з замовлень"'
      : 'Немає нових відгуків на модерацію'
    
    grid.innerHTML = `
      <div class="col-span-full text-center py-16">
        <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i data-lucide="check-circle" class="w-10 h-10 text-green-500"></i>
        </div>
        <h3 class="text-lg font-semibold text-gray-700 mb-2">${emptyMessage}</h3>
        <p class="text-gray-500">${emptySubtext}</p>
      </div>`
    lucide.createIcons()
    return
  }

  grid.innerHTML = reviewsToShow.map(review => {
    const stars = '★'.repeat(review.rating || 0) + '☆'.repeat(5 - (review.rating || 0))
    const date = review.createdAt?.toDate?.() || new Date()
    const dateStr = date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' })
    const timeStr = date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
    
    // Get product name if productId exists
    const productName = review.productId && window.productsCache?.[review.productId]?.name 
      ? window.productsCache[review.productId].name 
      : null
    
    // Support both photoUrl (single) and photos (array)
    const photos = review.photos || (review.photoUrl ? [review.photoUrl] : [])
    const hasPhotos = photos.length > 0
    
    // Get products list from review data
    const products = review.products || []
    const hasProducts = products.length > 0

    return `
      <!-- ========================================
           POLISHED REVIEW CARD - Professional UI
           ======================================== -->
      <div class="review-card-modern" data-review-id="${review.id}" style="
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
        overflow: hidden;
        transition: all 0.3s ease;
      " onmouseenter="this.style.boxShadow='0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'" 
         onmouseleave="this.style.boxShadow='0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'">
        
        <!-- Photos Section (if exists) -->
        ${hasPhotos ? `
          <div style="padding: 16px; background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
            <div style="display: flex; gap: 8px; overflow-x: auto;">
              ${photos.map((photo, idx) => `
                <a href="${photo}" target="_blank" style="flex-shrink: 0;">
                  <img src="${photo}" alt="Фото ${idx + 1}" style="
                    width: 80px;
                    height: 80px;
                    object-fit: cover;
                    border-radius: 8px;
                    border: 2px solid #e5e7eb;
                    cursor: pointer;
                    transition: border-color 0.2s;
                  " onmouseenter="this.style.borderColor='#fb923c'" 
                     onmouseleave="this.style.borderColor='#e5e7eb'">
                </a>
              `).join('')}
            </div>
            <p style="font-size: 11px; color: #6b7280; margin-top: 8px;">
              <i data-lucide="image" style="width: 12px; height: 12px; display: inline;"></i> 
              ${photos.length} фото
            </p>
          </div>
        ` : ''}
        
        <!-- Card Body -->
        <div style="padding: 20px;">
          
          <!-- Header Section: Fixed Layout with No Overlapping -->
          <div style="margin-bottom: 15px;">
            
            <!-- Row 1: Customer Name + Verified Badge + Stars + Status Badge -->
            <div class="review-header-row" style="
              display: flex;
              flex-wrap: wrap;
              align-items: center;
              gap: 10px;
              margin-bottom: 10px;
            ">
              <!-- Customer Name -->
              <h3 style="
                font-size: 18px;
                font-weight: 700;
                color: #111827;
                margin: 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
              ">${review.customerName || review.userName || 'Анонімний клієнт'}</h3>
              
              <!-- Verified Badge (if order exists) -->
              ${review.orderId ? `
                <span style="
                  display: inline-flex;
                  align-items: center;
                  gap: 4px;
                  padding: 3px 10px;
                  background: #d1fae5;
                  color: #065f46;
                  border-radius: 6px;
                  font-size: 11px;
                  font-weight: 600;
                  white-space: nowrap;
                " title="Підтверджена покупка">
                  <i data-lucide="shield-check" style="width: 12px; height: 12px;"></i>
                  Verified
                </span>
              ` : ''}
              
              <!-- Star Rating -->
              <div style="
                color: #fbbf24;
                font-size: 16px;
                letter-spacing: 2px;
                white-space: nowrap;
              ">${stars}</div>
              
              <!-- Status Badge (pushed to right on desktop, wraps on mobile) -->
              <span class="review-status-badge" style="
                display: inline-flex;
                align-items: center;
                padding: 6px 12px;
                background: #fef3c7;
                color: #92400e;
                border-radius: 9999px;
                font-size: 11px;
                font-weight: 700;
                white-space: nowrap;
                margin-left: auto;
                animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
              ">⏳ На модерації</span>
            </div>
            
            <!-- Row 2: Order ID Link (separate line, no overlap) -->
            ${review.orderId ? `
              <div style="display: block; margin-top: 8px;">
                <a href="#orders" onclick="navigateToOrder('${review.orderId}')" class="review-order-link" style="
                  display: inline-flex;
                  align-items: center;
                  gap: 6px;
                  background: #eff6ff;
                  color: #1e40af;
                  border-radius: 9999px;
                  padding: 6px 14px;
                  font-size: 12px;
                  font-weight: 500;
                  text-decoration: none;
                  transition: all 0.2s;
                  cursor: pointer;
                  border: 1px solid #bfdbfe;
                " onmouseenter="this.style.background='#dbeafe'; this.style.transform='translateY(-1px)'" 
                   onmouseleave="this.style.background='#eff6ff'; this.style.transform='translateY(0)'">
                  <i data-lucide="package" style="width: 14px; height: 14px;"></i>
                  Замовлення #${review.orderId.substring(0, 8).toUpperCase()}
                  <i data-lucide="external-link" style="width: 12px; height: 12px; opacity: 0.6;"></i>
                </a>
              </div>
            ` : ''}
            
          </div>
          
          <!-- Dynamic Product Info Bar (for legacy reviews with productId) -->
          ${review.productId && !hasProducts ? `
            <div id="product-info-${review.id}" style="margin-bottom: 16px;" data-product-id="${review.productId}">
              <!-- Skeleton Loader -->
              <div style="display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: #f3f4f6; border-radius: 8px; border: 1px solid #e5e7eb; animation: pulse 1.5s infinite;">
                <div style="width: 40px; height: 40px; background: #e5e7eb; border-radius: 6px; flex-shrink: 0;"></div>
                <div style="flex: 1;">
                  <div style="height: 14px; background: #e5e7eb; border-radius: 4px; width: 70%; margin-bottom: 6px;"></div>
                  <div style="height: 10px; background: #e5e7eb; border-radius: 4px; width: 40%;"></div>
                </div>
              </div>
            </div>
          ` : ''}
          
          <!-- Review Text (with better typography) -->
          <div style="
            background: #f9fafb;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 16px;
          ">
            <p style="
              color: #374151;
              line-height: 1.6;
              margin: 0;
              font-size: 14px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            ">${review.text || '<span style="font-style: italic; color: #9ca3af;">Без тексту</span>'}</p>
          </div>
          
          <!-- Product Selection with Checkboxes (NEW - Task 1) -->
          ${hasProducts ? `
            <div style="
              margin-bottom: 16px;
              padding: 14px;
              background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
              border-radius: 10px;
              border: 2px solid #f59e0b;
              box-shadow: 0 2px 6px rgba(245, 158, 11, 0.15);
            ">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                <i data-lucide="tag" style="width: 14px; height: 14px; color: #92400e;"></i>
                <p style="
                  font-size: 12px;
                  font-weight: 700;
                  color: #92400e;
                  margin: 0;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                ">Прив'язати відгук до товарів:</p>
              </div>
              
              <!-- Checkbox Grid -->
              <div style="display: grid; gap: 10px;" id="product-selection-${review.id}">
                ${products.map((product, index) => {
                  // TASK 3: Simplified checkbox rendering
                  // The checkbox will store SKU/ID from the review data
                  // During approval, we'll look up the Firestore Document ID via database query
                  
                  console.log(`🔍 Product [${index}]:`, {
                    'product.id': product.id,
                    'product.productId': product.productId,
                    'product.sku': product.sku,
                    'product.name': product.name
                  });
                  
                  // Use whatever ID/SKU is available in the review data
                  // Priority: product.id > product.productId > product.sku
                  const checkboxValue = product.id || product.productId || product.sku || '';
                  const hasValue = checkboxValue && checkboxValue !== '' && checkboxValue !== 'undefined';
                  const isLikelyDocId = checkboxValue.length > 10;
                  
                  // Get product image if available in embedded data
                  const productImage = product.image || product.imageUrl || product.images?.[0] || '';
                  
                  console.log(`   → Checkbox value: "${checkboxValue}" (${isLikelyDocId ? 'Doc ID' : 'SKU - will convert on approval'})`);
                  
                  return `
                  <label style="
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 12px;
                    background: white;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: 2px solid transparent;
                  " 
                  onmouseover="this.style.borderColor='#f59e0b'; this.style.transform='translateX(4px)'"
                  onmouseout="this.style.borderColor='transparent'; this.style.transform='translateX(0)'">
                    
                    <input 
                      type="checkbox" 
                      class="product-checkbox-${review.id}"
                      name="product-${review.id}"
                      value="${checkboxValue}"
                      data-product-name="${product.name || 'Unknown'}"
                      data-product-sku="${product.sku || ''}"
                      data-has-valid-id="${hasValue}"
                      ${hasValue ? 'checked' : ''}
                      style="
                        width: 18px;
                        height: 18px;
                        cursor: pointer;
                        accent-color: #f59e0b;
                      ">
                    
                    <!-- Product Image or Icon -->
                    <div id="product-img-${review.id}-${index}" 
                         data-product-id="${isLikelyDocId ? checkboxValue : ''}"
                         style="flex-shrink: 0;">
                      ${productImage ? `
                        <img src="${productImage}" alt="${product.name || 'Товар'}" style="
                          width: 32px;
                          height: 32px;
                          object-fit: cover;
                          border-radius: 4px;
                          border: 1px solid #fde68a;
                        " onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <div style="display: none; width: 32px; height: 32px; background: #fef3c7; border-radius: 4px; align-items: center; justify-content: center;">
                          <i data-lucide="package" style="width: 16px; height: 16px; color: #f59e0b;"></i>
                        </div>
                      ` : `
                        <div style="width: 32px; height: 32px; background: #fef3c7; border-radius: 4px; display: flex; align-items: center; justify-content: center;">
                          <i data-lucide="package" style="width: 16px; height: 16px; color: #f59e0b;"></i>
                        </div>
                      `}
                    </div>
                    
                    <div style="flex: 1; display: flex; align-items: center; gap: 8px;">
                      <span style="
                        font-size: 13px;
                        font-weight: 600;
                        color: #374151;
                      ">${product.name || 'Товар'}</span>
                      ${product.quantity > 1 ? `
                        <span style="
                          padding: 2px 6px;
                          background: #fef3c7;
                          color: #92400e;
                          border-radius: 4px;
                          font-size: 10px;
                          font-weight: 700;
                        ">× ${product.quantity}</span>
                      ` : ''}
                      ${!hasValue ? `
                        <span style="
                          padding: 2px 6px;
                          background: #fee2e2;
                          color: #991b1b;
                          border-radius: 4px;
                          font-size: 9px;
                          font-weight: 700;
                        ">⚠️ No ID</span>
                      ` : ''}
                    </div>
                    
                    ${product.sku ? `
                      <span style="
                        font-size: 10px;
                        color: #9ca3af;
                        font-family: 'Courier New', monospace;
                      ">${product.sku}</span>
                    ` : ''}
                    ${hasValue ? `
                      <span style="
                        font-size: 9px;
                        color: ${isLikelyDocId ? '#10b981' : '#3b82f6'};
                        font-family: 'Courier New', monospace;
                        font-weight: ${isLikelyDocId ? '400' : '600'};
                        background: ${isLikelyDocId ? 'transparent' : '#dbeafe'};
                        padding: ${isLikelyDocId ? '0' : '2px 4px'}; 
                        border-radius: ${isLikelyDocId ? '0' : '3px'};
                      " title="${isLikelyDocId ? 'Firestore Doc ID' : 'SKU - will be converted to Doc ID on approval'}">${isLikelyDocId ? '✅ ID' : '🔄 SKU'}: ${checkboxValue}</span>
                    ` : ''}
                  </label>`
                }).join('')}
              </div>
              
              <!-- Helper Text -->
              <p style="
                font-size: 10px;
                color: #92400e;
                margin: 10px 0 0 0;
                font-style: italic;
              ">
                <i data-lucide="info" style="width: 10px; height: 10px; display: inline; margin-right: 4px;"></i>
                Відгук з'явиться на сторінках обраних товарів. Якщо нічого не обрано — відгук буде загальним.
              </p>
            </div>
          ` : ''}
          
          <!-- Date picker -->
          <div style="margin-bottom: 16px; padding: 12px; background: #eff6ff; border-radius: 8px; border: 1px solid #bfdbfe;">
            <label style="display: block; font-size: 11px; font-weight: 600; color: #1e40af; margin-bottom: 8px;">
              <i data-lucide="calendar" style="width: 12px; height: 12px; display: inline; margin-right: 4px;"></i>
              Дата публікації відгуку:
            </label>
            <input type="datetime-local" 
              id="review-date-${review.id}" 
              value="${date.toISOString().slice(0, 16)}"
              style="
                width: 100%;
                padding: 8px 12px;
                border: 1px solid #bfdbfe;
                border-radius: 6px;
                font-size: 13px;
                background: white;
              ">
            <p style="font-size: 10px; color: #3b82f6; margin: 4px 0 0 0;">Ця дата буде показана на сайті</p>
          </div>
          
          <!-- Admin reply -->
          <div style="margin-bottom: 16px; padding: 12px; background: #fef3c7; border-radius: 8px; border: 1px solid #fde68a;">
            <label style="display: block; font-size: 11px; font-weight: 600; color: #92400e; margin-bottom: 8px;">
              <i data-lucide="message-circle" style="width: 12px; height: 12px; display: inline; margin-right: 4px;"></i>
              Відповідь магазину (необов'язково):
            </label>
            <!-- Textarea container with AI button -->
            <div style="position: relative;">
              <textarea 
                id="review-reply-${review.id}" 
                rows="3"
                placeholder="Напишіть відповідь клієнту..."
                oninput="autoExpandTextarea(this)"
                onfocus="this.style.boxShadow='0 0 0 2px rgba(139, 92, 246, 0.5)'; this.style.borderColor='#a855f7'"
                onblur="this.style.boxShadow='none'; this.style.borderColor='#fde68a'"
                style="
                  width: 100%;
                  min-height: 100px;
                  padding: 10px 44px 10px 12px;
                  border: 1px solid #fde68a;
                  border-radius: 6px;
                  font-size: 13px;
                  line-height: 1.5;
                  background: white;
                  resize: vertical;
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                  transition: box-shadow 0.2s ease, border-color 0.2s ease;
                ">${review.adminReply || ''}</textarea>
              <!-- AI Generation Button -->
              <button
                type="button"
                id="ai-generate-btn-${review.id}"
                onclick="handleGenerateAIReply('${review.id}')"
                title="Згенерувати відповідь за допомогою ШІ"
                class="ai-generate-btn"
                style="
                  position: absolute;
                  top: 8px;
                  right: 8px;
                  width: 28px;
                  height: 28px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
                  border: none;
                  border-radius: 6px;
                  cursor: pointer;
                  transition: all 0.2s ease;
                  box-shadow: 0 2px 4px rgba(139, 92, 246, 0.3);
                  z-index: 10;
                "
                onmouseenter="this.style.transform='scale(1.1)'; this.style.boxShadow='0 4px 8px rgba(139, 92, 246, 0.5)'; this.style.background='linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)'"
                onmouseleave="this.style.transform='scale(1)'; this.style.boxShadow='0 2px 4px rgba(139, 92, 246, 0.3)'; this.style.background='linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)'"
              >
                <i data-lucide="sparkles" style="width: 16px; height: 16px; color: white;" class="ai-icon"></i>
                <svg class="ai-spinner hidden" style="width: 16px; height: 16px; color: white;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </button>
            </div>
            <p style="font-size: 10px; color: #ca8a04; margin: 4px 0 0 0;">Буде показана під відгуком на сайті</p>
          </div>
          
          <!-- Meta info -->
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11px;
            color: #9ca3af;
            margin-bottom: 16px;
            padding-bottom: 16px;
            border-bottom: 1px solid #e5e7eb;
          ">
            <span style="display: flex; align-items: center; gap: 4px;">
              <i data-lucide="clock" style="width: 12px; height: 12px;"></i>
              Надіслано: ${dateStr} о ${timeStr}
            </span>
            ${review.source ? `
              <span style="
                display: flex;
                align-items: center;
                gap: 4px;
                padding: 2px 8px;
                background: #f3f4f6;
                border-radius: 4px;
                color: #6b7280;
              ">
                <i data-lucide="link" style="width: 12px; height: 12px;"></i>
                ${review.source === 'post-purchase-link' ? 'Посилання' : review.source}
              </span>
            ` : ''}
          </div>
          
          <!-- Action Buttons (Task 4 - Bottom Right Aligned) -->
          <div style="display: flex; justify-content: flex-end; gap: 12px;">
            <button onclick="approveReview('${review.id}')" style="
              display: inline-flex;
              align-items: center;
              justify-content: center;
              gap: 6px;
              padding: 10px 20px;
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s;
              box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
            " onmouseenter="this.style.transform='scale(1.05)'; this.style.boxShadow='0 4px 8px rgba(16, 185, 129, 0.4)'" 
               onmouseleave="this.style.transform='scale(1)'; this.style.boxShadow='0 2px 4px rgba(16, 185, 129, 0.3)'">
              <i data-lucide="check" style="width: 16px; height: 16px;"></i>
              Підтвердити
            </button>
            <button onclick="rejectReview('${review.id}')" style="
              display: inline-flex;
              align-items: center;
              justify-content: center;
              gap: 6px;
              padding: 10px 20px;
              background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s;
              box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
            " onmouseenter="this.style.transform='scale(1.05)'; this.style.boxShadow='0 4px 8px rgba(239, 68, 68, 0.4)'" 
               onmouseleave="this.style.transform='scale(1)'; this.style.boxShadow='0 2px 4px rgba(239, 68, 68, 0.3)'">
              <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
              Видалити
            </button>
          </div>
          
        </div>
      </div>`
  }).join('')

  lucide.createIcons()
  
  // ============================================
  // DYNAMIC PRODUCT INFO FETCHING
  // ============================================
  // After rendering, fetch product info for reviews with productId
  // This makes product context visible for legacy reviews
  const productInfoContainers = document.querySelectorAll('#pending-reviews-grid [id^="product-info-"]')
  productInfoContainers.forEach(container => {
    const reviewId = container.id.replace('product-info-', '')
    const productId = container.getAttribute('data-product-id')
    if (productId) {
      updateReviewProductInfo(reviewId, productId)
    }
  })
  
  // Also fetch product images for items in selection checkboxes that don't have images
  const productImgContainers = document.querySelectorAll('#pending-reviews-grid [id^="product-img-"]')
  productImgContainers.forEach(async container => {
    const productId = container.getAttribute('data-product-id')
    // Only fetch if we have a valid doc ID and container has no image yet
    if (productId && productId.length > 10) {
      const existingImg = container.querySelector('img')
      if (!existingImg || existingImg.style.display === 'none') {
        const product = await fetchProductById(productId)
        if (product && !product.deleted) {
          const imageUrl = product.images?.[0] || product.image || product.imageUrl
          if (imageUrl) {
            container.innerHTML = `
              <img src="${imageUrl}" alt="${product.name || 'Товар'}" style="
                width: 32px;
                height: 32px;
                object-fit: cover;
                border-radius: 4px;
                border: 1px solid #fde68a;
              " onerror="this.parentElement.innerHTML='<div style=\\'width: 32px; height: 32px; background: #fef3c7; border-radius: 4px; display: flex; align-items: center; justify-content: center;\\'><i data-lucide=\\'package\\' style=\\'width: 16px; height: 16px; color: #f59e0b;\\'></i></div>'; lucide.createIcons();">
            `
          }
        }
      }
    }
  })
}

function renderPendingReviewsError(message) {
  const grid = document.getElementById('pending-reviews-grid')
  grid.innerHTML = `
    <div class="col-span-full text-center py-12 text-red-500">
      <i data-lucide="alert-circle" class="w-12 h-12 mx-auto mb-3"></i>
      <p class="font-medium">Помилка завантаження</p>
      <p class="text-sm text-gray-500 mt-1">${message}</p>
      <button onclick="loadPendingReviews()" class="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 text-sm transition">
        Спробувати ще раз
      </button>
    </div>`
  lucide.createIcons()
}

// ============================================
// TASK 1: SKU to Firestore Document ID Lookup
// ============================================
async function getDocIdBySku(sku) {
  if (!sku) return null;
  
  console.log(`🔍 Looking up Firestore Doc ID for SKU: "${sku}"`);
  
  try {
    const q = query(collection(db, 'products'), where('sku', '==', String(sku)));
    const snap = await getDocs(q);
    
    if (!snap.empty) {
      const docId = snap.docs[0].id;
      console.log(`✅ Found Document ID: "${docId}" for SKU "${sku}"`);
      return docId; // Returns the long Firestore ID (e.g., MjKARny...)
    } else {
      console.warn(`⚠️ No product document found with SKU: "${sku}"`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error looking up SKU "${sku}":`, error);
    return null;
  }
}

// ============================================
// APPROVE REVIEW WITH SKU-TO-ID CONVERSION
// ============================================
window.approveReview = async function(reviewId) {
  // TASK 3: Disable button immediately to prevent multiple clicks
  const card = document.querySelector(`[data-review-id="${reviewId}"]`)
  const approveButton = card?.querySelector('button[onclick*="approveReview"]');
  
  if (approveButton) {
    approveButton.disabled = true;
    approveButton.innerHTML = `
      <svg class="animate-spin h-4 w-4 inline-block mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Зачекайте...
    `;
  }
  
  if (card) {
    card.style.opacity = '0.5'
    card.style.pointerEvents = 'none'
  }
  
  try {
    console.log('\n========================================')
    console.log('🔧 ADMIN PANEL: APPROVING REVIEW')
    console.log('========================================')
    console.log('📋 Review ID:', reviewId)
    
    // Get selected publication date
    const dateInput = document.getElementById(`review-date-${reviewId}`)
    let publicationDate = new Date()
    if (dateInput && dateInput.value) {
      publicationDate = new Date(dateInput.value)
    }
    
    // Get admin reply if any
    const replyInput = document.getElementById(`review-reply-${reviewId}`)
    const adminReply = replyInput ? replyInput.value.trim() : ''
    
    // ========================================
    // TASK 1: FORCED SKU-TO-FIRESTORE-ID LOOKUP
    // ========================================
    const finalDocIds = [];
    
    // Get all checked checkboxes
    const productSelectionContainer = document.getElementById(`product-selection-${reviewId}`)
    
    if (productSelectionContainer) {
      const checkedBoxes = productSelectionContainer.querySelectorAll('input[type="checkbox"]:checked')
      
      console.log(`\n📦 Found ${checkedBoxes.length} checked products`)
      console.log('🔄 Starting SKU to Firestore Document ID conversion...\n')
      
      // TASK 1: Loop through each checked box using for...of to allow await
      for (const cb of checkedBoxes) {
        const skuValue = String(cb.value).trim();
        
        if (!skuValue || skuValue === '' || skuValue === 'undefined' || skuValue === 'null') {
          console.warn(`⚠️ Skipping empty checkbox value`);
          continue;
        }
        
        console.log(`🔍 Processing: "${skuValue}"`);
        
        // Check if it's already a Firestore Doc ID (long string)
        if (skuValue.length > 10) {
          console.log(`   ✅ Already a Firestore Doc ID (length: ${skuValue.length})`);
          finalDocIds.push(skuValue);
          continue;
        }
        
        // It's a SKU - query the products collection
        console.log(`   🔎 Querying products collection for SKU: "${skuValue}"`);
        
        try {
          const q = query(collection(db, 'products'), where('sku', '==', String(skuValue)));
          const snap = await getDocs(q);
          
          if (!snap.empty) {
            const docId = snap.docs[0].id;
            finalDocIds.push(docId);
            console.log(`   ✅ Converted SKU "${skuValue}" → Firestore ID "${docId}"`);
          } else {
            console.error(`   ❌ Could not find product with SKU: "${skuValue}"`);
            console.warn(`   ⚠️ Fallback: Keeping SKU "${skuValue}" (reviews won't appear!)`);
            finalDocIds.push(skuValue); // Fallback: keep SKU if not found
          }
        } catch (error) {
          console.error(`   ❌ Error querying SKU "${skuValue}":`, error);
          console.warn(`   ⚠️ Fallback: Keeping SKU "${skuValue}"`);
          finalDocIds.push(skuValue);  // Fallback on error
        }
      }
      
      console.log('\n========================================')
      console.log('📊 CONVERSION SUMMARY')
      console.log('========================================')
      console.log(`Total products checked: ${checkedBoxes.length}`)
      console.log(`Converted to IDs: ${finalDocIds.length}`)
      console.log('Final IDs Array:', finalDocIds)
      
      // TASK 2: Validate - ensure NO short IDs (SKUs) remain
      const validDocIds = finalDocIds.filter(id => id.length > 10);
      const stillSkus = finalDocIds.filter(id => id.length <= 10);
      
      console.log(`\n✅ Valid Firestore Doc IDs (>10 chars): ${validDocIds.length}`)
      console.log(`❌ Still SKUs (<=10 chars): ${stillSkus.length}`)
      
      if (stillSkus.length > 0) {
        console.error('\n🚨 CRITICAL WARNING: Some SKUs could not be converted!');
        console.error('   SKUs that remain:', stillSkus);
        console.error('   These reviews will NOT appear on product pages!');
        
        const shouldContinue = confirm(
          '⚠️ КРИТИЧНА ПОМИЛКА!\n\n' +
          `Деякі товари НЕ ЗНАЙДЕНО в базі даних:\n\n` +
          `✅ Знайдено: ${validDocIds.length}\n` +
          `❌ НЕ знайдено: ${stillSkus.length}\n\n` +
          `SKU без відповідності: ${stillSkus.join(', ')}\n\n` +
          `Відгуки з цими SKU НЕ БУДУТЬ відображатись!\n\n` +
          `Можливі причини:\n` +
          `• Товари видалені з бази\n` +
          `• SKU не співпадають\n` +
          `• Помилка в даних замовлення\n\n` +
          `Продовжити збереження попри помилку?`
        );
        
        if (!shouldContinue) {
          console.log('✋ Admin cancelled approval');
          throw new Error('Admin cancelled due to failed SKU conversion');
        }
      } else {
        console.log('\n✅ SUCCESS: All SKUs successfully converted to Firestore Document IDs!');
      }
    } else {
      console.log('⚠️ No product selection container found - review will be general (no products)');
    }
    
    // Determine if this is a general review
    const isGeneralReview = finalDocIds.length === 0
    console.log(`\n🏷️ Is General Review: ${isGeneralReview}`)
    
    // TASK 2: Prepare Firestore update with CONVERTED IDs
    const { Timestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js')
    
    const updateData = {
      status: 'approved',
      createdAt: Timestamp.fromDate(publicationDate),
      moderatedAt: serverTimestamp(),
      moderatedBy: 'admin',
      productIds: finalDocIds, // ← TASK 2: Using converted IDs
      isGeneralReview: isGeneralReview
    }
    
    if (adminReply) {
      updateData.adminReply = adminReply
    }
    
    // TASK 2: Enhanced logging before save
    console.log('\n========================================')
    console.log('💾 FINAL FIRESTORE PAYLOAD')
    console.log('========================================')
    console.log('Status:', updateData.status)
    console.log('🚨 FINAL CONVERTED IDs:', finalDocIds);
    console.log('ProductIds (JSON):', JSON.stringify(updateData.productIds))
    console.log('Is Array:', Array.isArray(updateData.productIds))
    console.log('Array Length:', updateData.productIds.length)
    console.log('Is General Review:', updateData.isGeneralReview)
    
    if (updateData.productIds.length > 0) {
      console.log('\n📋 Product IDs Detail:')
      updateData.productIds.forEach((id, idx) => {
        const isValidLength = id.length > 10;
        console.log(`   [${idx}] "${id}" (length: ${id.length}) ${isValidLength ? '✅ VALID' : '❌ INVALID (SKU)'}`)
      })
    }
    
    console.log('\n🚀 Saving to Firestore...')
    console.log('========================================\n')
    
    // TASK 2: Save to Firestore with CONVERTED IDs
    await updateDoc(doc(db, 'reviews', reviewId), updateData)
    
    console.log('✅ Review successfully approved and saved!')
    console.log('🔍 Firestore Document ID:', reviewId)
    console.log('📦 Product IDs saved:', JSON.stringify(finalDocIds))
    
    // Success message
    let successMessage = '✅ Відгук опубліковано!'
    if (finalDocIds.length > 0) {
      successMessage += ` Прив'язано до ${finalDocIds.length} товару(-ів).`
    } else {
      successMessage += ' (Загальний відгук)'
    }
    
    showToast(successMessage, 'success')
    
    // Refresh the reviews list
    loadPublishedReviews()
    
  } catch (error) {
    console.error('\n❌ ERROR APPROVING REVIEW:', error)
    showToast('Помилка при підтвердженні: ' + error.message, 'error')
    
    // TASK 3: Re-enable button on error
    if (approveButton) {
      approveButton.disabled = false;
      approveButton.innerHTML = `
        <i data-lucide="check-circle" style="width: 16px; height: 16px;"></i>
        Підтвердити
      `;
      lucide.createIcons();
    }
    
    // Restore card
    if (card) {
      card.style.opacity = '1'
      card.style.pointerEvents = 'auto'
    }
  }
}

// Reject/Delete review
window.rejectReview = async function(reviewId) {
  if (!confirm('Ві впевнені, що хочете видалити цей відгук?')) return
  
  try {
    const card = document.querySelector(`[data-review-id="${reviewId}"]`)
    if (card) {
      card.style.opacity = '0.5'
      card.style.pointerEvents = 'none'
    }
    
    await deleteDoc(doc(db, 'reviews', reviewId))
    
    showToast('🗑️ Відгук видалено', 'success')
    
  } catch (error) {
    console.error('Error rejecting review:', error)
    showToast('Помилка при видаленні', 'error')
  }
}

// ============================================
// PUBLISHED REVIEWS (Approved only)
// ============================================
async function loadPublishedReviews() {
  try {
    // Only load approved reviews
    const reviewsQuery = query(
      collection(db, 'reviews'),
      where('status', '==', 'approved'),
      orderBy('createdAt', 'desc')
    )

    const snapshot = await getDocs(reviewsQuery)
    allReviews = []
    let totalRating = 0

    snapshot.forEach(doc => {
      const data = { id: doc.id, ...doc.data() }
      allReviews.push(data)
      totalRating += data.rating || 0
    })

    // Update stats
    document.getElementById('reviews-total-count').textContent = allReviews.length
    document.getElementById('reviews-avg-rating').textContent = allReviews.length > 0 
      ? (totalRating / allReviews.length).toFixed(1) 
      : '0.0'
    document.getElementById('published-count-badge').textContent = allReviews.length

    renderPublishedReviews()

  } catch (error) {
    console.error('Error loading reviews:', error)
    document.getElementById('reviews-grid').innerHTML = `
      <div class="col-span-full text-center py-12 text-red-500">
        <i data-lucide="alert-circle" class="w-8 h-8 mx-auto mb-2"></i>
        <p>Помилка завантаження: ${error.message}</p>
      </div>`
    lucide.createIcons()
  }
}

function renderPublishedReviews() {
  const grid = document.getElementById('reviews-grid')
  const ratingFilter = document.getElementById('reviews-rating-filter').value
  const statusFilter = document.getElementById('reviews-status-filter').value

  let filtered = allReviews
  if (ratingFilter !== 'all') {
    filtered = filtered.filter(r => r.rating === parseInt(ratingFilter))
  }
  if (statusFilter !== 'all') {
    filtered = filtered.filter(r => r.status === statusFilter)
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full text-center py-12 text-gray-400">
        <i data-lucide="message-square-off" class="w-12 h-12 mx-auto mb-3"></i>
        <p>Немає відгуків</p>
        <button onclick="openAddReviewModal()" class="mt-4 px-4 py-2 bg-spicy text-white rounded-lg text-sm hover:bg-orange-600 transition">
          Додати перший відгук
        </button>
      </div>`
    lucide.createIcons()
    return
  }

  grid.innerHTML = filtered.map(review => {
    const stars = '★'.repeat(review.rating || 0) + '☆'.repeat(5 - (review.rating || 0))
    const date = review.createdAt?.toDate?.() || new Date()
    const customerName = review.customerName || review.name || review.userName || 'Анонім'
    const statusClass = {
      'approved': 'bg-green-100 text-green-700',
      'pending': 'bg-yellow-100 text-yellow-700',
      'hidden': 'bg-gray-100 text-gray-600'
    }
    const statusText = {
      'approved': 'Опублікований',
      'pending': 'На модерації',
      'hidden': 'Прихований'
    }

    return `
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition group">
        ${review.photoUrl ? `
          <div class="h-40 overflow-hidden">
            <img src="${review.photoUrl}" alt="Review photo" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
          </div>
        ` : ''}
        <div class="p-4">
          <div class="flex items-start justify-between mb-2">
            <div>
              <div class="font-semibold text-gray-900">${customerName}</div>
              <div class="text-yellow-500 text-lg">${stars}</div>
            </div>
            <span class="px-2 py-1 ${statusClass[review.status] || statusClass.pending} rounded-full text-xs">
              ${statusText[review.status] || statusText.pending}
            </span>
          </div>
          <p class="text-gray-600 text-sm mb-3 line-clamp-3">${review.text || ''}</p>
          ${review.adminReply ? `
            <div class="bg-orange-50 rounded-lg p-3 mb-3 text-sm">
              <div class="font-medium text-spicy text-xs mb-1">Відповідь магазину:</div>
              <p class="text-gray-700">${review.adminReply}</p>
            </div>
          ` : ''}
          <div class="flex items-center justify-between text-xs text-gray-400 mb-3">
            <span>${date.toLocaleDateString('uk-UA')}</span>
            ${review.featured ? '<span class="text-yellow-500">⭐ На головній</span>' : ''}
          </div>
          <div class="flex items-center gap-2 pt-3 border-t border-gray-100">
            <button onclick="toggleReviewStatus('${review.id}')" class="flex-1 px-3 py-2 text-xs font-medium ${review.status === 'approved' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'} rounded-lg transition">
              ${review.status === 'approved' ? 'Приховати' : 'Опублікувати'}
            </button>
            <button onclick="toggleFeatured('${review.id}')" title="${review.featured ? 'Прибрати з головної' : 'На головну'}" class="p-2 ${review.featured ? 'bg-yellow-100 text-yellow-600' : 'hover:bg-gray-100 text-gray-400'} rounded-lg transition">
              <i data-lucide="star" class="w-4 h-4"></i>
            </button>
            <button onclick="openReplyModal('${review.id}')" title="Відповісти" class="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition">
              <i data-lucide="message-square" class="w-4 h-4"></i>
            </button>
            <button onclick="editReview('${review.id}')" title="Редагувати" class="p-2 hover:bg-gray-100 text-gray-600 rounded-lg transition">
              <i data-lucide="pencil" class="w-4 h-4"></i>
            </button>
            <button onclick="deleteReview('${review.id}')" title="Видалити" class="p-2 hover:bg-red-100 text-red-600 rounded-lg transition">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      </div>`
  }).join('')

  lucide.createIcons()
}

window.filterPublishedReviews = function() {
  renderPublishedReviews()
}

// ============================================
// REVIEW ACTIONS
// ============================================
window.toggleReviewStatus = async function(reviewId) {
  const review = allReviews.find(r => r.id === reviewId)
  if (!review) return

  const newStatus = review.status === 'approved' ? 'hidden' : 'approved'
  try {
    await updateDoc(doc(db, 'reviews', reviewId), { status: newStatus })
    review.status = newStatus
    renderPublishedReviews()
    loadPublishedReviews() // Refresh stats
    showToast(newStatus === 'approved' ? 'Відгук опубліковано' : 'Відгук приховано', 'success')
  } catch (error) {
    console.error('Error toggling status:', error)
    showToast('Помилка', 'error')
  }
}

window.toggleFeatured = async function(reviewId) {
  const review = allReviews.find(r => r.id === reviewId)
  if (!review) return

  try {
    await updateDoc(doc(db, 'reviews', reviewId), { featured: !review.featured })
    review.featured = !review.featured
    renderPublishedReviews()
    showToast(review.featured ? 'Додано на головну' : 'Прибрано з головної', 'success')
  } catch (error) {
    console.error('Error toggling featured:', error)
    showToast('Помилка', 'error')
  }
}

window.deleteReview = async function(reviewId) {
  if (!confirm('Видалити цей відгук?')) return

  try {
    await deleteDoc(doc(db, 'reviews', reviewId))
    allReviews = allReviews.filter(r => r.id !== reviewId)
    renderPublishedReviews()
    loadPublishedReviews() // Refresh stats
    showToast('Відгук видалено', 'success')
  } catch (error) {
    console.error('Error deleting review:', error)
    showToast('Помилка видалення', 'error')
  }
}

// ============================================
// REVIEW MODAL
// ============================================
window.openAddReviewModal = function() {
  document.getElementById('review-modal-title').textContent = 'Новий відгук'
  document.getElementById('review-edit-id').value = ''
  document.getElementById('review-customer-name').value = ''
  document.getElementById('review-text').value = ''
  document.getElementById('review-order-id').value = ''
  document.getElementById('review-approved').checked = true
  document.getElementById('review-featured').checked = false
  document.getElementById('review-photo-preview').classList.add('hidden')
  
  // Hide admin reply section for new reviews
  const replySection = document.getElementById('review-admin-reply-section')
  const replyTextarea = document.getElementById('review-admin-reply')
  if (replySection && replyTextarea) {
    replySection.classList.add('hidden')
    replyTextarea.value = ''
  }
  
  setReviewRating(5)
  document.getElementById('review-modal').classList.remove('hidden')
  lucide.createIcons()
}

window.editReview = function(reviewId) {
  const review = allReviews.find(r => r.id === reviewId)
  if (!review) return

  // Get customer name with fallback for different field names
  const customerName = review.customerName || review.name || review.userName || 'Анонім'
  
  // Update modal title to show who is being edited
  document.getElementById('review-modal-title').textContent = `Редагування відгуку від: ${customerName}`
  
  // Populate form fields
  document.getElementById('review-edit-id').value = reviewId
  document.getElementById('review-customer-name').value = customerName
  document.getElementById('review-text').value = review.text || ''
  document.getElementById('review-order-id').value = review.orderId || ''
  document.getElementById('review-approved').checked = review.status === 'approved'
  document.getElementById('review-featured').checked = review.featured || false
  
  // Show and populate admin reply section
  const replySection = document.getElementById('review-admin-reply-section')
  const replyTextarea = document.getElementById('review-admin-reply')
  if (replySection && replyTextarea) {
    replySection.classList.remove('hidden')
    replyTextarea.value = review.adminReply || review.reply || ''
  }
  
  // Handle photo preview
  if (review.photoUrl) {
    document.getElementById('review-photo-preview').classList.remove('hidden')
    document.getElementById('review-photo-preview').querySelector('img').src = review.photoUrl
  } else {
    document.getElementById('review-photo-preview').classList.add('hidden')
  }
  
  setReviewRating(review.rating || 5)
  document.getElementById('review-modal').classList.remove('hidden')
  
  console.log('✏️ Editing review:', { id: reviewId, customerName, text: review.text })
  lucide.createIcons()
}

window.closeReviewModal = function() {
  document.getElementById('review-modal').classList.add('hidden')
}

window.setReviewRating = function(rating) {
  currentReviewRating = rating
  document.getElementById('review-rating-value').value = rating
  const stars = document.querySelectorAll('#review-rating-selector .rating-star')
  stars.forEach((star, idx) => {
    if (idx < rating) {
      star.classList.add('text-yellow-400')
      star.classList.remove('text-gray-300')
    } else {
      star.classList.remove('text-yellow-400')
      star.classList.add('text-gray-300')
    }
  })
}

window.previewReviewPhoto = function(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader()
    reader.onload = function(e) {
      document.getElementById('review-photo-preview').classList.remove('hidden')
      document.getElementById('review-photo-preview').querySelector('img').src = e.target.result
    }
    reader.readAsDataURL(input.files[0])
  }
}

window.saveReview = async function() {
  const editId = document.getElementById('review-edit-id').value
  const customerName = document.getElementById('review-customer-name').value.trim()
  const text = document.getElementById('review-text').value.trim()
  const orderId = document.getElementById('review-order-id').value.trim()
  const rating = parseInt(document.getElementById('review-rating-value').value)
  const approved = document.getElementById('review-approved').checked
  const featured = document.getElementById('review-featured').checked
  const photoInput = document.getElementById('review-photo')
  
  // Get admin reply value (only when editing)
  const adminReplyTextarea = document.getElementById('review-admin-reply')
  const adminReply = adminReplyTextarea ? adminReplyTextarea.value.trim() : ''

  if (!customerName || !text) {
    showToast('Заповніть обов\'язкові поля', 'error')
    return
  }

  try {
    let photoUrl = null
    
    // Upload photo if selected
    if (photoInput.files && photoInput.files[0]) {
      const file = photoInput.files[0]
      const fileName = `reviews/${Date.now()}_${file.name}`
      const storageRef = ref(storage, fileName)
      await uploadBytes(storageRef, file)
      photoUrl = await getDownloadURL(storageRef)
    }

    const reviewData = {
      customerName,
      text,
      rating,
      status: approved ? 'approved' : 'pending',
      featured,
      orderId: orderId || null,
      updatedAt: serverTimestamp()
    }

    if (photoUrl) {
      reviewData.photoUrl = photoUrl
    }
    
    // Handle admin reply for edited reviews
    if (editId && adminReply) {
      reviewData.adminReply = adminReply
      reviewData.adminReplyAt = serverTimestamp()
    } else if (editId && !adminReply) {
      // Remove reply if textarea is empty when editing
      reviewData.adminReply = ''
    }

    if (editId) {
      await updateDoc(doc(db, 'reviews', editId), reviewData)
      showToast('Відгук оновлено', 'success')
    } else {
      reviewData.createdAt = serverTimestamp()
      await addDoc(collection(db, 'reviews'), reviewData)
      showToast('Відгук додано', 'success')
    }

    closeReviewModal()
    await loadPublishedReviews()

  } catch (error) {
    console.error('Error saving review:', error)
    showToast('Помилка збереження', 'error')
  }
}

// ============================================
// REPLY MODAL
// ============================================
window.openReplyModal = function(reviewId) {
  const review = allReviews.find(r => r.id === reviewId)
  if (!review) return

  const customerName = review.customerName || review.name || review.userName || 'Анонім'
  
  document.getElementById('reply-review-id').value = reviewId
  document.getElementById('reply-original-review').innerHTML = `
    <div class="flex items-center gap-2 mb-2">
      <span class="font-medium">${customerName}</span>
      <span class="text-yellow-500">${'★'.repeat(review.rating)}</span>
    </div>
    <p class="text-gray-600">${review.text}</p>
  `
  document.getElementById('reply-text').value = review.adminReply || review.reply || ''
  document.getElementById('review-reply-modal').classList.remove('hidden')
}

window.closeReplyModal = function() {
  document.getElementById('review-reply-modal').classList.add('hidden')
}

window.submitReply = async function() {
  const reviewId = document.getElementById('reply-review-id').value
  const replyText = document.getElementById('reply-text').value.trim()

  if (!replyText) {
    showToast('Введіть текст відповіді', 'error')
    return
  }

  try {
    await updateDoc(doc(db, 'reviews', reviewId), {
      adminReply: replyText,
      adminReplyAt: serverTimestamp()
    })

    const review = allReviews.find(r => r.id === reviewId)
    if (review) {
      review.adminReply = replyText
    }

    closeReplyModal()
    renderPublishedReviews()
    showToast('Відповідь збережено', 'success')

  } catch (error) {
    console.error('Error submitting reply:', error)
    showToast('Помилка збереження', 'error')
  }
}

// ============================================
// TEXTAREA AUTO-EXPAND HELPER
// ============================================

/**
 * Auto-expand textarea to fit its content
 * Maintains minimum height while growing to accommodate longer text
 * 
 * @param {HTMLTextAreaElement} textarea - The textarea element to resize
 */
window.autoExpandTextarea = function(textarea) {
  if (!textarea) return
  
  // Store current scroll position
  const scrollTop = window.scrollY
  
  // Reset height to auto to get accurate scrollHeight
  textarea.style.height = 'auto'
  
  // Calculate new height (with minimum of 100px)
  const minHeight = 100
  const newHeight = Math.max(textarea.scrollHeight, minHeight)
  
  // Set new height
  textarea.style.height = newHeight + 'px'
  
  // Restore scroll position (prevents page jumping)
  window.scrollTo(0, scrollTop)
}

// ============================================
// AI REPLY GENERATION
// ============================================

/**
 * Generate AI-powered reply for a review
 * @param {string} reviewId - The ID of the review to generate a reply for
 */
window.handleGenerateAIReply = async function(reviewId) {
  console.log('🤖 AI Reply Generation triggered for review:', reviewId)
  
  // Find the review data
  const review = pendingReviews.find(r => r.id === reviewId)
  if (!review) {
    console.error('❌ Review not found:', reviewId)
    showToast('Відгук не знайдено', 'error')
    return
  }
  
  // Get UI elements
  const btn = document.getElementById(`ai-generate-btn-${reviewId}`)
  const textarea = document.getElementById(`review-reply-${reviewId}`)
  const sparklesIcon = btn?.querySelector('.ai-icon')
  const spinner = btn?.querySelector('.ai-spinner')
  
  if (!btn || !textarea) {
    console.error('❌ UI elements not found')
    return
  }
  
  // Extract review context for AI
  const reviewContext = {
    reviewId: review.id,
    reviewText: review.text || '',
    rating: review.rating || 5,
    customerName: review.customerName || review.userName || 'Клієнт',
    orderId: review.orderId || null,
    products: review.products || [],
    createdAt: review.createdAt?.toDate?.() || new Date()
  }
  
  // Fetch product names if available
  if (review.products && review.products.length > 0) {
    const productNames = review.products
      .map(p => p.name)
      .filter(name => name)
      .join(', ')
    reviewContext.productNames = productNames
  }
  
  // If review has productId, fetch product info
  if (review.productId) {
    const product = await fetchProductById(review.productId)
    if (product && !product.deleted) {
      reviewContext.productNames = product.name
    }
  }
  
  console.log('📝 Review context for AI:', reviewContext)
  
  // Show loading state
  if (sparklesIcon) sparklesIcon.classList.add('hidden')
  if (spinner) {
    spinner.classList.remove('hidden')
    spinner.classList.add('animate-spin')
  }
  btn.disabled = true
  btn.style.cursor = 'wait'
  btn.style.opacity = '0.7'
  
  try {
    // ============================================
    // PLACEHOLDER: AI API Integration
    // ============================================
    // This is where you would call your AI service (OpenAI, Gemini, etc.)
    // For now, we'll simulate a response with a delay
    
    const generatedReply = await generateAIReplyPlaceholder(reviewContext)
    
    // Insert the generated reply into the textarea
    textarea.value = generatedReply
    
    // Auto-expand textarea to fit content
    autoExpandTextarea(textarea)
    
    textarea.focus()
    
    // Highlight the textarea briefly to show the change
    textarea.style.transition = 'all 0.3s ease'
    textarea.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.5)'
    setTimeout(() => {
      textarea.style.boxShadow = 'none'
    }, 1500)
    
    showToast('ШІ відповідь згенеровано!', 'success')
    console.log('✅ AI reply generated successfully')
    
  } catch (error) {
    console.error('❌ AI generation error:', error)
    showToast('Помилка генерації відповіді', 'error')
    
  } finally {
    // Reset button state
    if (sparklesIcon) sparklesIcon.classList.remove('hidden')
    if (spinner) {
      spinner.classList.add('hidden')
      spinner.classList.remove('animate-spin')
    }
    btn.disabled = false
    btn.style.cursor = 'pointer'
    btn.style.opacity = '1'
  }
}

// ============================================
// BULK AI REPLY GENERATION
// ============================================

/**
 * Generate AI replies for ALL reviews in the moderation queue that don't have replies yet
 * This creates draft replies - admin must still approve/publish each review manually
 */
window.handleBulkGenerateAIReplies = async function() {
  console.log('🤖 Bulk AI Reply Generation triggered')
  
  // Get UI elements for the bulk button
  const bulkBtn = document.getElementById('bulk-ai-generate-btn')
  const bulkIcon = bulkBtn?.querySelector('.bulk-ai-icon')
  const bulkSpinner = bulkBtn?.querySelector('.bulk-ai-spinner')
  const bulkText = bulkBtn?.querySelector('.bulk-ai-text')
  
  if (!bulkBtn) {
    console.error('❌ Bulk generate button not found')
    return
  }
  
  // Find reviews that need AI replies (empty textarea or no existing reply)
  const reviewsNeedingReplies = pendingReviews.filter(review => {
    const textarea = document.getElementById(`review-reply-${review.id}`)
    const currentValue = textarea?.value?.trim() || ''
    // Only generate if textarea is empty
    return currentValue === ''
  })
  
  if (reviewsNeedingReplies.length === 0) {
    showToast('Усі відгуки вже мають відповіді', 'info')
    return
  }
  
  console.log(`📋 Found ${reviewsNeedingReplies.length} reviews needing AI replies`)
  
  // Show loading state on bulk button
  if (bulkIcon) bulkIcon.classList.add('hidden')
  if (bulkSpinner) bulkSpinner.classList.remove('hidden')
  if (bulkText) bulkText.textContent = `Обробка... (0/${reviewsNeedingReplies.length})`
  bulkBtn.disabled = true
  bulkBtn.style.opacity = '0.8'
  bulkBtn.style.cursor = 'wait'
  
  let successCount = 0
  let errorCount = 0
  
  try {
    // Process reviews sequentially to avoid overwhelming the API
    for (let i = 0; i < reviewsNeedingReplies.length; i++) {
      const review = reviewsNeedingReplies[i]
      
      // Update progress text
      if (bulkText) bulkText.textContent = `Обробка... (${i + 1}/${reviewsNeedingReplies.length})`
      
      try {
        // Generate AI reply for this review
        await generateSingleAIReplyForBulk(review)
        successCount++
      } catch (error) {
        console.error(`❌ Error generating reply for review ${review.id}:`, error)
        errorCount++
      }
    }
    
    // Show success notification
    if (successCount > 0) {
      showToast(`✅ Підготовлено чернетки відповідей для ${successCount} відгуків`, 'success')
    }
    if (errorCount > 0) {
      showToast(`⚠️ Не вдалося згенерувати ${errorCount} відповідей`, 'error')
    }
    
    console.log(`✅ Bulk generation complete: ${successCount} success, ${errorCount} errors`)
    
  } catch (error) {
    console.error('❌ Bulk generation failed:', error)
    showToast('Помилка масової генерації', 'error')
    
  } finally {
    // Reset bulk button state
    if (bulkIcon) bulkIcon.classList.remove('hidden')
    if (bulkSpinner) bulkSpinner.classList.add('hidden')
    if (bulkText) bulkText.textContent = 'Згенерувати відповіді для всіх'
    bulkBtn.disabled = false
    bulkBtn.style.opacity = '1'
    bulkBtn.style.cursor = 'pointer'
  }
}

/**
 * Generate AI reply for a single review (used by bulk generation)
 * This is a streamlined version that doesn't show individual toasts
 * 
 * @param {Object} review - The review object
 */
async function generateSingleAIReplyForBulk(review) {
  const reviewId = review.id
  
  // Get UI elements for this specific review
  const btn = document.getElementById(`ai-generate-btn-${reviewId}`)
  const textarea = document.getElementById(`review-reply-${reviewId}`)
  const sparklesIcon = btn?.querySelector('.ai-icon')
  const spinner = btn?.querySelector('.ai-spinner')
  
  if (!textarea) {
    throw new Error(`Textarea not found for review ${reviewId}`)
  }
  
  // Show loading state on individual button
  if (btn) {
    if (sparklesIcon) sparklesIcon.classList.add('hidden')
    if (spinner) {
      spinner.classList.remove('hidden')
      spinner.classList.add('animate-spin')
    }
    btn.disabled = true
    btn.style.opacity = '0.7'
  }
  
  try {
    // Build context with product information
    const reviewContext = {
      reviewId: review.id,
      reviewText: review.text || '',
      rating: review.rating || 5,
      customerName: review.customerName || review.userName || 'Клієнт',
      orderId: review.orderId || null,
      products: review.products || [],
      createdAt: review.createdAt?.toDate?.() || new Date()
    }
    
    // Fetch product names if available
    if (review.products && review.products.length > 0) {
      const productNames = review.products
        .map(p => p.name)
        .filter(name => name)
        .join(', ')
      reviewContext.productNames = productNames
    }
    
    // If review has productId, fetch product info
    if (review.productId) {
      const product = await fetchProductById(review.productId)
      if (product && !product.deleted) {
        reviewContext.productNames = product.name
      }
    }
    
    console.log(`📝 Generating AI reply for review ${reviewId}:`, reviewContext)
    
    // Generate the AI reply
    const generatedReply = await generateAIReplyPlaceholder(reviewContext)
    
    // Insert the generated reply into the textarea
    textarea.value = generatedReply
    
    // Auto-expand textarea to fit content
    autoExpandTextarea(textarea)
    
    // Brief highlight effect
    textarea.style.transition = 'all 0.3s ease'
    textarea.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.5)'
    setTimeout(() => {
      textarea.style.boxShadow = 'none'
    }, 800)
    
    console.log(`✅ AI reply generated for review ${reviewId}`)
    
  } finally {
    // Reset individual button state
    if (btn) {
      if (sparklesIcon) sparklesIcon.classList.remove('hidden')
      if (spinner) {
        spinner.classList.add('hidden')
        spinner.classList.remove('animate-spin')
      }
      btn.disabled = false
      btn.style.opacity = '1'
    }
  }
}

/**
 * Placeholder function for AI reply generation
 * Replace this with actual API call to OpenAI, Gemini, or other AI service
 * 
 * @param {Object} context - Review context containing text, rating, customer info
 * @returns {Promise<string>} Generated reply text
 */
async function generateAIReplyPlaceholder(context) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  // ============================================
  // TODO: Replace with actual AI API call
  // Example with OpenAI:
  // 
  // const response = await fetch('/api/generate-reply', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     prompt: `Generate a professional, friendly store reply for this customer review:
  //     Rating: ${context.rating}/5
  //     Review: "${context.reviewText}"
  //     Customer: ${context.customerName}
  //     
  //     The reply should:
  //     - Be in Ukrainian language
  //     - Thank the customer
  //     - Address their feedback specifically
  //     - Be warm but professional
  //     - Be 2-3 sentences max`,
  //   })
  // })
  // const data = await response.json()
  // return data.reply
  // ============================================
  
  // Generate contextual placeholder response based on rating and product context
  const { rating, customerName, reviewText, productNames } = context
  const name = customerName.split(' ')[0] // Use first name only
  
  // Add product mention if available
  const productMention = productNames ? ` Раді, що "${productNames}" вам сподобалось!` : ''
  
  if (rating >= 4) {
    // Positive review response
    const positiveResponses = [
      `Дякуємо за чудовий відгук, ${name}! 🌶️${productMention} Завжди чекаємо вас знову!`,
      `${name}, щиро вдячні за теплі слова!${productMention} Ваша підтримка надихає нас ставати ще кращими. До нових смачних зустрічей! 🔥`,
      `Дякуємо за високу оцінку, ${name}!${productMention} Ми завжди намагаємося радувати наших клієнтів найкращою якістю. Гарного вам дня! ✨`,
    ]
    return positiveResponses[Math.floor(Math.random() * positiveResponses.length)]
  } else if (rating >= 3) {
    // Neutral review response
    return `Дякуємо за відгук, ${name}! Ми цінуємо вашу думку та постійно працюємо над покращенням${productNames ? ` нашого "${productNames}"` : ''}. Якщо маєте побажання — будемо раді почути! 💬`
  } else {
    // Negative review response
    return `${name}, дякуємо за чесний відгук${productNames ? ` щодо "${productNames}"` : ''}. Нам дуже шкода, що ваш досвід не відповідав очікуванням. Ми обов'язково врахуємо ваші зауваження. Будь ласка, зв'яжіться з нами для вирішення питання. 🙏`
  }
}

// ============================================
// TOAST HELPER
// ============================================
function showToast(message, type = 'info') {
  const toast = document.createElement('div')
  toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in ${
    type === 'success' ? 'bg-green-500 text-white' : 
    type === 'error' ? 'bg-red-500 text-white' : 
    'bg-gray-800 text-white'
  }`
  toast.textContent = message
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 3000)
}

// Initialize on first load if view is active
if (document.getElementById('view-reviews')?.classList.contains('active')) {
  loadReviewsView()
}