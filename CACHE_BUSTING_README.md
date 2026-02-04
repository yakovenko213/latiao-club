# 📚 Документація Cache Busting System

## 🎯 Початок роботи:

### ⚡ Швидкий старт (1 хвилина)
[**QUICK_DEPLOY.md**](QUICK_DEPLOY.md) - Одна команда для деплою
```bash
bash scripts/deploy-with-cache-bust.sh
```

### ✅ Checklist для деплою (5 хвилин)
[**DEPLOYMENT_CHECKLIST.md**](DEPLOYMENT_CHECKLIST.md) - Покрокова інструкція перед/під час/після деплою

---

## 📖 Детальна документація:

### 📦 Повне керівництво
[**DEPLOYMENT_READY.md**](DEPLOYMENT_READY.md)
- Що було зроблено
- Як використовувати всі скрипти
- Моніторинг та troubleshooting
- Тестування та перевірка

### 🎨 Архітектура системи
[**CACHE_ARCHITECTURE.md**](CACHE_ARCHITECTURE.md)
- Візуальні діаграми
- Workflow деплою
- Структура файлів
- Troubleshooting flow

### 📋 Технічний summary
[**CACHE_REFRESH_COMPLETE.md**](CACHE_REFRESH_COMPLETE.md)
- Список всіх створених файлів
- Список змінених файлів
- Технічні деталі
- Переваги системи

### 📘 Технічний гайд
[**CACHE_BUSTING_GUIDE.md**](CACHE_BUSTING_GUIDE.md)
- Детальні інструкції
- Ручне version management
- Додаткові команди

---

## 🛠️ Скрипти:

### 🚀 Основні команди:

```bash
# Повний деплой (рекомендовано)
bash scripts/deploy-with-cache-bust.sh

# Екстрений force refresh
bash scripts/emergency-cache-clear.sh

# Тільки оновити версії
bash scripts/cache-bust.sh

# Додати cache-clear.js до нових HTML
bash scripts/add-cache-clear.sh
```

### 📂 Розташування:
- `scripts/cache-bust.sh` - Оновлення версій
- `scripts/deploy-with-cache-bust.sh` - Повний workflow
- `scripts/emergency-cache-clear.sh` - Екстрений деплой
- `scripts/add-cache-clear.sh` - Додавання до HTML

---

## 🔍 Швидка довідка:

### Перевірка версії:
```bash
curl https://latiao-snack.com.ua/version.json
```

### Перевірка cache headers:
```bash
curl -I https://latiao-snack.com.ua/js/firebase-init.js
```

### Історія деплоїв:
```bash
git log --oneline --grep="Cache bust"
```

---

## 📊 Структура документації:

```
📚 CACHE_BUSTING_README.md (ви тут)
   ↓
   ├─→ ⚡ QUICK_DEPLOY.md (швидкий старт)
   │
   ├─→ ✅ DEPLOYMENT_CHECKLIST.md (checklist)
   │
   ├─→ 📦 DEPLOYMENT_READY.md (повне керівництво)
   │
   ├─→ 🎨 CACHE_ARCHITECTURE.md (архітектура)
   │
   ├─→ 📋 CACHE_REFRESH_COMPLETE.md (summary)
   │
   └─→ 📘 CACHE_BUSTING_GUIDE.md (технічний гайд)
```

---

## 🎯 Що читати першим?

### Якщо потрібно швидко задеплоїти:
1. [QUICK_DEPLOY.md](QUICK_DEPLOY.md)
2. [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)

### Якщо потрібно зрозуміти систему:
1. [CACHE_REFRESH_COMPLETE.md](CACHE_REFRESH_COMPLETE.md)
2. [CACHE_ARCHITECTURE.md](CACHE_ARCHITECTURE.md)
3. [DEPLOYMENT_READY.md](DEPLOYMENT_READY.md)

### Якщо щось не працює:
1. [DEPLOYMENT_READY.md](DEPLOYMENT_READY.md) → розділ Troubleshooting
2. [CACHE_ARCHITECTURE.md](CACHE_ARCHITECTURE.md) → Troubleshooting Flow

---

## 🆘 SOS - Швидкі рішення:

### ❌ Користувачі бачать стару версію?
```bash
bash scripts/emergency-cache-clear.sh
```

### ❌ Deploy не працює?
```bash
firebase deploy --only hosting --debug
```

### ❌ Cache headers не застосовуються?
```bash
# Перевірити firebase.json
cat firebase.json | grep -A 10 "headers"

# Повторний deploy
firebase deploy --only hosting
```

---

## 📞 Контакти:

- Firebase Console: https://console.firebase.google.com/
- Git Repository: `/workspaces/latiao-club`
- Scripts: `/workspaces/latiao-club/scripts/`

---

**Готово до використання! 🚀**

Починайте з [QUICK_DEPLOY.md](QUICK_DEPLOY.md) для швидкого деплою!
