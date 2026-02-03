# Architecture Diagram 🏗️

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Admin Panel UI Layer                        │
│                    (admin-site/index.html)                      │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Review Requests Section                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Header: [Filter] [⚙️ Settings] [🔄 Refresh]            │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  Orders Table                                            │   │
│  │  ┌───────┬──────────┬─────────┬────────┬─────────────┐  │   │
│  │  │ Order │ Customer │ Items   │ Total  │ Action      │  │   │
│  │  ├───────┼──────────┼─────────┼────────┼─────────────┤  │   │
│  │  │ #0001 │ Ivan     │ 3 items │ 250 ₴  │ [WhatsApp]  │  │   │
│  │  └───────┴──────────┴─────────┴────────┴─────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │ Click Settings ⚙️
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Settings Modal (NEW)                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Header: [Налаштування запитів відгуків]        [✕]   │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  📝 Message Templates Section (Blue)                    │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │ [New Template Textarea]            [Додати]     │   │   │
│  │  ├─────────────────────────────────────────────────┤   │   │
│  │  │ 📄 Template 1: "Привіт {customer_name}..." [🗑️] │   │   │
│  │  │ 📄 Template 2: "Дякуємо за покупку..."      [🗑️] │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  ⚡ Automation Rules Section (Purple)                  │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │ [🔘 Enable/Disable Toggle]                      │   │   │
│  │  │ Days: [1] Hours: [0]                           │   │   │
│  │  │ ℹ️ Preview: "1 день 0 годин"                    │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  [Скасувати]                   [💾 Зберегти]          │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │ Save
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Firestore Database                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Collection: settings                                    │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │  Document: review_automation                    │    │   │
│  │  │  {                                              │    │   │
│  │  │    templates: [                                 │    │   │
│  │  │      { id, text, createdAt }                    │    │   │
│  │  │    ],                                           │    │   │
│  │  │    automation: {                                │    │   │
│  │  │      enabled: true,                             │    │   │
│  │  │      days: 1,                                   │    │   │
│  │  │      hours: 0                                   │    │   │
│  │  │    }                                            │    │   │
│  │  │  }                                              │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

### 1. Opening Settings Modal

```
User Action              JavaScript Function           Firestore Query
───────────────────────  ──────────────────────────   ───────────────────
                                                       
Click ⚙️ Settings   →   openReviewSettingsModal()   
                         │
                         ├─→ Show Modal (remove 'hidden')
                         │   
                         ├─→ loadReviewSettings()    →  getDoc('settings/review_automation')
                         │                              │
                         │                              ├─→ Return: { templates, automation }
                         │                              │
                         ←─────────────────────────────┘
                         │
                         ├─→ Update UI (populate inputs)
                         │
                         └─→ renderTemplatesList()
```

### 2. Adding Template

```
User Action              JavaScript Function           Local State
───────────────────────  ──────────────────────────   ───────────────────

Type in textarea    →   (Input captured)
                         
Click "Додати"      →   addMessageTemplate()
                         │
                         ├─→ Read textarea value
                         │
                         ├─→ Create template object:
                         │   { id, text, createdAt }
                         │
                         ├─→ Push to reviewSettings.templates
                         │
                         ├─→ Clear textarea
                         │
                         └─→ renderTemplatesList()
                              │
                              └─→ Update DOM with new template
```

### 3. Toggling Automation

```
User Action              JavaScript Function           UI State
───────────────────────  ──────────────────────────   ───────────────────

Click Toggle        →   toggleAutoSend()
                         │
                         ├─→ reviewSettings.automation.enabled = !enabled
                         │
                         ├─→ if (enabled):
                         │   └─→ enableAutoSendUI()
                         │       ├─→ Toggle → Purple
                         │       ├─→ Dot → Right
                         │       └─→ Inputs → Active
                         │
                         └─→ else:
                             └─→ disableAutoSendUI()
                                 ├─→ Toggle → Gray
                                 ├─→ Dot → Left
                                 └─→ Inputs → Disabled
```

### 4. Saving Settings

```
User Action              JavaScript Function           Firestore Write
───────────────────────  ──────────────────────────   ───────────────────

Click "Зберегти"    →   saveReviewSettings()
                         │
                         ├─→ Collect form values
                         │   (days, hours)
                         │
                         ├─→ Update reviewSettings object
                         │
                         └─→ setDoc('settings/review_automation',   →  Write to Firestore
                                    { templates, automation })         │
                                    │                                  │
                                    ←──────────────────────────────────┘
                                    │
                                    ├─→ showToast('Success')
                                    │
                                    └─→ closeReviewSettingsModal()
```

---

## Component Hierarchy

```
Admin Panel (index.html)
│
├── Sidebar Navigation
│   └── Reviews Section
│       └── "Запит відгуків" Tab
│
├── Review Requests Content
│   ├── Template Editor (Existing)
│   │   └── Save Template Button
│   │
│   └── Orders Table
│       ├── Header
│       │   ├── Filter Dropdown
│       │   ├── ⚙️ Settings Button  ← NEW
│       │   └── 🔄 Refresh Button
│       │
│       └── Table Body
│           └── Order Rows
│               └── WhatsApp Send Button
│
└── Review Settings Modal  ← NEW
    ├── Modal Overlay (backdrop)
    │
    └── Modal Container
        ├── Header
        │   ├── Title + Icon
        │   └── Close Button (✕)
        │
        ├── Body (scrollable)
        │   ├── Templates Section
        │   │   ├── Add Template Form
        │   │   │   ├── Textarea
        │   │   │   └── Add Button
        │   │   │
        │   │   └── Templates List
        │   │       └── Template Cards
        │   │           ├── Text Display
        │   │           └── Delete Button
        │   │
        │   └── Automation Section
        │       ├── Enable Toggle
        │       ├── Timing Inputs
        │       │   ├── Days Input
        │       │   └── Hours Input
        │       │
        │       └── Preview Text
        │
        └── Footer
            ├── Cancel Button
            └── Save Button
```

---

## State Management

```javascript
// Global State Object
reviewSettings = {
  templates: [
    {
      id: "1738608000000",
      text: "Template text with {placeholders}",
      createdAt: "2026-02-03T10:00:00.000Z"
    }
  ],
  automation: {
    enabled: false,  // Toggle state
    days: 1,         // 0-30
    hours: 0         // 0-23
  }
}

// State Sources
┌─────────────────┐
│  Local State    │  ← In-memory during session
│  (reviewSettings)│
└────────┬────────┘
         │
         ├─→ Load from Firestore on modal open
         │
         └─→ Save to Firestore on button click

┌─────────────────┐
│  Firestore DB   │  ← Persistent storage
│  settings/      │
│  review_automation
└─────────────────┘
```

---

## Function Call Graph

```
User Opens Modal
│
└─→ openReviewSettingsModal()
     ├─→ modal.classList.remove('hidden')
     ├─→ loadReviewSettings()
     │    ├─→ getDoc(db, 'settings', 'review_automation')
     │    ├─→ reviewSettings = data
     │    ├─→ document.getElementById(...).value = ...
     │    └─→ enableAutoSendUI() or disableAutoSendUI()
     │
     ├─→ renderTemplatesList()
     │    └─→ container.innerHTML = templates.map(...)
     │
     └─→ lucide.createIcons()

User Adds Template
│
└─→ addMessageTemplate()
     ├─→ textarea.value.trim()
     ├─→ reviewSettings.templates.push({...})
     ├─→ textarea.value = ''
     ├─→ renderTemplatesList()
     └─→ showToast('Template added')

User Toggles Automation
│
└─→ toggleAutoSend()
     ├─→ reviewSettings.automation.enabled = !enabled
     └─→ if enabled: enableAutoSendUI()
         else: disableAutoSendUI()

User Changes Timing
│
└─→ Input Event
     └─→ updateTimingPreview()
          ├─→ Read days and hours inputs
          └─→ Update preview text

User Saves Settings
│
└─→ saveReviewSettings()
     ├─→ reviewSettings.automation.days = parseInt(...)
     ├─→ reviewSettings.automation.hours = parseInt(...)
     ├─→ setDoc(db, 'settings', 'review_automation', {...})
     ├─→ showToast('Settings saved')
     └─→ closeReviewSettingsModal()
```

---

## Separation of Concerns

```
┌─────────────────────────────────────────────────────────────┐
│  EXISTING FUNCTIONALITY (Unchanged)                         │
├─────────────────────────────────────────────────────────────┤
│  • loadReviewRequests()         ← Fetches orders           │
│  • renderReviewRequests()        ← Displays orders table   │
│  • sendReviewRequest(orderId)   ← Opens WhatsApp           │
│  • resendReviewRequest(orderId) ← Resends request          │
│  • filterReviewRequests()        ← Filters table           │
│  • saveReviewTemplate()          ← Saves main template     │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ No Dependencies
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  NEW FUNCTIONALITY (Isolated)                               │
├─────────────────────────────────────────────────────────────┤
│  • openReviewSettingsModal()     ← Opens modal             │
│  • closeReviewSettingsModal()    ← Closes modal            │
│  • loadReviewSettings()          ← Loads from Firestore    │
│  • saveReviewSettings()          ← Saves to Firestore      │
│  • addMessageTemplate()          ← Adds template           │
│  • deleteTemplate()              ← Removes template        │
│  • renderTemplatesList()         ← Updates template UI     │
│  • toggleAutoSend()              ← Switches automation     │
│  • enableAutoSendUI()            ← Activates UI            │
│  • disableAutoSendUI()           ← Deactivates UI          │
│  • updateTimingPreview()         ← Updates preview text    │
└─────────────────────────────────────────────────────────────┘

STORAGE SEPARATION:
─────────────────────

Existing Template:
  settings/reviews → { template: "..." }

New Settings:
  settings/review_automation → { templates: [...], automation: {...} }
```

---

## Event Flow Timeline

```
Time  User Action              DOM Event           Function Called             Firestore Action
────  ───────────────────────  ──────────────────  ──────────────────────────  ──────────────────
t0    Page loads              DOMContentLoaded     (Existing functions)        -
t1    Clicks Reviews section  click                showReviews()              loadReviewRequests()
t2    Clicks Settings ⚙️       click                openReviewSettingsModal()  getDoc(...)
t3    Types in textarea       input                (None)                     -
t4    Clicks "Додати"         click                addMessageTemplate()       -
t5    Clicks Toggle           click                toggleAutoSend()           -
t6    Changes Days input      input                updateTimingPreview()      -
t7    Changes Hours input     input                updateTimingPreview()      -
t8    Clicks "Зберегти"       click                saveReviewSettings()       setDoc(...)
t9    Modal closes            (automatic)          closeReviewSettingsModal() -
t10   Toast appears           (automatic)          showToast()                -
```

---

## Security & Data Validation

```
Input Validation Layer
├── Template Text
│   ├── Trim whitespace
│   ├── Check not empty
│   └── Allow placeholders {customer_name}, {order_id}
│
├── Days Input
│   ├── Type: number
│   ├── Min: 0
│   └── Max: 30
│
└── Hours Input
    ├── Type: number
    ├── Min: 0
    └── Max: 23

Firestore Security Rules (Required)
├── Check user authentication
├── Verify admin role
└── Validate data structure
```

---

## Error Handling Flow

```
Try-Catch Blocks

loadReviewSettings()
├── try
│   ├── getDoc()
│   └── Update UI
└── catch
    ├── console.error()
    └── showToast('Error loading', 'error')

saveReviewSettings()
├── try
│   ├── setDoc()
│   ├── showToast('Success', 'success')
│   └── closeModal()
└── catch
    ├── console.error()
    └── showToast('Error saving', 'error')

addMessageTemplate()
├── if (empty text)
│   └── showToast('Warning', 'warning')
└── else
    └── Add template
```

---

**Last Updated**: 2026-02-03  
**Diagram Version**: 1.0  
**Format**: ASCII Text Diagrams
