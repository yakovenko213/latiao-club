# 🛍️ AI Merchandising Consultant - Complete Guide

## 📋 Overview

Ваш Gemini 2.0 Flash assistant тепер діє як професійний мерчандайзинг консультант, який:
- 🔍 Шукає продукти в Firestore за рівнем гостроти
- 💬 Веде інтерактивний діалог з клієнтами
- 🖼️ Показує візуальні картки продуктів з фото та цінами
- 🔗 Надає кликабельні посилання на сторінки товарів

---

## 🎯 How It Works

### 1️⃣ User Interaction Flow

```
Клієнт: "Хочу latiao"
    ↓
AI: "Який рівень гостроти ви хочете? (1-5)"
    ↓
Клієнт: "5" або "дуже гострий"
    ↓
AI: [Searches Firestore for spiciness=5]
    ↓
Widget: Renders product cards with images
```

### 2️⃣ Backend Logic (chat-logic.js)

#### **Enhanced System Prompt**
AI отримує інструкції:
```javascript
📋 ВАЖЛИВІ ІНСТРУКЦІЇ:
- Ти консультант інтернет-магазину LATIAO (китайські снеки)
- У тебе є доступ до каталогу продуктів
- Коли клієнт питає про снеки або latiao, ОБОВ'ЯЗКОВО запитай про рівень гостроти (1-5)
- Після того як клієнт вказав рівень гостроти, ВИКОРИСТАЙ КОМАНДУ для пошуку: [SEARCH_SPICINESS:X]
```

#### **Product Search Function**
```javascript
async function searchProductsBySpiciness(spiciness) {
    // Queries Firestore: products collection
    // Filters by: spiciness == X
    // Returns: [{id, name, price, spiciness, image}]
}
```

#### **Spiciness Detection**
```javascript
function extractSpicinessLevel(message) {
    // Detects: "3", "середньої гостроти", "дуже гострий"
    // Keywords mapping:
    // 1 = не гострий, м'який
    // 2 = трохи гострий, легкий
    // 3 = середній, помірний
    // 4 = гострий, пекучий
    // 5 = дуже гострий, пекельний, екстремальний
}
```

#### **Response Format**
Коли AI знаходить продукти, повертає JSON:
```json
{
    "type": "product_cards",
    "spiciness": 5,
    "products": [
        {
            "id": "prod123",
            "name": "Пекельний Latiao",
            "price": 45,
            "spiciness": 5,
            "image": "https://firebasestorage.../image.jpg"
        }
    ],
    "message": "Ось снеки з рівнем гостроти 5:"
}
```

### 3️⃣ Frontend Rendering (chat-widget.js)

#### **Product Card Detection**
```javascript
function addMessageToUI(sender, text, timestamp) {
    // Try to parse as JSON
    let productData = JSON.parse(text);
    
    if (productData.type === 'product_cards') {
        // Render product cards
        addProductCardsToUI(productData);
    } else {
        // Render regular message
    }
}
```

#### **Product Card Template**
```html
<div class="product-card" onclick="location.href='product.html?id=xxx'">
    <div class="product-card-image">
        <img src="product.image" alt="product.name">
    </div>
    <div class="product-card-info">
        <div class="product-card-name">Назва продукту</div>
        <div class="product-card-meta">
            <div class="product-card-price">45 грн</div>
            <div class="product-card-spiciness">🌶️ 5</div>
        </div>
    </div>
</div>
```

---

## 🎨 Visual Design

### **Product Card Styling**
- ✅ White background with shadow
- ✅ 80x80px product image (rounded corners)
- ✅ Gradient price text (orange)
- ✅ Chili pepper emoji + spiciness level
- ✅ Hover effects: lift + scale + border highlight
- ✅ Clickable with cursor pointer
- ✅ Staggered animation entrance

### **Hover Animations**
```css
.product-card:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    border-color: #FF6B35;
}
```

---

## 📊 Database Structure

### **Firestore Collection: `products`**

Required fields:
```javascript
{
    name: "Пекельний Latiao",           // string
    price: 45,                           // number
    spiciness: 5,                        // number (1-5)
    image: "https://...",                // string (primary image)
    images: ["url1", "url2"],            // array (fallback to images[0])
    // ... other fields
}
```

### **Query Example**
```javascript
const productsRef = collection(db, 'products');
const q = query(
    productsRef,
    where('spiciness', '==', 5),
    orderBy('name', 'asc')
);
```

---

## 🚀 Usage Examples

### **Example 1: Basic Search**
```
👤 Клієнт: Хочу китайські снеки
🤖 AI: Чудово! Який рівень гостроти ви шукаєте? Від 1 (м'який) до 5 (пекельний)?
👤 Клієнт: 3
🤖 AI: [Shows 3 product cards with spiciness=3]
```

### **Example 2: Keyword Detection**
```
👤 Клієнт: Дай щось пекельно гостре
🤖 AI: [Automatically detects "пекельно" = 5]
🤖 AI: [Shows product cards with spiciness=5]
```

### **Example 3: No Results**
```
👤 Клієнт: 5
🤖 AI: На жаль, зараз немає снеків з рівнем гостроти 5. Можу запропонувати інший рівень?
```

---

## 🔧 Configuration

### **1. Update System Prompt (Admin Panel)**

Navigate to: **Admin Panel → Live Chat → AI Settings**

Recommended prompt:
```
Привіт! Я ШІ-консультант LATIAO - магазину найсмачніших китайських снеків! 🌶️

Моя місія - допомогти тобі знайти ідеальний snack за рівнем гостроти (від 1 до 5).

🔥 Рівні гостроти:
1 ⭐ - М'який (для новачків)
2 ⭐⭐ - Легкий (трохи пікантний)
3 ⭐⭐⭐ - Середній (помірна гострота)
4 ⭐⭐⭐⭐ - Гострий (для справжніх любителів)
5 ⭐⭐⭐⭐⭐ - Пекельний (тільки для екстремалів!)

Коли клієнт питає про снеки - ЗАВЖДИ запитуй про рівень гостроти, а потім використовуй команду [SEARCH_SPICINESS:X].
```

### **2. Enable AI in Settings**

1. Open **Admin Panel** ([admin.html](admin.html))
2. Go to **"Чат та підтримка"** section
3. Toggle **"Увімкнути ШІ-асистента"** to ON
4. Save changes

### **3. Gemini API Key**

Already configured in [js/chat-logic.js](js/chat-logic.js):
```javascript
const CONFIG = {
    GEMINI_API_KEY: "AIzaSyA11Wu1XUxEXXeCz3t_NfOr0ygoEblvbhY",
    GEMINI_API_URL: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent"
};
```

---

## 🧪 Testing

### **Test Scenario 1: Product Discovery**
1. Open website in incognito mode
2. Click chat widget
3. Type: "Хочу latiao"
4. Wait for AI question about spiciness
5. Answer: "5"
6. **Expected**: Product cards appear with images and prices

### **Test Scenario 2: Keyword Detection**
1. Open chat widget
2. Type: "Дай середньої гостроти"
3. **Expected**: AI immediately shows products with spiciness=3

### **Test Scenario 3: Click Product**
1. Click on any product card
2. **Expected**: Navigate to `product.html?id=xxx`

---

## 🎯 Advanced Features

### **Multi-Language Support**
Add Russian/English keywords to `extractSpicinessLevel()`:
```javascript
if (msg.includes('mild') || msg.includes('мягкий')) return 1;
if (msg.includes('medium') || msg.includes('средний')) return 3;
if (msg.includes('extreme') || msg.includes('экстремальный')) return 5;
```

### **Filter by Price Range**
Extend search function:
```javascript
async function searchProductsByFilters(spiciness, minPrice, maxPrice) {
    const q = query(
        productsRef,
        where('spiciness', '==', spiciness),
        where('price', '>=', minPrice),
        where('price', '<=', maxPrice)
    );
}
```

### **Show Out of Stock**
Add stock indicator:
```javascript
if (product.stock === 0) {
    card.classList.add('out-of-stock');
    card.innerHTML += '<div class="stock-badge">Немає в наявності</div>';
}
```

---

## 📱 Mobile Optimization

Product cards automatically adapt:
- **Desktop**: 80x80px images, full width cards
- **Mobile**: Same styling, touch-friendly click areas
- **Fullscreen chat**: Cards scroll smoothly in container

---

## 🔍 Debugging

### **Enable Debug Mode**
In [js/chat-logic.js](js/chat-logic.js):
```javascript
const CONFIG = {
    DEBUG: true  // Set to true for console logs
};
```

### **Console Logs to Watch**
```
🛍️ Found 3 products with spiciness 5: [...]
🔍 AI requested product search: spiciness=5
✅ AI Chat Logic: Response saved for chatXXX
```

### **Common Issues**

**Issue**: "Product cards not showing"
- ✅ Check if products exist in Firestore with `spiciness` field
- ✅ Verify AI system prompt includes `[SEARCH_SPICINESS:X]` instruction
- ✅ Check browser console for JSON parsing errors

**Issue**: "Images not loading"
- ✅ Verify `image` or `images[0]` field in Firestore
- ✅ Check CORS settings for Firebase Storage
- ✅ Ensure fallback image exists at `./images/default-product.jpg`

**Issue**: "Clicking card doesn't navigate"
- ✅ Check if `product.id` exists in database
- ✅ Verify `product.html` page exists
- ✅ Test with: `console.log(product.id)` in click handler

---

## 📈 Performance

### **Optimization Tips**
- ✅ Limit search results to 5-10 products
- ✅ Use Firebase composite indexes for complex queries
- ✅ Cache product images in browser
- ✅ Lazy load images with `loading="lazy"`

### **Firestore Query Limits**
Free tier: 50,000 reads/day
- Each search query = 1 read per product found
- Monitor usage in Firebase Console

---

## 🎓 Next Steps

### **Level 1: Basic**
- ✅ Test with real products
- ✅ Customize system prompt personality
- ✅ Add more keyword variations

### **Level 2: Intermediate**
- 🔲 Add category filtering (e.g., "vegetarian latiao")
- 🔲 Implement price range filters
- 🔲 Show related products ("Customers also bought")

### **Level 3: Advanced**
- 🔲 Product recommendations based on chat history
- 🔲 "Add to cart" button in product cards
- 🔲 Analytics: track which products AI recommends most

---

## 📚 Related Documentation

- [LIVE_CHAT_SETUP.md](LIVE_CHAT_SETUP.md) - Full chat system setup
- [AI_ASSISTANT_GEMINI.md](AI_ASSISTANT_GEMINI.md) - Gemini integration details
- [CHAT_WIDGET_UX_OPTIMIZATIONS.md](CHAT_WIDGET_UX_OPTIMIZATIONS.md) - UI/UX features

---

## 🆘 Support

**Questions?**
1. Check browser console logs (F12)
2. Review Firebase Firestore data structure
3. Test with `DEBUG: true` in chat-logic.js

**Need Help?**
- 📧 Check AI system prompt syntax
- 🔍 Verify Firestore product schema
- 🛠️ Review product card click handlers

---

**Version**: 1.0.0  
**Last Updated**: 2026-01-25  
**Author**: Senior Full Stack Developer

🎉 **Happy Merchandising!** 🛍️
