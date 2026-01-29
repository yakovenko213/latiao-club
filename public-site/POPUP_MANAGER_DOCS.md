# 📢 Pop-up Manager Module - Documentation

## Overview
The Pop-up Manager is a comprehensive promotional pop-up system that allows you to create, manage, and display targeted pop-ups on your website with advanced triggering and frequency controls.

## Features

### 🎯 Trigger Types
1. **Timer-based** - Show pop-up after X seconds on page
2. **Scroll-based** - Show pop-up when user scrolls X% of page
3. **Exit Intent** - Show pop-up when user attempts to leave page

### 📊 Frequency Control
1. **Always** - Show every time trigger conditions are met
2. **Once per Session** - Show only once per browser session
3. **Once Lifetime** - Show only once ever (stored in localStorage)

### 🎨 Customization Options
- Custom title and content
- Optional promotional image
- Optional CTA button with custom text and link
- Active/Inactive toggle for easy management

## Admin Panel Usage

### Creating a Pop-up
1. Navigate to **Admin Panel → 📢 Pop-ups**
2. Fill in the form:
   - **Title**: Main headline (e.g., "Знижка 20% на всі товари!")
   - **Content**: Detailed message
   - **Image**: Upload promotional banner (optional)
   - **Button Text**: CTA button label (e.g., "Отримати знижку")
   - **Button Link**: URL for CTA (e.g., "/category.html?category=sale")
   - **Trigger Type**: Choose timer/scroll/exit_intent
   - **Trigger Value**: 
     - Timer: seconds (e.g., 5)
     - Scroll: percentage (e.g., 50)
     - Exit Intent: not used
   - **Frequency**: Choose display frequency
   - **Active**: Toggle to enable/disable
3. Click **Зберегти pop-up**

### Managing Pop-ups
- **Edit**: Click "Редагувати" to modify existing pop-up
- **Toggle Status**: Quick enable/disable without deleting
- **Delete**: Permanently remove pop-up
- **Refresh List**: Reload pop-ups from database

## Technical Architecture

### Database Structure (Firestore)

**Collection**: `popups`

**Document Fields**:
```javascript
{
  title: string,           // Pop-up headline
  content: string,         // Main text content
  buttonText: string,      // CTA button text (optional)
  buttonLink: string,      // CTA button URL (optional)
  imageUrl: string,        // Firebase Storage URL (optional)
  triggerType: string,     // 'timer' | 'scroll' | 'exit_intent'
  triggerValue: number,    // Seconds or percentage
  frequency: string,       // 'always' | 'once_per_session' | 'once_lifetime'
  isActive: boolean,       // Enable/disable without deleting
  createdAt: timestamp,    // Creation timestamp
  updatedAt: timestamp,    // Last update timestamp
  updatedBy: string        // Admin email who last modified
}
```

### Files Modified/Created

1. **admin.html**
   - Added sidebar menu item "📢 Pop-ups"
   - Created `view-popups` section with form and list
   - Added JavaScript functions:
     - `loadPopups()` - Fetch and display all pop-ups
     - `savePopup()` - Create/update pop-up
     - `editPopup()` - Load pop-up for editing
     - `togglePopupStatus()` - Enable/disable pop-up
     - `deletePopup()` - Remove pop-up
     - `resetPopupForm()` - Clear form

2. **js/popup-manager.js** (NEW)
   - Client-side pop-up display engine
   - Fetches active pop-ups from Firestore
   - Implements trigger logic for all types
   - Manages frequency control with localStorage/sessionStorage
   - Renders responsive modal with animations

3. **index.html**
   - Added `<script src="./js/popup-manager.js"></script>`

4. **checkout.html**
   - Added `<script src="./js/popup-manager.js"></script>`

5. **firestore.rules** (NEW)
   - Security rules for all collections
   - Allows public read access to `popups` collection
   - Restricts write access to authenticated admins

6. **firebase.json**
   - Added `"firestore": { "rules": "firestore.rules" }`

## Client-Side Logic Flow

### 1. Initialization
```javascript
// On page load
initPopupManager() → 
  Fetch active popups from Firestore →
  Filter based on frequency rules →
  Setup triggers for each popup
```

### 2. Frequency Check
```javascript
shouldShowPopup(popup) →
  Check frequency setting →
  Query localStorage/sessionStorage →
  Return true/false
```

### 3. Trigger Setup
```javascript
setupPopupTrigger(popup) →
  Switch on triggerType:
    - timer: setTimeout(triggerValue * 1000)
    - scroll: addEventListener('scroll') + percentage calc
    - exit_intent: addEventListener('mouseleave') + clientY check
```

### 4. Display
```javascript
showPopup(popup) →
  Create modal HTML with Tailwind CSS →
  Append to document.body →
  Disable body scroll →
  Mark as shown in storage
```

### 5. Close
```javascript
closePopup(popupId) →
  Fade out animation →
  Remove modal from DOM →
  Re-enable body scroll
```

## Storage Keys

### SessionStorage (once_per_session)
- Key format: `popup_shown_session_{popupId}`
- Value: `'true'`
- Cleared when browser tab/window closes

### LocalStorage (once_lifetime)
- Key format: `popup_shown_lifetime_{popupId}`
- Value: `'true'`
- Persists indefinitely

## Styling

Pop-ups use Tailwind CSS utility classes with custom animations:
- **Backdrop**: Black overlay with 60% opacity and backdrop blur
- **Modal**: White card with rounded corners and shadow
- **Animations**: Fade-in for backdrop, scale-in for modal
- **Responsive**: Max width 28rem (md breakpoint)

## Use Cases

### 1. Welcome Discount
```
Title: Вітаємо на LaЧао! 🎉
Content: Отримайте 10% знижки на перше замовлення
Button Text: Отримати знижку
Button Link: /checkout.html
Trigger: Timer - 3 seconds
Frequency: Once per session
```

### 2. Free Shipping
```
Title: Безкоштовна доставка! 🚚
Content: При замовленні від 500 грн
Button Text: До каталогу
Button Link: /category.html
Trigger: Scroll - 50%
Frequency: Always
```

### 3. Exit Intent Offer
```
Title: Зачекайте! Не йдіть з порожніми руками
Content: Використайте промокод SAVE15 для знижки 15%
Button Text: Застосувати промокод
Button Link: /checkout.html
Trigger: Exit Intent
Frequency: Once lifetime
```

## Deployment

### 1. Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### 2. Verify in Firebase Console
- Go to Firestore → Rules
- Confirm `popups` collection has read access for everyone

### 3. Test Pop-ups
1. Create test pop-up in admin panel
2. Set trigger to "Timer - 3 seconds"
3. Visit homepage or checkout page
4. Verify pop-up appears after 3 seconds

### 4. Monitor Performance
- Check Firebase console for read/write operations
- Monitor Storage usage for uploaded images
- Review frequency rules effectiveness in Google Analytics

## Security Considerations

### ✅ Implemented
- Client-side HTML escaping to prevent XSS
- Firestore rules restrict write access to admins
- Read-only access for public to active pop-ups
- Firebase Storage rules for image uploads

### ⚠️ Best Practices
- Keep pop-up content concise
- Test triggers on different devices
- Monitor conversion rates
- Don't overuse "Always" frequency
- Use exit intent sparingly (can be annoying)

## Troubleshooting

### Pop-up not showing?
1. Check if pop-up is **Active** in admin panel
2. Clear localStorage/sessionStorage if testing frequency
3. Verify Firebase connection in console
4. Check browser console for errors
5. Ensure `popup-manager.js` is loaded

### Image not uploading?
1. Check Firebase Storage rules (allow write for authenticated)
2. Verify image file size (< 5MB recommended)
3. Check file format (JPG, PNG, WebP)
4. Review Storage quota in Firebase console

### Trigger not working?
1. **Timer**: Check console for initialization logs
2. **Scroll**: Ensure page has enough content to scroll
3. **Exit Intent**: Test by moving mouse to top of viewport

## Future Enhancements

Potential features for future versions:
- [ ] A/B testing for different pop-up variants
- [ ] Analytics integration (views, clicks, conversions)
- [ ] Scheduling (show only on specific dates/times)
- [ ] Targeting (show based on URL, device, referrer)
- [ ] Multi-language support
- [ ] Animation customization
- [ ] Sound/notification options
- [ ] Cookie consent integration

## Support

For issues or questions:
1. Check browser console for error messages
2. Review Firebase console for data issues
3. Test with different browsers/devices
4. Clear cache and test in incognito mode

---

**Version**: 1.0  
**Last Updated**: January 2026  
**Author**: LaЧао Development Team
