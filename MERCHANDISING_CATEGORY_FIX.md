# 🔧 Merchandising Fix — Category Assignment System

## 🎯 Проблема (До виправлення)

- ❌ Товари завантажуються тільки для категорії "us-tovari"
- ❌ Інші категорії залишаються порожніми
- ❌ Немає способу перенести товари з пулу в конкретну категорію
- ❌ Збереження не оновлює поле `category` в Firestore

---

## ✅ Рішення (Після виправлення)

### 1. **Спеціальна категорія "Unassigned"**

Додано нову опцію в dropdown:

```
┌─────────────────────────────┐
│ Оберіть категорію...        │
├─────────────────────────────┤
│ 🔄 Нерозподілені (Unassigned)│  ← НОВА ОПЦІЯ
│ Помірно гостре латяо        │
│ Солодке латяо               │
│ Дуже гостре латяо           │
│ Усі товари                  │
└─────────────────────────────┘
```

**Що показує:**
- Товари з `category: "us-tovari"`
- Товари з `category: undefined`
- Товари з `category: null`
- Товари з `category: ""`

**Використання:**
```javascript
// Вибираємо "Unassigned" → loadUnassignedProducts()
// Показує всі нерозподілені товари з жовтим банером
```

---

### 2. **Покращений Empty State з кнопкою "Add Products"**

Якщо категорія порожня:

```
┌──────────────────────────────────────────┐
│        📦 Немає товарів у цій категорії  │
│                                           │
│   📋 Категорія: Помірно гостре латяо     │
│   Slug: pom-rno-gostre-latyao            │
│                                           │
│  ┌──────────────────────────────────┐    │
│  │ ➕ Додати товари з пулу          │  ← НОВА КНОПКА
│  └──────────────────────────────────┘    │
│                                           │
│  [🔍 Debug Database]                      │
└──────────────────────────────────────────┘
```

**Клік на кнопку → відкривається modal з нерозподіленими товарами**

---

### 3. **Modal для додавання товарів**

#### Структура modal:

```
┌───────────────────────────────────────────────────┐
│  Додати товари до категорії              [✕]     │
│  Категорія: Помірно гостре латяо                  │
├───────────────────────────────────────────────────┤
│                                                    │
│  [✓] Вибрати всі (42)                             │
│                                                    │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐          │
│  │ [✓]  │  │ [ ]  │  │ [✓]  │  │ [ ]  │          │
│  │[фото]│  │[фото]│  │[фото]│  │[фото]│          │
│  │Latiao│  │Snack │  │Chips │  │Nuts  │          │
│  │150₴  │  │120₴  │  │180₴  │  │90₴   │          │
│  └──────┘  └──────┘  └──────┘  └──────┘          │
│                                                    │
│  [Grid продовжується...]                          │
│                                                    │
├───────────────────────────────────────────────────┤
│  Вибрано: 15 товарів                              │
│                      [Скасувати] [➕ Додати]      │
└───────────────────────────────────────────────────┘
```

#### Функціонал modal:

✅ **Автозавантаження** нерозподілених товарів  
✅ **Checkbox на кожній картці** для вибору  
✅ **Select All** для вибору всіх одразу  
✅ **Real-time counter** вибраних товарів  
✅ **Batch update** в Firestore при додаванні  
✅ **Автоматичне оновлення** списку після додавання  

---

### 4. **Оновлення category field при збереженні**

#### До:
```javascript
// Тільки sortOrder
batch.update(productRef, { 
  sortOrder: index,
  sortUpdatedAt: timestamp
})
```

#### Після:
```javascript
// sortOrder + category (якщо потрібно)
const updateData = { 
  sortOrder: index,
  sortUpdatedAt: timestamp
}

if (currentCategorySlug && currentCategorySlug !== '__unassigned__') {
  updateData.category = currentCategorySlug // ← ДОДАНО!
}

batch.update(productRef, updateData)
```

**Результат:** Товари отримують правильну категорію при збереженні порядку

---

## 🔄 Workflow: Як розподілити товари

### Сценарій 1: Порожня категорія

```
1. Відкрити Admin → Merchandising
2. Вибрати категорію "Помірно гостре латяо"
3. Побачити повідомлення "Немає товарів"
4. Клік на "➕ Додати товари з пулу"
5. В modal: вибрати потрібні товари (checkboxes)
6. Клік "Додати до категорії"
7. ✅ Товари з'являються в категорії з category field оновленим
```

### Сценарій 2: Масове перенесення

```
1. Вибрати "🔄 Нерозподілені"
2. Побачити всі 42 товари з us-tovari
3. Обрати кілька товарів (checkboxes)
4. Вибрати цільову категорію в dropdown перенесення
5. Клік "Перенести вибрані"
6. ✅ Товари переміщені з оновленням category field
```

### Сценарій 3: Сортування в категорії

```
1. Вибрати категорію з товарами
2. Drag & drop для зміни порядку
3. Клік "Зберегти порядок"
4. ✅ Збережено: sortOrder + category (закріплено)
```

---

## 📊 Нові функції JavaScript

### 1. `loadUnassignedProducts()`
```javascript
// Завантажує товари без категорії або з us-tovari
// Показує жовтий банер "Нерозподілені товари"
// Фільтрує: !cat || cat === '' || cat === 'us-tovari'
```

### 2. `openAddProductsModal(targetCategorySlug)`
```javascript
// Відкриває modal з grid нерозподілених товарів
// Дозволяє вибрати products через checkboxes
// Responsive grid: 2-5 колонок залежно від екрану
```

### 3. `addSelectedProductsToCategory(targetSlug)`
```javascript
// Виконує batch update:
//   - category: targetSlug
//   - sortOrder: index
//   - updatedAt: new Date()
// Закриває modal та перезавантажує категорію
```

### 4. `toggleModalProductSelect(productId)`
```javascript
// Toggle checkbox при кліку на картку
// Оновлює counter вибраних товарів
```

### 5. `toggleModalSelectAll(checked)`
```javascript
// Вибрати/зняти всі checkboxes в modal
```

---

## 🎨 UI/UX покращення

### Empty State (Before)
```
❌ Просте повідомлення "Немає товарів"
❌ Тільки кнопки Debug/Всі товари
❌ Немає способу додати товари
```

### Empty State (After)
```
✅ Інформативне повідомлення з категорією та slug
✅ Велика помаранчева кнопка "Додати товари з пулу"
✅ Додаткові кнопки для debug
✅ Gradient дизайн кнопки (spicy → orange-600)
```

### Modal Design
```
✅ Backdrop blur для фокусу
✅ Gradient header (spicy/10 → orange-100)
✅ Responsive grid (2-5 колонок)
✅ Hover effects на картках
✅ Counter в footer з real-time оновленням
✅ Disabled state для кнопки "Додати" якщо нічого не вибрано
```

---

## 🔧 Технічні деталі

### Firestore оновлення

**Структура batch update:**
```javascript
const batch = writeBatch(db)

selectedProducts.forEach((productId, index) => {
  const productRef = doc(db, 'products', productId)
  batch.update(productRef, {
    category: 'pom-rno-gostre-latyao',  // ← Target category
    sortOrder: index,                   // ← Initial position
    updatedAt: new Date()               // ← Timestamp
  })
})

await batch.commit()
```

### Query для Unassigned
```javascript
// Fetch ALL products
const snapshot = await getDocs(collection(db, 'products'))
const allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

// Client-side filter
const unassigned = allProducts.filter(p => {
  const cat = p.category
  return !cat || cat === '' || cat === 'us-tovari'
})
```

**Чому client-side?**
- Firestore не підтримує `where('field', 'in', [null, undefined, ''])`
- Потрібна гнучка логіка для multiple conditions
- Продуктивність OK для <1000 товарів

---

## 📈 Переваги нового підходу

### До виправлення:
```
Category A: 0 товарів    → "Empty, no way to add"
Category B: 0 товарів    → "Empty, no way to add"
us-tovari:  42 товари    → "All stuck here"
```

### Після виправлення:
```
Category A: 5 товарів    → "Added via modal ✅"
Category B: 8 товарів    → "Added via modal ✅"
Category C: 12 товарів   → "Added via modal ✅"
Unassigned: 17 товарів   → "Awaiting assignment"
```

---

## 🎯 Приклад використання

### Крок 1: Перегляд нерозподілених
```javascript
// Select dropdown: "🔄 Нерозподілені"
// → loadUnassignedProducts()
// → Показує 42 товари з жовтим банером
```

### Крок 2: Додавання до категорії A
```javascript
// Select dropdown: "Помірно гостре латяо"
// → loadMerchProducts() → 0 товарів
// → Клік "➕ Додати товари з пулу"
// → Modal відкривається з 42 товарами
// → Вибрати 5 товарів
// → Клік "Додати до категорії"
// → batch.update({ category: 'pom-rno-gostre-latyao' })
// ✅ Category A: 5 товарів
```

### Крок 3: Сортування в категорії A
```javascript
// Drag & drop 5 товарів у потрібний порядок
// → Клік "Зберегти порядок"
// → batch.update({ sortOrder: 0-4, category: 'pom-rno-gostre-latyao' })
// ✅ Порядок збережено + category закріплена
```

### Крок 4: Повторити для інших категорій
```javascript
// Category B, C, D... → Repeat Крок 2-3
// ✅ Всі товари розподілені та відсортовані
```

---

## 🐛 Troubleshooting

### Q: Modal не відкривається
**A:**
```javascript
// Console
window.openAddProductsModal('category-slug')

// Перевірити:
1. Lucide icons завантажилися?
2. categoryMapping містить slug?
3. Firestore доступна?
```

### Q: Товари не додаються
**A:**
```javascript
// Console
console.log('Selected:', document.querySelectorAll('.modal-product-checkbox:checked'))

// Перевірити:
1. Checkbox обрані?
2. Firestore Rules дозволяють write?
3. Batch commit пройшов?
```

### Q: Категорія порожня після додавання
**A:**
```javascript
// Можливі причини:
1. Batch commit failed (перевірити console)
2. category field не оновився (перевірити Firestore)
3. Flexible matching не спрацював (додати debug)

// Рішення:
await window.loadMerchProducts() // Force reload
```

---

## ✅ Чеклист впровадження

- [x] Додано опцію "Unassigned" в dropdown
- [x] Створено `loadUnassignedProducts()`
- [x] Покращено empty state з кнопкою "Add Products"
- [x] Створено `openAddProductsModal()`
- [x] Додано modal з grid товарів та checkboxes
- [x] Створено `addSelectedProductsToCategory()`
- [x] Оновлено `saveMerchLayout()` для збереження category
- [x] Додано CSS анімації для modal
- [x] Перевірено на помилки (0 errors)
- [x] Протестовано workflow

---

## 🚀 Готово до використання!

Тепер Merchandising система повністю функціональна:

✅ **Кожна категорія** може бути заповнена товарами  
✅ **Нерозподілені товари** видимі та керовані  
✅ **Modal інтерфейс** для швидкого додавання  
✅ **Batch operations** для ефективності  
✅ **Category field** автоматично оновлюється  

**Наступний крок:** Розподілити всі товари по категоріям через новий інтерфейс!

---

**Створено:** 2026-01-24  
**Версія:** 2.1  
**Статус:** Production Ready ✅
