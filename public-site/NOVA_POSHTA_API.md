# 🚚 Nova Poshta API Integration - Complete Guide

## ✅ Implementation Status: **ACTIVE**

The Nova Poshta API integration is fully implemented and working on your checkout page!

---

## 📋 Configuration

### API Credentials
Located in `checkout.html` at the top of `<script type="module">`:

```javascript
const NP_API_KEY = 'ca63f7a56b807b0e882e567c7041abf3'; // Your actual API key
const NP_URL = 'https://api.novaposhta.ua/v2.0/json/';
```

**Note:** This is your real API key. If you need to change it:
1. Get new key from: https://my.novaposhta.ua/settings/index
2. Replace the `NP_API_KEY` value

---

## 🎯 HTML Elements Structure

### City Input Field
```html
<input 
  type="text" 
  id="np-city-input"
  placeholder="Почніть вводити назву міста..." 
  autocomplete="off"
>
```

### City Suggestions List
```html
<ul id="np-city-list" class="hidden ..."></ul>
```
- **Initially hidden** (class `hidden`)
- Shows dynamically when user types
- Positioned absolutely below input

### Warehouse Select Dropdown
```html
<select 
  id="np-warehouse-select"
  disabled
>
  <option value="">Спочатку оберіть місто</option>
</select>
```
- **Initially disabled** until city is selected
- Populated dynamically after city selection

---

## 🔧 JavaScript Functions

### 1. City Search: `searchNovaPoshtaCities(searchQuery)`

**Purpose:** Search for cities as user types

**Trigger:** `input` event on `#np-city-input`

**API Call:**
```javascript
POST https://api.novaposhta.ua/v2.0/json/

Body:
{
  "apiKey": "YOUR_API_KEY",
  "modelName": "Address",
  "calledMethod": "searchSettlements",
  "methodProperties": {
    "CityName": "Київ",  // User's input
    "Limit": 50,
    "Page": 1
  }
}
```

**Response Structure:**
```json
{
  "success": true,
  "data": [
    {
      "TotalCount": 1,
      "Addresses": [
        {
          "Present": "м. Київ, Київська обл.",
          "MainDescription": "Київ",
          "Area": "Київська",
          "Region": "Київський",
          "SettlementTypeCode": "м.",
          "Ref": "e71629ce-...",
          "DeliveryCity": "8d5a980d-..." // ⭐ Used for warehouse loading
        }
      ]
    }
  ]
}
```

**Key Fields:**
- `Present` - Full city name to display (e.g., "м. Київ, Київська обл.")
- `DeliveryCity` - City reference ID for warehouse loading

**Features:**
- ✅ **Debouncing:** 300ms delay after user stops typing
- ✅ **Minimum length:** Requires 2+ characters
- ✅ **Loading state:** Shows "🔍 Пошук..." while fetching
- ✅ **Error handling:** Displays error message if API fails

---

### 2. Render City List: `renderCityAutocomplete(cities)`

**Purpose:** Display city suggestions in dropdown

**Actions:**
- Clears previous suggestions
- Creates `<li>` for each city
- Adds click handler to each item

**Click Action:**
1. Sets input value to selected city name
2. Saves `city.DeliveryCity` to `selectedCityRef`
3. Hides suggestion list
4. Calls `loadNovaPoshtaWarehouses(selectedCityRef)`

---

### 3. Load Warehouses: `loadNovaPoshtaWarehouses(cityRef)`

**Purpose:** Fetch all warehouses/branches in selected city

**API Call:**
```javascript
POST https://api.novaposhta.ua/v2.0/json/

Body:
{
  "apiKey": "YOUR_API_KEY",
  "modelName": "Address",
  "calledMethod": "getWarehouses",
  "methodProperties": {
    "CityRef": "8d5a980d-...", // From selected city
    "Limit": 99999
  }
}
```

**Response Structure:**
```json
{
  "success": true,
  "data": [
    {
      "Ref": "1ec09d88-...",
      "Description": "Відділення №1: вул. Хрещатик, 1",
      "ShortAddress": "Хрещатик, 1",
      "Number": "1",
      "TypeOfWarehouse": "9a68df70-...",
      "CategoryOfWarehouse": "Branch"
    }
  ]
}
```

**Key Fields:**
- `Ref` - Warehouse reference ID (saved as option value)
- `Description` - Full warehouse address (displayed to user)

**Features:**
- ✅ **Loading state:** Shows "⏳ Завантаження..." while fetching
- ✅ **Disabled state:** Select is disabled during loading
- ✅ **Error handling:** Shows error message if API fails
- ✅ **Auto-enable:** Select becomes enabled after successful load

---

### 4. Render Warehouses: `renderWarehouses(warehouses)`

**Purpose:** Populate select dropdown with warehouse options

**Actions:**
1. Clears previous options
2. Adds default "Оберіть відділення..." option
3. Loops through warehouses and creates `<option>` elements
4. Enables the select field

---

## 🎮 User Flow Example

### Step 1: User Types City Name
```
Input: "Ки"
→ Too short, no API call yet
```

### Step 2: User Types More
```
Input: "Київ"
→ API call triggered (after 300ms delay)
→ Shows loading: "🔍 Пошук..."
```

### Step 3: API Returns Results
```
Response: [ { Present: "м. Київ, Київська обл.", DeliveryCity: "8d5a980d-..." } ]
→ Renders suggestion list
→ User sees: "м. Київ, Київська обл."
```

### Step 4: User Clicks City
```
Action: Click on "м. Київ, Київська обл."
→ Input value set to "м. Київ, Київська обл."
→ selectedCityRef = "8d5a980d-..."
→ Suggestion list hidden
→ Triggers warehouse loading
```

### Step 5: Warehouses Load
```
API Call: getWarehouses with CityRef = "8d5a980d-..."
→ Shows loading: "⏳ Завантаження відділень..."
→ Select disabled during loading
```

### Step 6: Warehouses Rendered
```
Response: [ { Description: "Відділення №1: ...", Ref: "..." } ]
→ Select populated with options
→ Select enabled
→ User can now choose warehouse
```

---

## 🎯 Event Listeners

### Input Event on City Field
```javascript
document.getElementById('np-city-input').addEventListener('input', function(event) {
  searchNovaPoshtaCities(event.target.value);
});
```

### Click Outside to Close Suggestions
```javascript
document.addEventListener('click', function(event) {
  const cityInput = document.getElementById('np-city-input');
  const cityList = document.getElementById('np-city-list');
  
  if (!cityInput.contains(event.target) && !cityList.contains(event.target)) {
    cityList.classList.add('hidden');
  }
});
```

---

## 🧪 Testing Guide

### Test 1: City Search
1. Go to: https://my-magazin-81c96.web.app/checkout.html
2. Add items to cart first
3. Select "Нова Пошта" delivery method
4. Type "Київ" in city field
5. ✅ Should see suggestion list appear
6. ✅ Should see "м. Київ, Київська обл." in the list

### Test 2: City Selection
1. Click on a city from the list
2. ✅ City name should appear in input field
3. ✅ Suggestion list should close
4. ✅ Warehouse select should show "⏳ Завантаження відділень..."
5. ✅ After 1-2 seconds, warehouses should appear

### Test 3: Warehouse Selection
1. After city is selected and warehouses loaded
2. Click on warehouse dropdown
3. ✅ Should see list of warehouses/branches
4. ✅ Should see addresses like "Відділення №1: вул. Хрещатик, 1"

### Test 4: Console Logging
1. Open browser console (F12)
2. Type city name
3. ✅ Should see: No errors
4. Click city
5. ✅ Should see: Warehouse loading successful

---

## 🐛 Troubleshooting

### Issue 1: "Міст не знайдено"
**Causes:**
- Typo in city name
- City doesn't exist in Nova Poshta database
- API key is invalid

**Solution:**
- Try different city name (e.g., "Київ", "Львів", "Одеса")
- Verify API key is correct

### Issue 2: Suggestions Not Appearing
**Causes:**
- Less than 2 characters typed
- Network error
- Element ID mismatch

**Solution:**
- Type at least 2 characters
- Check browser console for errors
- Verify `#np-city-list` element exists in HTML

### Issue 3: Warehouses Not Loading
**Causes:**
- City not properly selected
- `selectedCityRef` is null
- API error

**Solution:**
- Make sure to click on a city from the list (not just type and leave)
- Check console for error messages
- Try selecting a different city

### Issue 4: Select Stays Disabled
**Causes:**
- City not selected
- API returned empty array
- JavaScript error during rendering

**Solution:**
- Select a city from the dropdown (don't just type)
- Check if city has warehouses in Nova Poshta system
- Open console and check for errors

---

## 📊 API Response Examples

### Successful City Search
```json
{
  "success": true,
  "data": [
    {
      "TotalCount": 1,
      "Addresses": [
        {
          "Present": "м. Київ, Київська обл.",
          "MainDescription": "Київ",
          "Area": "Київська",
          "Region": "Київський",
          "SettlementTypeCode": "м.",
          "Ref": "e71629ce-1d2b-11e4-acce-0050568002cf",
          "DeliveryCity": "8d5a980d-391c-11dd-90d9-001a92567626"
        }
      ]
    }
  ],
  "errors": [],
  "warnings": [],
  "info": [],
  "messageCodes": [],
  "errorCodes": [],
  "warningCodes": [],
  "infoCodes": []
}
```

### Successful Warehouse Load
```json
{
  "success": true,
  "data": [
    {
      "Ref": "1ec09d88-e1c2-11e3-8c4a-0050568002cf",
      "Description": "Відділення №1: вул. Хрещатик, 1",
      "ShortAddress": "Хрещатик, 1",
      "Number": "1",
      "TypeOfWarehouse": "9a68df70-0267-42a8-bb5c-37f427e36ee4",
      "CategoryOfWarehouse": "Branch",
      "Longitude": "30.523333",
      "Latitude": "50.450001"
    }
  ],
  "errors": [],
  "warnings": [],
  "info": []
}
```

### Error Response
```json
{
  "success": false,
  "data": [],
  "errors": ["Invalid API key"],
  "warnings": [],
  "info": []
}
```

---

## 🔗 Useful Links

- **Nova Poshta API Documentation:** https://developers.novaposhta.ua/
- **Get API Key:** https://my.novaposhta.ua/settings/index
- **API Explorer:** https://devcenter.novaposhta.ua/
- **Your Site:** https://my-magazin-81c96.web.app

---

## ✨ Features Summary

✅ **Real-time city search** with 300ms debounce  
✅ **Autocomplete suggestions** with click-to-select  
✅ **Dynamic warehouse loading** based on selected city  
✅ **Loading states** for better UX  
✅ **Error handling** with user-friendly messages  
✅ **Click-outside-to-close** for suggestion list  
✅ **Disabled states** to prevent invalid selections  
✅ **Full API integration** with Nova Poshta JSON API  

---

**🎉 Your Nova Poshta API integration is complete and working!**
