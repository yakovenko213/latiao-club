# Review Moderation UI/UX - Testing & QA Guide v2.0

## Quick Test Checklist

### ✅ UI Components
- [ ] Card displays with white background
- [ ] Star rating shows correctly (⭐⭐⭐⭐⭐)
- [ ] "На модерації" badge displays
- [ ] Customer name is bold and readable
- [ ] Phone number is formatted correctly
- [ ] "Верифікований" badge shows for known customers
- [ ] Product name displays with 📦 icon
- [ ] Order/Product IDs display in footer

### ✅ Photo Gallery
- [ ] Photos display in horizontal scroll
- [ ] Photos have correct size (128x128)
- [ ] Hover shows eye icon overlay
- [ ] Click opens photo in new tab or lightbox
- [ ] Multiple photos scroll smoothly
- [ ] Gallery is hidden if no photos

### ✅ Date Management
- [ ] "Змінити" button appears in blue box
- [ ] Button opens date picker modal
- [ ] Modal shows current submission date
- [ ] Date input allows date selection
- [ ] Time input allows time selection
- [ ] Preview updates in real-time
- [ ] Presets work (Now, Tomorrow, +1 week, +1 month)
- [ ] Save button updates Firestore
- [ ] Card updates with new date

### ✅ Action Buttons
- [ ] "Опублікувати" button is green
- [ ] "Видалити" button is red outline
- [ ] "Редагувати" button is blue outline
- [ ] "Верифікувати" checkbox appears for known customers
- [ ] All buttons have hover effects
- [ ] Buttons maintain 44px height on mobile

### ✅ Quick Edit Modal
- [ ] "Редагувати" button opens modal
- [ ] Modal shows customer name (read-only)
- [ ] Modal shows star rating (read-only)
- [ ] Textarea contains review text
- [ ] Character counter updates as typing
- [ ] Character counter shows red if >2000 chars
- [ ] Escape key closes modal
- [ ] Click outside closes modal
- [ ] Cancel button closes without saving
- [ ] Save button updates Firestore
- [ ] Success toast shows "Відгук успішно відредаговано"

### ✅ Responsive Design
**Mobile (375px):**
- [ ] Cards in single column
- [ ] Buttons full width
- [ ] Text readable without zoom
- [ ] Touch targets 44px minimum
- [ ] No horizontal scroll

**Tablet (768px):**
- [ ] Cards in 2-column grid
- [ ] Proper spacing maintained
- [ ] Modals fit on screen

**Desktop (1024px+):**
- [ ] Cards in 3-column grid
- [ ] Proper alignment
- [ ] Hover effects work

### ✅ Functionality
- [ ] Approve button publishes with current time
- [ ] Approve button uses custom date if set
- [ ] Delete button shows confirmation
- [ ] Delete updates Firestore with "rejected" status
- [ ] Quick edit saves text to Firestore
- [ ] Verification checkbox toggles Firestore
- [ ] Toast notifications appear on all actions
- [ ] Real-time updates show new reviews instantly

### ✅ Accessibility
- [ ] Keyboard tab navigation works
- [ ] Focus indicators visible on all buttons
- [ ] Focus ring is 2px orange
- [ ] Escape key closes modals
- [ ] Color contrast meets WCAG AA
- [ ] Icon buttons have text labels or aria-label
- [ ] Form inputs have labels
- [ ] Error messages are descriptive

### ✅ Performance
- [ ] Page loads within 2 seconds
- [ ] Cards render smoothly (60 FPS)
- [ ] Modal opens within 300ms
- [ ] Firestore updates within 1 second
- [ ] No console errors
- [ ] No console warnings
- [ ] Photos lazy load correctly
- [ ] No memory leaks on repeated open/close

### ✅ Error Handling
- [ ] Invalid date shows error message
- [ ] Empty review text shows error
- [ ] Firestore error shows toast
- [ ] Network error shows toast
- [ ] Delete confirmation cancellable
- [ ] All errors non-blocking

## Test Scenarios

### Scenario 1: Approve Review with Custom Date
1. Find pending review with photo
2. Click "Змінити" button
3. Select date 3 days from now
4. Click "Зберегти дату"
5. Card shows new date
6. Click "Опублікувати"
7. Verify Firestore: status=approved, publishedAt=custom date

**Expected:** Review publishes at scheduled time

### Scenario 2: Quick Edit Review Text
1. Find pending review
2. Click "Редагувати"
3. Delete some text
4. Add new text
5. Verify character count updates
6. Click "Зберегти зміни"
7. Review text updates in card

**Expected:** Review text updated, editedByModerator=true in Firestore

### Scenario 3: Delete Review
1. Find pending review
2. Click "Видалити"
3. Confirm deletion
4. Card removes from grid
5. Verify Firestore: status=rejected

**Expected:** Review removed from moderation queue

### Scenario 4: Verify Customer
1. Find review from known customer
2. See "Верифікований" badge or checkbox
3. Click checkbox to toggle
4. Verify toast shows status

**Expected:** Firestore updated, verified=true/false

### Scenario 5: Mobile Interaction
1. Open admin panel on phone (375px width)
2. Verify cards in single column
3. Tap "Змінити" date button
4. Select preset "Завтра"
5. Tap "Зберегти дату"
6. Verify no horizontal scroll needed
7. Tap "Опублікувати"

**Expected:** All interactions work on mobile, no overflow

### Scenario 6: Multiple Reviews in Grid
1. Load page with 12+ pending reviews
2. Verify 3-column grid (desktop)
3. Verify spacing between cards
4. Scroll down to load more
5. Click approve on one card
6. Verify other cards unaffected

**Expected:** Grid renders correctly, no performance degradation

### Scenario 7: Modal Keyboard Navigation
1. Click date picker modal
2. Press Tab - focus moves through inputs
3. Press Tab - focus moves to preset buttons
4. Press Tab - focus moves to Save/Cancel buttons
5. Press Escape - modal closes

**Expected:** Smooth keyboard navigation, Escape closes modal

### Scenario 8: Verify Photo Interaction
1. Find review with multiple photos
2. Hover over first photo
3. Verify eye icon appears
4. Click photo
5. Verify opens in new tab at full size
6. Scroll gallery horizontally
7. Verify smooth scrolling (60 FPS)

**Expected:** Photos display correctly, click opens full size

### Scenario 9: Real-time Updates
1. Have 2 admin panels open
2. Approve review in panel 1
3. Verify review disappears from panel 2 in <1 second
4. New review comes in
5. Both panels update instantly

**Expected:** Real-time sync using onSnapshot

### Scenario 10: Date Validation
1. Open date picker
2. Try to set date before creation date
3. Verify error message appears
4. Try to set future date (valid)
5. Verify preview updates
6. Save and approve

**Expected:** Past date rejected, future date accepted

## Browser Compatibility Matrix

| Feature | Chrome | Firefox | Safari | Edge | Mobile |
|---------|--------|---------|--------|------|--------|
| Card render | ✅ | ✅ | ✅ | ✅ | ✅ |
| Date input | ✅ | ✅ | ✅ | ✅ | ✅* |
| Time input | ✅ | ✅ | ⚠️ | ✅ | ⚠️* |
| Modal animation | ✅ | ✅ | ✅ | ✅ | ✅ |
| Lucide icons | ✅ | ✅ | ✅ | ✅ | ✅ |
| Grid layout | ✅ | ✅ | ✅ | ✅ | ✅ |
| Flexbox | ✅ | ✅ | ✅ | ✅ | ✅ |
| Focus ring | ✅ | ✅ | ✅ | ✅ | N/A |

*Some browsers show native date/time picker instead of HTML5

## Test Data

### Sample Review 1 (Perfect)
```javascript
{
  id: 'test_1',
  status: 'pending',
  name: 'John Doe',
  phone: '+380971234567',
  rating: 5,
  comment: 'Great product! Exactly what I needed. Fast shipping!',
  photos: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
  productId: 'prod_123',
  orderId: 'order_2024_001',
  createdAt: new Date('2024-12-13T12:30:00'),
  publishedAt: null,
  verified: true
}
```

### Sample Review 2 (No Photos)
```javascript
{
  id: 'test_2',
  status: 'pending',
  name: 'Jane Smith',
  phone: '+380951234567',
  rating: 4,
  comment: 'Good quality, but delivery took longer than expected.',
  photos: [],
  productId: 'prod_456',
  orderId: 'order_2024_002',
  createdAt: new Date('2024-12-14T08:15:00'),
  publishedAt: null,
  verified: false
}
```

### Sample Review 3 (Unknown Customer)
```javascript
{
  id: 'test_3',
  status: 'pending',
  name: 'Anonymous',
  phone: '+380931234567',
  rating: 3,
  comment: 'Average product. Nothing special but does the job.',
  photos: ['https://example.com/photo3.jpg'],
  productId: 'prod_789',
  orderId: null,
  createdAt: new Date('2024-12-15T15:45:00'),
  publishedAt: null,
  verified: false
}
```

## Performance Benchmarks

### Target Metrics
| Metric | Target | Status |
|--------|--------|--------|
| Initial Load | < 2s | ⏳ |
| Card Render | < 100ms/10 cards | ⏳ |
| Modal Open | < 300ms | ⏳ |
| Firestore Update | < 1s | ⏳ |
| Photo Scroll | 60 FPS | ⏳ |

### How to Measure

**Card Render Speed:**
```javascript
console.time('render-cards')
renderModernPendingReviews()
console.timeEnd('render-cards')
```

**Modal Open:**
```javascript
console.time('modal-open')
openDatePickerModal('review_id')
console.timeEnd('modal-open')
```

**Firestore Update:**
```javascript
console.time('firestore-update')
updateDoc(...)
console.timeEnd('firestore-update')
```

**Memory Usage (Chrome DevTools):**
1. Open Performance tab
2. Record while opening/closing modals 5 times
3. Check Memory graph for leaks
4. Expected: Memory returns to baseline

## Debugging Guide

### Issue: Modal doesn't appear
```javascript
// Check if modal exists
console.log(document.getElementById('review-date-picker-modal'))

// Check if function is called
// Add console.log to openDatePickerModal()
console.log('Modal should be visible')
```

### Issue: Date doesn't save
```javascript
// Check Firestore rules
// Test permissions:
const testRef = doc(db, 'reviews', 'test-id')
updateDoc(testRef, { test: true })
  .then(() => console.log('Permissions OK'))
  .catch(e => console.error('Permission denied:', e))
```

### Issue: Photos don't display
```javascript
// Check Storage rules
// Check URL accessibility
fetch('photo_url')
  .then(r => console.log('URL accessible:', r.status))
  .catch(e => console.error('URL blocked:', e))
```

### Issue: Character counter doesn't update
```javascript
// Check event listener
const textarea = document.getElementById('review-quick-edit-text')
textarea.addEventListener('input', () => console.log('Input event fired'))
```

### Issue: Real-time updates don't work
```javascript
// Check Firestore listener
// Open DevTools Network tab
// Filter by Firestore
// Verify updates are received
```

## Test Report Template

```markdown
# Review Moderation UI/UX - Test Report
**Date:** [TODAY]
**Tester:** [NAME]
**Browser:** [CHROME/FIREFOX/SAFARI] [VERSION]
**Device:** [DESKTOP/MOBILE/TABLET]

## Passed Tests: __/__
- [ ] All UI components render
- [ ] Date picker works
- [ ] Quick edit works
- [ ] Approve button works
- [ ] Delete button works
- [ ] Verify checkbox works
- [ ] Responsive on mobile
- [ ] No console errors
- [ ] No console warnings
- [ ] Firestore updates correctly

## Failed Tests: __/__
1. [DESCRIBE ISSUE]
   - Steps: [HOW TO REPRODUCE]
   - Expected: [WHAT SHOULD HAPPEN]
   - Actual: [WHAT ACTUALLY HAPPENS]

## Performance: [GOOD/OK/NEEDS IMPROVEMENT]
- Load time: [X]s
- Modal open: [X]ms
- Firestore update: [X]s
- Scrolling: [60 FPS/dropped frames]

## Recommendations
- [RECOMMENDATION 1]
- [RECOMMENDATION 2]

## Sign-off
- [ ] Ready for production
- [ ] Needs fixes
- [ ] Needs optimization

Tester: ______________________
Date: ________________________
```

## UAT (User Acceptance Testing)

### Before Going Live

1. **Admin Reviews Features**
   - Admin clicks each button
   - Admin sets custom dates
   - Admin edits review text
   - Admin verifies customers

2. **Manager Reviews UI**
   - Manager checks card design
   - Manager checks spacing/alignment
   - Manager checks mobile layout
   - Manager checks color scheme

3. **Customer Reviews System**
   - Customer submits review
   - Review appears in pending queue
   - Review publishes at scheduled time
   - Review appears on public site

4. **Support Staff Tests Approval Flow**
   - Support person approves 10 reviews
   - Verifies they appear on site
   - Verifies custom dates work
   - Verifies no data loss

## Sign-off Checklist

- [ ] All test scenarios pass
- [ ] No critical bugs
- [ ] Accessibility verified
- [ ] Mobile responsive
- [ ] Performance acceptable
- [ ] Error handling works
- [ ] Real-time sync works
- [ ] Firestore updates correctly
- [ ] Team trained on new features
- [ ] Documentation complete

---

**Test Status:** 🔄 In Progress
**Last Updated:** Today
**Version:** 2.0
