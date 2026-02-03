# 🔧 Налаштування Custom Domain для Admin Panel

## 📊 Поточний статус

### ✅ Що працює зараз:
- **Default URL**: https://admin-store-latio.web.app
- **Версія**: 2.1.0-PERSONALIZED-REVIEWS
- **Build Date**: 2026-02-03 15:30:00 UTC
- **Firebase Project**: my-magazin-81c96

### ❌ Що не працює:
- **Custom Domain**: office-connect.latiao-snack.com.ua (НЕ налаштований)

---

## 🎯 Рішення проблеми

### Варіант 1: Налаштувати Custom Domain через Firebase Console

1. **Відкрийте Firebase Console**:
   ```
   https://console.firebase.google.com/project/my-magazin-81c96/hosting
   ```

2. **Перейдіть в розділ Hosting**:
   - Оберіть сайт `admin-store-latio`
   - Натисніть "Add custom domain"

3. **Додайте домен**:
   ```
   office-connect.latiao-snack.com.ua
   ```

4. **Firebase дасть вам DNS записи**:
   ```
   Type: A
   Name: office-connect
   Value: 151.101.1.195 (приклад)
   
   Type: A  
   Name: office-connect
   Value: 151.101.65.195 (приклад)
   ```

5. **Додайте DNS записи в панелі управління доменом**:
   - Якщо використовуєте Cloudflare: Dashboard → DNS → Add Record
   - Якщо інший провайдер: знайдіть розділ DNS Management

6. **Дочекайтеся верифікації** (може зайняти до 24 годин)

---

### Варіант 2: Використовувати Default URL (швидше)

Якщо потрібно швидко перевірити зміни:

1. **Відкрийте**: https://admin-store-latio.web.app
2. **Зробіть Hard Refresh**:
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`
3. **Відкрийте Console** (F12):
   ```
   🚀 ================================
   🚀 ADMIN PANEL VERSION: 2.1.0-PERSONALIZED-REVIEWS
   🚀 BUILD DATE: 2026-02-03 15:30:00 UTC
   🚀 Domain: admin-store-latio.web.app
   🚀 ================================
   ```

4. **Перевірте наявність `{review_link}`**:
   - Перейдіть в "Налаштування відгуків"
   - Створіть/редагуйте SMS шаблон
   - Використовуйте `{review_link}` плейсхолдер

---

### Варіант 3: Перевірити поточні Custom Domains

```bash
firebase hosting:sites:get admin-store-latio
```

Якщо домен вже налаштований, ви побачите:
```
Custom domains:
- office-connect.latiao-snack.com.ua
```

Якщо НЕ налаштований:
```
Custom domains: (none)
```

---

## 🧪 Як перевірити, що нова версія завантажилась

### 1. Відкрийте браузер в режимі Incognito
```
Ctrl + Shift + N (Chrome/Edge)
Cmd + Shift + N (Safari/Firefox)
```

### 2. Відкрийте Admin Panel
```
https://admin-store-latio.web.app
```

### 3. Натисніть F12 → Console
Ви маєте побачити:
```javascript
🚀 ================================
🚀 ADMIN PANEL VERSION: 2.1.0-PERSONALIZED-REVIEWS
🚀 BUILD DATE: 2026-02-03 15:30:00 UTC
🚀 Domain: admin-store-latio.web.app
🚀 ================================
```

### 4. Перевірте функцію replaceTemplateTags
В розділі "Налаштування відгуків" створіть шаблон:
```
Привіт, {customer_name}!
Залиште відгук: {review_link}
```

Збережіть і надішліть тестове SMS. В логах має з'явитись:
```
https://latiao-snack.com.ua/review?orderId=ABC123XYZ
```

---

## 🔄 Cache Busting стратегії

### Проблема
Firebase Hosting використовує агресивне кешування:
```json
{
  "source": "**/*.html",
  "headers": [{
    "key": "Cache-Control",
    "value": "public, max-age=3600, must-revalidate"
  }]
}
```

### Рішення 1: Meta Tags (вже є в index.html)
```html
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
<meta http-equiv="Pragma" content="no-cache">
<meta http-equiv="Expires" content="0">
```

### Рішення 2: Оновлювати VERSION в коді
Кожного разу після змін:
```javascript
const ADMIN_PANEL_VERSION = '2.2.0-NEXT-FEATURE' // Збільшуйте версію
const BUILD_DATE = 'YYYY-MM-DD HH:MM:SS UTC'     // Оновлюйте дату
```

### Рішення 3: Firebase Cache Invalidation
```bash
# Після деплою
firebase hosting:clone admin-store-latio:live admin-store-latio:backup
```

---

## 🚀 Deploy Checklist

Кожного разу перед деплоєм:

- [ ] Оновити `ADMIN_PANEL_VERSION` в admin-site/index.html
- [ ] Оновити `BUILD_DATE` в admin-site/index.html
- [ ] Зберегти зміни: `git add . && git commit -m "feat: ..."`
- [ ] Задеплоїти: `firebase deploy --only hosting:admin-store-latio`
- [ ] Відкрити в Incognito: https://admin-store-latio.web.app
- [ ] Перевірити Console: версія має співпадати
- [ ] Протестувати нову функцію

---

## 📝 Налаштування Custom Domain через CLI

Якщо хочете автоматизувати:

```bash
# 1. Додати custom domain
firebase hosting:sites:create office-connect --project my-magazin-81c96

# 2. Налаштувати custom domain для admin-store-latio
# (поки що Firebase CLI не підтримує цю команду напряму)
# Треба робити через Console: https://console.firebase.google.com
```

---

## 🔍 Troubleshooting

### Проблема: "Версія не оновилась після деплою"
**Рішення**:
1. Очистити кеш браузера: Settings → Privacy → Clear browsing data
2. Відкрити в Incognito mode
3. Hard refresh: Ctrl+Shift+R

### Проблема: "office-connect.latiao-snack.com.ua не відкривається"
**Рішення**:
1. Перевірити DNS: `nslookup office-connect.latiao-snack.com.ua`
2. Перевірити Firebase Console → Hosting → Custom domains
3. Можливо, домен НЕ налаштований (потрібно додати через Console)

### Проблема: "{review_link} не замінюється"
**Рішення**:
1. Перевірити Console: має бути версія 2.1.0+
2. Перевірити код: функція `replaceTemplateTags` має містити `.replace(/{review_link}/g, reviewLink)`
3. Hard refresh сторінки

### Проблема: "Працює на admin-store-latio.web.app, але не на custom domain"
**Рішення**:
- Custom domain і default URL завжди синхронізуються автоматично
- Якщо custom domain не працює, це DNS проблема (не Firebase)
- Використовуйте admin-store-latio.web.app до налаштування DNS

---

## 📚 Корисні команди

```bash
# Перевірити всі hosting sites
firebase hosting:sites:list

# Деплой тільки admin panel
firebase deploy --only hosting:admin-store-latio

# Деплой всього
firebase deploy --only hosting

# Перевірити Firebase login
firebase login

# Змінити проєкт
firebase use my-magazin-81c96

# Переглянути поточний проєкт
firebase projects:list
```

---

## ✅ Підсумок

1. **Код оновлено** ✅
   - `replaceTemplateTags()` тепер підтримує `{review_link}`
   - Додано версійний лог (2.1.0-PERSONALIZED-REVIEWS)

2. **Деплой виконано** ✅
   - Admin Panel оновлено на https://admin-store-latio.web.app
   - Файли завантажені: 40 files

3. **Перевірка**:
   - Відкрийте https://admin-store-latio.web.app в Incognito
   - Перевірте Console → версія має бути 2.1.0
   - Протестуйте `{review_link}` в SMS шаблоні

4. **Custom Domain** (якщо потрібно):
   - office-connect.latiao-snack.com.ua НЕ налаштований
   - Додайте через Firebase Console → Hosting → Add custom domain
   - Або користуйтесь admin-store-latio.web.app

---

**Створено**: 2026-02-03  
**Версія панелі**: 2.1.0-PERSONALIZED-REVIEWS  
**Firebase Project**: my-magazin-81c96
