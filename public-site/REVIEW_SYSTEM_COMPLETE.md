# 🎯 Персоналізована система відгуків - Повна реалізація

## 📋 Зміст

1. [Огляд](#огляд)
2. [Архітектура системи](#архітектура-системи)
3. [URL структура](#url-структура)
4. [Frontend реалізація](#frontend-реалізація)
5. [Backend логіка](#backend-логіка)
6. [SMS інтеграція](#sms-інтеграція)
7. [Firestore правила](#firestore-правила)
8. [Тестування](#тестування)
9. [Розширення функціональності](#розширення-функціональності)
10. [FAQ](#faq)

---

## 🎯 Огляд

Персоналізована система відгуків дозволяє клієнтам залишати відгуки через унікальні посилання, які генеруються для кожного замовлення.

### Переваги:
- ✅ **Одноклацькове користування** - клієнт потрапляє на сторінку відгуку напряму з SMS
- ✅ **Автоматичне заповнення** - ім'я та товари підтягуються з замовлення
- ✅ **Модальне вікно** - не відвлікаючий інтерфейс для заповнення
- ✅ **Привʹязка до замовлення** - можна відстежити звідки прийшов відгук
- ✅ **Mobile-friendly** - оптимізовано для мобільних пристроїв

---

## 🏗️ Архітектура системи

```
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN PANEL                              │
│  (Ініціює відправку SMS з унікальним review link)           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Generates:
                     │ https://latiao-snack.com.ua/review?orderId=ABC123
                     │
                     ▼
         ┌──────────────────────────────┐
         │  TurboSMS API                │
         │  (Надсилає SMS клієнту)      │
         └──────────────┬───────────────┘
                        │
                        │ SMS: "Залишити відгук: {review_link}"
                        │
                        ▼
         ┌──────────────────────────────┐
         │  CLIENT (мобільний)          │
         │  (Натискує посилання в SMS)  │
         └──────────────┬───────────────┘
                        │
                        ▼
         ┌──────────────────────────────┐
         │  REVIEW PAGE                 │
         │  review-personalized.html    │
         │  ?orderId=ABC123             │
         └──────────────┬───────────────┘
                        │
                        │ Fetches order data from Firestore
                        │
                        ▼
         ┌──────────────────────────────┐
         │  MODAL WITH FORM             │
         │  - Product List              │
         │  - Phone Number              │
         │  - Star Rating               │
         │  - Review Text               │
         │  - Photo Upload              │
         └──────────────┬───────────────┘
                        │
                        │ Submit review
                        │
                        ▼
         ┌──────────────────────────────┐
         │  FIRESTORE                   │
         │  reviews collection          │
         │  (status: "pending")         │
         └──────────────────────────────┘
```

---

## 🔗 URL структура

### Review Page URL

```
https://latiao-snack.com.ua/review?orderId={FIRESTORE_ORDER_ID}
```

**Параметри:**
- `orderId` (обов'язковий) - Firestore document ID замовлення
  - Приклад: `abc123def456ghi789`
  - Довжина: 20 символів (Firestore auto-ID)

### URL Приклад

```
https://latiao-snack.com.ua/review?orderId=p9x5mZ7qL2vN8hK3jF6w
```

---

## 💻 Frontend реалізація

### Файли

1. **[review-personalized.html](./review-personalized.html)** - Головна сторінка
2. **[js/review-system.js](./js/review-system.js)** - Утиліти та helper функції

### Основна логіка

#### 1. Ініціалізація сторінки

```javascript
// Отримати orderId з URL
const urlParams = new URLSearchParams(window.location.search)
const orderId = urlParams.get('orderId')

// Завантажити замовлення з Firestore
const orderDoc = await getDoc(doc(db, 'orders', orderId))
const orderData = orderDoc.data()
```

#### 2. Заповнення модального вікна

```html
<!-- Номер замовлення -->
<p>Замовлення № <span id="order-number">${order.orderNumber}</span></p>

<!-- Список товарів з фото -->
<div id="products-list">
  <!-- Динамічно заповнюється -->
</div>
```

#### 3. Форма відгуку

```html
<!-- Поля форми -->
- Номер телефону (pre-filled якщо є)
- Оцінка (1-5 зірок)
- Текст відгуку (мінімум 20 символів)
- Завантаження фото (опціонально)
- Кнопка "Надіслати відгук"
```

#### 4. Відправка на сервер

```javascript
// Збереження в Firestore
await addDoc(collection(db, 'reviews'), {
  orderId: currentOrderId,
  phoneNumber: formData.phoneNumber,
  rating: formData.rating,
  text: formData.text,
  photoUrl: uploadedPhotoUrl,
  status: 'pending', // Завжди pending для модерації
  source: 'personalized_review_link',
  createdAt: serverTimestamp()
})
```

---

## 🔧 Backend логіка

### Admin Panel - Відправка SMS

**Розташування:** `admin-site/index.html` lines ~16354-16500

**Функція:** `sendReviewRequest(orderId)`

```javascript
// 1. Загрузити глобальні TurboSMS налаштування
const globalSettings = await getDoc(doc(db, 'settings', 'config'))
const turboSmsToken = globalSettings.turboSmsToken
const senderName = globalSettings.senderName

// 2. Обрати випадковий SMS шаблон (для уникнення спам-фільтрів)
const randomTemplate = reviewSettings.templates[randomIndex]

// 3. Замінити теги в шаблоні
const reviewLink = `https://latiao-snack.com.ua/review?orderId=${orderId}`
let message = replaceTemplateTags(randomTemplate.content, order)
  .replace(/{review_link}/g, reviewLink)

// 4. Надіслати SMS через TurboSMS API
const response = await fetch('https://api.turbosms.ua/message/send.json', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${turboSmsToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    recipients: [order.customer.phone],
    sms: {
      sender: senderName,
      text: message
    }
  })
})

// 5. Оновити замовлення з інформацією про відправку
await updateDoc(doc(db, 'orders', orderId), {
  reviewRequestSentAt: serverTimestamp(),
  reviewRequestTemplateId: randomTemplate.id
})
```

### Template Tags

**Доступні тег заміни:**

```
{customer_name}  → Олена
{order_id}       → #12345
{product_list}   → • (арт:001) Чіпси ×1\n• (арт:002) Сухарики ×2
{review_link}    → https://latiao-snack.com.ua/review?orderId=abc123xyz
```

### Приклад SMS шаблону

```
Привіт, {customer_name}! 👋

Дякуємо за замовлення {order_id}!

Залиште відгук за 30 секунд:
{review_link}

Ваша думка важлива для нас! ⭐⭐⭐⭐⭐
```

**Результат для клієнта:**

```
Привіт, Олена! 👋

Дякуємо за замовлення #12345!

Залиште відгук за 30 секунд:
https://latiao-snack.com.ua/review?orderId=p9x5mZ7qL2vN8hK3jF6w

Ваша думка важлива для нас! ⭐⭐⭐⭐⭐
```

---

## 📱 SMS Інтеграція

### Setup у Admin Panel

1. Відкрийте **"Налаштування відгуків"** (Settings → Review Requests)
2. Натисніть **"+ Додати шаблон"**
3. Введіть вміст шаблону з тегами `{review_link}`
4. Збережіть

### Автоматична відправка

**Розташування:** `admin-site/index.html` lines ~16975-17100

```javascript
// Автоматична відправка проходить кожні 5 хвилин
async function checkAutoReviewRequests() {
  // Отримати завершені замовлення без запиту на відгук
  const completedOrders = await queryOrdersWithoutReviewRequest()
  
  // Для кожного замовлення
  completedOrders.forEach(async (order) => {
    // Надіслати SMS з review_link
    await sendReviewRequestSMS(order)
  })
}

// Запускається щоразу при завантаженні Admin Panel
setInterval(checkAutoReviewRequests, 5 * 60 * 1000)
```

---

## 🔐 Firestore Правила

### Reviews Collection Security

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Reviews collection - allow anonymous writes for reviews
    match /reviews/{document=**} {
      // Anyone can create a review (public form)
      allow create: if 
        request.resource.data.orderId != null &&
        request.resource.data.rating >= 1 && 
        request.resource.data.rating <= 5 &&
        request.resource.data.text.size() >= 20 &&
        request.resource.data.status == 'pending';
      
      // Admin can read/update/delete
      allow read, update, delete: if 
        request.auth.uid in get(/databases/$(database)/documents/settings/config).data.adminUids;
      
      // Creator can read their own review
      allow read: if 
        resource.data.orderId == request.auth.uid;
    }
    
    // Orders collection - allow reading for review page
    match /orders/{orderId} {
      allow read: if true; // Public read for review page
      allow write: if request.auth.uid in get(/databases/$(database)/documents/settings/config).data.adminUids;
    }
  }
}
```

### Settings Collection

```javascript
match /settings/{document=**} {
  // Allow read turboSmsToken only for authenticated users
  allow read: if request.auth != null;
  allow write: if request.auth.uid in get(/databases/$(database)/documents/settings/config).data.adminUids;
}
```

---

## 🧪 Тестування

### Test 1: Генерування посилання

```javascript
// В браузерній консолі
import ReviewSystem from '/js/review-system.js'

const testOrderId = 'p9x5mZ7qL2vN8hK3jF6w'
const link = ReviewSystem.generateReviewLink(testOrderId)
console.log('Generated link:', link)
// Output: https://latiao-snack.com.ua/review?orderId=p9x5mZ7qL2vN8hK3jF6w
```

### Test 2: Заповнення форми

1. Відкрийте браузерну консоль (F12)
2. Вставте URL: `https://latiao-snack.com.ua/review?orderId=YOUR_TEST_ORDER_ID`
3. Перевірте, що:
   - ✅ Модаль відкривається автоматично
   - ✅ Номер замовлення заповнено
   - ✅ Список товарів відображається
   - ✅ В консолі: `✅ Order loaded: YOUR_ID | Customer: ІМ'Я`

### Test 3: Відправка SMS з Admin Panel

1. Перейдіть в **"Запити на відгуки"** (Review Requests)
2. Знайдіть готове замовлення (status: "delivered")
3. Натисніть **"Запит відгуку"** (Send Review Request)
4. Перевірте:
   - ✅ SMS надіслано на номер клієнта
   - ✅ Кнопка змінилась на "Надіслано"
   - ✅ Замовлення оновлено з `reviewRequestSentAt`

### Test 4: Заповнення та відправка відгуку

1. Натискніть посилання з SMS
2. Заповніть форму:
   - Номер телефону: +38 (0XX) XXX-XX-XX
   - Оцінка: 5 зірок
   - Текст: "Чудовий товар, швидка доставка!"
   - Фото: (опціонально)
3. Натисніть "Надіслати відгук"
4. Перевірте:
   - ✅ Показується "Дякуємо за відгук!"
   - ✅ В Firestore створений документ в `reviews`
   - ✅ Замовлення оновлено з `reviewSubmittedAt`

### Test 5: Validation

Спробуйте відправити невалідні дані:

```javascript
// Короткий текст (< 20 символів)
ReviewSystem.validateReviewForm({
  phoneNumber: '+380123456789',
  rating: 5,
  reviewText: 'Добре'
})
// { valid: false, errors: ['Відгук повинен містити щонайменше 20 символів'] }

// Невалідна оцінка
ReviewSystem.validateReviewForm({
  phoneNumber: '+380123456789',
  rating: 10,
  reviewText: 'Дуже довгий текст про товар...'
})
// { valid: false, errors: ['Оцінка повинна бути від 1 до 5 зірок'] }
```

---

## 🚀 Розширення функціональності

### 1. Відправка Email замість SMS

```javascript
// Замініть в sendReviewRequest()
const response = await fetch('/api/send-email', {
  method: 'POST',
  body: JSON.stringify({
    email: order.customer.email,
    subject: 'Залишити відгук про замовлення',
    message: message,
    reviewLink: reviewLink
  })
})
```

### 2. Додання CAPTCHA

```html
<!-- Додайте в review-personalized.html -->
<div id="g-recaptcha-container"></div>

<script src="https://www.google.com/recaptcha/api.js" async defer></script>

<script>
  function onSubmit(token) {
    // Verify token на backend
    const captchaToken = grecaptcha.getResponse()
    // ... send with form
  }
</script>
```

### 3. Gamification - Бонус за відгук

```javascript
// Після успішної відправки відгуку
await updateDoc(doc(db, 'customers', customerId), {
  points: increment(50), // Додати 50 бонусних балів
  reviewCount: increment(1)
})

// Показати повідомлення
showToast('🎉 Ви отримали 50 бонусних балів!')
```

### 4. Статистика відгуків

```javascript
// Додати в Admin Panel
async function getReviewStats() {
  const reviews = await getDocs(
    query(collection(db, 'reviews'), where('status', '==', 'approved'))
  )
  
  const stats = {
    total: reviews.size,
    avg: reviews.docs.reduce((sum, doc) => sum + doc.data().rating, 0) / reviews.size,
    byRating: {
      5: reviews.docs.filter(d => d.data().rating === 5).length,
      4: reviews.docs.filter(d => d.data().rating === 4).length,
      // ...
    }
  }
  
  return stats
}
```

---

## ❓ FAQ

### Q: Чому посилання не працює?
**A:** Перевірте:
1. `orderId` передано правильно в URL
2. Замовлення існує в Firestore з цим ID
3. Замовлення має status = "completed" або "delivered"
4. Firestore правила дозволяють публічне читання collection `orders`

### Q: Де знайти test orderId?
**A:** 
1. Откройте Admin Panel
2. Перейдіть у **"Запити на відгуки"** (Review Requests)
3. Скопіюйте ID будь-якого замовлення зі статусом "Виконано"
4. Вставте в URL: `https://latiao-snack.com.ua/review?orderId=PASTE_HERE`

### Q: Як модератиме відгуки?
**A:**
1. Admin Panel → **"Всі відгуки"** (All Reviews)
2. Фільтр за `status: "pending"`
3. Натискніть "Затвердити" для публікації
4. Натискніть "Відхилити" щоб видалити

### Q: Чи можна змінити дизайн модалі?
**A:** Так! У `review-personalized.html` змініть Tailwind CSS классы:
```html
<!-- Змініть колір -->
<div class="bg-gradient-to-r from-spicy to-orange-500">
  <!-- Змініть на ваш колір -->
</div>
```

### Q: Як отримати報告 про відгуки?
**A:**
```javascript
// Admin Panel - додайте функцію
async function exportReviewsReport() {
  const reviews = await getDocs(collection(db, 'reviews'))
  const csv = reviews.docs.map(doc => {
    const data = doc.data()
    return `${data.orderId},${data.rating},${data.text},${data.createdAt}`
  }).join('\n')
  
  // Завантажити як CSV
  downloadCSV(csv, 'reviews_report.csv')
}
```

### Q: Чи могу я обмежити кількість фотографій?
**A:** Так, обновіть валідацію:
```javascript
if (photoInput.files && photoInput.files[0]) {
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (photoInput.files[0].size > maxSize) {
    alert('Фото повинно бути меншим за 5MB')
    return
  }
}
```

---

## 📊 Структура документів Firestore

### Orders Collection

```javascript
{
  id: "p9x5mZ7qL2vN8hK3jF6w",
  orderNumber: 12345,
  customer: {
    fullName: "Олена Петренко",
    phone: "+380501234567",
    email: "olena@example.com"
  },
  items: [
    {
      id: "001",
      name: "Чіпси Palladium",
      price: 45,
      quantity: 2,
      image: "https://..."
    }
  ],
  status: "delivered",
  createdAt: Timestamp,
  deliveredAt: Timestamp,
  totalPrice: 90,
  
  // Review request fields
  reviewRequestSentAt: Timestamp,
  reviewRequestTemplateId: "template_001",
  reviewRequestResendCount: 0,
  
  // Review submission fields
  reviewSubmittedAt: Timestamp,
  reviewId: "review_doc_id"
}
```

### Reviews Collection

```javascript
{
  id: "review_abc123",
  orderId: "p9x5mZ7qL2vN8hK3jF6w",
  phoneNumber: "+380501234567",
  rating: 5,
  text: "Чудовий товар, швидка доставка!",
  photoUrl: "https://storage.firebase.../reviews/123456_photo.jpg",
  status: "pending", // pending | approved | rejected
  source: "personalized_review_link",
  createdAt: Timestamp,
  
  // Optional
  customerName: "Олена",
  customerEmail: "olena@example.com",
  moderatedAt: Timestamp,
  moderatedBy: "admin_uid"
}
```

---

## 🔗 Посилання

- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [TurboSMS API](https://api.turbosms.ua/doc.html)
- [Review System JS Module](./js/review-system.js)
- [Review Page HTML](./review-personalized.html)
- [Admin Panel Review Settings](../admin-site/index.html#review-requests)

---

**Версія:** 2.3.0  
**Дата:** 2026-02-03  
**Статус:** ✅ Production Ready
