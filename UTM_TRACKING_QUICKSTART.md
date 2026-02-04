# 🎯 UTM TRACKING - QUICK START GUIDE

## ⚡ ШВИДКИЙ СТАРТ

### Для маркетологів:

**Створення UTM-посилань:**

```
https://latiao-snack.com.ua/?utm_source=ДЖЕРЕЛО&utm_medium=КАНАЛ&utm_campaign=КАМПАНІЯ
```

**Приклади:**

📘 Facebook:
```
https://latiao-snack.com.ua/?utm_source=facebook&utm_medium=cpc&utm_campaign=winter_sale
```

📸 Instagram Stories:
```
https://latiao-snack.com.ua/?utm_source=instagram&utm_medium=story&utm_campaign=new_product
```

🎵 TikTok:
```
https://latiao-snack.com.ua/?utm_source=tiktok&utm_medium=video&utm_campaign=viral_challenge
```

### Для адміністраторів:

**Перегляд джерела замовлення:**

1. Відкрити замовлення в адмін-панелі
2. Натиснути "Деталі замовлення" (👁️)
3. Прокрутити до розділу "🎯 Джерело замовлення"
4. Переглянути UTM-параметри

**Що означають значки:**

- 🌿 **Органіка** = Клієнт прийшов без реклами
- ✅ **Платна реклама** = Клієнт прийшов з UTM-посилання

---

## 📊 UTM ПАРАМЕТРИ

| Параметр | Що означає | Приклад |
|----------|------------|---------|
| `utm_source` | Звідки прийшов | `facebook`, `instagram`, `tiktok` |
| `utm_medium` | Тип маркетингу | `cpc`, `story`, `reels`, `banner` |
| `utm_campaign` | Назва кампанії | `winter_sale`, `new_product` |
| `utm_content` | Варіант креативу | `video_01`, `image_red` |
| `utm_term` | Ключове слово | `spicy_snacks` (для пошукових оголошень) |

---

## 🔧 ТЕХНІЧНІ ДЕТАЛІ

**Файли:**
- `/public-site/js/utm-tracker.js` - скрипт відстеження
- `/public-site/checkout.html` - інтеграція з оформленням
- `/admin-site/index.html` - відображення в адмін-панелі

**Firestore структура:**
```javascript
orders/{orderId}/utm_data: {
  source: "facebook",
  medium: "cpc",
  campaign: "winter_sale",
  capturedAt: "2026-02-04T10:30:00Z"
}
```

**Термін зберігання:** 30 днів у браузері, назавжди у Firestore

---

## ✅ ТЕСТУВАННЯ

**Перевірка роботи:**

1. Відкрити у браузері:
   ```
   https://latiao-snack.com.ua/?utm_source=test&utm_medium=test&utm_campaign=test
   ```

2. У консолі браузера (F12):
   ```javascript
   UTMTracker.debug()
   ```

3. Зробити тестове замовлення

4. Перевірити в адмін-панелі наявність UTM-даних

---

## 📞 ПІДТРИМКА

**Питання?** Звертайтеся до команди розробки.

**Дата впровадження:** 04.02.2026  
**Версія:** 1.0
