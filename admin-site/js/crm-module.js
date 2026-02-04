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
 * @returns {Promise<void>}
 */
async function loadCRMData() {
    if (!db) {
        throw new Error('Firestore not initialized');
    }
    
    // Import Firestore functions
    const { collection, getDocs, query, where, orderBy, onSnapshot } = window.firebaseInit;
    
    // Load columns
    const columnsRef = collection(db, 'crm_columns');
    const columnsQuery = query(columnsRef, orderBy('order', 'asc'));
    const columnsSnapshot = await getDocs(columnsQuery);
    
    currentColumns = columnsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
    
    console.log('📋 Loaded CRM columns:', currentColumns.length);
    
    // Load abandoned carts with CRM status
    const cartsRef = collection(db, 'abandoned_carts');
    const cartsQuery = query(
        cartsRef,
        where('crm_status', '!=', null),
        orderBy('crm_status'),
        orderBy('updated_at', 'desc')
    );
    const cartsSnapshot = await getDocs(cartsQuery);
    
    currentCarts = cartsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
    
    console.log('🛒 Loaded CRM carts:', currentCarts.length);
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
    
    // Kanban board
    const boardHTML = `
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div class="p-4 border-b border-gray-200 bg-gray-50">
                <div class="flex items-center justify-between">
                    <h3 class="text-base font-bold text-gray-900">Воронка продажів</h3>
                    <span class="text-sm text-gray-600">Всього карток: ${currentCarts.length}</span>
                </div>
            </div>
            <div class="p-6 overflow-x-auto">
                <div class="flex gap-4 min-w-max pb-4" id="crm-kanban-board">
                    ${renderColumns()}
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = headerHTML + statsHTML + boardHTML;
    
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
        const cardsInColumn = currentCarts.filter(cart => cart.crm_status === column.id);
        const columnTotal = cardsInColumn.reduce((sum, cart) => sum + (parseFloat(cart.total) || 0), 0);
        
        return `
            <div class="flex-shrink-0 w-80 bg-gray-50 rounded-lg border border-gray-200">
                <div class="p-4 border-b border-gray-200" style="background-color: ${column.color || '#e5e7eb'}20;">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex-1">
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
                <div class="p-3 space-y-3 min-h-[200px] max-h-[600px] overflow-y-auto crm-column" 
                     data-column-id="${column.id}">
                    ${renderCardsInColumn(cardsInColumn)}
                </div>
            </div>
        `;
    }).join('');
    
    // Add "New Column" button
    const addColumnHTML = `
        <div class="flex-shrink-0 w-80">
            <button 
                onclick="window.crmModule.addNewColumn()"
                class="w-full h-full min-h-[200px] bg-gray-100 hover:bg-gray-200 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-3 transition group">
                <i data-lucide="plus-circle" class="w-12 h-12 text-gray-400 group-hover:text-gray-600"></i>
                <span class="text-base font-semibold text-gray-500 group-hover:text-gray-700">
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
 * @returns {string} HTML for cards
 */
function renderCardsInColumn(cards) {
    if (cards.length === 0) {
        return `
            <div class="text-center py-8 text-gray-400 text-sm">
                <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
                <p>Немає карток</p>
            </div>
        `;
    }
    
    return cards.map(cart => renderCard(cart)).join('');
}

/**
 * Render a single CRM card
 * @param {Object} cart - Cart object
 * @returns {string} HTML for card
 */
function renderCard(cart) {
    const customer = cart.customer || {};
    const phone = customer.phone || 'Немає телефону';
    const name = customer.fullName || customer.name || 'Без імені';
    const total = parseFloat(cart.total) || 0;
    const items = cart.items || [];
    const itemCount = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    
    // Format date
    let dateStr = 'Невідомо';
    if (cart.updated_at) {
        const date = cart.updated_at.toDate ? cart.updated_at.toDate() : new Date(cart.updated_at);
        dateStr = date.toLocaleDateString('uk-UA', { 
            day: 'numeric', 
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    return `
        <div class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition cursor-move crm-card" 
             data-cart-id="${cart.id}"
             draggable="true">
            <div class="flex items-start justify-between mb-3">
                <div class="flex-1">
                    <h5 class="font-bold text-gray-900 text-sm mb-1">${name}</h5>
                    <p class="text-xs text-gray-600">${phone}</p>
                </div>
                <button onclick="window.crmModule.openCardDetails('${cart.id}')" 
                    class="p-1 hover:bg-gray-100 rounded transition"
                    title="Детальніше">
                    <i data-lucide="more-vertical" class="w-4 h-4 text-gray-600"></i>
                </button>
            </div>
            
            <div class="space-y-2 mb-3">
                <div class="flex items-center gap-2 text-xs text-gray-600">
                    <i data-lucide="shopping-bag" class="w-3.5 h-3.5"></i>
                    <span>${itemCount} товар(ів)</span>
                </div>
                <div class="flex items-center gap-2 text-xs text-gray-600">
                    <i data-lucide="clock" class="w-3.5 h-3.5"></i>
                    <span>${dateStr}</span>
                </div>
            </div>
            
            <div class="flex items-center justify-between pt-3 border-t border-gray-200">
                <span class="text-lg font-bold text-gray-900">${total.toFixed(0)} ₴</span>
                <div class="flex items-center gap-1">
                    <button onclick="window.crmModule.createOrderFromCart('${cart.id}')" 
                        class="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs rounded transition"
                        title="Створити замовлення">
                        <i data-lucide="check" class="w-3.5 h-3.5"></i>
                    </button>
                    <button onclick="window.crmModule.sendSMS('${cart.id}')" 
                        class="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded transition"
                        title="Надіслати SMS">
                        <i data-lucide="message-square" class="w-3.5 h-3.5"></i>
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
        const { doc, updateDoc, serverTimestamp } = window.firebaseInit;
        const cartRef = doc(db, 'abandoned_carts', cartId);
        
        await updateDoc(cartRef, {
            crm_status: columnId,
            updated_at: serverTimestamp()
        });
        
        // Update local cache
        const cart = currentCarts.find(c => c.id === cartId);
        if (cart) {
            cart.crm_status = columnId;
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
export function openColumnSettings() {
    showToast('ℹ️ Налаштування колонок - в розробці', 'info');
    // TODO: Implement column settings modal
}

/**
 * Open card details modal
 * @param {string} cartId - Cart document ID
 */
export function openCardDetails(cartId) {
    const cart = currentCarts.find(c => c.id === cartId);
    if (!cart) {
        showToast('❌ Картку не знайдено', 'error');
        return;
    }
    
    // Use existing abandoned cart modal if available
    if (typeof window.openAbandonedCartModal === 'function') {
        window.openAbandonedCartModal(cart);
    } else {
        showToast('ℹ️ Деталі картки - в розробці', 'info');
    }
}

/**
 * Create order from cart
 * @param {string} cartId - Cart document ID
 */
export async function createOrderFromCart(cartId) {
    const cart = currentCarts.find(c => c.id === cartId);
    if (!cart) {
        showToast('❌ Кошик не знайдено', 'error');
        return;
    }
    
    // Use existing function if available
    if (typeof window.convertCartToOrder === 'function') {
        await window.convertCartToOrder(cart);
    } else {
        showToast('ℹ️ Створення замовлення - в розробці', 'info');
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
 * Clean up listeners on module unload
 */
export function cleanup() {
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

// Expose module to window for inline event handlers
window.crmModule = {
    initCRM,
    renderCrmBoard,
    refreshBoard,
    openColumnSettings,
    openCardDetails,
    createOrderFromCart,
    sendSMS,
    cleanup,
    // Column management
    addNewColumn,
    saveColumnName,
    saveColumnField,
    deleteColumn
};

console.log('📦 CRM Module loaded');
