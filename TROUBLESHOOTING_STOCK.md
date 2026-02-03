# 🔧 Інструкція з діагностики системи контролю складу

## ❗ Що робити, якщо система не працює

### Крок 1: Перевірте тестову сторінку

**URL:** https://my-magazin-81c96.web.app/test-stock.html

1. Відкрийте цю сторінку
2. Введіть ID будь-якого товару з вашої бази
3. Натисніть "Перевірити наявність"
4. Подивіться результат:
   - Чи є поле `available_stock`?
   - Чи є поле `stock`?
   - Яке значення буде використано?

**Якщо товар не знайдено:**
- Перевірте правильність ID
- Переконайтеся що товар існує в Firestore → `products` колекції

**Якщо немає полів stock:**
- Додайте поле `stock` або `available_stock` в Firestore
- Значення має бути числом (number), не текстом

---

### Крок 2: Очистіть кеш браузера

**Важливо!** Браузер кешує JavaScript файли.

**Спосіб 1 - Hard Refresh:**
- Windows/Linux: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

**Спосіб 2 - Повне очищення:**
1. Відкрийте DevTools (F12)
2. Права кнопка миші на кнопці "Оновити" в браузері
3. Виберіть "Очистити кеш і жорстко перезавантажити"

**Спосіб 3 - Через налаштування:**
1. Chrome: Settings → Privacy → Clear browsing data
2. Виберіть "Cached images and files"
3. Натисніть "Clear data"

---

### Крок 3: Перевірте консоль браузера

1. Натисніть **F12** (відкриється DevTools)
2. Перейдіть на вкладку **Console**
3. Оновіть сторінку (F5)

**Що має з'явитися при завантаженні:**
```
Firebase initialized for...
✅ Firebase ready
```

**Що має з'явитися при додаванні товару:**
```
✅ Stock check for PRODUCT_ID: 10
```

**Що має з'явитися при відкритті кошика:**
```
🔍 Validating cart stock...
✅ Cart stock validation complete
```

**Якщо нічого не з'являється:**
- JavaScript не завантажився або є помилки
- Перевірте вкладку "Console" на червоні помилки

---

### Крок 4: Перевірте структуру товару в Firestore

1. Відкрийте [Firebase Console](https://console.firebase.google.com)
2. Виберіть проект `my-magazin-81c96`
3. Firestore Database → Колекція `products`
4. Відкрийте будь-який товар

**Правильна структура:**
```
products/{productId}
  ├─ name: "Latiao Classic"
  ├─ price: 89
  ├─ stock: 10              ← ВАЖЛИВО!
  ├─ available_stock: 10    ← ВАЖЛИВО! (пріоритетне)
  ├─ imageUrl: "..."
  └─ ... інші поля
```

**Що перевірити:**
- ✅ Поле `stock` або `available_stock` існує
- ✅ Значення - це число (не текст "10", а число 10)
- ✅ Значення > 0

**Якщо полів немає:**
```javascript
// Додайте через Firestore Console або виконайте в консолі:
// (замініть YOUR_PRODUCT_ID на реальний ID)

const productRef = doc(db, 'products', 'YOUR_PRODUCT_ID');
await updateDoc(productRef, {
  stock: 10,
  available_stock: 10
});
```

---

### Крок 5: Тест в реальному часі

**Відкрийте консоль браузера (F12) і виконайте:**

```javascript
// 1. Перевірка чи завантажився Firebase
console.log('Firebase ready:', !!window.firebaseInit);

// 2. Перевірка функцій stock check
console.log('Functions available:', {
  addToCart: typeof window.addToCart,
  updateQtyByIndex: typeof window.updateQtyByIndex,
  openCart: typeof window.openCart
});

// 3. Подивитися що в кошику
const cart = JSON.parse(localStorage.getItem('latiao_cart') || '[]');
console.log('Cart items:', cart.length);
cart.forEach((item, i) => {
  console.log(`${i+1}. ${item.name}: qty=${item.quantity}, stock=${item.stock || 'unknown'}`);
});

// 4. Тест перевірки stock для першого товару
if (window.firebaseInit && cart.length > 0) {
  const { db, doc, getDoc } = window.firebaseInit;
  const productId = cart[0].id;
  
  console.log('Testing stock check for:', productId);
  
  getDoc(doc(db, 'products', productId))
    .then(snap => {
      if (snap.exists()) {
        const data = snap.data();
        console.log('✅ Product found:', {
          name: data.name,
          available_stock: data.available_stock,
          stock: data.stock,
          willUse: data.available_stock ?? data.stock ?? 'NULL'
        });
      } else {
        console.log('❌ Product not found:', productId);
      }
    })
    .catch(err => console.error('❌ Error:', err));
} else {
  console.log('⚠️ Cannot test - no items in cart or Firebase not ready');
}
```

---

### Крок 6: Тест додавання товару

1. **Відкрийте будь-яку сторінку товару**
2. **Відкрийте консоль (F12)**
3. **Натисніть "Додати в кошик"**
4. **Перевірте консоль:**

**Якщо працює правильно:**
```
🔍 Stock check: Firebase not ready  (якщо Firebase ще завантажується)
або
✅ Stock check for abc123: 5  (якщо все ОК)
```

**Якщо НЕ працює:**
```
(порожньо - нічого не з'являється)
```

**Рішення якщо не працює:**
- Firebase не завантажився → почекайте 2-3 сек після завантаження сторінки
- Помилка в консолі → подивіться червоні помилки в Console tab
- ID товару не знайдено → перевірте Firestore

---

### Крок 7: Тест збільшення кількості в кошику

1. **Відкрийте кошик** (клік на іконку кошика)
2. **Відкрийте консоль (F12)**
3. **Натисніть кнопку "+" біля товару**

**Очікувана поведінка:**
- Консоль: `🔍 Validating cart stock...`
- Консоль: `✅ Stock check for abc123: 5`
- Якщо досягли ліміту → Toast: "Максимальна кількість у наявності: 5"
- Кнопка "+" стає сірою (disabled)

**Якщо НЕ працює:**
- Кількість збільшується без обмежень
- Немає повідомлень в консолі
- Кнопка не стає disabled

---

### Крок 8: Тест оформлення замовлення

1. **Перейдіть на checkout** (кошик → "Оформити замовлення")
2. **Заповніть всі поля форми**
3. **Відкрийте консоль (F12)**
4. **Натисніть "Підтвердити замовлення"**

**Очікувана поведінка:**
- Текст кнопки: "Перевірка наявності..."
- Консоль: `🔍 Performing comprehensive stock validation...`
- Консоль: `📊 Product Name: requested=10, available=5`

**Якщо є проблеми зі stock:**
- З'являється **модальне вікно** з помилкою
- Список товарів з проблемами
- Автоматичне коригування кількості

**Якщо все ОК:**
- Продовжує до створення рахунку
- Перенаправляє на оплату

---

## 🆘 Типові проблеми

### Проблема 1: "Нічого не змінилося"

**Причина:** Кеш браузера
**Рішення:** Ctrl+Shift+R (hard refresh)

### Проблема 2: "Можу додавати скільки завгодно"

**Причина:** 
- Firebase не завантажився
- Поля stock немає в базі
- ID товару невірний

**Рішення:**
1. Відкрийте test-stock.html
2. Перевірте чи існує товар і чи є поле stock
3. Додайте поле якщо немає

### Проблема 3: "Консоль порожня"

**Причина:** JavaScript не завантажився
**Рішення:**
1. Очистіть кеш
2. Перезавантажте сторінку
3. Перевірте чи немає помилок в Console

### Проблема 4: "Firebase not ready"

**Причина:** Firebase ще завантажується
**Рішення:** Почекайте 2-3 секунди після завантаження сторінки

### Проблема 5: "Product not found"

**Причина:** Товар не має правильного ID в Firestore
**Рішення:**
1. Перевірте ID товару в localStorage
2. Перевірте чи існує документ з таким ID в Firestore
3. Переконайтеся що ID точно співпадає

---

## ✅ Контрольний список

Пройдіться по всіх пунктах:

- [ ] Очистив кеш браузера (Ctrl+Shift+R)
- [ ] Відкрив test-stock.html і перевірив товар
- [ ] В Firestore є поле `stock` або `available_stock`
- [ ] Поле stock має числове значення (не текст)
- [ ] Відкрив консоль браузера (F12)
- [ ] Бачу повідомлення про Firebase ready
- [ ] При додаванні товару з'являються логи stock check
- [ ] При відкритті кошика з'являється валідація
- [ ] Кнопка "+" стає disabled при досягненні ліміту
- [ ] На checkout показується модальне вікно при проблемах

---

## 📞 Якщо нічого не допомагає

**Надішліть мені:**
1. Скріншот консолі браузера (вкладка Console)
2. URL сторінки де тестували
3. ID товару який використовували
4. Результат з test-stock.html
5. Скріншот товару з Firestore Console

**Контакти:**
- GitHub Issue
- Email
- Telegram
