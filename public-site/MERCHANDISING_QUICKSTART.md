# ⚡ Merchandising Drag & Drop — Quick Start

## 🎯 Що було зроблено

### ✅ Реалізовано

1. **Сортування по `sortOrder`** з fallback на `createdAt`
2. **Drag & Drop** через SortableJS
3. **Batch Update** в Firestore через `writeBatch()`
4. **Візуальні покращення**: drag handle, анімації, position badges
5. **Smart Strategies**: 6 готових стратегій автосортування

---

## 🚀 Швидкий старт

### 1. Відкрийте Admin Panel
```
https://your-domain.com/admin.html
→ Merchandising (ліва панель)
```

### 2. Виберіть категорію
```
Dropdown → Оберіть категорію → Завантажити
```

### 3. Змініть порядок
**Варіант A**: Перетягніть картку мишкою  
**Варіант B**: Натисніть кнопку стратегії (💰, 🔥, 📦...)

### 4. Збережіть
```
Кнопка "Зберегти порядок" → ✅ Успіх!
```

---

## 🔧 Що оновлено в коді

### 1. **Функція завантаження** (`loadMerchProducts`)
```javascript
// Додано сортування з fallback
merchProducts.sort((a, b) => {
  if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
    return a.sortOrder - b.sortOrder
  }
  // Fallback to createdAt
  const aTime = a.createdAt?.toMillis?.() || 0
  const bTime = b.createdAt?.toMillis?.() || 0
  return bTime - aTime
})
```

### 2. **SortableJS ініціалізація** (`initMerchSortable`)
```javascript
merchSortableInstance = new Sortable(sortableEl, {
  animation: 250,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  ghostClass: 'opacity-30 scale-95',
  chosenClass: 'ring-4 ring-spicy/50 scale-105 shadow-2xl',
  onEnd: function(evt) {
    // Enable save button
    merchOrderChanged = true
  }
})
```

### 3. **Batch збереження** (`saveMerchLayout`)
```javascript
const batch = writeBatch(db)
merchProducts.forEach((product, index) => {
  batch.update(doc(db, 'products', product.id), { 
    sortOrder: index,
    sortUpdatedAt: new Date()
  })
})
await batch.commit()
```

### 4. **Drag Handle UI** (`renderMerchGrid`)
```html
<div class="drag-handle-icon opacity-0 group-hover:opacity-100">
  <i data-lucide="grip-vertical"></i>
  <span>Drag</span>
</div>
```

### 5. **CSS анімації**
```css
.merch-card.sortable-chosen {
  transform: scale(1.05);
  box-shadow: 0 25px 50px rgba(255, 107, 0, 0.4);
}

@keyframes pulse-drag {
  0%, 100% { opacity: 0.9; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
}
```

---

## 📊 Структура даних

### До оновлення
```json
{
  "id": "prod123",
  "name": "Latiao Original",
  "category": "pom-rno-gostre-latyao",
  "price": 150,
  "stock": 20,
  "createdAt": { "_seconds": 1234567890 }
}
```

### Після збереження порядку
```json
{
  "id": "prod123",
  "name": "Latiao Original",
  "category": "pom-rno-gostre-latyao",
  "price": 150,
  "stock": 20,
  "createdAt": { "_seconds": 1234567890 },
  "sortOrder": 0,                    // ← Нове
  "sortUpdatedAt": "2026-01-24..."   // ← Нове
}
```

---

## 🎨 UI Елементи

### Drag Handle (при hover)
```
┌─────────────────┐
│     🤚          │  ← Drag Handle з'являється
│   ≡ Drag        │     при наведенні
│                 │
│   [Товар]       │
│   150 грн       │
│   20 шт         │
└─────────────────┘
```

### Position Badge (завжди видимий)
```
┌─────────────────┐
│              ①  │  ← Номер позиції
│                 │
│   [Товар]       │
│   150 грн       │
└─────────────────┘
```

---

## ⚡ Автоматичні стратегії

| Іконка | Назва | Сортування |
|--------|-------|------------|
| 💰 | Margin Booster | Ціна ↓ (дорогі першими) |
| 🔥 | Hot Deals | Знижки першими |
| 📦 | Inventory Flush | Залишок ↓ (багато першими) |
| 🛑 | Scarcity Effect | Залишок ↑ (мало першими) |
| ✨ | New Drops | Дата створення ↓ |
| 📉 | Bury OOS | Stock=0 вниз |

**Важливо**: Всі стратегії автоматично ховають OOS товари в кінець.

---

## 🐛 Troubleshooting

### Проблема: Товари не завантажуються
**Рішення:**
```javascript
// Console (F12)
window.debugAllProducts()
window.inspectCategoryValues()
```

### Проблема: Drag не працює
**Перевірте:**
1. SortableJS завантажився: `console.log(merchSortableInstance)`
2. Елемент `.merch-card` існує в DOM
3. Клас `sortable-grid` на контейнері

### Проблема: Порядок не зберігається
**Перевірте консоль:**
```
💾 [SAVE] Starting batch update for 12 products...
✅ [SAVE] Batch commit successful!
```

Якщо помилка:
- Перевірте права доступу в Firestore Rules
- Перевірте інтернет-з'єднання
- Перевірте ліміти Firestore (500 ops/batch)

---

## 🔥 Переваги

✅ **Інтуїтивно** — візуальне перетягування  
✅ **Швидко** — batch update одна транзакція  
✅ **Гнучко** — ручне + автоматичне сортування  
✅ **Responsive** — працює на всіх пристроях  
✅ **Красиво** — плавні анімації  

---

## 📚 Додаткова документація

- [MERCHANDISING_DRAG_DROP_GUIDE.md](./MERCHANDISING_DRAG_DROP_GUIDE.md) — повний опис
- [SortableJS Docs](https://sortablejs.github.io/Sortable/) — документація бібліотеки
- [Firestore Batch Writes](https://firebase.google.com/docs/firestore/manage-data/transactions#batched-writes) — офіційна документація

---

**Готово до використання!** 🚀

Тепер ви можете керувати порядком товарів в категоріях через простий drag-and-drop інтерфейс.
