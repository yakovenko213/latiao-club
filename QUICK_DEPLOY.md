# ⚡ Quick Start: Deploy з Cache Busting

## 🚀 Один командою:

```bash
bash scripts/deploy-with-cache-bust.sh
```

**Готово!** Всі користувачі отримають нову версію миттєво.

---

## 🔥 Екстрений Force Refresh:

```bash
bash scripts/emergency-cache-clear.sh
```

Використовуйте, коли потрібно **негайно** оновити всіх користувачів.

---

## 📋 Що відбувається під капотом:

1. **Генерується нова версія** (timestamp)
2. **Оновлюються всі `?v=` параметри** в HTML
3. **Оновлюється cache-clear.js** (client-side clearing)
4. **Створюються version.json** файли
5. **Git commit** (опціонально)
6. **Firebase deploy**

---

## ✅ Результат:

- ✅ Всі `.js` і `.css` файли мають **нову версію**
- ✅ HTTP headers: `Cache-Control: no-cache`
- ✅ Client-side автоматично **чистить кеш**
- ✅ Користувачі **миттєво** бачать зміни

---

## 📊 Перевірка:

```bash
# Версія на сайті
curl https://latiao-snack.com.ua/version.json

# Cache headers
curl -I https://latiao-snack.com.ua/js/firebase-init.js
```

---

## 🛠️ Інші команди:

```bash
# Тільки оновити версії (без деплою)
bash scripts/cache-bust.sh

# Додати cache-clear.js до нових HTML
bash scripts/add-cache-clear.sh

# Тільки публічний сайт
firebase deploy --only hosting:main

# Тільки адмін панель
firebase deploy --only hosting:admin-store-latio
```

---

**Все готово! 🎉**

Для детальної документації дивіться: [DEPLOYMENT_READY.md](DEPLOYMENT_READY.md)
