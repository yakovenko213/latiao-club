# ✅ Deployment Checklist

## 🚀 Перед деплоєм:

- [ ] Всі зміни протестовано локально
- [ ] Перевірено, що немає помилок в консолі
- [ ] Firebase CLI встановлено (`firebase --version`)
- [ ] Авторизовано в Firebase (`firebase login`)
- [ ] Перевірено поточний проєкт (`firebase use`)

---

## 📦 Процес деплою:

### **Варіант 1: Автоматичний (рекомендовано)**
```bash
bash scripts/deploy-with-cache-bust.sh
```

- [ ] Скрипт запущено
- [ ] Версії оновлено (показує VERSION: xxxxx)
- [ ] Git commit створено (або пропущено)
- [ ] Firebase deploy запущено
- [ ] Deploy завершено успішно

### **Варіант 2: Ручний**
```bash
# 1. Оновити версії
bash scripts/cache-bust.sh

# 2. Перевірити зміни
git status
git diff

# 3. Закомітити
git add .
git commit -m "Cache bust: $(date +%Y-%m-%d)"
git push

# 4. Деплоїти
firebase deploy --only hosting
```

---

## 🧪 Після деплою:

### **1. Перевірка версії**
```bash
curl https://latiao-snack.com.ua/version.json
curl https://office-connect.latiao-snack.com.ua/version.json
```

- [ ] Версія відповідає щойно задеплоєній
- [ ] Дата deploy актуальна
- [ ] Git commit відповідає останньому

### **2. Перевірка cache headers**
```bash
curl -I https://latiao-snack.com.ua/js/firebase-init.js
```

- [ ] `Cache-Control: no-cache, no-store, must-revalidate`
- [ ] `Pragma: no-cache`
- [ ] `Expires: 0`

### **3. Browser Testing**
- [ ] Відкрити сайт у браузері
- [ ] F12 → Console → Перевірити на помилки
- [ ] F12 → Network → Перевірити Headers JS файлів
- [ ] F12 → Application → Local Storage → Перевірити версію
- [ ] Hard refresh (Ctrl+Shift+R) → Все працює

### **4. Функціональне тестування**
- [ ] Публічний сайт працює
- [ ] Адмін панель працює
- [ ] Нові зміни видимі
- [ ] Всі функції працюють коректно

---

## 🔥 Якщо щось не так:

### **Користувачі бачать стару версію**
```bash
# Екстрений force refresh
bash scripts/emergency-cache-clear.sh
```

### **Deploy failed**
```bash
# Перевірити логи
firebase deploy --only hosting --debug

# Перевірити firebase.json
cat firebase.json | grep -A 10 "headers"

# Rollback до попередньої версії
firebase hosting:clone SOURCE:RELEASE_ID TARGET:live
```

### **Cache headers не застосовуються**
```bash
# Перевірити firebase.json
cat firebase.json

# Повторний deploy
firebase deploy --only hosting
```

---

## 📊 Моніторинг:

### **Щоденна перевірка**
- [ ] Перевірити версію на сайті
- [ ] Перевірити логи Firebase Console
- [ ] Перевірити відгуки користувачів

### **Після важливих оновлень**
- [ ] Перевірити через 5 хвилин після деплою
- [ ] Перевірити на різних пристроях
- [ ] Попросити колег перевірити

---

## 🎯 Quick Commands:

```bash
# Перевірити поточну версію
cat public-site/version.json

# Перевірити версію на продакшені
curl https://latiao-snack.com.ua/version.json

# Перевірити cache headers
curl -I https://latiao-snack.com.ua/js/firebase-init.js | grep -i cache

# Подивитись історію деплоїв
git log --oneline --grep="Cache bust" | head -5

# Список Firebase проєктів
firebase projects:list

# Поточний проєкт
firebase use

# Переключити проєкт
firebase use latiao-snack

# Переглянути hosting targets
firebase target --project latiao-snack
```

---

## ✅ Фінальна перевірка:

- [ ] Всі користувачі бачать нову версію
- [ ] Немає помилок в консолі
- [ ] Всі функції працюють
- [ ] Cache headers коректні
- [ ] version.json актуальний
- [ ] Git history чистий

---

**Готово! 🎉**

Якщо всі пункти виконано — деплой успішний!
