# 🔥 Firebase Storage Setup Instructions

## Issue
The Firebase Storage API needs to be enabled for the project before deploying storage rules and uploading images.

## Steps to Enable Firebase Storage

### Option 1: Firebase Console (Recommended)
1. Go to [Firebase Console](https://console.firebase.google.com/project/my-magazin-81c96)
2. Click **Storage** in the left sidebar
3. Click **Get Started**
4. Choose **Start in production mode** or **Start in test mode**
5. Select a Cloud Storage location (preferably same as Firestore)
6. Click **Done**

### Option 2: Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/library/firebasestorage.googleapis.com?project=my-magazin-81c96)
2. Click **Enable** button
3. Wait for activation (may take 1-2 minutes)

## After Enabling Storage

Once Storage is enabled, deploy the security rules:

```bash
firebase deploy --only storage
```

## Testing the Multi-Image Upload

1. **Login to Admin Panel**
   - Visit: https://my-magazin-81c96.web.app/admin.html
   - Use your admin credentials

2. **Add New Product**
   - Go to "Товари" tab
   - Click "Додати товар"
   - Fill in product details
   - Click "Вибрати зображення" and select 2-4 images
   - See live preview appear
   - Fill in description, specs, ingredients (optional)
   - Click "Додати товар"

3. **Verify Upload**
   - Check Firebase Console > Storage to see uploaded images
   - Check Firestore > products collection for new document
   - Visit category page to see product with first image
   - Click product to see gallery and content tabs

## Storage Rules Deployed

The current rules (in `storage.rules`):
- ✅ Public read access for all product images
- ✅ Upload/write restricted to authenticated admin users
- ✅ Images stored in `/products/` folder

## Current Status

✅ **Code deployed** - All JavaScript and HTML updated
✅ **Storage rules created** - `storage.rules` file ready
⏳ **Storage API** - Needs manual activation
⏳ **Rules deployment** - Run after API activation

## Next Steps

1. Enable Firebase Storage via console (see above)
2. Run `firebase deploy --only storage`
3. Test by adding a product with multiple images
4. Verify images appear on product page

---

**Note:** The quota error (`429 Quota exceeded`) is temporary and means you need to enable Storage via the Firebase Console instead of the CLI. This is a one-time setup.
