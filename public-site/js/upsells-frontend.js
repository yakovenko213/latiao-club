/**
 * ============================================
 * FRONTEND UPSELLS INTEGRATION
 * ============================================
 * This file provides functions to integrate upsells into the public website
 * Include this in your main site's JavaScript to use upsells functionality
 * ============================================
 */

/**
 * Get upsells for a specific product (for frontend use)
 * @param {string} productId - Product ID to get upsells for
 * @param {string} location - Where the upsells will be displayed ('productPage', 'cart', 'popup')
 * @returns {Promise<Array>} Array of product suggestions with discount info
 */
export async function getUpsellsForProduct(productId, location = 'productPage') {
  try {
    // Import Firebase functions (adjust the path as needed)
    const { getFirestore, collection, query, where, getDocs, doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    const { getApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
    
    const app = getApp();
    const db = getFirestore(app);
    
    // Get upsell rules for this product
    const upsellsRef = collection(db, 'upsells');
    const q = query(
      upsellsRef, 
      where('triggerId', '==', productId),
      where('isActive', '==', true)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log(`No upsell rules found for product: ${productId}`);
      return [];
    }
    
    const results = [];
    
    for (const ruleDoc of snapshot.docs) {
      const rule = ruleDoc.data();
      
      // Check if this rule should be displayed in the requested location
      if (!rule.locations || !rule.locations[location]) {
        continue;
      }
      
      // Fetch the suggested products
      for (const suggestedId of (rule.suggestedIds || [])) {
        try {
          const productDoc = await getDoc(doc(db, 'products', suggestedId));
          if (productDoc.exists()) {
            const productData = { id: productDoc.id, ...productDoc.data() };
            
            // Add upsell information
            productData.upsellInfo = {
              ruleId: ruleDoc.id,
              discount: rule.discount || 0,
              triggerId: rule.triggerId
            };
            
            results.push(productData);
          }
        } catch (error) {
          console.warn(`Could not fetch product ${suggestedId}:`, error);
        }
      }
    }
    
    // Remove duplicates and limit to 5 products
    const uniqueResults = results.filter((product, index, self) =>
      index === self.findIndex(p => p.id === product.id)
    ).slice(0, 5);
    
    console.log(`Found ${uniqueResults.length} upsell products for ${productId} at ${location}`);
    return uniqueResults;
    
  } catch (error) {
    console.error('Error fetching upsells:', error);
    return [];
  }
}

/**
 * Track upsell view (analytics)
 * @param {string} ruleId - Upsell rule ID
 * @param {string} productId - Product ID that was viewed
 * @param {string} location - Where the upsell was shown
 */
export async function trackUpsellView(ruleId, productId, location) {
  try {
    // TODO: Implement analytics tracking
    // You can send this data to your analytics service or store in Firestore
    console.log(`Upsell viewed:`, { ruleId, productId, location, timestamp: new Date() });
  } catch (error) {
    console.error('Error tracking upsell view:', error);
  }
}

/**
 * Track upsell click/conversion (analytics)
 * @param {string} ruleId - Upsell rule ID
 * @param {string} triggerId - Original product ID
 * @param {string} suggestedId - Clicked upsell product ID
 * @param {string} location - Where the click happened
 */
export async function trackUpsellClick(ruleId, triggerId, suggestedId, location) {
  try {
    // TODO: Implement analytics tracking
    // You can send this data to your analytics service or store in Firestore
    console.log(`Upsell clicked:`, { ruleId, triggerId, suggestedId, location, timestamp: new Date() });
  } catch (error) {
    console.error('Error tracking upsell click:', error);
  }
}

/**
 * EXAMPLE USAGE:
 * 
 * // On product page
 * getUpsellsForProduct('product-123', 'productPage').then(upsells => {
 *   if (upsells.length > 0) {
 *     displayUpsellsBlock(upsells);
 *   }
 * });
 * 
 * // In cart
 * cartItems.forEach(item => {
 *   getUpsellsForProduct(item.productId, 'cart').then(upsells => {
 *     displayCartUpsells(upsells);
 *   });
 * });
 * 
 * // In add-to-cart popup
 * function showAddToCartPopup(productId) {
 *   getUpsellsForProduct(productId, 'popup').then(upsells => {
 *     if (upsells.length > 0) {
 *       showUpsellsInPopup(upsells);
 *     }
 *   });
 * }
 * 
 * // Example display function
 * function displayUpsellsBlock(upsells) {
 *   const container = document.getElementById('upsells-container');
 *   container.innerHTML = upsells.map(product => `
 *     <div class="upsell-item" onclick="trackUpsellClick('${product.upsellInfo.ruleId}', '${product.upsellInfo.triggerId}', '${product.id}', 'productPage')">
 *       <img src="${product.imageUrl}" alt="${product.name}">
 *       <h3>${product.name}</h3>
 *       <div class="price">
 *         ${product.upsellInfo.discount > 0 ? 
 *           `<span class="original">${product.price}₴</span>
 *            <span class="discounted">${Math.round(product.price * (1 - product.upsellInfo.discount / 100))}₴</span>
 *            <span class="discount">-${product.upsellInfo.discount}%</span>` :
 *           `<span>${product.price}₴</span>`
 *         }
 *       </div>
 *       <button onclick="addToCart('${product.id}')">Додати в кошик</button>
 *     </div>
 *   `).join('');
 * }
 */