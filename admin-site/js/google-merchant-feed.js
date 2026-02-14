/**
 * Google Merchant Center XML Feed Generator
 * 
 * Generates a valid XML product feed for Google Shopping Ads
 * Compatible with RSS 2.0 and Google's product data specification
 * 
 * @version 1.0.0
 * @author Latiao Club
 */

// ============================================
// CONFIGURATION
// ============================================
const MERCHANT_CONFIG = {
  storeName: 'Latiao Club Store',
  storeUrl: 'https://latiao-snack.com.ua',
  storeDescription: 'Найкращі гострі снеки латіо з Китаю в Україні',
  brand: 'Latiao Snack',
  currency: 'UAH',
  condition: 'new',
  productPagePath: '/product.html?id='
};

// ============================================
// XML ESCAPE UTILITIES
// ============================================

/**
 * Escapes special XML characters
 * @param {string} str - String to escape
 * @returns {string} - Escaped string
 */
function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Strips HTML tags from a string
 * @param {string} html - String with HTML
 * @returns {string} - Clean text
 */
function stripHtml(html) {
  if (!html) return '';
  return String(html)
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Wraps content in CDATA for safe XML inclusion
 * @param {string} content - Content to wrap
 * @returns {string} - CDATA wrapped content
 */
function wrapCDATA(content) {
  if (!content) return '<![CDATA[]]>';
  // Escape any ]]> sequences within the content
  const escaped = String(content).replace(/]]>/g, ']]]]><![CDATA[>');
  return `<![CDATA[${escaped}]]>`;
}

// ============================================
// FEED GENERATION
// ============================================

/**
 * Generates the XML header
 * @returns {string} - XML header with RSS 2.0 and Google namespace
 */
function generateXmlHeader() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
<channel>
  <title>${escapeXml(MERCHANT_CONFIG.storeName)}</title>
  <link>${MERCHANT_CONFIG.storeUrl}</link>
  <description>${escapeXml(MERCHANT_CONFIG.storeDescription)}</description>
`;
}

/**
 * Generates the XML footer
 * @returns {string} - XML closing tags
 */
function generateXmlFooter() {
  return `</channel>
</rss>`;
}

/**
 * Generates XML for a single product item
 * @param {string} productId - Firestore document ID
 * @param {Object} product - Product data from Firestore
 * @returns {string} - XML item element
 */
function generateProductXml(productId, product) {
  // Get values with fallbacks
  const title = product.name || product.title || 'Без назви';
  const description = stripHtml(product.description || product.shortDescription || title);
  const price = product.price || 0;
  const stock = product.stock ?? product.quantity ?? 1; // Default to in stock if not specified
  const availability = stock > 0 ? 'in_stock' : 'out_of_stock';
  
  // Get image URL
  let imageUrl = '';
  if (product.images && product.images.length > 0) {
    imageUrl = product.images[0];
  } else if (product.image) {
    imageUrl = product.image;
  } else if (product.imageUrl) {
    imageUrl = product.imageUrl;
  }
  
  // Ensure image URL is absolute
  if (imageUrl && !imageUrl.startsWith('http')) {
    imageUrl = MERCHANT_CONFIG.storeUrl + (imageUrl.startsWith('/') ? '' : '/') + imageUrl;
  }
  
  // Product link
  const productLink = `${MERCHANT_CONFIG.storeUrl}${MERCHANT_CONFIG.productPagePath}${productId}`;
  
  // Category for Google
  const category = product.category || 'Снеки';
  const googleCategory = product.googleCategory || 'Food, Beverages & Tobacco > Food Items > Snack Foods';
  
  // SKU/GTIN/MPN
  const sku = product.sku || productId;
  const gtin = product.gtin || product.barcode || '';
  
  // Sale price handling
  const isOnSale = product.isOnSale === true && product.originalPrice;
  const salePrice = isOnSale ? price : null;
  const regularPrice = isOnSale ? product.originalPrice : price;
  
  // Weight (if available)
  const weight = product.weight || product.weightGrams || '';
  
  return `  <item>
    <g:id>${escapeXml(productId)}</g:id>
    <g:title>${wrapCDATA(title)}</g:title>
    <g:description>${wrapCDATA(description)}</g:description>
    <g:link>${escapeXml(productLink)}</g:link>
    <g:image_link>${escapeXml(imageUrl)}</g:image_link>
    <g:availability>${availability}</g:availability>
    <g:price>${regularPrice} ${MERCHANT_CONFIG.currency}</g:price>${salePrice ? `
    <g:sale_price>${salePrice} ${MERCHANT_CONFIG.currency}</g:sale_price>` : ''}
    <g:condition>${MERCHANT_CONFIG.condition}</g:condition>
    <g:brand>${escapeXml(MERCHANT_CONFIG.brand)}</g:brand>
    <g:mpn>${escapeXml(sku)}</g:mpn>${gtin ? `
    <g:gtin>${escapeXml(gtin)}</g:gtin>` : ''}
    <g:product_type>${wrapCDATA(category)}</g:product_type>
    <g:google_product_category>${escapeXml(googleCategory)}</g:google_product_category>${weight ? `
    <g:shipping_weight>${weight} g</g:shipping_weight>` : ''}
  </item>
`;
}

/**
 * Main function to generate Google Merchant Center feed
 * Fetches all active products from Firestore and generates XML
 */
window.generateGoogleMerchantFeed = async function() {
  console.log('🛒 Starting Google Merchant Feed generation...');
  
  // Show loading toast
  showFeedToast('🔄 Генерація фіду...', 'loading');
  
  try {
    // Check if Firestore is available
    if (typeof db === 'undefined' || !db) {
      throw new Error('Firestore не підключено');
    }
    
    // Fetch all products from Firestore
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);
    
    if (snapshot.empty) {
      throw new Error('Товари не знайдено');
    }
    
    console.log(`📦 Found ${snapshot.size} products`);
    
    // Start building XML
    let xml = generateXmlHeader();
    let productCount = 0;
    let skippedCount = 0;
    
    // Process each product
    snapshot.forEach(docSnap => {
      const product = docSnap.data();
      const productId = docSnap.id;
      
      // Skip hidden/inactive products
      if (product.isVisible === false || product.isActive === false) {
        skippedCount++;
        console.log(`⏭️ Skipping hidden product: ${product.name || productId}`);
        return;
      }
      
      // Skip products without price
      if (!product.price || product.price <= 0) {
        skippedCount++;
        console.log(`⏭️ Skipping product without price: ${product.name || productId}`);
        return;
      }
      
      // Generate product XML
      xml += generateProductXml(productId, product);
      productCount++;
    });
    
    // Close XML
    xml += generateXmlFooter();
    
    console.log(`✅ Generated feed with ${productCount} products (${skippedCount} skipped)`);
    
    // Trigger download
    downloadXmlFile(xml, 'google_feed.xml');
    
    // Show success message
    showFeedToast(`✅ Фід згенеровано: ${productCount} товарів`, 'success');
    
    return xml;
    
  } catch (error) {
    console.error('❌ Feed generation error:', error);
    showFeedToast(`❌ Помилка: ${error.message}`, 'error');
    throw error;
  }
};

/**
 * Downloads XML content as a file
 * @param {string} xmlContent - XML string to download
 * @param {string} filename - Name for the downloaded file
 */
function downloadXmlFile(xmlContent, filename) {
  const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
  
  console.log(`📥 Downloaded: ${filename}`);
}

/**
 * Shows a toast notification for feed operations
 * @param {string} message - Message to display
 * @param {string} type - 'loading', 'success', or 'error'
 */
function showFeedToast(message, type = 'info') {
  // Remove existing feed toast
  const existingToast = document.getElementById('feed-toast');
  if (existingToast) {
    existingToast.remove();
  }
  
  // Determine colors based on type
  let bgColor, textColor, icon;
  switch (type) {
    case 'loading':
      bgColor = 'bg-blue-500';
      textColor = 'text-white';
      icon = '<div class="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>';
      break;
    case 'success':
      bgColor = 'bg-green-500';
      textColor = 'text-white';
      icon = '✅';
      break;
    case 'error':
      bgColor = 'bg-red-500';
      textColor = 'text-white';
      icon = '❌';
      break;
    default:
      bgColor = 'bg-gray-700';
      textColor = 'text-white';
      icon = 'ℹ️';
  }
  
  // Create toast element
  const toast = document.createElement('div');
  toast.id = 'feed-toast';
  toast.className = `fixed bottom-4 right-4 ${bgColor} ${textColor} px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50 animate-slide-in`;
  toast.innerHTML = `
    <span class="text-lg">${icon}</span>
    <span class="font-medium">${message}</span>
  `;
  
  document.body.appendChild(toast);
  
  // Auto-remove after 5 seconds (except loading)
  if (type !== 'loading') {
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  }
}

// ============================================
// PREVIEW FUNCTION (Optional)
// ============================================

/**
 * Generates and previews the feed in a new window
 */
window.previewGoogleMerchantFeed = async function() {
  try {
    const xml = await window.generateGoogleMerchantFeed();
    
    // Open in new window for preview
    const previewWindow = window.open('', '_blank');
    previewWindow.document.write(`
      <html>
        <head>
          <title>Google Merchant Feed Preview</title>
          <style>
            body { font-family: monospace; padding: 20px; background: #1e1e1e; color: #d4d4d4; }
            pre { white-space: pre-wrap; word-wrap: break-word; }
          </style>
        </head>
        <body>
          <pre>${escapeXml(xml)}</pre>
        </body>
      </html>
    `);
    previewWindow.document.close();
    
  } catch (error) {
    console.error('Preview error:', error);
  }
};

console.log('🛒 Google Merchant Feed module loaded');
// ============================================
// CLOUD FUNCTION URL MODAL
// ============================================

const GOOGLE_FEED_URL = 'https://latiao-snack.com.ua/google_feed.xml';

/**
 * Shows modal with Google Merchant Feed URL
 * For use in Google Merchant Center scheduled fetch
 */
window.showGoogleFeedUrl = function() {
  // Remove existing modal if any
  const existingModal = document.getElementById('google-feed-modal');
  if (existingModal) existingModal.remove();
  
  // Create modal
  const modal = document.createElement('div');
  modal.id = 'google-feed-modal';
  modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
      <div class="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
        <h3 class="text-xl font-bold text-white flex items-center gap-2">
          🛒 Google Merchant Center Feed
        </h3>
      </div>
      <div class="p-6">
        <p class="text-gray-600 mb-4">
          Використовуйте цей URL для налаштування <strong>Scheduled Fetch</strong> в Google Merchant Center:
        </p>
        
        <div class="bg-gray-100 rounded-lg p-4 mb-4">
          <code id="feed-url-text" class="text-sm text-purple-700 break-all select-all">${GOOGLE_FEED_URL}</code>
        </div>
        
        <div class="flex gap-3 mb-6">
          <button onclick="window.copyFeedUrl()" 
            class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
            </svg>
            Копіювати URL
          </button>
          <button onclick="window.open('${GOOGLE_FEED_URL}', '_blank')" 
            class="flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
            </svg>
            Відкрити
          </button>
        </div>
        
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 class="font-semibold text-blue-800 mb-2">📋 Інструкція:</h4>
          <ol class="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Увійдіть в Google Merchant Center</li>
            <li>Перейдіть: <strong>Products → Feeds → Add feed</strong></li>
            <li>Виберіть <strong>Scheduled fetch</strong></li>
            <li>Вставте скопійований URL</li>
            <li>Встановіть частоту: <strong>Щоденно</strong></li>
          </ol>
        </div>
      </div>
      <div class="bg-gray-50 px-6 py-4 flex justify-end">
        <button onclick="document.getElementById('google-feed-modal').remove()" 
          class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition">
          Закрити
        </button>
      </div>
    </div>
  `;
  
  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
  
  document.body.appendChild(modal);
};

/**
 * Copies the feed URL to clipboard
 */
window.copyFeedUrl = function() {
  navigator.clipboard.writeText(GOOGLE_FEED_URL).then(() => {
    // Show success feedback
    const btn = document.querySelector('#google-feed-modal button');
    if (btn) {
      const originalText = btn.innerHTML;
      btn.innerHTML = '✅ Скопійовано!';
      btn.classList.remove('bg-purple-600', 'hover:bg-purple-700');
      btn.classList.add('bg-green-600');
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.classList.remove('bg-green-600');
        btn.classList.add('bg-purple-600', 'hover:bg-purple-700');
      }, 2000);
    }
  }).catch(err => {
    console.error('Copy failed:', err);
    // Fallback: select text
    const urlText = document.getElementById('feed-url-text');
    if (urlText) {
      const range = document.createRange();
      range.selectNode(urlText);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
    }
  });
};