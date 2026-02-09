// ============================================
// CRM-MODULE.JS - Standalone CRM Kanban Board
// ============================================
// This module provides a complete CRM Kanban board for managing
// abandoned carts with custom pipeline stages.
//
// Usage:
//   import { initCRM } from './crm-module.js';
//   initCRM();
// ============================================

/**
 * CRM Module - Manages the Kanban board for abandoned carts
 * Uses global window.firebaseInit to access Firestore
 */

let db = null;
let unsubscribeColumns = null;
let unsubscribeCarts = null;
let currentColumns = [];
let currentCarts = [];
let isEditingColumn = false;
let currentView = 'kanban'; // 'kanban' or 'analytics'

/**
 * Initialize the CRM module
 * @returns {Promise<void>}
 */
export async function initCRM() {
    console.log('🎯 Initializing CRM Kanban Module...');
    
    // Wait for Firebase to be initialized
    if (!window.firebaseInit || !window.firebaseInit.db) {
        console.error('❌ Firebase not initialized. Waiting...');
        await waitForFirebase();
    }
    
    db = window.firebaseInit.db;
    
    // Load the CRM board
    await renderCrmBoard();
    
    // Start automation timer
    startAutomationTimer();
    
    console.log('✅ CRM Module initialized successfully');
}

/**
 * Wait for Firebase initialization
 * @returns {Promise<void>}
 */
function waitForFirebase() {
    return new Promise((resolve) => {
        const checkFirebase = setInterval(() => {
            if (window.firebaseInit && window.firebaseInit.db) {
                clearInterval(checkFirebase);
                resolve();
            }
        }, 100);
    });
}

/**
 * Render the complete CRM Kanban board
 * @returns {Promise<void>}
 */
export async function renderCrmBoard() {
    const container = document.getElementById('crm-module-container');
    if (!container) {
        console.error('❌ CRM container not found');
        return;
    }
    
    // Show loading state
    container.innerHTML = `
        <div class="flex items-center justify-center py-20">
            <div class="text-center">
                <div class="animate-spin w-12 h-12 border-4 border-spicy border-t-transparent rounded-full mx-auto mb-4"></div>
                <p class="text-gray-600">Завантаження CRM дошки...</p>
            </div>
        </div>
    `;
    
    try {
        // Load columns and carts
        await loadCRMData();
        
        // Render the board
        renderBoardUI(container);
        
        // Initialize Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
        
    } catch (error) {
        console.error('❌ Error loading CRM board:', error);
        container.innerHTML = `
            <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <i data-lucide="alert-circle" class="w-12 h-12 text-red-500 mx-auto mb-3"></i>
                <h3 class="text-lg font-bold text-gray-900 mb-2">Помилка завантаження</h3>
                <p class="text-sm text-gray-600 mb-4">${error.message}</p>
                <button onclick="window.crmModule.renderCrmBoard()" 
                    class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">
                    Спробувати знову
                </button>
            </div>
        `;
        
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
}

/**
 * Load CRM columns and carts from Firestore
 * Sets up real-time listeners with onSnapshot
 * @returns {Promise<void>}
 */
async function loadCRMData() {
    if (!db) {
        throw new Error('Firestore not initialized');
    }
    
    // Import Firestore functions
    const { collection, getDocs, query, orderBy, onSnapshot, setDoc, doc: firestoreDoc } = window.firebaseInit;
    
    // Load columns (one-time, they don't change often)
    const columnsRef = collection(db, 'crm_columns');
    const columnsQuery = query(columnsRef, orderBy('order', 'asc'));
    const columnsSnapshot = await getDocs(columnsQuery);
    
    currentColumns = columnsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
    
    console.log('📋 Loaded CRM columns:', currentColumns.length);
    
    // Auto-create default "new_lead" column if no columns exist
    if (currentColumns.length === 0) {
        console.warn('⚠️ No CRM columns found. Creating default "new_lead" column...');
        try {
            const defaultColumnRef = firestoreDoc(db, 'crm_columns', 'new_lead');
            await setDoc(defaultColumnRef, {
                name: 'Новий лід',
                description: 'Нові покинуті кошики, потребують першого контакту',
                color: '#3b82f6',
                order: 0,
                created_at: new Date()
            });
            
            // Reload columns
            const updatedSnapshot = await getDocs(columnsQuery);
            currentColumns = updatedSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            console.log('✅ Default column "new_lead" created successfully');
            showToast('✅ Створено базову колонку "Новий лід"', 'success');
        } catch (error) {
            console.error('❌ Failed to create default column:', error);
        }
    }
    
    // Set up real-time listener for carts
    // IMPORTANT: Smart Import - respect automation settings
    const cartsRef = collection(db, 'abandoned_carts');
    const cartsQuery = query(
        cartsRef,
        orderBy('updated_at', 'desc')
    );
    
    console.log('📡 Setting up real-time listener with Smart Import...');
    
    // Load automation settings first
    let automationSettings = null;
    try {
        const { doc: firestoreDoc, getDoc } = window.firebaseInit;
        const settingsRef = firestoreDoc(db, 'settings', 'crm_automation');
        const settingsSnap = await getDoc(settingsRef);
        
        if (settingsSnap.exists()) {
            automationSettings = settingsSnap.data();
            console.log('⚙️ Automation settings loaded:', automationSettings);
        }
    } catch (error) {
        console.warn('⚠️ Could not load automation settings:', error);
    }
    
    // Listen to real-time changes
    unsubscribeCarts = onSnapshot(cartsQuery, (snapshot) => {
        console.log('🔄 Real-time update: Cart data changed');
        console.log('📦 Total documents received:', snapshot.docs.length);
        
        const now = new Date();
        
        // Map all carts and apply Smart Import logic
        currentCarts = snapshot.docs.map(doc => {
            const data = doc.data();
            
            // Skip carts without required fields
            if (!data.created_at && !data.updated_at) {
                console.warn('⚠️ Cart missing timestamps, skipping:', doc.id);
                return null;
            }
            
            const createdAt = data.created_at?.toDate ? data.created_at.toDate() : 
                            (data.created_at ? new Date(data.created_at) : 
                            (data.updated_at?.toDate ? data.updated_at.toDate() : new Date(data.updated_at)));
            
            // Calculate age of cart
            const cartAgeMs = now - createdAt;
            
            // Check if cart has crm_status
            let shouldShow = true;
            let crmStatus = data.crm_status;
            
            if (!data.crm_status && !data.manually_transferred) {
                // Cart not yet in CRM and not manually transferred
                
                if (automationSettings && automationSettings.initialDelay) {
                    // Apply initial delay rule
                    const delayMs = convertToMs(
                        automationSettings.initialDelay.value,
                        automationSettings.initialDelay.unit
                    );
                    
                    if (cartAgeMs < delayMs) {
                        // Cart is too young, don't show yet
                        console.log(`⏳ Cart ${doc.id} waiting for initial delay (${cartAgeMs}ms < ${delayMs}ms)`);
                        shouldShow = false;
                    } else {
                        // Cart passed delay, use target column
                        crmStatus = automationSettings.initialDelay.targetColumn || 'new_lead';
                        console.log(`✅ Cart ${doc.id} ready for CRM → ${crmStatus}`);
                    }
                } else {
                    // No automation settings, use default
                    crmStatus = 'new_lead';
                }
            }
            
            // If manually transferred, always show immediately
            if (data.manually_transferred) {
                shouldShow = true;
                crmStatus = data.crm_status || 'new_lead';
                console.log(`👤 Manually transferred cart ${doc.id} → ${crmStatus}`);
            }
            
            if (!shouldShow) {
                return null;
            }
            
            return {
                id: doc.id,
                ...data,
                crm_status: crmStatus
            };
        }).filter(cart => cart !== null); // Remove null entries
        
        console.log('🛒 CRM carts displayed:', currentCarts.length);
        console.log('📊 Carts by status:', countCartsByStatus(currentCarts));
        
        // Save modal state before re-rendering
        const modal = document.getElementById('crm-details-modal');
        const isModalOpen = modal && !modal.classList.contains('hidden');
        const activeCartId = modal?.dataset.cartId;
        
        // Re-render the board with new data
        const container = document.getElementById('crm-module-container');
        if (container && currentColumns.length > 0) {
            renderBoardUI(container);
            initializeDragDrop();
            
            // Reinit Lucide icons
            if (window.lucide) {
                window.lucide.createIcons();
            }
            
            // Restore modal if it was open
            if (isModalOpen && activeCartId) {
                console.log('🔄 Restoring modal for cart:', activeCartId);
                // Re-open the modal with fresh data
                setTimeout(() => {
                    openCardDetails(activeCartId);
                }, 100); // Small delay to ensure DOM is ready
            }
        }
    }, (error) => {
        console.error('❌ Real-time listener error:', error);
        showToast('❌ Помилка синхронізації даних', 'error');
    });
    
    console.log('✅ Real-time sync enabled for abandoned carts');
}

/**
 * Render the board UI
 * @param {HTMLElement} container - The container element
 */
function renderBoardUI(container) {
    // Header section
    const headerHTML = `
        <div class="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200 shadow-sm mb-6 p-6">
            <div class="flex items-start justify-between">
                <div class="flex items-start gap-4">
                    <div class="p-3 bg-purple-100 rounded-lg">
                        <i data-lucide="kanban-square" class="w-6 h-6 text-purple-600"></i>
                    </div>
                    <div class="flex-1">
                        <h3 class="text-lg font-bold text-gray-900 mb-2">🎯 CRM - Воронка продажів</h3>
                        <p class="text-sm text-gray-600 mb-1">
                            Управляйте покинутими кошиками через Kanban-дошку
                        </p>
                        <p class="text-xs text-gray-500">
                            Перетягуйте картки між етапами воронки для відстеження прогресу
                        </p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="window.crmModule.toggleView()" 
                        class="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-semibold transition-all duration-300"
                        id="view-toggle-btn"
                        title="Переключити вид">
                        <i data-lucide="bar-chart-3" class="w-4 h-4"></i>
                        <span>Аналітика</span>
                    </button>
                    <button onclick="window.crmModule.migrateCartsWithoutStatus()" 
                        class="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition"
                        title="Додати crm_status до всіх старих кошиків">
                        <i data-lucide="database" class="w-4 h-4"></i>
                        <span>Міграція</span>
                    </button>
                    <button onclick="window.crmModule.refreshBoard()" 
                        class="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg font-semibold transition">
                        <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                        <span>Оновити</span>
                    </button>
                    <button onclick="window.crmModule.openColumnSettings()" 
                        class="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition">
                        <i data-lucide="settings" class="w-4 h-4"></i>
                        <span>Налаштування колонок</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Statistics section
    const statsHTML = renderStats();
    
    // Content section - Kanban or Analytics
    let contentHTML = '';
    
    if (currentView === 'analytics') {
        contentHTML = renderAnalyticsDashboard();
    } else {
        // Kanban board
        contentHTML = `
            <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div class="p-4 border-b border-gray-200 bg-gray-50">
                    <div class="flex items-center justify-between">
                        <h3 class="text-base font-bold text-gray-900">Воронка продажів</h3>
                        <span class="text-sm text-gray-600">Всього карток: ${currentCarts.length}</span>
                    </div>
                </div>
                <div class="p-6 overflow-x-auto scroll-smooth">
                    <div class="flex gap-4 min-w-max pb-4" id="crm-kanban-board">
                        ${renderColumns()}
                    </div>
                </div>
            </div>
        `;
    }
    
    container.innerHTML = headerHTML + statsHTML + contentHTML;
    
    // Update toggle button text
    updateViewToggleButton();
    
    // Add confirmation modal to the page
    const modalHTML = `
        <div id="order-confirmation-modal" class="fixed inset-0 bg-black bg-opacity-50 z-50 hidden flex items-center justify-center p-4">
            <div class="bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all">
                <div class="p-6 border-b border-gray-200">
                    <div class="flex items-center gap-3 mb-2">
                        <div class="p-2 bg-green-100 rounded-lg">
                            <i data-lucide="shopping-cart" class="w-6 h-6 text-green-600"></i>
                        </div>
                        <h3 class="text-xl font-bold text-gray-900">Створити замовлення?</h3>
                    </div>
                    <p class="text-sm text-gray-600">Перетворення покинутого кошика на реальне замовлення</p>
                </div>
                <div id="order-confirmation-content" class="p-6">
                    <!-- Content will be dynamically inserted -->
                </div>
                <div class="p-6 border-t border-gray-200 flex gap-3">
                    <button 
                        id="cancel-order-btn"
                        onclick="window.crmModule.closeOrderConfirmation()"
                        class="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition">
                        Скасувати
                    </button>
                    <button 
                        id="confirm-order-btn"
                        onclick="window.crmModule.confirmCreateOrder()"
                        class="flex-1 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2">
                        <i data-lucide="check-circle" class="w-4 h-4"></i>
                        <span>Так, створити</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add Cart Details Modal to the page
    const detailsModalHTML = `
        <div id="crm-details-modal" class="fixed inset-0 z-[100] hidden items-center justify-center bg-black bg-opacity-50 p-4">
            <div class="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden transform transition-all">
                <!-- Header -->
                <div class="sticky top-0 bg-white p-6 border-b border-gray-200 z-10">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="p-2 bg-indigo-100 rounded-lg">
                                <i data-lucide="info" class="w-6 h-6 text-indigo-600"></i>
                            </div>
                            <div>
                                <h3 class="text-xl font-bold text-gray-900">Деталі кошика</h3>
                                <p class="text-sm text-gray-600">Повна інформація про покинутий кошик</p>
                            </div>
                        </div>
                        <button 
                            onclick="window.crmModule.closeCardDetails()"
                            class="p-2 hover:bg-gray-100 rounded-lg transition"
                            title="Закрити">
                            <i data-lucide="x" class="w-5 h-5 text-gray-600"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Content -->
                <div id="crm-details-content" class="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    <!-- Content will be dynamically inserted -->
                </div>
                
                <!-- Footer Actions -->
                <div class="sticky bottom-0 bg-gray-50 p-6 border-t border-gray-200 flex gap-3">
                    <button 
                        onclick="window.crmModule.closeCardDetails()"
                        class="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition">
                        Закрити
                    </button>
                    <button 
                        id="create-order-from-details-btn"
                        onclick="window.crmModule.createOrderFromDetails()"
                        class="flex-1 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2">
                        <i data-lucide="check-circle" class="w-4 h-4"></i>
                        <span>Створити замовлення</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', detailsModalHTML);
    
    // Add click outside to close modal
    document.addEventListener('click', (e) => {
        const modal = document.getElementById('crm-details-modal');
        if (modal && e.target === modal) {
            closeCardDetails();
        }
    });
    
    // Initialize drag and drop
    initializeDragDrop();
}

/**
 * Render statistics cards
 * @returns {string} HTML for statistics
 */
function renderStats() {
    const totalCarts = currentCarts.length;
    const totalValue = currentCarts.reduce((sum, cart) => {
        return sum + (parseFloat(cart.total) || 0);
    }, 0);
    
    // Calculate conversion by columns
    const columnStats = currentColumns.map(col => {
        const cartsInColumn = currentCarts.filter(cart => cart.crm_status === col.id);
        return {
            name: col.name,
            count: cartsInColumn.length,
            percentage: totalCarts > 0 ? Math.round((cartsInColumn.length / totalCarts) * 100) : 0
        };
    });
    
    return `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-sm font-semibold text-gray-600">Всього карток</span>
                    <i data-lucide="layers" class="w-5 h-5 text-blue-500"></i>
                </div>
                <p class="text-3xl font-bold text-gray-900">${totalCarts}</p>
            </div>
            
            <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-sm font-semibold text-gray-600">Загальна сума</span>
                    <i data-lucide="dollar-sign" class="w-5 h-5 text-green-500"></i>
                </div>
                <p class="text-3xl font-bold text-gray-900">${totalValue.toFixed(0)} ₴</p>
            </div>
            
            <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-sm font-semibold text-gray-600">Середній чек</span>
                    <i data-lucide="trending-up" class="w-5 h-5 text-purple-500"></i>
                </div>
                <p class="text-3xl font-bold text-gray-900">${totalCarts > 0 ? (totalValue / totalCarts).toFixed(0) : 0} ₴</p>
            </div>
            
            <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-sm font-semibold text-gray-600">Етапів воронки</span>
                    <i data-lucide="columns" class="w-5 h-5 text-orange-500"></i>
                </div>
                <p class="text-3xl font-bold text-gray-900">${currentColumns.length}</p>
            </div>
        </div>
    `;
}

/**
 * Render Kanban columns
 * @returns {string} HTML for columns
 */
function renderColumns() {
    const columnsHTML = currentColumns.map(column => {
        // Filter cards for this column
        const cardsInColumn = currentCarts.filter(cart => cart.crm_status === column.id);
        const columnTotal = cardsInColumn.reduce((sum, cart) => sum + (parseFloat(cart.total) || 0), 0);
        
        // Determine statusType (default to 'neutral' if not set)
        const statusType = column.statusType || 'neutral';
        
        // Define color schemes based on statusType
        let columnBg, headerBg, borderColor, statusIcon, cardIcon;
        
        switch(statusType) {
            case 'success':
                columnBg = 'bg-gradient-to-b from-green-50 to-white';
                headerBg = 'bg-gradient-to-br from-green-100 to-green-50';
                borderColor = 'border-green-500';
                statusIcon = '<span class="inline-flex items-center justify-center w-5 h-5 bg-green-500 text-white rounded-full text-xs shadow-sm" title="Успіх">✓</span>';
                cardIcon = '<div class="absolute top-2 right-2 w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs shadow-sm" title="Успіх"><i data-lucide="check" class="w-3 h-3"></i></div>';
                break;
            case 'failure':
                columnBg = 'bg-gradient-to-b from-red-50 to-white';
                headerBg = 'bg-gradient-to-br from-red-100 to-red-50';
                borderColor = 'border-red-500';
                statusIcon = '<span class="inline-flex items-center justify-center w-5 h-5 bg-red-500 text-white rounded-full text-xs shadow-sm" title="Невдача">✕</span>';
                cardIcon = '<div class="absolute top-2 right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow-sm" title="Невдача"><i data-lucide="x" class="w-3 h-3"></i></div>';
                break;
            case 'neutral':
            default:
                columnBg = 'bg-gradient-to-b from-indigo-50 to-white';
                headerBg = 'bg-gradient-to-br from-indigo-100 to-indigo-50';
                borderColor = 'border-indigo-500';
                statusIcon = '<span class="inline-flex items-center justify-center w-5 h-5 bg-indigo-500 text-white rounded-full text-xs shadow-sm" title="В роботі">⚡</span>';
                cardIcon = '<div class="absolute top-2 right-2 w-5 h-5 bg-indigo-500 text-white rounded-full flex items-center justify-center text-xs shadow-sm" title="В роботі"><i data-lucide="zap" class="w-3 h-3"></i></div>';
                break;
        }
        
        // Debug logs
        console.log(`📋 Loading cards for column: "${column.name}" (${column.id})`);
        console.log(`   ├─ Cards found: ${cardsInColumn.length}`);
        console.log(`   └─ Total value: ${columnTotal.toFixed(0)} ₴`);
        
        return `
            <div class="flex-shrink-0 w-80 ${columnBg} rounded-xl border-t-4 ${borderColor} shadow-sm hover:shadow-md transition-all duration-300 ease-in-out overflow-hidden">
                <div class="${headerBg} p-4 border-b border-gray-200/50 backdrop-blur-sm">
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex-1 flex items-center gap-2">
                            ${statusIcon}
                            <input 
                                type="text" 
                                value="${column.name || 'Без назви'}"
                                data-column-id="${column.id}"
                                onblur="window.crmModule.saveColumnName(this)"
                                onkeydown="if(event.key==='Enter') this.blur()"
                                class="column-name-input font-bold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-purple-500 rounded px-2 py-1 w-full hover:bg-white transition"
                                placeholder="Назва колонки"
                            />
                        </div>
                        <div class="flex items-center gap-1">
                            <span class="px-2.5 py-1 bg-white rounded-full text-xs font-bold text-gray-700">
                                ${cardsInColumn.length}
                            </span>
                            <button 
                                onclick="window.crmModule.deleteColumn('${column.id}')" 
                                class="p-1 hover:bg-red-100 rounded transition"
                                title="Видалити колонку">
                                <i data-lucide="trash-2" class="w-4 h-4 text-red-600"></i>
                            </button>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="block text-xs font-semibold text-gray-700 mb-1">Тип статусу:</label>
                        <select 
                            data-column-id="${column.id}"
                            data-field="statusType"
                            onchange="window.crmModule.saveColumnField(this)"
                            class="w-full text-sm text-gray-900 bg-white border-2 ${borderColor} rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 transition cursor-pointer font-medium">
                            <option value="neutral" ${statusType === 'neutral' ? 'selected' : ''}>⚡ Звичайний (В роботі)</option>
                            <option value="success" ${statusType === 'success' ? 'selected' : ''}>✅ Успіх</option>
                            <option value="failure" ${statusType === 'failure' ? 'selected' : ''}>❌ Невдача / Скасовано</option>
                        </select>
                    </div>
                    ${column.description ? `
                        <textarea 
                            data-column-id="${column.id}"
                            data-field="description"
                            onblur="window.crmModule.saveColumnField(this)"
                            class="column-desc-input text-xs text-gray-600 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-purple-500 rounded px-2 py-1 w-full hover:bg-white transition mb-2 resize-none"
                            placeholder="Опис колонки"
                            rows="2"
                        >${column.description}</textarea>
                    ` : `
                        <textarea 
                            data-column-id="${column.id}"
                            data-field="description"
                            onblur="window.crmModule.saveColumnField(this)"
                            class="column-desc-input text-xs text-gray-500 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-purple-500 rounded px-2 py-1 w-full hover:bg-white transition mb-2 resize-none"
                            placeholder="Додати опис..."
                            rows="2"
                        ></textarea>
                    `}
                    <div class="text-xs font-semibold text-gray-700">
                        Сума: ${columnTotal.toFixed(0)} ₴
                    </div>
                </div>
                <div class="p-3 space-y-3 min-h-[200px] max-h-[600px] overflow-y-auto scroll-smooth crm-column" 
                     data-column-id="${column.id}">
                    ${renderCardsInColumn(cardsInColumn, cardIcon)}
                </div>
            </div>
        `;
    }).join('');
    
    // Add "New Column" button
    const addColumnHTML = `
        <div class="flex-shrink-0 w-80">
            <button 
                onclick="window.crmModule.addNewColumn()"
                class="w-full h-full min-h-[200px] bg-white hover:bg-gray-50 border-2 border-dashed border-gray-300 hover:border-indigo-400 rounded-xl flex flex-col items-center justify-center gap-3 transition-all duration-300 ease-in-out group shadow-sm hover:shadow-md">
                <i data-lucide="plus-circle" class="w-12 h-12 text-gray-400 group-hover:text-indigo-500 transition-colors duration-300"></i>
                <span class="text-base font-semibold text-gray-500 group-hover:text-indigo-600 transition-colors duration-300">
                    Додати колонку
                </span>
            </button>
        </div>
    `;
    
    return columnsHTML + addColumnHTML;
}

/**
 * Render cards in a column
 * @param {Array} cards - Array of cart objects
 * @param {string} cardIcon - HTML for status icon to display on card
 * @returns {string} HTML for cards
 */
function renderCardsInColumn(cards, cardIcon = '') {
    if (cards.length === 0) {
        return `
            <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50/50">
                <i data-lucide="inbox" class="w-10 h-10 mx-auto mb-3 text-gray-400"></i>
                <p class="text-sm text-gray-500 font-medium">Тут поки порожньо</p>
                <p class="text-xs text-gray-400 mt-1">Перетягніть картку сюди</p>
            </div>
        `;
    }
    
    return cards.map(cart => renderCard(cart, cardIcon)).join('');
}

/**
 * Render a single CRM card
 * @param {Object} cart - Cart object
 * @param {string} cardIcon - HTML for status icon to display on card
 * @returns {string} HTML for card
 */
function renderCard(cart, cardIcon = '') {
    const customer = cart.customer || {};
    const phone = customer.phone || 'Немає телефону';
    const name = customer.fullName || customer.name || 'Без імені';
    const telegram = customer.telegram || '';
    const total = parseFloat(cart.total) || 0;
    const items = cart.items || [];
    const itemCount = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    
    // Format created_at timestamp
    let dateStr = 'Невідомо';
    let timeAgo = '';
    
    if (cart.created_at || cart.updated_at) {
        const timestamp = cart.created_at || cart.updated_at;
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        
        // Format as DD.MM HH:MM
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        dateStr = `${day}.${month} ${hours}:${minutes}`;
        
        // Calculate time ago
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) {
            timeAgo = 'щойно';
        } else if (diffMins < 60) {
            timeAgo = `${diffMins} хв тому`;
        } else if (diffHours < 24) {
            timeAgo = `${diffHours} год тому`;
        } else if (diffDays === 1) {
            timeAgo = 'вчора';
        } else if (diffDays < 7) {
            timeAgo = `${diffDays} дн тому`;
        } else {
            timeAgo = dateStr;
        }
    }
    
    // Telegram badge
    const telegramBadge = telegram && telegram !== 'Не вказано' 
        ? `<div class="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
              <i data-lucide="send" class="w-3 h-3"></i>
              <span>${telegram}</span>
           </div>`
        : '';
    
    // Auto-updated badge
    const autoUpdatedBadge = cart.auto_updated 
        ? `<div class="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded" title="${cart.auto_update_reason || 'Автоматично оновлено'}">
              <i data-lucide="bot" class="w-3 h-3"></i>
              <span>Auto</span>
           </div>`
        : '';
    
    // Manually transferred badge
    const manualBadge = cart.manually_transferred 
        ? `<div class="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded" title="Переданий в CRM вручну">
              <i data-lucide="user-check" class="w-3 h-3"></i>
              <span>Manual</span>
           </div>`
        : '';
    
    // Notes indicator
    const notesHistory = cart.notes_history || [];
    const notesCount = notesHistory.length;
    const notesIndicator = notesCount > 0
        ? `<div class="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded" title="${notesCount} нотаток">
              <i data-lucide="sticky-note" class="w-3 h-3"></i>
              <span class="font-bold">${notesCount}</span>
           </div>`
        : '';
    
    return `
        <div class="relative bg-white rounded-lg border border-gray-100 hover:border-indigo-300 p-4 shadow-sm hover:shadow-md transition-all duration-300 ease-in-out cursor-move crm-card group ${cart.auto_updated ? 'ring-2 ring-purple-200' : ''} ${cart.manually_transferred ? 'ring-2 ring-green-200' : ''}" 
             data-cart-id="${cart.id}"
             draggable="true"
             style="transform-origin: center; will-change: transform, box-shadow;">
            ${cardIcon}
            
            <!-- Customer Info -->
            <div class="flex items-start justify-between mb-3">
                <div class="flex-1">
                    <h5 class="font-semibold text-gray-900 text-sm mb-1 leading-tight group-hover:text-indigo-600 transition-colors duration-200">${name}</h5>
                    <div class="flex items-center gap-1 text-xs text-gray-500 mb-1">
                        <i data-lucide="phone" class="w-3 h-3"></i>
                        <span>${phone}</span>
                    </div>
                    <div class="flex items-center gap-1 flex-wrap">
                        ${telegramBadge}
                        ${autoUpdatedBadge}
                        ${manualBadge}
                        ${notesIndicator}
                    </div>
                </div>
                <button onclick="window.crmModule.openCardDetails('${cart.id}')" 
                    class="p-1 hover:bg-gray-100 rounded transition-all duration-200 flex-shrink-0 opacity-0 group-hover:opacity-100"
                    title="Детальніше">
                    <i data-lucide="more-vertical" class="w-4 h-4 text-gray-500"></i>
                </button>
            </div>
            
            <!-- Cart Info -->
            <div class="space-y-1.5 mb-3">
                <div class="flex items-center gap-2 text-xs text-gray-500">
                    <i data-lucide="shopping-bag" class="w-3.5 h-3.5 flex-shrink-0 text-gray-400"></i>
                    <span class="font-medium">${itemCount} товар(ів)</span>
                </div>
                <div class="flex items-center gap-2 text-xs text-gray-500">
                    <i data-lucide="clock" class="w-3.5 h-3.5 flex-shrink-0 text-gray-400"></i>
                    <span class="font-medium" title="${dateStr}">${timeAgo}</span>
                </div>
            </div>
            
            <!-- Amount & Actions -->
            <div class="flex items-center justify-between pt-3 border-t border-gray-100">
                <span class="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors duration-200">${total.toFixed(0)} ₴</span>
                <div class="flex items-center gap-1.5">
                    <button 
                        onclick="window.crmModule.openCardDetails('${cart.id}')"
                        class="flex items-center gap-1 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold rounded-md transition-all duration-200 hover:scale-105 active:scale-95"
                        title="Деталі та нотатки">
                        <i data-lucide="eye" class="w-3.5 h-3.5"></i>
                        <span>Деталі</span>
                    </button>
                    <button 
                        onclick="window.crmModule.createOrderFromCart('${cart.id}')" 
                        class="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-md transition-all duration-200 hover:scale-105 active:scale-95"
                        title="Створити замовлення">
                        <i data-lucide="check" class="w-3.5 h-3.5"></i>
                        <span>Замовлення</span>
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Initialize drag and drop functionality
 */
function initializeDragDrop() {
    if (!window.Sortable) {
        console.warn('⚠️ SortableJS not loaded. Drag and drop disabled.');
        return;
    }
    
    const columns = document.querySelectorAll('.crm-column');
    
    columns.forEach(column => {
        new Sortable(column, {
            group: 'crm-cards',
            animation: 150,
            ghostClass: 'opacity-50',
            dragClass: 'shadow-xl',
            onEnd: async (evt) => {
                const cartId = evt.item.dataset.cartId;
                const newColumnId = evt.to.dataset.columnId;
                
                console.log(`Moving cart ${cartId} to column ${newColumnId}`);
                
                // Update cart status in Firestore
                await updateCartStatus(cartId, newColumnId);
            }
        });
    });
}

/**
 * Update cart CRM status in Firestore
 * @param {string} cartId - Cart document ID
 * @param {string} columnId - New column ID
 * @returns {Promise<void>}
 */
async function updateCartStatus(cartId, columnId) {
    if (!db) return;
    
    try {
        const { doc, updateDoc, serverTimestamp, getDoc } = window.firebaseInit;
        const cartRef = doc(db, 'abandoned_carts', cartId);
        
        // Get current cart data to save previous status
        const cartSnap = await getDoc(cartRef);
        const currentData = cartSnap.data();
        const previousStatusId = currentData?.crm_status;
        
        // Find the column names
        const previousColumn = previousStatusId ? currentColumns.find(c => c.id === previousStatusId) : null;
        const newColumn = currentColumns.find(c => c.id === columnId);
        
        const previousStatusName = previousColumn ? previousColumn.name : null;
        const newStatusName = newColumn ? newColumn.name : 'Невідомий статус';
        
        // Determine if we're moving to a failure column
        const isMovingToFailure = newColumn && newColumn.statusType === 'failure';
        
        // Prepare update data
        const updateData = {
            crm_status: columnId,
            updated_at: serverTimestamp()
        };
        
        // Save previous status info if moving from one status to another
        if (previousStatusId && previousStatusId !== columnId) {
            // Save both ID and human-readable name
            updateData.last_status = previousStatusId;
            
            if (previousStatusName) {
                updateData.previousStatusName = previousStatusName;
            }
            
            // If moving to failure, track the transition with readable name
            if (isMovingToFailure) {
                updateData.failed_from_status = previousStatusId;
                if (previousStatusName) {
                    updateData.failedFromStatusName = previousStatusName;
                }
                updateData.failed_at = serverTimestamp();
                console.log(`🔴 Cart ${cartId} failed from status: ${previousStatusName} (${previousStatusId})`);
            }
        }
        
        await updateDoc(cartRef, updateData);
        
        // Update local cache
        const cart = currentCarts.find(c => c.id === cartId);
        if (cart) {
            cart.crm_status = columnId;
            if (previousStatusId) {
                cart.last_status = previousStatusId;
            }
            if (previousStatusName) {
                cart.previousStatusName = previousStatusName;
            }
            if (isMovingToFailure && previousStatusName) {
                cart.failed_from_status = previousStatusId;
                cart.failedFromStatusName = previousStatusName;
            }
        }
        
        showToast('✅ Статус картки оновлено', 'success');
        
    } catch (error) {
        console.error('❌ Error updating cart status:', error);
        showToast('❌ Помилка оновлення статусу', 'error');
        
        // Refresh board to revert UI changes
        await renderCrmBoard();
    }
}

/**
 * Refresh the board
 * @returns {Promise<void>}
 */
export async function refreshBoard() {
    await renderCrmBoard();
    showToast('✅ Дошка оновлена', 'success');
}

/**
 * Open column settings modal
 */
export async function openColumnSettings() {
    await openAutomationSettings();
}

/**
 * Open card details modal
 * @param {string} cartId - Cart document ID
 */
/**
 * Render notes history list
 * @param {Array} notesHistory - Array of note objects
 * @returns {string} HTML for notes history
 */
function renderNotesHistory(notesHistory) {
    if (!notesHistory || notesHistory.length === 0) {
        return `
            <div class="text-center py-6 text-gray-500">
                <i data-lucide="inbox" class="w-10 h-10 mx-auto mb-2 opacity-50"></i>
                <p class="text-sm">Ще немає нотаток</p>
            </div>
        `;
    }
    
    // Sort by timestamp (newest first)
    const sorted = [...notesHistory].sort((a, b) => {
        const timeA = a.time?.toDate ? a.time.toDate() : (a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.time || a.timestamp));
        const timeB = b.time?.toDate ? b.time.toDate() : (b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.time || b.timestamp));
        return timeB - timeA;
    });
    
    return sorted.map(note => {
        // Support both old format (timestamp) and new format (time)
        const timestamp = note.time || note.timestamp;
        const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const dateStr = `${day}.${month} ${hours}:${minutes}`;
        
        // Support both old format (adminName) and new format (admin)
        const adminName = note.admin || note.adminName || 'Admin';
        
        // Serialize note for deletion (use data attribute to avoid escaping issues)
        const noteJSON = JSON.stringify(note);
        
        return `
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div class="flex items-start gap-3">
                    <div class="p-2 bg-yellow-100 rounded-lg flex-shrink-0">
                        <i data-lucide="message-square" class="w-4 h-4 text-yellow-600"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm text-gray-800 whitespace-pre-wrap break-words">${note.text}</p>
                        <p class="text-xs text-gray-500 mt-2">${dateStr} · ${adminName}</p>
                    </div>
                    <button 
                        class="delete-note-btn text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50 transition flex-shrink-0"
                        data-note='${noteJSON}'
                        title="Видалити нотатку">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Open cart details modal
 * @param {string} cartId - Cart document ID
 */
export function openCardDetails(cartId) {
    const cart = currentCarts.find(c => c.id === cartId);
    if (!cart) {
        showToast('❌ Картку не знайдено', 'error');
        return;
    }
    
    const modal = document.getElementById('crm-details-modal');
    const content = document.getElementById('crm-details-content');
    
    if (!modal || !content) {
        console.error('❌ Modal elements not found:', { modal: !!modal, content: !!content });
        return;
    }
    
    const customer = cart.customer || {};
    const name = customer.fullName || customer.name || 'Без імені';
    const phone = customer.phone || 'Немає телефону';
    const telegram = customer.telegram || 'Не вказано';
    const total = parseFloat(cart.total) || 0;
    const items = cart.items || [];
    
    // Extract payment method from multiple possible locations
    let paymentMethodRaw = '';
    let paymentMethodDisplay = 'Не обрано';
    
    // Try all possible data locations
    paymentMethodRaw = cart.paymentMethod || 
                      cart.payment_method || 
                      cart.payment || 
                      (cart.orderData && cart.orderData.payment) ||
                      (cart.formData && cart.formData.paymentMethod) ||
                      (cart.selectionData && cart.selectionData.payment) ||
                      (cart.paymentInfo && cart.paymentInfo.method) || '';
    
    // Map technical values to Ukrainian labels
    if (paymentMethodRaw) {
        const paymentMap = {
            'cod': 'Накладений платіж',
            'cash': 'Накладений платіж',
            'online': 'Оплата карткою',
            'card': 'Оплата карткою',
            'mono': 'Монобанк',
            'monobank': 'Монобанк',
            'liqpay': 'LiqPay'
        };
        
        // Check if it's a technical slug or already human-readable
        const lowerValue = paymentMethodRaw.toLowerCase().trim();
        paymentMethodDisplay = paymentMap[lowerValue] || paymentMethodRaw;
    }
    
    const hasPaymentMethod = paymentMethodDisplay !== 'Не обрано';
    
    // Format timestamp
    let createdDate = 'Невідомо';
    if (cart.created_at || cart.updated_at) {
        const timestamp = cart.created_at || cart.updated_at;
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        createdDate = `${day}.${month}.${year} о ${hours}:${minutes}`;
    }
    
    // Render items list
    const itemsHTML = items.map(item => `
        <div class="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
            <div class="flex-1">
                <p class="font-medium text-gray-900 text-sm">${item.name || 'Товар без назви'}</p>
                <p class="text-xs text-gray-500">Кількість: ${item.quantity || 1}</p>
            </div>
            <div class="text-right">
                <p class="font-semibold text-gray-900">${(parseFloat(item.price) * (item.quantity || 1)).toFixed(0)} ₴</p>
                <p class="text-xs text-gray-500">${parseFloat(item.price).toFixed(0)} ₴ × ${item.quantity || 1}</p>
            </div>
        </div>
    `).join('');
    
    content.innerHTML = `
        <!-- Customer Information -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h4 class="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <i data-lucide="user" class="w-5 h-5 text-blue-600"></i>
                <span>Інформація про клієнта</span>
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="text-xs text-gray-600 font-semibold">Ім'я</label>
                    <p class="text-sm text-gray-900 mt-1">${name}</p>
                </div>
                <div>
                    <label class="text-xs text-gray-600 font-semibold">Телефон</label>
                    <p class="text-sm text-gray-900 mt-1">${phone}</p>
                </div>
                <div>
                    <label class="text-xs text-gray-600 font-semibold">Telegram</label>
                    <p class="text-sm text-gray-900 mt-1">${telegram}</p>
                </div>
                <div>
                    <label class="text-xs text-gray-600 font-semibold">Створено</label>
                    <p class="text-sm text-gray-900 mt-1">${createdDate}</p>
                </div>
            </div>
            
            <!-- Payment Method -->
            <div class="mt-4 pt-4 border-t border-blue-200">
                <label class="text-xs text-gray-600 font-semibold">💳 Метод оплати</label>
                <p class="text-sm ${hasPaymentMethod ? 'text-gray-900 font-semibold' : 'text-gray-500 italic'} mt-1">${paymentMethodDisplay}</p>
            </div>
        </div>
        
        <!-- Cart Items -->
        <div class="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
            <h4 class="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <i data-lucide="shopping-bag" class="w-5 h-5 text-gray-600"></i>
                <span>Товари в кошику (${items.length})</span>
            </h4>
            <div class="bg-white rounded-lg p-4">
                ${itemsHTML || '<p class="text-sm text-gray-500 text-center py-4">Немає товарів</p>'}
            </div>
            <div class="mt-4 pt-4 border-t-2 border-gray-300 flex items-center justify-between">
                <span class="font-bold text-lg text-gray-900">Загальна сума:</span>
                <span class="font-bold text-2xl text-green-600">${total.toFixed(0)} ₴</span>
            </div>
        </div>
        
        <!-- CRM Notes Section -->
        <div class="bg-white border-2 border-yellow-300 rounded-lg p-6">
            <h4 class="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <i data-lucide="sticky-note" class="w-5 h-5 text-yellow-600"></i>
                <span>Нотатки адміністратора</span>
            </h4>
            
            <!-- Notes History -->
            <div id="notes-history-list" class="space-y-3 mb-4 max-h-64 overflow-y-auto">
                ${renderNotesHistory(cart.notes_history)}
            </div>
            
            <!-- Add New Note -->
            <div class="mt-4 pt-4 border-t border-gray-200">
                <label class="block text-sm font-semibold text-gray-700 mb-2">Додати нову нотатку</label>
                <textarea 
                    id="new-note-textarea"
                    rows="3"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-sm"
                    placeholder="Введіть коментар про цього клієнта або лід..."></textarea>
                <button 
                    onclick="window.crmModule.addNote('${cart.id}')"
                    id="add-note-btn"
                    class="mt-3 w-full px-4 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2">
                    <i data-lucide="plus-circle" class="w-4 h-4"></i>
                    <span>Додати нотатку</span>
                </button>
            </div>
        </div>
    `;
    
    // Store cartId for later use
    modal.dataset.cartId = cart.id;
    
    // Show modal
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    // Reinit Lucide icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
    
    // Attach delete note event listeners
    attachDeleteNoteListeners();
}

/**
 * Close card details modal
 */
export function closeCardDetails() {
    const modal = document.getElementById('crm-details-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

/**
 * Add new note to cart history using arrayUnion
 * @param {string} cartId - Cart document ID
 */
export async function addNote(cartId) {
    const textarea = document.getElementById('new-note-textarea');
    const button = document.getElementById('add-note-btn');
    
    if (!textarea) return;
    
    const noteText = textarea.value.trim();
    
    if (!noteText) {
        showToast('⚠️ Введіть текст нотатки', 'warning');
        return;
    }
    
    // Disable button during save
    if (button) {
        button.disabled = true;
        button.innerHTML = `
            <div class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
            <span>Збереження...</span>
        `;
    }
    
    try {
        const { doc, updateDoc, arrayUnion } = window.firebaseInit;
        const cartRef = doc(db, 'abandoned_carts', cartId);
        
        // Create new note object with client-side timestamp (ISO string)
        // Firebase does NOT support serverTimestamp() inside arrays
        const newNote = {
            text: noteText,
            time: new Date().toISOString(), // Client-side timestamp compatible with arrays
            admin: 'Admin' // TODO: Replace with actual admin name from auth
        };
        
        // Use arrayUnion to add note without overwriting existing notes
        await updateDoc(cartRef, {
            notes_history: arrayUnion(newNote)
        });
        
        // Update local cache
        const cart = currentCarts.find(c => c.id === cartId);
        if (cart) {
            if (!cart.notes_history) {
                cart.notes_history = [];
            }
            cart.notes_history.push({
                text: noteText,
                time: new Date().toISOString(), // Same format as saved to Firestore
                admin: 'Admin'
            });
        }
        
        // Clear textarea
        textarea.value = '';
        
        showToast('✅ Нотатку додано', 'success');
        
        // Refresh the notes list in the modal (keep modal open)
        const notesList = document.getElementById('notes-history-list');
        if (notesList && cart) {
            notesList.innerHTML = renderNotesHistory(cart.notes_history);
            if (window.lucide) {
                window.lucide.createIcons();
            }
        }
        
        // Update notes badge on the card (without re-rendering entire board)
        const cardElement = document.querySelector(`[data-cart-id="${cartId}"]`);
        if (cardElement && cart.notes_history) {
            const badgeContainer = cardElement.querySelector('.flex.items-center.gap-1.flex-wrap');
            if (badgeContainer) {
                // Remove old notes indicator if exists
                const oldIndicator = badgeContainer.querySelector('[title*="нотаток"]');
                if (oldIndicator) {
                    oldIndicator.remove();
                }
                
                // Add updated notes indicator
                const notesCount = cart.notes_history.length;
                if (notesCount > 0) {
                    const notesIndicator = document.createElement('div');
                    notesIndicator.className = 'flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded';
                    notesIndicator.title = `${notesCount} нотаток`;
                    notesIndicator.innerHTML = `
                        <i data-lucide="sticky-note" class="w-3 h-3"></i>
                        <span class="font-bold">${notesCount}</span>
                    `;
                    badgeContainer.appendChild(notesIndicator);
                    
                    if (window.lucide) {
                        window.lucide.createIcons();
                    }
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Error adding note:', error);
        showToast('❌ Помилка додавання нотатки: ' + error.message, 'error');
    } finally {
        // Re-enable button
        if (button) {
            button.disabled = false;
            button.innerHTML = `
                <i data-lucide="plus-circle" class="w-4 h-4"></i>
                <span>Додати нотатку</span>
            `;
            if (window.lucide) {
                window.lucide.createIcons();
            }
        }
    }
}

/**
 * Delete note from cart history using arrayRemove
 * @param {Event} event - Click event
 */
export async function deleteNote(event) {
    // Prevent event bubbling
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    try {
        // Get note data from button's data attribute
        const button = event.currentTarget;
        const noteJSON = button.getAttribute('data-note');
        
        if (!noteJSON) {
            console.error('❌ No note data found');
            return;
        }
        
        // Parse note from JSON
        const noteToDelete = JSON.parse(noteJSON);
        
        // Confirm deletion
        const confirmDelete = confirm(`Ви впевнені, що хочете видалити цю нотатку?\n\n"${noteToDelete.text}"`);
        if (!confirmDelete) {
            return;
        }
        
        // Get modal and cartId
        const modal = document.getElementById('crm-details-modal');
        const cartId = modal?.dataset.cartId;
        
        if (!cartId) {
            showToast('❌ Помилка: ID кошика не знайдено', 'error');
            return;
        }
        
        const { doc, updateDoc, arrayRemove } = window.firebaseInit;
        const cartRef = doc(db, 'abandoned_carts', cartId);
        
        // Use arrayRemove to delete the exact note object
        await updateDoc(cartRef, {
            notes_history: arrayRemove(noteToDelete)
        });
        
        console.log('✅ Note deleted:', noteToDelete);
        
        // Update local cache
        const cart = currentCarts.find(c => c.id === cartId);
        if (cart && cart.notes_history) {
            cart.notes_history = cart.notes_history.filter(note => 
                JSON.stringify(note) !== JSON.stringify(noteToDelete)
            );
        }
        
        showToast('✅ Нотатку видалено', 'success');
        
        // Refresh the notes list in the modal (keep modal open)
        const notesList = document.getElementById('notes-history-list');
        if (notesList && cart) {
            notesList.innerHTML = renderNotesHistory(cart.notes_history);
            if (window.lucide) {
                window.lucide.createIcons();
            }
            
            // Re-attach event listeners to new delete buttons
            attachDeleteNoteListeners();
        }
        
        // Update notes badge on the card (without re-rendering entire board)
        const cardElement = document.querySelector(`[data-cart-id="${cartId}"]`);
        if (cardElement && cart.notes_history) {
            const badgeContainer = cardElement.querySelector('.flex.items-center.gap-1.flex-wrap');
            if (badgeContainer) {
                // Remove old notes indicator if exists
                const oldIndicator = badgeContainer.querySelector('[title*="нотаток"]');
                if (oldIndicator) {
                    oldIndicator.remove();
                }
                
                // Add updated notes indicator (only if notes exist)
                const notesCount = cart.notes_history.length;
                if (notesCount > 0) {
                    const notesIndicator = document.createElement('div');
                    notesIndicator.className = 'flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded';
                    notesIndicator.title = `${notesCount} нотаток`;
                    notesIndicator.innerHTML = `
                        <i data-lucide="sticky-note" class="w-3 h-3"></i>
                        <span class="font-bold">${notesCount}</span>
                    `;
                    badgeContainer.appendChild(notesIndicator);
                    
                    if (window.lucide) {
                        window.lucide.createIcons();
                    }
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Error deleting note:', error);
        showToast('❌ Помилка видалення нотатки: ' + error.message, 'error');
    }
}

/**
 * Attach event listeners to delete note buttons
 */
function attachDeleteNoteListeners() {
    const deleteButtons = document.querySelectorAll('.delete-note-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', deleteNote);
    });
}

/**
 * Create order from details modal
 */
export function createOrderFromDetails() {
    const modal = document.getElementById('crm-details-modal');
    if (modal && modal.dataset.cartId) {
        // Close details modal
        closeCardDetails();
        // Open order confirmation
        createOrderFromCart(modal.dataset.cartId);
    }
}

/**
 * Create order from cart
 * @param {string} cartId - Cart document ID
 */
/**
 * Show order confirmation modal
 * @param {string} cartId - Cart document ID
 */
export async function createOrderFromCart(cartId) {
    const cart = currentCarts.find(c => c.id === cartId);
    if (!cart) {
        showToast('❌ Кошик не знайдено', 'error');
        return;
    }
    
    // Show confirmation modal
    showOrderConfirmationModal(cart);
}

/**
 * Show order confirmation modal with cart details
 * @param {Object} cart - Cart object
 */
function showOrderConfirmationModal(cart) {
    const modal = document.getElementById('order-confirmation-modal');
    const content = document.getElementById('order-confirmation-content');
    
    if (!modal || !content) return;
    
    const customer = cart.customer || {};
    const name = customer.fullName || customer.name || 'Без імені';
    const phone = customer.phone || 'Немає телефону';
    const telegram = customer.telegram || 'Не вказано';
    const total = parseFloat(cart.total) || 0;
    const items = cart.items || [];
    const itemCount = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    
    content.innerHTML = `
        <div class="space-y-4">
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p class="text-sm text-gray-700 mb-3">
                    Ви впевнені, що хочете перетворити цей покинутий кошик на реальне замовлення для клієнта <strong>${name}</strong>?
                </p>
                <div class="space-y-2 text-sm">
                    <div class="flex items-center gap-2">
                        <i data-lucide="user" class="w-4 h-4 text-gray-600"></i>
                        <span class="text-gray-700"><strong>Клієнт:</strong> ${name}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <i data-lucide="phone" class="w-4 h-4 text-gray-600"></i>
                        <span class="text-gray-700"><strong>Телефон:</strong> ${phone}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <i data-lucide="send" class="w-4 h-4 text-gray-600"></i>
                        <span class="text-gray-700"><strong>Telegram:</strong> ${telegram}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <i data-lucide="shopping-bag" class="w-4 h-4 text-gray-600"></i>
                        <span class="text-gray-700"><strong>Товарів:</strong> ${itemCount} шт.</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <i data-lucide="dollar-sign" class="w-4 h-4 text-gray-600"></i>
                        <span class="text-gray-700"><strong>Сума:</strong> ${total.toFixed(0)} ₴</span>
                    </div>
                </div>
            </div>
            
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div class="flex items-start gap-2">
                    <i data-lucide="alert-triangle" class="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0"></i>
                    <p class="text-xs text-yellow-800">
                        <strong>Увага!</strong> Після створення замовлення, картка буде видалена з CRM дошки, а замовлення з'явиться на головній Kanban-дошці.
                    </p>
                </div>
            </div>
        </div>
    `;
    
    // Store cartId for confirmation
    modal.dataset.cartId = cart.id;
    
    // Show modal
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    // Reinit Lucide icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

/**
 * Close order confirmation modal
 */
export function closeOrderConfirmation() {
    const modal = document.getElementById('order-confirmation-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

/**
 * Confirm and create order from cart
 */
export async function confirmCreateOrder() {
    const modal = document.getElementById('order-confirmation-modal');
    const confirmBtn = document.getElementById('confirm-order-btn');
    const cancelBtn = document.getElementById('cancel-order-btn');
    
    if (!modal) return;
    
    const cartId = modal.dataset.cartId;
    if (!cartId) {
        showToast('❌ ID кошика не знайдено', 'error');
        return;
    }
    
    // Disable buttons during processing
    confirmBtn.disabled = true;
    cancelBtn.disabled = true;
    confirmBtn.innerHTML = `
        <div class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
        <span>Створення...</span>
    `;
    
    try {
        const { collection, doc, addDoc, deleteDoc, serverTimestamp, getDoc: firestoreGetDoc } = window.firebaseInit;
        
        // Get cart data
        const cart = currentCarts.find(c => c.id === cartId);
        if (!cart) {
            throw new Error('Кошик не знайдено в локальному кеші');
        }
        
        // Calculate correct totals
        const items = (cart.items || []).map(item => ({
            ...item,
            price: parseFloat(item.price) || 0,
            quantity: parseInt(item.quantity) || 1
        }));
        
        const calculatedSubtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const finalTotal = calculatedSubtotal;
        
        // Prepare order data
        const orderData = {
            customer: cart.customer || {},
            items: items,
            total: finalTotal,
            totalAmount: finalTotal,
            payment: {
                method: cart.payment_method || cart.payment?.method || 'not_selected',
                status: 'pending'
            },
            delivery: cart.delivery || {},
            status: 'new',
            viewed: false,
            isViewed: false,
            isArchived: false,
            archived: false,
            summary: {
                itemCount: items.length,
                totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
                subtotal: calculatedSubtotal,
                total: finalTotal,
                totalAmount: finalTotal,
                discountAmount: 0,
                deliveryFee: 0
            },
            source: 'crm_kanban',
            crm_converted: true,
            crm_column: cart.crm_status || 'unknown',
            original_cart_id: cartId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            created_at: serverTimestamp(),
            updated_at: serverTimestamp()
        };
        
        // 1. Create order in Firestore
        const ordersRef = collection(db, 'orders');
        const orderDoc = await addDoc(ordersRef, orderData);
        console.log('✅ Order created:', orderDoc.id);
        
        // 1.5. Sync customer profile (prevents duplicates using phone as unique ID)
        if (window.syncCustomerFromOrder && typeof window.syncCustomerFromOrder === 'function') {
            try {
                const customerSyncResult = await window.syncCustomerFromOrder(orderData, orderDoc.id);
                console.log('👤 Customer sync result:', customerSyncResult);
            } catch (syncError) {
                console.warn('⚠️ Customer sync warning (non-critical):', syncError);
                // Don't fail the order creation if customer sync fails
            }
        } else {
            console.warn('⚠️ syncCustomerFromOrder not available');
        }
        
        // 2. Fetch CRM automation settings
        let targetSuccessColumnId = null;
        let targetSuccessColumnName = null;
        let shouldMoveCard = false;
        
        try {
            const settingsRef = doc(db, 'settings', 'crm_automation');
            const settingsSnap = await firestoreGetDoc(settingsRef);
            
            if (settingsSnap.exists()) {
                const settings = settingsSnap.data();
                targetSuccessColumnId = settings.targetSuccessColumn;
                
                if (targetSuccessColumnId) {
                    // Find the column name for UI message
                    const targetColumn = currentColumns.find(c => c.id === targetSuccessColumnId);
                    
                    if (targetColumn) {
                        targetSuccessColumnName = targetColumn.name;
                        shouldMoveCard = true;
                        console.log(`🎯 Target success column found: ${targetSuccessColumnName} (${targetSuccessColumnId})`);
                    } else {
                        console.warn(`⚠️ Target column ${targetSuccessColumnId} not found in current columns`);
                    }
                } else {
                    console.log('ℹ️ No target success column configured - card will be deleted');
                }
            } else {
                console.log('ℹ️ No CRM automation settings found - card will be deleted');
            }
        } catch (settingsError) {
            console.warn('⚠️ Error loading CRM settings:', settingsError);
            // Continue without moving card
        }
        
        // 3. Execute automation based on settings
        if (shouldMoveCard) {
            try {
                // Move card to success column (this will update last_status and previousStatusName)
                console.log(`🔄 Moving cart ${cartId} from ${cart.crm_status} to ${targetSuccessColumnId}...`);
                await updateCartStatus(cartId, targetSuccessColumnId);
                
                // Wait for the move to be processed and synced
                await new Promise(resolve => setTimeout(resolve, 800));
                
                console.log('✅ Cart successfully moved to success column');
                
                // Close modal
                closeOrderConfirmation();
                
                // Show success message with column name
                showToast(`✅ Замовлення створено, картку переміщено в «${targetSuccessColumnName}»`, 'success');
                
                // Board will auto-refresh via onSnapshot listener
                
            } catch (moveError) {
                console.error('❌ Error moving card to success column:', moveError);
                
                // Fallback: delete the card if move fails
                const cartRef = doc(db, 'abandoned_carts', cartId);
                await deleteDoc(cartRef);
                console.log('⚠️ Card deleted after failed move');
                
                closeOrderConfirmation();
                showToast('✅ Замовлення створено (картку видалено через помилку переміщення)', 'warning');
            }
        } else {
            // No automation configured - delete card as before
            const cartRef = doc(db, 'abandoned_carts', cartId);
            await deleteDoc(cartRef);
            console.log('✅ Cart deleted (no target column configured)');
            
            closeOrderConfirmation();
            showToast('✅ Замовлення успішно створено!', 'success');
        }
        
    } catch (error) {
        console.error('❌ Error creating order:', error);
        showToast('❌ Помилка створення замовлення: ' + error.message, 'error');
        
        // Re-enable buttons
        confirmBtn.disabled = false;
        cancelBtn.disabled = false;
        confirmBtn.innerHTML = `
            <i data-lucide="check-circle" class="w-4 h-4"></i>
            <span>Так, створити</span>
        `;
        
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
}

/**
 * Send SMS to cart customer
 * @param {string} cartId - Cart document ID
 */
export function sendSMS(cartId) {
    const cart = currentCarts.find(c => c.id === cartId);
    if (!cart) {
        showToast('❌ Кошик не знайдено', 'error');
        return;
    }
    
    // Use existing SMS function if available
    if (typeof window.openSmsModal === 'function') {
        window.openSmsModal(cart);
    } else {
        showToast('ℹ️ Відправка SMS - в розробці', 'info');
    }
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type: success, error, warning, info
 */
function showToast(message, type = 'info') {
    if (typeof window.showToast === 'function') {
        window.showToast(message, type);
    } else {
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

// ============================================
// COLUMN MANAGEMENT FUNCTIONS
// ============================================

/**
 * Add a new column
 * @returns {Promise<void>}
 */
export async function addNewColumn() {
    if (!db) return;
    
    try {
        const { collection, addDoc, serverTimestamp } = window.firebaseInit;
        
        // Generate random color
        const colors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#ec4899'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
        // Get max order
        const maxOrder = currentColumns.length > 0 
            ? Math.max(...currentColumns.map(c => c.order || 0)) 
            : -1;
        
        // Create new column
        const newColumn = {
            name: 'Нова колонка',
            description: '',
            color: randomColor,
            order: maxOrder + 1,
            statusType: 'neutral',
            created_at: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, 'crm_columns'), newColumn);
        
        console.log('✅ Column created:', docRef.id);
        showToast('✅ Колонку створено', 'success');
        
        // Refresh board
        await renderCrmBoard();
        
    } catch (error) {
        console.error('❌ Error creating column:', error);
        showToast('❌ Помилка створення колонки: ' + error.message, 'error');
    }
}

/**
 * Save column name (inline editing)
 * @param {HTMLInputElement} input - Input element
 * @returns {Promise<void>}
 */
export async function saveColumnName(input) {
    if (!db || isEditingColumn) return;
    
    const columnId = input.dataset.columnId;
    const newName = input.value.trim();
    
    if (!newName) {
        showToast('⚠️ Назва колонки не може бути порожньою', 'warning');
        // Restore original value
        const column = currentColumns.find(c => c.id === columnId);
        if (column) {
            input.value = column.name;
        }
        return;
    }
    
    // Check if name actually changed
    const column = currentColumns.find(c => c.id === columnId);
    if (column && column.name === newName) {
        return; // No changes
    }
    
    try {
        isEditingColumn = true;
        const { doc, updateDoc } = window.firebaseInit;
        const columnRef = doc(db, 'crm_columns', columnId);
        
        await updateDoc(columnRef, {
            name: newName
        });
        
        // Update local cache
        if (column) {
            column.name = newName;
        }
        
        showToast('✅ Назву оновлено', 'success');
        
    } catch (error) {
        console.error('❌ Error updating column name:', error);
        showToast('❌ Помилка оновлення: ' + error.message, 'error');
        
        // Restore original value
        if (column) {
            input.value = column.name;
        }
    } finally {
        isEditingColumn = false;
    }
}

/**
 * Save column field (description, color, etc.)
 * @param {HTMLElement} element - Input/textarea element
 * @returns {Promise<void>}
 */
export async function saveColumnField(element) {
    if (!db || isEditingColumn) return;
    
    const columnId = element.dataset.columnId;
    const field = element.dataset.field;
    const newValue = element.value.trim();
    
    // Check if value actually changed
    const column = currentColumns.find(c => c.id === columnId);
    if (column && column[field] === newValue) {
        return; // No changes
    }
    
    try {
        isEditingColumn = true;
        const { doc, updateDoc } = window.firebaseInit;
        const columnRef = doc(db, 'crm_columns', columnId);
        
        await updateDoc(columnRef, {
            [field]: newValue
        });
        
        // Update local cache
        if (column) {
            column[field] = newValue;
        }
        
        console.log(`✅ ${field} updated for column ${columnId}`);
        
    } catch (error) {
        console.error(`❌ Error updating ${field}:`, error);
        showToast('❌ Помилка оновлення: ' + error.message, 'error');
        
        // Restore original value
        if (column) {
            element.value = column[field] || '';
        }
    } finally {
        isEditingColumn = false;
    }
}

/**
 * Delete a column
 * @param {string} columnId - Column ID to delete
 * @returns {Promise<void>}
 */
export async function deleteColumn(columnId) {
    if (!db) return;
    
    // Check if column has cards
    const cardsInColumn = currentCarts.filter(cart => cart.crm_status === columnId);
    
    if (cardsInColumn.length > 0) {
        const confirmed = confirm(
            `⚠️ У цій колонці ${cardsInColumn.length} карток.\n\n` +
            `Видалення колонки не видалить картки, але вони втратять свій статус.\n\n` +
            `Продовжити?`
        );
        if (!confirmed) return;
    } else {
        const confirmed = confirm('Ви впевнені, що хочете видалити цю колонку?');
        if (!confirmed) return;
    }
    
    try {
        const { doc, deleteDoc } = window.firebaseInit;
        const columnRef = doc(db, 'crm_columns', columnId);
        
        await deleteDoc(columnRef);
        
        console.log('✅ Column deleted:', columnId);
        showToast('✅ Колонку видалено', 'success');
        
        // Refresh board
        await renderCrmBoard();
        
    } catch (error) {
        console.error('❌ Error deleting column:', error);
        showToast('❌ Помилка видалення колонки: ' + error.message, 'error');
    }
}

/**
 * Count carts by status for debugging
 * @param {Array} carts - Array of cart objects
 * @returns {Object} Object with status counts
 */
function countCartsByStatus(carts) {
    const statusCounts = {};
    carts.forEach(cart => {
        const status = cart.crm_status || 'undefined';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    return statusCounts;
}

/**
 * Migration function: Add crm_status to all carts without it
 * @returns {Promise<void>}
 */
export async function migrateCartsWithoutStatus() {
    if (!db) {
        showToast('❌ Firebase не ініціалізовано', 'error');
        return;
    }
    
    const confirmed = confirm(
        '🔄 Міграція даних\n\n' +
        'Ця операція додасть поле crm_status: "new_lead" до всіх кошиків, які не мають цього поля.\n\n' +
        'Це безпечна операція, яка не видаляє дані.\n\n' +
        'Продовжити?'
    );
    
    if (!confirmed) return;
    
    try {
        const { collection, getDocs, doc, updateDoc, serverTimestamp } = window.firebaseInit;
        
        console.log('🚀 Starting migration...');
        showToast('🔄 Починаю міграцію...', 'info');
        
        // Get ALL abandoned carts
        const cartsRef = collection(db, 'abandoned_carts');
        const snapshot = await getDocs(cartsRef);
        
        console.log(`📦 Total carts in database: ${snapshot.docs.length}`);
        
        // Find carts without crm_status
        const cartsToMigrate = [];
        snapshot.docs.forEach(docSnap => {
            const data = docSnap.data();
            if (!data.crm_status) {
                cartsToMigrate.push({
                    id: docSnap.id,
                    data: data
                });
            }
        });
        
        console.log(`🔍 Carts without crm_status: ${cartsToMigrate.length}`);
        
        if (cartsToMigrate.length === 0) {
            showToast('✅ Всі кошики вже мають crm_status', 'success');
            console.log('✅ No migration needed - all carts have crm_status');
            return;
        }
        
        // Update each cart
        let successCount = 0;
        let errorCount = 0;
        
        for (const cart of cartsToMigrate) {
            try {
                const cartRef = doc(db, 'abandoned_carts', cart.id);
                await updateDoc(cartRef, {
                    crm_status: 'new_lead',
                    updated_at: serverTimestamp()
                });
                
                console.log(`✅ Migrated cart ${cart.id}`);
                successCount++;
                
            } catch (error) {
                console.error(`❌ Failed to migrate cart ${cart.id}:`, error);
                errorCount++;
            }
        }
        
        // Show results
        const message = `✅ Міграція завершена!\n\nОновлено: ${successCount}\nПомилки: ${errorCount}`;
        console.log(`🎉 Migration complete: ${successCount} success, ${errorCount} errors`);
        showToast(message, 'success');
        
        // Refresh board to show newly visible carts
        await renderCrmBoard();
        
    } catch (error) {
        console.error('❌ Migration error:', error);
        showToast('❌ Помилка міграції: ' + error.message, 'error');
    }
}

// ============================================
// AUTOMATION SYSTEM
// ============================================

let automationTimer = null;

/**
 * Open automation settings modal
 * @returns {Promise<void>}
 */
export async function openAutomationSettings() {
    if (!db) {
        showToast('❌ Firebase не ініціалізовано', 'error');
        return;
    }
    
    console.log('⚙️ Opening automation settings...');
    
    try {
        // Load current settings
        const { doc: firestoreDoc, getDoc } = window.firebaseInit;
        const settingsRef = firestoreDoc(db, 'settings', 'crm_automation');
        const settingsSnap = await getDoc(settingsRef);
        
        const currentSettings = settingsSnap.exists() ? settingsSnap.data() : {
            initialDelay: { value: 5, unit: 'minutes', targetColumn: 'new_lead' },
            transitionRules: []
        };
        
        // Create modal HTML
        const modalHTML = createAutomationModal(currentSettings);
        
        // Inject modal into page
        const existingModal = document.getElementById('crm-automation-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Initialize Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
        
        // Set up event listeners
        setupAutomationModalListeners(currentSettings);
        
    } catch (error) {
        console.error('❌ Error opening automation settings:', error);
        showToast('❌ Помилка завантаження налаштувань', 'error');
    }
}

/**
 * Create automation modal HTML
 * @param {Object} settings - Current automation settings
 * @returns {string} Modal HTML
 */
function createAutomationModal(settings) {
    const columnOptions = currentColumns.map(col => 
        `<option value="${col.id}">${col.name}</option>`
    ).join('');
    
    const transitionRulesHTML = settings.transitionRules.map((rule, index) => 
        createTransitionRuleHTML(rule, index, columnOptions)
    ).join('');
    
    return `
        <div id="crm-automation-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div class="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                <!-- Header -->
                <div class="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <i data-lucide="bot" class="w-8 h-8"></i>
                            <div>
                                <h2 class="text-2xl font-bold">🤖 Автоматизація CRM</h2>
                                <p class="text-purple-100 text-sm">Налаштуйте автоматичне переміщення карток</p>
                            </div>
                        </div>
                        <button onclick="window.crmModule.closeAutomationModal()" class="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition">
                            <i data-lucide="x" class="w-6 h-6"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Content -->
                <div class="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    
                    <!-- Initial Capture -->
                    <div class="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                        <div class="flex items-start gap-3 mb-4">
                            <i data-lucide="clock" class="w-6 h-6 text-blue-600 flex-shrink-0 mt-1"></i>
                            <div class="flex-1">
                                <h3 class="text-lg font-bold text-gray-900 mb-1">Початкове захоплення</h3>
                                <p class="text-sm text-gray-600">Затримка перед появою нового покинутого кошика в CRM</p>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Затримка</label>
                                <input type="number" id="initial-delay-value" 
                                    value="${settings.initialDelay.value}" 
                                    min="1" 
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Одиниця</label>
                                <select id="initial-delay-unit" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                    <option value="minutes" ${settings.initialDelay.unit === 'minutes' ? 'selected' : ''}>Хвилин</option>
                                    <option value="hours" ${settings.initialDelay.unit === 'hours' ? 'selected' : ''}>Годин</option>
                                    <option value="days" ${settings.initialDelay.unit === 'days' ? 'selected' : ''}>Днів</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Цільова колонка</label>
                                <select id="initial-target-column" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                    ${currentColumns.map(col => 
                                        `<option value="${col.id}" ${settings.initialDelay.targetColumn === col.id ? 'selected' : ''}>${col.name}</option>`
                                    ).join('')}
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Success Column After Order Creation -->
                    <div class="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
                        <div class="flex items-start gap-3 mb-4">
                            <i data-lucide="check-circle" class="w-6 h-6 text-green-600 flex-shrink-0 mt-1"></i>
                            <div class="flex-1">
                                <h3 class="text-lg font-bold text-gray-900 mb-1">Статус після успішного замовлення</h3>
                                <p class="text-sm text-gray-600">Коли картка перетворюється на реальне замовлення, автоматично перемістити її в цю колонку</p>
                            </div>
                        </div>
                        
                        <div class="space-y-3">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">
                                    <i data-lucide="target" class="w-4 h-4 inline-block mr-1"></i>
                                    Цільова колонка успіху
                                </label>
                                <select id="target-success-column" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                                    <option value="">— Не переміщувати (залишити в поточній) —</option>
                                    ${currentColumns.map(col => {
                                        const isSuccess = col.statusType === 'success';
                                        return `<option value="${col.id}" ${settings.targetSuccessColumn === col.id ? 'selected' : ''}>
                                            ${isSuccess ? '✅ ' : ''}${col.name}${isSuccess ? ' (Успіх)' : ''}
                                        </option>`;
                                    }).join('')}
                                </select>
                            </div>
                            <div class="bg-white border border-green-200 rounded-lg p-3">
                                <div class="flex items-start gap-2">
                                    <i data-lucide="info" class="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0"></i>
                                    <p class="text-xs text-gray-600">
                                        <strong>Порада:</strong> Оберіть колонку з типом «Успіх», щоб автоматично відстежувати конверсії в аналітиці.
                                        Якщо не обрано, картка залишиться в поточній колонці.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Transition Rules -->
                    <div class="bg-purple-50 border border-purple-200 rounded-xl p-6">
                        <div class="flex items-start justify-between mb-4">
                            <div class="flex items-start gap-3">
                                <i data-lucide="shuffle" class="w-6 h-6 text-purple-600 flex-shrink-0 mt-1"></i>
                                <div class="flex-1">
                                    <h3 class="text-lg font-bold text-gray-900 mb-1">Правила переходів</h3>
                                    <p class="text-sm text-gray-600">Автоматично переміщуйте картки між колонками</p>
                                </div>
                            </div>
                            <button onclick="window.crmModule.addTransitionRule()" 
                                class="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition">
                                <i data-lucide="plus" class="w-4 h-4"></i>
                                <span>Додати правило</span>
                            </button>
                        </div>
                        
                        <div id="transition-rules-container" class="space-y-4">
                            ${transitionRulesHTML || '<p class="text-center text-gray-500 py-8">Правила відсутні. Натисніть "Додати правило" щоб створити.</p>'}
                        </div>
                    </div>
                    
                </div>
                
                <!-- Footer -->
                <div class="border-t border-gray-200 p-6 bg-gray-50 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <button onclick="window.crmModule.testAutomation()" 
                            class="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition">
                            <i data-lucide="play" class="w-4 h-4"></i>
                            <span>Тестувати</span>
                        </button>
                    </div>
                    <div class="flex items-center gap-3">
                        <button onclick="window.crmModule.closeAutomationModal()" 
                            class="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition">
                            Скасувати
                        </button>
                        <button onclick="window.crmModule.saveAutomationSettings()" 
                            class="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition">
                            💾 Зберегти
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Create transition rule HTML
 * @param {Object} rule - Rule object
 * @param {number} index - Rule index
 * @param {string} columnOptions - HTML options for columns
 * @returns {string} Rule HTML
 */
function createTransitionRuleHTML(rule, index, columnOptions) {
    return `
        <div class="bg-white border border-purple-200 rounded-lg p-4" data-rule-index="${index}">
            <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-2">
                    <span class="flex items-center justify-center w-6 h-6 bg-purple-100 text-purple-700 rounded-full text-sm font-bold">${index + 1}</span>
                    <span class="text-sm font-semibold text-gray-700">Правило переходу</span>
                </div>
                <button onclick="window.crmModule.removeTransitionRule(${index})" 
                    class="p-1 hover:bg-red-100 rounded transition" 
                    title="Видалити правило">
                    <i data-lucide="trash-2" class="w-4 h-4 text-red-600"></i>
                </button>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                    <label class="block text-xs font-semibold text-gray-600 mb-1">Зі статусу</label>
                    <select class="rule-from-status w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                        ${currentColumns.map(col => 
                            `<option value="${col.id}" ${rule.fromStatus === col.id ? 'selected' : ''}>${col.name}</option>`
                        ).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-gray-600 mb-1">До статусу</label>
                    <select class="rule-to-status w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                        ${currentColumns.map(col => 
                            `<option value="${col.id}" ${rule.toStatus === col.id ? 'selected' : ''}>${col.name}</option>`
                        ).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-gray-600 mb-1">Час очікування</label>
                    <input type="number" 
                        class="rule-wait-value w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" 
                        value="${rule.waitTime.value}" 
                        min="1">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-gray-600 mb-1">Одиниця</label>
                    <select class="rule-wait-unit w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                        <option value="minutes" ${rule.waitTime.unit === 'minutes' ? 'selected' : ''}>Хвилин</option>
                        <option value="hours" ${rule.waitTime.unit === 'hours' ? 'selected' : ''}>Годин</option>
                        <option value="days" ${rule.waitTime.unit === 'days' ? 'selected' : ''}>Днів</option>
                    </select>
                </div>
            </div>
        </div>
    `;
}

/**
 * Setup modal event listeners
 * @param {Object} settings - Current settings
 */
function setupAutomationModalListeners(settings) {
    // Close on overlay click
    const modal = document.getElementById('crm-automation-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeAutomationModal();
            }
        });
    }
}

/**
 * Add new transition rule
 */
export function addTransitionRule() {
    const container = document.getElementById('transition-rules-container');
    if (!container) return;
    
    // Remove "no rules" message if present
    const noRulesMsg = container.querySelector('p');
    if (noRulesMsg) {
        noRulesMsg.remove();
    }
    
    const currentRules = container.querySelectorAll('[data-rule-index]');
    const newIndex = currentRules.length;
    
    const columnOptions = currentColumns.map(col => 
        `<option value="${col.id}">${col.name}</option>`
    ).join('');
    
    const newRule = {
        fromStatus: currentColumns[0]?.id || '',
        toStatus: currentColumns[1]?.id || currentColumns[0]?.id || '',
        waitTime: { value: 1, unit: 'hours' }
    };
    
    const ruleHTML = createTransitionRuleHTML(newRule, newIndex, columnOptions);
    container.insertAdjacentHTML('beforeend', ruleHTML);
    
    // Reinit icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

/**
 * Remove transition rule
 * @param {number} index - Rule index to remove
 */
export function removeTransitionRule(index) {
    const container = document.getElementById('transition-rules-container');
    if (!container) return;
    
    const rule = container.querySelector(`[data-rule-index="${index}"]`);
    if (rule) {
        rule.remove();
        
        // Re-index remaining rules
        const remainingRules = container.querySelectorAll('[data-rule-index]');
        remainingRules.forEach((ruleEl, idx) => {
            ruleEl.setAttribute('data-rule-index', idx);
            const numberSpan = ruleEl.querySelector('.w-6.h-6');
            if (numberSpan) {
                numberSpan.textContent = idx + 1;
            }
            
            // Update remove button
            const removeBtn = ruleEl.querySelector('button[onclick^="window.crmModule.removeTransitionRule"]');
            if (removeBtn) {
                removeBtn.setAttribute('onclick', `window.crmModule.removeTransitionRule(${idx})`);
            }
        });
        
        // Show "no rules" message if empty
        if (remainingRules.length === 0) {
            container.innerHTML = '<p class="text-center text-gray-500 py-8">Правила відсутні. Натисніть "Додати правило" щоб створити.</p>';
        }
    }
}

/**
 * Save automation settings
 * @returns {Promise<void>}
 */
export async function saveAutomationSettings() {
    if (!db) return;
    
    try {
        const { doc: firestoreDoc, setDoc, serverTimestamp } = window.firebaseInit;
        
        // Collect initial delay settings
        const initialDelay = {
            value: parseInt(document.getElementById('initial-delay-value').value) || 5,
            unit: document.getElementById('initial-delay-unit').value,
            targetColumn: document.getElementById('initial-target-column').value
        };
        
        // Get target success column
        const targetSuccessColumn = document.getElementById('target-success-column')?.value || null;
        
        // Collect transition rules
        const container = document.getElementById('transition-rules-container');
        const ruleElements = container.querySelectorAll('[data-rule-index]');
        
        const transitionRules = Array.from(ruleElements).map(ruleEl => {
            return {
                fromStatus: ruleEl.querySelector('.rule-from-status').value,
                toStatus: ruleEl.querySelector('.rule-to-status').value,
                waitTime: {
                    value: parseInt(ruleEl.querySelector('.rule-wait-value').value) || 1,
                    unit: ruleEl.querySelector('.rule-wait-unit').value
                }
            };
        });
        
        // Save to Firestore
        const settingsRef = firestoreDoc(db, 'settings', 'crm_automation');
        await setDoc(settingsRef, {
            initialDelay,
            targetSuccessColumn,
            transitionRules,
            enabled: true,
            updated_at: serverTimestamp()
        });
        
        console.log('✅ Automation settings saved:', { initialDelay, targetSuccessColumn, transitionRules });
        showToast('✅ Налаштування збережено', 'success');
        
        closeAutomationModal();
        
        // Start automation if not already running
        startAutomationTimer();
        
    } catch (error) {
        console.error('❌ Error saving automation settings:', error);
        showToast('❌ Помилка збереження: ' + error.message, 'error');
    }
}

/**
 * Close automation modal
 */
export function closeAutomationModal() {
    const modal = document.getElementById('crm-automation-modal');
    if (modal) {
        modal.remove();
    }
}

// ============================================
// MANUAL TRANSFER TO CRM
// ============================================

/**
 * Open modal to manually transfer abandoned cart to CRM
 * @param {string} cartId - Cart document ID (usually phone number)
 * @returns {Promise<void>}
 */
export async function openManualTransferModal(cartId) {
    if (!db) {
        showToast('❌ Firebase не ініціалізовано', 'error');
        return;
    }
    
    console.log('👤 Opening manual transfer for cart:', cartId);
    
    // Create modal HTML
    const columnsOptions = currentColumns.map(col => 
        `<option value="${col.id}">${col.name}</option>`
    ).join('');
    
    const modalHTML = `
        <div id="manual-transfer-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full">
                <!-- Header -->
                <div class="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6 rounded-t-2xl">
                    <div class="flex items-center gap-3">
                        <i data-lucide="send" class="w-8 h-8"></i>
                        <div>
                            <h2 class="text-2xl font-bold">Передати в CRM</h2>
                            <p class="text-green-100 text-sm">Оберіть етап воронки продажів</p>
                        </div>
                    </div>
                </div>
                
                <!-- Content -->
                <div class="p-6">
                    <div class="mb-6">
                        <label class="block text-sm font-semibold text-gray-700 mb-3">
                            Колонка Kanban
                        </label>
                        <select id="transfer-column-select" class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-base">
                            ${columnsOptions}
                        </select>
                    </div>
                    
                    <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                        <div class="flex items-start gap-3">
                            <i data-lucide="info" class="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"></i>
                            <div class="text-sm text-green-800">
                                <p class="font-semibold mb-1">Миттєвий перенос</p>
                                <p>Кошик з'явиться в CRM негайно, незалежно від налаштувань автоматизації.</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Footer -->
                <div class="border-t border-gray-200 p-6 bg-gray-50 rounded-b-2xl flex items-center justify-end gap-3">
                    <button onclick="window.crmModule.closeManualTransferModal()" 
                        class="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition">
                        Скасувати
                    </button>
                    <button onclick="window.crmModule.confirmManualTransfer('${cartId}')" 
                        class="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition">
                        ✅ Передати
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Inject modal
    const existingModal = document.getElementById('manual-transfer-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Initialize icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
    
    // Close on overlay click
    const modal = document.getElementById('manual-transfer-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeManualTransferModal();
            }
        });
    }
}

/**
 * Close manual transfer modal
 */
export function closeManualTransferModal() {
    const modal = document.getElementById('manual-transfer-modal');
    if (modal) {
        modal.remove();
    }
}

/**
 * Confirm manual transfer of cart to CRM
 * @param {string} cartId - Cart document ID
 * @returns {Promise<void>}
 */
export async function confirmManualTransfer(cartId) {
    if (!db) return;
    
    try {
        const selectedColumn = document.getElementById('transfer-column-select')?.value;
        
        if (!selectedColumn) {
            showToast('❌ Оберіть колонку', 'error');
            return;
        }
        
        const { doc: firestoreDoc, updateDoc, serverTimestamp } = window.firebaseInit;
        
        console.log(`👤 Manually transferring cart ${cartId} to column ${selectedColumn}`);
        
        // Update cart in Firestore
        const cartRef = firestoreDoc(db, 'abandoned_carts', cartId);
        await updateDoc(cartRef, {
            crm_status: selectedColumn,
            manually_transferred: true,
            transferred_at: serverTimestamp(),
            updated_at: serverTimestamp()
        });
        
        console.log('✅ Cart transferred successfully');
        showToast('✅ Кошик переданий в CRM', 'success');
        
        closeManualTransferModal();
        
        // Board will update automatically via onSnapshot
        
    } catch (error) {
        console.error('❌ Error transferring cart:', error);
        showToast('❌ Помилка переносу: ' + error.message, 'error');
    }
}

/**
 * Run CRM automation
 * @returns {Promise<void>}
 */
export async function runCrmAutomation() {
    if (!db) return;
    
    try {
        const { doc: firestoreDoc, getDoc, updateDoc, serverTimestamp } = window.firebaseInit;
        
        // Load automation settings
        const settingsRef = firestoreDoc(db, 'settings', 'crm_automation');
        const settingsSnap = await getDoc(settingsRef);
        
        if (!settingsSnap.exists() || !settingsSnap.data().enabled) {
            console.log('ℹ️ Automation is disabled or not configured');
            return;
        }
        
        const settings = settingsSnap.data();
        const now = new Date();
        
        console.log('🤖 Running CRM automation...', settings);
        
        let updatedCount = 0;
        
        // Process each cart
        for (const cart of currentCarts) {
            // Skip if no updated_at
            if (!cart.updated_at) continue;
            
            const updatedAt = cart.updated_at.toDate ? cart.updated_at.toDate() : new Date(cart.updated_at);
            const diffMs = now - updatedAt;
            
            // Check transition rules
            for (const rule of settings.transitionRules) {
                // Check if cart matches "fromStatus"
                if (cart.crm_status !== rule.fromStatus) continue;
                
                // Calculate wait time in milliseconds
                const waitMs = convertToMs(rule.waitTime.value, rule.waitTime.unit);
                
                // Check if enough time has passed
                if (diffMs >= waitMs) {
                    console.log(`🔄 Auto-moving cart ${cart.id} from "${rule.fromStatus}" to "${rule.toStatus}"`);
                    
                    // Update cart status
                    const cartRef = firestoreDoc(db, 'abandoned_carts', cart.id);
                    await updateDoc(cartRef, {
                        crm_status: rule.toStatus,
                        updated_at: serverTimestamp(),
                        auto_updated: true,
                        auto_update_reason: `Auto-moved after ${rule.waitTime.value} ${rule.waitTime.unit}`
                    });
                    
                    updatedCount++;
                    break; // Only apply first matching rule
                }
            }
        }
        
        if (updatedCount > 0) {
            console.log(`✅ Automation complete: ${updatedCount} carts updated`);
            showToast(`🤖 Автоматично оновлено ${updatedCount} карток`, 'info');
        } else {
            console.log('ℹ️ No carts needed automation');
        }
        
    } catch (error) {
        console.error('❌ Automation error:', error);
    }
}

/**
 * Convert time to milliseconds
 * @param {number} value - Time value
 * @param {string} unit - Time unit (minutes, hours, days)
 * @returns {number} Milliseconds
 */
function convertToMs(value, unit) {
    const conversions = {
        minutes: 60 * 1000,
        hours: 60 * 60 * 1000,
        days: 24 * 60 * 60 * 1000
    };
    return value * (conversions[unit] || conversions.minutes);
}

/**
 * Start automation timer
 */
export function startAutomationTimer() {
    // Stop existing timer
    if (automationTimer) {
        clearInterval(automationTimer);
    }
    
    // Run immediately
    runCrmAutomation();
    
    // Run every 5 minutes
    automationTimer = setInterval(() => {
        runCrmAutomation();
    }, 5 * 60 * 1000);
    
    console.log('⏰ Automation timer started (runs every 5 minutes)');
}

/**
 * Test automation (manual trigger)
 * @returns {Promise<void>}
 */
export async function testAutomation() {
    showToast('🧪 Запускаю тест автоматизації...', 'info');
    await runCrmAutomation();
}

/**
 * Clean up listeners on module unload
 */
export function cleanup() {
    // Stop automation timer
    if (automationTimer) {
        clearInterval(automationTimer);
        automationTimer = null;
    }
    
    if (unsubscribeColumns) {
        unsubscribeColumns();
        unsubscribeColumns = null;
    }
    if (unsubscribeCarts) {
        unsubscribeCarts();
        unsubscribeCarts = null;
    }
    
    currentColumns = [];
    currentCarts = [];
    isEditingColumn = false;
    
    console.log('🧹 CRM Module cleaned up');
}

/**
 * Toggle between Kanban and Analytics view
 */
export function toggleView() {
    currentView = currentView === 'kanban' ? 'analytics' : 'kanban';
    renderBoardUI(document.getElementById('crm-module-container'));
    
    // Reinitialize icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
    
    showToast(currentView === 'analytics' ? '📊 Аналітика' : '📋 Kanban', 'info');
}

/**
 * Update view toggle button text and icon
 */
function updateViewToggleButton() {
    const btn = document.getElementById('view-toggle-btn');
    if (!btn) return;
    
    if (currentView === 'analytics') {
        btn.innerHTML = `
            <i data-lucide="kanban-square" class="w-4 h-4"></i>
            <span>Kanban</span>
        `;
    } else {
        btn.innerHTML = `
            <i data-lucide="bar-chart-3" class="w-4 h-4"></i>
            <span>Аналітика</span>
        `;
    }
    
    // Reinitialize icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

/**
 * Calculate funnel statistics
 * @returns {Object} Funnel statistics
 */
function calculateFunnelStats() {
    const totalLeads = currentCarts.length;
    
    // Count by status type
    let successCount = 0;
    let failureCount = 0;
    let neutralCount = 0;
    
    // Stage analysis - count per column
    const stageAnalysis = currentColumns.map(col => {
        const cartsInColumn = currentCarts.filter(cart => cart.crm_status === col.id);
        const columnTotal = cartsInColumn.reduce((sum, cart) => sum + (parseFloat(cart.total) || 0), 0);
        const statusType = col.statusType || 'neutral';
        
        // Count by status type
        if (statusType === 'success') {
            successCount += cartsInColumn.length;
        } else if (statusType === 'failure') {
            failureCount += cartsInColumn.length;
        } else {
            neutralCount += cartsInColumn.length;
        }
        
        return {
            id: col.id,
            name: col.name,
            statusType,
            count: cartsInColumn.length,
            percentage: totalLeads > 0 ? ((cartsInColumn.length / totalLeads) * 100).toFixed(1) : 0,
            totalValue: columnTotal,
            avgValue: cartsInColumn.length > 0 ? columnTotal / cartsInColumn.length : 0
        };
    });
    
    // Calculate conversion and drop-off rates
    const conversionRate = totalLeads > 0 ? ((successCount / totalLeads) * 100).toFixed(1) : 0;
    const dropoffRate = totalLeads > 0 ? ((failureCount / totalLeads) * 100).toFixed(1) : 0;
    const inProgressRate = totalLeads > 0 ? ((neutralCount / totalLeads) * 100).toFixed(1) : 0;
    
    // Success metrics
    const successCarts = currentCarts.filter(cart => {
        const col = currentColumns.find(c => c.id === cart.crm_status);
        return col && col.statusType === 'success';
    });
    const successTotalValue = successCarts.reduce((sum, cart) => sum + (parseFloat(cart.total) || 0), 0);
    const successAvgValue = successCarts.length > 0 ? successTotalValue / successCarts.length : 0;
    
    // Find most common drop-off stage
    const failureStages = stageAnalysis.filter(s => s.statusType === 'failure');
    const mostCommonDropoff = failureStages.length > 0
        ? failureStages.reduce((max, stage) => stage.count > max.count ? stage : max, failureStages[0])
        : null;
    
    // Loss Attribution - track where failures come from
    const failedCarts = currentCarts.filter(cart => {
        const col = currentColumns.find(c => c.id === cart.crm_status);
        return col && col.statusType === 'failure';
    });
    
    // Group failures by their source using readable names
    const lossAttribution = {};
    let cardsWithTrackingData = 0;
    
    failedCarts.forEach(cart => {
        // Try to get human-readable name first, fallback to ID lookup
        let sourceStatusName = cart.failedFromStatusName || cart.previousStatusName;
        let sourceStatusId = cart.failed_from_status || cart.last_status;
        
        // If we don't have a readable name but have an ID, look it up
        if (!sourceStatusName && sourceStatusId) {
            const sourceColumn = currentColumns.find(c => c.id === sourceStatusId);
            sourceStatusName = sourceColumn?.name;
        }
        
        // Only count if we have tracking data
        if (sourceStatusName) {
            cardsWithTrackingData++;
            
            if (!lossAttribution[sourceStatusName]) {
                lossAttribution[sourceStatusName] = {
                    statusName: sourceStatusName,
                    statusId: sourceStatusId || 'unknown',
                    count: 0,
                    carts: []
                };
            }
            lossAttribution[sourceStatusName].count++;
            lossAttribution[sourceStatusName].carts.push(cart);
        }
    });
    
    // Convert to array and sort by count
    const lossAttributionArray = Object.values(lossAttribution)
        .sort((a, b) => b.count - a.count);
    
    // Find the main leakage point
    const mainLeakagePoint = lossAttributionArray.length > 0 ? lossAttributionArray[0] : null;
    const leakagePercentage = cardsWithTrackingData > 0 && mainLeakagePoint
        ? ((mainLeakagePoint.count / cardsWithTrackingData) * 100).toFixed(1)
        : 0;
    
    // Calculate tracking coverage
    const trackingCoverage = failedCarts.length > 0
        ? ((cardsWithTrackingData / failedCarts.length) * 100).toFixed(0)
        : 0;
    
    // Push efficiency analysis
    const cartsWithNotes = currentCarts.filter(cart => cart.notes_history && cart.notes_history.length > 0);
    const successfulCartsWithNotes = cartsWithNotes.filter(cart => {
        const col = currentColumns.find(c => c.id === cart.crm_status);
        return col && col.statusType === 'success';
    });
    const pushEfficiency = cartsWithNotes.length > 0 
        ? ((successfulCartsWithNotes.length / cartsWithNotes.length) * 100).toFixed(1)
        : 0;
    
    // Calculate average time in funnel for successful conversions
    const successfulCartsWithTime = successCarts.filter(cart => cart.created_at);
    let avgTimeToConversion = 0;
    if (successfulCartsWithTime.length > 0) {
        const totalTime = successfulCartsWithTime.reduce((sum, cart) => {
            const created = cart.created_at.toDate ? cart.created_at.toDate() : new Date(cart.created_at);
            const now = new Date();
            return sum + (now - created);
        }, 0);
        avgTimeToConversion = totalTime / successfulCartsWithTime.length;
    }
    
    return {
        totalLeads,
        successCount,
        failureCount,
        neutralCount,
        conversionRate: parseFloat(conversionRate),
        dropoffRate: parseFloat(dropoffRate),
        inProgressRate: parseFloat(inProgressRate),
        successTotalValue,
        successAvgValue,
        mostCommonDropoff,
        pushEfficiency: parseFloat(pushEfficiency),
        cartsWithNotes: cartsWithNotes.length,
        successfulCartsWithNotes: successfulCartsWithNotes.length,
        avgTimeToConversion,
        stageAnalysis,
        lossAttribution: lossAttributionArray,
        mainLeakagePoint,
        leakagePercentage: parseFloat(leakagePercentage),
        failedCartsCount: failedCarts.length,
        cardsWithTrackingData,
        trackingCoverage: parseFloat(trackingCoverage)
    };
}

/**
 * Render Analytics Dashboard
 * @returns {string} HTML for analytics dashboard
 */
function renderAnalyticsDashboard() {
    const stats = calculateFunnelStats();
    
    // Format average time to conversion
    let timeToConversionStr = 'Н/Д';
    if (stats.avgTimeToConversion > 0) {
        const hours = Math.floor(stats.avgTimeToConversion / 3600000);
        const days = Math.floor(hours / 24);
        if (days > 0) {
            timeToConversionStr = `${days} дн ${hours % 24} год`;
        } else {
            timeToConversionStr = `${hours} год`;
        }
    }
    
    return `
        <div class="space-y-6">
            <!-- Summary Cards -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <!-- Total Leads -->
                <div class="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
                    <div class="flex items-center justify-between mb-3">
                        <span class="text-sm font-semibold text-gray-600">Всього лідів</span>
                        <i data-lucide="users" class="w-5 h-5 text-blue-500"></i>
                    </div>
                    <p class="text-3xl font-bold text-gray-900 mb-1">${stats.totalLeads}</p>
                    <div class="flex items-center gap-2 text-xs">
                        <span class="text-green-600 font-medium">${stats.neutralCount} в роботі</span>
                    </div>
                </div>
                
                <!-- Conversion Rate -->
                <div class="bg-gradient-to-br from-green-50 to-white border border-green-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
                    <div class="flex items-center justify-between mb-3">
                        <span class="text-sm font-semibold text-green-700">% Конверсії</span>
                        <i data-lucide="trending-up" class="w-5 h-5 text-green-500"></i>
                    </div>
                    <p class="text-3xl font-bold text-green-600 mb-1">${stats.conversionRate}%</p>
                    <div class="flex items-center gap-2 text-xs text-green-700">
                        <span class="font-medium">${stats.successCount} успішних</span>
                    </div>
                </div>
                
                <!-- Success Revenue -->
                <div class="bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
                    <div class="flex items-center justify-between mb-3">
                        <span class="text-sm font-semibold text-emerald-700">Сума успішних</span>
                        <i data-lucide="dollar-sign" class="w-5 h-5 text-emerald-500"></i>
                    </div>
                    <p class="text-3xl font-bold text-emerald-600 mb-1">${stats.successTotalValue.toFixed(0)} ₴</p>
                    <div class="flex items-center gap-2 text-xs text-emerald-700">
                        <span class="font-medium">Середній: ${stats.successAvgValue.toFixed(0)} ₴</span>
                    </div>
                </div>
                
                <!-- Drop-off Rate -->
                <div class="bg-gradient-to-br from-red-50 to-white border border-red-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
                    <div class="flex items-center justify-between mb-3">
                        <span class="text-sm font-semibold text-red-700">% Відмов</span>
                        <i data-lucide="trending-down" class="w-5 h-5 text-red-500"></i>
                    </div>
                    <p class="text-3xl font-bold text-red-600 mb-1">${stats.dropoffRate}%</p>
                    <div class="flex items-center gap-2 text-xs text-red-700">
                        <span class="font-medium">${stats.failureCount} відмовлено</span>
                    </div>
                </div>
            </div>
            
            <!-- Main Content Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Funnel Visualization -->
                <div class="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <i data-lucide="filter" class="w-5 h-5 text-indigo-500"></i>
                            Візуалізація воронки
                        </h3>
                        <span class="text-sm text-gray-500">Від найбільшого до найменшого</span>
                    </div>
                    
                    <div class="space-y-3">
                        ${stats.stageAnalysis
                            .sort((a, b) => b.count - a.count)
                            .map((stage, index) => {
                                let bgColor, borderColor, textColor;
                                switch(stage.statusType) {
                                    case 'success':
                                        bgColor = 'bg-green-100';
                                        borderColor = 'border-green-500';
                                        textColor = 'text-green-700';
                                        break;
                                    case 'failure':
                                        bgColor = 'bg-red-100';
                                        borderColor = 'border-red-500';
                                        textColor = 'text-red-700';
                                        break;
                                    default:
                                        bgColor = 'bg-indigo-100';
                                        borderColor = 'border-indigo-500';
                                        textColor = 'text-indigo-700';
                                }
                                
                                return `
                                    <div class="relative">
                                        <div class="flex items-center gap-3">
                                            <div class="flex-shrink-0 w-8 h-8 ${bgColor} ${textColor} rounded-full flex items-center justify-center font-bold text-sm">
                                                ${index + 1}
                                            </div>
                                            <div class="flex-1">
                                                <div class="flex items-center justify-between mb-1">
                                                    <span class="font-semibold text-gray-900">${stage.name}</span>
                                                    <span class="text-sm font-bold ${textColor}">${stage.count} (${stage.percentage}%)</span>
                                                </div>
                                                <div class="relative w-full h-8 bg-gray-100 rounded-lg overflow-hidden border ${borderColor}">
                                                    <div class="${bgColor} h-full transition-all duration-500 ease-out flex items-center justify-end pr-3" 
                                                         style="width: ${stage.percentage}%">
                                                        <span class="text-xs font-bold ${textColor}">${stage.totalValue.toFixed(0)} ₴</span>
                                                    </div>
                                                </div>
                                                <div class="mt-1 text-xs text-gray-500">
                                                    Середній чек: ${stage.avgValue.toFixed(0)} ₴
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                    </div>
                </div>
                
                <!-- Insights Panel -->
                <div class="space-y-6">
                    <!-- Push Efficiency -->
                    <div class="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                        <h4 class="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <i data-lucide="message-circle" class="w-4 h-4 text-purple-500"></i>
                            Ефективність відпрацювань
                        </h4>
                        <div class="space-y-3">
                            <div class="flex items-center justify-between">
                                <span class="text-sm text-gray-600">З нотатками:</span>
                                <span class="text-sm font-bold text-gray-900">${stats.cartsWithNotes}</span>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="text-sm text-gray-600">Успішні з нотатками:</span>
                                <span class="text-sm font-bold text-green-600">${stats.successfulCartsWithNotes}</span>
                            </div>
                            <div class="pt-3 border-t border-gray-200">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="text-sm font-semibold text-gray-700">Конверсія пушів:</span>
                                    <span class="text-lg font-bold text-purple-600">${stats.pushEfficiency}%</span>
                                </div>
                                <div class="relative w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                                    <div class="bg-gradient-to-r from-purple-500 to-purple-600 h-full transition-all duration-500" 
                                         style="width: ${stats.pushEfficiency}%"></div>
                                </div>
                            </div>
                            <p class="text-xs text-gray-500 mt-3">
                                ${stats.pushEfficiency >= 30 
                                    ? '✅ Відмінний результат! Продовжуйте відпрацьовувати ліди.'
                                    : stats.pushEfficiency >= 15
                                        ? '⚠️ Є потенціал для покращення. Аналізуйте якість пушів.'
                                        : '❌ Низька конверсія. Перегляньте стратегію комунікації.'}
                            </p>
                        </div>
                    </div>
                    
                    <!-- Loss Attribution & Leakage Analysis -->
                    ${stats.failedCartsCount > 0 ? `
                        <div class="bg-gradient-to-br from-red-50 to-white border border-red-200 rounded-xl p-5 shadow-sm">
                            <h4 class="text-base font-bold text-red-700 mb-3 flex items-center gap-2">
                                <i data-lucide="alert-triangle" class="w-4 h-4"></i>
                                Джерело відмов («Leakage Point»)
                            </h4>
                            
                            ${stats.mainLeakagePoint ? `
                                <div class="bg-white rounded-lg p-4 mb-3 border border-red-300">
                                    <p class="text-sm text-gray-600 mb-2">Найбільше відмов (${stats.leakagePercentage}%) стається при переході з етапу:</p>
                                    <p class="text-xl font-bold text-red-600 mb-1">«${stats.mainLeakagePoint.statusName}»</p>
                                    <p class="text-sm text-red-700">${stats.mainLeakagePoint.count} з ${stats.cardsWithTrackingData} відмов (з даними відстеження)</p>
                                </div>
                                
                                <!-- Heatmap of Losses -->
                                ${stats.lossAttribution.length > 0 ? `
                                    <div class="space-y-2 mb-3">
                                        <p class="text-xs font-semibold text-gray-700 mb-2">Розподіл відмов за попереднім етапом:</p>
                                        ${stats.lossAttribution.slice(0, 5).map((loss, index) => {
                                            const percentage = stats.cardsWithTrackingData > 0 
                                                ? ((loss.count / stats.cardsWithTrackingData) * 100).toFixed(0)
                                                : 0;
                                            const isMain = index === 0;
                                            return `
                                                <div class="flex items-center gap-2">
                                                    <div class="flex-1">
                                                        <div class="flex items-center justify-between mb-1">
                                                            <span class="text-xs ${isMain ? 'font-bold text-red-700' : 'text-gray-600'}">
                                                                ${isMain ? '🔴 ' : '• '}З «${loss.statusName}»
                                                            </span>
                                                            <span class="text-xs font-bold ${isMain ? 'text-red-600' : 'text-gray-500'}">
                                                                ${loss.count} (${percentage}%)
                                                            </span>
                                                        </div>
                                                        <div class="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                            <div class="${isMain ? 'bg-red-500' : 'bg-red-400'} h-full transition-all duration-500" 
                                                                 style="width: ${percentage}%"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            `;
                                        }).join('')}
                                    </div>
                                ` : ''}
                                
                                <!-- Tracking Coverage Info -->
                                ${stats.trackingCoverage < 100 ? `
                                    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3 text-xs">
                                        <div class="flex items-center gap-2 mb-1">
                                            <i data-lucide="info" class="w-3 h-3 text-yellow-600"></i>
                                            <span class="font-semibold text-yellow-700">Покриття відстеження: ${stats.trackingCoverage}%</span>
                                        </div>
                                        <p class="text-yellow-600">
                                            ${stats.failedCartsCount - stats.cardsWithTrackingData} старих карток без даних про попередній статус. 
                                            Перемістіть їх в інший статус і назад, щоб відстежувати.
                                        </p>
                                    </div>
                                ` : ''}
                                
                                <!-- Dynamic Advice -->
                                <div class="text-xs text-gray-600 bg-white rounded-lg p-3 border border-red-200">
                                    <p class="font-semibold text-red-700 mb-1">💡 Рекомендація:</p>
                                    ${stats.mainLeakagePoint.statusName.toLowerCase().includes('смс') || 
                                      stats.mainLeakagePoint.statusName.toLowerCase().includes('sms') ? `
                                        <p>Зверніть увагу на текст СМС — клієнти часто відмовляються саме після нього. Спробуйте інший підхід або час відправлення.</p>
                                    ` : stats.mainLeakagePoint.statusName.toLowerCase().includes('дзвінок') ||
                                        stats.mainLeakagePoint.statusName.toLowerCase().includes('call') ? `
                                        <p>Аналізуйте скрипти дзвінків. Можливо, потрібно покращити тренінг менеджерів або змінити час зв’язку.</p>
                                    ` : stats.mainLeakagePoint.statusName.toLowerCase().includes('очіку') ||
                                        stats.mainLeakagePoint.statusName.toLowerCase().includes('wait') ? `
                                        <p>Клієнти відмовляються на етапі очікування. Спробуйте скоротити час відгуку або додати нагадування.</p>
                                    ` : `
                                        <p>Аналізуйте причини відмов після етапу «${stats.mainLeakagePoint.statusName}». Перегляньте нотатки в картках та оптимізуйте процес.</p>
                                    `}
                                </div>
                            ` : `
                                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                                    <i data-lucide="database" class="w-10 h-10 mx-auto mb-2 text-yellow-500"></i>
                                    <p class="text-sm font-semibold text-yellow-700 mb-1">Немає даних про джерело відмов</p>
                                    <p class="text-xs text-yellow-600">
                                        Усі ${stats.failedCartsCount} карток у статусі «Відмова» є старими замовленнями без інформації про попередній статус.<br>
                                        Перемістіть картки в інший статус і назад, щоб почати відстеження.
                                    </p>
                                </div>
                            `}
                        </div>
                    ` : stats.mostCommonDropoff ? `
                        <div class="bg-gradient-to-br from-red-50 to-white border border-red-200 rounded-xl p-5 shadow-sm">
                            <h4 class="text-base font-bold text-red-700 mb-3 flex items-center gap-2">
                                <i data-lucide="alert-triangle" class="w-4 h-4"></i>
                                Найчастіша точка відмови
                            </h4>
                            <div class="text-center py-3">
                                <p class="text-2xl font-bold text-red-600 mb-1">${stats.mostCommonDropoff.name}</p>
                                <p class="text-sm text-red-700">${stats.mostCommonDropoff.count} відмов (${stats.mostCommonDropoff.percentage}%)</p>
                            </div>
                            <p class="text-xs text-gray-600 mt-3 bg-white rounded-lg p-3">
                                💡 <strong>Порада:</strong> Аналізуйте причини відмов на цьому етапі. Можливо, потрібна додаткова комунікація або зміна підходу.
                            </p>
                        </div>
                    ` : ''}
                    
                    <!-- Time Metrics -->
                    <div class="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                        <h4 class="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <i data-lucide="clock" class="w-4 h-4 text-orange-500"></i>
                            Часові метрики
                        </h4>
                        <div class="space-y-3">
                            <div class="flex items-center justify-between">
                                <span class="text-sm text-gray-600">Середній час до конверсії:</span>
                                <span class="text-sm font-bold text-gray-900">${timeToConversionStr}</span>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="text-sm text-gray-600">В роботі зараз:</span>
                                <span class="text-sm font-bold text-indigo-600">${stats.neutralCount}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Distribution Pie Chart (Text-based) -->
                    <div class="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                        <h4 class="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <i data-lucide="pie-chart" class="w-4 h-4 text-blue-500"></i>
                            Розподіл статусів
                        </h4>
                        <div class="space-y-2">
                            <div class="flex items-center gap-3">
                                <div class="w-4 h-4 bg-green-500 rounded"></div>
                                <span class="text-sm text-gray-700 flex-1">Успіх</span>
                                <span class="text-sm font-bold text-green-600">${stats.conversionRate}%</span>
                            </div>
                            <div class="flex items-center gap-3">
                                <div class="w-4 h-4 bg-indigo-500 rounded"></div>
                                <span class="text-sm text-gray-700 flex-1">В роботі</span>
                                <span class="text-sm font-bold text-indigo-600">${stats.inProgressRate}%</span>
                            </div>
                            <div class="flex items-center gap-3">
                                <div class="w-4 h-4 bg-red-500 rounded"></div>
                                <span class="text-sm text-gray-700 flex-1">Відмова</span>
                                <span class="text-sm font-bold text-red-600">${stats.dropoffRate}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Export/Actions -->
            <div class="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-5 shadow-sm">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <i data-lucide="lightbulb" class="w-6 h-6 text-indigo-600"></i>
                        <div>
                            <h4 class="font-bold text-gray-900">Рекомендації на основі даних</h4>
                            <p class="text-sm text-gray-600">
                                ${stats.conversionRate >= 20 
                                    ? '🎉 Чудова конверсія! Масштабуйте процеси.'
                                    : stats.conversionRate >= 10
                                        ? '📈 Хороші показники. Продовжуйте оптимізацію.'
                                        : '⚠️ Конверсія потребує уваги. Аналізуйте воронку детальніше.'}
                            </p>
                        </div>
                    </div>
                    <button 
                        onclick="window.crmModule.refreshBoard()"
                        class="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg font-semibold transition">
                        <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                        <span>Оновити дані</span>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Expose module to window for inline event handlers
window.crmModule = {
    initCRM,
    renderCrmBoard,
    refreshBoard,
    toggleView,
    openColumnSettings,
    openCardDetails,
    createOrderFromCart,
    confirmCreateOrder,
    closeOrderConfirmation,
    sendSMS,
    cleanup,
    // Column management
    addNewColumn,
    saveColumnName,
    saveColumnField,
    deleteColumn,
    // Migration
    migrateCartsWithoutStatus,
    // Automation
    openAutomationSettings,
    closeAutomationModal,
    addTransitionRule,
    removeTransitionRule,
    saveAutomationSettings,
    testAutomation,
    runCrmAutomation,
    startAutomationTimer,
    // Manual Transfer
    openManualTransferModal,
    closeManualTransferModal,
    confirmManualTransfer
};

console.log('📦 CRM Module loaded');