# 🌶️ Latiao Snack — E-Commerce Platform

[![Firebase Hosting](https://img.shields.io/badge/Hosted%20on-Firebase-FFCA28?style=flat&logo=firebase)](https://my-magazin-81c96.web.app)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.x-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

A fully functional **Single Page Application (SPA)** e-commerce platform for selling authentic Chinese spicy snacks in Ukraine. Built with vanilla JavaScript (ES Modules) and powered by Firebase backend services.

![Latiao Snack Banner](images/banner.png)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [Admin Panel](#-admin-panel)
- [API Integrations](#-api-integrations)
- [Deployment](#-deployment)
- [Documentation](#-documentation)
- [License](#-license)

---

## ✨ Features

### 🛒 Storefront
- **Dynamic Product Catalog** — Products rendered from Firestore in real-time
- **Category Filtering** — Filter by category, spiciness level, price
- **Hot/Bestseller Sections** — Highlighted products with custom badges
- **Shopping Cart** — Persistent cart using `localStorage`
- **Smart Checkout** — Order validation with Nova Poshta API integration
- **Hybrid Page Loading** — Static HTML injection for special pages (e.g., `?slug=statistika`)
- **Custom Animations** — Fire effects, fade-ins, and smooth transitions

### 👤 Mini-CRM System
- **Automatic Customer Profiles** — Created/updated on each order
- **Customer Tracking** — Phone number as unique key
- **Order History** — Full order IDs linked to customer
- **LTV Calculation** — `totalSpent` and `ordersCount` auto-incremented
- **Smart Merge** — Uses `setDoc` with `merge: true` for atomic operations

### 🔧 Admin Panel
- **Secure Authentication** — Firebase Auth for admin access
- **Product CRUD** — Create, Read, Update, Delete products
- **Smart Import** — Bulk import from Shopify/Excel (CSV/XLSX)
- **Page Management** — CMS-like pages with drag-and-drop sorting
- **Order Management** — View, process, and track orders
- **Promo Codes** — Create and manage discount codes

### 📱 User Experience
- **Mobile-First Design** — Fully responsive with Tailwind CSS
- **Fast Loading** — CDN-based libraries, optimized assets
- **SEO-Friendly** — Dynamic page titles and meta tags
- **Accessibility** — Semantic HTML and ARIA labels

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | HTML5, Tailwind CSS (CDN), JavaScript ES6+ Modules |
| **Backend** | Firebase Firestore, Authentication, Storage |
| **Cloud Functions** | Node.js (Firebase Functions) |
| **Payment** | Monobank API Integration |
| **Shipping** | Nova Poshta API, Ukrposhta API |
| **Libraries** | SheetJS (xlsx), Lucide Icons |
| **Hosting** | Firebase Hosting |

---

## 📁 Project Structure

```
latiao-club/
├── index.html              # 🏠 Main storefront page
├── admin.html              # 🔐 Admin panel
├── checkout.html           # 💳 Checkout flow
├── cart.html               # 🛒 Shopping cart page
├── page.html               # 📄 Dynamic page renderer
├── product.html            # 📦 Single product view
├── login.html              # 🔑 Admin login
├── thank-you.html          # ✅ Order confirmation
│
├── js/
│   ├── admin.js            # 👨‍💼 Admin panel logic + Mini-CRM
│   ├── storefront.js       # 🛍️ Storefront functionality
│   ├── firebase-init.js    # 🔥 Firebase initialization & exports
│   ├── firebase-config.js  # ⚙️ Firebase configuration
│   ├── layout.js           # 📐 Shared layout components
│   ├── navigation.js       # 🧭 Dynamic navigation loader
│   ├── popup-manager.js    # 💬 Modal & popup management
│   ├── app.js              # 🚀 Main application entry
│   └── config.js           # 🔧 App configuration
│
├── css/
│   └── styles.css          # 🎨 Custom styles (extends Tailwind)
│
├── images/                 # 🖼️ Static assets
│   └── reviews/            # 📸 Customer review images
│
├── functions/              # ☁️ Firebase Cloud Functions
│   ├── index.js            # 🔌 Function definitions
│   └── package.json        # 📦 Functions dependencies
│
├── firebase.json           # 🔥 Firebase project config
├── firestore.rules         # 🔒 Database security rules
├── storage.rules           # 📁 Storage security rules
└── package.json            # 📦 Project dependencies
```

---

## 🚀 Installation

### Prerequisites

- [Node.js](https://nodejs.org/) v18+ 
- [Firebase CLI](https://firebase.google.com/docs/cli) installed globally
- A Firebase project with Firestore, Auth, and Storage enabled

### Clone Repository

```bash
git clone https://github.com/yakovenko213/latiao-club.git
cd latiao-club
```

### Install Dependencies

```bash
# Install root dependencies (if any)
npm install

# Install Cloud Functions dependencies
cd functions
npm install
cd ..
```

---

## ⚙️ Configuration

### 1. Firebase Setup

Create or update `js/firebase-config.js` with your Firebase credentials:

```javascript
// js/firebase-config.js
export const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

> ⚠️ **Security Note:** Never commit API keys to public repositories. Use environment variables or Firebase's automatic configuration for production.

### 2. Firestore Collections

The app expects the following Firestore collections:

| Collection | Description |
|------------|-------------|
| `products` | Product catalog |
| `orders` | Customer orders |
| `customers` | Mini-CRM customer profiles |
| `pages` | Dynamic CMS pages |
| `categories` | Product categories |
| `promocodes` | Discount codes |
| `abandoned_carts` | Cart recovery data |

### 3. Firebase Authentication

Enable **Email/Password** authentication in Firebase Console for admin access.

---

## 📖 Usage

### Development Server

Use any static file server or Firebase's local emulator:

```bash
# Option 1: Firebase Emulator
firebase emulators:start

# Option 2: Simple HTTP server
npx serve .

# Option 3: VS Code Live Server extension
```

### Accessing the Store

- **Storefront:** `http://localhost:5000/`
- **Admin Panel:** `http://localhost:5000/admin.html`
- **Dynamic Pages:** `http://localhost:5000/page.html?slug=YOUR_SLUG`

---

## 🔐 Admin Panel

### Authentication

1. Navigate to `/admin.html`
2. Login with Firebase Auth credentials
3. Access full admin functionality

### Key Features

#### Product Management
```
📦 Products → Add/Edit/Delete products
   - Name, Price, Description
   - Multiple images upload
   - Spiciness level (0-5)
   - Stock management
   - Category assignment
```

#### Smart Import (Shopify/Excel)
```javascript
// Supported file formats: .xlsx, .xls, .csv
// Auto-maps columns:
// - Title → name
// - Variant Price → price
// - Image Src → image
// - Variant SKU → sku
// - Tags → spiciness detection
```

#### Mini-CRM Integration
```javascript
// Automatically triggered on order creation
// Customer document ID = normalized phone number
await syncCustomerFromOrder(orderData, orderId);

// Customer profile structure:
{
  phone: "380991234567",
  fullName: "Іван Петренко",
  ordersCount: 5,        // auto-incremented
  totalSpent: 2500,      // auto-incremented
  orderIds: ["id1", "id2"],
  lastOrderDate: Timestamp
}
```

#### Page Management (CMS)
- Create pages with custom slugs
- Drag-and-drop sorting via `sortOrder` field
- Rich text content support
- Active/Inactive toggle

---

## 🔌 API Integrations

### Nova Poshta API
- City search with autocomplete
- Warehouse/branch lookup
- Delivery cost calculation

### Monobank API
- Online payment processing
- Invoice generation
- Payment status webhooks

### Ukrposhta API
- Alternative shipping option
- Address validation

---

## 🚀 Deployment

### Deploy to Firebase Hosting

```bash
# Build and deploy everything
firebase deploy

# Deploy only hosting
firebase deploy --only hosting

# Deploy only functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:createMonoInvoice
```

### Production URL

```
https://my-magazin-81c96.web.app
```

---

## 📚 Documentation

Additional documentation files included in the repository:

| File | Description |
|------|-------------|
| `QUICKSTART.md` | Quick setup guide |
| `FIREBASE_DATABASE_SETUP.md` | Firestore setup instructions |
| `FIREBASE_STORAGE_SETUP.md` | Storage configuration |
| `MONOBANK_SETUP.md` | Payment integration guide |
| `NOVA_POSHTA_API.md` | Shipping API documentation |
| `PROMOCODES_SETUP.md` | Promo code system guide |
| `SMS_SETUP.md` | SMS notifications setup |
| `POPUP_MANAGER_DOCS.md` | Modal system documentation |

---

## 🔒 Security

### Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Products: public read, admin write
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Orders: authenticated create, admin read/write
    match /orders/{orderId} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }
    
    // Customers: admin only
    match /customers/{customerId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 👨‍💻 Author

**Latiao Snack Team**

- Website: [my-magazin-81c96.web.app](https://my-magazin-81c96.web.app)
- GitHub: [@yakovenko213](https://github.com/yakovenko213)

---

<p align="center">
  Made with 🔥 and 🌶️ in Ukraine
</p>
