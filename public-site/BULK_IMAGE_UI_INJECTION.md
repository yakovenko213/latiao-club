# 🎨 Dynamic UI Injection - Technical Overview

## Що було зроблено

Створено функцію `initBulkImageUI()` в [js/admin.js](js/admin.js), яка **автоматично** додає UI для Bulk Image Upload на екран.

---

## Як це працює

### 1. Автоматичний запуск
```javascript
// В кінці admin.js:
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBulkImageUI);
} else {
    initBulkImageUI(); // DOM вже завантажений
}
```

### 2. Пошук Products Toolbar
```javascript
const productsView = document.getElementById('products-view');
const toolbar = productsView.querySelector('.px-6.py-4.border-b');
```

### 3. Створення кнопки
```javascript
const bulkImageBtn = document.createElement('button');
bulkImageBtn.id = 'bulk-image-upload-btn';
bulkImageBtn.className = 'flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition';
bulkImageBtn.innerHTML = `<span>📸</span><span>Bulk Images</span>`;
bulkImageBtn.onclick = () => openBulkImageModal();

buttonContainer.insertBefore(bulkImageBtn, addProductBtn); // Додається ПЕРЕД кнопкою "Add Product"
```

### 4. Ін'єкція модального вікна
```javascript
const modalHTML = `<div id="bulkImageModal" class="fixed inset-0 ...">...</div>`;
document.body.insertAdjacentHTML('beforeend', modalHTML);
```

---

## UI Елементи (оновлені ID)

### Модальне вікно
- **ID:** `bulkImageModal`
- **Z-index:** `200` (поверх усіх елементів)
- **Колір:** Purple gradient (від `purple-600` до `purple-700`)

### Елементи всередині модального вікна
```javascript
bulkImageInput        // File input
bulkFileCount         // Лічильник файлів
bulkUploadProgress    // Progress section (hidden за замовчуванням)
bulkProgressBar       // Progress bar (0-100%)
bulkProgressText      // Текст прогресу ("X / Y")
bulkLogConsole        // Scrollable log area
bulkStartUploadBtn    // Кнопка "Почати завантаження"
```

---

## Експортовані функції

### 1. `window.openBulkImageModal()`
Відкриває модальне вікно, скидає стан UI:
```javascript
modal.classList.remove('hidden');
modal.classList.add('flex');
fileInput.value = '';
progressSection.classList.add('hidden');
logConsole.innerHTML = '...';
```

### 2. `window.closeBulkImageModal()`
Закриває модальне вікно:
```javascript
modal.classList.add('hidden');
modal.classList.remove('flex');
```

### 3. `window.logToBulkConsole(message, type)`
Додає лог-повідомлення:
```javascript
window.logToBulkConsole('Файл завантажено', 'success'); // ✅ Зелений
window.logToBulkConsole('SKU не знайдено', 'error');    // ❌ Червоний
window.logToBulkConsole('Обробка...', 'info');          // 📝 Синій
window.logToBulkConsole('Перевірте дані', 'warning');   // ⚠️ Жовтий
```

### 4. `window.updateBulkProgress(current, total)`
Оновлює прогрес-бар:
```javascript
window.updateBulkProgress(3, 10); // 30%
```

---

## Перевірка на дублікати

Функція перевіряє, чи вже існують елементи:
```javascript
if (document.getElementById('bulk-image-upload-btn')) {
    console.log('✅ Bulk Image button already exists');
    return;
}

if (document.getElementById('bulkImageModal')) {
    console.log('✅ Bulk Image modal already exists');
    return;
}
```

---

## Console Output

При успішному запуску:
```
🎨 Initializing Bulk Image Upload UI...
✅ Bulk Image button injected
✅ Bulk Image modal injected
✅ admin.js loaded successfully (with Shopify import support)
✅ Bulk Image Upload module loaded
```

---

## Візуальний результат

### До
```
[Товари]                                    [+ Додати товар]
```

### Після
```
[Товари]               [📸 Bulk Images]     [+ Додати товар]
                          ↑
                       Purple button
```

---

## Стилі кнопки

```css
background: #9333ea (purple-600)
hover: #7c3aed (purple-700)
text: white
padding: 16px (px-4 py-2)
border-radius: 8px (rounded-lg)
font-weight: 600 (font-semibold)
```

---

## Callback Flow

```
User clicks "📸 Bulk Images"
    ↓
openBulkImageModal()
    ↓
Modal visible (flex)
    ↓
User selects files
    ↓
File input change event → Update file count
    ↓
User clicks "🚀 Почати завантаження"
    ↓
handleBulkImageUpload()
    ↓
processBulkUpload(files, 5)
    ↓
uploadSingleImage() × N (max 5 concurrent)
    ↓
logToBulkConsole() + updateBulkProgress()
    ↓
Alert with summary
```

---

## Інтеграція з admin.js

### Firebase Instances
```javascript
window.firebaseInstances = {
    db, storage, collection, query, where, 
    ref, uploadBytes, getDownloadURL, 
    updateDoc, serverTimestamp, ...
}
```

### Використання в bulk-image-upload.js
```javascript
const { db, storage, ref, uploadBytes } = window.firebaseInstances;
```

---

## Troubleshooting

### Кнопка не з'являється
**Причина:** Products view ще не завантажився.  
**Рішення:** Функція викликається при `DOMContentLoaded`, якщо DOM ще завантажується.

### Modal не відкривається
**Причина:** `openBulkImageModal` не знайдено.  
**Рішення:** Перевірте console на помилки, перезавантажте сторінку.

### Логи не показуються
**Причина:** ID елементів не збігаються.  
**Рішення:** Перевірте, що використовуються `bulkLogConsole`, `bulkProgressBar` (не старі ID).

---

## Файли проекту

```
js/
├── admin.js                    # initBulkImageUI() + modal functions
└── bulk-image-upload.js        # Core upload logic
```

---

**Статус:** ✅ Повністю робочий  
**Коміт:** `440d555` - Динамічна ін'єкція UI  
**Тестування:** Відкрийте admin-clean.html → Розділ "Товари" → Кнопка "📸 Bulk Images" має бути видимою
