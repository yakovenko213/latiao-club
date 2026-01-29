# 📸 Multi-Image Upload Feature

## Overview
The product management system has been upgraded to support multiple images per product with automatic Firebase Storage integration.

## ✨ New Features

### Admin Panel (`admin.html`)
1. **Multi-Image File Upload**
   - File input accepts multiple images: `<input type="file" multiple>`
   - Live preview grid shows selected images with numbering
   - Images uploaded to Firebase Storage automatically
   - Download URLs stored as array in Firestore

2. **Enhanced Content Fields**
   - **Full Description**: Detailed product description (separate from short description)
   - **Specifications**: Custom specs or structured data (weight, country, calories, etc.)
   - **Ingredients**: Full ingredient list for transparency

3. **Image Upload Process**
   - Files stored in Firebase Storage at `products/{SKU}_{timestamp}_{index}.jpg`
   - Progress indication during upload
   - Automatic URL collection and database save
   - Backwards compatibility with single image field

### Product Page (`product.html`)
1. **Image Gallery**
   - First image displayed as main product image
   - Thumbnail strip for multiple images (only shows if 2+ images)
   - Click thumbnail to change main image
   - Graceful fallback to single image for legacy products

2. **Content Tabs**
   - **Description**: Shows `fullDescription` or falls back to short `description`
   - **Specifications**: Displays custom specs or default structured layout
   - **Ingredients**: Shows custom ingredients or default text

3. **Smart Rendering**
   - Handles both new `images[]` array and legacy `image` field
   - Hides thumbnails if only one image
   - Supports empty content gracefully

### Category Page (`category.html`)
- Updated to use first image from `images[]` array
- Falls back to legacy `image` field for compatibility
- Maintains existing grid layout and functionality

## 🗄️ Database Structure

### New Firestore Product Schema
```javascript
{
  name: "Product Name",
  price: 150,
  sku: "LT-2024-ABC1",
  
  // Images (NEW)
  images: [
    "https://storage.googleapis.com/...",
    "https://storage.googleapis.com/...",
    "https://storage.googleapis.com/..."
  ],
  image: "https://storage.googleapis.com/...", // Backwards compatibility
  
  // Content (NEW)
  fullDescription: "Detailed multi-paragraph description...",
  specs: "Custom specifications text...",
  ingredients: "Full ingredient list...",
  
  // Existing fields
  category: "snacks",
  spiciness: 3,
  description: "Short description",
  isHot: true,
  stock: 100,
  createdAt: "2024-01-15T10:30:00.000Z"
}
```

## 🔧 Technical Implementation

### Firebase Storage Integration
```javascript
// Import storage SDK
import { ref, uploadBytes, getDownloadURL } from 'firebase-storage.js';

// Upload process
for (let i = 0; i < files.length; i++) {
  const fileName = `products/${sku}_${timestamp}_${i}.jpg`;
  const storageRef = ref(storage, fileName);
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  imageUrls.push(downloadURL);
}
```

### Image Preview
```javascript
// Real-time preview as user selects files
imageInput.addEventListener('change', (e) => {
  Array.from(files).forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      // Display preview with image number
    };
    reader.readAsDataURL(file);
  });
});
```

## 📋 Usage Instructions

### Adding Products with Multiple Images

1. **Open Admin Panel**
   - Navigate to "Товари" tab
   - Click "Додати товар"

2. **Fill Product Details**
   - Enter name, price, SKU (auto-generates if empty)
   - Select category and spiciness level

3. **Upload Images**
   - Click "Вибрати зображення"
   - Select multiple files (Ctrl/Cmd + Click)
   - Preview appears below input showing all images
   - First image becomes main product image

4. **Add Content**
   - **Short Description**: Quick product summary (existing field)
   - **Full Description**: Detailed information for Description tab
   - **Specifications**: Product specs (or leave empty for defaults)
   - **Ingredients**: Full ingredient list

5. **Save**
   - Click "Додати товар"
   - Images upload to Firebase Storage
   - Product saves to Firestore with all data

### Managing Existing Products

**Legacy products** (single image) continue to work:
- Single image displays normally
- No thumbnail strip shown
- Default specs and ingredients displayed
- Can be edited to add multiple images later

## 🎨 UI/UX Features

### Image Preview (Admin)
- 4-column grid layout
- Image thumbnails with numbering
- Responsive design
- Visual feedback before upload

### Product Gallery (Frontend)
- Large main image display
- Clickable thumbnails below (if 2+ images)
- Active thumbnail highlighted with orange ring
- Smooth image transitions
- Zoom on hover effect

### Content Tabs
- Collapsible accordion design
- Icons for each section (📝 📊 🧪)
- Smooth expand/collapse animations
- Smart content display (custom or defaults)

## 🔒 Security & Best Practices

1. **File Validation**
   - `accept="image/*"` restricts to images only
   - Firebase Storage rules should validate file types
   - Consider adding size limits (max 2MB per image)

2. **Storage Organization**
   - Files named with SKU for easy identification
   - Timestamp prevents name collisions
   - Index number maintains upload order

3. **Backwards Compatibility**
   - Always sets `image` field to first URL
   - Legacy products still render correctly
   - Gradual migration path for existing data

## 🚀 Future Enhancements

Possible additions:
- [ ] Image reordering (drag & drop)
- [ ] Image deletion (remove specific images)
- [ ] Image compression before upload
- [ ] Lazy loading for galleries
- [ ] Zoom modal for product images
- [ ] Video support
- [ ] Image alt text customization
- [ ] Bulk image upload from URLs

## 📝 Notes

- Maximum recommended images: **5-8 per product**
- Optimal image dimensions: **800x800px** or higher
- Supported formats: JPG, PNG, WebP
- Storage costs apply based on Firebase pricing
