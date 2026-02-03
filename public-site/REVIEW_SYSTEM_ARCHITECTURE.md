# 🎯 Персоналізована система відгуків - Архітектурна схема

## 📐 Система архітектури

```
┌──────────────────────────────────────────────────────────────────────┐
│                         LATIAO REVIEW SYSTEM v2.3.0                  │
└──────────────────────────────────────────────────────────────────────┘

層 1: CUSTOMER EXPERIENCE
═══════════════════════════════════════════════════════════════════════

  [1] Order Delivered              [2] SMS Received
  ┌─────────────────┐             ┌────────────────────────────────┐
  │ Status: Delivered            │ Привіт, Олена! 👋              │
  │ Total: ₴500                  │ Залишити відгук за 30 сек:    │
  │ Items: 3                      │ https://latiao-.../review?...  │
  └──────────┬──────┘             └────────────────┬───────────────┘
             │                                      │
             │                                      │
             └──────────────────────────────────────┘
                          │ (натиск на посилання)
                          ▼
              ┌────────────────────────────┐
              │  REVIEW MODAL OPENS        │
              ├────────────────────────────┤
              │ ⭐ Залишити відгук        │
              │ Замовлення #12345          │
              │ Товар 1 ×1    ₴45         │
              │ Товар 2 ×2    ₴90         │
              │ Номер: [+38...]           │
              │ Оцінка: ⭐⭐⭐⭐⭐      │
              │ Відгук: [textarea]        │
              │ Фото: [upload]            │
              │ [Надіслати]               │
              └──────────┬─────────────────┘
                         │ (form submit)
                         ▼
              ┌────────────────────────────┐
              │ SUCCESS MESSAGE            │
              │ 🎉 Дякуємо за відгук!    │
              └────────────────────────────┘


層 2: BACKEND PROCESSING
═══════════════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────────────┐
  │                     ADMIN PANEL                                 │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                  │
  │  Settings → Review Requests:                                    │
  │  ├─ SMS Templates (with {review_link})                         │
  │  ├─ TurboSMS Credentials                                       │
  │  └─ Auto-send enabled                                          │
  │                                                                  │
  │  Orders Table:                                                  │
  │  ├─ Order #12345 [Send Review Request] (clicking...)          │
  │  ├─ Order #12346 ✅ Sent                                       │
  │  └─ Order #12347 [Resend] (retry)                             │
  └─────────────┬──────────────────────────────────────────────────┘
                │
                │ generateReviewLink() + replaceSmsTemplateTags()
                │
                ▼
  ┌──────────────────────────────────────────────────────────┐
  │            MESSAGE GENERATION                            │
  │  ┌─────────────────────────────────────────────────────┐ │
  │  │ Template: "Привіт, {customer_name}! ..."           │ │
  │  │ After Replace:                                      │ │
  │  │ "Привіт, Олена!                                    │ │
  │  │  Залишити відгук:                                  │ │
  │  │  https://latiao-snack.com.ua/review?               │ │
  │  │  orderId=p9x5mZ7qL2vN8hK3jF6w"                    │ │
  │  └─────────────────────────────────────────────────────┘ │
  └─────────────┬──────────────────────────────────────────────┘
                │
                ▼
  ┌──────────────────────────────────────────────────────────┐
  │            TURBOSMS API                                  │
  │  POST https://api.turbosms.ua/message/send.json         │
  │  {                                                       │
  │    recipients: ["+380501234567"],                       │
  │    sms: {                                               │
  │      sender: "Latiao",                                  │
  │      text: "Привіт, Олена! Залишити відгук:..."       │
  │    }                                                    │
  │  }                                                      │
  └─────────────┬──────────────────────────────────────────┘
                │ (SMS sent to customer)
                ▼


層 3: DATA STORAGE
═══════════════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────────────┐
  │                    FIRESTORE DATABASE                           │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                  │
  │  Collection: ORDERS                                            │
  │  ├─ Document: p9x5mZ7qL2vN8hK3jF6w                            │
  │  │  ├─ orderNumber: 12345                                      │
  │  │  ├─ customer:                                               │
  │  │  │  ├─ fullName: "Олена Петренко"                          │
  │  │  │  ├─ phone: "+380501234567"                              │
  │  │  │  └─ email: "olena@example.com"                          │
  │  │  ├─ items: [                                               │
  │  │  │  ├─ {name: "Чіпси", price: 45, quantity: 1, image: ...}│
  │  │  │  └─ {name: "Сухарики", price: 90, quantity: 2, ...}    │
  │  │  ├─ status: "delivered"                                    │
  │  │  ├─ reviewRequestSentAt: Timestamp (2026-02-02 15:30)      │
  │  │  ├─ reviewRequestTemplateId: "template_001"                │
  │  │  └─ reviewId: "review_abc123" ← LINKED                     │
  │  │                                                              │
  │  Collection: REVIEWS                                           │
  │  ├─ Document: review_abc123                                    │
  │  │  ├─ orderId: "p9x5mZ7qL2vN8hK3jF6w" ← LINK BACK           │
  │  │  ├─ phoneNumber: "+380501234567"                           │
  │  │  ├─ rating: 5                                              │
  │  │  ├─ text: "Чудовий товар, швидка доставка! Дякую ..."     │
  │  │  ├─ photoUrl: "https://storage/.../123456_photo.jpg"      │
  │  │  ├─ status: "pending" → (admin approves) → "approved"      │
  │  │  ├─ source: "personalized_review_link"                     │
  │  │  └─ createdAt: Timestamp (2026-02-02 16:15)               │
  │  │                                                              │
  │  Collection: SETTINGS                                         │
  │  ├─ Document: config                                          │
  │  │  ├─ turboSmsToken: "Bearer abc123..."                      │
  │  │  ├─ senderName: "Latiao"                                   │
  │  │  ├─ reviewSettings: {                                      │
  │  │  │  ├─ templates: [                                        │
  │  │  │  │  ├─ {id: "template_001", name: "Friendly",          │
  │  │  │  │  │   content: "Привіт, {customer_name}! ..."}       │
  │  │  │  │  ├─ {id: "template_002", name: "Short",             │
  │  │  │  │  │   content: "{customer_name}, поділись ..."}      │
  │  │  │  │  └─ ...                                             │
  │  │  │  ├─ autoSend: true                                      │
  │  │  │  └─ minDaysAfterDelivery: 0                             │
  │  │  └─ }                                                      │
  │  │                                                             │
  │  Collection: FIREBASE_STORAGE                                 │
  │  └─ Folder: reviews/                                          │
  │     ├─ 1738532100_photo.jpg (customer photo)                  │
  │     ├─ 1738532115_review_image.png                            │
  │     └─ ...                                                    │
  │                                                               │
  └─────────────────────────────────────────────────────────────┘


LAYER 4: CODE MODULES
═════════════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────┐
  │           review-personalized.html                      │
  ├─────────────────────────────────────────────────────────┤
  │                                                          │
  │ ├─ On Load:                                            │
  │ │  ├─ Get orderId from URL params                      │
  │ │  ├─ Fetch order from Firestore                       │
  │ │  └─ Show modal with order data                       │
  │ │                                                       │
  │ ├─ Form Handling:                                      │
  │ │  ├─ Star rating selector                            │
  │ │  ├─ Text validation (20-5000 chars)                 │
  │ │  ├─ Photo upload + preview                          │
  │ │  └─ Submit handler                                  │
  │ │                                                       │
  │ ├─ On Submit:                                         │
  │ │  ├─ Validate form data                              │
  │ │  ├─ Upload photo to Firebase Storage                │
  │ │  ├─ Create review document in Firestore             │
  │ │  ├─ Update order with reviewId                      │
  │ │  └─ Show success message                            │
  │ │                                                       │
  │ └─ Utilities:                                         │
  │    ├─ previewPhoto()                                  │
  │    ├─ removePhoto()                                   │
  │    └─ showError()                                     │
  │                                                       │
  └─────────────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────┐
  │          js/review-system.js                     │
  ├──────────────────────────────────────────────────┤
  │                                                  │
  │ class ReviewSystem {                            │
  │   // URL Generation                            │
  │   static generateReviewLink(orderId)           │
  │                                                │
  │   // Data Formatting                          │
  │   static formatOrderData(orderData)           │
  │   static formatPhoneNumber(phone)             │
  │   static getRatingEmoji(rating)               │
  │                                               │
  │   // Validation                               │
  │   static validateReviewForm(formData)         │
  │   static isOrderEligibleForReview(order)      │
  │                                               │
  │   // SMS Integration                         │
  │   static replaceSmsTemplateTags(template, order)
  │                                               │
  │   // Data Creation                           │
  │   static createReviewObject(data)            │
  │   static generateOrderSummary(order)         │
  │ }                                             │
  │                                               │
  └──────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────┐
  │       admin-site/index.html (existing)           │
  ├──────────────────────────────────────────────────┤
  │                                                  │
  │ function sendReviewRequest(orderId) {           │
  │   1. Load global TurboSMS settings             │
  │   2. Validate review settings & templates      │
  │   3. Get phone & order data                    │
  │   4. Select RANDOM template (anti-spam)       │
  │   5. Replace template tags (includes review_link)
  │   6. Send SMS via TurboSMS API               │
  │   7. Update Firestore with sent timestamp    │
  │   8. Show success message                     │
  │ }                                              │
  │                                                │
  │ function replaceTemplateTags(template, order) {│
  │   Replace:                                    │
  │   - {customer_name}  → order.customer.fullName│
  │   - {order_id}       → order.orderNumber       │
  │   - {product_list}   → formatted items         │
  │   - {review_link}    → generated URL          │
  │ }                                              │
  │                                                │
  └──────────────────────────────────────────────────┘


LAYER 5: FULL DATA FLOW
═════════════════════════════════════════════════════════════════════

  USER                  SMS                   SERVER                STORAGE
  ═══════════════════════════════════════════════════════════════════════════

  [Receives]
  Order                                       Generated:
  └─ Mark as                                  reviewRequestSentAt ─→ Firestore
     Delivered          TurboSMS API          reviewRequestTemplateId
       │
       │ (3-5 days later)
       │
  [Gets SMS]
       │
       ├─────────────────────────→ "Привіт! Залишити відгук: ..."
       │                           {review_link} = personalized URL
       │
       │ [Clicks link]
       │
       └────────────────────────→ browser: /review?orderId=abc123
                                    │
                                    ├─→ Fetch order data ─→ Firestore
                                    │
                                    └─→ Show modal form
       │
       │ [Fills form]
       │
       ├─ Phone number
       ├─ Rating (1-5)
       ├─ Review text
       └─ Photo (optional)
             │
             │ [Submit]
             │
             └──────────────────→ Upload photo ────────→ Firebase Storage
                                    │                     (secure)
                                    │
                                    ├─ Create review doc ─→ Firestore
                                    │  {
                                    │    orderId,
                                    │    rating,
                                    │    text,
                                    │    photoUrl,
                                    │    status: "pending"
                                    │  }
                                    │
                                    └─ Update order
                                       {reviewId}
                                         │
                                         └─→ Firestore
                                            (link review to order)

  [See success]
  🎉 Дякуємо              Admin Panel sees:
      │                   - New pending review
      │                   - Can approve/reject
      │
      │                   After approval:
      │                   - Review appears on site
      └─────────────────→ status: "approved"
                                   │
                                   └─→ Public Site displays


LAYER 6: SECURITY & VALIDATION
═════════════════════════════════════════════════════════════════════

  INPUT VALIDATION:
  ┌─────────────────────────────────┐
  │ Phone Number                     │
  │ └─ Format check                 │
  │ └─ Required field               │
  │                                 │
  │ Rating                          │
  │ └─ 1-5 range check              │
  │ └─ Number validation            │
  │                                 │
  │ Review Text                     │
  │ └─ Min 20 characters            │
  │ └─ Max 5000 characters          │
  │ └─ No XSS scripts               │
  │                                 │
  │ Photo Upload                    │
  │ └─ Image type check             │
  │ └─ Max 5MB size                 │
  │ └─ Filename sanitization        │
  └─────────────────────────────────┘

  FIRESTORE SECURITY:
  ┌─────────────────────────────────┐
  │ Rules:                          │
  │ ├─ Public read: orders          │
  │ ├─ Public write: reviews        │
  │ │  (with data validation)       │
  │ ├─ Admin only: update/delete    │
  │ └─ Rate limiting: per IP        │
  └─────────────────────────────────┘

  FIREBASE STORAGE:
  ┌─────────────────────────────────┐
  │ Photos stored securely:         │
  │ ├─ Path: reviews/{timestamp}    │
  │ ├─ Permissions: public read     │
  │ └─ Lifecycle: 2-year retention  │
  └─────────────────────────────────┘
```

---

## 🔄 Component Interactions

```
┌─────────────────────────────────────────────────────┐
│                  COMPONENT DIAGRAM                  │
└─────────────────────────────────────────────────────┘

    review-personalized.html ◄──────────────┐
           │                                │
           │ imports                        │
           │                                │
           ▼                                │
    js/review-system.js ──── reviews ───────┼─── admin-site/index.html
           │                                │
           │ uses                           │
           │                                │
           ▼                                │
    ReviewSystem class:                     │
    - generateReviewLink()                  │
    - validateReviewForm()                  │
    - formatOrderData()                     │
    - replaceSmsTemplateTags()              │
    - createReviewObject()                  │
           │                                │
           └────────────────────────────────┘

    Firebase (shared):
    ├─ Firestore (data)
    ├─ Storage (photos)
    └─ Auth (credentials)
```

---

## 📈 Scaling Considerations

```
CURRENT STATE (v2.3.0)
═════════════════════════════════════════════════════

Single region (Firebase)
┌──────────────────────┐
│ Firestore            │
│ ├─ orders            │ (unlimited)
│ ├─ reviews           │ (unlimited)
│ └─ settings          │ (1 doc)
│                      │
│ Storage              │
│ └─ reviews/photos    │ (unlimited)
└──────────────────────┘

Current Limits:
- Reviews per order: 1 (but supports multiple)
- Photos per review: 1 (but supports upload)
- SMS per hour: Limited by TurboSMS

FUTURE STATE (v3.0+)
═════════════════════════════════════════════════════

Multi-region with CDN
┌──────────────────────┐
│ Firestore            │
│ (auto-replicated)    │
└──────────────────────┘
        │
        ├─ Cache Layer (Redis)
        │
        ├─ CDN (for photos)
        │
        ├─ Analytics (BigQuery)
        │
        └─ Search (Algolia)

Enhanced Features:
- Multiple photos per review
- Video reviews
- Review search
- Analytics dashboard
- AI moderation
```

---

## 🎯 Файлова структура

```
latiao-club/
├── public-site/
│   ├── review-personalized.html          ⭐ MAIN FILE
│   ├── review.html                        (old, keep for reference)
│   ├── js/
│   │   ├── review-system.js               ⭐ UTILITIES
│   │   └── ... (інші скрипти)
│   ├── REVIEW_SYSTEM_COMPLETE.md          📖 FULL DOCS
│   ├── REVIEW_QUICKSTART.md               📖 QUICK START
│   ├── REVIEW_IMPLEMENTATION.md           📖 DEPLOYMENT
│   └── ... (інші файли)
│
├── admin-site/
│   ├── index.html                         (contains sendReviewRequest function)
│   └── ... (інші файли)
│
├── check-review-system.sh                 ✅ VALIDATION SCRIPT
├── REVIEW_SYSTEM_DELIVERY.md              📋 DELIVERY SUMMARY
└── REVIEW_SYSTEM_ARCHITECTURE.md          📐 THIS FILE
```

---

**Версія:** 2.3.0  
**Дата:** 2026-02-03  
**Статус:** ✅ Complete & Production Ready
