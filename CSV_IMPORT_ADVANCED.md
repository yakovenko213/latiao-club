# 📊 CSV Import з Advanced Column Mapping

## Короткий опис
Модуль для імпорту товарів із CSV файлів з візуальним маппінгом колонок до полів бази даних Firestore.

---

## Основні можливості

✅ **Парсинг CSV з PapaParse** - автоматичний розбір CSV файлів будь-якого розміру  
✅ **Візуальний маппінг колонок** - dropdown меню для зв'язування колонок з полями  
✅ **Автоматичне визначення** - розумне виявлення колонок за назвами  
✅ **Попередній перегляд** - перегляд перших 5 рядків перед імпортом  
✅ **Batch операції** - швидке завантаження до 500 товарів за один запит  
✅ **Валідація даних** - пропуск рядків без назви/ціни  

---

## Як використовувати

### 1. Відкрити модальне вікно
Натисніть кнопку **"CSV Імпорт"** на сторінці Товари.

### 2. Завантажити CSV файл
**Крок 1:** Виберіть CSV файл з вашого комп'ютера.

**Формат CSV:**
```csv
Назва товару,Ціна,Категорія,Опис,Фото URL,Вага
Острий перець Халапеньо,85,Перці,Свіжі перці середньої гостроти,https://example.com/jalapeno.jpg,250г
Соус Шрірача Premium,120,Соуси,Тайський соус з червоного перцю,https://example.com/sriracha.jpg,350мл
```

**Підтримувані кодування:**
- UTF-8 (рекомендовано)
- Windows-1251 (кирилиця)

### 3. Зв'язати колонки (Column Mapping)
**Крок 2:** Система покаже таблицю з preview та dropdown списками над кожною колонкою.

**Доступні поля:**
| Поле | Обов'язкове | Опис |
|------|-------------|------|
| 📝 **Назва** | ✅ Так | Назва товару |
| 💰 **Ціна** | ✅ Так | Ціна в гривнях |
| 📂 Категорія | Ні | Назва категорії |
| 🖼️ URL Фото | Ні | Посилання на зображення |
| 📄 Опис | Ні | Детальний опис товару |
| ⚖️ Вага | Ні | Вага товару (текст) |
| ✅ В наявності | Ні | Доступність (true/false) |
| ❌ Не імпортувати | — | Пропустити колонку |

**Автоматичне визначення:**
Система автоматично намагається визначити колонки за ключовими словами:
- "назва", "name", "title" → Назва
- "ціна", "price", "cost" → Ціна
- "категорія", "category" → Категорія
- "фото", "image", "photo" → URL Фото

### 4. Підтвердити імпорт
Натисніть **"Імпортувати товари"**. Система покаже:
```
✅ Імпорт завершено!

✔️ Додано: 150 товарів
⚠️ Пропущено: 2 рядки (без назви/ціни)
```

---

## Технічні деталі

### Архітектура
```
[CSV File] 
   ↓
[PapaParse] ← Парсинг у JavaScript масив
   ↓
[Preview UI] ← Візуалізація перших 5 рядків
   ↓
[Column Mapping] ← Dropdown для кожної колонки
   ↓
[Validation] ← Перевірка обов'язкових полів
   ↓
[WriteBatch] ← Batch операції по 500 документів
   ↓
[Firestore] ← Збереження в колекцію products
```

### Функції

#### `window.openCSVImportModal()`
Відкриває модальне вікно імпорту.

```javascript
window.openImportModal() // Alias
```

#### `handleCSVFileSelect(event)`
Обробляє вибір файлу та запускає парсинг.

**PapaParse конфігурація:**
```javascript
Papa.parse(file, {
  complete: function(results) {
    csvParsedData = results.data.filter(row => row.some(cell => cell.trim() !== ''))
    showCSVPreviewAndMapping()
  },
  error: function(error) {
    alert('❌ Помилка парсингу CSV: ' + error.message)
  }
})
```

#### `showCSVPreviewAndMapping()`
Генерує UI з dropdown списками та preview таблицею.

**Автоматичне визначення колонок:**
```javascript
const firstCellValue = csvParsedData[0][i].toLowerCase().trim()
if (firstCellValue.includes('назв') || firstCellValue.includes('name')) {
  select.value = 'title'
} else if (firstCellValue.includes('ціна') || firstCellValue.includes('price')) {
  select.value = 'price'
}
```

#### `window.startCSVImport()`
Виконує імпорт з маппінгом та валідацією.

**Маппінг колонок:**
```javascript
const columnMapping = {}
mappingSelects.forEach(select => {
  const columnIndex = parseInt(select.dataset.columnIndex)
  const fieldName = select.value
  if (fieldName) {
    columnMapping[columnIndex] = fieldName
  }
})
```

**Валідація:**
```javascript
if (!productData.title || !productData.price) {
  skipCount++
  continue // Пропустити рядок
}
```

**Batch операції:**
```javascript
let batch = writeBatch(db)
let batchCount = 0
const batchSize = 500

for (let rowIndex = 0; rowIndex < csvParsedData.length; rowIndex++) {
  const newDocRef = doc(collection(db, 'products'))
  batch.set(newDocRef, productData)
  batchCount++

  if (batchCount >= batchSize) {
    await batch.commit()
    batch = writeBatch(db)
    batchCount = 0
  }
}
```

### Обробка типів даних

| Поле | Обробка |
|------|---------|
| **price** | `parseFloat(cellValue.replace(/[^\d.]/g, ''))` - видаляє всі символи крім цифр і крапки |
| **inStock** | `['true', '1', 'yes', 'так', '+'].includes(cellValue.toLowerCase())` - розпізнає різні формати |
| **інші** | `cellValue.trim()` - зберігається як текст |

### Defaults
```javascript
productData.isActive = true
productData.inStock = productData.inStock !== undefined ? productData.inStock : true
productData.createdAt = new Date().toISOString()
```

---

## Файли та локація коду

| Файл | Рядки | Опис |
|------|-------|------|
| `admin.html` | 2598-2748 | HTML структура модального вікна |
| `admin.html` | 9567-9827 | JavaScript логіка імпорту |
| `admin.html` | 17 | PapaParse CDN `<script>` |
| `test-products-import.csv` | — | Тестовий файл для демонстрації |

---

## Обмеження та зауваження

⚠️ **Важливо:**
- Firestore WriteBatch підтримує максимум **500 операцій** за один запит
- Рядки без **Назви** або **Ціни** будуть автоматично пропущені
- CSV файли повинні бути в кодуванні **UTF-8** або **Windows-1251**
- Великі файли (>10000 рядків) можуть займати декілька хвилин

💡 **Рекомендації:**
- Перший рядок CSV може містити заголовки (буде автоматично визначено)
- Використовуйте коми `,` як роздільник (стандарт CSV)
- URL фото мають бути повними посиланнями (https://...)
- Перевіряйте preview перед імпортом

---

## Приклад використання

### Крок за кроком:

1. **Підготувати CSV файл:**
```csv
Назва товару,Ціна грн,Категорія,Опис товару,Посилання на фото,Вага упаковки
Лапша Рамен Спайсі,145,Лапша,Гостра лапша швидкого приготування,https://cdn.example.com/ramen.jpg,85г
Чіпси з васабі,95,Снеки,Хрусткі чіпси з японським хроном,https://cdn.example.com/chips.jpg,100г
```

2. **Відкрити CSV Імпорт** → кнопка на сторінці Товари

3. **Завантажити файл** → вибрати CSV файл

4. **Зв'язати колонки:**
   - Колонка 0 "Назва товару" → **📝 Назва**
   - Колонка 1 "Ціна грн" → **💰 Ціна**
   - Колонка 2 "Категорія" → **📂 Категорія**
   - Колонка 3 "Опис товару" → **📄 Опис**
   - Колонка 4 "Посилання на фото" → **🖼️ URL Фото**
   - Колонка 5 "Вага упаковки" → **⚖️ Вага**

5. **Натиснути "Імпортувати товари"**

6. **Результат:**
```
✅ Імпорт завершено!

✔️ Додано: 2 товари
⚠️ Пропущено: 0 рядків
```

---

## Демонстрація

**Тестовий файл:** `/workspaces/latiao-club/test-products-import.csv`

Містить 5 зразкових товарів для тестування імпорту.

---

## Інтеграція з системою

### Залежності:
- **PapaParse 5.4.1** - CDN: `https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js`
- **Firebase Firestore** - `writeBatch`, `doc`, `collection`
- **Tailwind CSS** - стилізація UI
- **Lucide Icons** - іконки

### Взаємодія з іншими модулями:
- `loadProducts()` - викликається після успішного імпорту
- `writeBatch(db)` - використовує той же підхід, що й Bulk Delete

---

## Версія
**v1.0** - Advanced CSV Import з візуальним маппінгом колонок (24.01.2025)

---

Готово! 🎉