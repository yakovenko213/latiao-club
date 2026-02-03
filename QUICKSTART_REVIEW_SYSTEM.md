# ⚡ Quick Start: Personalized Review System

## 🎯 What's New

Added personalized review link functionality to admin panel + customer review page integration.

---

## 🚀 Quick Usage

### For Admins:

**Step 1: Open Settings**
```
Reviews → "Запит відгуків" → Click ⚙️ icon
```

**Step 2: Find New Section**
- Scroll to **"Персоналізоване посилання"** (green section at bottom)
- Toggle is ON by default ✅

**Step 3: Use in Templates**
Add to your SMS template:
```
Привіт, {customer_name}! 🌶️
Залиште відгук: {review_link}
```

**Step 4: Save**
- Click "Зберегти налаштування"

**Done!** SMS will now include personalized review URLs.

---

## 📱 For Customers:

**Customer Experience:**
1. Receive SMS with link like:
   ```
   https://latiao-snack.com.ua/review?orderId=abc123
   ```

2. Click link → Page loads their order automatically

3. Modal appears with:
   - Order summary (items they bought)
   - Star rating (1-5)
   - Review text field
   - Photo upload option

4. Submit → Done!

---

## 🔗 New Placeholder

| Placeholder | Result |
|-------------|--------|
| `{review_link}` | `https://latiao-snack.com.ua/review?orderId=...` |

Combines with existing:
- `{customer_name}` → "Іван"
- `{order_id}` → "abc123"

---

## 📍 Where to Find

### Admin Panel
**File**: `admin-site/index.html`
- **Line ~3000**: Review link toggle UI
- **Line ~17392**: `generateReviewLink()` function
- **Line ~17398**: `toggleReviewLink()` function
- **Line ~17440**: Template processing with placeholders

### Customer Page
**File**: `public-site/review.html`
- Already implemented! ✅
- Supports `?orderId=...` parameter
- Auto-loads order and shows modal

---

## 🧪 Test It

### Quick Test:
1. Get any order ID from Firestore
2. Open: `https://latiao-snack.com.ua/review?orderId=[YOUR_ORDER_ID]`
3. Should show order details + review form

### Full Flow Test:
1. Admin creates template with `{review_link}`
2. Admin "sends" SMS (WhatsApp opens with link)
3. Copy link and open in browser
4. Fill review form
5. Check Firestore `reviews` collection

---

## 💾 Firestore Changes

### Updated Document:
```javascript
settings/review_automation
{
  // ... existing fields ...
  reviewLink: {
    enabled: true,
    baseUrl: 'https://latiao-snack.com.ua/review'
  }
}
```

### New Reviews:
```javascript
reviews/[auto-id]
{
  orderId: "abc123",
  rating: 5,
  text: "Review text",
  photoUrl: "...",
  status: "pending",
  source: "review_link"  // ← Identifies link-based reviews
}
```

---

## ✅ Key Functions

```javascript
// Generate review link for any order
generateReviewLink(orderId) 
// Returns: "https://latiao-snack.com.ua/review?orderId=abc123"

// Toggle link feature on/off
toggleReviewLink()

// Process template with all placeholders
processTemplateWithPlaceholders(template, order)
```

---

## 🎨 UI Changes

**New Section in Settings Modal:**
```
┌──────────────────────────────────────┐
│ 🔗 Персоналізоване посилання (Green) │
│                                      │
│ [ON] Include review link in SMS      │
│                                      │
│ Use {review_link} in templates       │
│                                      │
│ Example: https://latiao-snack...     │
└──────────────────────────────────────┘
```

---

## 🔄 SMS Flow

**Before:**
```
"Дякуємо за покупку! Залиште відгук на сайті."
```

**After (with {review_link}):**
```
"Дякуємо за покупку! 
Залишити відгук: https://latiao-snack.com.ua/review?orderId=abc123"
```

---

## 📊 Benefits

✅ **One-click** review submission  
✅ **Pre-filled** order data  
✅ **Higher conversion** rate  
✅ **Easy for customers**  
✅ **No manual order lookup**

---

## 🚀 Deploy

```bash
cd /workspaces/latiao-club
firebase deploy --only hosting
```

---

## 📚 Full Documentation

- [PERSONALIZED_REVIEW_SYSTEM.md](PERSONALIZED_REVIEW_SYSTEM.md) - Complete guide
- [REVIEW_SETTINGS_FEATURE.md](admin-site/REVIEW_SETTINGS_FEATURE.md) - Settings feature
- [CODE_REFERENCE_SETTINGS.md](admin-site/CODE_REFERENCE_SETTINGS.md) - Code examples

---

**Status**: ✅ Ready to Use  
**Version**: 2.0  
**Last Updated**: 2026-02-03

---

## 🎉 That's It!

Simple, powerful, no breaking changes. Enjoy the personalized review system! 🌶️
