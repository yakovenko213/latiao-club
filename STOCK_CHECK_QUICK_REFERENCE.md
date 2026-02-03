# 🛒 Stock Limit Check - Quick Reference

## How It Works

The shopping cart now automatically:

1. **Checks real stock** from Firestore before allowing quantity increases
2. **Disables "+" button** when maximum stock is reached
3. **Shows warnings** when stock is limited
4. **Auto-adjusts quantities** if stock changed while items were in cart

## User Experience

### When adding items:
- ✅ If stock available → Item added, cart opens
- ⚠️ If at limit → Toast: "На складі лише X шт" + quantity capped

### When increasing quantity:
- ✅ If stock available → Quantity increases
- ⚠️ If at limit → Toast: "Максимальна кількість у наявності: X"
- 🔒 Button becomes disabled

### When opening cart:
- 🔍 Automatic validation runs in background
- 📉 Quantities auto-adjust if stock decreased
- 💬 User notified: "Кількість деяких товарів змінено згідно наявності"

## Visual Indicators

| Stock Level | Display |
|-------------|---------|
| Plenty available | Normal controls |
| 1-5 left | 🟠 Orange text: "Залишилось: X шт" |
| At maximum | 🔴 Red text: "Максимум: X шт" + Disabled button |

## Technical Details

### Database Query
```javascript
// Checks: products/{productId}.available_stock
// Falls back to: products/{productId}.stock
```

### Modified Functions
- `window.addToCart()` - Now async with stock check
- `window.updateQtyByIndex()` - Now async with stock check  
- `window.openCart()` - Now validates all cart items

### Performance
- Non-blocking: UI remains responsive
- Cached: Stock saved in cart items to reduce queries
- Fast: Typically completes in < 500ms

## Admin Actions

### To update stock:
1. Go to Firebase Console → Firestore
2. Navigate to `products/{productId}`
3. Update `available_stock` field
4. Changes reflect immediately when users:
   - Add items to cart
   - Increase quantities
   - Open cart sidebar

### Testing:
1. Set low stock (e.g., 3 units)
2. Try adding 5 to cart
3. Should cap at 3 with warning

## Files Modified

- **[public-site/js/layout.js](public-site/js/layout.js)** - Main cart logic

## Deployment

✅ **Status**: Live on production  
🌐 **URL**: https://my-magazin-81c96.web.app  
📅 **Deployed**: February 3, 2026

## Support

If customers report issues:
1. Check Firestore for correct `available_stock` values
2. Verify products have valid IDs in cart
3. Check browser console for error messages

---

**Ready to use!** 🚀
