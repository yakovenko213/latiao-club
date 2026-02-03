# Quick Testing Guide 🧪

## Test the Settings Feature

### Method 1: Local Testing
```bash
# Open the admin panel HTML file in browser
cd /workspaces/latiao-club/admin-site
# Then open index.html in browser
```

### Method 2: Firebase Hosting (Already Deployed)
The admin site is hosted at: `admin-store-latio.web.app`

## Step-by-Step Test Procedure

### 1️⃣ Login to Admin Panel
- Navigate to admin panel
- Login with admin credentials

### 2️⃣ Navigate to Review Requests
- Click **"Reviews"** in sidebar
- Click **"Запит відгуків"** tab

### 3️⃣ Find Settings Button
Look for the **⚙️ Settings icon** next to the refresh button in the header

### 4️⃣ Test Settings Modal

#### A. Open Modal
- Click settings icon
- Modal should appear with:
  - Gray overlay
  - White modal box
  - Two colored sections (blue and purple)

#### B. Test Templates Section (Blue)
1. Type in "Новий шаблон" textarea:
   ```
   Привіт, {customer_name}! Дякуємо за покупку. Замовлення {order_id} виконано! 🎉
   ```
2. Click "Додати" button
3. Template should appear in list below
4. Click trash icon to delete - confirm dialog appears
5. Confirm deletion - template removed

#### C. Test Automation Section (Purple)
1. Click toggle switch - should turn purple
2. Timing inputs become active (not grayed out)
3. Change "Днів" to 2
4. Change "Годин" to 6
5. Preview text updates to "2 дні 6 годин"
6. Click toggle again - turns gray, inputs disabled

#### D. Save Settings
1. Click "Зберегти налаштування" button
2. Toast notification: "Налаштування збережено успішно"
3. Modal closes

#### E. Verify Persistence
1. Refresh page
2. Open settings modal again
3. Your templates should still be there
4. Automation settings preserved

### 5️⃣ Test in Firestore Console

Open Firebase Console → Firestore Database

Look for document: `settings/review_automation`

Should contain:
```json
{
  "templates": [
    {
      "id": "1738608000000",
      "text": "Your template text with {customer_name}",
      "createdAt": "2026-02-03T..."
    }
  ],
  "automation": {
    "enabled": true,
    "days": 2,
    "hours": 6
  },
  "updatedAt": "timestamp"
}
```

## Expected Results ✅

### Visual Checks
- ✅ Settings button visible and clickable
- ✅ Modal centered and properly styled
- ✅ Icons render (Lucide)
- ✅ Colors match theme (orange/blue/purple)
- ✅ Buttons have hover effects
- ✅ Modal can be closed (X button or Cancel)

### Functional Checks
- ✅ Templates can be added
- ✅ Templates can be deleted
- ✅ Toggle switches automation on/off
- ✅ Inputs update preview text
- ✅ Save button stores to Firestore
- ✅ Settings load on modal open
- ✅ Toast notifications appear

### Data Integrity
- ✅ No errors in console
- ✅ Existing order functions work
- ✅ Manual SMS sending unchanged
- ✅ No breaking changes

## Common Issues & Solutions

### Issue 1: Modal doesn't open
**Solution**: Check browser console for errors, verify Firebase connection

### Issue 2: Templates don't save
**Solution**: 
- Check Firestore rules allow write to `settings/review_automation`
- Verify authentication

### Issue 3: Icons don't render
**Solution**: Ensure Lucide is loaded, check network tab

### Issue 4: Toggle doesn't work
**Solution**: Clear browser cache, check JavaScript errors

## Screenshots to Take 📸

1. Settings button in header
2. Modal opened (full view)
3. Templates section with added template
4. Automation section with toggle ON
5. Firestore document showing saved data

## Next Steps After Testing

If all tests pass:
- ✅ Feature is ready for production
- ✅ Can deploy to live site
- ✅ Document for team

If issues found:
- 📝 Note specific error messages
- 🔍 Check browser console
- 🐛 Debug using browser dev tools

---

**Testing Duration**: ~10 minutes  
**Difficulty**: Easy  
**Prerequisites**: Admin access to panel
