# 📦 Merchandising — Stock-Based Priority Sorting

## 🎯 Автоматична пріоритизація по наявності

**Правило:** Товари з наявністю (`stock > 0`) завжди показуються першими. Товари без наявності (`stock = 0`) автоматично переміщуються в кінець категорії.

---

## ✨ Як це працює

### 1️⃣ **При завантаженні категорії**

Система автоматично сортує товари в такому порядку:

```javascript
// PRIMARY SORT: Stock availability
if (product.stock > 0) → show first ✅
if (product.stock = 0) → move to end ❌

// SECONDARY SORT: Manual sortOrder
Within each group (in-stock / out-of-stock):
  → Sort by sortOrder field

// TERTIARY SORT: Creation date
If no sortOrder:
  → Sort by createdAt (newest first)
```

**Приклад:**
```
CATEGORY VIEW:
┌──────────────────────────────┐
│ ✅ Product A (stock: 15)     │ sortOrder: 0
│ ✅ Product B (stock: 8)      │ sortOrder: 1
│ ✅ Product C (stock: 23)     │ sortOrder: 2
├──────────────────────────────┤ ← Visual Separator
│ ❌ Product D (stock: 0) OOS  │ sortOrder: 900
│ ❌ Product E (stock: 0) OOS  │ sortOrder: 901
└──────────────────────────────┘
```

---

### 2️⃣ **Візуальне відділення**

**Out-of-Stock товари мають:**
- 🎨 **Grayscale filter** — сірий колір
- 🔻 **Reduced opacity** (50%)
- 🏷️ **OOS Badge** — чітка мітка "OOS"
- 📏 **Visual Separator** — лінія "Немає в наявності" перед першим OOS товаром

**Код візуального роздільника:**
```html
<div class="col-span-full my-4">
  <div class="flex items-center gap-4">
    <div class="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300"></div>
    <span class="text-sm font-semibold text-gray-500">НЕМАЄ В НАЯВНОСТІ</span>
    <div class="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300"></div>
  </div>
</div>
```

---

### 3️⃣ **При збереженні порядку**

Коли ви натискаєте **"Зберегти порядок"**, система автоматично перераховує `sortOrder`:

#### Логіка перерахунку:

```javascript
// Step 1: Separate products
const inStock = products.filter(p => p.stock > 0)
const outOfStock = products.filter(p => p.stock === 0)

// Step 2: Assign sortOrder
inStock.forEach((product, index) => {
  product.sortOrder = index  // 0, 1, 2, 3...
})

outOfStock.forEach((product, index) => {
  product.sortOrder = 900 + index  // 900, 901, 902...
})
```

#### Результат у Firestore:

**In-Stock товари:**
```javascript
{
  id: "prod1",
  name: "Latiao Original",
  stock: 15,
  sortOrder: 0,  // ✅ Low numbers
  sortUpdatedAt: "2026-01-24T..."
}
```

**Out-of-Stock товари:**
```javascript
{
  id: "prod2",
  name: "Latiao Spicy",
  stock: 0,
  sortOrder: 900,  // ❌ High numbers (auto-pushed to end)
  sortUpdatedAt: "2026-01-24T..."
}
```

---

## 🔒 Автоматична корекція

**Що буде, якщо ви вручну перетягнете OOS товар на початок?**

### Сценарій:
```
1. Drag OOS product to position #1 ⬆️
2. Click "Save Order" 💾
3. System recalculates:
   ✅ In-stock products → sortOrder: 0-N
   ❌ OOS products → sortOrder: 900+
4. Reload category 🔄
5. OOS product is back at the end ✅
```

**Результат:** Система завжди виправляє порядок згідно з правилом "Stock First".

---

## 🎬 Workflow приклад

### Крок 1: Відкрити категорію
```
Admin → Merchandising → Select "Помірно-гострі латяо"
```

### Крок 2: Побачити автосортування
```
UI показує:
  [1] Latiao A — 12 шт  ✅
  [2] Latiao B — 8 шт   ✅
  [3] Latiao C — 5 шт   ✅
  ────── Немає в наявності ──────
  [4] Latiao D — Немає  ❌
  [5] Latiao E — Немає  ❌
```

### Крок 3: Змінити порядок in-stock товарів
```
Drag & Drop:
  Latiao C → position #1
  Latiao A → position #2
  Latiao B → position #3
```

### Крок 4: Зберегти
```
Click "Зберегти порядок"

Console log:
💾 [SAVE] In-stock: 3, Out-of-stock: 2
  ✅ [0] Latiao C → sortOrder: 0 (stock: 5)
  ✅ [1] Latiao A → sortOrder: 1 (stock: 12)
  ✅ [2] Latiao B → sortOrder: 2 (stock: 8)
  ❌ [900] Latiao D → sortOrder: 900 (OOS)
  ❌ [901] Latiao E → sortOrder: 901 (OOS)
```

### Крок 5: Перезавантажити
```
Reload category → Order preserved ✅
OOS товари залишаються внизу ✅
```

---

## 📊 Console Logging

### При завантаженні:
```
📦 [FINAL] Total products loaded: 12
📦 [SORT] Applied: (1) Stock availability → (2) sortOrder → (3) createdAt
```

### При збереженні:
```
💾 [SAVE] Starting batch update for 12 products...
💾 [SAVE] Current category slug: pom-rno-gostre-latyao
📊 [SAVE] In-stock: 8, Out-of-stock: 4

  ✅ [0] Latiao Original → sortOrder: 0 (stock: 15)
  ✅ [1] Latiao Spicy → sortOrder: 1 (stock: 8)
  ...
  ❌ [900] Latiao OOS 1 → sortOrder: 900 (OOS)
  ❌ [901] Latiao OOS 2 → sortOrder: 901 (OOS)

✅ [SAVE] Batch commit successful!
```

---

## 🔧 Технічні деталі

### Змінені функції

#### 1. `loadMerchProducts()` — сортування при завантаженні

```javascript
merchProducts.sort((a, b) => {
  // PRIMARY: Stock availability
  const aStock = a.stock ?? 0
  const bStock = b.stock ?? 0
  const aInStock = aStock > 0
  const bInStock = bStock > 0
  
  if (aInStock !== bInStock) {
    return bInStock - aInStock // In-stock first
  }
  
  // SECONDARY: sortOrder
  if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
    return a.sortOrder - b.sortOrder
  }
  
  // TERTIARY: createdAt
  return bTime - aTime
})
```

#### 2. `renderMerchGrid()` — візуальний роздільник

```javascript
// Check if previous product was in-stock and current is OOS
const prevProduct = merchProducts[index - 1]
const showSeparator = isOOS && prevProduct && (prevProduct.stock ?? 0) > 0

if (showSeparator) {
  // Insert visual divider
}
```

#### 3. `saveMerchLayout()` — перерахунок sortOrder

```javascript
// Separate by stock
const inStockProducts = merchProducts.filter(p => (p.stock ?? 0) > 0)
const outOfStockProducts = merchProducts.filter(p => (p.stock ?? 0) === 0)

// In-stock: 0-N
inStockProducts.forEach((product, index) => {
  batch.update(productRef, { sortOrder: index })
})

// Out-of-stock: 900+
outOfStockProducts.forEach((product, index) => {
  batch.update(productRef, { sortOrder: 900 + index })
})
```

---

## ✅ Переваги

| Характеристика | До оновлення | Після оновлення |
|----------------|--------------|-----------------|
| **Stock Priority** | ❌ Manual only | ✅ Automatic |
| **Visual Separation** | ❌ No | ✅ Yes (separator + styling) |
| **Auto-correction** | ❌ No | ✅ Yes (on save) |
| **sortOrder range** | 0-999 | 0-N (in-stock), 900+ (OOS) |
| **User Flexibility** | ✅ Full | ✅ Full (within stock groups) |

---

## 🎯 Use Cases

### Use Case 1: Товар закінчився
```
BEFORE:
  [1] Product A — 5 шт
  [2] Product B — 0 шт  ← Закінчився
  [3] Product C — 10 шт

ACTION:
  Admin оновлює stock:
    Product B: 5 → 0

AFTER (next reload):
  [1] Product A — 5 шт
  [2] Product C — 10 шт
  ────── Немає в наявності ──────
  [3] Product B — 0 шт  ← Автоматично внизу
```

### Use Case 2: Товар з'явився на складі
```
BEFORE:
  [1] Product A — 10 шт
  ────── Немає в наявності ──────
  [2] Product B — 0 шт

ACTION:
  Admin оновлює stock:
    Product B: 0 → 15

AFTER (next reload):
  [1] Product A — 10 шт
  [2] Product B — 15 шт  ← Автоматично вгорі ✅
  (No OOS section)
```

### Use Case 3: Drag & Drop не впливає на правило
```
USER ACTION:
  Drag OOS product to top ⬆️
  
SYSTEM BEHAVIOR:
  Visual feedback: "You can drag, but..."
  
ON SAVE:
  System recalculates: OOS → sortOrder: 900+
  
ON RELOAD:
  OOS product back at bottom ✅
```

---

## 🐛 Troubleshooting

### Проблема: OOS товари все ще зверху

**Причина:** Старі значення `sortOrder` у Firestore (0-10) для OOS товарів

**Рішення:**
1. Відкрийте категорію
2. Клік "Зберегти порядок" (навіть без змін)
3. Система перерахує sortOrder → OOS отримають 900+

### Проблема: Візуальний роздільник не показується

**Причина:** Всі товари in-stock або всі OOS

**Перевірка:**
```javascript
// Console
merchProducts.filter(p => p.stock > 0).length  // In-stock count
merchProducts.filter(p => p.stock === 0).length  // OOS count
```

**Рішення:** Роздільник показується тільки коли є ОБИДВІ групи

---

## 📚 Сумісність з іншими features

### ✅ Сумісне з:
- **Multi-Category Support** — правило працює в кожній категорії окремо
- **Drag & Drop** — можна сортувати within groups (in-stock / OOS)
- **Smart Strategies** — стратегії (💰📦🔥) працюють з урахуванням stock priority
- **Category Assignment** — додавання товарів до категорій не впливає на правило

### ⚠️ Обмеження:
- **Ручне сортування OOS товарів** — можливе, але при save система перерахує sortOrder
- **Cross-category порядок** — кожна категорія має свій sortOrder (це норма)

---

## 🚀 Готово!

**Тепер ваша система:**
- ✅ Автоматично пріоритизує товари з наявністю
- ✅ Візуально відділяє OOS товари
- ✅ Автоматично виправляє порядок при save
- ✅ Дозволяє ручне сортування в межах груп
- ✅ Працює консистентно в усіх категоріях

**Workflow:**
```
Load Category → Auto-sort (stock first) → 
Manual drag within groups → 
Save → Recalculate sortOrder → 
Reload → Stock rule enforced ✅
```

---

**Створено:** 2026-01-24  
**Версія:** 3.0  
**Статус:** Production Ready ✅
