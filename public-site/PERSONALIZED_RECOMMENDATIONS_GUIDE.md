# 🎯 AI-Powered Personalized Recommendations

## Quick Reference Guide

### Overview
This system provides personalized product recommendations based on user behavior tracking, price sensitivity analysis, and category preferences.

---

## Key Features

| Feature | Description |
|---------|-------------|
| **User Profile Tracking** | Stores behavior in LocalStorage (`latiao_user_profile`) |
| **Time-Based Engagement** | Tracks time spent per category (>10s threshold) |
| **Price Sensitivity** | Calculates budget/neutral/premium preference |
| **AI Integration Ready** | Optional OpenAI/Gemini API with fallback |
| **Personalized UI** | Dynamic titles and "Personalized for you" badge |

---

## User Profile Structure (LocalStorage)

```javascript
{
  visited_categories: {
    'latiao': { time_spent: 45000, views: 5 },
    'snacks': { time_spent: 20000, views: 3 }
  },
  price_sensitivity: {
    viewed_prices: [129, 149, 199],
    cart_prices: [129, 149],
    average: 142,
    preference: 'budget' // 'budget' | 'neutral' | 'premium'
  },
  cart_interactions: ['product-id-1', 'product-id-2'],
  last_viewed_products: ['product-id-3', 'product-id-4'],
  total_sessions: 5,
  created_at: 1739059200000,
  updated_at: 1739062800000
}
```

---

## Scoring Algorithm

Products are scored based on three factors:

| Factor | Weight | Description |
|--------|--------|-------------|
| **Category Match** | 40% | Higher for categories where user spends more time |
| **Price Match** | 35% | Higher for products within ±20% of user's average price |
| **Novelty** | 25% | Lower for already viewed/carted products |

**Final Score = (Category × 0.4) + (Price × 0.35) + (Novelty × 0.25)**

---

## 📦 Stock Filtering (NEW)

All recommendations are **100% inventory-aware**. Out-of-stock products are never shown.

### Stock Check Logic
1. Checks multiple stock fields: `available_stock`, `stock_quantity`, `stock`, `quantity`
2. Multi-variant products: shows if **at least one variant** is in stock
3. Fallback: visible products with price assumed available if no stock field

### Fallback Strategy
When not enough in-stock personalized recommendations:
1. First fallback: High-stock products from same category
2. Second fallback: Any high-stock products from catalog

### Stock API
```javascript
// Check if product is in stock
window.LatiaoRecommendations.isProductInStock(product) // true/false

// Get stock quantity
window.LatiaoRecommendations.getProductStock(product) // number

// Filter array to in-stock only
window.LatiaoRecommendations.filterInStockProducts(products) // Array
```

---

## User Types & Labels

| Type | Trigger | UI Label |
|------|---------|----------|
| `new` | No history | "Спеціально для вас" |
| `budget` | Avg price < 150 UAH | "Вигідні пропозиції для вас" |
| `premium` | Avg price > 300 UAH | "Преміум вибір для вас" |
| `enthusiast` | >1 min in top category | "Персоналізовано для вас" |
| `neutral` | Default | "Рекомендуємо вам" |

---

## JavaScript API

### Tracking Functions (ES Module)
```javascript
import { trackProductView, trackCartAdd } from './js/personalized-recommendations.js';

// Track product page view
trackProductView(productId, ['latiao', 'spicy'], 129);

// Track cart addition
trackCartAdd(productId, 129, 'latiao');
```

### Global Window API (for non-ES modules)
```javascript
// Access via window object
window.LatiaoRecommendations.getUserProfile();
window.LatiaoRecommendations.getTopCategories();
window.LatiaoRecommendations.getUserType();
window.LatiaoRecommendations.trackCartAdd(id, price, category);
window.LatiaoRecommendations.clearProfile(); // Reset
```

### Get Personalized Recommendations
```javascript
import { getPersonalizedRecommendations } from './js/personalized-recommendations.js';

const recommendations = await getPersonalizedRecommendations(
  currentProductId,
  currentProduct,
  fetchProductsFunction
);
// Returns: Array of up to 4 scored products
```

---

## AI API Configuration (Optional)

To enable external AI API (OpenAI/Gemini):

```javascript
window.LatiaoRecommendations.configureAI({
  enabled: true,
  endpoint: 'https://api.openai.com/v1/chat/completions',
  apiKey: 'sk-...',
  timeout: 3000 // Fallback after 3 seconds
});
```

**Prompt Structure:**
```
Based on this user behavior profile:
- Preferred categories: latiao (45s), snacks (20s)
- Average price interest: 142 UAH (budget)
- Products added to cart: prod-1, prod-2

From this product catalog: [...]
Suggest 4 product IDs that this user is most likely to buy.
```

---

## Files Modified

| File | Changes |
|------|---------|
| `js/personalized-recommendations.js` | **NEW** - Core recommendation engine |
| `product.html` | Integrated tracking + personalized recommendations |
| `category.html` | Category time tracking |
| `js/storefront.js` | Cart tracking integration |
| `js/layout.js` | Global cart tracking |

---

## Testing & Debugging

### Browser Console Commands
```javascript
// View current user profile
window.LatiaoRecommendations.getUserProfile()

// See top categories
window.LatiaoRecommendations.getTopCategories()

// Get user type
window.LatiaoRecommendations.getUserType()

// Clear all tracking data
window.LatiaoRecommendations.clearProfile()
```

### LocalStorage Key
```javascript
localStorage.getItem('latiao_user_profile')
```

### Test Workflow
1. Visit category pages → Check time tracking
2. View products → Verify price recording
3. Add to cart → Confirm cart interactions
4. Return to product → See personalized recommendations

---

## UI Elements

### Recommendation Block
```html
<div class="flex items-center gap-2 mb-4">
  <h2 id="recommendations-title">Також рекомендуємо 🌶️</h2>
  <span id="personalized-badge" class="hidden ...">✨ Персоналізовано</span>
</div>
```

### TOP Badge (for score ≥80)
```html
<div class="absolute top-2 right-2 ...">TOP</div>
```

### Price Match Indicator (💰 for score ≥70)
Shown next to price for products matching user's budget.

---

## Performance Notes

- **Zero DB Writes**: All tracking uses LocalStorage
- **Lazy Session Init**: Only creates profile when needed
- **Time Tracking Interval**: Updates every 5 seconds
- **Fallback Strategy**: Uses category-based recommendations if scoring fails
- **AI Timeout**: 3 second timeout before fallback to local scoring

---

## Future Enhancements

- [ ] Sync profile to Firestore for cross-device personalization
- [ ] A/B testing different scoring weights
- [ ] Machine learning model for price prediction
- [ ] Collaborative filtering ("users like you also bought")
