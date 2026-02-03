# Review Moderation UI/UX - Visual Design Guide v2.0

## Design System Overview

### Color Palette
```
Primary Colors:
- Spicy Orange: #FF6B35 (buttons, highlights)
- Green (Approve): #22C55E (positive actions)
- Red (Delete): #EF4444 (destructive actions)
- Blue (Edit): #3B82F6 (secondary actions)
- Purple (Verify): #8B5CF6 (verification)

Neutral Colors:
- White: #FFFFFF (cards, backgrounds)
- Gray-50: #F9FAFB (light backgrounds)
- Gray-100: #F3F4F6 (hover states)
- Gray-200: #E5E7EB (borders)
- Gray-700: #374151 (text)
- Gray-900: #111827 (headings)

Status Colors:
- Yellow: #FCD34D (pending/moderation)
- Green: #10B981 (verified)
- Amber: #F59E0B (warning)
```

### Typography
```
Headings: Inter, -apple-system, BlinkMacSystemFont (bold, 1.125rem-1.5rem)
Body Text: Inter, -apple-system, BlinkMacSystemFont (regular, 0.875rem-1rem)
Monospace: Monaco, Courier, monospace (IDs, phone numbers)
Line Height: 1.5 (body), 1.25 (headings)
```

### Spacing System
```
Base Unit: 4px (0.25rem)
Padding: 4px, 8px, 12px, 16px, 20px, 24px
Gap: 8px (flex gaps), 16px (section gaps)
Border Radius: 8px (buttons), 12px (cards), 16px (modals)
```

## Card Component Design

### Desktop Layout (1024px+)
```
┌─────────────────────────────────────────────┐
│  PHOTO GALLERY (horizontal scroll)          │ (optional)
├─────────────────────────────────────────────┤
│ ⭐⭐⭐⭐⭐ [5/5] [На модерації]              │
│ John Doe                                    │
│ ✓ Верифікований | 📞 +38(0)XX)XXX-XX-XX  │ (right: created date)
├─────────────────────────────────────────────┤
│ "Great product! Very satisfied with        │
│  the quality and delivery. Highly          │
│  recommend to others."                     │
├─────────────────────────────────────────────┤
│ 📅 Дата публікації                         │
│ Dec 15, 2024, 14:30  [Змінити]             │
├─────────────────────────────────────────────┤
│ ID Замовлення: ORD-2024-12-015             │
│ ID Продукту:   PROD-789456                 │
├─────────────────────────────────────────────┤
│ [✓ Опублікувати] [✗ Видалити]              │
│ [📝 Редагувати]  [✓ Верифікувати]          │
└─────────────────────────────────────────────┘
```

### Tablet Layout (640px - 1024px)
```
Same as desktop but in 2-column grid
```

### Mobile Layout (< 640px)
```
Single column with vertical stacking
Buttons: Full width with proper touch targets (44px minimum height)
Photos: Scrollable horizontal (auto height)
```

## Component Specifications

### Photo Gallery
```
Height: 128px (h-32)
Width: 128px (w-32)
Gap: 8px
Overflow: horizontal scrollable
Behavior:
  - Click: Open full size in new tab or lightbox
  - Hover: Show eye icon overlay
  - Lazy load: defer loading for offscreen images
```

### Card Header Section
```
Layout: Flex between (title left, date right)
Padding: 20px (p-5)
Border: Bottom gray-100

Left side:
- Stars: 32px (text-2xl) gold/yellow
- Rating badge: small pill "5/5"
- Status badge: amber "На модерації"
- Product name: small gray "📦 Product Name"
- Customer name: bold 16px
- Contact info: small gray with icons

Right side:
- Created date: small gray right-aligned
- Created time: small gray right-aligned
- Relative time: small blue "2 hours ago"
```

### Review Content Section
```
Padding: 20px (p-5)
Border: Bottom gray-100
Max height: None (but use line-clamp-3 for preview)
Font: 14px gray-700
Line height: 1.5
```

### Date Management Section
```
Layout: Flex between (info left, button right)
Background: Blue-50
Padding: 16px (p-4)
Border: Bottom blue-100

Left side:
- Label: "📅 Дата публікації" (small blue)
- Value: "Dec 15, 2024" or "Не встановлено"
- Font size: 12px, 14px

Right side:
- Button: "Змінити" (Change)
- Style: Small blue pill with border
- Icon: calendar-line (lucide)
```

### Order Info Section
```
Layout: 2-column grid (Order ID | Product ID)
Background: Gray-50
Padding: 16px (p-4)
Border: Bottom gray-100

Each column:
- Label: "ID Замовлення" (small gray, font-medium)
- Value: "ORD-2024-12-015" (monospace, gray-900)
- Background: White
- Padding: 8px (p-2)
- Border radius: 6px
```

### Action Buttons Section
```
Padding: 20px (p-5)
Layout: 2 rows, 2-2 grid
Gap: 8px (gap-2)

Row 1: Primary Actions
- Approve: Green button, full width
  Background: #22C55E
  Hover: #16A34A
  Text: White, bold
  Icon: check (lucide)
  
- Delete: Red outline button, full width
  Background: #FEE2E2 (red-50)
  Hover: #FECACA (red-100)
  Text: #DC2626 (red-600)
  Border: 1px red-200
  Icon: trash-2 (lucide)

Row 2: Secondary Actions
- Edit: Blue outline button
  Background: #EFF6FF (blue-50)
  Hover: #DBEAFE (blue-100)
  Text: #2563EB (blue-600)
  Border: 1px blue-200
  Icon: edit-2 (lucide)
  
- Verify: Purple outline (if customer found)
  Background: #F3E8FF (purple-50)
  Hover: #E9D5FF (purple-100)
  Text: #7C3AED (purple-600)
  Border: 1px purple-200
  Icon: badge-check (lucide)

Button sizes:
- Height: 44px minimum (mobile touch target)
- Padding: 12px 16px (desktop), 10px 12px (mobile)
- Font: 14px bold (desktop), 12px bold (mobile)
- Border radius: 8px
- Transition: all 200ms ease
```

## Modal Dialogs

### Date Picker Modal
```
Dialog: rounded-2xl shadow-2xl w-full max-w-md
Background: White

Header (p-6 border-b):
├─ Title: "Встановити дату публікації" (18px bold)
└─ Close button (X, top right)

Content (p-6 space-y-4):
├─ Current Date Display
│  ├─ Background: blue-50
│  ├─ Border: 1px blue-200
│  ├─ Label: "Поточна дата подання:" (blue-600)
│  └─ Value: "Dec 13, 2024, 12:30" (blue-900 bold)
│
├─ Date & Time Inputs
│  ├─ Label: "Дата та час публікації"
│  ├─ Date input: HTML5 <input type="date">
│  ├─ Time input: HTML5 <input type="time">
│  └─ Layout: 2-column grid
│
├─ Preset Buttons (2x2 grid)
│  ├─ "Зараз" (Now) - green
│  ├─ "Завтра" (Tomorrow) - blue
│  ├─ "За тиждень" (Next week) - purple
│  └─ "За місяць" (Next month) - orange
│
├─ Preview Section
│  ├─ Background: gray-50
│  ├─ Label: "Попередній перегляд:"
│  └─ Value: "Dec 15, 2024, 14:30"
│
└─ Help Text
   └─ "💡 Ви можете встановити дату в майбутньому..."

Footer (p-6 border-t):
├─ Cancel button (gray) - flex-1
└─ Save button (spicy orange) - flex-1
```

### Quick Edit Modal
```
Dialog: rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto

Header (p-6 border-b sticky):
├─ Title: "Редагувати відгук" (18px bold)
└─ Close button (X, top right)

Content (p-6 space-y-4):
├─ Review Info (read-only)
│  ├─ Background: gray-50
│  ├─ Layout: 2-column grid
│  ├─ Name: "John Doe"
│  └─ Rating: "⭐⭐⭐⭐⭐"
│
├─ Review Text (editable)
│  ├─ Label: "Текст відгуку"
│  ├─ Textarea: 6 rows, full width
│  ├─ Focus ring: orange (spicy)
│  └─ Counter: "124 символів" (gray-500)
│
└─ Warning Box
   ├─ Background: amber-50
   ├─ Border: 1px amber-200
   ├─ Icon: alert-circle (amber)
   ├─ Title: "Важливо"
   └─ Text: "Редагування повинно відповідати політиці..."

Footer (p-6 border-t):
├─ Cancel button (gray) - flex-1
└─ Save button (blue) - flex-1
```

## Responsive Breakpoints

### 320px - 640px (Mobile)
```
Grid: 1 column
Padding: 12px (p-3)
Font sizes: -2 steps smaller
Button height: 44px minimum
Gap: 6px
Card border radius: 8px
```

### 640px - 1024px (Tablet)
```
Grid: 2 columns
Padding: 16px (p-4)
Font sizes: -1 step smaller
Button height: 40px
Gap: 12px
```

### 1024px+ (Desktop)
```
Grid: 3 columns
Padding: 20px (p-5)
Font sizes: standard
Button height: 40px
Gap: 16px
```

## Animation & Transitions

### Card Hover
```
Background: subtle shadow increase
Border: gray-200 → gray-300
Transition: all 200ms ease
```

### Button Hover
```
Background: 10% darker
Transform: none (avoid motion sickness)
Transition: 150ms ease
```

### Modal Appear
```
Animation: slideUp 300ms ease-out
Keyframes:
  0%: opacity 0, translateY 20px
  100%: opacity 1, translateY 0
```

### Date Picker Preview Update
```
Update in real-time as user changes date/time
No animation (immediate feedback)
```

## Accessibility Specifications

### Color Contrast
```
Text on Background:
- White text on green: 1.7:1 (AA)
- White text on blue: 2.1:1 (AA)
- Dark text on light: 4.5:1 (AAA)

Icons:
- Always paired with text label
- Minimum 24px for touch targets
```

### Focus States
```
All interactive elements:
- Focus ring: 2px solid spicy orange
- Outline offset: 2px
- Ring radius: 4px
```

### Keyboard Navigation
```
Tab order:
1. Card buttons (left to right, top to bottom)
2. Modal buttons within modal
3. Form inputs focus() auto on open

Escape key:
- Close modals
- Cancel edits
```

### Screen Reader
```
Buttons: semantic <button> elements
Labels: associated <label> elements
Icons: <i data-lucide="..."> with aria-label
Status: aria-live regions for toast notifications
```

## Dark Mode (Optional Future)

```css
@media (prefers-color-scheme: dark) {
  .review-card {
    @apply bg-gray-800 border-gray-700 text-gray-100;
  }
  
  .bg-white {
    @apply bg-gray-900;
  }
  
  .bg-gray-50 {
    @apply bg-gray-800;
  }
  
  .text-gray-700 {
    @apply text-gray-300;
  }
  
  .text-gray-900 {
    @apply text-white;
  }
}
```

## Brand Customization

### Change Primary Color
Replace all instances of:
```css
bg-spicy → bg-[YOUR_COLOR]
hover:bg-orange-600 → hover:bg-[YOUR_COLOR_DARKER]
text-orange-600 → text-[YOUR_COLOR]
border-orange-200 → border-[YOUR_COLOR_LIGHT]
```

### Change Green (Approve)
```css
bg-green-500 → bg-[YOUR_GREEN]
hover:bg-green-600 → hover:bg-[YOUR_GREEN_DARKER]
```

### Add Logo to Header
```html
<div class="p-6 border-b flex items-center gap-3">
  <img src="/logo.svg" alt="Logo" class="h-6 w-6">
  <h3 class="text-lg font-bold">Title</h3>
</div>
```

## Performance Metrics

Target performance:
- Card render: < 100ms per 10 cards
- Modal open: < 200ms
- Date change: < 150ms Firestore update
- Photo scroll: 60 FPS

Implementation tips:
- Lazy load photos with `loading="lazy"`
- Use pagination for >20 reviews
- Debounce date picker updates (500ms)
- Cache customer lookups
- Use `onSnapshot` for real-time (already done)

## Browser Testing Checklist

### Desktop
- [ ] Chrome/Edge 90+
- [ ] Firefox 88+
- [ ] Safari 14+

### Mobile
- [ ] iOS Safari 14+
- [ ] Chrome Android (latest)
- [ ] Samsung Internet 14+

### Devices
- [ ] Desktop 1920x1080
- [ ] Tablet 768x1024 (iPad)
- [ ] Mobile 375x667 (iPhone 8)
- [ ] Mobile 414x896 (iPhone 12)
- [ ] Mobile 360x800 (Android)

### Features to Test
- [ ] Card hover effects
- [ ] Modal open/close
- [ ] Date picker preset buttons
- [ ] Photo gallery scroll
- [ ] Button click animations
- [ ] Keyboard navigation (Tab, Enter, Esc)
- [ ] Touch targets (44px minimum on mobile)
- [ ] Responsive layout changes
- [ ] Photo lazy loading
- [ ] Toast notifications
- [ ] Error messages

---

**Design System Version:** 2.0
**Last Updated:** Today
**Tailwind Version:** 3.0+
**Lucide Icons Version:** latest
