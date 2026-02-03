# 🧪 Тестування системи контролю складу

## Як перевірити, чи працює система

### 1. Очистіть кеш браузера
Натисніть **Ctrl+Shift+R** (Windows/Linux) або **Cmd+Shift+R** (Mac)

### 2. Відкрийте консоль браузера
Натисніть **F12** → вкладка **Console**

### 3. Перевірте що має з'явитися в консолі

#### При додаванні товару в кошик:
```
🔍 Stock check: Firebase not ready  ← (якщо Firebase ще не завантажився)
або
✅ Stock check for PRODUCT_ID: 10  ← (якщо все ОК)
```

#### При відкритті кошика:
```
🔍 Validating cart stock...
✅ Stock check for PRODUCT_ID: 5
✅ Cart stock validation complete - no adjustments needed
```

або якщо товарів більше ніж є:
```
⚠️ Adjusted Product Name: 10 → 5
Кількість деяких товарів змінено згідно наявності
```

#### При оформленні замовлення (checkout):
```
🔍 Performing comprehensive stock validation...
📊 Product Name: requested=10, available=5
📦 Auto-adjusted Product Name: 10 → 5
❌ Stock validation failed
```

І має з'явитися **модальне вікно** з помилкою.

---

## Можливі проблеми

### Проблема 1: Firebase not ready
**Симптом**: В консолі `Firebase not ready`
**Рішення**: Почекайте 2-3 секунди після завантаження сторінки

### Проблема 2: Немає логів в консолі
**Симптом**: Ніяких повідомлень про stock check
**Рішення**: 
1. Очистіть кеш: Ctrl+Shift+R
2. Перевірте що URL: https://my-magazin-81c96.web.app
3. Перезавантажте сторінку кілька разів

### Проблема 3: Product ID not found
**Симптом**: `Product XXXX not found`
**Рішення**: Товар не має ID або ID невірний в Firestore

### Проблема 4: Поле available_stock відсутнє
**Симптом**: Stock завжди null
**Рішення**: Додайте поле `available_stock` в Firestore:
```
products/{productId}
  - available_stock: 10
  - stock: 10  (запасний варіант)
```

---

## Ручне тестування

### Крок 1: Створіть тестовий товар
1. Firebase Console → Firestore
2. Колекція `products`
3. Додайте документ:
   ```json
   {
     "name": "Test Product",
     "price": 100,
     "available_stock": 2,
     "stock": 2
   }
   ```

### Крок 2: Спробуйте додати 5 штук
1. Відкрийте товар
2. Змініть quantity на 5
3. Додайте в кошик
4. **Очікуваний результат**: Автоматично зміниться на 2

### Крок 3: Спробуйте збільшити в кошику
1. Відкрийте кошик (sidebar)
2. Натисніть "+" кілька разів
3. **Очікуваний результат**: 
   - Кнопка "+" стане disabled при досягненні ліміту
   - Toast: "Максимальна кількість у наявності: 2"

### Крок 4: Спробуйте оформити замовлення
1. Перейдіть на checkout
2. Заповніть форму
3. Натисніть "Оформити замовлення"
4. **Очікуваний результат**: 
   - Якщо все ОК → продовжує до оплати
   - Якщо є проблеми → показує модальне вікно

---

## Швидкий діагностичний скрипт

Відкрийте консоль браузера і виконайте:

```javascript
// Перевірка 1: Чи завантажився Firebase
console.log('Firebase ready:', !!window.firebaseInit);

// Перевірка 2: Чи є функція stock check
console.log('Stock functions exist:', 
  typeof window.addToCart === 'function',
  typeof window.updateQtyByIndex === 'function',
  typeof window.openCart === 'function'
);

// Перевірка 3: Чи є товари в кошику
const cart = JSON.parse(localStorage.getItem('latiao_cart') || '[]');
console.log('Cart items:', cart.length);
cart.forEach(item => {
  console.log(`- ${item.name}: qty=${item.quantity}, stock=${item.stock}`);
});

// Перевірка 4: Спробувати отримати stock для товару
if (window.firebaseInit && cart.length > 0) {
  const { db, doc, getDoc } = window.firebaseInit;
  const productId = cart[0].id;
  
  getDoc(doc(db, 'products', productId))
    .then(snap => {
      if (snap.exists()) {
        const data = snap.data();
        console.log('✅ Product data:', {
          id: productId,
          name: data.name,
          available_stock: data.available_stock,
          stock: data.stock
        });
      } else {
        console.log('❌ Product not found:', productId);
      }
    })
    .catch(err => console.error('❌ Error:', err));
}
```

---

## Контакти для звіту про баги

Якщо система не працює після всіх перевірок, надішліть:
1. Скріншот консолі браузера
2. URL сторінки
3. ID товару який тестували
4. Які кроки виконували
