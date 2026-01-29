# ⚡ Merchandising Category Fix — Quick Reference

## 🎯 Що змінилось?

| Було | Стало |
|------|-------|
| ❌ Товари тільки в "us-tovari" | ✅ Кожна категорія функціональна |
| ❌ Порожні категорії без виходу | ✅ Кнопка "Додати з пулу" |
| ❌ Немає перегляду Unassigned | ✅ Спеціальна опція в dropdown |
| ❌ category не оновлюється | ✅ Автооновлення при збереженні |

---

## 🚀 Швидкий старт

### 1. Перегляд нерозподілених товарів
```
Merchandising → Dropdown → "🔄 Нерозподілені"
→ Показує всі товари з us-tovari/undefined
```

### 2. Додавання товарів до категорії
```
Merchandising → Вибрати категорію → "➕ Додати товари з пулу"
→ Modal → Вибрати товари → "Додати до категорії"
→ ✅ Товари з'являються в категорії
```

### 3. Сортування та збереження
```
Drag & drop товари → "Зберегти порядок"
→ ✅ Зберігається sortOrder + category field
```

---

## 🔧 Нові функції

### JavaScript
```javascript
// 1. Завантажити нерозподілені
loadUnassignedProducts()

// 2. Відкрити modal для додавання
openAddProductsModal('category-slug')

// 3. Додати вибрані до категорії
addSelectedProductsToCategory('category-slug')

// 4. Toggle вибору в modal
toggleModalProductSelect('product-id')
toggleModalSelectAll(true/false)
```

### UI Components
```html
<!-- Dropdown опція -->
<option value="__unassigned__">🔄 Нерозподілені</option>

<!-- Кнопка в empty state -->
<button onclick="openAddProductsModal('slug')">
  ➕ Додати товари з пулу
</button>
```

---

## 📊 Структура оновлення Firestore

### При додаванні з modal:
```javascript
{
  category: 'pom-rno-gostre-latyao',  // ← Target slug
  sortOrder: 0,                       // ← Initial position
  updatedAt: Timestamp                // ← Now
}
```

### При збереженні порядку:
```javascript
{
  sortOrder: 3,                       // ← New position
  sortUpdatedAt: Timestamp,           // ← Now
  category: 'current-category-slug'   // ← Locked
}
```

---

## 🎨 Modal структура

```
┌────────────────────────────────────┐
│ Додати товари до категорії    [✕] │
│ Категорія: Помірно гостре латяо   │
├────────────────────────────────────┤
│ [✓] Вибрати всі (42)              │
│                                    │
│ [Grid товарів з checkboxes]       │
│                                    │
├────────────────────────────────────┤
│ Вибрано: 5 товарів                │
│        [Скасувати] [➕ Додати]    │
└────────────────────────────────────┘
```

**Особливості:**
- Backdrop blur
- Responsive grid (2-5 колонок)
- Real-time counter
- Disabled button якщо 0 вибрано
- Auto-reload після додавання

---

## 🔄 Workflow схема

```
┌─────────────────┐
│ 1. Select       │
│ "Unassigned"    │
└────────┬────────┘
         │
         ↓
┌─────────────────┐    ┌──────────────────┐
│ 2. View all     │───→│ 3. Batch transfer│
│ 42 products     │    │ to categories    │
└─────────────────┘    └────────┬─────────┘
                                │
         ┌──────────────────────┘
         │
         ↓
┌─────────────────┐    ┌──────────────────┐
│ 4. Each category│───→│ 5. Drag & Drop   │
│ has products    │    │ to sort          │
└─────────────────┘    └────────┬─────────┘
                                │
                                ↓
                       ┌──────────────────┐
                       │ 6. Save order    │
                       │ + lock category  │
                       └──────────────────┘
```

---

## 🐛 Troubleshooting Quick Fix

| Проблема | Швидке рішення |
|----------|----------------|
| Modal не відкривається | `lucide.createIcons()` |
| Товари не додаються | Перевірити Firestore Rules |
| Категорія порожня | `window.loadMerchProducts()` |
| Checkbox не працюють | Click propagation issue |

### Debug команди:
```javascript
// Console quick checks
window.debugAllProducts()
console.log(categoryMapping)
console.log(merchProducts)
```

---

## ✅ Переваги нової системи

**Швидкість:**  
- Додати 10 товарів: ~2 секунди  
- Розподілити всі 42: ~5 хвилин  

**Зручність:**  
- Visual feedback (checkboxes, counters)  
- Batch operations (не по одному)  
- Auto-reload після змін  

**Надійність:**  
- Firestore batch writes  
- Error handling  
- Console logging  

---

## 📚 Додаткова документація

- [MERCHANDISING_CATEGORY_FIX.md](./MERCHANDISING_CATEGORY_FIX.md) — Повний опис
- [MERCHANDISING_README.md](./MERCHANDISING_README.md) — Головний Hub
- [MERCHANDISING_QUICKSTART.md](./MERCHANDISING_QUICKSTART.md) — Базовий гайд

---

**Версія:** 2.1  
**Дата:** 2026-01-24  
**Статус:** ✅ Production Ready

Готово до використання! 🚀
