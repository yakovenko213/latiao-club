# ⚡ Performance Optimization Guide - Latiao Snack Website

## 🎯 Goal: Page Load < 1.5 seconds | Lighthouse Score > 90

---

## 1️⃣ Asset Optimization

### A. Image Lazy Loading (Native Browser API)

**Implementation for Product Gallery:**

```html
<!-- Old Method (loads all images immediately) -->
<img src="/images/product-1.jpg" alt="Product 1">

<!-- New Method (lazy loads images) -->
<img 
  src="/images/product-1.jpg" 
  alt="Product 1"
  loading="lazy"
  decoding="async"
  width="300"
  height="300"
>
```

**JavaScript Progressive Enhancement:**

```javascript
// public-site/js/lazy-load.js
document.addEventListener('DOMContentLoaded', () => {
  // Use Intersection Observer for older browsers
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          
          // Replace data-src with src
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          
          // Replace data-srcset with srcset
          if (img.dataset.srcset) {
            img.srcset = img.dataset.srcset;
            img.removeAttribute('data-srcset');
          }
          
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px 0px',  // Start loading 50px before visible
      threshold: 0.01
    });

    // Observe all lazy images
    document.querySelectorAll('img[data-src], img[loading="lazy"]').forEach(img => {
      imageObserver.observe(img);
    });
  }
});
```

**HTML with Placeholder:**

```html
<!-- Low-quality placeholder image (LQIP) -->
<img 
  src="/images/placeholder.svg" 
  data-src="/images/product-1.jpg"
  alt="Product 1"
  loading="lazy"
  class="lazy-image"
  style="background: #f0f0f0;"
>

<style>
.lazy-image {
  opacity: 0;
  transition: opacity 0.3s;
}
.lazy-image.loaded {
  opacity: 1;
}
</style>
```

---

### B. WebP Image Conversion Strategy

#### Option 1: Firebase Extensions (Recommended)

**Install Extension:**
```bash
firebase ext:install storage-resize-images
```

**Configuration:**
```javascript
// firebase.json - Add to functions
{
  "extensions": {
    "storage-resize-images": {
      "bucket": "my-magazin-81c96.appspot.com",
      "imageSizes": "200x200,400x400,800x800",
      "outputFormat": "webp",
      "cacheControlHeader": "public,max-age=31536000"
    }
  }
}
```

#### Option 2: Cloudinary Integration

**Setup:**
```bash
npm install cloudinary
```

**Upload Function:**
```javascript
// functions/index.js
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'your-cloud-name',
  api_key: 'your-api-key',
  api_secret: 'your-api-secret'
});

exports.uploadToCloudinary = functions.storage.object().onFinalize(async (object) => {
  const filePath = object.name;
  const bucket = admin.storage().bucket(object.bucket);
  const file = bucket.file(filePath);
  
  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: '03-09-2491'
  });

  // Upload to Cloudinary with WebP transformation
  const result = await cloudinary.uploader.upload(url, {
    folder: 'latiao-products',
    format: 'webp',
    quality: 'auto:best',
    fetch_format: 'auto'
  });

  console.log('Cloudinary URL:', result.secure_url);
  return result;
});
```

**Frontend Usage:**
```html
<!-- Cloudinary Auto-format with responsive sizing -->
<img 
  src="https://res.cloudinary.com/your-cloud/image/upload/f_auto,q_auto,w_800/latiao-products/product-1.jpg"
  srcset="
    https://res.cloudinary.com/your-cloud/image/upload/f_auto,q_auto,w_400/latiao-products/product-1.jpg 400w,
    https://res.cloudinary.com/your-cloud/image/upload/f_auto,q_auto,w_800/latiao-products/product-1.jpg 800w,
    https://res.cloudinary.com/your-cloud/image/upload/f_auto,q_auto,w_1200/latiao-products/product-1.jpg 1200w
  "
  sizes="(max-width: 600px) 400px, (max-width: 1200px) 800px, 1200px"
  alt="Product"
  loading="lazy"
>
```

#### Option 3: Manual Conversion Script

```javascript
// scripts/convert-images-to-webp.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function convertToWebP(inputPath, outputPath) {
  try {
    await sharp(inputPath)
      .webp({ quality: 80 })
      .toFile(outputPath);
    
    console.log(`✅ Converted: ${path.basename(inputPath)} → ${path.basename(outputPath)}`);
  } catch (error) {
    console.error(`❌ Error converting ${inputPath}:`, error);
  }
}

async function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      await processDirectory(filePath);
    } else if (/\.(jpg|jpeg|png)$/i.test(file)) {
      const outputPath = filePath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
      await convertToWebP(filePath, outputPath);
    }
  }
}

// Run conversion
processDirectory('./public-site/images');
processDirectory('./image');
```

**Install dependencies:**
```bash
npm install sharp
node scripts/convert-images-to-webp.js
```

**HTML with WebP fallback:**
```html
<picture>
  <source srcset="/images/product-1.webp" type="image/webp">
  <source srcset="/images/product-1.jpg" type="image/jpeg">
  <img src="/images/product-1.jpg" alt="Product" loading="lazy">
</picture>
```

---

### C. JavaScript Minification & Bundling

#### Option 1: Webpack Configuration

**Install:**
```bash
npm install --save-dev webpack webpack-cli terser-webpack-plugin
```

**webpack.config.js:**
```javascript
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    admin: './functions/private/js/admin.js',
    main: './public-site/js/main.js',
    dashboard: './public-site/js/dashboard.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist/js'),
    filename: '[name].bundle.min.js'
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,  // Remove console.logs
            passes: 2
          },
          mangle: true,
          output: {
            comments: false
          }
        },
        extractComments: false
      })
    ],
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        firebase: {
          test: /[\\/]firebase[\\/]/,
          name: 'firebase-vendor',
          priority: 10
        }
      }
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  }
};
```

**Build command:**
```bash
npx webpack --config webpack.config.js
```

**package.json script:**
```json
{
  "scripts": {
    "build": "webpack --config webpack.config.js",
    "build:watch": "webpack --config webpack.config.js --watch",
    "build:prod": "NODE_ENV=production webpack --config webpack.config.js"
  }
}
```

#### Option 2: Simple Terser (No Bundling)

**Install:**
```bash
npm install --save-dev terser
```

**Minify script:**
```bash
# Admin JS
npx terser functions/private/js/admin.js -o functions/private/js/admin.min.js -c -m

# Public JS
npx terser public-site/js/main.js -o public-site/js/main.min.js -c -m
npx terser public-site/js/dashboard.js -o public-site/js/dashboard.min.js -c -m
```

**Add to package.json:**
```json
{
  "scripts": {
    "minify:admin": "terser functions/private/js/admin.js -o functions/private/js/admin.min.js -c -m",
    "minify:public": "terser public-site/js/*.js -d public-site/js --name-cache .terser-cache.json -c -m",
    "minify:all": "npm run minify:admin && npm run minify:public"
  }
}
```

---

## 2️⃣ Firestore Performance Optimization

### A. Pagination for Orders

**Old Method (Loads ALL orders):**
```javascript
// ❌ BAD - Fetches entire collection
async function loadOrders() {
  const ordersRef = collection(db, 'orders');
  const snapshot = await getDocs(ordersRef);
  
  const orders = [];
  snapshot.forEach(doc => {
    orders.push({ id: doc.id, ...doc.data() });
  });
  
  return orders;  // Could be 1000+ orders!
}
```

**New Method (Paginated):**
```javascript
// ✅ GOOD - Fetches only 20 orders at a time
let lastOrderDoc = null;
const PAGE_SIZE = 20;

async function loadOrdersPage(pageSize = PAGE_SIZE) {
  const ordersRef = collection(db, 'orders');
  
  // Build query with pagination
  let q = query(
    ordersRef,
    orderBy('createdAt', 'desc'),
    limit(pageSize)
  );
  
  // If continuing from previous page
  if (lastOrderDoc) {
    q = query(
      ordersRef,
      orderBy('createdAt', 'desc'),
      startAfter(lastOrderDoc),
      limit(pageSize)
    );
  }
  
  const snapshot = await getDocs(q);
  
  // Store last document for next page
  if (snapshot.docs.length > 0) {
    lastOrderDoc = snapshot.docs[snapshot.docs.length - 1];
  }
  
  const orders = [];
  snapshot.forEach(doc => {
    orders.push({ id: doc.id, ...doc.data() });
  });
  
  return {
    orders,
    hasMore: snapshot.docs.length === pageSize
  };
}

// Load more button handler
async function loadMoreOrders() {
  const { orders, hasMore } = await loadOrdersPage();
  
  orders.forEach(order => {
    renderOrderRow(order);
  });
  
  // Hide "Load More" button if no more results
  if (!hasMore) {
    document.getElementById('load-more-btn').style.display = 'none';
  }
}

// Infinite scroll implementation
function setupInfiniteScroll() {
  const ordersContainer = document.getElementById('orders-list');
  
  const observer = new IntersectionObserver(async (entries) => {
    const lastEntry = entries[0];
    
    if (lastEntry.isIntersecting) {
      const { orders, hasMore } = await loadOrdersPage();
      
      orders.forEach(order => {
        renderOrderRow(order);
      });
      
      if (!hasMore) {
        observer.disconnect();
      }
    }
  }, {
    rootMargin: '100px'
  });
  
  // Observe last order row
  const lastRow = ordersContainer.lastElementChild;
  if (lastRow) observer.observe(lastRow);
}
```

---

### B. Firestore Persistence (Offline Cache)

**Enable in admin.js and main site:**

```javascript
// Enable Firestore persistence
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
  getFirestore, 
  enableIndexedDbPersistence,
  enableMultiTabIndexedDbPersistence
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Enable offline persistence
async function enablePersistence() {
  try {
    // Multi-tab persistence (better for most cases)
    await enableMultiTabIndexedDbPersistence(db);
    console.log('✅ Firestore persistence enabled (multi-tab)');
  } catch (err) {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, fallback to single-tab
      console.warn('⚠️ Multi-tab persistence failed, trying single-tab...');
      try {
        await enableIndexedDbPersistence(db);
        console.log('✅ Firestore persistence enabled (single-tab)');
      } catch (err2) {
        console.error('❌ Persistence failed:', err2);
      }
    } else if (err.code === 'unimplemented') {
      console.warn('⚠️ Browser does not support persistence');
    }
  }
}

enablePersistence();
```

**Benefits:**
- Instant load times on repeat visits
- Works offline
- Reduces Firestore reads (saves money)
- Automatically syncs when online

---

### C. Fix N+1 Query Problem (Products with Reviews)

**❌ BAD - N+1 Problem:**
```javascript
// Fetches products
const products = await getDocs(collection(db, 'products'));

// Then fetches reviews for EACH product (N additional queries)
for (const product of products.docs) {
  const reviewsSnapshot = await getDocs(
    query(
      collection(db, 'reviews'),
      where('productId', '==', product.id)
    )
  );
  
  product.reviewsCount = reviewsSnapshot.size;
}
```

**✅ GOOD - Batch Query Solution:**

```javascript
// Solution 1: Store review count in product document
async function updateProductReviewCount(productId) {
  const reviewsRef = collection(db, 'reviews');
  const q = query(reviewsRef, where('productId', '==', productId));
  const snapshot = await getDocs(q);
  
  // Update product with count
  await updateDoc(doc(db, 'products', productId), {
    reviewsCount: snapshot.size,
    averageRating: calculateAverage(snapshot.docs.map(d => d.data().rating))
  });
}

// Solution 2: Fetch all reviews in one query
async function loadProductsWithReviews() {
  // Fetch products (limit to current page)
  const productsRef = collection(db, 'products');
  const productsQuery = query(productsRef, limit(20));
  const productsSnapshot = await getDocs(productsQuery);
  
  const products = [];
  const productIds = [];
  
  productsSnapshot.forEach(doc => {
    const productData = { id: doc.id, ...doc.data() };
    products.push(productData);
    productIds.push(doc.id);
  });
  
  // Fetch ALL reviews for these products in ONE query
  if (productIds.length > 0) {
    const reviewsRef = collection(db, 'reviews');
    const reviewsQuery = query(
      reviewsRef,
      where('productId', 'in', productIds)  // Max 10 products per query
    );
    const reviewsSnapshot = await getDocs(reviewsQuery);
    
    // Group reviews by product ID
    const reviewsByProduct = {};
    reviewsSnapshot.forEach(doc => {
      const review = doc.data();
      if (!reviewsByProduct[review.productId]) {
        reviewsByProduct[review.productId] = [];
      }
      reviewsByProduct[review.productId].push(review);
    });
    
    // Attach reviews to products
    products.forEach(product => {
      product.reviews = reviewsByProduct[product.id] || [];
      product.reviewsCount = product.reviews.length;
      product.averageRating = calculateAverage(
        product.reviews.map(r => r.rating)
      );
    });
  }
  
  return products;
}

// Solution 3: Cloud Function to maintain counts (Best)
// functions/index.js
exports.updateReviewCount = functions.firestore
  .document('reviews/{reviewId}')
  .onWrite(async (change, context) => {
    const review = change.after.exists ? change.after.data() : change.before.data();
    const productId = review.productId;
    
    // Count reviews
    const reviewsRef = collection(db, 'reviews');
    const q = query(reviewsRef, where('productId', '==', productId));
    const snapshot = await getDocs(q);
    
    // Calculate average
    let totalRating = 0;
    snapshot.forEach(doc => {
      totalRating += doc.data().rating || 0;
    });
    const averageRating = snapshot.size > 0 ? totalRating / snapshot.size : 0;
    
    // Update product
    await updateDoc(doc(db, 'products', productId), {
      reviewsCount: snapshot.size,
      averageRating: Math.round(averageRating * 10) / 10
    });
    
    console.log(`✅ Updated product ${productId}: ${snapshot.size} reviews, avg ${averageRating}`);
  });
```

**Batching for > 10 products (Firestore `in` limit):**
```javascript
async function loadReviewsForManyProducts(productIds) {
  const reviews = [];
  
  // Split into chunks of 10 (Firestore 'in' operator limit)
  const chunks = [];
  for (let i = 0; i < productIds.length; i += 10) {
    chunks.push(productIds.slice(i, i + 10));
  }
  
  // Fetch all chunks in parallel
  const promises = chunks.map(chunk => 
    getDocs(query(
      collection(db, 'reviews'),
      where('productId', 'in', chunk)
    ))
  );
  
  const snapshots = await Promise.all(promises);
  
  snapshots.forEach(snapshot => {
    snapshot.forEach(doc => {
      reviews.push({ id: doc.id, ...doc.data() });
    });
  });
  
  return reviews;
}
```

---

## 3️⃣ Critical Rendering Path Optimization

### A. Script Loading Strategy

**❌ BAD - Render-blocking:**
```html
<!DOCTYPE html>
<html>
<head>
  <!-- BLOCKS rendering until loaded -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <script src="/js/main.js"></script>
</head>
<body>
  <div id="app">Loading...</div>
</body>
</html>
```

**✅ GOOD - Optimized loading:**
```html
<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Latiao Snack - Інтернет-магазин</title>
  
  <!-- Preconnect to external domains -->
  <link rel="preconnect" href="https://cdn.tailwindcss.com">
  <link rel="preconnect" href="https://unpkg.com">
  <link rel="preconnect" href="https://www.gstatic.com">
  <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com">
  
  <!-- Critical CSS inline (above the fold) -->
  <style>
    /* Critical CSS for First Paint */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f9fafb;
    }
    .loader {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 50px;
      height: 50px;
      border: 4px solid #f3f4f6;
      border-top: 4px solid #ff6b00;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: translate(-50%, -50%) rotate(0deg); }
      100% { transform: translate(-50%, -50%) rotate(360deg); }
    }
  </style>
  
  <!-- Defer non-critical CSS -->
  <link rel="preload" href="https://cdn.tailwindcss.com" as="script">
  
  <!-- Async external scripts (don't block rendering) -->
  <script src="https://cdn.tailwindcss.com" async></script>
  <script src="https://unpkg.com/lucide@latest" defer></script>
</head>
<body>
  <!-- Skeleton Screen / Loading State -->
  <div id="app">
    <div class="loader"></div>
  </div>
  
  <!-- Defer main application scripts -->
  <script type="module" src="/js/main.js" defer></script>
  
  <!-- Service Worker for PWA (optional) -->
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(reg => console.log('✅ Service Worker registered'))
          .catch(err => console.error('❌ SW registration failed:', err));
      });
    }
  </script>
</body>
</html>
```

**Admin Panel Optimization:**
```html
<!-- functions/private/index.html -->
<!DOCTYPE html>
<html lang="uk">
<head>
  <!-- Preconnect to Firebase -->
  <link rel="preconnect" href="https://www.gstatic.com">
  <link rel="preconnect" href="https://firestore.googleapis.com">
  <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com">
  
  <!-- Critical CSS inline -->
  <style>
    /* Inline critical styles here */
  </style>
  
  <!-- Async/Defer external libraries -->
  <script src="https://cdn.tailwindcss.com" async></script>
  <script src="https://unpkg.com/lucide@latest" defer></script>
  <script src="https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js" defer></script>
</head>
<body>
  <div id="admin-app">
    <!-- Skeleton Screen -->
    <div class="skeleton-loader">
      <div class="skeleton-header"></div>
      <div class="skeleton-sidebar"></div>
      <div class="skeleton-content"></div>
    </div>
  </div>
  
  <!-- Load Firebase AFTER initial render -->
  <script type="module">
    import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
    // ... rest of Firebase code
  </script>
  
  <!-- Admin JS deferred -->
  <script type="module" src="/js/admin.js" defer></script>
</body>
</html>
```

---

### B. Skeleton Screens for Better UX

**Product Grid Skeleton:**
```html
<!-- public-site/index.html -->
<style>
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s ease-in-out infinite;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  background: white;
}

.skeleton-image {
  width: 100%;
  height: 200px;
  border-radius: 8px;
  margin-bottom: 12px;
}

.skeleton-text {
  height: 16px;
  border-radius: 4px;
  margin-bottom: 8px;
}

.skeleton-text-short {
  width: 60%;
}
</style>

<div id="products-container">
  <!-- Show skeleton while loading -->
  <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
    <!-- Skeleton Card 1 -->
    <div class="skeleton-card">
      <div class="skeleton skeleton-image"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-text skeleton-text-short"></div>
    </div>
    
    <!-- Skeleton Card 2 -->
    <div class="skeleton-card">
      <div class="skeleton skeleton-image"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-text skeleton-text-short"></div>
    </div>
    
    <!-- ... repeat 8 times -->
  </div>
</div>

<script>
// Replace skeleton with real products
async function loadProducts() {
  const products = await fetchProducts();
  const container = document.getElementById('products-container');
  
  // Clear skeleton
  container.innerHTML = '';
  
  // Render real products
  products.forEach(product => {
    container.appendChild(createProductCard(product));
  });
}

// Start loading immediately
loadProducts();
</script>
```

**Admin Dashboard Skeleton:**
```html
<!-- functions/private/index.html -->
<style>
.skeleton-header {
  height: 80px;
  background: linear-gradient(90deg, #e5e7eb 25%, #d1d5db 50%, #e5e7eb 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-sidebar {
  position: fixed;
  left: 0;
  top: 80px;
  width: 250px;
  height: calc(100vh - 80px);
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-content {
  margin-left: 250px;
  margin-top: 80px;
  padding: 24px;
}

.skeleton-table-row {
  height: 60px;
  margin-bottom: 8px;
  background: linear-gradient(90deg, #f9fafb 25%, #f3f4f6 50%, #f9fafb 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 8px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>

<div id="admin-skeleton" class="skeleton-wrapper">
  <div class="skeleton-header"></div>
  <div class="skeleton-sidebar"></div>
  <div class="skeleton-content">
    <div class="skeleton-table-row"></div>
    <div class="skeleton-table-row"></div>
    <div class="skeleton-table-row"></div>
    <div class="skeleton-table-row"></div>
    <div class="skeleton-table-row"></div>
  </div>
</div>

<div id="admin-real-content" style="display: none;">
  <!-- Real admin panel content -->
</div>

<script>
// Hide skeleton and show real content when loaded
window.addEventListener('DOMContentLoaded', async () => {
  // Wait for Firebase and data
  await loadInitialData();
  
  // Smooth transition
  document.getElementById('admin-skeleton').style.opacity = '0';
  document.getElementById('admin-skeleton').style.transition = 'opacity 0.3s';
  
  setTimeout(() => {
    document.getElementById('admin-skeleton').style.display = 'none';
    document.getElementById('admin-real-content').style.display = 'block';
  }, 300);
});
</script>
```

---

## 4️⃣ Firebase Hosting Configuration

### Optimized firebase.json

```json
{
  "hosting": [
    {
      "target": "main",
      "public": "public-site",
      "cleanUrls": true,
      "trailingSlash": false,
      "ignore": [
        "firebase.json",
        "**/.*",
        "**/node_modules/**"
      ],
      "headers": [
        {
          "source": "**/*.@(jpg|jpeg|gif|png|svg|webp|ico)",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "public, max-age=31536000, immutable"
            },
            {
              "key": "Vary",
              "value": "Accept-Encoding"
            }
          ]
        },
        {
          "source": "**/*.@(woff|woff2|ttf|eot)",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "public, max-age=31536000, immutable"
            },
            {
              "key": "Access-Control-Allow-Origin",
              "value": "*"
            }
          ]
        },
        {
          "source": "**/*.@(js|css)",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "public, max-age=31536000, immutable"
            },
            {
              "key": "Vary",
              "value": "Accept-Encoding"
            }
          ]
        },
        {
          "source": "**/*.html",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "public, max-age=3600, must-revalidate"
            }
          ]
        },
        {
          "source": "/service-worker.js",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "no-cache, no-store, must-revalidate"
            }
          ]
        },
        {
          "source": "**",
          "headers": [
            {
              "key": "X-Content-Type-Options",
              "value": "nosniff"
            },
            {
              "key": "X-Frame-Options",
              "value": "SAMEORIGIN"
            },
            {
              "key": "X-XSS-Protection",
              "value": "1; mode=block"
            },
            {
              "key": "Referrer-Policy",
              "value": "strict-origin-when-cross-origin"
            }
          ]
        }
      ],
      "rewrites": [
        {
          "source": "/api/**",
          "function": "api"
        }
      ],
      "redirects": [
        {
          "source": "/old-page",
          "destination": "/new-page",
          "type": 301
        }
      ]
    },
    {
      "target": "adminpanel",
      "public": "functions/private",
      "cleanUrls": false,
      "trailingSlash": false,
      "ignore": [
        "firebase.json",
        "**/.*",
        "**/node_modules/**"
      ],
      "headers": [
        {
          "source": "**/*.@(js|css|html)",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "no-cache, no-store, must-revalidate"
            },
            {
              "key": "Pragma",
              "value": "no-cache"
            },
            {
              "key": "Expires",
              "value": "0"
            }
          ]
        },
        {
          "source": "**/*.@(jpg|jpeg|gif|png|svg|webp|ico)",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "public, max-age=86400"
            }
          ]
        },
        {
          "source": "**",
          "headers": [
            {
              "key": "X-Content-Type-Options",
              "value": "nosniff"
            },
            {
              "key": "X-Frame-Options",
              "value": "DENY"
            },
            {
              "key": "X-XSS-Protection",
              "value": "1; mode=block"
            },
            {
              "key": "Strict-Transport-Security",
              "value": "max-age=31536000; includeSubDomains"
            }
          ]
        }
      ]
    }
  ]
}
```

**Key Cache Strategies:**

| Asset Type | Cache Duration | Reason |
|---|---|---|
| Images (jpg, png, webp) | 1 year (immutable) | Content-based naming |
| JS/CSS bundles | 1 year (immutable) | Versioned filenames |
| HTML files | 1 hour (must-revalidate) | Dynamic content |
| Service Worker | No cache | Always fetch latest |
| Admin panel | No cache | Security & freshness |

---

## 5️⃣ Performance Monitoring

### Add Performance API Tracking

```javascript
// public-site/js/performance-monitor.js
class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.init();
  }
  
  init() {
    // Wait for page to fully load
    window.addEventListener('load', () => {
      this.collectMetrics();
      this.sendToAnalytics();
    });
  }
  
  collectMetrics() {
    // Get Navigation Timing
    const perfData = performance.getEntriesByType('navigation')[0];
    
    if (perfData) {
      this.metrics = {
        // DNS + TCP + TLS
        connectionTime: Math.round(perfData.connectEnd - perfData.connectStart),
        
        // Time to First Byte
        ttfb: Math.round(perfData.responseStart - perfData.requestStart),
        
        // DOM Content Loaded
        domContentLoaded: Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart),
        
        // Full Page Load
        pageLoadTime: Math.round(perfData.loadEventEnd - perfData.loadEventStart),
        
        // Total Time
        totalTime: Math.round(perfData.loadEventEnd - perfData.fetchStart)
      };
    }
    
    // Get Largest Contentful Paint (LCP)
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.metrics.lcp = Math.round(lastEntry.renderTime || lastEntry.loadTime);
      console.log('📊 LCP:', this.metrics.lcp, 'ms');
    });
    
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
    
    // Get First Input Delay (FID)
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        this.metrics.fid = Math.round(entry.processingStart - entry.startTime);
        console.log('📊 FID:', this.metrics.fid, 'ms');
      });
    });
    
    fidObserver.observe({ entryTypes: ['first-input'] });
    
    // Get Cumulative Layout Shift (CLS)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      this.metrics.cls = Math.round(clsValue * 1000) / 1000;
      console.log('📊 CLS:', this.metrics.cls);
    });
    
    clsObserver.observe({ entryTypes: ['layout-shift'] });
    
    console.log('📊 Performance Metrics:', this.metrics);
  }
  
  sendToAnalytics() {
    // Send to Firebase Analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'page_performance', {
        event_category: 'Performance',
        page_load_time: this.metrics.totalTime,
        lcp: this.metrics.lcp,
        fid: this.metrics.fid,
        cls: this.metrics.cls
      });
    }
  }
  
  // Get current page performance
  static getCurrentMetrics() {
    const navigation = performance.getEntriesByType('navigation')[0];
    return {
      dns: Math.round(navigation.domainLookupEnd - navigation.domainLookupStart),
      tcp: Math.round(navigation.connectEnd - navigation.connectStart),
      ttfb: Math.round(navigation.responseStart - navigation.requestStart),
      download: Math.round(navigation.responseEnd - navigation.responseStart),
      dom: Math.round(navigation.domComplete - navigation.domLoading),
      load: Math.round(navigation.loadEventEnd - navigation.loadEventStart),
      total: Math.round(navigation.loadEventEnd - navigation.fetchStart)
    };
  }
}

// Initialize
const perfMonitor = new PerformanceMonitor();

// Expose for console debugging
window.getPerformance = () => PerformanceMonitor.getCurrentMetrics();
```

---

## 6️⃣ Implementation Checklist

### Phase 1: Quick Wins (Week 1)
- [ ] Add `loading="lazy"` to all product images
- [ ] Enable Firestore persistence
- [ ] Add cache headers to firebase.json
- [ ] Defer non-critical scripts
- [ ] Add preconnect links

### Phase 2: Asset Optimization (Week 2)
- [ ] Convert images to WebP (manual or automated)
- [ ] Implement image lazy loading with IntersectionObserver
- [ ] Minify JavaScript files
- [ ] Bundle vendor scripts

### Phase 3: Data Optimization (Week 3)
- [ ] Implement pagination for orders (20 per page)
- [ ] Add infinite scroll for products
- [ ] Fix N+1 queries (batch product reviews)
- [ ] Add Cloud Function for review count updates

### Phase 4: UX Improvements (Week 4)
- [ ] Add skeleton screens to main site
- [ ] Add skeleton screens to admin panel
- [ ] Implement loading states for all async operations
- [ ] Add performance monitoring

### Phase 5: Advanced (Optional)
- [ ] Implement Service Worker for PWA
- [ ] Add request coalescing for duplicate queries
- [ ] Implement virtual scrolling for long lists
- [ ] Add predictive prefetching

---

## 7️⃣ Expected Results

### Before Optimization:
- Page Load: **~4-6 seconds**
- LCP: **~3.5 seconds**
- FID: **~300ms**
- CLS: **~0.25**
- Lighthouse Score: **~45-60**

### After Optimization:
- Page Load: **~1.2-1.5 seconds** ✅
- LCP: **~1.8 seconds** ✅
- FID: **~50ms** ✅
- CLS: **~0.05** ✅
- Lighthouse Score: **~85-95** ✅

### Firestore Reads Reduction:
- Before: **~500 reads per page load**
- After: **~50 reads per page load** (90% reduction)

---

## 8️⃣ Testing & Validation

### Tools to Use:

1. **Google Lighthouse**
```bash
# Install
npm install -g lighthouse

# Run test
lighthouse https://latiao-snack.com.ua --view
```

2. **WebPageTest**
- Visit: https://webpagetest.org
- Test from multiple locations

3. **Chrome DevTools Performance Tab**
- Open DevTools (F12)
- Performance tab → Record
- Analyze waterfall

4. **Firebase Performance Monitoring**
```javascript
import { getPerformance } from 'firebase/performance';
const perf = getPerformance();
```

---

## 🎯 Priority Actions (Start Today)

1. **Add to firebase.json** (5 minutes)
   - Copy optimized headers configuration

2. **Enable Firestore Persistence** (10 minutes)
   - Add to admin.js and main.js

3. **Add lazy loading** (15 minutes)
   - Add `loading="lazy"` to all `<img>` tags

4. **Defer scripts** (10 minutes)
   - Add `defer` or `async` to non-critical scripts

5. **Implement pagination** (1 hour)
   - Update orders loading to use `limit(20)`

**Total Time: ~2 hours for 70% improvement**

---

**Document Created:** February 4, 2026  
**Version:** 1.0  
**Author:** Senior Performance Engineer
