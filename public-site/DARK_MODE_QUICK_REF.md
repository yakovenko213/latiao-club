# 🚀 Dark Mode - Quick Reference

## One-Line Dark Mode Class Patterns

### Backgrounds
```html
class="bg-white dark:bg-gray-900"           <!-- Main backgrounds -->
class="bg-gray-50 dark:bg-gray-950"         <!-- Page backgrounds -->
class="bg-gray-100 dark:bg-gray-800"        <!-- Cards/Sections -->
```

### Text
```html
class="text-gray-900 dark:text-white"       <!-- Headings -->
class="text-gray-700 dark:text-gray-300"    <!-- Body text -->
class="text-gray-600 dark:text-gray-400"    <!-- Muted text -->
class="text-gray-500 dark:text-gray-500"    <!-- Subtle text (same) -->
```

### Borders
```html
class="border-gray-200 dark:border-gray-700"    <!-- Standard borders -->
class="border-gray-300 dark:border-gray-600"    <!-- Prominent borders -->
```

### Interactive Elements
```html
class="hover:bg-gray-100 dark:hover:bg-gray-800"        <!-- Hover states -->
class="hover:text-gray-900 dark:hover:text-white"      <!-- Hover text -->
class="focus:ring-2 focus:ring-spicy"                  <!-- Focus (same) -->
```

### Form Inputs
```html
<input class="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-spicy">
```

### Buttons
```html
<!-- Primary Button (Orange - works in both modes) -->
<button class="bg-spicy hover:bg-orange-700 text-white">

<!-- Secondary Button -->
<button class="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600">

<!-- Ghost Button -->
<button class="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
```

### Cards
```html
<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
  <h3 class="text-gray-900 dark:text-white font-bold">Title</h3>
  <p class="text-gray-600 dark:text-gray-400">Description</p>
</div>
```

### Tables
```html
<table class="bg-white dark:bg-gray-900">
  <thead class="bg-gray-50 dark:bg-gray-800">
    <th class="text-gray-700 dark:text-gray-300">Header</th>
  </thead>
  <tbody>
    <tr class="hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <td class="text-gray-900 dark:text-gray-100">Cell</td>
    </tr>
  </tbody>
</table>
```

### Modals/Overlays
```html
<!-- Overlay -->
<div class="fixed inset-0 bg-black/60 dark:bg-black/80">

<!-- Modal -->
<div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
  <div class="border-b border-gray-200 dark:border-gray-700">
    <h2 class="text-gray-900 dark:text-white">Modal Title</h2>
  </div>
</div>
```

---

## Color Hierarchy (Dark Mode)

| Light Mode | Dark Mode | Usage |
|------------|-----------|-------|
| `bg-white` | `dark:bg-gray-900` | Main container backgrounds |
| `bg-gray-50` | `dark:bg-gray-950` | Page backgrounds |
| `bg-gray-100` | `dark:bg-gray-800` | Elevated surfaces (cards) |
| `bg-gray-200` | `dark:bg-gray-700` | Slightly elevated (buttons) |
| `text-gray-900` | `dark:text-white` | Primary text (headings) |
| `text-gray-700` | `dark:text-gray-300` | Body text |
| `text-gray-600` | `dark:text-gray-400` | Secondary text |
| `border-gray-200` | `dark:border-gray-700` | Borders/dividers |

---

## JavaScript Functions

### Toggle Theme
```javascript
function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = localStorage.getItem('theme') || 'light';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  if (newTheme === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
  
  localStorage.setItem('theme', newTheme);
}
```

### Check Current Theme
```javascript
const isDarkMode = document.documentElement.classList.contains('dark');
const savedTheme = localStorage.getItem('theme');
```

### Detect System Preference
```javascript
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
```

---

## Common Patterns

### Section with Header
```html
<section class="bg-white dark:bg-gray-900 py-8">
  <div class="max-w-7xl mx-auto px-4">
    <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
      Section Title
    </h2>
    <p class="text-gray-600 dark:text-gray-400">
      Section description
    </p>
  </div>
</section>
```

### Navigation Link
```html
<a href="#" class="text-gray-700 dark:text-gray-300 hover:text-spicy dark:hover:text-orange-400 transition-colors">
  Link Text
</a>
```

### Badge/Tag
```html
<span class="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 px-3 py-1 rounded-full text-sm">
  Badge
</span>
```

---

## Testing Checklist

Before deploying dark mode:

- [ ] All text is readable (sufficient contrast)
- [ ] Borders are visible
- [ ] Hover states work correctly
- [ ] Focus states are clear
- [ ] Images have proper contrast
- [ ] Shadows don't disappear
- [ ] Icons remain visible
- [ ] Form inputs are styled
- [ ] Buttons stand out
- [ ] No FOUC (flash of unstyled content)

---

## Browser DevTools Tip

**Chrome/Edge DevTools:**
1. Open DevTools (F12)
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
3. Type "dark mode"
4. Select "Emulate CSS prefers-color-scheme: dark"

**Firefox DevTools:**
1. Open DevTools (F12)
2. Go to Inspector → Rules panel
3. Find the `:root` pseudo-class
4. Click the sun/moon icon to toggle

---

## Pro Tips

1. **Use semantic colors**: Instead of hardcoding `bg-gray-800`, consider creating custom classes like `bg-surface` that adapt automatically

2. **Group dark mode classes**: Keep dark mode modifiers together for readability
   ```html
   <!-- Good -->
   class="bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
   
   <!-- Avoid -->
   class="bg-white text-gray-900 dark:bg-gray-900 dark:text-white"
   ```

3. **Test both modes early**: Don't add dark mode as an afterthought

4. **Use Tailwind's opacity utilities**: 
   ```html
   class="bg-black/10 dark:bg-white/10"  <!-- 10% opacity -->
   ```

5. **Preserve brand colors**: Your orange `#ff6b00` works well in both modes!

---

Made with 🌶️ by Latiao Snack
