# 🎟️ Promo Codes Management System

## Overview
Complete promo codes system for managing discount codes in your e-commerce admin panel.

---

## 📊 Firestore Data Model

### Collection: `promocodes`

Each document contains:

```javascript
{
  code: "SALE2024",              // string - Unique promo code (uppercase)
  type: "percent",               // string - 'percent' or 'fixed'
  value: 10,                     // number - Discount value (10 for 10%, or 100 for 100 UAH)
  limits: {
    total: 100,                  // number - Max total uses (0 = unlimited)
    perUser: 1                   // number - Max uses per customer
  },
  stats: {
    usedCount: 0                 // number - Current usage count
  },
  isActive: true,                // boolean - Active status
  createdAt: Timestamp           // timestamp - Creation date
}
```

### Example Documents

**Percentage Discount:**
```json
{
  "code": "SUMMER20",
  "type": "percent",
  "value": 20,
  "limits": {
    "total": 500,
    "perUser": 1
  },
  "stats": {
    "usedCount": 0
  },
  "isActive": true,
  "createdAt": "2026-01-15T10:00:00Z"
}
```

**Fixed Amount Discount:**
```json
{
  "code": "100OFF",
  "type": "fixed",
  "value": 100,
  "limits": {
    "total": 0,
    "perUser": 1
  },
  "stats": {
    "usedCount": 0
  },
  "isActive": true,
  "createdAt": "2026-01-15T10:00:00Z"
}
```

---

## 🎨 Admin UI Features

### 1. Stats Dashboard
Four cards displaying:
- **Total Promo Codes**: Count of all promocodes
- **Active Codes**: Count of active promocodes
- **Total Uses**: Sum of all usedCount
- **Discounts Given**: Total discount amount (TODO: calculate from orders)

### 2. Promo Codes Table
Columns:
- **Code**: Promo code with ticket icon
- **Discount**: Badge showing percentage or fixed amount
- **Used/Total**: Usage statistics (e.g., "5/100" or "12/∞")
- **Limit per User**: Maximum uses per customer
- **Status**: Active (green) or Inactive (red) badge
- **Created Date**: Creation date
- **Actions**: Toggle active/inactive, Delete

### 3. Create Promo Modal

#### Code Generation Section
- **Manual Input**: Text field for custom codes (auto-uppercase)
- **Auto-Generate Buttons**:
  - **Letters + Numbers**: 8-character alphanumeric (e.g., "X7K9P2M4")
  - **Numbers Only**: 6-digit numeric code (e.g., "847293")

#### Discount Settings
- **Type Dropdown**: Percentage (%) or Fixed Amount (₴)
- **Value Input**: Discount amount
- **Live Example**: Shows preview text

#### Usage Limits
- **Total Max Uses**: 0 for unlimited
- **Max per Person**: Default 1

#### Active Status
- Checkbox to activate immediately

---

## 🔧 JavaScript Functions

### Code Generation
```javascript
generateCode('alphanumeric')  // Returns: "X7K9P2M4"
generateCode('numeric')       // Returns: "847293"
```

**Implementation:**
- Alphanumeric: Excludes similar-looking chars (I, O, 0, 1)
- Numeric: 6 random digits
- Auto-populates input field

### CRUD Operations

#### Create Promo Code
```javascript
// Validates:
// 1. Code is not empty
// 2. Value > 0
// 3. Percent <= 100
// 4. Code doesn't already exist (duplicate check)

await addDoc(collection(db, 'promocodes'), {
  code: code.toUpperCase(),
  type: type,
  value: value,
  limits: { total, perUser },
  stats: { usedCount: 0 },
  isActive: isActive,
  createdAt: serverTimestamp()
});
```

#### Load Promo Codes
```javascript
// Fetches all promocodes ordered by creation date (desc)
const promosRef = collection(db, 'promocodes');
const q = query(promosRef, orderBy('createdAt', 'desc'));
const snapshot = await getDocs(q);
```

#### Toggle Status
```javascript
// Switches between active/inactive
await updateDoc(doc(db, 'promocodes', promoId), {
  isActive: newStatus
});
```

#### Delete Promo
```javascript
// Confirms before deletion
await deleteDoc(doc(db, 'promocodes', promoId));
```

---

## 🎯 Usage in Checkout

### To integrate with your checkout system:

1. **Validate Promo Code**
```javascript
async function validatePromoCode(code, userId) {
  const promosRef = collection(db, 'promocodes');
  const snapshot = await getDocs(promosRef);
  
  const promo = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .find(p => p.code === code.toUpperCase());
  
  if (!promo) return { valid: false, error: 'Промокод не знайдено' };
  if (!promo.isActive) return { valid: false, error: 'Промокод неактивний' };
  
  // Check total limit
  if (promo.limits.total > 0 && promo.stats.usedCount >= promo.limits.total) {
    return { valid: false, error: 'Промокод вичерпано' };
  }
  
  // Check per-user limit (requires tracking user usage in separate collection)
  // TODO: Implement user-specific usage tracking
  
  return { valid: true, promo };
}
```

2. **Calculate Discount**
```javascript
function calculateDiscount(promo, cartTotal) {
  if (promo.type === 'percent') {
    return Math.round(cartTotal * (promo.value / 100));
  } else {
    return Math.min(promo.value, cartTotal); // Can't discount more than total
  }
}
```

3. **Apply Discount and Increment Usage**
```javascript
async function applyPromoCode(promoId) {
  const promoRef = doc(db, 'promocodes', promoId);
  await updateDoc(promoRef, {
    'stats.usedCount': increment(1)
  });
}
```

---

## 🔐 Security Rules

Add to `firestore.rules`:

```javascript
match /promocodes/{promoId} {
  // Allow read for authenticated users (for checkout validation)
  allow read: if request.auth != null;
  
  // Only admins can write
  allow create, update, delete: if request.auth != null && 
    get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.role == 'admin';
}
```

---

## 📱 Design Features

### Tailwind CSS Styling
- **Purple accent**: Promo code badges and headers
- **Green badges**: Active status
- **Red badges**: Inactive status
- **Gradient buttons**: Purple to orange
- **Hover effects**: Smooth transitions
- **Responsive design**: Mobile-friendly

### Icons (Lucide)
- `ticket`: Promo code indicator
- `percent`: Percentage discount
- `banknote`: Fixed amount discount
- `check-circle`: Active status
- `x-circle`: Inactive status
- `play/pause`: Toggle actions
- `trash-2`: Delete action

---

## 🚀 Navigation

Access promo codes from:
- **Main Admin Panel**: Sidebar link "Промокоди"
- **Direct URL**: `admin-promos.html`

---

## ✅ Features Checklist

- [x] Firestore collection structure
- [x] Admin UI with table and stats
- [x] Create modal with form validation
- [x] Code generation (alphanumeric & numeric)
- [x] Duplicate code prevention
- [x] Toggle active/inactive status
- [x] Delete functionality with confirmation
- [x] Live discount preview
- [x] Usage tracking (usedCount)
- [x] Responsive design
- [ ] Checkout integration
- [ ] Per-user usage tracking
- [ ] Expiration dates
- [ ] Minimum order value requirement

---

## 📝 Future Enhancements

1. **Expiration Dates**
   - Add `expiresAt` field
   - Show countdown timer
   - Auto-deactivate expired codes

2. **User Usage Tracking**
   - Create `promoUsage` subcollection
   - Track which users used which codes
   - Enforce per-user limits

3. **Advanced Conditions**
   - Minimum order value
   - Specific product categories
   - First-time customer only
   - Stacking rules

4. **Analytics**
   - Revenue impact calculation
   - Most popular codes
   - Usage trends chart
   - Conversion rates

5. **Bulk Operations**
   - Import codes from CSV
   - Bulk activate/deactivate
   - Clone existing codes

---

## 🐛 Troubleshooting

**Problem**: Code already exists error
- **Solution**: Use unique codes or auto-generate

**Problem**: Can't see promo codes page
- **Solution**: Ensure user is authenticated in Firebase

**Problem**: Stats not updating
- **Solution**: Refresh page or check Firestore permissions

---

## 📞 Support

For issues or questions:
1. Check browser console for errors
2. Verify Firestore connection
3. Confirm authentication is working
4. Review security rules

---

Built with ❤️ for Latiao Club 🌶️
