// ============================================
// CRM.JS - Abandoned Carts CRM System
// ============================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getFirestore, 
    collection, 
    doc, 
    getDocs, 
    getDoc, 
    updateDoc, 
    deleteDoc, 
    addDoc, 
    setDoc,
    query, 
    where, 
    orderBy, 
    limit, 
    serverTimestamp,
    onSnapshot,
    writeBatch,
    increment,
    arrayUnion 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { 
    getAuth, 
    onAuthStateChanged, 
    signOut, 
    signInWithEmailAndPassword 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    getStorage,
    ref, 
    uploadBytes, 
    getDownloadURL 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

// ============================================
// FIREBASE CONFIGURATION
// ============================================
const firebaseConfig = {
    apiKey: "AIzaSyDyQvItRyL4IKl9NmEItswwPOEiKAbWkMw",
    authDomain: "my-magazin-81c96.firebaseapp.com",
    projectId: "my-magazin-81c96",
    storageBucket: "my-magazin-81c96.firebasestorage.app",
    messagingSenderId: "129061757346",
    appId: "1:129061757346:web:3e7bc5838cc5f7bda992fb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

console.log('🔥 Firebase initialized for CRM');

// ============================================
// AUTHENTICATION
// ============================================
const loadingScreen = document.getElementById('loading-screen');
const loginView = document.getElementById('login-view');
const appView = document.getElementById('app');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');

// Check authentication state
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('✅ User authenticated:', user.email);
        loadingScreen.classList.add('hidden');
        loginView.classList.add('hidden');
        appView.classList.remove('hidden');
        
        // Initialize CRM Kanban
        initializeKanban();
        
        // Refresh Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    } else {
        console.log('❌ User not authenticated');
        loadingScreen.classList.add('hidden');
        loginView.classList.remove('hidden');
        appView.classList.add('hidden');
    }
});

// Login form submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        await signInWithEmailAndPassword(auth, email, password);
        loginError.classList.add('hidden');
    } catch (error) {
        console.error('❌ Login error:', error);
        loginError.textContent = 'Невірний email або пароль';
        loginError.classList.remove('hidden');
    }
});

// Logout button
logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
        window.location.href = 'index.html';
    } catch (error) {
        console.error('❌ Logout error:', error);
    }
});

// ============================================
// CRM KANBAN BOARD - DYNAMIC COLUMNS
// ============================================

// Global state
let kanbanUnsubscribe = null;
let columnsUnsubscribe = null;
let crmColumns = [];
let currentEditingColumnId = null;

// Color schemes for columns
const COLUMN_COLORS = [
    { border: 'border-gray-200', bg: 'from-gray-50 to-gray-100', text: 'text-gray-700', count: 'bg-gray-200 text-gray-700' },
    { border: 'border-blue-200', bg: 'from-blue-50 to-blue-100', text: 'text-blue-700', count: 'bg-blue-200 text-blue-700' },
    { border: 'border-amber-200', bg: 'from-amber-50 to-amber-100', text: 'text-amber-700', count: 'bg-amber-200 text-amber-700' },
    { border: 'border-green-200', bg: 'from-green-50 to-green-100', text: 'text-green-700', count: 'bg-green-200 text-green-700' },
    { border: 'border-purple-200', bg: 'from-purple-50 to-purple-100', text: 'text-purple-700', count: 'bg-purple-200 text-purple-700' },
    { border: 'border-pink-200', bg: 'from-pink-50 to-pink-100', text: 'text-pink-700', count: 'bg-pink-200 text-pink-700' },
    { border: 'border-indigo-200', bg: 'from-indigo-50 to-indigo-100', text: 'text-indigo-700', count: 'bg-indigo-200 text-indigo-700' },
    { border: 'border-red-200', bg: 'from-red-50 to-red-100', text: 'text-red-700', count: 'bg-red-200 text-red-700' }
];

// Initialize Kanban board with dynamic columns
async function initializeKanban() {
    try {
        console.log('🎯 Initializing Dynamic CRM Kanban board...');
        
        // First, ensure default columns exist
        await ensureDefaultColumns();
        
        // Load columns from Firestore
        await loadColumns();
        
        // Setup real-time listener for columns
        setupColumnsListener();
        
        // Setup real-time listener for abandoned carts (last 30 days)
        setupCartsListener();
        
    } catch (error) {
        console.error('❌ Error initializing Kanban:', error);
        showQuickToast('Помилка завантаження CRM системи', 'error');
    }
}

// Ensure default columns exist in Firestore
async function ensureDefaultColumns() {
    try {
        const columnsSnapshot = await getDocs(collection(db, 'crm_columns'));
        
        if (columnsSnapshot.empty) {
            console.log('📝 Creating default columns...');
            
            const defaultColumns = [
                { id: 'new', title: 'Нові', emoji: '🆕', description: 'Щойно покинули кошик', order: 1 },
                { id: 'contacted', title: 'СМС Відправлено', emoji: '📨', description: 'Надіслано нагадування', order: 2 },
                { id: 'in-progress', title: 'В роботі', emoji: '💬', description: 'Активне спілкування', order: 3 },
                { id: 'completed', title: 'Завершено', emoji: '✅', description: 'Конвертовано/Втрачено', order: 4 }
            ];
            
            const batch = writeBatch(db);
            defaultColumns.forEach(col => {
                const docRef = doc(db, 'crm_columns', col.id);
                batch.set(docRef, col);
            });
            
            await batch.commit();
            console.log('✅ Default columns created');
        }
    } catch (error) {
        console.error('❌ Error ensuring default columns:', error);
    }
}

// Load columns from Firestore
async function loadColumns() {
    try {
        const q = query(collection(db, 'crm_columns'), orderBy('order'));
        const snapshot = await getDocs(q);
        
        crmColumns = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        console.log('📊 Loaded columns:', crmColumns);
        renderColumns();
    } catch (error) {
        console.error('❌ Error loading columns:', error);
    }
}

// Setup real-time listener for columns
function setupColumnsListener() {
    const q = query(collection(db, 'crm_columns'), orderBy('order'));
    
    columnsUnsubscribe = onSnapshot(q, (snapshot) => {
        console.log('🔄 Columns updated');
        crmColumns = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        renderColumns();
    });
}

// Setup real-time listener for abandoned carts
function setupCartsListener() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const q = query(
        collection(db, 'abandoned_carts'),
        where('updatedAt', '>=', thirtyDaysAgo),
        orderBy('updatedAt', 'desc')
    );
    
    kanbanUnsubscribe = onSnapshot(q, (snapshot) => {
        console.log('🔄 Carts data updated, re-rendering...');
        renderKanbanCards(snapshot.docs);
    });
}

// Render dynamic columns
function renderColumns() {
    const container = document.getElementById('kanban-board-container');
    const statsContainer = document.getElementById('stats-container');
    
    if (!container || !statsContainer) return;
    
    // Clear containers
    container.innerHTML = '';
    statsContainer.innerHTML = '';
    
    // Render each column
    crmColumns.forEach((column, index) => {
        const colorScheme = COLUMN_COLORS[index % COLUMN_COLORS.length];
        
        // Render stats
        statsContainer.innerHTML += `
            <div class="text-center min-w-[120px]">
                <div class="text-3xl font-bold ${colorScheme.text}" id="kanban-stat-${column.id}">0</div>
                <div class="text-xs text-gray-500 uppercase mt-1">${column.title}</div>
            </div>
        `;
        
        // Render column
        container.innerHTML += `
            <div class="kanban-column bg-white rounded-xl shadow-sm border-2 ${colorScheme.border} flex flex-col min-h-[600px] w-80 flex-shrink-0">
                <div class="kanban-column-header p-4 bg-gradient-to-r ${colorScheme.bg} border-b-2 ${colorScheme.border} rounded-t-xl">
                    <div class="flex items-center justify-between mb-2">
                        <h4 class="font-bold ${colorScheme.text} flex items-center gap-2 flex-1">
                            <span class="text-2xl">${column.emoji || '📋'}</span>
                            <span>${column.title}</span>
                        </h4>
                        <div class="flex items-center gap-2">
                            <span class="kanban-count ${colorScheme.count} px-2 py-1 rounded-full text-xs font-bold" id="count-${column.id}">0</span>
                            <div class="relative group">
                                <button class="p-1 hover:bg-white/50 rounded transition" onclick="event.stopPropagation()">
                                    <i data-lucide="more-vertical" class="w-4 h-4 ${colorScheme.text}"></i>
                                </button>
                                <div class="absolute right-0 top-8 bg-white rounded-lg shadow-xl border border-gray-200 py-1 hidden group-hover:block z-10 min-w-[150px]">
                                    <button onclick="editColumn('${column.id}')" class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2">
                                        <i data-lucide="edit-2" class="w-4 h-4"></i>
                                        <span>Редагувати</span>
                                    </button>
                                    <button onclick="deleteColumn('${column.id}')" class="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2">
                                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                                        <span>Видалити</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    ${column.description ? `<p class="text-xs ${colorScheme.text.replace('700', '600')}">${column.description}</p>` : ''}
                </div>
                <div 
                    id="kanban-column-${column.id}" 
                    class="kanban-cards p-3 flex-1 space-y-3 overflow-y-auto scrollbar-thin"
                    data-status="${column.id}">
                    <!-- Cards will be dynamically inserted -->
                </div>
            </div>
        `;
    });
    
    // Add "Add Column" button
    container.innerHTML += `
        <div class="flex-shrink-0 w-80">
            <button onclick="addNewColumn()" class="w-full h-full min-h-[600px] bg-white/50 hover:bg-white border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl flex flex-col items-center justify-center gap-3 transition-all group">
                <div class="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition">
                    <i data-lucide="plus" class="w-8 h-8 text-blue-600"></i>
                </div>
                <span class="text-lg font-semibold text-gray-600 group-hover:text-blue-600">Додати колонку</span>
            </button>
        </div>
    `;
    
    // Refresh Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Re-initialize drag-and-drop for new columns
    initializeKanbanDragDrop();
}

// Render Kanban cards from Firestore snapshot
function renderKanbanCards(docs) {
    // Clear all columns
    crmColumns.forEach(column => {
        const columnEl = document.getElementById(`kanban-column-${column.id}`);
        if (columnEl) columnEl.innerHTML = '';
    });
    
    // Count cards per status
    const counts = {};
    crmColumns.forEach(col => counts[col.id] = 0);
    
    docs.forEach(doc => {
        const cart = doc.data();
        const phone = doc.id;
        
        // Get CRM status (default: first column)
        const crmStatus = cart.crm_status || (crmColumns[0]?.id || 'new');
        if (counts[crmStatus] !== undefined) {
            counts[crmStatus]++;
        }
        
        // Build card HTML
        const card = createKanbanCard(phone, cart);
        
        // Insert card into appropriate column
        const column = document.getElementById(`kanban-column-${crmStatus}`);
        if (column) {
            column.insertAdjacentHTML('beforeend', card);
        }
    });
    
    // Update stats and counts
    crmColumns.forEach(column => {
        const statEl = document.getElementById(`kanban-stat-${column.id}`);
        const countEl = document.getElementById(`count-${column.id}`);
        const count = counts[column.id] || 0;
        
        if (statEl) statEl.textContent = count;
        if (countEl) countEl.textContent = count;
    });
    
    // Refresh Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Create individual Kanban card HTML
function createKanbanCard(phone, cart) {
    const customer = cart.customer || {};
    const customerName = customer.fullName || 'Невідомий';
    const items = cart.items || [];
    const total = cart.total || 0;
    const updatedAt = cart.updatedAt?.toDate ? cart.updatedAt.toDate() : new Date(cart.updatedAt);
    
    // Calculate time since abandonment
    const now = new Date();
    const diffMs = now - updatedAt;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    let timeAgo = '';
    if (diffDays > 0) {
        timeAgo = `${diffDays} дн тому`;
    } else if (diffHours > 0) {
        timeAgo = `${diffHours} год тому`;
    } else {
        timeAgo = 'Щойно';
    }
    
    // Build items summary
    const itemCount = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const itemsSummary = items.length > 0 
        ? `${items[0].name}${items.length > 1 ? ` +${items.length - 1}` : ''}`
        : 'Порожній кошик';
    
    return `
        <div class="kanban-card bg-white rounded-lg border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all cursor-move p-4"
             data-cart-id="${phone}">
            
            <!-- Card Header -->
            <div class="flex items-start justify-between mb-3">
                <div class="flex-1">
                    <div class="font-bold text-gray-900 text-sm mb-1">${customerName}</div>
                    <div class="flex items-center gap-1 text-xs text-gray-500">
                        <i data-lucide="phone" class="w-3 h-3"></i>
                        <span>${phone}</span>
                    </div>
                </div>
                <div class="text-xs text-gray-400">${timeAgo}</div>
            </div>
            
            <!-- Cart Summary -->
            <div class="mb-3 pb-3 border-b border-gray-100">
                <div class="text-xs text-gray-600 mb-1">${itemsSummary}</div>
                <div class="text-xs text-gray-500">${itemCount} шт</div>
            </div>
            
            <!-- Total -->
            <div class="flex items-center justify-between mb-3">
                <span class="text-xs text-gray-500">Сума:</span>
                <span class="text-lg font-bold text-blue-600">₴${total}</span>
            </div>
            
            <!-- Quick Actions -->
            <div class="flex gap-2">
                <button onclick="sendRecoverySMS('${phone}')" 
                        class="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition"
                        title="Відправити SMS">
                    <i data-lucide="mail" class="w-3 h-3"></i>
                    <span>SMS</span>
                </button>
                <button onclick="convertToOrder('${phone}')" 
                        class="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition"
                        title="Конвертувати">
                    <i data-lucide="check-circle" class="w-3 h-3"></i>
                    <span>Замовлення</span>
                </button>
                <button onclick="viewCartDetails('${phone}')" 
                        class="px-2 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition"
                        title="Деталі">
                    <i data-lucide="eye" class="w-4 h-4"></i>
                </button>
            </div>
        </div>
    `;
}

// Initialize drag-and-drop with SortableJS (Dynamic Columns)
function initializeKanbanDragDrop() {
    crmColumns.forEach(column => {
        const columnEl = document.getElementById(`kanban-column-${column.id}`);
        
        if (columnEl && typeof Sortable !== 'undefined') {
            new Sortable(columnEl, {
                group: 'kanban',
                animation: 200,
                ghostClass: 'sortable-ghost',
                dragClass: 'sortable-drag',
                
                onEnd: async function (evt) {
                    const cartId = evt.item.dataset.cartId;
                    const newStatus = evt.to.dataset.status;
                    
                    console.log(`🔄 Moving cart ${cartId} to ${newStatus}`);
                    
                    // Update Firestore
                    try {
                        await updateDoc(doc(db, 'abandoned_carts', cartId), {
                            crm_status: newStatus,
                            updatedAt: serverTimestamp()
                        });
                        
                        console.log('✅ Cart status updated in Firestore');
                        
                        // Find column title
                        const targetColumn = crmColumns.find(col => col.id === newStatus);
                        const columnTitle = targetColumn ? targetColumn.title : newStatus;
                        
                        // Show toast
                        showQuickToast(`Картку переміщено до "${columnTitle}"`);
                        
                    } catch (error) {
                        console.error('❌ Error updating cart status:', error);
                        showQuickToast('Помилка переміщення картки', 'error');
                    }
                }
            });
        }
    });
}

// ============================================
// COLUMN MANAGEMENT
// ============================================

// Add new column
window.addNewColumn = async function() {
    try {
        const columnId = `column_${Date.now()}`;
        const newOrder = crmColumns.length + 1;
        
        const newColumn = {
            id: columnId,
            title: 'Нова колонка',
            emoji: '📋',
            description: '',
            order: newOrder
        };
        
        await setDoc(doc(db, 'crm_columns', columnId), newColumn);
        
        showQuickToast('✅ Колонку додано');
        
        // Open edit modal immediately
        setTimeout(() => editColumn(columnId), 500);
        
    } catch (error) {
        console.error('❌ Error adding column:', error);
        showQuickToast('Помилка додавання колонки', 'error');
    }
};

// Edit column
window.editColumn = function(columnId) {
    const column = crmColumns.find(col => col.id === columnId);
    if (!column) return;
    
    currentEditingColumnId = columnId;
    
    // Populate modal
    document.getElementById('column-title-input').value = column.title || '';
    document.getElementById('column-emoji-input').value = column.emoji || '';
    document.getElementById('column-description-input').value = column.description || '';
    
    // Show modal
    document.getElementById('column-edit-modal').classList.remove('hidden');
};

// Save column edit
window.saveColumnEdit = async function() {
    if (!currentEditingColumnId) return;
    
    try {
        const title = document.getElementById('column-title-input').value.trim();
        const emoji = document.getElementById('column-emoji-input').value.trim();
        const description = document.getElementById('column-description-input').value.trim();
        
        if (!title) {
            showQuickToast('Введіть назву колонки', 'error');
            return;
        }
        
        await updateDoc(doc(db, 'crm_columns', currentEditingColumnId), {
            title,
            emoji,
            description
        });
        
        closeColumnEditModal();
        showQuickToast('✅ Колонку оновлено');
        
    } catch (error) {
        console.error('❌ Error saving column:', error);
        showQuickToast('Помилка збереження', 'error');
    }
};

// Close edit modal
window.closeColumnEditModal = function() {
    document.getElementById('column-edit-modal').classList.add('hidden');
    currentEditingColumnId = null;
};

// Delete column
window.deleteColumn = async function(columnId) {
    try {
        // Check if column has cards
        const cartsSnapshot = await getDocs(
            query(
                collection(db, 'abandoned_carts'),
                where('crm_status', '==', columnId),
                limit(1)
            )
        );
        
        if (!cartsSnapshot.empty) {
            showQuickToast('❌ Неможливо видалити колонку з картками', 'error');
            return;
        }
        
        // Confirm deletion
        if (!confirm(`Видалити колонку? Ця дія незворотня.`)) {
            return;
        }
        
        await deleteDoc(doc(db, 'crm_columns', columnId));
        showQuickToast('✅ Колонку видалено');
        
    } catch (error) {
        console.error('❌ Error deleting column:', error);
        showQuickToast('Помилка видалення колонки', 'error');
    }
};

// Refresh Kanban
window.refreshKanban = function() {
    loadColumns();
    showQuickToast('🔄 Оновлено');
};

// Quick toast notification
function showQuickToast(message, type = 'success') {
    const toast = document.createElement('div');
    const bgColor = type === 'error' ? 'bg-red-500' : 'bg-green-500';
    toast.className = `fixed bottom-4 right-4 ${bgColor} text-white px-6 py-3 rounded-xl shadow-2xl z-[100] animate-fade-in`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ============================================
// CONVERT CART TO ORDER
// ============================================
window.convertToOrder = async function(cartId) {
    try {
        console.log('🔄 Converting cart to order:', cartId);
        
        // Get the abandoned cart data
        const cartDoc = await getDoc(doc(db, 'abandoned_carts', cartId));
        
        if (!cartDoc.exists()) {
            throw new Error('Кошик не знайдено!');
        }
        
        const cartData = cartDoc.data();
        
        // Confirm with user
        const customerName = cartData.customer?.fullName || 'Не вказано';
        const total = cartData.total || 0;
        if (!confirm(`Створити замовлення для:\n\n👤 ${customerName}\n💰 ₴${total}\n\nПродовжити?`)) {
            return;
        }
        
        // Show loading toast
        const loadingToast = document.createElement('div');
        loadingToast.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-xl shadow-2xl z-[100] flex items-center gap-3';
        loadingToast.innerHTML = `
            <div class="animate-spin w-5 h-5 border-3 border-white border-t-transparent rounded-full"></div>
            <span>Створення замовлення...</span>
        `;
        document.body.appendChild(loadingToast);
        
        // Create order data from cart
        const orderData = {
            customer: {
                fullName: cartData.customer?.fullName || '',
                phone: cartData.customer?.phone || cartId,
                email: cartData.customer?.email || '',
                telegram: cartData.customer?.telegram || ''
            },
            items: cartData.items || [],
            summary: {
                total: cartData.total || 0,
                itemCount: (cartData.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0),
                subtotal: cartData.subtotal || cartData.total || 0,
                deliveryFee: cartData.deliveryFee || 0
            },
            delivery: cartData.delivery || {
                method: 'Не вказано',
                address: 'Не вказано',
                city: cartData.delivery?.city || ''
            },
            payment: {
                method: cartData.payment?.method || 'Не вказано',
                status: 'pending'
            },
            status: 'new',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            viewed: false,
            isArchived: false,
            source: 'crm_conversion',
            originalCartId: cartId,
            comment: cartData.comment || 'Створено з CRM системи'
        };
        
        // Create the order
        const orderRef = await addDoc(collection(db, 'orders'), orderData);
        console.log('✅ Order created:', orderRef.id);
        
        // Delete the abandoned cart
        await deleteDoc(doc(db, 'abandoned_carts', cartId));
        console.log('✅ Abandoned cart deleted:', cartId);
        
        // Success!
        loadingToast.remove();
        
        // Show success toast
        const successToast = document.createElement('div');
        successToast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-xl shadow-2xl z-[100]';
        successToast.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="text-2xl">✅</span>
                <div>
                    <div class="font-bold">Замовлення створено!</div>
                    <div class="text-xs opacity-90">ID: ${orderRef.id.substring(0, 8)}</div>
                </div>
            </div>
        `;
        document.body.appendChild(successToast);
        setTimeout(() => successToast.remove(), 5000);
        
        console.log('🎉 Cart successfully converted to order');
        
    } catch (error) {
        console.error('❌ Error converting cart to order:', error);
        
        // Show error toast
        const errorToast = document.createElement('div');
        errorToast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-xl shadow-2xl z-[100]';
        errorToast.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="text-2xl">❌</span>
                <div>
                    <div class="font-bold">Помилка!</div>
                    <div class="text-xs opacity-90">${error.message}</div>
                </div>
            </div>
        `;
        document.body.appendChild(errorToast);
        setTimeout(() => errorToast.remove(), 5000);
    }
};

// ============================================
// VIEW CART DETAILS
// ============================================
window.viewCartDetails = async function(phone) {
    try {
        const cartDoc = await getDoc(doc(db, 'abandoned_carts', phone));
        if (!cartDoc.exists()) {
            alert('Кошик не знайдено!');
            return;
        }
        
        const cart = cartDoc.data();
        const customer = cart.customer || {};
        const items = cart.items || [];
        const total = cart.total || 0;
        
        // Build items HTML
        let itemsHtml = '';
        items.forEach(item => {
            const itemTotal = (item.price || 0) * (item.quantity || 0);
            itemsHtml += `
                <div class="flex items-start gap-3 py-3 border-b border-gray-100">
                    <div class="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        ${item.image ? `<img src="${item.image}" class="w-full h-full object-cover" />` : '<div class="w-full h-full flex items-center justify-center text-gray-400">📦</div>'}
                    </div>
                    <div class="flex-1">
                        <div class="font-semibold text-gray-900">${item.name}</div>
                        <div class="text-sm text-gray-500 mt-1">
                            ${item.price} грн × ${item.quantity} шт = <span class="font-bold">${itemTotal} грн</span>
                        </div>
                        ${item.isGift ? '<div class="text-xs text-green-600 font-semibold mt-1">🎁 Подарунок</div>' : ''}
                    </div>
                </div>
            `;
        });
        
        // Show modal
        const modalHtml = `
            <div id="cart-details-modal" class="fixed inset-0 bg-black bg-opacity-50 z-[200] flex items-center justify-center p-4">
                <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div class="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
                        <h3 class="text-xl font-bold">Деталі кошика</h3>
                        <button onclick="document.getElementById('cart-details-modal').remove()" class="p-2 hover:bg-gray-100 rounded-lg">
                            <i data-lucide="x" class="w-5 h-5"></i>
                        </button>
                    </div>
                    <div class="p-6">
                        <div class="mb-6">
                            <h4 class="font-bold text-gray-700 mb-3">Клієнт</h4>
                            <div class="bg-gray-50 rounded-lg p-4 space-y-2">
                                <div><span class="text-gray-600">Ім'я:</span> <span class="font-semibold">${customer.fullName || 'Не вказано'}</span></div>
                                <div><span class="text-gray-600">Телефон:</span> <span class="font-semibold">${phone}</span></div>
                                <div><span class="text-gray-600">Email:</span> <span class="font-semibold">${customer.email || 'Не вказано'}</span></div>
                            </div>
                        </div>
                        <div class="mb-6">
                            <h4 class="font-bold text-gray-700 mb-3">Товари (${items.length})</h4>
                            <div>${itemsHtml}</div>
                        </div>
                        <div class="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                            <span class="font-bold text-gray-700">Загальна сума:</span>
                            <span class="text-2xl font-bold text-blue-600">₴${total}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Refresh icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
    } catch (error) {
        console.error('❌ Error viewing cart details:', error);
        alert(`Помилка: ${error.message}`);
    }
};

// ============================================
// SEND RECOVERY SMS
// ============================================
window.sendRecoverySMS = async function(phone) {
    try {
        // Get cart data
        const cartDoc = await getDoc(doc(db, 'abandoned_carts', phone));
        if (!cartDoc.exists()) {
            alert('Кошик не знайдено!');
            return;
        }
        
        const cart = cartDoc.data();
        const customerName = cart.customer?.fullName || 'Клієнт';
        
        if (!confirm(`Відправити SMS нагадування для:\n\n👤 ${customerName}\n📞 ${phone}\n\nПродовжити?`)) {
            return;
        }
        
        // Update status to 'contacted' in Firestore
        await updateDoc(doc(db, 'abandoned_carts', phone), {
            crm_status: 'contacted',
            lastSmsDate: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        
        showQuickToast('SMS відправлено! Картку переміщено до "СМС Відправлено"');
        
        console.log('✅ SMS sent and cart moved to contacted');
        
    } catch (error) {
        console.error('❌ Error sending SMS:', error);
        showQuickToast('Помилка відправки SMS', 'error');
    }
};

// ============================================
// REFRESH KANBAN
// ============================================
window.refreshKanban = function() {
    showQuickToast('Оновлення даних...');
    // Real-time listener will auto-refresh
};

// ============================================
// SETTINGS MODAL (Placeholder)
// ============================================
window.openSettingsModal = function() {
    alert('Налаштування CRM системи (в розробці)');
};

console.log('✅ CRM.js loaded successfully');
