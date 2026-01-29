// ============================================
// NOVA POSHTA API - QUICK REFERENCE
// ============================================

// Configuration
const NP_API_KEY = 'ca63f7a56b807b0e882e567c7041abf3';
const NP_URL = 'https://api.novaposhta.ua/v2.0/json/';

// ============================================
// 1. SEARCH CITIES (searchSettlements)
// ============================================

// Example Request Body:
const citySearchRequest = {
  apiKey: NP_API_KEY,
  modelName: 'Address',
  calledMethod: 'searchSettlements',
  methodProperties: {
    CityName: 'Київ',  // User input
    Limit: 50,
    Page: 1
  }
};

// Fetch Example:
fetch(NP_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(citySearchRequest)
})
.then(res => res.json())
.then(data => {
  if (data.success && data.data[0]?.Addresses) {
    const cities = data.data[0].Addresses;
    cities.forEach(city => {
      console.log(city.Present);        // "м. Київ, Київська обл."
      console.log(city.DeliveryCity);   // "8d5a980d-..." (Ref for warehouses)
    });
  }
});

// Response Example:
/*
{
  "success": true,
  "data": [{
    "Addresses": [{
      "Present": "м. Київ, Київська обл.",
      "DeliveryCity": "8d5a980d-391c-11dd-90d9-001a92567626"
    }]
  }]
}
*/


// ============================================
// 2. GET WAREHOUSES (getWarehouses)
// ============================================

// Example Request Body:
const warehouseRequest = {
  apiKey: NP_API_KEY,
  modelName: 'Address',
  calledMethod: 'getWarehouses',
  methodProperties: {
    CityRef: '8d5a980d-391c-11dd-90d9-001a92567626', // From selected city
    Limit: 99999
  }
};

// Fetch Example:
fetch(NP_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(warehouseRequest)
})
.then(res => res.json())
.then(data => {
  if (data.success && data.data.length > 0) {
    const warehouses = data.data;
    warehouses.forEach(warehouse => {
      console.log(warehouse.Description); // "Відділення №1: вул. Хрещатик, 1"
      console.log(warehouse.Ref);         // Warehouse ID
    });
  }
});

// Response Example:
/*
{
  "success": true,
  "data": [{
    "Ref": "1ec09d88-e1c2-11e3-8c4a-0050568002cf",
    "Description": "Відділення №1: вул. Хрещатик, 1",
    "Number": "1"
  }]
}
*/


// ============================================
// 3. COMPLETE IMPLEMENTATION (Copy-Paste Ready)
// ============================================

let selectedCityRef = null;
let citySearchTimeout = null;

// City Search with Debounce
document.getElementById('np-city-input').addEventListener('input', function(e) {
  clearTimeout(citySearchTimeout);
  const searchQuery = e.target.value;
  
  if (searchQuery.length < 2) return;
  
  citySearchTimeout = setTimeout(async () => {
    try {
      const response = await fetch(NP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: NP_API_KEY,
          modelName: 'Address',
          calledMethod: 'searchSettlements',
          methodProperties: { CityName: searchQuery, Limit: 50, Page: 1 }
        })
      });
      
      const data = await response.json();
      if (data.success && data.data[0]?.Addresses) {
        renderCities(data.data[0].Addresses);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }, 300);
});

// Render City List
function renderCities(cities) {
  const list = document.getElementById('np-city-list');
  list.innerHTML = '';
  
  cities.forEach(city => {
    const li = document.createElement('li');
    li.textContent = city.Present;
    li.onclick = () => {
      document.getElementById('np-city-input').value = city.Present;
      selectedCityRef = city.DeliveryCity;
      list.classList.add('hidden');
      loadWarehouses(selectedCityRef);
    };
    list.appendChild(li);
  });
  
  list.classList.remove('hidden');
}

// Load Warehouses
async function loadWarehouses(cityRef) {
  const select = document.getElementById('np-warehouse-select');
  select.disabled = true;
  select.innerHTML = '<option>Завантаження...</option>';
  
  try {
    const response = await fetch(NP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: NP_API_KEY,
        modelName: 'Address',
        calledMethod: 'getWarehouses',
        methodProperties: { CityRef: cityRef, Limit: 99999 }
      })
    });
    
    const data = await response.json();
    if (data.success && data.data.length > 0) {
      select.innerHTML = '<option value="">Оберіть відділення...</option>';
      data.data.forEach(w => {
        const option = document.createElement('option');
        option.value = w.Ref;
        option.textContent = w.Description;
        select.appendChild(option);
      });
      select.disabled = false;
    }
  } catch (error) {
    console.error('Error:', error);
    select.innerHTML = '<option>Помилка завантаження</option>';
  }
}


// ============================================
// 4. HTML STRUCTURE REQUIRED
// ============================================

/*
<!-- City Input -->
<input 
  type="text" 
  id="np-city-input"
  placeholder="Почніть вводити назву міста..." 
  autocomplete="off"
>

<!-- City Suggestions List -->
<ul id="np-city-list" class="hidden"></ul>

<!-- Warehouse Select -->
<select id="np-warehouse-select" disabled>
  <option value="">Спочатку оберіть місто</option>
</select>
*/


// ============================================
// 5. TESTING SNIPPETS
// ============================================

// Test City Search
fetch('https://api.novaposhta.ua/v2.0/json/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    apiKey: 'ca63f7a56b807b0e882e567c7041abf3',
    modelName: 'Address',
    calledMethod: 'searchSettlements',
    methodProperties: { CityName: 'Київ', Limit: 5, Page: 1 }
  })
})
.then(r => r.json())
.then(d => console.log('Cities:', d.data[0].Addresses));

// Test Warehouse Load (Kyiv example)
fetch('https://api.novaposhta.ua/v2.0/json/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    apiKey: 'ca63f7a56b807b0e882e567c7041abf3',
    modelName: 'Address',
    calledMethod: 'getWarehouses',
    methodProperties: { 
      CityRef: '8d5a980d-391c-11dd-90d9-001a92567626', // Kyiv
      Limit: 10 
    }
  })
})
.then(r => r.json())
.then(d => console.log('Warehouses:', d.data));
