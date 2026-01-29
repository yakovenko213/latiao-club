# 💬 Live Chat & AI System - Setup Guide

## 🗄️ Firestore Database Structure

### Collection: `chats`
Each document represents a chat session with a unique user.

**Document ID:** Auto-generated or userID-based (e.g., `anon_1737724800000_abc123`)

**Document Fields:**
```javascript
{
  userId: "anon_1737724800000_abc123",      // Anonymous or authenticated user ID
  userName: "Гість 123",                      // Display name
  userEmail: null,                            // Email if authenticated
  lastMessage: "Привіт, є питання...",        // Preview for chat list
  lastMessageTime: Timestamp,                 // Last activity
  activePage: "/product.html",                // Current page user is on
  status: "active",                           // "active", "closed", "archived"
  aiMode: false,                              // true = AI handles replies, false = Admin
  unreadCount: 3,                             // Number of unread messages for admin
  createdAt: Timestamp,
  metadata: {
    userAgent: "Mozilla/5.0...",
    referrer: "https://google.com",
    language: "uk"
  }
}
```

### Sub-collection: `chats/{chatId}/messages`
Messages within each chat session.

**Document Fields:**
```javascript
{
  sender: "client",                           // "client", "admin", or "ai"
  senderName: "Гість 123",                    // Display name
  text: "Коли буде доставка?",                // Message content
  timestamp: Timestamp,
  read: false,                                // Read status
  type: "text"                                // "text", "system", "product_link"
}
```

### Document: `settings/chat_config`
Global chat widget settings.

**Document Fields:**
```javascript
{
  enabled: true,                              // Master switch
  activePages: [                              // Pages where chat is visible
    "/",
    "/index.html",
    "/category.html",
    "/product.html",
    "/checkout.html",
    "/cart.html"
  ],
  welcomeMessage: "Привіт! 👋 Чим можу допомогти?",
  aiEnabled: true,                            // Allow AI to handle chats
  offlineMessage: "Зараз всі адміністратори офлайн. Залиште повідомлення!",
  businessHours: {
    enabled: false,
    timezone: "Europe/Kyiv",
    schedule: {
      monday: { open: "09:00", close: "18:00" },
      tuesday: { open: "09:00", close: "18:00" },
      wednesday: { open: "09:00", close: "18:00" },
      thursday: { open: "09:00", close: "18:00" },
      friday: { open: "09:00", close: "18:00" },
      saturday: { open: "10:00", close: "14:00" },
      sunday: { open: null, close: null }
    }
  }
}
```

## 🔐 Firebase Security Rules

See `firestore-chat-rules.txt` for copy-paste ready rules.

## 📁 File Structure

```
js/
  ├── chat-widget.js          # Client-side chat widget
  └── admin-chat.js           # Admin chat management
  
css/
  └── chat-widget.css         # Widget styles (optional, can be inline)
  
admin.html                    # Updated with chat management section
```

## 🚀 Implementation Steps

1. **Deploy Firestore Rules:**
   ```bash
   firebase deploy --only firestore:rules
   ```

2. **Add Chat Widget to Site:**
   ```html
   <script type="module" src="js/chat-widget.js"></script>
   ```

3. **Enable Chat in Admin Panel:**
   - Navigate to "Онлайн чат | ШІ" section
   - Configure active pages in Settings tab
   - Toggle AI mode for automatic responses

## 🤖 AI Integration

The AI uses Gemini 2.0 Flash to:
- Answer product questions
- Provide order tracking
- Handle common FAQs
- Escalate to human admin when needed

**AI Prompt Template:**
```
You are a helpful customer service assistant for LATIAO SNACK online shop.
Answer questions about:
- Products and ingredients
- Delivery and shipping
- Payment methods
- Order status

Be friendly, concise, and professional. Use Ukrainian language.
If you cannot answer, suggest contacting a human admin.
```

## 📊 Usage Analytics (Future Enhancement)

Track:
- Total chats per day
- Average response time
- AI vs Human resolution rate
- Most common questions
- Customer satisfaction ratings

---

**Created:** 2026-01-24  
**Version:** 1.0.0
