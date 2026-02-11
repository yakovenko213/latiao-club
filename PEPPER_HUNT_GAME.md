# 🌶️ Chili Pepper Hunt Game

A gamification feature for the Latiao Club website where users find 8 hidden peppers across different pages.

## 🎮 Game Overview

**Objective:** Find all 8 hidden chili peppers scattered across the website to win a special prize.

**Prize:** Players who find all 8 peppers receive a special reward (configured by admin).

**Progress Tracking:** Game progress is saved in localStorage and synchronized with Firestore upon completion.

---

## 📍 Pepper Locations

### Fixed Locations (Always the same for all players)

1. **Homepage (index.html)** - FAQ Section
   - Hidden in the answer to "Чи можна латяо дітям?"
   - Regular pepper 🌶️

2. **Delivery Page (page.html?slug=delivery-and-payment)** - Delivery Information
   - Hidden in the middle of delivery content
   - Regular pepper 🌶️

3. **About Us Page (page.html?slug=about-us)** - Brand Story
   - Hidden in brand story section
   - Regular pepper 🌶️

7. **Checkout Page (checkout.html)** - Order Summary
   - Hidden near order total section
   - Regular pepper 🌶️

8. **Dashboard Page (dashboard.html)** - User Stats
   - Hidden in stats section
   - **Golden pepper ✨🌶️** (bonus)

### Dynamic Locations (Randomized per player)

4-6. **Product Pages (product.html?id=X)** - Three random products
   - Pepper #4: Hidden in "Опис" (Description) tab
   - Pepper #5: Hidden in "Склад" (Ingredients) tab - **Golden pepper ✨🌶️**
   - Pepper #6: Hidden in Reviews section
   
   *Note: The 3 products are randomly selected when the player first starts the game and remain constant for that player.*

---

## 🏗️ Architecture

### Core Modules

1. **pepper-hunt-game.js** - Game state manager
   - Manages player progress
   - Handles localStorage persistence
   - Syncs with Firestore
   - Victory detection

2. **pepper-renderer.js** - Visual component renderer
   - Creates pepper elements with animations
   - Handles click interactions
   - Shows notifications and progress
   - Plays sound effects

3. **pepper-placer.js** - Automatic pepper placement
   - Detects page type
   - Injects peppers into correct locations
   - Handles dynamic product pages

4. **pepper-hunt-init.js** - Master initialization
   - Waits for Firebase
   - Initializes game state
   - Creates renderer instance
   - Triggers placement logic

### File Structure

```
public-site/js/
├── pepper-hunt-game.js     # Game state & logic
├── pepper-renderer.js      # Visual components
├── pepper-placer.js        # Pepper placement
└── pepper-hunt-init.js     # Initialization
```

---

## 💾 Data Storage

### LocalStorage

```javascript
{
  "pepperhunt_progress": {
    "found": [1, 3, 7],           // Array of found pepper IDs
    "startedAt": 1234567890,      // Timestamp
    "goldenPeppers": 2            // Count of golden peppers
  },
  "pepperhunt_random_products": [
    "latiao-spicy-fire",
    "latiao-classic-original",
    "latiao-bbq-flavor"
  ]
}
```

### Firestore

**Collection:** `settings/peppersGameConfig`
```javascript
{
  "isEnabled": true  // Admin toggle for game
}
```

**Collection:** `game_players`
```javascript
{
  "phone": "+380....",
  "peppersFound": 8,
  "goldenPeppersFound": 2,
  "timeSpent": 450,        // seconds
  "joinedAt": Timestamp,
  "completedAt": Timestamp,
  "telegram": "@username"
}
```

---

## 🎨 Visual Features

### Animations

- **Float Animation:** Peppers gently float and rotate
- **Hover Effect:** Scale up and glow on hover
- **Collection Animation:** Spin and fade out when clicked
- **Golden Shine:** Golden peppers have extra sparkle effect

### Notifications

- **Toast Notification:** Shows when pepper is found
- **Progress Indicator:** Bottom bar showing X/8 progress
- **Victory Modal:** Full-screen celebration when all 8 found

### Sound Effects

- Simple beep sound when pepper is collected (Web Audio API)
- Can be disabled by setting `soundEnabled = false`

---

## 🔧 Admin Controls

### Admin Panel Features (admin-site/index.html)

1. **Master Toggle** - Enable/disable game globally
2. **Statistics Dashboard** - View game stats
   - Total players
   - Completion rate
   - Average time
   - Most active hour
3. **Players Table** - List of all participants
   - Phone number
   - Progress (X/8)
   - Time spent
   - Completion status
4. **Search & Filter** - Find specific players
5. **Real-time Updates** - Auto-refresh data

### Admin Functions

```javascript
// Toggle game on/off
togglePeppersGame()

// Refresh stats
refreshPeppersGameData()

// Search players
searchPlayers(query)
```

---

## 🚀 Installation & Setup

### 1. Add Scripts to HTML Pages

Add these scripts before `</body>` on all pages:

```html
<!-- 🌶️ Chili Pepper Hunt Game -->
<script type="module" src="./js/pepper-hunt-game.js"></script>
<script type="module" src="./js/pepper-hunt-init.js"></script>
<script type="module" src="./js/pepper-placer.js"></script>
```

**Pages to include:**
- index.html (homepage)
- product.html (product pages)
- checkout.html (checkout)
- dashboard.html (user dashboard)
- page.html (delivery & about pages)

### 2. Enable Game in Firestore

```javascript
// In Firebase Console or via script
db.collection('settings').doc('peppersGameConfig').set({
  isEnabled: true
});
```

### 3. Verify Installation

1. Open browser console on homepage
2. Look for: `🌶️ Pepper Hunt: Game initialized!`
3. Check for pepper in FAQ section
4. Click pepper to test functionality

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] Pepper #1 appears in FAQ answer
- [ ] Pepper #2 appears on delivery page
- [ ] Pepper #3 appears on about page
- [ ] Peppers #4-6 appear on 3 random product pages
- [ ] Pepper #7 appears on checkout
- [ ] Pepper #8 appears on dashboard
- [ ] Click animation works
- [ ] Toast notification shows
- [ ] Progress saved to localStorage
- [ ] Victory modal appears after finding all 8
- [ ] Data synced to Firestore

### Test Commands (Browser Console)

```javascript
// Check game status
console.log(window.pepperHuntGame.getProgress());

// Reset progress
window.pepperHuntGame.resetGame();

// Check random products
console.log(window.pepperHuntGame.randomProductIds);

// Force victory (for testing)
window.pepperHuntGame.progress.found = [1,2,3,4,5,6,7,8];
window.pepperHuntGame.handleVictory();
```

---

## 🐛 Troubleshooting

### Peppers not appearing?

1. Check if game is enabled: Settings → peppersGameConfig → isEnabled
2. Open console and look for errors
3. Verify Firebase is initialized: `console.log(window.firebaseApp)`
4. Check if scripts are loaded: View Page Source

### Progress not saving?

1. Check localStorage: `localStorage.getItem('pepperhunt_progress')`
2. Verify Firestore permissions
3. Check phone number is captured: `window.pepperHuntGame.playerPhone`

### Random products not working?

1. Check Firestore products collection exists
2. Verify at least 3 products in database
3. Clear localStorage and refresh: `localStorage.removeItem('pepperhunt_random_products')`

---

## 📊 Analytics & Metrics

Track these KPIs in admin panel:

- **Participation Rate:** % of users who find at least 1 pepper
- **Completion Rate:** % of users who find all 8
- **Average Time:** Time to complete the hunt
- **Drop-off Points:** Which peppers are hardest to find
- **Peak Hours:** When users play most

---

## 🔮 Future Enhancements

- [ ] Daily/weekly pepper resets for replay value
- [ ] Leaderboard for fastest completions
- [ ] Bonus golden peppers with extra rewards
- [ ] Seasonal themes (Halloween, Christmas variants)
- [ ] Share progress on social media
- [ ] Unlock codes for special discounts
- [ ] Multiplayer co-op mode
- [ ] Pepper NFTs for collectors

---

## 📝 Version History

**v1.0.0** - Initial Release
- 8 pepper locations (5 fixed, 3 dynamic)
- LocalStorage + Firestore sync
- Admin panel integration
- Victory detection & rewards

---

## 👥 Support

For questions or issues:
- Check admin panel logs
- Review browser console errors
- Contact development team

🌶️ **Happy Hunting!**
