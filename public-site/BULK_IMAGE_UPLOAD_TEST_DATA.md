# Тестові дані для Bulk Image Upload

## Приклад структури товарів у Firestore

### Collection: `products`

```javascript
// Document 1
{
  id: "product_001",
  name: "Латяо Класичний",
  sku: "9840",              // ⚠️ STRING, не число!
  price: 120,
  category: "snacks",
  stock: 50,
  image: null,              // Буде оновлено через Bulk Upload
  spiciness: 2,
  createdAt: Timestamp,
  active: true
}

// Document 2
{
  id: "product_002",
  name: "Латяо Гострий",
  sku: "1520",              // ⚠️ STRING
  price: 150,
  category: "snacks",
  stock: 30,
  image: null,
  spiciness: 4,
  createdAt: Timestamp,
  active: true
}

// Document 3
{
  id: "product_003",
  name: "Латяо Екстра Гострий",
  sku: "8765",              // ⚠️ STRING
  price: 180,
  category: "snacks",
  stock: 20,
  image: null,
  spiciness: 5,
  createdAt: Timestamp,
  active: true
}
```

---

## Приклад назв файлів зображень

Створіть папку з такими файлами:
```
test-images/
├── 9840.jpg      → Для "Латяо Класичний"
├── 1520.png      → Для "Латяо Гострий"
└── 8765.webp     → Для "Латяо Екстра Гострий"
```

---

## Тестування процесу

### Сценарій 1: Всі файли знайдені ✅
**Файли:** `9840.jpg`, `1520.png`, `8765.webp`  
**Результат:**
```
✅ 9840.jpg → Оновлено! (Латяо Класичний)
✅ 1520.png → Оновлено! (Латяо Гострий)
✅ 8765.webp → Оновлено! (Латяо Екстра Гострий)

🎉 Завершено! Успішно: 3 | Помилки: 0 | Всього: 3
```

### Сценарій 2: SKU не знайдено ❌
**Файли:** `9840.jpg`, `9999.jpg` (SKU "9999" не існує)  
**Результат:**
```
✅ 9840.jpg → Оновлено! (Латяо Класичний)
❌ 9999.jpg → Товар не знайдено для SKU="9999"

🎉 Завершено! Успішно: 1 | Помилки: 1 | Всього: 2
```

### Сценарій 3: Невірний формат назви
**Файли:** `Латяо 9840.jpg` (містить пробіл)  
**Результат:**
```
❌ Латяо 9840.jpg → Товар не знайдено для SKU="Латяо 9840"
```
**Рішення:** Перейменуйте на `9840.jpg`

---

## Як додати тестові товари в Firestore

### Варіант 1: Через Firebase Console
1. Firestore Database → `products` → Add document
2. Document ID: `product_001`
3. Поля:
   ```
   name: "Латяо Класичний" (string)
   sku: "9840" (string) ← Обов'язково в лапках!
   price: 120 (number)
   category: "snacks" (string)
   stock: 50 (number)
   image: null (null)
   spiciness: 2 (number)
   active: true (boolean)
   ```

### Варіант 2: Через Admin Panel (Import CSV)
Створіть CSV файл:
```csv
name,sku,price,category,stock,spiciness,active
Латяо Класичний,9840,120,snacks,50,2,true
Латяо Гострий,1520,150,snacks,30,4,true
Латяо Екстра Гострий,8765,180,snacks,20,5,true
```

Завантажте через **"Import Products"** в Admin Panel.

---

## Перевірка після завантаження

### 1. Перевірка Firestore
Відкрийте документ товару:
```javascript
{
  name: "Латяо Класичний",
  sku: "9840",
  image: "https://firebasestorage.googleapis.com/.../product_images/9840.jpg?..." // ← Оновлено!
}
```

### 2. Перевірка Storage
Firebase Console → Storage → `product_images/`
```
product_images/
├── 9840.jpg      (512 KB)
├── 1520.png      (768 KB)
└── 8765.webp     (420 KB)
```

### 3. Перевірка на сайті
Відкрийте сторінку товару → Зображення має відображатися.

---

## Очищення тестових даних

```javascript
// Firestore Console → products → Select all test docs → Delete

// Storage Console → product_images/ → Select files → Delete
```

---

## Firestore Query приклад

Як система знаходить товар:
```javascript
import { collection, query, where, limit, getDocs } from 'firebase/firestore';

const q = query(
  collection(db, 'products'),
  where('sku', '==', "9840"),  // STRING comparison
  limit(1)
);

const snapshot = await getDocs(q);
if (!snapshot.empty) {
  const product = snapshot.docs[0];
  console.log(product.data()); // { name: "Латяо Класичний", sku: "9840", ... }
}
```

---

## Типові помилки в тестуванні

### Помилка 1: `snapshot.empty === true`
**Причина:** SKU у Firestore є числом, а не стрінгом.
```javascript
// ❌ Неправильно:
{ sku: 9840 }  // number

// ✅ Правильно:
{ sku: "9840" }  // string
```

### Помилка 2: File не завантажується
**Причина:** Розширення не підтримується.
```
✅ Підтримуються: .jpg, .jpeg, .png, .gif, .webp, .bmp, .svg
❌ Не підтримуються: .tiff, .psd, .ai
```

### Помилка 3: "Storage quota exceeded"
**Причина:** Безкоштовний план Firebase (5GB).  
**Рішення:** Оптимізуйте зображення або оновіться до Blaze Plan.

---

**Готово до тестування!** 🚀
