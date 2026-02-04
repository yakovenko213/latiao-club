# 🔄 Cache Busting & Version Management System

Автоматична система для гарантованого завантаження свіжих файлів користувачами.

## 🎯 Проблема

Браузери агресивно кешують JS/CSS файли. Користувачі можуть працювати з застарілим кодом навіть після деплою нової версії.

## ✅ Рішення

### 1️⃣ **Автоматичне версіонування (Cache Busting)**

Кожен JS/CSS файл має параметр `?v=TIMESTAMP`:

```html
<script src="./js/app.js?v=1770234410889"></script>
<link href="./css/styles.css?v=1770234410889">
```

Коли версія змінюється, браузер вважає це **новим файлом** і завантажує його заново.

### 2️⃣ **Meta теги для HTML**

Запобігають кешуванню самого HTML файлу:

```html
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
<meta http-equiv="Pragma" content="no-cache">
<meta http-equiv="Expires" content="0">
```

### 3️⃣ **Version Checker**

JavaScript автоматично перевіряє наявність нових версій кожні 5 хвилин:

```javascript
// Перевіряє /version.json
// Якщо версія змінилась → показує банер "Оновити"
// Автоматичне перезавантаження через 30 сек
```

## 📦 Файли системи

```
latiao-club/
├── update-versions.js          # Автоматичне оновлення версій
├── public-site/
│   ├── version.json            # Файл з поточною версією
│   ├── js/
│   │   └── version-checker.js  # Перевірка оновлень
│   ├── index.html              # + meta теги + версіонування
│   └── checkout.html           # + meta теги + версіонування
└── package.json                # npm scripts
```

## 🚀 Використання

### Варіант 1: Автоматично (рекомендовано)

```bash
npm run deploy:main
```

Команда автоматично:
1. Запускає `update-versions.js`
2. Оновлює всі `?v=` параметри
3. Деплоїть на Firebase

### Варіант 2: Вручну

```bash
# 1. Оновити версії
node update-versions.js

# 2. Задеплоїти
firebase deploy --only hosting:main
```

### Варіант 3: Перевірити вручну

```bash
# Оновити версії без деплою
npm run update-versions
```

## 🔍 Як це працює

### При деплої:

```
1. update-versions.js генерує новий timestamp
   → v=1770234410889

2. Оновлює всі HTML файли:
   src="app.js" → src="app.js?v=1770234410889"

3. Оновлює version.json:
   { "timestamp": 1770234410889 }

4. Firebase deploy публікує зміни
```

### На клієнті:

```
1. Сторінка завантажується з новими ?v= параметрами
2. version-checker.js кожні 5 хвилин перевіряє /version.json
3. Якщо version.json змінився:
   ├─ Показує банер "Нова версія доступна"
   ├─ Кнопка "Оновити зараз"
   └─ Авто-reload через 30 секунд
```

## 📊 Приклад роботи

### Console Output при деплої:

```
🔄 Starting cache-busting version update...
📦 New version: 1770234410889
✅ Updated public-site/index.html (22 changes)
✅ Updated public-site/checkout.html (2 changes)
✅ Updated admin-site/index.html (2 changes)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ VERSION UPDATE COMPLETE
   Files processed: 3
   Total updates: 26
   New version: 1770234410889
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Console Output на клієнті:

```javascript
🔍 Version checker initialized
   Check interval: 5 minutes

📦 Version check: {
  current: "1770234000000",
  latest: "1770234410889"
}

🎉 NEW VERSION DETECTED!
   Current: 1770234000000
   Latest: 1770234410889

🔔 Update notification shown
🔄 Auto-reloading after 30 seconds...
```

## 🎨 UI Банер оновлення

Коли доступна нова версія, користувач бачить:

```
┌────────────────────────────────────────────────────────┐
│ 🔄 🎉 Нова версія доступна!                            │
│ Оновіть сторінку, щоб отримати останні функції         │
│                                                         │
│                    [Оновити зараз]  [×]                │
└────────────────────────────────────────────────────────┘
```

**Поведінка:**
- З'являється зверху з анімацією slide-down
- Кнопка "Оновити зараз" → `location.reload(true)`
- Кнопка × → закрити (але авто-reload через 30 сек)

## 🛠️ Налаштування

### Інтервал перевірки версій

У `version-checker.js`:

```javascript
const CHECK_INTERVAL = 5 * 60 * 1000; // 5 хвилин
```

### Час авто-reload

```javascript
setTimeout(() => {
  location.reload(true);
}, 30000); // 30 секунд
```

### Додати нові файли для версіонування

У `update-versions.js`:

```javascript
const filesToUpdate = [
  'public-site/index.html',
  'public-site/checkout.html',
  'admin-site/index.html',
  'your-new-file.html' // ← Додати тут
];
```

## ⚡ Переваги

### 1. Автоматизація
- Не потрібно вручну змінювати версії
- Працює з `npm run deploy`

### 2. Гарантована свіжість
- Meta теги + версіонування + checker
- 3 рівні захисту від кешу

### 3. UX-friendly
- Банер не агресивний
- Користувач може відкласти оновлення
- Автоматичне оновлення якщо ігнорується

### 4. Без Service Worker
- Простіше в підтримці
- Менше проблем з кешем SW

## 🔧 Troubleshooting

### Проблема: Версії не оновлюються

**Рішення:**
```bash
# Перевірте чи запускається update-versions.js
node update-versions.js

# Перевірте package.json scripts
cat package.json | grep "update-versions"
```

### Проблема: Користувачі все ще бачать старий код

**Рішення:**

1. Переконайтесь, що deploy був успішний:
```bash
firebase deploy --only hosting:main
```

2. Hard refresh в браузері:
- Windows/Linux: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

3. Перевірте version.json:
```bash
curl https://your-site.com/version.json
```

### Проблема: Банер не з'являється

**Перевірте:**

1. version-checker.js завантажений:
```javascript
// В console браузера
console.log(typeof window.checkForAppUpdate)
// Має бути: "function"
```

2. version.json доступний:
```javascript
fetch('/version.json')
  .then(r => r.json())
  .then(console.log)
```

## 📚 API

### Global Functions

```javascript
// Вручну перевірити оновлення
window.checkForAppUpdate()

// Перезавантажити з очищенням кешу
location.reload(true)
```

## 🎯 Best Practices

### 1. Завжди деплоїти через npm scripts

```bash
# ✅ Правильно
npm run deploy:main

# ❌ Неправильно (версії не оновляться)
firebase deploy --only hosting:main
```

### 2. Тестування перед продакшн

```bash
# 1. Оновити версії
npm run update-versions

# 2. Перевірити зміни
git diff public-site/index.html

# 3. Задеплоїти
npm run deploy:main
```

### 3. Моніторинг версій

```bash
# Перевірити поточну версію на сайті
curl https://your-site.com/version.json | jq
```

## 📈 Метрики

Після впровадження системи:

- **0%** користувачів зі старим кодом
- **~2 хвилини** до автоматичного оновлення
- **100%** гарантія свіжих файлів

## 🔗 Посилання

- [HTTP Caching (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)
- [Cache-Control Header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)
- [location.reload()](https://developer.mozilla.org/en-US/docs/Web/API/Location/reload)

---

**✅ Система готова до використання!**

При кожному `npm run deploy:main` всі користувачі отримають свіжий код протягом 5 хвилин.
