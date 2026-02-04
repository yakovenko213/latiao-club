# 🎯 CRM Module Integration - Quick Reference

## ✅ Реалізовано

### 1. **Нова структура навігації** ([index.html](admin-site/index.html))
   - ✅ Додано 3-ю вкладку "CRM" у меню "Незавершені замовлення"
   - ✅ Створено контейнер `<div id="crm-module-container"></div>`
   - ✅ Додано view `<div id="view-crm" class="view p-8">`

### 2. **Модульна архітектура** ([crm-module.js](admin-site/js/crm-module.js))
   - ✅ Створено автономний файл `admin-site/js/crm-module.js`
   - ✅ ES6 модуль з експортом функцій
   - ✅ Використовує `window.firebaseInit` для доступу до Firestore

### 3. **Динамічне завантаження** ([index.html](admin-site/index.html))
   - ✅ Модуль завантажується тільки при кліку на вкладку "CRM"
   - ✅ Імпортується через `import('./js/crm-module.js')`
   - ✅ Інтегровано з існуючою логікою перемикання вкладок

### 4. **CRM функціонал** ([crm-module.js](admin-site/js/crm-module.js))
   - ✅ Kanban дошка з динамічними колонками (з колекції `crm_columns`)
   - ✅ Рендеринг карток для `abandoned_carts` з `crm_status`
   - ✅ Drag & drop між колонками (SortableJS)
   - ✅ Кнопки "Створити замовлення" та "SMS" на картках
   - ✅ Статистика (всього карток, сума, середній чек, етапів)
   - ✅ Оновлення статусу кошиків у Firestore

---

## 📁 Структура файлів

```
admin-site/
├── index.html                    ← ОНОВЛЕНО
│   ├── Sidebar: додано вкладку "CRM"
│   ├── View: додано <div id="view-crm">
│   └── Navigation: додано обробник для #crm
│
└── js/
    ├── crm-module.js             ← НОВИЙ ФАЙЛ
    │   ├── initCRM()             - Ініціалізація модуля
    │   ├── renderCrmBoard()      - Рендеринг Kanban дошки
    │   ├── loadCRMData()         - Завантаження колонок і карток
    │   ├── renderColumns()       - Рендеринг колонок воронки
    │   ├── renderCard()          - Рендеринг CRM картки
    │   ├── initializeDragDrop()  - Drag & drop функціонал
    │   ├── updateCartStatus()    - Оновлення статусу в Firestore
    │   ├── createOrderFromCart() - Створення замовлення
    │   └── sendSMS()             - Відправка SMS
    │
    └── firebase-init.js          ← БЕЗ ЗМІН
        └── window.firebaseInit   - Глобальний доступ до Firestore
```

---

## 🔄 Логіка перемикання вкладок

### Коли користувач клікає на вкладку CRM:

1. **Перехоплення кліку** ([index.html](admin-site/index.html#L4808))
   ```javascript
   else if (target === 'crm') {
     // Перевірка чи модуль вже завантажений
     if (typeof window.crmModule === 'undefined') {
       // Динамічний імпорт модуля
       import('./js/crm-module.js').then(module => {
         window.crmModule = module
         module.initCRM()
       })
     } else {
       // Модуль вже завантажений - просто ініціалізуємо
       window.crmModule.initCRM()
     }
   }
   ```

2. **Ініціалізація CRM** ([crm-module.js](admin-site/js/crm-module.js#L25))
   ```javascript
   export async function initCRM() {
     // Чекаємо Firebase
     if (!window.firebaseInit?.db) {
       await waitForFirebase()
     }
     db = window.firebaseInit.db
     
     // Рендеримо дошку
     await renderCrmBoard()
   }
   ```

3. **Завантаження даних** ([crm-module.js](admin-site/js/crm-module.js#L116))
   ```javascript
   async function loadCRMData() {
     // Завантажуємо колонки з 'crm_columns'
     const columnsSnapshot = await getDocs(
       query(collection(db, 'crm_columns'), orderBy('order', 'asc'))
     )
     
     // Завантажуємо кошики з crm_status
     const cartsSnapshot = await getDocs(
       query(
         collection(db, 'abandoned_carts'),
         where('crm_status', '!=', null)
       )
     )
   }
   ```

4. **Рендеринг UI** ([crm-module.js](admin-site/js/crm-module.js#L76))
   ```javascript
   function renderBoardUI(container) {
     container.innerHTML = 
       headerHTML +     // Заголовок + кнопки
       statsHTML +      // Статистика (4 картки)
       boardHTML        // Kanban дошка з колонками
   }
   ```

---

## 🎨 Компоненти CRM дошки

### 1. **Header** (Заголовок)
- 💜 Іконка Kanban
- 📊 Назва: "CRM - Воронка продажів"
- 🔄 Кнопка "Оновити"
- ⚙️ Кнопка "Налаштування колонок"

### 2. **Statistics** (Статистика)
- 📊 **Всього карток** - кількість кошиків у CRM
- 💰 **Загальна сума** - сума всіх кошиків
- 📈 **Середній чек** - середня вартість кошика
- 📋 **Етапів воронки** - кількість колонок

### 3. **Kanban Board** (Дошка)
- **Колонки** - динамічні з `crm_columns`
  - Назва колонки
  - Опис (якщо є)
  - Кількість карток
  - Сума карток у колонці
  
- **Картки** (Abandoned Carts)
  - 👤 Ім'я клієнта
  - 📞 Телефон
  - 🛒 Кількість товарів
  - 🕐 Дата оновлення
  - 💰 Сума замовлення
  - ✅ Кнопка "Створити замовлення"
  - 💬 Кнопка "SMS"

---

## 🔧 Ключові функції

### **initCRM()**
```javascript
// Головна функція ініціалізації
export async function initCRM()
```
- Перевіряє Firebase
- Завантажує дані
- Рендерить UI

### **renderCrmBoard()**
```javascript
// Перерендерити дошку
export async function renderCrmBoard()
```
- Показує loading state
- Завантажує нові дані
- Оновлює UI
- Ініціалізує drag & drop

### **updateCartStatus(cartId, columnId)**
```javascript
// Оновити статус картки
async function updateCartStatus(cartId, columnId)
```
- Оновлює `crm_status` у Firestore
- Оновлює локальний кеш
- Показує toast notification

### **createOrderFromCart(cartId)**
```javascript
// Створити замовлення з кошика
export async function createOrderFromCart(cartId)
```
- Викликає `window.convertCartToOrder()` якщо є
- Інакше показує повідомлення

### **sendSMS(cartId)**
```javascript
// Відправити SMS клієнту
export function sendSMS(cartId)
```
- Викликає `window.openSmsModal()` якщо є
- Інакше показує повідомлення

---

## 📊 Firestore структура

### Collection: `crm_columns`
```javascript
{
  name: "Новий лід",           // Назва колонки
  description: "...",           // Опис (опціонально)
  color: "#3b82f6",            // Колір колонки
  order: 0                      // Порядок відображення
}
```

### Collection: `abandoned_carts`
```javascript
{
  customer: {
    phone: "+380...",
    fullName: "Іван Петренко",
    email: "email@example.com"
  },
  items: [...],                // Товари в кошику
  total: 1500,                 // Загальна сума
  crm_status: "column_id",     // ID колонки CRM
  updated_at: Timestamp        // Час оновлення
}
```

---

## 🎯 Використання

### Для адміністратора:
1. Відкрийте адмін-панель
2. Клікніть "Незавершені замовлення" → "CRM"
3. Побачите Kanban дошку з покинутими кошиками
4. Перетягуйте картки між етапами воронки
5. Використовуйте кнопки для створення замовлень або відправки SMS

### Для розробника:
```javascript
// Імпорт модуля
import { initCRM, renderCrmBoard, refreshBoard } from './crm-module.js'

// Ініціалізація
await initCRM()

// Оновлення дошки
await refreshBoard()

// Очищення (при виході з вкладки)
cleanup()
```

---

## 🔄 Drag & Drop

Використовується **SortableJS**:
- Картки можна перетягувати між колонками
- При перетягуванні автоматично оновлюється `crm_status` у Firestore
- Анімація переходу
- Ghost ефект під час драгу

```javascript
new Sortable(column, {
  group: 'crm-cards',        // Група для drag & drop між колонками
  animation: 150,            // Швидкість анімації
  onEnd: (evt) => {
    // Оновити статус у Firestore
    updateCartStatus(cartId, newColumnId)
  }
})
```

---

## 🎨 Дизайн

- **Колірна схема**: Фіолетово-синій градієнт (CRM тематика)
- **Іконки**: Lucide Icons
- **Стилі**: Tailwind CSS
- **Анімації**: CSS transitions + SortableJS
- **Адаптивність**: Grid layout для статистики

---

## 🚀 Майбутні покращення

- [ ] Модальне вікно налаштувань колонок (create/edit/delete/reorder)
- [ ] Фільтри карток (по даті, сумі, статусу)
- [ ] Пошук по картках
- [ ] Масові операції (bulk actions)
- [ ] Внутрішні нотатки на картках
- [ ] Real-time оновлення (onSnapshot)
- [ ] Експорт CRM даних
- [ ] Аналітика воронки (conversion rates)

---

## 📝 Примітки

1. **Модульність**: CRM модуль повністю ізольований від основного коду
2. **Lazy Loading**: Модуль завантажується тільки при потребі
3. **Глобальний доступ**: `window.crmModule` для inline event handlers
4. **Firebase**: Використовує `window.firebaseInit` - не створює нову ініціалізацію
5. **Сумісність**: Інтегрується з існуючими функціями (`convertCartToOrder`, `openSmsModal`)

---

## 🐛 Відлагодження

### Перевірити чи завантажився модуль:
```javascript
console.log(window.crmModule)
```

### Перевірити Firebase:
```javascript
console.log(window.firebaseInit)
```

### Перевірити колонки:
```javascript
const { collection, getDocs } = window.firebaseInit
const snapshot = await getDocs(collection(window.firebaseInit.db, 'crm_columns'))
console.log(snapshot.docs.map(d => d.data()))
```

### Перевірити кошики з CRM статусом:
```javascript
const { collection, query, where, getDocs } = window.firebaseInit
const q = query(collection(window.firebaseInit.db, 'abandoned_carts'), where('crm_status', '!=', null))
const snapshot = await getDocs(q)
console.log(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
```

---

**Готово! ✅ CRM модуль повністю інтегровано як під-розділ "Незавершених замовлень".**
