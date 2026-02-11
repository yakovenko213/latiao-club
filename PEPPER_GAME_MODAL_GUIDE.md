# 🌶️ Pepper Hunt Game Modal - Implementation Guide

## ✅ What Was Implemented

### 1. **Modal Content**
- **Hero Image**: Full-width banner at the top
  - Path: `./images/peppers-promo-banner.jpg`
  - Dimensions: Recommended 1200x600px (2:1 ratio)
  - Format: JPG (for faster loading)
  - Fallback: Gradient with emojis if image not found

### 2. **Content Sections**
- **Title**: "Збирай перчики по сайту – отримуй смачні подарунки! 🔥"
- **Instructions**: Explains where peppers are hidden
- **Goals**:
  - Regular: Find 8 peppers → Get free Latiao
  - **Golden Reward**: Find golden 9th pepper → +3 packs + 2000 UAH
    - Special styling: Golden border, shimmer animation, gradient background

### 3. **Registration Form**
- **Phone Input**: 
  - Icon: Phone SVG
  - Validation: 10-15 digits, +380 format supported
  - Required field
  
- **Telegram Input**:
  - Icon: Lucide message-circle
  - Validation: 5-32 characters, @ optional
  - Auto-adds @ if missing
  - Required field

### 4. **CTA Button**
- Text: "🎮 ПОЧАТИ ГРУ 🌶️"
- Gradient: Red → Orange → Red
- Hover effects: Scale, shadow

### 5. **Backend Integration**
- **Firestore**: Saves to `game_players` collection
  - Fields: phone, telegram, registeredAt, foundPeppers, status
  - Auto-generates document ID
  
- **LocalStorage**: Backup storage
  - Key: `pepperHunt_playerData`
  - Key: `pepperHunt_playerId` (Firestore doc ID)

### 6. **User Flow**
1. User clicks "ОТРИМАТИ" in top bar
2. Modal opens with game details
3. User fills phone + Telegram
4. Clicks "ПОЧАТИ ГРУ"
5. Form validates
6. Data saves to Firestore + localStorage
7. Success message shows
8. Modal closes after 2 seconds
9. Auto-scrolls to FAQ section (first pepper location)

---

## 🧪 Testing Instructions

### Test Modal Opening
```javascript
// Open browser console on homepage
window.openPepperGameModal()
```

### Test Form Validation
1. Try submitting empty form → Should show validation errors
2. Try invalid phone (too short) → Should show error
3. Try valid data → Should save successfully

### Test Modal Closing
```javascript
// Method 1: X button (click)
// Method 2: Backdrop click
// Method 3: ESC key
window.closePepperGameModal()
```

### Test Player Registration
```javascript
// Check if player registered
localStorage.getItem('pepperHunt_playerData')
localStorage.getItem('pepperHunt_playerId')

// View Firestore data (must be logged in to Firebase)
// Navigate to Console → Firestore → game_players collection
```

### Test Auto-Scroll
1. Open modal on homepage
2. Register player
3. After modal closes, should auto-scroll to FAQ section

---

## 📁 File Structure

```
public-site/
├── js/
│   └── layout.js           # Modal HTML + functions
└── images/
    └── peppers-promo-banner.jpg   # ⚠️ ADD THIS FILE
```

---

## 🖼️ Image Upload Instructions

### Option 1: GitHub UI
1. Go to GitHub repo: `yakovenko213/latiao-club`
2. Navigate to `public-site/images/`
3. Click "Add file" → "Upload files"
4. Select `peppers-promo-banner.jpg`
5. Commit with message: "Add pepper hunt promo banner"

### Option 2: Git Command Line
```bash
cd /workspaces/latiao-club/public-site/images
# Copy your image here, then:
git add peppers-promo-banner.jpg
git commit -m "Add pepper hunt promo banner"
git push
```

### Image Requirements
- **Filename**: MUST be `peppers-promo-banner.jpg` (exact match)
- **Dimensions**: 1200x600px recommended (or 2400x1200px for retina)
- **Aspect Ratio**: 2:1 (horizontal banner)
- **File Size**: < 500KB for fast loading
- **Content**: Should show peppers, game theme, excitement
- **Format**: JPG (or PNG, but JPG loads faster)

---

## 🔧 Customization

### Change Button Text
Edit line in `layout.js`:
```javascript
🎮 ПОЧАТИ ГРУ 🌶️
```

### Change Form Fields
Add/remove fields in modal content section:
```javascript
<!-- Add new field -->
<div>
  <label>New Field</label>
  <input type="text" id="new-field" required>
</div>
```

Then update `startPepperHuntGame()` function:
```javascript
const newField = document.getElementById('new-field').value;
const playerData = {
  phone: phone,
  telegram: telegram,
  newField: newField,  // Add new field
  // ...
};
```

### Change Rewards Text
Update in modal content:
```javascript
Знайди 8 перчиків – отримай пачку Латяо БЕЗКОШТОВНО
```

### Change Golden Shimmer Animation
Edit CSS in `<style>` section:
```css
@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
```
Change duration: `animation: shimmer 3s...` → `animation: shimmer 5s...`

---

## 🚨 Troubleshooting

### Modal Not Opening
```javascript
// Check if element exists
document.getElementById('pepper-game-modal')

// Check if function exists
typeof window.openPepperGameModal

// Force open
window.openPepperGameModal()
```

### Image Not Loading
1. Check filename: Must be `peppers-promo-banner.jpg`
2. Check path: Must be in `public-site/images/`
3. Check fallback: Gradient should show if image missing
4. Clear cache: Ctrl+Shift+R (or Cmd+Shift+R on Mac)

### Form Not Submitting
```javascript
// Check if form exists
document.getElementById('pepper-game-registration-form')

// Check validation
document.getElementById('player-phone').checkValidity()
document.getElementById('player-telegram').checkValidity()
```

### Firestore Not Saving
```javascript
// Check Firebase connection
window.firebaseApp
window.db

// Check localStorage fallback
localStorage.getItem('pepperHunt_playerData')
```

### Icons Not Showing
```javascript
// Check Lucide loaded
typeof lucide

// Reinitialize
lucide.createIcons()
```

---

## 📊 Analytics Events (Future)

Consider tracking these events:
- `pepper_modal_opened`
- `pepper_player_registered`
- `pepper_form_validation_error`
- `pepper_game_started`

---

## 🚀 Deployment

```bash
# Deploy to Firebase
firebase deploy --only hosting:main

# Or deploy all
firebase deploy
```

---

## 📝 Notes

- Modal only shows on homepage
- Top bar only visible if game enabled in Firestore
- Player data persists in localStorage even without Firestore
- Form auto-scrolls to FAQ where first pepper is hidden
- ESC key closes modal for better UX
- All Tailwind classes are responsive (mobile-first)
