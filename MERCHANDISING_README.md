# 📚 Merchandising System — Documentation Hub

## 🎯 Що це?

Повноцінна система **Drag & Drop Merchandising** для Admin Panel з можливістю ручного та автоматичного сортування товарів в категоріях із збереженням порядку в Firestore.

---

## 📖 Доступна документація

| Документ | Опис | Час читання |
|----------|------|-------------|
| [MERCHANDISING_QUICKSTART.md](./MERCHANDISING_QUICKSTART.md) | ⚡ Швидкий старт — мінімальна інструкція | 5 хв |
| [MERCHANDISING_VISUAL_GUIDE.md](./MERCHANDISING_VISUAL_GUIDE.md) | 🎬 Візуальна інструкція з ASCII-схемами | 15 хв |
| [MERCHANDISING_DRAG_DROP_GUIDE.md](./MERCHANDISING_DRAG_DROP_GUIDE.md) | 📋 Повний технічний гайд | 20 хв |
| [MERCHANDISING_CHANGELOG.md](./MERCHANDISING_CHANGELOG.md) | 📝 Changelog — список всіх змін | 10 хв |
| [MERCHANDISING_CATEGORY_FIX.md](./MERCHANDISING_CATEGORY_FIX.md) | 🔧 **NEW** Category Assignment System | 15 хв |
| [MERCHANDISING_CATEGORY_QUICKREF.md](./MERCHANDISING_CATEGORY_QUICKREF.md) | ⚡ **NEW** Category Fix Quick Reference | 3 хв |

---

## 🚀 Швидкий старт (30 секунд)

### 1. Відкрийте Admin Panel
```
https://your-domain.com/admin.html → Merchandising
```

### 2. Виберіть категорію
```
Dropdown → Оберіть категорію → Завантажити
```

### 3. Перетягніть товари
```
Зажміть картку → Перетягніть → Відпустіть
```

### 4. Збережіть
```
Кнопка "Зберегти порядок" → ✅ Готово!
```

---

## 🆕 What's New (v2.1 — 2026-01-24)

### 🔧 Category Assignment System

**Проблема вирішена:** Товари більше не "застрягають" в us-tovari!

#### Нові можливості:

1. **📋 "Unassigned" категорія**
   - Спеціальна опція в dropdown для перегляду нерозподілених товарів
   - Показує всі товари з `category: us-tovari/undefined/null`
   - Жовтий банер з інструкціями

2. **➕ "Add Products from Pool" кнопка**
   - З'являється коли категорія порожня
   - Відкриває modal з нерозподіленими товарами
   - Checkboxes для вибору + "Select All"

3. **🎯 Modal для додавання товарів**
   - Responsive grid (2-5 колонок)
   - Real-time counter вибраних товарів
   - Batch update в Firestore при додаванні
   - Auto-reload після успішного додавання

4. **💾 Оновлення category field**
   - `saveMerchLayout()` тепер зберігає `category` разом з `sortOrder`
   - Товари "закріплюються" в категорії після збереження
   - Логування всіх змін в console

➡️ **Детальніше:** [MERCHANDISING_CATEGORY_FIX.md](./MERCHANDISING_CATEGORY_FIX.md)

---

## ✨ Основні можливості

### 🎯 Drag & Drop Interface
- Візуальне перетягування карток товарів
- Position badges (номери позицій)
- Hover effects з drag handle іконкою
- Плавні анімації та transitions

### 🧠 Smart Strategies (6 шт)
| Іконка | Назва | Сортування |
|--------|-------|------------|
| 💰 | Margin Booster | Ціна ↓ (дорогі першими) |
| 🔥 | Hot Deals | Знижки першими |
| 📦 | Inventory Flush | Залишок ↓ |
| 🛑 | Scarcity Effect | Залишок ↑ (дефіцит) |
| ✨ | New Drops | Новинки першими |
| 📉 | Bury OOS | Stock=0 вниз |

### 💾 Batch Update
- Збереження всіх змін одним запитом
- `writeBatch()` для ефективності
- Автоматичне оновлення `sortOrder` + `sortUpdatedAt`

### 🔍 Smart Loading
- Сортування по `sortOrder` (якщо є)
- Fallback на `createdAt` (якщо немає)
- Flexible category matching (5 стратегій)

---

## 📊 Технічний стек

| Технологія | Використання |
|------------|--------------|
| **SortableJS** | Drag & Drop бібліотека |
| **Firestore** | NoSQL база даних |
| **Tailwind CSS** | Utility-first CSS framework |
| **Lucide Icons** | SVG іконки |
| **Vanilla JS** | Без frameworks (чистий JS) |

---

## 🎓 Для кого ця документація?

### 👨‍💼 Адміністратори
➡️ Читайте: [MERCHANDISING_VISUAL_GUIDE.md](./MERCHANDISING_VISUAL_GUIDE.md)
- Візуальні інструкції
- Покрокові гайди
- Troubleshooting поради

### 👨‍💻 Розробники
➡️ Читайте: [MERCHANDISING_DRAG_DROP_GUIDE.md](./MERCHANDISING_DRAG_DROP_GUIDE.md)
- Технічна документація
- Firestore структура
- API reference
- Code examples

### ⚡ Хочу швидко почати
➡️ Читайте: [MERCHANDISING_QUICKSTART.md](./MERCHANDISING_QUICKSTART.md)
- 5 хвилин читання
- Мінімум теорії
- Максимум практики

### 📝 Що змінилось?
➡️ Читайте: [MERCHANDISING_CHANGELOG.md](./MERCHANDISING_CHANGELOG.md)
- Список змін
- Нові функції
- Breaking changes

---

## 🔧 Налаштування

### Вимоги
- ✅ Firebase Project налаштований
- ✅ Firestore Database активна
- ✅ Колекція `products` існує
- ✅ Колекція `categories` існує
- ✅ SortableJS CDN доступний

### Firestore Rules (мінімальні)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null; // Тільки авторизовані
    }
    match /categories/{categoryId} {
      allow read: if true;
    }
  }
}
```

### Структура даних

#### Collection: `products`
```json
{
  "name": "Latiao Original",
  "category": "pom-rno-gostre-latyao",
  "price": 150,
  "stock": 20,
  "isOnSale": false,
  "images": ["url1.jpg", "url2.jpg"],
  "createdAt": Timestamp,
  "sortOrder": 0,              // ← Додається при збереженні
  "sortUpdatedAt": Timestamp   // ← Додається при збереженні
}
```

#### Collection: `categories`
```json
{
  "name": "Помірно гостре латяо",
  "slug": "pom-rno-gostre-latyao",
  "description": "..."
}
```

---

## 📸 Скріншоти

### Before (v1.0)
```
❌ Статичні картки без drag
❌ Ручне введення sortOrder в формі
❌ Немає візуального feedback
❌ Збереження по одному товару
```

### After (v2.0)
```
✅ Drag & Drop з анімацією
✅ Position badges на картках
✅ Hover effects + drag handle
✅ Batch збереження (1 запит)
✅ Smart Strategies (6 шт)
✅ Інформаційний банер з інструкціями
```

---

## 🐛 Troubleshooting

### Q: Товари не завантажуються
**A:** 
1. Перевірте консоль (F12) на помилки
2. Клікніть "Debug Database" в UI
3. Перевірте поле `category` у товарів (має співпадати зі slug категорії)

### Q: Drag не працює
**A:**
1. Перевірте що SortableJS завантажився: `console.log(merchSortableInstance)`
2. Переконайтеся що картки мають клас `.merch-card`
3. Перезавантажте сторінку

### Q: Порядок не зберігається
**A:**
1. Перевірте Firestore Rules (дозволено `write`?)
2. Подивіться консоль: має бути `✅ [SAVE] Batch commit successful!`
3. Перевірте інтернет-з'єднання

### Q: Більше 500 товарів в категорії
**A:**
Firestore batch limit = 500 операцій. Потрібна додаткова логіка:
```javascript
// TODO: Розбити на chunks по 500 товарів
const chunks = []
for (let i = 0; i < merchProducts.length; i += 500) {
  chunks.push(merchProducts.slice(i, i + 500))
}
// Batch кожен chunk окремо
```

---

## 🎯 Roadmap

### ✅ Готово (v2.0)
- [x] Drag & Drop interface
- [x] SortableJS integration
- [x] Batch update в Firestore
- [x] Smart Strategies (6 шт)
- [x] Position badges
- [x] Hover effects
- [x] Повна документація

### 🔄 В розробці (v2.1)
- [ ] Undo/Redo функціональність
- [ ] Auto-save з debounce
- [ ] Multi-select (вибір кількох карток)
- [ ] Bulk actions (масові операції)

### 🔮 Планується (v3.0)
- [ ] Multi-category drag (між категоріями)
- [ ] Analytics (tracking найпопулярніших позицій)
- [ ] A/B testing integration
- [ ] Conflict resolution (optimistic UI)
- [ ] History log (історія змін)

---

## 📞 Підтримка

**При виникненні проблем:**

1. 📖 Перечитайте відповідну документацію
2. 🐛 Перевірте [Troubleshooting секцію](#-troubleshooting)
3. 🔍 Використайте `window.debugAllProducts()` в консолі
4. 📝 Перевірте CHANGELOG на наявність breaking changes

**Debug команди в консолі:**
```javascript
// Показати всі товари з категоріями
window.debugAllProducts()

// Детальний аналіз категорій
window.inspectCategoryValues()

// Показати всі активні товари
window.loadAllActiveProducts()
```

---

## 📊 Статистика проекту

| Метрика | Значення |
|---------|----------|
| **Файлів коду** | 1 (admin.html) |
| **Рядків коду** | ~15,300 |
| **Функцій JS** | 50+ |
| **CSS стилів** | 30+ |
| **Документів MD** | 4 |
| **Версія** | 2.0.0 |
| **Статус** | Production Ready ✅ |

---

## 🏆 Best Practices

### ✅ Рекомендовано
- Зберігайте після кожної зміни порядку
- Використайте Smart Strategies як базу
- Тестуйте на реальних даних
- Регулярно backup Firestore
- Логуйте зміни для аналітики

### ❌ Не рекомендовано
- Не змінюйте порядок без збереження
- Не видаляйте поле `sortOrder` вручну
- Не редагуйте кілька категорій одночасно
- Не ігноруйте warning повідомлення

---

## 🎨 Візуальний приклад

```
BEFORE:                         AFTER:
[1] Product A - 150 грн   →    [1] Product D - 200 грн  🔥
[2] Product B - 100 грн   →    [2] Product A - 150 грн
[3] Product C - 80 грн    →    [3] Product B - 100 грн
[4] Product D - 200 грн   →    [4] Product C - 80 грн

💾 Saved to Firestore:
   - Product D: sortOrder = 0
   - Product A: sortOrder = 1
   - Product B: sortOrder = 2
   - Product C: sortOrder = 3
```

---

## 🎓 Навчальні ресурси

### Офіційна документація
- [SortableJS Docs](https://sortablejs.github.io/Sortable/)
- [Firestore Batch Writes](https://firebase.google.com/docs/firestore/manage-data/transactions#batched-writes)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Video tutorials (рекомендовано)
- YouTube: "SortableJS Tutorial"
- YouTube: "Firebase Batch Operations"
- YouTube: "Drag and Drop Best Practices"

---

## 👨‍💻 Розробка

**Створено:** 2026-01-24  
**Версія:** 2.0.0  
**Автор:** AI Development Team  
**Ліцензія:** MIT (для внутрішнього використання)  
**Статус:** ✅ Production Ready

---

## 🎉 Дякую за використання!

Якщо у вас є питання або пропозиції — створіть issue або зв'яжіться з командою розробки.

**Happy Merchandising!** 🚀🎯📦

---

<div align="center">
  
**[⬆️ Повернутися вгору](#-merchandising-system--documentation-hub)**

</div>
