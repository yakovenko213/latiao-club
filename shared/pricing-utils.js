/**
 * 💰 PRICING UTILITIES - CENTRALIZED WHOLESALE PRICING LOGIC
 * ============================================
 * This file contains the unified pricing calculation logic
 * used across the entire site (Cart, Checkout, Product pages)
 * 
 * Database Structure (Firestore):
 * - Base Price: product.price (Number)
 * - Wholesale Status: product.showWholesale (Boolean)
 * - Tiers: product.wholesaleTiers (Array of objects: {minQty: Number, price: Number})
 */

/**
 * Calculate the effective price per unit based on quantity and wholesale tiers
 * This is the SINGLE SOURCE OF TRUTH for all pricing calculations
 * 
 * @param {Object} item - Product/Item object with pricing data
 * @param {number} quantity - Quantity being purchased
 * @returns {number} - Effective price per unit
 */
function calculateEffectivePrice(item, quantity) {
    const qty = Number(quantity);
    const basePrice = Number(item.price || 0);
    
    // Validation
    if (!item || qty <= 0) {
        console.warn('⚠️ [Pricing] Invalid item or quantity:', { item, quantity });
        return basePrice;
    }
    
    console.log('💰 [Pricing] Calculating price for:', {
        name: item.name,
        basePrice: basePrice,
        showWholesale: item.showWholesale,
        wholesaleTiers: item.wholesaleTiers,
        quantity: qty
    });
    
    // Check if wholesale pricing is enabled
    if (item.showWholesale === true && Array.isArray(item.wholesaleTiers) && item.wholesaleTiers.length > 0) {
        // Sort tiers by minQty descending to find the highest threshold met
        const sortedTiers = [...item.wholesaleTiers].sort((a, b) => Number(b.minQty) - Number(a.minQty));
        
        // Find the first tier where current quantity meets or exceeds minQty
        const applicableTier = sortedTiers.find(tier => qty >= Number(tier.minQty));
        
        if (applicableTier) {
            const wholesalePrice = Number(applicableTier.price);
            const discount = ((basePrice - wholesalePrice) / basePrice * 100).toFixed(1);
            console.log(`✅ [Pricing] Wholesale applied: ${wholesalePrice} UAH (${discount}% off, Qty: ${qty}, Tier: ${applicableTier.minQty}+)`);
            return wholesalePrice;
        }
    }
    
    console.log(`ℹ️ [Pricing] Using base price: ${basePrice} UAH`);
    return basePrice;
}

/**
 * Apply wholesale pricing to a cart item (mutates the item)
 * Updates item.price and adds metadata for UI display
 * 
 * @param {Object} item - Cart item to update
 */
function applyWholesalePricing(item) {
    // Store the original base price if not already stored
    if (!item.basePrice) {
        item.basePrice = Number(item.price);
    }
    
    // Calculate effective price
    const effectivePrice = calculateEffectivePrice(item, item.quantity);
    const oldPrice = item.price;
    item.price = effectivePrice;
    
    // Calculate discount and tier info for UI display
    const basePrice = Number(item.basePrice);
    
    if (effectivePrice < basePrice) {
        // Wholesale price is active
        item.wholesaleDiscount = (basePrice - effectivePrice) / basePrice;
        item.isWholesaleActive = true;
        
        // Find which tier was applied
        if (item.wholesaleTiers && Array.isArray(item.wholesaleTiers)) {
            const sortedTiers = [...item.wholesaleTiers].sort((a, b) => Number(b.minQty) - Number(a.minQty));
            const appliedTier = sortedTiers.find(t => item.quantity >= Number(t.minQty));
            item.wholesaleTier = appliedTier ? Number(appliedTier.minQty) : null;
        }
    } else {
        // No wholesale discount
        item.wholesaleDiscount = 0;
        item.wholesaleTier = null;
        item.isWholesaleActive = false;
    }
    
    if (oldPrice !== effectivePrice) {
        console.log(`💰 [Pricing] Price updated for ${item.name}: ${oldPrice} → ${effectivePrice} UAH (qty: ${item.quantity})`);
    }
}

/**
 * Get wholesale pricing display information
 * Used for showing discount badges and price comparisons
 * 
 * @param {Object} item - Product/Item object
 * @returns {Object} - Display information
 */
function getWholesalePricingInfo(item) {
    const basePrice = Number(item.basePrice || item.price);
    const currentPrice = Number(item.price);
    const isActive = item.isWholesaleActive === true || currentPrice < basePrice;
    
    return {
        isActive: isActive,
        basePrice: basePrice,
        currentPrice: currentPrice,
        savings: isActive ? (basePrice - currentPrice) * item.quantity : 0,
        discountPercent: isActive ? ((basePrice - currentPrice) / basePrice * 100).toFixed(0) : 0,
        tierMinQty: item.wholesaleTier || null
    };
}

/**
 * Format price for display
 * 
 * @param {number} price - Price to format
 * @param {boolean} showDecimals - Whether to show decimal places
 * @returns {string} - Formatted price string
 */
function formatPrice(price, showDecimals = false) {
    const numPrice = Number(price);
    if (isNaN(numPrice)) return '0 грн';
    
    if (showDecimals) {
        return `${numPrice.toFixed(2)} грн`;
    } else {
        return `${Math.round(numPrice)} грн`;
    }
}

// Export functions for use in other scripts
if (typeof window !== 'undefined') {
    window.calculateEffectivePrice = calculateEffectivePrice;
    window.applyWholesalePricing = applyWholesalePricing;
    window.getWholesalePricingInfo = getWholesalePricingInfo;
    window.formatPrice = formatPrice;
    
    console.log('✅ [Pricing Utils] Pricing utilities loaded and exported globally');
}
