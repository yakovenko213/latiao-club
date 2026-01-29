// ============================================
// STOREFRONT.JS - Dynamic Product Loading
// ============================================
import './maintenance-check.js'; // CRITICAL: Check maintenance mode FIRST
import { db } from './firebase-init.js';
import {
    collection,
    getDocs,
    query,
    where,
    orderBy,
    addDoc,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Track when page was loaded for time_to_cart analytics
const pageLoadTime = Date.now();

console.log('🛒 Storefront module loaded');

// ============================================
// ADD TO CART FROM STOREFRONT (with analytics)
// ============================================
window.addToCartFromStorefront = function (productId, name, price, image, source, sku) {
    if (window.addToCart) {
        window.addToCart({
            id: productId,
            name: name,
            price: price,
            image: image,
            sku: sku || '' // Save SKU
        }, source);

        // Track time to cart (fire-and-forget, non-blocking)
        trackTimeToCartFromStorefront(productId, name, source);
    }
};

/**
 * Track time from page load to add-to-cart action
 * Non-blocking analytics
 */
async function trackTimeToCartFromStorefront(productId, productName, source) {
    try {
        const durationMs = Date.now() - pageLoadTime;
        const durationSeconds = Math.round(durationMs / 100) / 10; // Round to 1 decimal

        // Skip if duration is too short or too long
        if (durationSeconds < 1 || durationSeconds > 1800) {
            console.log('⏱️ Time to cart skipped (out of range):', durationSeconds, 's');
            return;
        }

        console.log('⏱️ Time to Add to Cart:', durationSeconds, 'seconds');

        await addDoc(collection(db, 'analytics_timings'), {
            type: 'time_to_cart_add',
            durationSeconds: durationSeconds,
            productId: productId || 'unknown',
            productName: productName || 'unknown',
            source: source || 'storefront',
            timestamp: serverTimestamp(),
            device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
        });

        console.log('✅ Time to cart tracked successfully');
    } catch (e) {
        console.error('⏱️ Failed to track time to cart:', e.message);
    }
}

// ============================================
// SPICINESS RENDERER
// ============================================
function renderSpiciness(level = 0) {
    const maxLevel = 5;
    let html = '<div class="flex items-center gap-0.5">';
    for (let i = 0; i < maxLevel; i++) {
        if (i < level) {
            html += '<span class="text-xs">🌶️</span>';
        } else {
            html += '<span class="text-xs opacity-30">🌶️</span>';
        }
    }
    html += '</div>';
    return html;
}

// ============================================
// PRODUCT CARD TEMPLATE
// ============================================
function createProductCard(product, productId) {
    const img = product.images?.[0] || product.image || 'https://placehold.co/300x300?text=Латяо';

    const generatedSku = `LT-${new Date().getFullYear()}-${productId.substring(0, 4).toUpperCase()}`;
    const sku = product.sku || product.code || generatedSku; // Get SKU or generate fallback


    return `
        <div class="card-hover bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm fade-in group relative">
            ${isHot ? '<div class="absolute top-3 left-3 z-10 bg-fire text-white text-xs font-bold px-2 py-1 rounded-full">🔥 ХІТ</div>' : ''}
            <a href="product.html?id=${productId}" class="block">
                <div class="aspect-square overflow-hidden bg-gray-50">
                    <img src="${img}" 
                         alt="${product.name}" 
                         class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                         loading="lazy"
                         onerror="this.src='https://placehold.co/300x300?text=Латяо'">
                </div>
            </a>
            <div class="p-4">
                <a href="product.html?id=${productId}" class="block">
                    <h3 class="font-semibold text-gray-900 mb-1 line-clamp-2 hover:text-spicy transition-colors">${product.name}</h3>
                </a>
                <div class="flex items-center justify-between mb-3">
                    ${renderSpiciness(spiciness)}
                    <span class="text-xs text-gray-500">${product.weight || ''}</span>
                </div>
                <div class="flex items-center justify-between">
                    <div class="text-xl font-bold text-spicy">₴${product.price}</div>
                    <button 
                        onclick="window.addToCartFromStorefront('${productId}', '${product.name.replace(/'/g, "\\'").replace(/"/g, '&quot;')}', ${product.price}, '${img}', 'category', '${sku}')"
                        class="btn-primary btn-press fire-gradient text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md shadow-spicy/20">
                        <i data-lucide="plus" class="w-4 h-4"></i>
                        <span>Додати</span>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// HORIZONTAL PRODUCT CARD (for Hot section)
// ============================================
function createHorizontalProductCard(product, productId) {
    const img = product.images?.[0] || product.image || 'https://placehold.co/300x300?text=Латяо';
    const spiciness = product.spiciness || 0;
    const generatedSku = `LT-${new Date().getFullYear()}-${productId.substring(0, 4).toUpperCase()}`;
    const sku = product.sku || product.code || generatedSku; // Get SKU or generate fallback

    return `
        <div class="flex-shrink-0 w-[260px] sm:w-[280px] snap-start">
            <div class="card-hover bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm group relative h-full">
                <div class="absolute top-3 left-3 z-10 bg-fire text-white text-xs font-bold px-2 py-1 rounded-full fire-accent">🔥 ХІТ</div>
                <a href="product.html?id=${productId}" class="block">
                    <div class="aspect-square overflow-hidden bg-gray-50">
                        <img src="${img}" 
                             alt="${product.name}" 
                             class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                             loading="lazy"
                             onerror="this.src='https://placehold.co/300x300?text=Латяо'">
                    </div>
                </a>
                <div class="p-4">
                    <a href="product.html?id=${productId}" class="block">
                        <h3 class="font-semibold text-gray-900 mb-1 line-clamp-2 hover:text-spicy transition-colors">${product.name}</h3>
                    </a>
                    <div class="flex items-center justify-between mb-3">
                        ${renderSpiciness(spiciness)}
                    </div>
                    <div class="flex items-center justify-between">
                        <div class="text-xl font-bold text-spicy">₴${product.price}</div>
                        <button 
                            onclick="window.addToCartFromStorefront('${productId}', '${product.name.replace(/'/g, "\\'").replace(/"/g, '&quot;')}', ${product.price}, '${img}', 'homepage', '${sku}')"
                            class="btn-primary btn-press fire-gradient text-white px-3 py-2 rounded-xl text-sm font-semibold shadow-md shadow-spicy/20">
                            <i data-lucide="plus" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// LOADING SKELETON
// ============================================
function createLoadingSkeleton(count = 4) {
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `
            <div class="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm animate-pulse">
                <div class="aspect-square bg-gray-200"></div>
                <div class="p-4 space-y-3">
                    <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div class="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div class="flex justify-between items-center">
                        <div class="h-6 bg-gray-200 rounded w-16"></div>
                        <div class="h-10 bg-gray-200 rounded w-24"></div>
                    </div>
                </div>
            </div>
        `;
    }
    return html;
}

// ============================================
// RENDER HOT PRODUCTS
// ============================================
async function renderHotProducts() {
    const container = document.getElementById('hot-products-container');
    if (!container) return;

    // Show loading
    container.innerHTML = `
        <div class="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
            ${[1, 2, 3, 4].map(() => `
                <div class="flex-shrink-0 w-[260px] sm:w-[280px] bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm animate-pulse">
                    <div class="aspect-square bg-gray-200"></div>
                    <div class="p-4 space-y-3">
                        <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div class="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div class="flex justify-between items-center">
                            <div class="h-6 bg-gray-200 rounded w-16"></div>
                            <div class="h-10 bg-gray-200 rounded w-20"></div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    try {
        const productsQuery = query(
            collection(db, 'products'),
            where('isHot', '==', true),
            where('isVisible', '==', true)
        );

        const snapshot = await getDocs(productsQuery);

        if (snapshot.empty) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">Хіти продажів скоро з\'являться!</p>';
            return;
        }

        let html = '<div class="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory hide-scrollbar" style="scroll-padding: 0 16px;">';

        snapshot.forEach(doc => {
            const product = doc.data();
            html += createHorizontalProductCard(product, doc.id);
        });

        html += '</div>';
        container.innerHTML = html;

        // Initialize Lucide icons
        if (window.lucide) {
            lucide.createIcons();
        }

        console.log(`✅ Loaded ${snapshot.size} hot products`);

    } catch (error) {
        console.error('❌ Error loading hot products:', error);
        container.innerHTML = '<p class="text-red-500 text-center py-8">Помилка завантаження</p>';
    }
}

// ============================================
// RENDER CATEGORIES WITH PRODUCTS
// ============================================
async function renderCategories() {
    const container = document.getElementById('categories-container');
    if (!container) return;

    // Show loading
    container.innerHTML = `
        <div class="space-y-12">
            ${[1, 2].map(() => `
                <div>
                    <div class="h-8 bg-gray-200 rounded w-48 mb-6 animate-pulse"></div>
                    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                        ${createLoadingSkeleton(4)}
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    try {
        // Fetch active categories
        const categoriesQuery = query(
            collection(db, 'categories'),
            where('isActive', '==', true),
            orderBy('order', 'asc')
        );

        let categoriesSnapshot;
        try {
            categoriesSnapshot = await getDocs(categoriesQuery);
        } catch (e) {
            // Fallback without ordering if index doesn't exist
            console.warn('⚠️ Categories query failed, trying without order:', e.message);
            const fallbackQuery = query(
                collection(db, 'categories'),
                where('isActive', '==', true)
            );
            categoriesSnapshot = await getDocs(fallbackQuery);
        }

        if (categoriesSnapshot.empty) {
            // If no categories, just show all products
            container.innerHTML = '';
            await renderAllProducts(container);
            return;
        }

        // Fetch all products
        const productsSnapshot = await getDocs(collection(db, 'products'));
        const productsMap = {};

        productsSnapshot.forEach(doc => {
            const product = doc.data();
            // Skip hidden products (default to visible if field missing)
            if (product.isVisible === false) {
                return;
            }

            // ⭐ NEW: Handle products with multiple categories
            let productCategories = [];

            if (product.categories && Array.isArray(product.categories)) {
                // New format: use categories array
                productCategories = product.categories;
            } else if (product.category) {
                // Old format: single category string (backward compatibility)
                productCategories = [product.category];
            } else {
                // Fallback: uncategorized
                productCategories = ['uncategorized'];
            }

            // Add product to all its categories
            productCategories.forEach(cat => {
                if (!productsMap[cat]) {
                    productsMap[cat] = [];
                }
                productsMap[cat].push({ id: doc.id, ...product });
            });
        });

        let html = '';

        categoriesSnapshot.forEach(doc => {
            const category = doc.data();
            const slug = category.slug || doc.id;
            const products = productsMap[slug] || [];

            if (products.length === 0) return; // Skip empty categories

            html += `
                <div class="fade-in" id="category-${slug}">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="text-2xl lg:text-3xl font-bold text-gray-900">
                            ${category.icon || '🌶️'} ${category.name}
                        </h3>
                        <a href="category.html?slug=${slug}" class="text-spicy font-semibold hover:underline flex items-center gap-1">
                            Всі товари
                            <i data-lucide="arrow-right" class="w-4 h-4"></i>
                        </a>
                    </div>
                    ${category.description ? `<p class="text-gray-600 mb-6">${category.description}</p>` : ''}
                    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                        ${products.slice(0, 8).map(p => createProductCard(p, p.id)).join('')}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html || '<p class="text-gray-500 text-center py-8">Товари скоро з\'являться!</p>';

        // Initialize Lucide icons
        if (window.lucide) {
            lucide.createIcons();
        }

        // Trigger fade-in animations
        setTimeout(() => {
            container.querySelectorAll('.fade-in').forEach(el => {
                el.classList.add('visible');
            });
        }, 100);

        console.log(`✅ Loaded ${categoriesSnapshot.size} categories`);

    } catch (error) {
        console.error('❌ Error loading categories:', error);
        container.innerHTML = '<p class="text-red-500 text-center py-8">Помилка завантаження категорій</p>';
    }
}

// ============================================
// RENDER ALL PRODUCTS (Fallback)
// ============================================
async function renderAllProducts(container) {
    try {
        const productsQuery = query(
            collection(db, 'products'),
            where('isVisible', '==', true)
        );
        const snapshot = await getDocs(productsQuery);

        if (snapshot.empty) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">Товари скоро з\'являться!</p>';
            return;
        }

        let html = `
            <div class="fade-in">
                <h3 class="text-2xl lg:text-3xl font-bold text-gray-900 mb-6">🛒 Всі товари</h3>
                <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
        `;

        snapshot.forEach(doc => {
            const product = doc.data();
            html += createProductCard(product, doc.id);
        });

        html += '</div></div>';
        container.innerHTML = html;

        if (window.lucide) {
            lucide.createIcons();
        }

        setTimeout(() => {
            container.querySelectorAll('.fade-in').forEach(el => {
                el.classList.add('visible');
            });
        }, 100);

    } catch (error) {
        console.error('❌ Error loading all products:', error);
    }
}

// ============================================
// INITIALIZE ON DOM READY
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initializing storefront...');

    // Small delay to ensure Firebase is ready
    await new Promise(resolve => setTimeout(resolve, 100));

    // Load both sections in parallel
    await Promise.all([
        renderHotProducts(),
        renderCategories()
    ]);

    console.log('✅ Storefront initialized');
});

// Export for potential external use
export { renderHotProducts, renderCategories };