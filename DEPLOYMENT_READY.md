# 🚀 ГОТОВО: Force Cache Refresh System

## ✅ Що було зроблено:

### 1. **HTTP Cache Headers** (firebase.json)
```json
{
  "headers": [
    {
      "source": "**/*.@(js|css|html)",
      "headers": [
        { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" },
        { "key": "Pragma", "value": "no-cache" },
        { "key": "Expires", "value": "0" }
      ]
    }
  ]
}
```

### 2. **Client-Side Cache Clearing**
- ✅ `public-site/js/cache-clear.js` - автоматично чистить кеш при зміні версії
- ✅ `admin-site/js/cache-clear.js` - те саме для адмін панелі
- ✅ Додано до всіх HTML файлів як перший скрипт

### 3. **Automated Scripts**
- ✅ `scripts/cache-bust.sh` - оновлення версій
- ✅ `scripts/deploy-with-cache-bust.sh` - повний деплой
- ✅ `scripts/emergency-cache-clear.sh` - екстрений force refresh
- ✅ `scripts/add-cache-clear.sh` - автоматичне додавання cache-clear.js

---

## 🎯 Як використовувати:

### **Звичайний деплой:**
```bash
bash scripts/deploy-with-cache-bust.sh
```

### **Екстрений force refresh для ВСІХ користувачів:**
```bash
bash scripts/emergency-cache-clear.sh
```

### **Тільки оновити версії (без деплою):**
```bash
bash scripts/cache-bust.sh
```

---

## 🔥 Як це працює:

### 1. **Server-Side (HTTP Headers)**
```
GET /js/app.js
Response:
  Cache-Control: no-cache, no-store, must-revalidate
  Pragma: no-cache
  Expires: 0
```
→ Браузер **НЕ кешує** файли, завжди запитує сервер

### 2. **URL Versioning**
```html
<script src="./js/app.js?v=1770210807216"></script>
```
→ При зміні версії браузер вважає це **новим файлом**

### 3. **Client-Side Cache Clearing**
```javascript
// cache-clear.js виконується першим
const CURRENT_VERSION = '1770210807216';
const storedVersion = localStorage.getItem('latiao_site_version');

if (storedVersion !== CURRENT_VERSION) {
  localStorage.clear();
  sessionStorage.clear();
  caches.delete('all-caches');
  localStorage.setItem('latiao_site_version', CURRENT_VERSION);
}
```
→ При відкритті сайту користувач **автоматично отримує нову версію**

---

## 📊 Моніторинг:

### Перевірити поточну версію на сайті:
```bash
# Публічний сайт
curl https://latiao-snack.com.ua/version.json

# Адмін панель
curl https://office-connect.latiao-snack.com.ua/version.json
```

**Відповідь:**
```json
{
  "version": "1770210807216",
  "date": "20260204-131327",
  "deployed": "2026-02-04T13:13:27Z",
  "commit": "abc123"
}
```

### Перевірити Cache-Control headers:
```bash
curl -I https://latiao-snack.com.ua/js/app.js
```

**Має показувати:**
```
Cache-Control: no-cache, no-store, must-revalidate
Pragma: no-cache
Expires: 0
```

---

## 🧪 Тестування:

### 1. **Локально (перед деплоєм):**
```bash
# Оновити версії
bash scripts/cache-bust.sh

# Перевірити, що version.json створено
cat public-site/version.json
cat admin-site/version.json

# Перевірити, що всі ?v= параметри оновлено
grep "\.js?v=" public-site/index.html | head -3
```

### 2. **Після деплою:**
```bash
# Перевірити версію на продакшені
curl https://latiao-snack.com.ua/version.json

# Перевірити cache headers
curl -I https://latiao-snack.com.ua/js/firebase-init.js

# Відкрити сайт у браузері (DevTools → Network)
# Перевірити, що всі файли мають статус "304 Not Modified" або "200 OK"
```

### 3. **Browser Testing:**
```
1. Відкрити DevTools (F12)
2. Network tab → Disable cache (галочка)
3. Оновити сторінку (F5)
4. Перевірити Headers кожного .js файлу:
   - Cache-Control: no-cache, no-store, must-revalidate
   - ?v=1770210807216 в URL
```

---

## 🛠️ Troubleshooting:

### ❌ Користувачі все ще бачать стару версію?

#### **Рішення 1: Hard Refresh**
```
Windows/Linux: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

#### **Рішення 2: Emergency Cache Clear**
```bash
bash scripts/emergency-cache-clear.sh
```

#### **Рішення 3: Перевірити Deploy**
```bash
# Список деплоїв
firebase hosting:channel:list

# Переглянути поточний deploy
firebase hosting:sites:list
```

### ❌ Скрипт cache-bust.sh не працює?

```bash
# Перевірити права
ls -la scripts/

# Зробити executable
chmod +x scripts/*.sh

# Запустити з verbose
bash -x scripts/cache-bust.sh
```

### ❌ Version не оновлюється в cache-clear.js?

```bash
# Перевірити, що %VERSION% замінено
grep VERSION public-site/js/cache-clear.js

# Має показувати:
# const CURRENT_VERSION = '1770210807216';

# Якщо показує %VERSION%, запустіть:
bash scripts/cache-bust.sh
```

---

## 📋 Checklist для деплою:

- [ ] Запустити `bash scripts/cache-bust.sh`
- [ ] Перевірити, що version.json створено
- [ ] Перевірити, що cache-clear.js оновлено (без %VERSION%)
- [ ] Закомітити зміни в Git
- [ ] Запустити `firebase deploy --only hosting`
- [ ] Перевірити версію на продакшені
- [ ] Перевірити Cache-Control headers
- [ ] Відкрити сайт у браузері та протестувати

---

## 🎉 Результат:

✅ **Всі користувачі отримують нову версію миттєво**  
✅ **Браузери не кешують застарілі файли**  
✅ **Автоматичне версіонування при кожному деплої**  
✅ **Client-side cache clearing при оновленні**  
✅ **Можливість екстреного force refresh**  

---

## 🔗 Корисні команди:

```bash
# Швидкий деплой
bash scripts/deploy-with-cache-bust.sh

# Екстрений force refresh
bash scripts/emergency-cache-clear.sh

# Тільки публічний сайт
bash scripts/cache-bust.sh && firebase deploy --only hosting:main

# Тільки адмін панель
bash scripts/cache-bust.sh && firebase deploy --only hosting:admin-store-latio

# Переглянути логи
firebase hosting:channel:list
firebase hosting:sites:list

# Rollback до попередньої версії
firebase hosting:clone latiao-snack-com-ua:PREVIOUS_RELEASE_ID latiao-snack-com-ua:live
```

---

**Система готова до використання! 🚀**

Для деплою змін просто запустіть:
```bash
bash scripts/deploy-with-cache-bust.sh
```
