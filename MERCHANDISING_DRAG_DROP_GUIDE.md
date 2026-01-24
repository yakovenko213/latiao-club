# 🎯 Merchandising Drag & Drop — Інструкція

## 📋 Огляд

Секція **Merchandising** в Admin Panel тепер підтримує повноцінне сортування товарів методом **Drag & Drop** з збереженням порядку в Firestore.

---

## ✨ Функціонал

### 1️⃣ **Автоматичне сортування**
Товари завантажуються з урахуванням пріоритету:
- **Спочатку**: по полю `sortOrder` (якщо встановлено)
- **Якщо немає**: по `createdAt` (новіші першими)

```javascript
// Логіка сортування
merchProducts.sort((a, b) => {
  if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
    return a.sortOrder - b.sortOrder
  }
  if (a.sortOrder !== undefined) return -1
  if (b.sortOrder !== undefined) return 1
  
  const aTime = a.createdAt?.toMillis?.() || 0
  const bTime = b.createdAt?.toMillis?.() || 0
  return bTime - aTime
})
```

---

### 2️⃣ **Drag & Drop Interface**

#### Візуальні елементи:
- **Drag Handle**: При наведенні на картку з'являється іконка `≡ Drag` з pulse-анімацією
- **Position Badge**: Номер позиції (1, 2, 3...) у правому верхньому куті
- **Hover Effects**: 
  - Scale transform (збільшення)
  - Shadow підсвітка
  - Ring обводка при перетягуванні

#### Стилі анімації:
```css
.merch-card.sortable-chosen {
  transform: scale(1.05);
  box-shadow: 0 25px 50px rgba(255, 107, 0, 0.4);
  border-color: #ff6b00 !important;
  z-index: 1000;
}
```

---

### 3️⃣ **Автоматичні стратегії**

Швидке сортування одним кліком:

| Кнопка | Стратегія | Опис |
|--------|-----------|------|
| 💰 **Margin Booster** | `priceHighLow` | Дорогі товари першими |
| 🔥 **Hot Deals** | `onSaleFirst` | Знижки першими |
| 📦 **Inventory Flush** | `stockHighLow` | Багато на складі першими |
| 🛑 **Scarcity Effect** | `stockLowHigh` | Мало на складі (дефіцит) |
| ✨ **New Drops** | `newestFirst` | Новинки першими |
| 📉 **Bury OOS** | `buryOOS` | Out-of-Stock вниз |

**Важливо**: Всі стратегії автоматично ховають товари з `stock = 0` в кінець списку.

---

### 4️⃣ **Збереження порядку**

#### Кнопка "Зберегти порядок":
- **Неактивна** (disabled) за замовчуванням
- **Активується** після будь-якої зміни порядку
- **Batch Update**: використовує `writeBatch()` для ефективного оновлення

```javascript
const batch = writeBatch(db)
merchProducts.forEach((product, index) => {
  const productRef = doc(db, 'products', product.id)
  batch.update(productRef, { 
    sortOrder: index,
    sortUpdatedAt: new Date()
  })
})
await batch.commit()
```

#### Що зберігається:
- `sortOrder`: числове значення позиції (0, 1, 2, 3...)
- `sortUpdatedAt`: timestamp останнього оновлення

---

## 🎬 Як користуватися

### Крок 1: Вибір категорії
```
Admin Panel → Merchandising → Оберіть категорію (dropdown)
```

### Крок 2: Перегляд товарів
- Товари відображаються в grid (2-5 колонок залежно від екрану)
- Кожна картка показує:
  - Зображення товару
  - Назву
  - Ціну
  - Залишок на складі
  - Номер позиції (badge)

### Крок 3: Зміна порядку
**Варіант A — Ручне перетягування:**
1. Наведіть курсор на картку
2. З'явиться іконка `≡ Drag`
3. Затисніть ЛКМ і перетягніть у потрібну позицію
4. Відпустіть кнопку

**Варіант B — Автоматична стратегія:**
1. Натисніть одну з кнопок стратегій (💰, 🔥, 📦 тощо)
2. Товари автоматично пересортуються

### Крок 4: Збереження
1. Кнопка **"Зберегти порядок"** активується (зелена)
2. Натисніть кнопку
3. Дочекайтесь підтвердження: ✅ *Порядок збережено для X товарів!*
4. Кнопка знову стане неактивною

---

## 🔧 Технічні деталі

### SortableJS конфігурація
```javascript
new Sortable(gridElement, {
  animation: 250,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  ghostClass: 'opacity-30 scale-95',
  chosenClass: 'ring-4 ring-spicy/50 scale-105 shadow-2xl',
  dragClass: 'opacity-90 rotate-3 shadow-2xl',
  onEnd: function(evt) {
    // Update merchProducts array
    // Enable save button
    // Update position badges
  }
})
```

### Firestore структура
```json
{
  "products": {
    "productId": {
      "name": "Latiao Original",
      "category": "pom-rno-gostre-latyao",
      "price": 150,
      "stock": 20,
      "sortOrder": 0,          // ← Нове поле
      "sortUpdatedAt": "2026-01-24T...",  // ← Нове поле
      "createdAt": { "_seconds": 1234567890 }
    }
  }
}
```

---

## 🚨 Важливі примітки

### Порожні категорії
Якщо категорія не містить товарів:
- Показується спеціальне повідомлення
- Кнопки **Debug Database** та **Всі товари** для діагностики
- Fallback до категорії `us-tovari` (якщо налаштовано)

### Batch Transfer Tool
Якщо активований режим перерозподілу:
- Checkbox для вибору товарів
- Dropdown для вибору цільової категорії
- Кнопка **"Перенести вибрані"**

### Продуктивність
- **Batch update** забезпечує одну транзакцію для всіх товарів
- Максимум 500 операцій на batch (обмеження Firestore)
- Якщо товарів >500, потрібна додаткова логіка розбиття на chunks

---

## 🎨 UI Компоненти

### Кольори та стилі
```css
Primary (Spicy): #ff6b00
Ghost (Drag): opacity-30, scale-95
Chosen (Active): ring-4 ring-spicy/50, scale-105
Success: green-500/600
Warning: yellow-400/600
Error: red-500/600
```

### Іконки (Lucide)
- `grip-vertical`: Drag handle
- `package-x`: Порожня категорія
- `save`: Збереження
- `check`: Успіх
- `info`: Інформація

---

## 📊 Приклад консольного логу

```
📦 [FINAL] Total products loaded: 12
📦 [SORT] Applied sortOrder → createdAt fallback
💾 [SAVE] Starting batch update for 12 products...
  [0] Latiao Original → sortOrder: 0
  [1] Latiao Spicy → sortOrder: 1
  [2] Latiao Sweet → sortOrder: 2
  ...
✅ [SAVE] Batch commit successful!
```

---

## 🛠️ Налаштування

### Зміна анімації
Відредагуйте `<style>` секцію в `admin.html`:

```css
.merch-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Зміна кількості колонок
Відредагуйте grid класи в `renderMerchGrid()`:

```html
<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
```

---

## 🐛 Діагностика

### Товари не завантажуються
1. Перевірте консоль браузера (F12)
2. Натисніть **Debug Database**
3. Перевірте поле `category` у товарів
4. Використайте функцію `inspectCategoryValues()`

### Порядок не зберігається
1. Перевірте консоль: `💾 [SAVE] ...`
2. Переконайтеся що batch.commit() виконався без помилок
3. Перезавантажте сторінку та перевірте порядок

### Drag не працює
1. Переконайтеся що SortableJS завантажився (CDN доступний)
2. Перевірте `merchSortableInstance` в console
3. Перевірте класи `.merch-card` на картках

---

## ✅ Переваги нового функціоналу

- ✨ **Інтуїтивний UI**: Візуальне перетягування замість ручного введення номерів
- ⚡ **Швидкі стратегії**: Автоматичне сортування одним кліком
- 💾 **Batch операції**: Ефективне збереження для десятків товарів одночасно
- 📱 **Responsive**: Працює на всіх пристроях (desktop, tablet, mobile)
- 🔄 **Real-time feedback**: Миттєве оновлення position badges
- 🎨 **Красива анімація**: Плавні переходи та hover ефекти

---

**Створено:** 2026-01-24  
**Версія:** 1.0  
**Автор:** AI Development Team
