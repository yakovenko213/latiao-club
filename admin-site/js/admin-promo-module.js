/**
 * ============================================
 * ADMIN PROMO MODULE
 * ============================================
 * Handles all promo code functionality:
 * - Universal promo codes (promocodes collection)
 * - Personal promo codes (personal_promocodes collection)
 * - SMS notifications via TurboSMS
 * ============================================
 */

import { 
  doc, 
  getDoc, 
  getDocs, 
  collection, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  addDoc, 
  serverTimestamp,
  orderBy
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// ============================================
// GLOBAL STATE
// ============================================
let editingPromoId = null;
let personalPromosUnsubscribe = null;

// Access global Firebase instances
const db = window.db;
const auth = window.auth;

console.log('🎟️ Promo Module: Initialized');

// ============================================
// CODE GENERATION
// ============================================

/**
 * Generate random promo code
 * @param {string} type - 'alphanumeric' or 'numeric'
 */
window.generatePromoCode = (type) => {
  const codeInput = document.getElementById('promo-code');
  let code = '';

  if (type === 'alphanumeric') {
    // Letters + Numbers (8 characters)
    // Removed similar looking characters: I, O, 0, 1
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } else if (type === 'numeric') {
    // Only numbers (6 digits)
    for (let i = 0; i < 6; i++) {
      code += Math.floor(Math.random() * 10);
    }
  }

  codeInput.value = code;
  codeInput.focus();
  lucide.createIcons();
};

// ============================================
// UNIVERSAL PROMO CODES
// ============================================

/**
 * Load all universal promo codes
 */
window.loadPromoCodes = async () => {
  try {
    const promosRef = collection(db, 'promocodes');
    const q = query(promosRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    const promos = [];
    snapshot.forEach(doc => {
      promos.push({ id: doc.id, ...doc.data() });
    });

    renderPromoCodes(promos);
    updatePromoStats(promos);

  } catch (error) {
    console.error('Error loading promo codes:', error);
    alert('Помилка завантаження промокодів: ' + error.message);
  }
};

/**
 * Render promo codes table
 */
function renderPromoCodes(promos) {
  const tbody = document.getElementById('promos-list');

  if (!promos || promos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="px-6 py-12 text-center text-gray-500">
          <i data-lucide="inbox" class="w-12 h-12 mx-auto mb-3 text-gray-300"></i>
          <p>Поки що немає промокодів</p>
        </td>
      </tr>
    `;
    lucide.createIcons();
    return;
  }

  // Filter out invalid promos
  const validPromos = promos.filter(promo => {
    if (!promo || !promo.code) {
      console.warn('⚠️ Skipping invalid promo document:', promo);
      return false;
    }
    return true;
  });

  if (validPromos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="px-6 py-12 text-center text-gray-500">
          <i data-lucide="alert-triangle" class="w-12 h-12 mx-auto mb-3 text-orange-300"></i>
          <p class="text-orange-600 font-semibold">Знайдено невалідні дані промокодів</p>
          <p class="text-sm text-gray-500 mt-1">Будь ласка, перевірте документи в Firestore</p>
        </td>
      </tr>
    `;
    lucide.createIcons();
    return;
  }

  tbody.innerHTML = validPromos.map(promo => {
    const code = promo.code || '—';
    const type = promo.type || 'percent';
    const value = promo.value ?? 0;
    const discountText = type === 'percent' ? `${value}%` : `${value} грн`;
    
    const usedCount = promo.stats?.usedCount ?? 0;
    const totalLimit = promo.limits?.total ?? 0;
    const usageText = totalLimit === 0 ? `${usedCount} / ∞` : `${usedCount} / ${totalLimit}`;
    
    const perUserLimit = promo.limits?.perUser ?? 1;
    const minOrderAmount = promo.minOrderAmount ?? 0;
    const minOrderBadge = minOrderAmount > 0
      ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs" title="Мінімальна сума замовлення"><i data-lucide="shopping-cart" class="w-3 h-3"></i>${minOrderAmount}₴</span>`
      : '';
    
    const isActive = promo.isActive ?? false;
    const statusBadge = isActive
      ? '<span class="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold"><i data-lucide="check-circle" class="w-3 h-3"></i> Активний</span>'
      : '<span class="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold"><i data-lucide="x-circle" class="w-3 h-3"></i> Неактивний</span>';
    
    const createdDate = promo.createdAt?.toDate
      ? promo.createdAt.toDate().toLocaleDateString('uk-UA', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—';

    return `
      <tr class="hover:bg-gray-50 transition">
        <td class="px-6 py-4">
          <div class="flex items-center gap-2">
            <i data-lucide="ticket" class="w-4 h-4 text-purple-600"></i>
            <span class="font-mono font-bold text-lg text-gray-900">${code}</span>
          </div>
        </td>
        <td class="px-6 py-4">
          <div class="flex flex-col gap-1">
            <span class="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full font-bold w-fit">
              <i data-lucide="${type === 'percent' ? 'percent' : 'banknote'}" class="w-3 h-3"></i>
              ${discountText}
            </span>
            ${minOrderBadge}
          </div>
        </td>
        <td class="px-6 py-4 text-center">
          <span class="text-sm font-semibold text-gray-900">${usageText}</span>
        </td>
        <td class="px-6 py-4 text-center">
          <span class="text-sm font-semibold text-gray-700">${perUserLimit}</span>
        </td>
        <td class="px-6 py-4 text-center">
          ${statusBadge}
        </td>
        <td class="px-6 py-4 text-center text-sm text-gray-600">
          ${createdDate}
        </td>
        <td class="px-6 py-4">
          <div class="flex items-center justify-center gap-2">
            <button 
              onclick="editPromoCode('${promo.id}')"
              class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
              title="Редагувати"
            >
              <i data-lucide="edit" class="w-4 h-4"></i>
            </button>
            <button 
              onclick="togglePromoStatus('${promo.id}', ${!isActive})"
              class="p-2 ${isActive ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'} rounded-lg transition"
              title="${isActive ? 'Деактивувати' : 'Активувати'}"
            >
              <i data-lucide="${isActive ? 'pause' : 'play'}" class="w-4 h-4"></i>
            </button>
            <button 
              onclick="deletePromo('${promo.id}', '${code}')"
              class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
              title="Видалити"
            >
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  lucide.createIcons();
}

/**
 * Update promo code statistics
 */
function updatePromoStats(promos) {
  if (!promos || !Array.isArray(promos)) {
    console.warn('⚠️ Invalid promos data for stats:', promos);
    document.getElementById('stat-total').textContent = '0';
    document.getElementById('stat-active').textContent = '0';
    document.getElementById('stat-used').textContent = '0';
    document.getElementById('stat-discount').textContent = '0 грн';
    return;
  }

  const total = promos.length;
  const active = promos.filter(p => p?.isActive === true).length;
  const totalUsed = promos.reduce((sum, p) => sum + (p?.stats?.usedCount ?? 0), 0);

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-active').textContent = active;
  document.getElementById('stat-used').textContent = totalUsed;
  document.getElementById('stat-discount').textContent = '0 грн';
}

/**
 * Open modal for creating new promo code
 */
window.openCreatePromoModal = () => {
  editingPromoId = null;
  document.getElementById('promo-modal-title').textContent = 'Створити промокод';
  document.getElementById('promo-code').disabled = false;
  document.getElementById('promo-code').classList.remove('bg-gray-100', 'cursor-not-allowed');
  document.getElementById('create-promo-modal').classList.remove('hidden');
  document.getElementById('promo-code').focus();
  lucide.createIcons();
};

/**
 * Close promo modal
 */
window.closeCreatePromoModal = () => {
  document.getElementById('create-promo-modal').classList.add('hidden');
  document.getElementById('create-promo-form').reset();
  editingPromoId = null;
  document.getElementById('promo-code').disabled = false;
  document.getElementById('promo-code').classList.remove('bg-gray-100', 'cursor-not-allowed');
};

/**
 * Edit existing promo code
 */
window.editPromoCode = async (promoId) => {
  const promosRef = collection(db, 'promocodes');
  const q = query(promosRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  const promos = [];
  snapshot.forEach(doc => {
    promos.push({ id: doc.id, ...doc.data() });
  });

  const promoData = promos.find(p => p.id === promoId);
  if (!promoData) return;

  editingPromoId = promoData.id;

  document.getElementById('promo-modal-title').textContent = 'Редагувати промокод';
  document.getElementById('promo-code').value = promoData.code || '';
  document.getElementById('discount-type').value = promoData.type || 'percent';
  document.getElementById('discount-value').value = promoData.value || 0;
  document.getElementById('limit-total').value = promoData.limits?.total || 0;
  document.getElementById('limit-per-user').value = promoData.limits?.perUser || 1;
  document.getElementById('min-order-amount').value = promoData.minOrderAmount || 0;
  document.getElementById('promo-active').checked = promoData.isActive ?? true;

  document.getElementById('promo-code').disabled = true;
  document.getElementById('promo-code').classList.add('bg-gray-100', 'cursor-not-allowed');

  document.getElementById('create-promo-modal').classList.remove('hidden');
  document.getElementById('discount-value').focus();
  lucide.createIcons();
};

/**
 * Toggle promo code status
 */
window.togglePromoStatus = async (promoId, newStatus) => {
  try {
    const promoRef = doc(db, 'promocodes', promoId);
    await updateDoc(promoRef, { isActive: newStatus });
    window.loadPromoCodes();
  } catch (error) {
    console.error('Error toggling status:', error);
    alert('Помилка зміни статусу: ' + error.message);
  }
};

/**
 * Delete promo code
 */
window.deletePromo = async (promoId, promoCode) => {
  if (!confirm(`Видалити промокод "${promoCode}"?\n\nЦю дію неможливо скасувати.`)) {
    return;
  }

  try {
    await deleteDoc(doc(db, 'promocodes', promoId));
    alert(`✅ Промокод "${promoCode}" видалено`);
    window.loadPromoCodes();
  } catch (error) {
    console.error('Error deleting promo:', error);
    alert('Помилка видалення: ' + error.message);
  }
};

// ============================================
// PERSONAL PROMO CODES
// ============================================

/**
 * Load personal promo codes with real-time updates
 */
window.loadPersonalPromos = () => {
  try {
    if (personalPromosUnsubscribe) {
      personalPromosUnsubscribe();
    }

    const tbody = document.getElementById('personal-promos-list');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="px-6 py-12 text-center text-gray-500">
            <i data-lucide="loader" class="w-8 h-8 mx-auto mb-3 text-purple-500 animate-spin"></i>
            <p>Завантаження персональних промокодів...</p>
          </td>
        </tr>
      `;
      lucide.createIcons();
    }

    const promosRef = collection(db, 'personal_promocodes');
    const q = query(promosRef, orderBy('createdAt', 'desc'));

    personalPromosUnsubscribe = onSnapshot(q, (snapshot) => {
      const promos = [];
      snapshot.forEach(doc => {
        promos.push({ id: doc.id, ...doc.data() });
      });

      console.log('🎟️ Personal promos loaded:', promos.length);
      renderPersonalPromos(promos);
    }, (error) => {
      console.error('❌ Error loading personal promos:', error);
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="px-6 py-12 text-center text-red-500">
              <i data-lucide="alert-circle" class="w-8 h-8 mx-auto mb-3"></i>
              <p>Помилка завантаження: ${error.message}</p>
            </td>
          </tr>
        `;
        lucide.createIcons();
      }
    });

  } catch (error) {
    console.error('❌ Error initializing personal promos listener:', error);
  }
};

/**
 * Render personal promo codes table
 */
function renderPersonalPromos(promos) {
  const tbody = document.getElementById('personal-promos-list');
  if (!tbody) return;

  if (!promos || promos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="px-6 py-12 text-center text-gray-500">
          <i data-lucide="inbox" class="w-12 h-12 mx-auto mb-3 text-gray-300"></i>
          <p>Поки що немає персональних промокодів</p>
        </td>
      </tr>
    `;
    lucide.createIcons();
    return;
  }

  tbody.innerHTML = promos.map(promo => {
    const phone = promo.targetPhone || '—';
    const code = promo.code || '—';
    const discount = promo.discount || 0;
    const isActive = promo.isActive !== false;
    const isUsed = promo.isUsed === true;

    let statusBadge = '';
    if (isUsed) {
      statusBadge = '<span class="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold"><i data-lucide="check" class="w-3 h-3"></i> Використано</span>';
    } else if (!isActive) {
      statusBadge = '<span class="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold"><i data-lucide="x-circle" class="w-3 h-3"></i> Деактивовано</span>';
    } else {
      statusBadge = '<span class="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold"><i data-lucide="check-circle" class="w-3 h-3"></i> Активний</span>';
    }

    let expiryText = '∞';
    if (promo.expiryDate) {
      const expDate = promo.expiryDate.toDate ? promo.expiryDate.toDate() : new Date(promo.expiryDate);
      expiryText = expDate.toLocaleDateString('uk-UA', { day: '2-digit', month: 'short', year: 'numeric' });

      if (expDate < new Date()) {
        expiryText = `<span class="text-red-600">${expiryText}</span>`;
      }
    }

    const createdDate = promo.createdAt?.toDate
      ? promo.createdAt.toDate().toLocaleDateString('uk-UA', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—';

    return `
      <tr class="hover:bg-gray-50 transition">
        <td class="px-6 py-4">
          <span class="font-medium text-gray-900">${phone}</span>
        </td>
        <td class="px-6 py-4">
          <code class="px-2.5 py-1 rounded-lg font-mono font-bold text-sm bg-purple-100 text-purple-800">${code}</code>
        </td>
        <td class="px-6 py-4 text-center">
          <span class="font-bold text-lg text-purple-600">${discount} грн</span>
        </td>
        <td class="px-6 py-4 text-center">
          ${statusBadge}
        </td>
        <td class="px-6 py-4 text-center text-sm text-gray-600">
          ${expiryText}
        </td>
        <td class="px-6 py-4 text-center text-sm text-gray-600">
          ${createdDate}
        </td>
        <td class="px-6 py-4 text-center">
          <div class="flex items-center justify-center gap-2">
            ${!isUsed ? `
              <button 
                onclick="togglePersonalPromoStatus('${promo.id}', ${!isActive})"
                class="p-2 ${isActive ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'} rounded-lg transition"
                title="${isActive ? 'Деактивувати' : 'Активувати'}"
              >
                <i data-lucide="${isActive ? 'pause' : 'play'}" class="w-4 h-4"></i>
              </button>
            ` : ''}
            <button 
              onclick="deletePersonalPromo('${promo.id}', '${code}')"
              class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
              title="Видалити"
            >
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  lucide.createIcons();
}

/**
 * Toggle personal promo status
 */
window.togglePersonalPromoStatus = async (promoId, newStatus) => {
  try {
    const promoRef = doc(db, 'personal_promocodes', promoId);
    await updateDoc(promoRef, { isActive: newStatus });
  } catch (error) {
    console.error('Error toggling personal promo status:', error);
    alert('Помилка зміни статусу: ' + error.message);
  }
};

/**
 * Delete personal promo code
 */
window.deletePersonalPromo = async (promoId, promoCode) => {
  if (!confirm(`Видалити персональний промокод "${promoCode}"?`)) return;

  try {
    await deleteDoc(doc(db, 'personal_promocodes', promoId));

    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg z-[100]';
    toast.textContent = `Промокод "${promoCode}" видалено`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  } catch (error) {
    console.error('Error deleting personal promo:', error);
    alert('Помилка видалення: ' + error.message);
  }
};

// ============================================
// SMS INTEGRATION
// ============================================

/**
 * Fetch TurboSMS credentials from Firestore
 * Token: settings/sms_settings → turboSmsToken
 * Sender: settings/config → senderName
 */
async function fetchTurboSmsCredentials() {
  try {
    console.log('🔍 Fetching TurboSMS credentials from multiple documents...');

    // Fetch Token from settings/sms_settings
    const smsSnap = await getDoc(doc(db, "settings", "sms_settings"));
    const token = smsSnap.exists() ? smsSnap.data().turboSmsToken : null;

    console.log('📄 Document settings/sms_settings:', smsSnap.exists() ? 'EXISTS' : 'NOT FOUND');
    if (smsSnap.exists()) {
      console.log('   Available fields:', Object.keys(smsSnap.data()));
    }
    console.log('🔑 Token found:', !!token);

    // Fetch Sender Name from settings/config
    const configSnap = await getDoc(doc(db, "settings", "config"));
    const sender = configSnap.exists() ? configSnap.data().senderName : null;

    console.log('📄 Document settings/config:', configSnap.exists() ? 'EXISTS' : 'NOT FOUND');
    if (configSnap.exists()) {
      console.log('   Available fields:', Object.keys(configSnap.data()));
    }
    console.log('📤 Sender Name found:', !!sender);

    // Validate both credentials
    if (!token || !sender) {
      const missingParts = [];
      if (!token) missingParts.push('токен у settings/sms_settings');
      if (!sender) missingParts.push("ім'я відправника у settings/config");

      const errorMsg = `Не знайдено ${missingParts.join(' та ')}`;
      console.error('❌ Missing credentials:', { token: !!token, sender: !!sender });
      throw new Error(errorMsg);
    }

    console.log('✅ TurboSMS credentials loaded successfully');
    console.log('🔑 Using Token:', token.substring(0, 5) + '...');
    console.log('📤 Using Sender:', sender);

    return { apiToken: token, sender: sender };

  } catch (error) {
    console.error('❌ Error in fetchTurboSmsCredentials:', error);
    throw error;
  }
}

/**
 * Send SMS via TurboSMS API
 */
async function sendPromoSms(phone, message) {
  try {
    console.log('📤 Preparing to send promo SMS...');
    console.log('📞 Phone:', phone);
    console.log('💬 Message:', message);

    const { apiToken, sender } = await fetchTurboSmsCredentials();

    const payload = {
      recipients: [phone],
      sms: {
        sender: sender,
        text: message
      }
    };

    console.log('📦 TurboSMS Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch('https://api.turbosms.ua/message/send.json', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    console.log('📥 TurboSMS Response:', JSON.stringify(result, null, 2));

    const isSuccess = (
      result.response_code === 0 ||
      result.response_code === 1 ||
      result.response_code === '0' ||
      result.response_code === '1' ||
      result.response_status === 'OK' ||
      result.success === true ||
      (result.response_result && result.response_result.length > 0)
    );

    if (isSuccess) {
      console.log('✅ SMS sent successfully via TurboSMS');
      return {
        success: true,
        message: 'SMS відправлено успішно'
      };
    } else {
      console.warn('⚠️ TurboSMS API returned non-success status:', result);
      throw new Error(result.response_status || result.message || 'TurboSMS API error');
    }

  } catch (error) {
    console.error('❌ Error sending promo SMS:', error);

    let errorMsg = error.message || 'Невідома помилка при відправці SMS';

    return {
      success: false,
      message: errorMsg
    };
  }
}

/**
 * Normalize phone number to +380XXXXXXXXX format
 */
function normalizePhone(phone) {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('380')) {
    return '+' + cleaned;
  } else if (cleaned.startsWith('80')) {
    return '+3' + cleaned;
  } else if (cleaned.startsWith('0')) {
    return '+38' + cleaned;
  } else if (cleaned.length === 9) {
    return '+380' + cleaned;
  }
  return '+' + cleaned;
}

// ============================================
// EVENT LISTENERS
// ============================================

/**
 * Initialize event listeners
 */
function initializeEventListeners() {
  // Update discount example live
  const typeSelect = document.getElementById('discount-type');
  const valueInput = document.getElementById('discount-value');
  const exampleEl = document.getElementById('discount-example');

  if (typeSelect && valueInput && exampleEl) {
    const updateExample = () => {
      const type = typeSelect.value;
      const value = valueInput.value || 0;

      if (type === 'percent') {
        exampleEl.textContent = `Знижка ${value}% від суми замовлення`;
      } else {
        exampleEl.textContent = `Знижка ${value} грн від суми замовлення`;
      }
    };

    typeSelect.addEventListener('change', updateExample);
    valueInput.addEventListener('input', updateExample);
  }

  // Create/Edit Promo Code Form
  const createPromoForm = document.getElementById('create-promo-form');
  if (createPromoForm) {
    createPromoForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const code = document.getElementById('promo-code').value.trim().toUpperCase();
      const type = document.getElementById('discount-type').value;
      const value = parseFloat(document.getElementById('discount-value').value);
      const limitTotal = parseInt(document.getElementById('limit-total').value) || 0;
      const limitPerUser = parseInt(document.getElementById('limit-per-user').value) || 1;
      const minOrderAmount = parseInt(document.getElementById('min-order-amount').value) || 0;
      const isActive = document.getElementById('promo-active').checked;

      // Validation
      if (!code) {
        alert('⚠️ Будь ласка, введіть код промокоду');
        return;
      }

      if (value <= 0) {
        alert('⚠️ Розмір знижки має бути більше 0');
        return;
      }

      if (type === 'percent' && value > 100) {
        alert('⚠️ Відсоток знижки не може бути більше 100%');
        return;
      }

      try {
        const promosRef = collection(db, 'promocodes');

        // EDIT MODE
        if (editingPromoId) {
          const promoRef = doc(db, 'promocodes', editingPromoId);
          await updateDoc(promoRef, {
            type: type,
            value: value,
            minOrderAmount: minOrderAmount,
            limits: {
              total: limitTotal,
              perUser: limitPerUser
            },
            isActive: isActive
          });

          alert(`✅ Промокод "${code}" успішно оновлено!`);
          window.closeCreatePromoModal();
          window.loadPromoCodes();
          return;
        }

        // CREATE MODE
        const snapshot = await getDocs(promosRef);
        const exists = snapshot.docs.some(doc => doc.data().code === code);
        if (exists) {
          alert(`⚠️ Промокод "${code}" вже існує. Виберіть інший код.`);
          return;
        }

        await addDoc(promosRef, {
          code: code,
          type: type,
          value: value,
          minOrderAmount: minOrderAmount,
          limits: {
            total: limitTotal,
            perUser: limitPerUser
          },
          stats: {
            usedCount: 0
          },
          isActive: isActive,
          createdAt: serverTimestamp()
        });

        alert(`✅ Промокод "${code}" успішно створено!`);
        window.closeCreatePromoModal();
        window.loadPromoCodes();

      } catch (error) {
        console.error('Error creating promo code:', error);
        alert('❌ Помилка створення промокоду: ' + error.message);
      }
    });
  }

  // Personal Promo Expiry Toggle
  const expiryToggle = document.getElementById('personal-promo-expiry-toggle');
  if (expiryToggle) {
    expiryToggle.addEventListener('change', (e) => {
      const container = document.getElementById('personal-promo-expiry-container');
      if (e.target.checked) {
        container.classList.remove('hidden');
      } else {
        container.classList.add('hidden');
        document.getElementById('personal-promo-expiry').value = '';
      }
    });
  }

  // Personal Promo SMS Toggle
  const smsToggle = document.getElementById('personal-promo-sms-toggle');
  if (smsToggle) {
    smsToggle.addEventListener('change', (e) => {
      const container = document.getElementById('personal-promo-sms-container');
      if (e.target.checked) {
        container.classList.remove('hidden');
      } else {
        container.classList.add('hidden');
      }
    });
  }

  // Personal Promo Form Submit
  const personalPromoForm = document.getElementById('personal-promo-form');
  if (personalPromoForm) {
    personalPromoForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const phoneInput = document.getElementById('personal-promo-phone').value.trim();
      const code = document.getElementById('personal-promo-code').value.trim().toUpperCase();
      const discount = parseInt(document.getElementById('personal-promo-discount').value) || 0;
      const hasExpiry = document.getElementById('personal-promo-expiry-toggle').checked;
      const expiryDateInput = document.getElementById('personal-promo-expiry').value;
      const sendSms = document.getElementById('personal-promo-sms-toggle')?.checked || false;
      const smsMessage = document.getElementById('personal-promo-sms-message')?.value || '';

      // Validation
      if (!phoneInput) {
        alert('⚠️ Введіть номер телефону клієнта');
        return;
      }

      if (!code) {
        alert('⚠️ Введіть код промокоду');
        return;
      }

      if (discount <= 0) {
        alert('⚠️ Знижка має бути більше 0');
        return;
      }

      const normalizedPhone = normalizePhone(phoneInput);
      if (normalizedPhone.length < 12) {
        alert('⚠️ Невірний формат номера телефону');
        return;
      }

      // Show loading state
      const submitBtn = e.target.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <svg class="animate-spin w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        <span>Обробка...</span>
      `;

      try {
        // Create promo code
        const promoData = {
          code: code,
          discount: discount,
          targetPhone: normalizedPhone,
          isActive: true,
          isUsed: false,
          createdAt: serverTimestamp()
        };

        if (hasExpiry && expiryDateInput) {
          const expiryDate = new Date(expiryDateInput);
          expiryDate.setHours(23, 59, 59, 999);
          promoData.expiryDate = expiryDate;
        }

        await addDoc(collection(db, 'personal_promocodes'), promoData);
        console.log('✅ Promo code created successfully:', code);

        // Send SMS if requested
        let smsStatus = null;
        if (sendSms && smsMessage) {
          console.log('📤 Attempting to send SMS notification...');

          let finalMessage = smsMessage
            .replace(/\[CODE\]/g, code)
            .replace(/\[DISCOUNT\]/g, `${discount} грн`);

          console.log('💬 Final SMS message:', finalMessage);

          smsStatus = await sendPromoSms(normalizedPhone, finalMessage);
          console.log('📊 SMS Status:', smsStatus);
        }

        // Show success notification
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-purple-600 text-white px-6 py-4 rounded-xl shadow-2xl z-[100] flex items-center gap-3 animate-slide-in';

        let toastContent = '';
        if (sendSms) {
          if (smsStatus && smsStatus.success) {
            toastContent = `
              <i data-lucide="check-circle" class="w-6 h-6"></i>
              <div>
                <p class="font-bold">Промокод видано. SMS відправлено ✓</p>
                <p class="text-sm opacity-90">${code} → ${normalizedPhone}</p>
              </div>
            `;
          } else {
            toastContent = `
              <i data-lucide="alert-triangle" class="w-6 h-6"></i>
              <div>
                <p class="font-bold">Промокод видано. SMS не відправлено</p>
                <p class="text-sm opacity-90">Помилка: ${smsStatus?.message || 'Невідома помилка'}</p>
              </div>
            `;
            toast.className = toast.className.replace('bg-purple-600', 'bg-orange-600');
          }
        } else {
          toastContent = `
            <i data-lucide="gift" class="w-6 h-6"></i>
            <div>
              <p class="font-bold">Промокод видано!</p>
              <p class="text-sm opacity-90">${code} → ${normalizedPhone}</p>
            </div>
          `;
        }

        toast.innerHTML = toastContent;
        document.body.appendChild(toast);
        lucide.createIcons();
        setTimeout(() => {
          toast.style.opacity = '0';
          toast.style.transform = 'translateX(100%)';
          setTimeout(() => toast.remove(), 300);
        }, 5000);

        if (sendSms) {
          console.log('📊 SMS Notification Status:', smsStatus);
        }

        // Reset form
        document.getElementById('personal-promo-form').reset();
        document.getElementById('personal-promo-expiry-container').classList.add('hidden');
        document.getElementById('personal-promo-sms-container').classList.add('hidden');

        const smsTextarea = document.getElementById('personal-promo-sms-message');
        if (smsTextarea) {
          smsTextarea.value = 'Привіт! Ми даруємо вам персональний промокод [CODE] на знижку [DISCOUNT]! Використайте його при наступному замовленні.';
        }

      } catch (error) {
        console.error('❌ Error creating personal promo:', error);

        let errorMessage = error.message;
        let errorTitle = 'Помилка створення промокоду';

        if (errorMessage.includes('Не знайдено') && (errorMessage.includes('sms_settings') || errorMessage.includes('config'))) {
          errorTitle = 'Помилка налаштувань SMS';
          errorMessage = `Помилка: ${errorMessage}`;
        } else if (errorMessage.includes('Available fields in DB are:')) {
          errorTitle = 'Помилка налаштувань SMS';
          errorMessage = `Налаштування SMS некоректні. ${errorMessage}`;
        }

        const errorToast = document.createElement('div');
        errorToast.className = 'fixed top-4 right-4 bg-red-600 text-white px-6 py-4 rounded-xl shadow-2xl z-[100] flex items-center gap-3 max-w-md';
        errorToast.innerHTML = `
          <i data-lucide="x-circle" class="w-6 h-6 flex-shrink-0"></i>
          <div class="flex-1">
            <p class="font-bold">${errorTitle}</p>
            <p class="text-sm opacity-90 break-words">${errorMessage}</p>
            ${errorMessage.includes('sms_settings') || errorMessage.includes('config') ? '<p class="text-xs mt-1 opacity-75">Перевірте: Firestore → settings → sms_settings і config</p>' : ''}
          </div>
        `;
        document.body.appendChild(errorToast);
        lucide.createIcons();
        setTimeout(() => errorToast.remove(), 8000);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
        lucide.createIcons();
      }
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeEventListeners);
} else {
  initializeEventListeners();
}

console.log('🎟️ Promo Module: Event listeners initialized');
