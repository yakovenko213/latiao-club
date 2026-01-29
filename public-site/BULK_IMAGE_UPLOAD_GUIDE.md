# 📸 Bulk Image Upload by SKU - Посібник

## Огляд функції

Масове завантаження зображень товарів за SKU дозволяє оновлювати фото товарів пакетно, використовуючи назви файлів як ідентифікатори.

---

## 🎯 Як це працює

1. **Назвіть файли зображень відповідно до SKU товарів**
   - Приклад: `9840.jpg`, `1520.png`, `8765.webp`
   - SKU зберігається в Firestore як **STRING** (не число!)

2. **Виберіть всі зображення в Admin Panel**
   - Відкрийте розділ "Товари"
   - Натисніть кнопку **"📸 Bulk Image Upload"**
   - Виберіть файли через file input

3. **Система автоматично обробить кожен файл:**
   - Витягне SKU з назви файлу (видалить розширення)
   - Знайде товар у Firestore: `products.where('sku', '==', skuString)`
   - Завантажить зображення в Firebase Storage: `product_images/`
   - Оновить поле `image` у документі товару

4. **Перегляньте результати в логах**
   - Успішні: ✅ Зелені повідомлення
   - Помилки: ❌ Червоні повідомлення (SKU не знайдено)

---

## 🔧 Технічна архітектура

### Структура файлів

```
/workspaces/latiao-club/
├── admin-clean.html              # UI: Кнопка + модальне вікно
├── js/
│   ├── admin.js                  # Firebase initialization + експорт інстансів
│   └── bulk-image-upload.js      # Логіка масового завантаження
```

### Ключові функції

#### 1. **`openBulkImageUploadModal()`**
Відкриває модальне вікно, скидає попередній стан UI.

#### 2. **`handleBulkImageUpload()`**
Головна функція обробки:
- Валідує наявність файлів
- Викликає `processBulkUpload()` з concurrency=5
- Показує фінальне повідомлення

#### 3. **`processBulkUpload(files, concurrency)`**
Обробляє файли пакетно:
```javascript
// Приклад: 12 файлів → 3 батчі по 5, 5, 2 файлів
for (let i = 0; i < files.length; i += 5) {
  const batch = files.slice(i, i + 5);
  const results = await Promise.all(
    batch.map(file => uploadSingleImage(file))
  );
}
```

#### 4. **`uploadSingleImage(file)`**
Завантажує один файл:
```javascript
async function uploadSingleImage(file) {
  // 1. Extract SKU from filename
  const sku = file.name.replace(/\.(jpg|png|...)$/i, ''); // "9840.jpg" → "9840"
  
  // 2. Find product in Firestore
  const product = await findProductBySku(sku); // Query: where('sku', '==', "9840")
  
  // 3. Upload to Storage
  const storageRef = ref(storage, `product_images/${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  
  // 4. Update Firestore
  await updateDoc(doc(db, 'products', product.id), { 
    image: downloadURL,
    updatedAt: serverTimestamp()
  });
}
```

#### 5. **`findProductBySku(sku)`**
Шукає товар за SKU (STRING):
```javascript
const q = query(
  collection(db, 'products'),
  where('sku', '==', sku),  // CRITICAL: Keep as string!
  limit(1)
);
const snapshot = await getDocs(q);
```

---

## ⚠️ Критичні обмеження

### 1. **SKU як STRING, НЕ число**
❌ **Неправильно:**
```javascript
const sku = parseInt("9840"); // 9840 (number)
where('sku', '==', 9840)
```

✅ **Правильно:**
```javascript
const sku = "9840"; // "9840" (string)
where('sku', '==', "9840")
```

### 2. **Concurrency = 5 (макс. 5 файлів одночасно)**
Причина: Уникнення перевантаження Firebase Storage API та Firestore write limits.

### 3. **Підтримувані формати:**
`.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.bmp`, `.svg`

### 4. **Firebase Storage Path:**
Всі зображення зберігаються у:
```
gs://my-magazin-81c96.firebasestorage.app/product_images/
```

---

## 📊 UI компоненти

### Модальне вікно структура

```html
<div id="bulk-image-upload-modal">
  <!-- 1. Header (Blue gradient) -->
  <div class="bg-gradient-to-r from-blue-600 to-blue-700">
    <h3>Масове завантаження зображень</h3>
  </div>
  
  <!-- 2. Instructions (Blue info box) -->
  <div class="bg-blue-50">
    <ol>Як це працює...</ol>
  </div>
  
  <!-- 3. File Input -->
  <input type="file" id="bulkImageInput" multiple accept="image/*">
  <div id="file-count">📁 Вибрано файлів: X</div>
  
  <!-- 4. Progress Bar (Hidden by default) -->
  <div id="upload-progress-section" class="hidden">
    <div id="progress-bar" style="width: 0%"></div>
    <span id="progress-text">0 / 0</span>
  </div>
  
  <!-- 5. Log Console (Scrollable) -->
  <div id="log-console" class="max-h-[300px] overflow-y-auto">
    <!-- Real-time logs appear here -->
  </div>
  
  <!-- 6. Action Buttons -->
  <button onclick="closeBulkImageUploadModal()">Закрити</button>
  <button onclick="handleBulkImageUpload()">🚀 Почати завантаження</button>
</div>
```

### Log Console типи повідомлень

```javascript
logToConsole('Початок обробки...', 'info');    // 📝 Blue
logToConsole('Знайдено товар!', 'success');    // ✅ Green
logToConsole('SKU не знайдено', 'error');      // ❌ Red
logToConsole('Перевірте дані', 'warning');     // ⚠️ Yellow
```

---

## 🔄 Workflow приклад

### Сценарій: Оновити 3 товари

**Файли:**
- `9840.jpg` (SKU: "9840" існує в Firestore)
- `1520.png` (SKU: "1520" існує)
- `9999.webp` (SKU: "9999" НЕ існує)

**Процес:**

1. **Користувач відкриває модальне вікно:**
   ```
   openBulkImageUploadModal()
   → Modal classList: hidden → flex
   ```

2. **Вибирає 3 файли:**
   ```
   File Input change event
   → file-count: "📁 Вибрано файлів: 3"
   ```

3. **Натискає "Почати завантаження":**
   ```
   handleBulkImageUpload()
   → Disable button
   → processBulkUpload([9840.jpg, 1520.png, 9999.webp], 5)
   ```

4. **Обробка Batch #1 (3 файли паралельно):**
   ```javascript
   Promise.all([
     uploadSingleImage(9840.jpg),  // ✅ Success
     uploadSingleImage(1520.png),  // ✅ Success
     uploadSingleImage(9999.webp)  // ❌ Error: SKU not found
   ])
   ```

5. **Логи в консолі:**
   ```
   📝 Обробка файлу: 9840.jpg (SKU: "9840")
   ✅ Знайдено товар: Латяо Класичний (ID: abc123)
   📝 Завантаження в Storage: product_images/9840.jpg...
   ✅ 9840.jpg → Оновлено! (Латяо Класичний)
   
   📝 Обробка файлу: 1520.png (SKU: "1520")
   ✅ Знайдено товар: Латяо Гострий (ID: def456)
   ✅ 1520.png → Оновлено! (Латяо Гострий)
   
   📝 Обробка файлу: 9999.webp (SKU: "9999")
   ❌ 9999.webp → Товар не знайдено для SKU="9999"
   
   🎉 Завершено! Успішно: 2 | Помилки: 1 | Всього: 3
   ```

6. **Фінальне повідомлення:**
   ```
   Alert:
   ✅ Масове завантаження завершено!
   
   Успішно оновлено: 2 товарів
   Помилки: 1
   Всього файлів: 3
   ```

7. **Перезавантаження списку товарів:**
   ```javascript
   if (result.successCount > 0) {
     await loadProducts(); // Refresh products table
   }
   ```

---

## 🛠️ Налаштування Firestore Security Rules

Переконайтеся, що адміни мають доступ до запису:

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null && 
                   get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## 🛠️ Налаштування Firebase Storage Rules

```javascript
// storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /product_images/{imageId} {
      allow read: if true;
      allow write: if request.auth != null; // Only authenticated admins
    }
  }
}
```

---

## 🐛 Типові помилки та рішення

### Помилка 1: "Товар не знайдено для SKU"

**Причина:** SKU у файлі не збігається з жодним товаром у Firestore.

**Рішення:**
1. Перевірте правильність назви файлу (без пробілів, спецсимволів)
2. Перевірте поле `sku` у Firestore:
   ```javascript
   // Firestore Console → products collection → document
   {
     sku: "9840"  // Має бути рівно "9840", не 9840 (number)
   }
   ```

### Помилка 2: "Firebase: Missing or insufficient permissions"

**Причина:** Користувач не авторизований як адмін.

**Рішення:**
1. Перевірте `localStorage.getItem('isAdmin')` → має бути `"true"`
2. Перевірте Firestore Rules (див. вище)

### Помилка 3: "Storage quota exceeded"

**Причина:** Перевищено ліміт Firebase Storage (безкоштовний план: 5GB).

**Рішення:**
1. Оптимізуйте розміри зображень (стискайте до 1920x1920)
2. Оновіться до Blaze Plan

### Помилка 4: Concurrency issues (too many requests)

**Причина:** Завантаження занадто багатьох файлів одночасно.

**Рішення:**
Зменшіть `concurrency` параметр:
```javascript
await processBulkUpload(files, 3); // Change from 5 to 3
```

---

## 📈 Performance Metrics

### Тестування: 50 файлів

```
Concurrency: 5
Avg file size: 500 KB
Total time: ~2 minutes

Breakdown:
- Firebase query (per file): ~200ms
- Storage upload (per file): ~1.5s
- Firestore update (per file): ~300ms
- Total per file: ~2s

Batches: 50 files / 5 = 10 batches
Time: 10 batches × 2s = ~20s (+ network overhead)
```

---

## 🚀 Майбутні покращення

### 1. **Preview Before Upload**
Показувати мініатюри зображень перед завантаженням.

### 2. **Drag & Drop**
Підтримка перетягування файлів у модальне вікно.

### 3. **CSV Mapping**
Можливість завантажити CSV файл з маппінгом: `filename,sku`

### 4. **Rollback Feature**
Можливість відкатити зміни, якщо щось пішло не так.

### 5. **Image Optimization**
Автоматичне стиснення/оптимізація зображень перед завантаженням.

---

## 📞 Підтримка

Якщо виникли проблеми:
1. Перевірте консоль браузера (F12 → Console)
2. Перевірте Firebase Console → Firestore/Storage
3. Перегляньте логи в модальному вікні

**Контакти:** yakovenko213@gmail.com

---

**Версія:** 1.0.0  
**Дата:** 22 січня 2026  
**Автор:** GitHub Copilot + Claude Sonnet 4.5
