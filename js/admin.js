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
    onSnapshot 
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

        // ✅ FIXED: Using backticks for template literals
        let html = `
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Фото</th>
                            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Назва</th>
                            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ціна</th>
                            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Категорія</th>
                            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Залишок</th>
                            <th class="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Дії</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
        `;

        snapshot.forEach(docSnap => {
            const p = docSnap.data();
            const productId = docSnap.id;
            
            // Safe image URL extraction
            const img = p.images?.[0] || p.image || p.imageUrl || 'https://placehold.co/50';
            
            // ✅ FIXED: Using backticks for template literals
            html += `
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3">
                        <img src="${img}" class="w-12 h-12 object-cover rounded-lg" onerror="this.src='https://placehold.co/50'">
                    </td>
                    <td class="px-4 py-3 text-sm font-medium text-gray-900">${p.name || 'Без назви'}</td>
                    <td class="px-4 py-3 text-sm font-semibold text-gray-900">₴${p.price || 0}</td>
                    <td class="px-4 py-3 text-sm text-gray-700">${p.category || '-'}</td>
                    <td class="px-4 py-3">
                        <span class="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">В наявності</span>
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
        
        // Reinitialize Lucide icons
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
                            <button onclick="window.viewAbandonedCartDetails('${phone}')" 
                                    class="p-2 hover:bg-white rounded-lg transition-colors" 
                                    title="Переглянути деталі">
                                <i data-lucide="eye" class="w-5 h-5 text-gray-600"></i>
                            </button>
                            <button onclick="window.deleteAbandonedCart('${phone}')" 
                                    class="p-2 hover:bg-red-50 rounded-lg transition-colors" 
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

console.log('✅ admin.js loaded successfully');