// ============================================
// ADMIN.JS - CORRECTED VERSION
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
    arrayUnion,
    deleteField 
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

// ============================================
// FIREBASE INITIALIZATION
// ============================================
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

console.log('🔥 Firebase initialized successfully (admin.js)');

// ============================================
// GLOBAL EXPORTS FOR EXTERNAL MODULES
// ============================================
// Export Firebase instances and functions for use in other modules (e.g., reviews module)
window.db = db;
window.doc = doc;
window.updateDoc = updateDoc;
window.deleteField = deleteField;
window.collection = collection;
window.getDocs = getDocs;
window.serverTimestamp = serverTimestamp;

console.log('✅ Global Firebase exports initialized (for external modules)');

// ============================================
// MARK BROWSER AS ADMIN (Maintenance Mode Bypass)
// ============================================
// This tag allows admins to view the site even when Maintenance Mode is ON
localStorage.setItem('isAdmin', 'true');
console.log('✅ Browser marked as Admin - Maintenance Mode bypass enabled');

// ============================================
// MINI-CRM: SYNC CUSTOMER FROM ORDER
// ============================================
/**
 * Automatically creates or updates a Customer profile when an Order is saved.
 * Uses PHONE NUMBER as the Document ID (normalized).
 * Uses setDoc with merge:true for atomic upsert operations.
 * 
 * @param {Object} orderData - The order data object
 * @param {Object} orderData.customer - Customer info { phone, fullName, email }
 * @param {Object} orderData.summary - Order summary { total }
 * @param {string} [orderId] - Optional: The Firestore document ID of the order
 */
window.syncCustomerFromOrder = async function(orderData, orderId = null) {
    try {
        // Extract customer data
        const customer = orderData.customer || {};
        const rawPhone = customer.phone || '';
        
        // Normalize phone number - use as Document ID
        // Remove all non-digit characters except leading +
        const phone = rawPhone.replace(/[^\d]/g, '').trim();
        
        if (!phone || phone.length < 9) {
            console.warn('⚠️ syncCustomerFromOrder: Invalid phone number, skipping.');
            return null;
        }
        
        const fullName = (customer.fullName || customer.name || '').trim();
        const email = (customer.email || customer.telegram || '').trim();
        const orderTotal = parseFloat(orderData.summary?.total) || 0;
        
        console.log(`👤 Mini-CRM: Syncing customer [${phone}] - ${fullName}`);
        
        // Use phone as document ID
        const customerRef = doc(db, 'customers', phone);
        
        // Check if customer exists to determine if this is create or update
        const customerSnap = await getDoc(customerRef);
        
        if (!customerSnap.exists()) {
            // ============================================
            // NEW CUSTOMER - Create with initial values
            // ============================================
            console.log('🆕 Creating new customer...');
            
            const newCustomerData = {
                phone: phone,
                fullName: fullName,
                email: email,
                ordersCount: 1,
                totalSpent: orderTotal,
                orderIds: orderId ? [orderId] : [],
                firstOrderDate: serverTimestamp(),
                lastOrderDate: serverTimestamp(),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };
            
            await setDoc(customerRef, newCustomerData);
            console.log(`✅ New customer created: ${phone}`);
            
            return { action: 'created', customerId: phone };
            
        } else {
            // ============================================
            // EXISTING CUSTOMER - Update with merge
            // ============================================
            console.log('🔄 Updating existing customer...');
            
            const updateData = {
                // Increment counters
                ordersCount: increment(1),
                totalSpent: increment(orderTotal),
                // Update timestamps
                lastOrderDate: serverTimestamp(),
                updatedAt: serverTimestamp()
            };
            
            // Add order ID to array (arrayUnion prevents duplicates)
            if (orderId) {
                updateData.orderIds = arrayUnion(orderId);
            }
            
            // Only update name/email if they were empty before
            const existingData = customerSnap.data();
            if (!existingData.fullName && fullName) {
                updateData.fullName = fullName;
            }
            if (!existingData.email && email) {
                updateData.email = email;
            }
            
            await setDoc(customerRef, updateData, { merge: true });
            
            const newCount = (existingData.ordersCount || 0) + 1;
            console.log(`✅ Customer updated: ${phone} (Orders: ${newCount})`);
            
            return { action: 'updated', customerId: phone, ordersCount: newCount };
        }
        
    } catch (error) {
        console.error('❌ Mini-CRM syncCustomerFromOrder error:', error);
        return { action: 'error', error: error.message };
    }
};

// ============================================
// ORDERS IMPORT WITH MINI-CRM INTEGRATION
// ============================================
/**
 * Import orders from Excel/CSV and automatically sync customers
 * Expected columns: Name, Phone, Email, Total, Date, Items, etc.
 */
window.handleOrdersImport = async function(input) {
    console.log('📦 Starting Orders Import with Mini-CRM...');
    
    if (!input.files || input.files.length === 0) {
        console.log('No file selected');
        return;
    }
    
    const file = input.files[0];
    console.log(`📁 File: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    
    // Show loading toast
    const loadingToast = document.createElement('div');
    loadingToast.id = 'orders-loading-toast';
    loadingToast.className = 'fixed top-4 right-4 bg-blue-600 text-white px-6 py-4 rounded-xl shadow-2xl z-[100] flex items-center gap-3';
    loadingToast.innerHTML = `
        <div class="animate-spin w-6 h-6 border-3 border-white border-t-transparent rounded-full"></div>
        <span class="font-semibold">Імпортую замовлення...</span>
    `;
    document.body.appendChild(loadingToast);
    
    try {
        if (typeof XLSX === 'undefined') {
            throw new Error('Бібліотека XLSX не завантажена! Оновіть сторінку.');
        }
        
        // Read file
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        
        if (jsonData.length === 0) {
            throw new Error('Файл порожній!');
        }
        
        console.log(`📊 Parsed ${jsonData.length} orders from file`);
        
        let importedOrders = 0;
        let syncedCustomers = 0;
        let errorCount = 0;
        
        // Process each row
        for (let i = 0; i < jsonData.length; i++) {
            const row = jsonData[i];
            
            try {
                // Map columns to order structure
                // Flexible column mapping (supports Ukrainian and English)
                const orderData = {
                    customer: {
                        fullName: row['Name'] || row['Ім\'я'] || row['ПІБ'] || row['Клієнт'] || '',
                        phone: String(row['Phone'] || row['Телефон'] || row['Tel'] || '').trim(),
                        email: row['Email'] || row['Пошта'] || row['Telegram'] || ''
                    },
                    summary: {
                        total: parseFloat(row['Total'] || row['Сума'] || row['Amount'] || 0) || 0
                    },
                    items: [], // Can be extended to parse items
                    status: row['Status'] || row['Статус'] || 'completed',
                    createdAt: serverTimestamp(),
                    importedAt: serverTimestamp(),
                    importSource: file.name
                };
                
                // Skip rows without phone
                if (!orderData.customer.phone) {
                    console.warn(`⏭️ Row ${i + 2}: No phone, skipping`);
                    continue;
                }
                
                // Save order to Firestore
                const orderRef = await addDoc(collection(db, 'orders'), orderData);
                importedOrders++;
                
                // ⭐ CRITICAL: Sync customer via Mini-CRM
                const crmResult = await window.syncCustomerFromOrder(orderData, orderRef.id);
                if (crmResult && crmResult.action !== 'error') {
                    syncedCustomers++;
                }
                
                // Progress update every 10 orders
                if (importedOrders % 10 === 0) {
                    loadingToast.querySelector('span').textContent = 
                        `Оброблено ${importedOrders} замовлень...`;
                }
                
            } catch (rowError) {
                console.error(`❌ Row ${i + 2} error:`, rowError);
                errorCount++;
            }
        }
        
        // Remove loading toast
        loadingToast.remove();
        
        // Show success
        const message = `✅ Імпорт завершено!\n` +
            `📦 Замовлень: ${importedOrders}\n` +
            `👤 Клієнтів оновлено: ${syncedCustomers}\n` +
            (errorCount > 0 ? `❌ Помилок: ${errorCount}` : '');
        
        alert(message);
        showImportToast(`✅ Імпортовано ${importedOrders} замовлень, оновлено ${syncedCustomers} клієнтів`);
        
        // Reset input
        input.value = '';
        
        console.log(`🎉 Orders import completed: ${importedOrders} orders, ${syncedCustomers} customers synced`);
        
    } catch (error) {
        console.error('❌ Orders import error:', error);
        
        const toast = document.getElementById('orders-loading-toast');
        if (toast) toast.remove();
        
        alert(`❌ Помилка імпорту: ${error.message}`);
        input.value = '';
    }
};

// ============================================
// GLOBAL STATE
// ============================================
let currentUser = null;
let showArchivedCarts = false;

// ============================================
// LOAD PRODUCTS (FIXED WITH BACKTICKS)
// ============================================
window.loadProducts = async function() {
    console.log('📦 Loading products...');
    const list = document.getElementById('products-list');
    
    if (!list) {
        console.warn('⚠️ products-list element not found');
        return;
    }
    
    list.innerHTML = '<div class="text-center py-10"><div class="animate-spin w-8 h-8 border-4 border-spicy border-t-transparent rounded-full mx-auto"></div></div>';
    
    try {
        const productsRef = collection(db, 'products');
        const snapshot = await getDocs(productsRef);
        
        if (snapshot.empty) {
            list.innerHTML = '<div class="text-center text-gray-500 py-8">Товарів немає. Додайте перший!</div>';
            return;
        }

        let html = `
            <div class="overflow-x-auto">
                <table class="w-full" id="products-table">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-3 text-center w-12">
                                <input type="checkbox" id="select-all-products" 
                                    class="w-4 h-4 rounded border-gray-300 text-spicy focus:ring-spicy cursor-pointer"
                                    onchange="window.toggleSelectAllProducts(this.checked)"
                                    title="Вибрати всі">
                            </th>
                            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Фото</th>
                            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Назва</th>
                            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Артикул</th>
                            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ціна</th>
                            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Категорія</th>
                            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Залишок</th>
                            <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Статус</th>
                            <th class="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Дії</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200" id="products-table-body">
        `;

        snapshot.forEach(docSnap => {
            const product = docSnap.data();
            const productId = docSnap.id;
            
            const img = product.images?.[0] || product.image || product.imageUrl || 'https://placehold.co/50';
            
            const isOnSale = product.isOnSale === true;
            const originalPrice = product.originalPrice || null;
            const priceDisplay = isOnSale && originalPrice 
                ? `<span class="line-through text-gray-400 text-xs mr-1">₴${originalPrice}</span><span class="text-red-600">₴${product.price || 0}</span>`
                : `₴${product.price || 0}`;
            const saleBadge = isOnSale ? '<span class="ml-2 px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-xs font-semibold">SALE</span>' : '';
            
            html += `
                <tr class="hover:bg-gray-50 product-row" data-product-id="${productId}">
                    <td class="px-4 py-3 text-center">
                        <input type="checkbox" 
                            class="product-checkbox w-4 h-4 rounded border-gray-300 text-spicy focus:ring-spicy cursor-pointer"
                            data-product-id="${productId}"
                            onchange="window.handleProductSelection(this)">
                    </td>
                    <td class="px-4 py-3">
                        <img src="${img}" class="w-12 h-12 object-cover rounded-lg" onerror="this.src='https://placehold.co/50'">
                    </td>
                    <td class="px-4 py-3 text-sm font-medium text-gray-900">${product.name || 'Без назви'}${saleBadge}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">${product.sku || '-'}</td>
                    <td class="px-4 py-3 text-sm font-semibold text-gray-900">${priceDisplay}</td>
                    <td class="px-4 py-3 text-sm text-gray-700">${product.category || '-'}</td>
                    <td class="px-4 py-3">
                        <span class="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">В наявності</span>
                    </td>
                    <td class="px-4 py-3 text-center">
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" class="sr-only peer" ${product.isVisible !== false ? 'checked' : ''} 
                                   onchange="updateProductVisibility('${productId}', this.checked)">
                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                    </td>
                    <td class="px-4 py-3 text-right">
                        <button onclick="window.startEditProduct('${productId}')" class="p-2 hover:bg-blue-50 rounded-lg text-blue-600 mr-1">
                            <i data-lucide="pencil" class="w-4 h-4"></i>
                        </button>
                        <button onclick="window.deleteProduct('${productId}')" class="p-2 hover:bg-red-50 rounded-lg text-red-600">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        list.innerHTML = html;
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        console.log('✅ Products loaded successfully');
        
    } catch (e) {
        console.error('❌ Error loading products:', e);
        list.innerHTML = `<div class="text-red-500 text-center py-10">Помилка: ${e.message}</div>`;
    }
};

// ============================================
// BULK DISCOUNT: Selection State & UI
// ============================================
// NOTE: The actual selection state is managed globally in index.html
// via event delegation. This file only needs to export selectedProductIds
// for the discount modal to read.

// Make selectedProductIds globally accessible
if (typeof window.selectedProductIds === 'undefined') {
    window.selectedProductIds = [];
}

// Reference the global array
let selectedProductIds = window.selectedProductIds;

/**
 * Toggle selection of all products
 * Works with the global selectedProductIds from index.html
 */
window.toggleSelectAllProducts = function(isChecked) {
    const checkboxes = document.querySelectorAll('.product-checkbox');
    
    // Clear the global array
    window.selectedProductIds.length = 0;
    selectedProductIds = window.selectedProductIds;
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = isChecked;
        if (isChecked) {
            const productId = checkbox.dataset.productId;
            if (productId && !window.selectedProductIds.includes(productId)) {
                window.selectedProductIds.push(productId);
            }
        }
    });
    
    updateBulkActionBar();
    console.log(`📦 Select all: ${isChecked}, selected: ${window.selectedProductIds.length}`);
};

/**
 * Handle individual product selection
 * Works with the global selectedProductIds from index.html
 */
window.handleProductSelection = function(checkbox) {
    const productId = checkbox.dataset.productId;
    
    // Reference the global array
    selectedProductIds = window.selectedProductIds;
    
    if (checkbox.checked) {
        if (productId && !window.selectedProductIds.includes(productId)) {
            window.selectedProductIds.push(productId);
        }
    } else {
        const index = window.selectedProductIds.indexOf(productId);
        if (index > -1) {
            window.selectedProductIds.splice(index, 1);
        }
    }
    
    // Update "select all" checkbox state
    const selectAllCheckbox = document.getElementById('select-all-products');
    const allCheckboxes = document.querySelectorAll('.product-checkbox');
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = window.selectedProductIds.length === allCheckboxes.length && allCheckboxes.length > 0;
        selectAllCheckbox.indeterminate = window.selectedProductIds.length > 0 && window.selectedProductIds.length < allCheckboxes.length;
    }
    
    updateBulkActionBar();
    console.log(`📦 Product selection changed, selected: ${window.selectedProductIds.length}`);
};

/**
 * Clear all product selections
 */
window.clearProductSelection = function() {
    window.selectedProductIds.length = 0;
    selectedProductIds = window.selectedProductIds;
    
    const checkboxes = document.querySelectorAll('.product-checkbox');
    checkboxes.forEach(checkbox => checkbox.checked = false);
    
    const selectAllCheckbox = document.getElementById('select-all-products');
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    }
    
    updateBulkActionBar();
    console.log('📦 Selection cleared');
};

/**
 * Update the bulk action bar visibility and count
 */
function updateBulkActionBar() {
    const bar = document.getElementById('bulk-action-bar');
    const countEl = document.getElementById('selected-count');
    
    if (!bar) return;
    
    const count = window.selectedProductIds.length;
    
    if (count > 0) {
        bar.classList.remove('translate-y-full');
        bar.classList.add('translate-y-0');
        if (countEl) {
            const word = count === 1 ? 'товар' : count < 5 ? 'товари' : 'товарів';
            countEl.textContent = `${count} ${word}`;
        }
    } else {
        bar.classList.remove('translate-y-0');
        bar.classList.add('translate-y-full');
    }
    
    // Reinitialize icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// ============================================
// BULK DISCOUNT: Modal Functions
// ============================================

/**
 * Open the bulk discount modal
 */
window.openBulkDiscountModal = function() {
    if (selectedProductIds.length === 0) {
        alert('Спочатку виберіть товари!');
        return;
    }
    
    const modal = document.getElementById('bulk-discount-modal');
    const subtitle = document.getElementById('discount-modal-subtitle');
    
    if (modal) {
        modal.classList.remove('hidden');
        if (subtitle) {
            const count = selectedProductIds.length;
            const word = count === 1 ? 'товар' : count < 5 ? 'товари' : 'товарів';
            subtitle.textContent = `Вибрано: ${count} ${word}`;
        }
        
        // Reset to percentage by default
        const percentageRadio = document.querySelector('input[name="discount-type"][value="percentage"]');
        if (percentageRadio) percentageRadio.checked = true;
        
        updateDiscountPreview();
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
    
    console.log('🏷️ Bulk discount modal opened');
};

/**
 * Close the bulk discount modal
 */
window.closeBulkDiscountModal = function() {
    const modal = document.getElementById('bulk-discount-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
};

/**
 * Update discount preview based on selected type and value
 */
function updateDiscountPreview() {
    const valueInput = document.getElementById('bulk-discount-value');
    const unitSpan = document.getElementById('discount-unit');
    const previewEl = document.getElementById('discount-preview');
    const hintEl = document.getElementById('discount-hint');
    
    const selectedType = document.querySelector('input[name="discount-type"]:checked')?.value || 'percentage';
    const value = parseFloat(valueInput?.value) || 0;
    
    if (unitSpan) {
        unitSpan.textContent = selectedType === 'percentage' ? '%' : '₴';
    }
    
    if (valueInput) {
        valueInput.max = selectedType === 'percentage' ? 100 : 10000;
    }
    
    if (hintEl) {
        hintEl.textContent = selectedType === 'percentage' 
            ? 'Наприклад: 10% = нова ціна буде на 10% менша'
            : 'Наприклад: 50₴ = ціна зменшиться на 50 гривень';
    }
    
    // Calculate preview (based on 100₴ example)
    let newPrice = 100;
    if (selectedType === 'percentage') {
        newPrice = 100 - (100 * value / 100);
    } else {
        newPrice = 100 - value;
    }
    newPrice = Math.max(0, newPrice);
    
    if (previewEl) {
        previewEl.textContent = `→ ₴${newPrice.toFixed(0)}`;
    }
}

// Add event listeners for discount type and value changes
document.addEventListener('DOMContentLoaded', () => {
    // Listen for discount type changes
    document.querySelectorAll('input[name="discount-type"]').forEach(radio => {
        radio.addEventListener('change', updateDiscountPreview);
    });
    
    // Listen for value changes
    const valueInput = document.getElementById('bulk-discount-value');
    if (valueInput) {
        valueInput.addEventListener('input', updateDiscountPreview);
    }
});

// Also set up listeners when modal is opened (for dynamic content)
const discountModalObserver = new MutationObserver(() => {
    document.querySelectorAll('input[name="discount-type"]').forEach(radio => {
        radio.removeEventListener('change', updateDiscountPreview);
        radio.addEventListener('change', updateDiscountPreview);
    });
    
    const valueInput = document.getElementById('bulk-discount-value');
    if (valueInput) {
        valueInput.removeEventListener('input', updateDiscountPreview);
        valueInput.addEventListener('input', updateDiscountPreview);
    }
});

// ============================================
// BULK DISCOUNT: Apply Discount Logic
// ============================================

/**
 * Apply discount to all selected products using Firestore batch
 */
window.applyBulkDiscount = async function() {
    if (selectedProductIds.length === 0) {
        alert('Спочатку виберіть товари!');
        return;
    }
    
    const selectedType = document.querySelector('input[name="discount-type"]:checked')?.value || 'percentage';
    const valueInput = document.getElementById('bulk-discount-value');
    const discountValue = parseFloat(valueInput?.value) || 0;
    
    if (discountValue <= 0) {
        alert('Введіть коректне значення знижки!');
        return;
    }
    
    if (selectedType === 'percentage' && discountValue > 100) {
        alert('Відсоток знижки не може бути більше 100%!');
        return;
    }
    
    // Confirmation
    const count = selectedProductIds.length;
    const discountText = selectedType === 'percentage' ? `${discountValue}%` : `${discountValue}₴`;
    const confirmMsg = `Застосувати знижку ${discountText} до ${count} товарів?`;
    
    if (!confirm(confirmMsg)) {
        return;
    }
    
    // Show loading
    const applyBtn = document.querySelector('#bulk-discount-modal button[onclick="window.applyBulkDiscount()"]');
    const originalBtnText = applyBtn?.innerHTML;
    if (applyBtn) {
        applyBtn.disabled = true;
        applyBtn.innerHTML = '<div class="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mx-auto"></div>';
    }
    
    try {
        console.log(`🏷️ Applying ${selectedType} discount: ${discountValue} to ${count} products`);
        
        // Create batch
        const batch = writeBatch(db);
        let updatedCount = 0;
        
        for (const productId of selectedProductIds) {
            const productRef = doc(db, 'products', productId);
            const productSnap = await getDoc(productRef);
            
            if (!productSnap.exists()) {
                console.warn(`⚠️ Product ${productId} not found, skipping`);
                continue;
            }
            
            const productData = productSnap.data();
            const currentPrice = parseFloat(productData.price) || 0;
            
            // Determine original price (use existing or current price)
            const originalPrice = productData.originalPrice || currentPrice;
            
            // Calculate new price based on ORIGINAL price (not current discounted price)
            let newPrice;
            if (selectedType === 'percentage') {
                newPrice = originalPrice - (originalPrice * discountValue / 100);
            } else {
                newPrice = originalPrice - discountValue;
            }
            
            // Ensure price doesn't go negative
            newPrice = Math.max(0, Math.round(newPrice * 100) / 100);
            
            // Update document
            batch.update(productRef, {
                price: newPrice,
                originalPrice: originalPrice,
                isOnSale: true,
                discountType: selectedType,
                discountValue: discountValue,
                discountAppliedAt: new Date().toISOString()
            });
            
            updatedCount++;
            console.log(`  📦 ${productData.name}: ₴${originalPrice} → ₴${newPrice}`);
        }
        
        // Commit batch
        await batch.commit();
        
        console.log(`✅ Discount applied to ${updatedCount} products`);
        
        // Close modal and reload products
        window.closeBulkDiscountModal();
        window.clearProductSelection();
        await window.loadProducts();
        
        // Show success toast
        showToast(`✅ Знижку застосовано до ${updatedCount} товарів!`, 'success');
        
    } catch (error) {
        console.error('❌ Error applying bulk discount:', error);
        alert(`Помилка: ${error.message}`);
    } finally {
        if (applyBtn) {
            applyBtn.disabled = false;
            applyBtn.innerHTML = originalBtnText;
        }
    }
};

// ============================================
// BULK DISCOUNT: Remove Discount Logic
// ============================================

/**
 * Remove discount from all selected products
 */
window.removeBulkDiscount = async function() {
    if (selectedProductIds.length === 0) {
        alert('Спочатку виберіть товари!');
        return;
    }
    
    const count = selectedProductIds.length;
    const confirmMsg = `Зняти знижку з ${count} товарів та повернути оригінальні ціни?`;
    
    if (!confirm(confirmMsg)) {
        return;
    }
    
    // Show loading toast
    const loadingToast = document.createElement('div');
    loadingToast.className = 'fixed top-4 right-4 bg-blue-600 text-white px-6 py-4 rounded-xl shadow-2xl z-[100] flex items-center gap-3';
    loadingToast.innerHTML = `
        <div class="animate-spin w-6 h-6 border-3 border-white border-t-transparent rounded-full"></div>
        <span class="font-semibold">Знімаю знижки...</span>
    `;
    document.body.appendChild(loadingToast);
    
    try {
        console.log(`❌ Removing discount from ${count} products`);
        
        // Create batch
        const batch = writeBatch(db);
        let restoredCount = 0;
        
        for (const productId of selectedProductIds) {
            const productRef = doc(db, 'products', productId);
            const productSnap = await getDoc(productRef);
            
            if (!productSnap.exists()) {
                console.warn(`⚠️ Product ${productId} not found, skipping`);
                continue;
            }
            
            const productData = productSnap.data();
            const originalPrice = productData.originalPrice;
            
            if (!originalPrice && originalPrice !== 0) {
                console.log(`  ℹ️ ${productData.name}: No original price, skipping`);
                continue;
            }
            
            // Restore original price
            batch.update(productRef, {
                price: originalPrice,
                originalPrice: null,
                isOnSale: false,
                discountType: null,
                discountValue: null,
                discountAppliedAt: null,
                discountRemovedAt: new Date().toISOString()
            });
            
            restoredCount++;
            console.log(`  📦 ${productData.name}: restored to ₴${originalPrice}`);
        }
        
        // Commit batch
        await batch.commit();
        
        console.log(`✅ Discount removed from ${restoredCount} products`);
        
        // Remove loading toast
        loadingToast.remove();
        
        // Clear selection and reload
        window.clearProductSelection();
        await window.loadProducts();
        
        // Show success toast
        showToast(`✅ Знижку знято з ${restoredCount} товарів!`, 'success');
        
    } catch (error) {
        console.error('❌ Error removing bulk discount:', error);
        loadingToast.remove();
        alert(`Помилка: ${error.message}`);
    }
};

/**
 * Helper function to show toast notifications
 */
function showToast(message, type = 'info') {
    const colors = {
        success: 'bg-green-600',
        error: 'bg-red-600',
        info: 'bg-blue-600',
        warning: 'bg-yellow-600'
    };
    
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 ${colors[type] || colors.info} text-white px-6 py-4 rounded-xl shadow-2xl z-[100] animate-slide-in`;
    toast.innerHTML = `<span class="font-semibold">${message}</span>`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Export showToast for external modules (e.g., reviews module)
window.showToast = showToast;

// ============================================
// TOGGLE PRODUCT VISIBILITY
// ============================================
// UPDATE PRODUCT VISIBILITY
// ============================================

/**
 * Update product visibility on the live website
 * @param {string} productId - The product document ID
 * @param {boolean} isVisible - New visibility state from checkbox
 */
window.updateProductVisibility = async function(productId, isVisible) {
    try {
        console.log(`👁️ Updating visibility for product ${productId} to: ${isVisible}`);
        
        // Update Firestore
        const productRef = doc(db, 'products', productId);
        await updateDoc(productRef, {
            isVisible: isVisible
        });
        
        const statusText = isVisible ? 'видимий' : 'прихований';
        console.log(`✅ SUCCESS: Product ${productId} is now ${statusText}`);
        
        // Show toast notification
        showToast(`✅ Товар тепер ${statusText} на сайті`, 'success');
        
    } catch (error) {
        console.error('❌ ERROR updating product visibility:', error);
        showToast(`❌ Помилка: ${error.message}`, 'error');
        
        // Reload products to restore correct state
        await window.loadProducts();
    }
};

// ============================================
// RENDER WAREHOUSE (FIXED WITH BACKTICKS)
// ============================================
window.renderWarehouse = async function() {
    console.log('📦 Loading warehouse inventory...');
    const container = document.getElementById('inventory-list');
    
    if (!container) {
        console.warn('⚠️ inventory-list element not found');
        return;
    }
    
    try {
        const snapshot = await getDocs(collection(db, 'products'));
        
        if (snapshot.empty) {
            container.innerHTML = `
                <div class="text-center py-10">
                    <i data-lucide="package-x" class="w-16 h-16 text-gray-300 mx-auto mb-4"></i>
                    <p class="text-gray-600">Товарів ще немає</p>
                </div>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }
        
        // ✅ FIXED: Using backticks
        let tableHTML = `
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-50 border-b">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Товар</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Артикул</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Залишок</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дії</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
        `;
        
        snapshot.forEach(docSnap => {
            const product = docSnap.data();
            const productId = docSnap.id;
            const stock = product.stock || 0;
            const productImage = product.images?.[0] || product.image || '/images/placeholder.jpg';
            
            let rowClass = '';
            let stockClass = '';
            
            if (stock === 0) {
                rowClass = 'bg-red-50';
                stockClass = 'text-red-600 font-semibold';
            } else if (stock < 5) {
                stockClass = 'text-orange-600 font-semibold';
            }
            
            // ✅ FIXED: Using backticks
            tableHTML += `
                <tr class="${rowClass}" data-product-id="${productId}">
                    <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                            <img src="${productImage}" 
                                 alt="${product.name || 'Product'}" 
                                 class="w-12 h-12 rounded-lg object-cover border"
                                 onerror="this.src='https://placehold.co/50'">
                            <div>
                                <p class="font-medium text-gray-900">${product.name || 'Без назви'}</p>
                                <p class="text-sm text-gray-500">${product.price || 0} ₴</p>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-600">${product.sku || 'N/A'}</td>
                    <td class="px-6 py-4">
                        <input type="number" 
                               id="stock-${productId}" 
                               value="${stock}" 
                               min="0" 
                               class="w-24 border rounded-lg px-3 py-2 text-center ${stockClass}"
                               data-original="${stock}">
                    </td>
                    <td class="px-6 py-4">
                        <button onclick="window.updateStock('${productId}')" 
                                id="save-btn-${productId}"
                                class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                            <span>💾</span>
                            <span>Зберегти</span>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tableHTML += `
                    </tbody>
                </table>
            </div>
        `;
        
        container.innerHTML = tableHTML;
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        console.log('✅ Warehouse inventory loaded');
        
    } catch (error) {
        console.error('❌ Error loading warehouse:', error);
        container.innerHTML = `
            <div class="text-center py-10 text-red-600">
                <p>Помилка завантаження: ${error.message}</p>
            </div>
        `;
    }
};

// ============================================
// UPDATE STOCK (FIXED)
// ============================================
window.updateStock = async function(productId) {
    const input = document.getElementById(`stock-${productId}`);
    const saveBtn = document.getElementById(`save-btn-${productId}`);
    
    if (!input || !saveBtn) {
        console.error('❌ Elements not found for product:', productId);
        return;
    }
    
    const newStock = parseInt(input.value);
    const originalStock = parseInt(input.dataset.original);
    
    if (newStock === originalStock) {
        console.log('ℹ️ No changes detected');
        return;
    }
    
    if (newStock < 0) {
        alert('Залишок не може бути від\'ємним!');
        input.value = originalStock;
        return;
    }
    
    const originalBtnHTML = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<div class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mx-auto"></div>';
    
    try {
        console.log(`📦 Updating stock for ${productId}: ${originalStock} → ${newStock}`);
        
        await updateDoc(doc(db, 'products', productId), {
            stock: newStock,
            updatedAt: new Date().toISOString()
        });
        
        input.dataset.original = newStock;
        saveBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
        saveBtn.classList.add('bg-green-600');
        saveBtn.innerHTML = '<span>✅</span><span>Збережено</span>';
        
        const row = saveBtn.closest('tr');
        if (row) {
            row.classList.remove('bg-red-50');
            input.classList.remove('text-red-600', 'text-orange-600', 'font-semibold');
            
            if (newStock === 0) {
                row.classList.add('bg-red-50');
                input.classList.add('text-red-600', 'font-semibold');
            } else if (newStock < 5) {
                input.classList.add('text-orange-600', 'font-semibold');
            }
        }
        
        setTimeout(() => {
            saveBtn.classList.remove('bg-green-600');
            saveBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
            saveBtn.innerHTML = originalBtnHTML;
            saveBtn.disabled = false;
        }, 2000);
        
        console.log('✅ Stock updated successfully');
        
    } catch (error) {
        console.error('❌ Error updating stock:', error);
        alert(`Помилка: ${error.message}`);
        input.value = originalStock;
        saveBtn.innerHTML = originalBtnHTML;
        saveBtn.disabled = false;
    }
};

// ============================================
// LOAD ABANDONED CARTS (FIXED WITH BACKTICKS)
// ============================================
window.loadAbandonedCarts = async function() {
    const list = document.getElementById('abandoned-carts-list');
    
    if (!list) {
        console.warn('⚠️ abandoned-carts-list element not found');
        return;
    }
    
    list.innerHTML = '<tr><td colspan="6" class="text-center py-10"><div class="animate-spin w-8 h-8 border-4 border-spicy border-t-transparent rounded-full mx-auto"></div></td></tr>';
    
    try {
        // Calculate 7 days ago
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        // Query abandoned_carts collection
        const cartsQuery = query(
            collection(db, 'abandoned_carts'),
            orderBy('updatedAt', 'desc')
        );
        
        const snapshot = await getDocs(cartsQuery);
        
        if (snapshot.empty) {
            list.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-10">
                        <div class="flex flex-col items-center gap-3">
                            <i data-lucide="shopping-cart" class="w-16 h-16 text-gray-300"></i>
                            <p class="text-gray-500 font-medium">Немає покинутих кошиків</p>
                        </div>
                    </td>
                </tr>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }
        
        // Filter carts from last 7 days
        const filteredCarts = [];
        snapshot.forEach(docSnap => {
            const cart = docSnap.data();
            const cartDate = cart.updatedAt?.toDate ? cart.updatedAt.toDate() : null;
            const isArchived = cart.archived === true;
            
            // Filter by archive view mode
            if (showArchivedCarts && !isArchived) return;
            if (!showArchivedCarts && isArchived) return;
            
            // Only show carts from last 7 days
            if (cartDate && cartDate >= sevenDaysAgo) {
                filteredCarts.push({
                    phone: docSnap.id,
                    data: cart,
                    date: cartDate
                });
            }
        });
        
        if (filteredCarts.length === 0) {
            const emptyMessage = showArchivedCarts 
                ? 'Немає архівованих кошиків'
                : 'Немає покинутих кошиків за останні 7 днів';
            list.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-10">
                        <p class="text-gray-500 font-medium">${emptyMessage}</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Build table rows - ✅ FIXED: Using backticks
        let html = '';
        filteredCarts.forEach(({ phone, data: cart, date }) => {
            const customerName = cart.customer?.fullName || 'Не вказано';
            const customerPhone = cart.customer?.phone || phone;
            const items = cart.items || [];
            const total = cart.total || 0;
            
            // Format date
            const dateStr = date.toLocaleString('uk-UA', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // Cart summary
            const itemCount = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
            const itemsSummary = `${itemCount} ${itemCount === 1 ? 'товар' : itemCount < 5 ? 'товари' : 'товарів'}`;
            
            const borderColor = showArchivedCarts ? 'border-gray-400' : 'border-blue-400';
            const hoverColor = showArchivedCarts ? 'hover:bg-gray-50' : 'hover:bg-blue-50';
            
            html += `
                <tr class="${hoverColor} transition-all duration-200 border-l-4 ${borderColor}">
                    <td class="px-4 py-4 text-center">
                        <input type="checkbox" class="abandoned-cart-checkbox w-4 h-4 rounded border-gray-300 text-blue-600" data-cart-id="${phone}">
                    </td>
                    <td class="px-6 py-4">
                        <div class="text-xs text-gray-500 mb-1">${dateStr}</div>
                    </td>
                    <td class="px-6 py-4">
                        <div class="text-sm font-semibold text-gray-900">${customerName}</div>
                        <div class="text-xs text-gray-500 mt-0.5">📞 ${customerPhone}</div>
                    </td>
                    <td class="px-6 py-4">
                        <div class="text-sm text-gray-700">${itemsSummary}</div>
                    </td>
                    <td class="px-6 py-4">
                        <div class="text-base font-extrabold text-blue-600">₴${total}</div>
                    </td>
                    <td class="px-6 py-4 text-right">
                        <div class="flex items-center justify-end gap-2">
                            ${!showArchivedCarts ? `
                            <button onclick="window.showCrmTransferModal('${phone}')" 
                                    class="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors shadow-sm flex items-center gap-1" 
                                    title="Передати в CRM">
                                <i data-lucide="send" class="w-4 h-4"></i>
                                <span class="text-xs font-semibold">CRM</span>
                            </button>
                            <button onclick="sendRecoverySMS('${phone}')" 
                                    class="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors shadow-sm flex items-center gap-1" 
                                    title="Відправити SMS для відновлення">
                                <i data-lucide="mail" class="w-4 h-4"></i>
                                <span class="text-xs font-semibold">SMS</span>
                            </button>
                            ` : ''}
                            <button onclick="window.convertToOrder('${phone}')" 
                                    class="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded transition-colors shadow-sm" 
                                    title="Створити замовлення">
                                <span>Замовлення</span>
                            </button>
                            <button onclick="window.viewAbandonedCartDetails('${phone}')" 
                                    class="p-2 hover:bg-white rounded-lg transition-colors shadow-sm" 
                                    title="Переглянути деталі">
                                <i data-lucide="eye" class="w-5 h-5 text-gray-600"></i>
                            </button>
                            <button onclick="window.deleteAbandonedCart('${phone}')" 
                                    class="p-2 hover:bg-red-50 rounded-lg transition-colors shadow-sm" 
                                    title="Видалити">
                                <i data-lucide="trash-2" class="w-5 h-5 text-red-600"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        list.innerHTML = html;
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        // Reset selection state after loading
        if (typeof deselectAllAbandonedCarts === 'function') {
            deselectAllAbandonedCarts();
        }
        
        console.log('✅ Abandoned carts loaded successfully');
        
    } catch (e) {
        list.innerHTML = `<tr><td colspan="6" class="text-red-500 text-center py-10">Помилка: ${e.message}</td></tr>`;
        console.error('❌ Error loading abandoned carts:', e);
    }
};

// ============================================
// VIEW ABANDONED CART DETAILS (FIXED)
// ============================================
window.viewAbandonedCartDetails = async function(phone) {
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
        const paymentStyle = hasPaymentMethod ? 'text-gray-900 font-semibold' : 'text-gray-500 italic';
        
        // Build items HTML - ✅ FIXED: Using backticks
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
        
        // Show modal - ✅ FIXED: Using backticks
        const modalHtml = `
            <div id="cart-details-modal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onclick="if(event.target === this) this.remove()">
                <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                        <h3 class="text-xl font-bold text-gray-900">🛒 Деталі покинутого кошика</h3>
                        <button onclick="this.closest('#cart-details-modal').remove()" class="p-2 hover:bg-gray-100 rounded-lg">
                            <i data-lucide="x" class="w-5 h-5"></i>
                        </button>
                    </div>
                    
                    <div class="p-6 space-y-6">
                        <div class="bg-blue-50 rounded-xl p-4">
                            <h4 class="font-bold text-gray-900 mb-3">👤 Контактні дані</h4>
                            <div class="space-y-2 text-sm">
                                <div><strong>Ім'я:</strong> ${customer.fullName || 'Не вказано'}</div>
                                <div><strong>Телефон:</strong> <a href="tel:${customer.phone || phone}" class="text-blue-600">📞 ${customer.phone || phone}</a></div>
                            </div>
                        </div>
                        
                        <div class="bg-gray-50 border border-gray-200 rounded-xl p-4">
                            <h4 class="font-bold text-gray-900 mb-3">💳 Спосіб оплати</h4>
                            <div class="text-sm">
                                <p class="${paymentStyle}">${paymentMethodDisplay}</p>
                            </div>
                        </div>
                        
                        <div>
                            <h4 class="font-bold text-gray-900 mb-3">🛍️ Товари в кошику</h4>
                            <div class="space-y-2">
                                ${itemsHtml}
                            </div>
                        </div>
                        
                        <div class="bg-gray-50 rounded-xl p-4">
                            <div class="flex items-center justify-between">
                                <span class="text-lg font-bold text-gray-900">Загальна сума:</span>
                                <span class="text-2xl font-extrabold text-blue-600">₴${total}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
    } catch (e) {
        console.error('❌ Error viewing cart details:', e);
        alert(`Помилка: ${e.message}`);
    }
};

// ============================================
// DELETE ABANDONED CART
// ============================================
window.deleteAbandonedCart = async function(phone) {
    if (!confirm(`⚠️ Видалити покинутий кошик?\n\nТелефон: ${phone}`)) return;
    
    try {
        await deleteDoc(doc(db, 'abandoned_carts', phone));
        
        // Show toast
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-xl shadow-2xl z-[100]';
        toast.textContent = 'Кошик видалено!';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
        
        // Reload list
        loadAbandonedCarts();
    } catch (e) {
        console.error('❌ Error deleting cart:', e);
        alert(`Помилка: ${e.message}`);
    }
};

// ============================================
// CONVERT ABANDONED CART TO ORDER
// ============================================
window.convertToOrder = async function(cartId) {
    try {
        console.log('🔄 Converting cart to order:', cartId);
        
        // Step 1: Get the abandoned cart data
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
        
        // Step 2: Create order data from cart
        const orderData = {
            // Customer info
            customer: {
                fullName: cartData.customer?.fullName || '',
                phone: cartData.customer?.phone || cartId,
                email: cartData.customer?.email || '',
                telegram: cartData.customer?.telegram || ''
            },
            
            // Items from cart
            items: cartData.items || [],
            
            // Order summary
            summary: {
                total: cartData.total || 0,
                itemCount: (cartData.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0),
                subtotal: cartData.subtotal || cartData.total || 0,
                deliveryFee: cartData.deliveryFee || 0
            },
            
            // Delivery info (if available)
            delivery: cartData.delivery || {
                method: 'Не вказано',
                address: 'Не вказано',
                city: cartData.delivery?.city || ''
            },
            
            // Payment info
            payment: {
                method: cartData.payment?.method || 'Не вказано',
                status: 'pending'
            },
            
            // Order status
            status: 'new',
            
            // Timestamps (CRITICAL: Must use serverTimestamp() for Firestore Timestamp object)
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            
            // Meta fields for filtering (prevents issues with archived/hidden orders)
            viewed: false,
            isArchived: false,
            
            // Source tracking
            source: 'abandoned_cart_conversion',
            originalCartId: cartId,
            
            // Comment if any
            comment: cartData.comment || 'Створено з покинутого кошика'
        };
        
        // Step 3: Save order to Firestore using TRANSACTION for safety
        let orderId = null;
        
        try {
            // Create the order
            const orderRef = await addDoc(collection(db, 'orders'), orderData);
            orderId = orderRef.id;
            console.log('✅ Order created:', orderId);
            
            // Step 4: Delete the abandoned cart (only after successful order creation)
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
                        <div class="text-xs opacity-90">ID: ${orderId.substring(0, 8)}</div>
                    </div>
                </div>
            `;
            document.body.appendChild(successToast);
            setTimeout(() => successToast.remove(), 5000);
            
            // Reload the abandoned carts list
            loadAbandonedCarts();
            
            // CRITICAL: Refresh orders if currently viewing orders page
            // The real-time listener should auto-update, but we'll trigger a manual refresh just in case
            if (typeof window.loadOrders === 'function') {
                console.log('🔄 Triggering orders refresh...');
                window.loadOrders();
            }
            
            console.log('🎉 Cart successfully converted to order');
            
        } catch (firestoreError) {
            // If order creation or cart deletion fails, show error
            loadingToast.remove();
            throw new Error(`Помилка збереження: ${firestoreError.message}`);
        }
        
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
// EXCEL IMPORT FUNCTIONALITY
// ============================================

// Global state for import
window.parsedImportData = []; // CRITICAL: Global variable for parsed Excel data
let importFileName = '';

// Field mapping options (supports Shopify export)
const FIELD_MAPPINGS = [
    { value: 'skip', label: '⏭️ Пропустити' },
    { value: 'name', label: '📝 Назва товару (Title)' },
    { value: 'price', label: '💰 Ціна (Variant Price)' },
    { value: 'sku', label: '🏷️ Артикул (Variant SKU)' },
    { value: 'handle', label: '🔗 Handle (резервний SKU)' },
    { value: 'category', label: '📁 Категорія (Type)' },
    { value: 'description', label: '📄 Опис (Body HTML)' },
    { value: 'spiciness', label: '🌶️ Гострота (1-5)' },
    { value: 'image', label: '🖼️ Зображення (Image Src)' },
    { value: 'stock', label: '📦 Залишок (Inventory Qty)' },
    { value: 'tags', label: '🏷️ Теги (Tags)' },
    { value: 'vendor', label: '🏪 Постачальник (Vendor)' },
    { value: 'status', label: '✅ Статус (Status)' }
];

// Open Import Modal
window.openImportModal = function() {
    console.log('📊 Opening import modal...');
    const modal = document.getElementById('import-modal');
    if (modal) {
        modal.classList.remove('hidden');
        resetImportState();
        // Initialize dropzone if not already done
        initImportDropzone();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    } else {
        console.error('❌ Import modal not found!');
        alert('Помилка: модальне вікно імпорту не знайдено!');
    }
};

// Close Import Modal
window.closeImportModal = function() {
    console.log('📊 Closing import modal...');
    const modal = document.getElementById('import-modal');
    if (modal) {
        modal.classList.add('hidden');
        resetImportState();
    }
};

// Reset import state
function resetImportState() {
    window.parsedImportData = [];
    importFileName = '';
    
    // Reset file input
    const fileInput = document.getElementById('import-file-input');
    if (fileInput) fileInput.value = '';
    
    // Show upload step, hide others
    showImportStep('upload');
    
    // Reset file info
    const fileInfo = document.getElementById('import-file-info');
    if (fileInfo) fileInfo.classList.add('hidden');
}

window.resetImportFile = function() {
    resetImportState();
};

// Show specific import step
function showImportStep(step) {
    const steps = ['upload', 'mapping', 'progress', 'success'];
    steps.forEach(s => {
        const el = document.getElementById(`import-step-${s}`);
        if (el) {
            el.classList.toggle('hidden', s !== step);
        }
    });
}

// Go back to upload step
window.goToUploadStep = function() {
    showImportStep('upload');
};

// Initialize drag & drop and file input
function initImportDropzone() {
    const dropzone = document.getElementById('import-dropzone');
    const fileInput = document.getElementById('import-file-input');
    
    if (dropzone) {
        // Drag & drop events
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('border-green-500', 'bg-green-50');
        });
        
        dropzone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropzone.classList.remove('border-green-500', 'bg-green-50');
        });
        
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('border-green-500', 'bg-green-50');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFileUpload(files[0]);
            }
        });
    }
    
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFileUpload(e.target.files[0]);
            }
        });
    }
}

// Initialize on DOM ready or immediately if already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initImportDropzone);
} else {
    initImportDropzone();
}

// Handle file upload
// ============================================
// HANDLE FILE UPLOAD (REWRITTEN)
// ============================================
function handleFileUpload(file) {
    console.log('📁 Handling file upload:', file.name);
    
    // Validate file type
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
        alert('❌ Непідтримуваний формат файлу!\nПідтримуються: .xlsx, .xls, .csv');
        return;
    }
    
    importFileName = file.name;
    
    // Read file with SheetJS
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // Get first sheet
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // ============================================
            // CRITICAL: Use { header: 1, defval: '' }
            // header: 1 - Returns Array of Arrays (never loses columns)
            // defval: '' - Empty cells become empty strings (not undefined)
            // ============================================
            const arrayData = XLSX.utils.sheet_to_json(worksheet, { 
                header: 1, 
                defval: '' 
            });
            
            if (!arrayData || arrayData.length < 2) {
                alert('❌ Файл порожній або містить тільки заголовки!');
                return;
            }
            
            console.log(`✅ Parsed ${arrayData.length} rows with ${arrayData[0].length} columns`);
            console.log('📋 First row (headers):', arrayData[0]);
            console.log('📋 Second row (sample data):', arrayData[1]);
            
            // Extract headers and data
            const headers = arrayData[0];
            const dataRows = arrayData.slice(1);
            
            // Store globally for import execution
            window.importHeaders = headers;
            window.importData = dataRows;
            
            // Render preview modal
            renderImportPreview(headers, dataRows);
            
        } catch (error) {
            console.error('❌ Error parsing Excel file:', error);
            alert(`❌ Помилка читання файлу: ${error.message}`);
        }
    };
    
    reader.readAsArrayBuffer(file);
}

// ============================================
// RENDER IMPORT PREVIEW TABLE (COMPLETELY REWRITTEN)
// ============================================
// RENDER IMPORT PREVIEW TABLE (WITH GLOBAL STATE CACHING)
// ============================================
/**
 * Renders a full-screen Excel-like import preview modal
 * @param {Array<string>} headers - Column headers from the CSV/Excel file
 * @param {Array<Array<string>>} previewData - All data rows for preview
 */
function renderImportPreview(headers, previewData) {
  console.log('🎨 renderImportPreview called with:', headers.length, 'columns,', previewData.length, 'rows');
  
  // ============================================
  // STEP 1: CACHE DATA GLOBALLY (CRITICAL!)
  // ============================================
  window.cachedImportData = previewData;
  window.cachedHeaders = headers;
  console.log('✅ Data cached to window.cachedImportData:', window.cachedImportData.length, 'rows');
  console.log('✅ Headers cached to window.cachedHeaders:', window.cachedHeaders.length, 'columns');
  
  // Define available Firestore field mappings
  const fieldMappings = [
    { value: '', label: '-- Пропустити --' },
    { value: 'name', label: '📦 Назва товару (обов\'язково)' },
    { value: 'price', label: '💰 Ціна (обов\'язково)' },
    { value: 'sku', label: '🔖 Артикул (SKU)' },
    { value: 'description', label: '📝 Короткий опис' },
    { value: 'fullDescription', label: '📄 Детальний опис' },
    { value: 'category', label: '🏷️ Категорія' },
    { value: 'spiciness', label: '🌶️ Гострота (1-5)' },
    { value: 'specs', label: '⚙️ Характеристики' },
    { value: 'ingredients', label: '🧪 Склад' },
    { value: 'imageUrl', label: '🖼️ URL фото' },
    { value: 'tags', label: '🏷️ Теги (через кому)' },
    { value: 'isHot', label: '🔥 Хіт продажів (так/ні)' }
  ];

  // Auto-detect Shopify columns
  const shopifyMapping = {
    'title': 'name',
    'variant price': 'price',
    'variant sku': 'sku',
    'body (html)': 'fullDescription',
    'type': 'category',
    'tags': 'tags',
    'image src': 'imageUrl'
  };

  // Auto-map columns
  const columnMappings = headers.map(header => {
    const normalized = header.toLowerCase().trim();
    
    // Check Shopify mapping
    if (shopifyMapping[normalized]) {
      return shopifyMapping[normalized];
    }
    
    // Check Ukrainian/direct matches
    if (normalized.includes('назва') || normalized === 'name') return 'name';
    if (normalized.includes('ціна') || normalized === 'price') return 'price';
    if (normalized.includes('артикул') || normalized === 'sku') return 'sku';
    if (normalized.includes('опис') || normalized === 'description') return 'description';
    if (normalized.includes('категор') || normalized === 'category') return 'category';
    if (normalized.includes('фото') || normalized.includes('image')) return 'imageUrl';
    
    return ''; // Skip by default
  });

  // ============================================
  // STEP 1: Build the options HTML ONCE
  // ============================================
  const optionsHtml = fieldMappings.map(field => 
    '<option value="' + field.value + '">' + field.label + '</option>'
  ).join('');
  
  console.log('✅ Options HTML built:', optionsHtml.length, 'characters');

  // ============================================
  // STEP 2: Build Header Row with Dropdowns for EVERY Column
  // ============================================
  let tableHeaderHTML = '';
  
  for (let i = 0; i < headers.length; i++) {
    const headerName = headers[i];
    const autoMapping = columnMappings[i] || '';
    
    // Build select element with pre-selected value
    let selectHtml = '<select data-col-index="' + i + '" ' +
      'class="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm font-semibold focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all bg-white" ' +
      'onchange="window.updateColumnMapping(' + i + ', this.value)">';
    
    // Add all options with selected state
    for (let j = 0; j < fieldMappings.length; j++) {
      const field = fieldMappings[j];
      const selected = (field.value === autoMapping) ? ' selected' : '';
      selectHtml += '<option value="' + field.value + '"' + selected + '>' + field.label + '</option>';
    }
    
    selectHtml += '</select>';
    
    // Build complete <th>
    tableHeaderHTML += 
      '<th class="whitespace-nowrap px-4 py-2 border border-gray-300 min-w-[200px] bg-gradient-to-b from-gray-100 to-gray-50">' +
        '<div class="space-y-2">' +
          '<div class="font-bold text-gray-700 text-xs uppercase tracking-wide flex items-center gap-2">' +
            '<span class="text-blue-600">📊</span>' +
            '<span>' + headerName + '</span>' +
          '</div>' +
          selectHtml +
        '</div>' +
      '</th>';
  }
  
  console.log('✅ Header HTML generated for', headers.length, 'columns');

  // ============================================
  // STEP 3: Build Body Rows
  // ============================================
  let tableBodyHTML = '';
  
  for (let rowIdx = 0; rowIdx < previewData.length; rowIdx++) {
    const row = previewData[rowIdx];
    tableBodyHTML += '<tr class="hover:bg-blue-50 transition-colors">';
    
    for (let colIdx = 0; colIdx < headers.length; colIdx++) {
      const cellValue = row[colIdx] || '';
      const displayValue = cellValue ? cellValue : '<span class="text-gray-400 italic">порожньо</span>';
      
      tableBodyHTML += 
        '<td class="whitespace-nowrap px-4 py-2 border border-gray-200 min-w-[200px] text-sm text-gray-700">' +
          displayValue +
        '</td>';
    }
    
    tableBodyHTML += '</tr>';
  }
  
  console.log('✅ Body HTML generated for', previewData.length, 'rows');

  // ============================================
  // STEP 4: Build Complete Modal HTML
  // ============================================
  const modalHTML = 
    '<div id="import-preview-modal" class="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">' +
      '<div class="w-[98vw] h-[95vh] bg-white rounded-lg shadow-2xl flex flex-col">' +
        
        '<!-- Modal Header -->' +
        '<div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50 flex justify-between items-center flex-shrink-0">' +
          '<div class="flex items-center gap-4">' +
            '<div class="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">' +
              '<span class="text-2xl">📊</span>' +
            '</div>' +
            '<div>' +
              '<h3 class="text-2xl font-bold text-gray-900">Попередній перегляд імпорту</h3>' +
              '<p class="text-sm text-gray-600">' +
                'Знайдено: <strong>' + headers.length + ' колонок</strong>, ' +
                'показано <strong>' + previewData.length + ' рядків</strong> для перегляду' +
              '</p>' +
            '</div>' +
          '</div>' +
          '<button onclick="window.closeImportPreview()" class="p-2 hover:bg-white hover:bg-opacity-80 rounded-full transition-colors">' +
            '<i data-lucide="x" class="w-6 h-6 text-gray-600"></i>' +
          '</button>' +
        '</div>' +
        
        '<!-- Instructions Banner -->' +
        '<div class="px-6 py-3 bg-blue-50 border-b border-blue-200 flex items-center gap-3 flex-shrink-0">' +
          '<i data-lucide="info" class="w-5 h-5 text-blue-600 flex-shrink-0"></i>' +
          '<p class="text-sm text-blue-800">' +
            '<strong>Інструкція:</strong> Виберіть у випадаючих списках (зверху кожної колонки), які поля Firestore відповідають колонкам вашого файлу. ' +
            'Поля <strong>Назва</strong> та <strong>Ціна</strong> обов\'язкові. Прокручуйте таблицю → щоб побачити всі колонки.' +
          '</p>' +
        '</div>' +
        
        '<!-- Table Wrapper (Scrollable Area) -->' +
        '<div class="flex-1 overflow-auto border-t border-gray-300 relative">' +
          '<table class="min-w-max border-collapse table-auto w-full">' +
            '<thead class="sticky top-0 bg-gray-100 z-10 shadow-sm">' +
              '<tr>' +
                tableHeaderHTML +
              '</tr>' +
            '</thead>' +
            '<tbody class="bg-white divide-y divide-gray-200">' +
              tableBodyHTML +
            '</tbody>' +
          '</table>' +
        '</div>' +
        
        '<!-- Scroll Hint -->' +
        '<div class="px-6 py-2 bg-yellow-50 border-t border-yellow-200 flex items-center justify-between flex-shrink-0">' +
          '<div class="flex items-center gap-2 text-sm text-yellow-800">' +
            '<i data-lucide="alert-triangle" class="w-4 h-4"></i>' +
            '<span>Рядки без назви або ціни будуть пропущені під час імпорту</span>' +
          '</div>' +
          '<div class="flex items-center gap-2 text-sm text-blue-700 font-semibold">' +
            '<i data-lucide="arrow-left-right" class="w-4 h-4"></i>' +
            '<span>Прокручуйте таблицю →</span>' +
          '</div>' +
        '</div>' +
        
        '<!-- Modal Footer -->' +
        '<div class="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3 flex-shrink-0">' +
          '<button onclick="window.closeImportPreview()" class="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold transition-colors">' +
            'Скасувати' +
          '</button>' +
          '<button onclick="window.executeImportWithMappings()" class="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2">' +
            '<i data-lucide="upload" class="w-5 h-5"></i>' +
            '<span>Імпортувати товари (' + previewData.length + '+ рядків)</span>' +
          '</button>' +
        '</div>' +
        
      '</div>' +
    '</div>';

  console.log('✅ Modal HTML constructed');

  // Remove existing modal if present
  const existingModal = document.getElementById('import-preview-modal');
  if (existingModal) {
    existingModal.remove();
  }

  // Inject modal into DOM
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  console.log('✅ Modal injected into DOM');

  // Re-initialize Lucide icons for the new modal
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // Store mappings globally for later use
  window.currentColumnMappings = columnMappings;
  window.currentHeaders = headers;
  window.currentPreviewData = previewData;
  
  console.log('✅ renderImportPreview completed successfully');
}

/**
 * Update column mapping when dropdown changes
 */
window.updateColumnMapping = function(columnIndex, newValue) {
  if (!window.currentColumnMappings) {
    window.currentColumnMappings = [];
  }
  window.currentColumnMappings[columnIndex] = newValue;
  console.log(`Column ${columnIndex} mapped to: ${newValue}`);
};

/**
 * Close the import preview modal
 */
window.closeImportPreview = function() {
  const modal = document.getElementById('import-preview-modal');
  if (modal) {
    modal.remove();
  }
  // Clean up global variables
  delete window.currentColumnMappings;
  delete window.currentHeaders;
  delete window.currentPreviewData;
};

/**
 * Execute import with current column mappings - FINAL FIRESTORE UPLOAD
 * Uses cached data from window.cachedImportData and window.cachedHeaders
 */
window.executeImportWithMappings = async function() {
  try {
    console.log('🚀 Starting executeImportWithMappings...');
    
    // ============================================
    // STEP 1: RETRIEVE CACHED DATA WITH SAFETY CHECKS
    // ============================================
    const data = window.cachedImportData;
    const headers = window.cachedHeaders;
    
    console.log('📦 Retrieved cached data:', data ? data.length : 'undefined', 'rows');
    console.log('📦 Retrieved cached headers:', headers ? headers.length : 'undefined', 'columns');
    
    // CRITICAL SAFETY CHECK
    if (!data || !Array.isArray(data) || data.length === 0) {
      alert('❌ Помилка: Дані втрачено. Спробуйте завантажити файл знову.');
      console.error('❌ No cached data found!');
      return;
    }
    
    if (!headers || !Array.isArray(headers) || headers.length === 0) {
      alert('❌ Помилка: Заголовки втрачено. Спробуйте завантажити файл знову.');
      console.error('❌ No cached headers found!');
      return;
    }
    
    // ============================================
    // STEP 2: GET COLUMN MAPPINGS FROM DROPDOWNS
    // ============================================
    const selects = document.querySelectorAll('#import-preview-modal select[data-col-index]');
    const columnMappings = [];
    
    selects.forEach(select => {
      const colIndex = parseInt(select.getAttribute('data-col-index'));
      const fieldName = select.value;
      columnMappings[colIndex] = fieldName;
    });
    
    console.log('📊 Column Mappings:', columnMappings);
    
    // Validate required fields
    const hasName = columnMappings.includes('name');
    const hasPrice = columnMappings.includes('price');
    
    if (!hasName || !hasPrice) {
      alert('❌ Помилка: Необхідно вказати поля "Назва товару" та "Ціна"');
      return;
    }
    
    // Close preview modal
    window.closeImportPreview();
    
    // ============================================
    // STEP 3: SHOW PROGRESS MODAL
    // ============================================
    const progressHtml = 
      '<div id="import-progress-modal" class="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-4">' +
        '<div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">' +
          '<div class="text-center">' +
            '<div class="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center animate-pulse">' +
              '<span class="text-4xl">📦</span>' +
            '</div>' +
            '<h3 class="text-2xl font-bold text-gray-900 mb-2">Імпорт товарів</h3>' +
            '<p class="text-gray-600 mb-6">Завантаження даних до Firestore...</p>' +
            '<div class="relative pt-1">' +
              '<div class="flex mb-2 items-center justify-between">' +
                '<div>' +
                  '<span class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">' +
                    'В процесі' +
                  '</span>' +
                '</div>' +
                '<div class="text-right">' +
                  '<span id="progress-text" class="text-xs font-semibold inline-block text-green-600">' +
                    '0%' +
                  '</span>' +
                '</div>' +
              '</div>' +
              '<div class="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-200">' +
                '<div id="progress-bar" style="width:0%" class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500 transition-all duration-300"></div>' +
              '</div>' +
            '</div>' +
            '<p id="progress-status" class="text-sm text-gray-500"></p>' +
          '</div>' +
        '</div>' +
      '</div>';
    
    document.body.insertAdjacentHTML('beforeend', progressHtml);
    
    // ============================================
    // STEP 4: MAP DATA TO PRODUCTS (WITH NULL CHECKS)
    // ============================================
    const productsToImport = [];
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      // SKIP EMPTY OR NULL ROWS
      if (!row || !Array.isArray(row)) {
        console.warn(`⚠️ Row ${i+2} skipped: Row is null or not an array`);
        continue;
      }
      
      const product = {};
      
      // Map each column to Firestore field
      for (let colIdx = 0; colIdx < columnMappings.length; colIdx++) {
        const fieldName = columnMappings[colIdx];
        const cellValue = row[colIdx] || '';
        
        if (fieldName && cellValue) {
          product[fieldName] = cellValue;
        }
      }
      
      // Validate required fields
      if (!product.name || !product.price) {
        console.warn(`⚠️ Row ${i+2} skipped: Missing name or price`);
        continue;
      }
      
      // Parse price (remove currency symbols, commas)
      product.price = parseFloat(String(product.price).replace(/[^\d.]/g, ''));
      
      if (isNaN(product.price) || product.price <= 0) {
        console.warn(`⚠️ Row ${i+2} skipped: Invalid price`);
        continue;
      }
      
      // Set defaults
      product.createdAt = serverTimestamp();
      product.stock = product.stock ? parseInt(product.stock) : 100;
      product.spiciness = product.spiciness ? parseInt(product.spiciness) : 1;
      product.featured = product.isHot === 'так' || product.isHot === 'yes';
      
      productsToImport.push(product);
    }
    
    console.log(`✅ Prepared ${productsToImport.length} products for import`);
    
    if (productsToImport.length === 0) {
      document.getElementById('import-progress-modal').remove();
      alert('❌ Жоден товар не відповідає мінімальним вимогам (назва + ціна)');
      return;
    }
    
    // ============================================
    // STEP 5: UPLOAD TO FIRESTORE IN BATCHES
    // ============================================
    const BATCH_SIZE = 500; // Firestore batch limit
    let totalUploaded = 0;
    
    for (let i = 0; i < productsToImport.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const batchProducts = productsToImport.slice(i, Math.min(i + BATCH_SIZE, productsToImport.length));
      
      for (const product of batchProducts) {
        const productRef = doc(collection(db, 'products'));
        batch.set(productRef, product);
      }
      
      await batch.commit();
      totalUploaded += batchProducts.length;
      
      // Update progress
      const progress = Math.round((totalUploaded / productsToImport.length) * 100);
      const progressBar = document.getElementById('progress-bar');
      const progressText = document.getElementById('progress-text');
      const progressStatus = document.getElementById('progress-status');
      
      if (progressBar) progressBar.style.width = progress + '%';
      if (progressText) progressText.textContent = progress + '%';
      if (progressStatus) progressStatus.textContent = `Завантажено ${totalUploaded} з ${productsToImport.length} товарів`;
      
      console.log(`✅ Batch uploaded: ${totalUploaded}/${productsToImport.length}`);
    }
    
    // ============================================
    // STEP 6: SUCCESS!
    // ============================================
    setTimeout(() => {
      document.getElementById('import-progress-modal').remove();
      
      alert(`✅ Імпорт завершено!\n\nЗавантажено: ${totalUploaded} товарів\nПропущено: ${data.length - totalUploaded} рядків`);
      
      // Reload products list
      if (typeof loadProducts === 'function') {
        loadProducts();
      }
      
      // Clean up cached data
      delete window.cachedImportData;
      delete window.cachedHeaders;
      
      console.log('✅ Import completed, cached data cleaned up');
      
    }, 500);
    
  } catch (error) {
    console.error('❌ Import error:', error);
    
    // Remove progress modal
    const progressModal = document.getElementById('import-progress-modal');
    if (progressModal) progressModal.remove();
    
    alert(`❌ Помилка імпорту: ${error.message}`);
  }
};

// Format file size
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// NOTE: renderMappingTable removed - replaced by renderImportPreview above

// Guess field mapping based on column name (supports Shopify export format)
function guessFieldMapping(columnName) {
    if (!columnName) return 'skip';
    const col = String(columnName).toLowerCase().trim();
    
    // === SHOPIFY SPECIFIC MAPPINGS ===
    // Title -> name
    if (col === 'title' || col === 'product title') return 'name';
    // Variant Price -> price
    if (col === 'variant price' || col === 'price') return 'price';
    // Variant SKU -> sku
    if (col === 'variant sku' || col === 'sku') return 'sku';
    // Handle -> sku (fallback if no SKU)
    if (col === 'handle') return 'handle'; // Special: will be used as SKU fallback
    // Body (HTML) -> description
    if (col === 'body (html)' || col === 'body html' || col === 'description') return 'description';
    // Image Src -> image
    if (col === 'image src' || col === 'image url' || col === 'variant image') return 'image';
    // Variant Inventory Qty -> stock
    if (col === 'variant inventory qty' || col === 'inventory' || col === 'quantity') return 'stock';
    // Type or Product Category -> category
    if (col === 'type' || col === 'product type' || col === 'product category' || col === 'category') return 'category';
    // Tags -> tags (for spiciness parsing)
    if (col === 'tags') return 'tags';
    // Vendor -> vendor (optional)
    if (col === 'vendor') return 'vendor';
    // Status -> status
    if (col === 'status') return 'status';
    
    // === GENERIC MAPPINGS (Ukrainian & English) ===
    if (col.includes('назва') || col.includes('name') || col.includes('товар') || col.includes('product')) return 'name';
    if (col.includes('ціна') || col.includes('price') || col.includes('вартість') || col.includes('cost')) return 'price';
    if (col.includes('артикул') || col.includes('sku') || col.includes('код') || col.includes('code')) return 'sku';
    if (col.includes('категор') || col.includes('category') || col.includes('тип')) return 'category';
    if (col.includes('опис') || col.includes('description') || col.includes('desc') || col.includes('body')) return 'description';
    if (col.includes('гостр') || col.includes('spic') || col.includes('level')) return 'spiciness';
    if (col.includes('фото') || col.includes('image') || col.includes('зображ') || col.includes('url') || col.includes('img') || col.includes('src')) return 'image';
    if (col.includes('залиш') || col.includes('stock') || col.includes('кількість') || col.includes('qty') || col.includes('inventory')) return 'stock';
    
    return 'skip';
}

// Parse spiciness from tags (e.g., "Level:3" or "Spicy:2")
function parseSpicinessFromTags(tags) {
    if (!tags) return 0;
    const tagStr = String(tags).toLowerCase();
    
    // Look for patterns like "level:3", "spicy:2", "гострота:1"
    const patterns = [
        /level[:\s]*(\d)/i,
        /spicy[:\s]*(\d)/i,
        /spiciness[:\s]*(\d)/i,
        /гострота[:\s]*(\d)/i,
        /рівень[:\s]*(\d)/i
    ];
    
    for (const pattern of patterns) {
        const match = tagStr.match(pattern);
        if (match) {
            return Math.min(5, Math.max(0, parseInt(match[1]) || 0));
        }
    }
    
    // Check for keyword-based spiciness
    if (tagStr.includes('extra hot') || tagStr.includes('дуже гостр')) return 5;
    if (tagStr.includes('very hot') || tagStr.includes('супер гостр')) return 4;
    if (tagStr.includes('hot') || tagStr.includes('гостр')) return 3;
    if (tagStr.includes('medium') || tagStr.includes('середн')) return 2;
    if (tagStr.includes('mild') || tagStr.includes('легк') || tagStr.includes('не гостр')) return 1;
    
    return 0;
}

// Clean HTML from description (optional - keep basic formatting)
function cleanDescription(html) {
    if (!html) return '';
    // Remove script tags and their content
    let clean = String(html).replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    // Remove style tags
    clean = clean.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    // Keep basic HTML but decode entities
    return clean.trim();
}

// Validate image URL
function isValidImageUrl(url) {
    if (!url) return false;
    const urlStr = String(url).trim().toLowerCase();
    return urlStr.startsWith('http://') || urlStr.startsWith('https://') || urlStr.startsWith('//');
}

// Execute import (Shopify-optimized)
window.executeImport = async function() {
    console.log('🚀 Starting Shopify-optimized import...');
    
    if (!window.parsedImportData || window.parsedImportData.length < 2) {
        alert('❌ Немає даних для імпорту!');
        return;
    }
    
    // Get column mappings
    const columns = window.parsedImportData[0] || [];
    const mappings = {};
    let hasNameField = false;
    let handleColIdx = -1;
    let tagsColIdx = -1;
    let statusColIdx = -1;
    
    columns.forEach((_, idx) => {
        const select = document.getElementById(`map-col-${idx}`);
        if (select) {
            const fieldValue = select.value;
            if (fieldValue !== 'skip') {
                mappings[idx] = fieldValue;
                if (fieldValue === 'name') hasNameField = true;
                if (fieldValue === 'handle') handleColIdx = idx;
                if (fieldValue === 'tags') tagsColIdx = idx;
                if (fieldValue === 'status') statusColIdx = idx;
            }
        }
    });
    
    // Validate - at least name field is required
    if (!hasNameField) {
        alert('❌ Оберіть колонку для поля "Назва товару"!\nЦе обов\'язкове поле.');
        return;
    }
    
    // Show progress
    showImportStep('progress');
    
    const dataRows = window.parsedImportData.slice(1);
    const totalRows = dataRows.length;
    let importedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    // Track imported handles to avoid duplicates (Shopify exports have multiple rows per product)
    const importedHandles = new Set();
    
    const progressBar = document.getElementById('import-progress-bar');
    const progressText = document.getElementById('import-progress-text');
    const progressCount = document.getElementById('import-progress-count');
    
    try {
        // First pass: collect unique products (Shopify has multiple rows for variants)
        const uniqueProducts = [];
        
        dataRows.forEach((row, idx) => {
            // Get the handle or name to check for duplicates
            const handle = handleColIdx >= 0 ? String(row[handleColIdx] || '').trim() : '';
            const nameColIdx = Object.keys(mappings).find(k => mappings[k] === 'name');
            const name = nameColIdx !== undefined ? String(row[parseInt(nameColIdx)] || '').trim() : '';
            
            // Skip if no name (variant rows in Shopify often have empty Title)
            if (!name) {
                console.log(`⏭️ Skipping row ${idx + 2}: empty name (likely variant row)`);
                skippedCount++;
                return;
            }
            
            // Skip duplicates based on handle
            if (handle && importedHandles.has(handle)) {
                console.log(`⏭️ Skipping row ${idx + 2}: duplicate handle "${handle}"`);
                skippedCount++;
                return;
            }
            
            // Check status - skip archived/draft if present
            if (statusColIdx >= 0) {
                const status = String(row[statusColIdx] || '').toLowerCase().trim();
                if (status === 'archived' || status === 'draft') {
                    console.log(`⏭️ Skipping row ${idx + 2}: status is ${status}`);
                    skippedCount++;
                    return;
                }
            }
            
            if (handle) importedHandles.add(handle);
            uniqueProducts.push({ row, idx });
        });
        
        console.log(`📊 Found ${uniqueProducts.length} unique products to import`);
        
        // Process in batches of 500 (Firestore limit)
        const BATCH_SIZE = 500;
        const totalToImport = uniqueProducts.length;
        
        for (let batchStart = 0; batchStart < totalToImport; batchStart += BATCH_SIZE) {
            const batchEnd = Math.min(batchStart + BATCH_SIZE, totalToImport);
            const batchItems = uniqueProducts.slice(batchStart, batchEnd);
            
            const batch = writeBatch(db);
            let batchCount = 0;
            
            batchItems.forEach(({ row, idx }) => {
                try {
                    // Build product object from mappings
                    const product = {
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    };
                    
                    let handle = '';
                    let tags = '';
                    
                    Object.entries(mappings).forEach(([colIdx, fieldName]) => {
                        const cellValue = row[parseInt(colIdx)];
                        
                        if (cellValue !== undefined && cellValue !== null && cellValue !== '') {
                            switch (fieldName) {
                                case 'price':
                                    // Parse price: remove currency symbols, handle comma decimals
                                    product.price = parseFloat(String(cellValue).replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
                                    break;
                                case 'spiciness':
                                    product.spiciness = Math.min(5, Math.max(0, parseInt(cellValue) || 0));
                                    break;
                                case 'stock':
                                    product.stock = Math.max(0, parseInt(cellValue) || 0);
                                    break;
                                case 'image':
                                    const imgUrl = String(cellValue).trim();
                                    if (isValidImageUrl(imgUrl)) {
                                        product.images = [imgUrl];
                                        product.image = imgUrl;
                                    }
                                    break;
                                case 'description':
                                    product.description = cleanDescription(cellValue);
                                    break;
                                case 'handle':
                                    handle = String(cellValue).trim();
                                    break;
                                case 'tags':
                                    tags = String(cellValue).trim();
                                    product.tags = tags;
                                    break;
                                case 'status':
                                    // Don't store status, just use for filtering
                                    break;
                                case 'vendor':
                                    product.vendor = String(cellValue).trim();
                                    break;
                                default:
                                    product[fieldName] = String(cellValue).trim();
                            }
                        }
                    });
                    
                    // Skip if still no name
                    if (!product.name || product.name.trim() === '') {
                        return;
                    }
                    
                    // Use handle as SKU fallback
                    if (!product.sku && handle) {
                        product.sku = handle.toUpperCase().replace(/-/g, '_');
                    }
                    
                    // Try to parse spiciness from tags if not set
                    if (!product.spiciness && tags) {
                        product.spiciness = parseSpicinessFromTags(tags);
                    }
                    
                    // Set defaults
                    if (product.price === undefined) product.price = 0;
                    if (!product.spiciness) product.spiciness = 0;
                    if (product.stock === undefined) product.stock = 0;
                    if (!product.sku) product.sku = `IMPORT-${Date.now()}-${idx}`;
                    
                    // Add to batch
                    const newDocRef = doc(collection(db, 'products'));
                    batch.set(newDocRef, product);
                    batchCount++;
                    importedCount++;
                    
                } catch (rowError) {
                    console.error(`❌ Error processing row ${idx + 2}:`, rowError);
                    errorCount++;
                }
            });
            
            // Only commit if batch has items
            if (batchCount > 0) {
                await batch.commit();
                console.log(`✅ Batch committed: ${batchStart + 1} - ${batchEnd} (${batchCount} items)`);
            }
            
            // Update progress
            const progress = Math.round((batchEnd / totalToImport) * 100);
            if (progressBar) progressBar.style.width = `${progress}%`;
            if (progressText) progressText.textContent = `Обробка партії ${Math.ceil(batchEnd / BATCH_SIZE)} з ${Math.ceil(totalToImport / BATCH_SIZE)}...`;
            if (progressCount) progressCount.textContent = `${importedCount} з ${totalToImport} товарів`;
        }
        
        // Show success
        showImportStep('success');
        const successText = document.getElementById('import-success-text');
        if (successText) {
            let resultHtml = `✅ Успішно імпортовано: <strong class="text-green-600">${importedCount}</strong> товарів`;
            if (skippedCount > 0) {
                resultHtml += `<br>⏭️ Пропущено (дублікати/варіанти): <span class="text-gray-500">${skippedCount}</span>`;
            }
            if (errorCount > 0) {
                resultHtml += `<br>❌ Помилок: <span class="text-red-500">${errorCount}</span>`;
            }
            successText.innerHTML = resultHtml;
        }
        
        // Show toast notification
        showImportToast(`✅ Імпорт завершено! Додано ${importedCount} товарів.`);
        
        // Reload products list
        if (typeof window.loadProducts === 'function') {
            window.loadProducts();
        }
        
        console.log(`✅ Import completed: ${importedCount} imported, ${skippedCount} skipped, ${errorCount} errors`);
        
    } catch (error) {
        console.error('❌ Import error:', error);
        alert(`❌ Помилка імпорту: ${error.message}`);
        showImportStep('upload');
    }
};

// Show toast notification for import
function showImportToast(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-6 py-4 rounded-xl shadow-2xl z-[100] flex items-center gap-3 animate-pulse';
    toast.innerHTML = `
        <span class="text-2xl">🎉</span>
        <span class="font-semibold">${message}</span>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s';
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

// ============================================
// QUICK SHOPIFY CSV IMPORT (ONE-CLICK)
// ============================================

/**
 * Quick Shopify CSV Import - Auto-maps columns and imports directly
 * Columns: Handle, Title, Body (HTML), Vendor, Type, Tags, Variant SKU, Variant Price, Variant Inventory Qty, Image Src
 */
window.handleShopifyImport = async function(input) {
    console.log('🛒 Starting Shopify CSV import...');
    
    if (!input.files || input.files.length === 0) {
        console.log('No file selected');
        return;
    }
    
    const file = input.files[0];
    console.log(`📁 File: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    
    // Show loading toast
    const loadingToast = document.createElement('div');
    loadingToast.id = 'shopify-loading-toast';
    loadingToast.className = 'fixed top-4 right-4 bg-blue-600 text-white px-6 py-4 rounded-xl shadow-2xl z-[100] flex items-center gap-3';
    loadingToast.innerHTML = `
        <div class="animate-spin w-6 h-6 border-3 border-white border-t-transparent rounded-full"></div>
        <span class="font-semibold">Імпортую товари з Shopify...</span>
    `;
    document.body.appendChild(loadingToast);
    
    try {
        // Check if XLSX is available
        if (typeof XLSX === 'undefined') {
            throw new Error('Бібліотека XLSX не завантажена! Оновіть сторінку.');
        }
        
        // Read file
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON with headers
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        
        if (jsonData.length === 0) {
            throw new Error('Файл порожній або не містить даних!');
        }
        
        console.log(`📊 Parsed ${jsonData.length} rows from Shopify export`);
        
        // Track imported handles to avoid duplicates
        const importedHandles = new Set();
        const productsToImport = [];
        let skippedCount = 0;
        
        // Process rows - filter and map
        jsonData.forEach((row, idx) => {
            // Get Title - skip if empty (variant rows)
            const title = String(row['Title'] || '').trim();
            if (!title) {
                skippedCount++;
                return;
            }
            
            // Get Handle for duplicate detection
            const handle = String(row['Handle'] || '').trim();
            if (handle && importedHandles.has(handle)) {
                skippedCount++;
                return;
            }
            if (handle) importedHandles.add(handle);
            
            // Map Shopify columns to Firestore fields
            const product = {
                name: title,
                price: parseShopifyPrice(row['Variant Price']),
                sku: String(row['Variant SKU'] || row['Handle'] || '').trim() || `SHOPIFY-${Date.now()}-${idx}`,
                category: String(row['Type'] || row['Product Category'] || 'General').trim(),
                description: stripHtmlTags(row['Body (HTML)'] || ''),
                image: String(row['Image Src'] || '').trim(),
                images: row['Image Src'] ? [String(row['Image Src']).trim()] : [],
                stock: parseInt(row['Variant Inventory Qty']) || 0,
                spiciness: parseSpicyFromTags(row['Tags'] || ''),
                vendor: String(row['Vendor'] || '').trim(),
                tags: String(row['Tags'] || '').trim(),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };
            
            // Validate image URL
            if (product.image && !product.image.startsWith('http')) {
                product.image = '';
                product.images = [];
            }
            
            productsToImport.push(product);
        });
        
        console.log(`✅ ${productsToImport.length} products ready to import (${skippedCount} skipped)`);
        
        if (productsToImport.length === 0) {
            throw new Error('Немає товарів для імпорту! Перевірте, чи файл містить колонку "Title".');
        }
        
        // Update loading toast
        loadingToast.innerHTML = `
            <div class="animate-spin w-6 h-6 border-3 border-white border-t-transparent rounded-full"></div>
            <span class="font-semibold">Зберігаю ${productsToImport.length} товарів...</span>
        `;
        
        // Batch write to Firestore (max 500 per batch)
        const BATCH_SIZE = 500;
        let importedCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < productsToImport.length; i += BATCH_SIZE) {
            const batch = writeBatch(db);
            const batchProducts = productsToImport.slice(i, i + BATCH_SIZE);
            
            batchProducts.forEach(product => {
                try {
                    const docRef = doc(collection(db, 'products'));
                    batch.set(docRef, product);
                    importedCount++;
                } catch (e) {
                    console.error('Error adding to batch:', e);
                    errorCount++;
                }
            });
            
            await batch.commit();
            console.log(`✅ Batch ${Math.ceil((i + 1) / BATCH_SIZE)} committed`);
        }
        
        // Remove loading toast
        loadingToast.remove();
        
        // Show success toast
        showImportToast(`✅ Shopify імпорт завершено! Додано ${importedCount} товарів.`);
        
        // Reset file input
        input.value = '';
        
        // Reload products list
        if (typeof window.loadProducts === 'function') {
            window.loadProducts();
        }
        
        console.log(`🎉 Shopify import completed: ${importedCount} imported, ${skippedCount} skipped, ${errorCount} errors`);
        
    } catch (error) {
        console.error('❌ Shopify import error:', error);
        
        // Remove loading toast
        const toast = document.getElementById('shopify-loading-toast');
        if (toast) toast.remove();
        
        alert(`❌ Помилка імпорту Shopify: ${error.message}`);
        
        // Reset file input
        input.value = '';
    }
};

// Helper: Parse Shopify price (handle various formats)
function parseShopifyPrice(priceStr) {
    if (!priceStr) return 0;
    // Remove currency symbols, spaces, and handle comma as decimal
    const cleaned = String(priceStr)
        .replace(/[^\d.,]/g, '')
        .replace(',', '.');
    return parseFloat(cleaned) || 0;
}

// Helper: Strip HTML tags from description
function stripHtmlTags(html) {
    if (!html) return '';
    // Create a temporary element to parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
}

// Helper: Try to parse spiciness level from Shopify tags
function parseSpicyFromTags(tags) {
    if (!tags) return 0;
    const tagStr = String(tags).toLowerCase();
    
    // Look for patterns like "level:3", "spicy:2", "spiciness:1"
    const match = tagStr.match(/(?:level|spicy|spiciness|гострота)[:\s]*(\d)/i);
    if (match) {
        return Math.min(5, Math.max(0, parseInt(match[1]) || 0));
    }
    
    // Keyword-based detection
    if (tagStr.includes('extra hot') || tagStr.includes('дуже гостр')) return 5;
    if (tagStr.includes('very hot') || tagStr.includes('супер гостр')) return 4;
    if (tagStr.includes('hot') || tagStr.includes('гостр')) return 3;
    if (tagStr.includes('medium') || tagStr.includes('середн')) return 2;
    if (tagStr.includes('mild') || tagStr.includes('легк')) return 1;
    
    return 0;
}

// ============================================
// AVATAR MIGRATION TOOL - Fix Missing Avatars
// ============================================
const AVATAR_POOL = [
    "https://www.meme-arsenal.com/memes/cdcfda78a84cf35ca09a109439642ea6.jpg",
    "https://i1.sndcdn.com/artworks-Pm21pVGyLISZPmA8-mt4UhQ-t500x500.jpg",
    "https://www.meme-arsenal.com/memes/463e01e32c4ea517425162d27481d7b2.jpg",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQEN4_2MD_SBd-1dE0tr6BIF581wULKjW29Cw&s",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQEPijZKwJWqno9DLrxEsCOJ-e9w9I5l3lfSg&s"
];

function getRandomAvatar() {
    return AVATAR_POOL[Math.floor(Math.random() * AVATAR_POOL.length)];
}

/**
 * Batch migration tool to fix missing avatars for all customers
 * Scans ALL customers and assigns random avatars to those without one
 */
window.fixMissingAvatars = async function() {
    console.log('🎨 Starting avatar migration...');
    
    // Confirm action
    if (!confirm('⚠️ Ця операція призначить випадкові аватарки всім клієнтам без аватарки.\n\nПродовжити?')) {
        return;
    }
    
    // Show loading indicator
    const loadingToast = document.createElement('div');
    loadingToast.id = 'avatar-migration-toast';
    loadingToast.className = 'fixed top-4 right-4 bg-purple-600 text-white px-6 py-4 rounded-xl shadow-2xl z-[100] flex items-center gap-3';
    loadingToast.innerHTML = `
        <div class="animate-spin w-6 h-6 border-3 border-white border-t-transparent rounded-full"></div>
        <span class="font-semibold">Оновлюю аватарки...</span>
    `;
    document.body.appendChild(loadingToast);
    
    try {
        // Fetch all customers
        const customersRef = collection(db, 'customers');
        const snapshot = await getDocs(customersRef);
        
        if (snapshot.empty) {
            alert('❌ Клієнтів не знайдено в базі даних');
            loadingToast.remove();
            return;
        }
        
        let updatedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;
        const totalCount = snapshot.docs.length;
        
        console.log(`📊 Found ${totalCount} customers`);
        
        // Process each customer
        for (const customerDoc of snapshot.docs) {
            const customerData = customerDoc.data();
            const customerId = customerDoc.id;
            
            // Check if avatar is missing
            if (!customerData.avatarUrl) {
                try {
                    const newAvatarUrl = getRandomAvatar();
                    const customerRef = doc(db, 'customers', customerId);
                    
                    await updateDoc(customerRef, { 
                        avatarUrl: newAvatarUrl,
                        updatedAt: serverTimestamp()
                    });
                    
                    updatedCount++;
                    console.log(`✅ Avatar assigned to ${customerData.phone || customerId}: ${newAvatarUrl}`);
                    
                    // Update progress
                    loadingToast.innerHTML = `
                        <div class="animate-spin w-6 h-6 border-3 border-white border-t-transparent rounded-full"></div>
                        <span class="font-semibold">Оновлено: ${updatedCount} / ${totalCount}</span>
                    `;
                    
                } catch (updateError) {
                    console.error(`❌ Error updating ${customerId}:`, updateError);
                    errorCount++;
                }
            } else {
                skippedCount++;
            }
        }
        
        // Remove loading toast
        loadingToast.remove();
        
        // Show results
        const resultMessage = `🎨 Міграція аватарок завершена!\n\n` +
            `✅ Оновлено: ${updatedCount} клієнтів\n` +
            `⏭️ Пропущено (вже мали аватарку): ${skippedCount}\n` +
            `❌ Помилок: ${errorCount}\n` +
            `📊 Всього клієнтів: ${totalCount}`;
        
        console.log(resultMessage);
        alert(resultMessage);
        
        // Show success toast
        const successToast = document.createElement('div');
        successToast.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-4 rounded-xl shadow-2xl z-[100] flex items-center gap-3';
        successToast.innerHTML = `
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span class="font-semibold">Оновлено ${updatedCount} клієнтів!</span>
        `;
        document.body.appendChild(successToast);
        setTimeout(() => successToast.remove(), 4000);
        
    } catch (error) {
        console.error('❌ Avatar migration error:', error);
        
        const toast = document.getElementById('avatar-migration-toast');
        if (toast) toast.remove();
        
        alert(`❌ Помилка міграції: ${error.message}`);
    }
};

console.log('✅ admin.js loaded successfully (with Shopify import support)');
// ============================================
// CRM TRANSFER MODAL
// ============================================

/**
 * Show modal to transfer abandoned cart to CRM
 * @param {string} cartId - Cart document ID (phone number)
 */
window.showCrmTransferModal = async function(cartId) {
    console.log('🔄 Transferring cart to CRM:', cartId);
    
    try {
        // Load CRM columns
        const columnsSnapshot = await getDocs(query(
            collection(db, 'crm_columns'),
            orderBy('order', 'asc')
        ));
        
        if (columnsSnapshot.empty) {
            alert('❌ Немає колонок CRM. Створіть колонки спочатку.');
            return;
        }
        
        const columns = [];
        columnsSnapshot.forEach(doc => {
            columns.push({
                id: doc.id,
                name: doc.data().name || doc.id
            });
        });
        
        // Create modal HTML
        const columnsOptions = columns.map(col => 
            `<option value="${col.id}">${col.name}</option>`
        ).join('');
        
        const modalHTML = `
            <div id="crm-transfer-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full">
                    <!-- Header -->
                    <div class="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6 rounded-t-2xl">
                        <div class="flex items-center gap-3">
                            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                            </svg>
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
                            <select id="crm-column-select" class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-base">
                                ${columnsOptions}
                            </select>
                        </div>
                        
                        <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                            <div class="flex items-start gap-3">
                                <svg class="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                <div class="text-sm text-green-800">
                                    <p class="font-semibold mb-1">Миттєвий перенос</p>
                                    <p>Кошик з'явиться в CRM негайно, незалежно від налаштувань автоматизації.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div class="border-t border-gray-200 p-6 bg-gray-50 rounded-b-2xl flex items-center justify-end gap-3">
                        <button onclick="closeCrmTransferModal()" 
                            class="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition">
                            Скасувати
                        </button>
                        <button onclick="confirmCrmTransfer('${cartId}')" 
                            class="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition">
                            ✅ Передати
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        const existingModal = document.getElementById('crm-transfer-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Inject modal
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Close on overlay click
        const modal = document.getElementById('crm-transfer-modal');
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeCrmTransferModal();
            }
        });
        
    } catch (error) {
        console.error('❌ Error showing CRM transfer modal:', error);
        alert(`Помилка: ${error.message}`);
    }
};

/**
 * Close CRM transfer modal
 */
window.closeCrmTransferModal = function() {
    const modal = document.getElementById('crm-transfer-modal');
    if (modal) {
        modal.remove();
    }
};

/**
 * Confirm CRM transfer
 * @param {string} cartId - Cart document ID
 */
window.confirmCrmTransfer = async function(cartId) {
    try {
        const selectedColumn = document.getElementById('crm-column-select')?.value;
        
        if (!selectedColumn) {
            alert('❌ Оберіть колонку');
            return;
        }
        
        console.log('🔄 Transferring order:', cartId, 'to column:', selectedColumn);
        
        // Update cart in Firestore
        const cartRef = doc(db, 'abandoned_carts', cartId);
        await updateDoc(cartRef, {
            crm_status: selectedColumn,
            manually_transferred: true,
            transferred_at: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        
        console.log('✅ Cart transferred successfully');
        
        // Show success toast
        const successToast = document.createElement('div');
        successToast.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-4 rounded-xl shadow-2xl z-[100] flex items-center gap-3';
        successToast.innerHTML = `
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span class="font-semibold">✅ Кошик переданий в CRM</span>
        `;
        document.body.appendChild(successToast);
        setTimeout(() => successToast.remove(), 3000);
        
        // Close modal
        closeCrmTransferModal();
        
        // Update row visual state (add green highlight)
        const row = document.querySelector(`tr input[data-cart-id="${cartId}"]`)?.closest('tr');
        if (row) {
            row.classList.remove('border-blue-400');
            row.classList.add('border-green-500', 'bg-green-50');
            
            // Add "Transferred" badge
            const actionsCell = row.querySelector('td:last-child');
            if (actionsCell) {
                const badge = document.createElement('div');
                badge.className = 'inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full mr-2';
                badge.innerHTML = `
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>В CRM</span>
                `;
                actionsCell.querySelector('div').prepend(badge);
            }
        }
        
    } catch (error) {
        console.error('❌ Error transferring cart:', error);
        alert(`Помилка переносу: ${error.message}`);
    }
};
