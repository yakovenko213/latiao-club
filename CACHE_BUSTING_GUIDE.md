# 🚀 Cache Busting & Force Refresh Guide

## ✅ Що було зроблено:

### 1. **Оновлено firebase.json**
- HTML файли: `no-cache, no-store, must-revalidate`
- JS/CSS файли: `no-cache, must-revalidate` 
- Додано заголовки `Pragma: no-cache` та `Expires: 0`

### 2. **Створено скрипти автоматизації**

#### `scripts/cache-bust.sh` - Оновлення версій
```bash
bash scripts/cache-bust.sh
```
Автоматично:
- Генерує timestamp версію
- Оновлює всі `?v=` параметри в HTML
- Створює `version.json` файли

#### `scripts/deploy-with-cache-bust.sh` - Повний деплой
```bash
bash scripts/deploy-with-cache-bust.sh
```
Виконує:
1. Cache busting
2. Git commit (опціонально)
3. Firebase deploy

### 3. **Додано client-side cache clearing**
- `public-site/js/cache-clear.js`
- `admin-site/js/cache-clear.js`

---

## 🎯 Як використовувати:

### Швидкий деплой з cache busting:
```bash
bash scripts/deploy-with-cache-bust.sh
```

### Або покроково:

```bash
# 1. Оновити версії
bash scripts/cache-bust.sh

# 2. Закомітити зміни
git add .
git commit -m "Cache bust: $(date +%Y-%m-%d)"
git push

# 3. Задеплоїти
firebase deploy --only hosting
```

---

## 📋 Як додати версіонування до нового файлу:

### У HTML файлах:
```html
<!-- Додайте ?v=0 до всіх script і style тегів -->
<script src="./js/myfile.js?v=0"></script>
<link href="./css/style.css?v=0" rel="stylesheet">
```

Скрипт `cache-bust.sh` автоматично замінить `?v=0` на актуальну версію.

---

## 🔥 Екстрений force refresh для всіх користувачів:

### Варіант 1: Автоматичний (рекомендовано)
```bash
bash scripts/deploy-with-cache-bust.sh
```

### Варіант 2: Ручний
1. Відкрийте кожен HTML файл
2. Змініть версію вручну:
   ```html
   <script src="./js/app.js?v=20260204"></script>
   ```
3. Деплой:
   ```bash
   firebase deploy --only hosting
   ```

### Варіант 3: Через client-side script
Додайте до `<head>` у HTML:
```html
<script src="./js/cache-clear.js?v=1"></script>
```

---

## 🛠️ Troubleshooting:

### Користувачі все ще бачать стару версію?

1. **Hard refresh:**
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

2. **Очистити кеш браузера:**
   - Chrome: Settings → Privacy → Clear browsing data
   - Firefox: Options → Privacy → Clear Data

3. **Перевірити Deploy:**
   ```bash
   firebase hosting:channel:list
   ```

4. **Перевірити версію на сайті:**
   ```bash
   curl -I https://latiao-snack.com.ua
   ```
   Має показувати: `Cache-Control: no-cache, no-store, must-revalidate`

---

## 📊 Моніторинг версій:

Перевірити поточну версію:
```bash
# Публічний сайт
curl https://latiao-snack.com.ua/version.json

# Адмін панель  
curl https://office-connect.latiao-snack.com.ua/version.json
```

Відповідь:
```json
{
  "version": "1738665600000",
  "date": "20260204-120000",
  "deployed": "2026-02-04T12:00:00Z",
  "commit": "abc123"
}
```

---

## ⚡ Швидкі команди:

```bash
# Деплой тільки публічного сайту з cache bust
bash scripts/cache-bust.sh && firebase deploy --only hosting:main

# Деплой тільки адмін панелі з cache bust
bash scripts/cache-bust.sh && firebase deploy --only hosting:admin-store-latio

# Деплой обох з cache bust
bash scripts/deploy-with-cache-bust.sh
```

---

## 🎉 Результат:

✅ Всі користувачі отримують нову версію миттєво  
✅ Браузери не кешують застарілі файли  
✅ Автоматичне версіонування при кожному деплої  
✅ Можливість відкату до попередньої версії через Git  

---

**Готово до використання! 🚀**
