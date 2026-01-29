# 🚀 AI Merchandising - Quick Reference

## 📋 TL;DR

Gemini AI тепер показує product cards з фото та цінами прямо в чаті.

---

## 🎯 User Flow

```
Клієнт → "Хочу latiao"
AI → "Який рівень гостроти? (1-5)"
Клієнт → "5"
AI → [Shows visual product cards]
Click card → Navigate to product.html
```

---

## 🔧 Key Components

### 1. **Backend: chat-logic.js**

```javascript
// Search products by spiciness
searchProductsBySpiciness(5)
  → Returns: [{id, name, price, spiciness, image}]

// AI command format
[SEARCH_SPICINESS:5]
  → Triggers product search
  → Returns JSON to widget
```

### 2. **Frontend: chat-widget.js**

```javascript
// Detects JSON response
addMessageToUI(sender, text) {
    if (JSON.parse(text).type === 'product_cards') {
        addProductCardsToUI(data);
    }
}

// Renders cards
<div class="product-card" onclick="→ product.html?id=xxx">
    <img> + <name> + <price> + <spiciness 🌶️>
</div>
```

---

## 🎨 Product Card Features

- ✅ 80x80px product image
- ✅ Gradient orange price
- ✅ Spiciness level with chili emoji
- ✅ Hover: lift + scale + border
- ✅ Clickable → opens product page
- ✅ Staggered animation entrance

---

## 🔍 Spiciness Keywords

| Level | Keywords |
|-------|----------|
| 1 | не гострий, негострий, м'який |
| 2 | трохи гострий, легкий |
| 3 | середній, помірний |
| 4 | гострий, пекучий |
| 5 | дуже гострий, пекельний, екстремальний |

---

## 📊 Database Schema

**Collection**: `products`

```javascript
{
    name: string,
    price: number,
    spiciness: number (1-5),
    image: string,           // Primary image
    images: [string],        // Array fallback
}
```

---

## 🧪 Quick Test

1. Open chat widget
2. Type: "Хочу гострих снеків"
3. AI asks about spiciness
4. Reply: "5"
5. **Expected**: Product cards with photos appear
6. Click card → Navigate to product page

---

## 🐛 Debugging

**Console checks:**
```javascript
// Chat Logic
CONFIG.DEBUG = true  // Enable logs

// Look for:
🛍️ Found X products with spiciness Y
🔍 AI requested product search
```

**Common fixes:**
- No cards? → Check `spiciness` field in Firestore
- No images? → Verify `image` or `images[0]` exists
- Click broken? → Check `product.id` field

---

## 📝 System Prompt Template

```
Я ШІ-консультант LATIAO 🌶️

Коли клієнт питає про снеки:
1. Запитуй про рівень гостроти (1-5)
2. Використовуй команду: [SEARCH_SPICINESS:X]

Рівні: 1=м'який, 2=легкий, 3=середній, 4=гострий, 5=пекельний
```

---

## 🎯 Files Modified

- [js/chat-logic.js](js/chat-logic.js) - Product search + AI logic
- [js/chat-widget.js](js/chat-widget.js) - Product card rendering
- [AI_MERCHANDISING_GUIDE.md](AI_MERCHANDISING_GUIDE.md) - Full docs

---

## 🚀 Next Level

**Add to cart button:**
```javascript
const addBtn = document.createElement('button');
addBtn.textContent = '🛒 Додати';
addBtn.onclick = (e) => {
    e.stopPropagation();
    addToCart(product.id);
};
```

**Filter by price:**
```javascript
searchProductsByFilters(spiciness, minPrice, maxPrice)
```

---

**Version**: 1.0.0  
**Created**: 2026-01-25

🎉 **Ready to sell snacks with AI!** 🛍️
