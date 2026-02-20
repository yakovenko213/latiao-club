# 🚀 Firebase Emulators для GitHub Codespaces

Цей файл містить повну інструкцію щодо налаштування та запуску Firebase емуляторів в середовищі GitHub Codespaces.

## 🎯 Огляд 

В GitHub Codespaces ваший сайт працює на порту 5000 та має динамічні URL типу:
```
https://friendly-space-memory-wr5pq6gwq9rc5x95-5000.app.github.dev
```

Емулятори повинні працювати на інших портах і бути доступні через GitHub proxy систему:
- **Frontend (5000)**: `*-5000.app.github.dev`
- **Firestore Emulator (8080)**: `*-8080.app.github.dev` 
- **Auth Emulator (9099)**: `*-9099.app.github.dev`
- **Functions Emulator (5001)**: `*-5001.app.github.dev`

## ⚡ Швидкий Запуск

1. **Запустіть емулятори з правильним хостом та emulator security rules:**
```bash
firebase emulators:start --host 0.0.0.0
```
   ℹ️ **Emulator security rules** automatically loaded from `firestore-emulator.rules` (allows all operations for testing)

2. **Переконайтеся що порти forwarded:**
   - Всі порти (5000, 8080, 9099, 5001) повинні автоматично з'явитись в Ports секції
   - Якщо ні, додайте їх вручну в VS Code Ports panel

3. **Відкрийте сайт:**
   ```bash
   cd public-site && python3 -m http.server 5000
   ```

4. **Протестуйте race condition fix:**
   - Відкрийте: `/test-race-condition-fix.html`  
   - Перевірте що всі 5 steps проходять успішно

5. **Відкрийте frontend URL в браузері**
   - Натисніть на forwarded port 5000 в Ports panel
   - Або запустіть: `$BROWSER https://$(echo $CODESPACE_NAME)-5000.app.github.dev`

## 🔧 Технічні Деталі

### Dynamic Proxy Bridge
Код `cashback-config.js` автоматично виявляє Codespaces середовище:

```javascript
// Виявлення Codespaces
const isCodespace = window.location.hostname.includes('github.dev');

if (isCodespace) {
    // Конвертація URL Dynamic Proxy Bridge
    const firestoreHost = currentHostname.replace('-5000', '-8080');
    const authHost = currentHostname.replace('-5000', '-9099');
    
    // З'єднання через HTTPS (GitHub proxy)
    connectFirestoreEmulator(db, firestoreHost, 443, true);
    connectAuthEmulator(auth, `https://${authHost}`);
}
```

### Bypass Domain Security
Domain validation оновлено для підтримки GitHub Codespaces:

```javascript
// Автоматично дозволяє *.github.dev URLs
if (currentDomain.includes('github.dev')) {
    return true; // Bypass security для development
}
```

## 🐛 Troubleshooting

### Помилка: Emulator Connection Failed
**Причина:** Порти не forwarded або емулятори не запущені

**Рішення:**
1. Перевірте `firebase emulators:start --host 0.0.0.0`
2. Переконайтеся що всі порти visible в Ports panel
3. Restart emulators та refresh браузер

### Помилка: CORS Issues
**Причина:** GitHub proxy може блокувати CORS

**Рішення:**
1. Переконайтеся що використовуєте HTTPS URLs для емуляторів
2. Додайте header: `"Access-Control-Allow-Origin": "*"` в emulator налаштуваннях

### Помилка: Domain Validation Failed  
**Причина:** Domain validation не розпізнає Codespaces URL

**Рішення:**
- Увімкніть development mode: `window.__consoleMode = 'development'`
- Переконайтеся що URL містить `github.dev`

## 📝 Команди Firebase CLI

### Запуск всіх емуляторів
```bash
firebase emulators:start --host 0.0.0.0
```

### Запуск окремих емуляторів
```bash
firebase emulators:start --only firestore --host 0.0.0.0
firebase emulators:start --only auth --host 0.0.0.0
firebase emulators:start --only functions --host 0.0.0.0
```

### Емулятори з seed data
```bash
firebase emulators:start --host 0.0.0.0 --import=./emulator-data
```

## 🎉 Перевірка Успішного Підключення

Коли все працює правильно, ви побачите в browser console:

```
🔧 EMULATOR MODE (CODESPACES): Connecting to Firebase Emulators...
✅ Firestore Emulator connected: https://friendly-*-8080.app.github.dev
✅ Auth Emulator connected: https://friendly-*-9099.app.github.dev  
✅ Functions Emulator connected: https://friendly-*-5001.app.github.dev
🎉 All emulators connected! Safe to test in development.
```

## 🔐 Security Notes

- Domain validation автоматично bypass для `*.github.dev` URLs
- Це працює ТІЛЬКИ в development mode
- Production environment залишається захищеним
- Emulator з'єднання використовують HTTPS через GitHub proxy

## 📚 Додаткові Ресурси

- [Firebase Emulators Guide](https://firebase.google.com/docs/emulator-suite)
- [GitHub Codespaces Ports Documentation](https://docs.github.com/en/codespaces/developing-in-codespaces/forwarding-ports-in-your-codespace)
- [Firebase v10 Migration Guide](https://firebase.google.com/docs/web/modular-upgrade)