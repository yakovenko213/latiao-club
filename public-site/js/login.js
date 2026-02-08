// ============================================
// LATIAO SNACK - Custom SMS Login (TurboSMS)
// ============================================
// Direct TurboSMS API integration with Firestore customer verification

// ============================================
// WAIT FOR FIREBASE
// ============================================
async function waitForFirebase() {
  let attempts = 0;
  while (!window.firebaseInit && attempts < 100) {
    await new Promise(resolve => setTimeout(resolve, 50));
    attempts++;
  }
  if (!window.firebaseInit) {
    throw new Error('Firebase не завантажився');
  }
  return window.firebaseInit;
}

// ============================================
// STATE MANAGEMENT
// ============================================
let generatedCode = null;
let customerData = null;
let fullPhoneNumber = null;
let timerInterval = null;
let resendAttempts = 0;
const MAX_RESEND_ATTEMPTS = 3;

// ============================================
// AVATAR POOL - Funny meme avatars
// ============================================
const AVATAR_POOL = [
  "https://www.meme-arsenal.com/memes/cdcfda78a84cf35ca09a109439642ea6.jpg",
  "https://i1.sndcdn.com/artworks-Pm21pVGyLISZPmA8-mt4UhQ-t500x500.jpg",
  "https://www.meme-arsenal.com/memes/463e01e32c4ea517425162d27481d7b2.jpg",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQEN4_2MD_SBd-1dE0tr6BIF581wULKjW29Cw&s",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQEPijZKwJWqno9DLrxEsCOJ-e9w9I5l3lfSg&s"
];

/**
 * Get a random avatar URL from the pool
 */
function getRandomAvatar() {
  return AVATAR_POOL[Math.floor(Math.random() * AVATAR_POOL.length)];
}

// ============================================
// DOM ELEMENTS
// ============================================
const phoneInput = document.getElementById('phoneInput');
const getCodeBtn = document.getElementById('getCodeBtn');
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const otpInputs = document.querySelectorAll('.otp-input');
const loginBtn = document.getElementById('loginBtn');
const backBtn = document.getElementById('backBtn');
const timerEl = document.getElementById('timer');
const resendBtn = document.getElementById('resendBtn');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');
const phoneDisplay = document.getElementById('phoneDisplay');

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Normalize phone number to format +380XXXXXXXXX
 */
function normalizePhone(phone) {
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, '');
  
  // Handle different formats
  if (digits.startsWith('380')) {
    return '+' + digits;
  } else if (digits.startsWith('0')) {
    return '+38' + digits;
  } else if (digits.length === 9) {
    return '+380' + digits;
  }
  
  return '+380' + digits;
}

/**
 * Generate random 4-digit code
 */
function generateCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Show toast notification
 */
function showToast(message, type = 'error') {
  console.log('🍞 Toast:', message, type);
  
  toastMessage.textContent = message;
  toast.className = 'toast show';
  
  if (type === 'error') {
    toast.classList.add('bg-red-500');
    toast.classList.remove('bg-green-500');
  } else {
    toast.classList.add('bg-green-500');
    toast.classList.remove('bg-red-500');
  }
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

/**
 * Show "Not Found" modal for users without orders
 */
function showNotFoundModal() {
  const modal = document.getElementById('notFoundModal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex'); // Add flex for centering
    document.body.style.overflow = 'hidden';
    console.log('💬 Not Found modal shown');
  } else {
    console.error('❌ notFoundModal element not found!');
    // Fallback: show alert if modal not found
    alert('Номер не знайдено. Зробіть перше замовлення на головній сторінці.');
    window.location.href = './index.html';
  }
}

/**
 * Close "Not Found" modal
 */
function closeNotFoundModal() {
  const modal = document.getElementById('notFoundModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex'); // Remove flex when hiding
    document.body.style.overflow = '';
    console.log('💬 Not Found modal closed');
  }
}

// Make closeNotFoundModal globally accessible
window.closeNotFoundModal = closeNotFoundModal;

// ============================================
// USER ACTIVITY TRACKING (for login)
// ============================================

/**
 * Log user activity from login page
 * Uses Firebase directly since dashboard.js is not loaded here
 * @param {string} userId - Customer document ID (phone without +)
 * @param {string} action - Action type: 'login'
 */
async function logUserActivityFromLogin(userId, action = 'login') {
  if (!userId) {
    console.warn('⚠️ logUserActivity: No userId provided');
    return;
  }
  
  try {
    const firebase = await waitForFirebase();
    const { db, doc, updateDoc, serverTimestamp, arrayUnion } = firebase;
    
    const customerRef = doc(db, 'customers', userId);
    
    // Detect device type from userAgent
    const userAgent = navigator.userAgent || '';
    const isMobile = /Mobile|Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    // Create activity entry
    const activityEntry = {
      timestamp: new Date().toISOString(),
      userAgent: userAgent.substring(0, 200), // Limit to 200 chars
      device: isMobile ? 'mobile' : 'desktop',
      action: action
    };
    
    // Update customer document
    await updateDoc(customerRef, {
      lastActiveAt: serverTimestamp(),
      accessLog: arrayUnion(activityEntry)
    });
    
    console.log(`📊 Activity logged: ${action} for ${userId}`);
    
  } catch (error) {
    // Don't throw - this is non-critical
    console.warn('⚠️ Failed to log activity:', error.message);
  }
}

/**
 * Start countdown timer
 */
function startTimer(seconds = 60) {
  resendBtn.classList.add('hidden');
  
  clearInterval(timerInterval);
  
  timerInterval = setInterval(() => {
    seconds--;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    timerEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    
    if (seconds <= 0) {
      clearInterval(timerInterval);
      timerEl.textContent = '00:00';
      if (resendAttempts < MAX_RESEND_ATTEMPTS) {
        resendBtn.classList.remove('hidden');
      }
    }
  }, 1000);
}

/**
 * Reset login button state
 */
function resetLoginBtn() {
  loginBtn.disabled = true;
  loginBtn.innerHTML = 'Увійти';
  loginBtn.classList.add('bg-gray-300');
  loginBtn.classList.remove('bg-spicy', 'hover:bg-spicy-dark', 'hover:shadow-lg', 'hover:shadow-spicy/30', 'pulse-soft');
}

/**
 * Check if all OTP inputs are filled
 */
function checkOtpComplete() {
  const code = Array.from(otpInputs).map(i => i.value).join('');
  if (code.length === 4) {
    loginBtn.disabled = false;
    loginBtn.classList.remove('bg-gray-300');
    loginBtn.classList.add('bg-spicy', 'hover:bg-spicy-dark', 'hover:shadow-lg', 'hover:shadow-spicy/30', 'pulse-soft');
  } else {
    resetLoginBtn();
  }
}

// ============================================
// MAIN LOGIC
// ============================================

/**
 * Handle "Get Code" button click
 * 1. Normalize phone
 * 2. Check if customer exists in Firestore (with fallback to orders)
 * 3. Fetch TurboSMS API token from settings
 * 4. Generate and send SMS code
 */
async function handleSendCode() {
  const phoneRaw = phoneInput.value.replace(/\s/g, '');
  
  if (!phoneRaw || phoneRaw.length < 9) {
    showToast('Введіть коректний номер телефону');
    return;
  }
  
  // Normalize phone number
  fullPhoneNumber = normalizePhone(phoneRaw);
  console.log('📞 Normalized phone:', fullPhoneNumber);
  
  // Update UI - loading state
  getCodeBtn.disabled = true;
  const originalText = getCodeBtn.innerHTML;
  getCodeBtn.innerHTML = `
    <div class="flex items-center justify-center gap-2">
      <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      <span>Перевіряємо...</span>
    </div>
  `;
  
  try {
    const firebase = await waitForFirebase();
    const { db, collection, getDocs, query, where, doc, getDoc, setDoc, serverTimestamp, orderBy, limit } = firebase;
    
    // ========================================
    // STEP 1: Check if customer exists
    // ========================================
    console.log('🔍 Searching for customer with phone:', fullPhoneNumber);
    
    const customersRef = collection(db, 'customers');
    let customerFound = false;
    
    // Try main format: +380XXXXXXXXX
    const customerQuery = query(customersRef, where('phone', '==', fullPhoneNumber));
    const customerSnapshot = await getDocs(customerQuery);
    
    if (!customerSnapshot.empty) {
      customerData = { id: customerSnapshot.docs[0].id, ...customerSnapshot.docs[0].data() };
      customerFound = true;
    }
    
    // Try without +38 prefix (legacy data)
    if (!customerFound) {
      const altPhone = fullPhoneNumber.replace('+38', '');
      const altQuery = query(customersRef, where('phone', '==', altPhone));
      const altSnapshot = await getDocs(altQuery);
      
      if (!altSnapshot.empty) {
        customerData = { id: altSnapshot.docs[0].id, ...altSnapshot.docs[0].data() };
        customerFound = true;
      }
    }
    
    // Try with 0 prefix
    if (!customerFound) {
      const zeroPhone = '0' + fullPhoneNumber.replace('+380', '');
      const zeroQuery = query(customersRef, where('phone', '==', zeroPhone));
      const zeroSnapshot = await getDocs(zeroQuery);
      
      if (!zeroSnapshot.empty) {
        customerData = { id: zeroSnapshot.docs[0].id, ...zeroSnapshot.docs[0].data() };
        customerFound = true;
      }
    }
    
    // ========================================
    // STEP 1.5: FALLBACK - Search in orders collection
    // ========================================
    if (!customerFound) {
      console.log('⚠️ Customer not in customers collection, searching orders...');
      
      getCodeBtn.innerHTML = `
        <div class="flex items-center justify-center gap-2">
          <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>Шукаємо замовлення...</span>
        </div>
      `;
      
      // Wrap orders search in try-catch to handle permission errors
      try {
        const ordersRef = collection(db, 'orders');
        let orderFound = null;
        let allUserOrders = [];
        
        // Search orders by customer.phone (main format)
        const ordersQuery = query(
          ordersRef, 
          where('customer.phone', '==', fullPhoneNumber),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        
        if (!ordersSnapshot.empty) {
          orderFound = ordersSnapshot.docs[0];
          allUserOrders = ordersSnapshot.docs;
        }
        
        // Try alternative phone formats in orders
        if (!orderFound) {
          const altPhone = fullPhoneNumber.replace('+38', '');
          const altOrdersQuery = query(
            ordersRef,
            where('customer.phone', '==', altPhone),
            orderBy('createdAt', 'desc'),
            limit(50)
          );
          const altOrdersSnapshot = await getDocs(altOrdersQuery);
          
          if (!altOrdersSnapshot.empty) {
            orderFound = altOrdersSnapshot.docs[0];
            allUserOrders = altOrdersSnapshot.docs;
          }
        }
        
        // Try with 0 prefix
        if (!orderFound) {
          const zeroPhone = '0' + fullPhoneNumber.replace('+380', '');
          const zeroOrdersQuery = query(
            ordersRef,
            where('customer.phone', '==', zeroPhone),
            orderBy('createdAt', 'desc'),
            limit(50)
          );
          const zeroOrdersSnapshot = await getDocs(zeroOrdersQuery);
          
          if (!zeroOrdersSnapshot.empty) {
            orderFound = zeroOrdersSnapshot.docs[0];
            allUserOrders = zeroOrdersSnapshot.docs;
          }
        }
        
        if (!orderFound) {
          // NO orders found - user truly doesn't exist
          // Show friendly "Not Found" modal instead of error
          console.log('❌ User not found - showing first order modal');
          showNotFoundModal();
          getCodeBtn.innerHTML = originalText;
          getCodeBtn.disabled = false;
          return;
        }
      
      // ========================================
      // AUTO-CREATE CUSTOMER PROFILE
      // ========================================
      console.log('📦 Found order, auto-creating customer profile...');
      
      const orderData = orderFound.data();
      const customerInfo = orderData.customer || {};
      
      // Calculate stats from all orders
      let totalSpent = 0;
      let ordersCount = allUserOrders.length;
      
      allUserOrders.forEach(orderDoc => {
        const order = orderDoc.data();
        totalSpent += order.total || order.totalAmount || 0;
      });
      
      // Create customer document with phone as ID (normalized)
      const customerId = fullPhoneNumber.replace(/\+/g, '');
      const newCustomerData = {
        phone: fullPhoneNumber,
        fullName: customerInfo.fullName || customerInfo.name || '',
        email: customerInfo.email || '',
        avatarUrl: getRandomAvatar(), // Assign random avatar on creation
        ordersCount: ordersCount,
        totalSpent: totalSpent,
        lastOrderDate: orderData.createdAt || serverTimestamp(),
        createdAt: serverTimestamp(),
        createdFrom: 'auto_login_recovery',
        // Copy additional fields if available
        ...(customerInfo.city && { city: customerInfo.city }),
        ...(customerInfo.address && { address: customerInfo.address }),
        ...(customerInfo.novaPoshtaCity && { novaPoshtaCity: customerInfo.novaPoshtaCity }),
        ...(customerInfo.novaPoshtaWarehouse && { novaPoshtaWarehouse: customerInfo.novaPoshtaWarehouse })
      };
      
      // Save to Firestore
      const customerDocRef = doc(db, 'customers', customerId);
      await setDoc(customerDocRef, newCustomerData);
      
      console.log('✅ Auto-created customer profile:', customerId);
      
      // Set customerData for session
      customerData = { id: customerId, ...newCustomerData };
      customerFound = true;
      
      showToast('Профіль відновлено! 🔄', 'success');
      
      } catch (ordersSearchError) {
        // Handle permission errors gracefully - treat as "new user"
        const errorMessage = ordersSearchError.message || '';
        const errorCode = ordersSearchError.code || '';
        
        if (errorCode === 'permission-denied' || 
            errorMessage.includes('Missing or insufficient permissions') ||
            errorMessage.includes('permission-denied')) {
          console.log('🔐 Permission denied on orders search - Assuming new user, showing Modal.');
          showNotFoundModal();
          getCodeBtn.innerHTML = originalText;
          getCodeBtn.disabled = false;
          return;
        }
        
        // For other errors, re-throw to be handled by main catch
        console.error('❌ Orders search error:', ordersSearchError);
        throw ordersSearchError;
      }
    }
    
    console.log('✅ Customer found:', customerData.id);
    
    // ========================================
    // SELF-HEALING: Assign avatar if missing
    // ========================================
    if (!customerData.avatarUrl) {
      console.log('🎨 No avatar found, assigning random avatar...');
      const newAvatarUrl = getRandomAvatar();
      
      try {
        const { updateDoc } = firebase;
        const customerRef = doc(db, 'customers', customerData.id);
        await updateDoc(customerRef, { avatarUrl: newAvatarUrl });
        customerData.avatarUrl = newAvatarUrl;
        console.log('✅ Avatar assigned:', newAvatarUrl);
      } catch (avatarError) {
        console.warn('⚠️ Could not save avatar to Firestore:', avatarError);
        // Still use the avatar locally even if save fails
        customerData.avatarUrl = newAvatarUrl;
      }
    }
    
    // ========================================
    // STEP 2: Get TurboSMS API Token
    // ========================================
    getCodeBtn.innerHTML = `
      <div class="flex items-center justify-center gap-2">
        <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        <span>Надсилаємо код...</span>
      </div>
    `;
    
    // Try different possible settings documents
    let turboSmsToken = null;
    let smsSender = 'latiao_info'; // ✅ Default to approved alpha-name
    
    // Try settings/sms_settings
    const smsSettingsDoc = await getDoc(doc(db, 'settings', 'sms_settings'));
    if (smsSettingsDoc.exists()) {
      const settings = smsSettingsDoc.data();
      turboSmsToken = settings.turboSmsToken || settings.apiToken || settings.token;
      smsSender = settings.smsSender || settings.senderName || 'latiao_info'; // ✅ Fallback to approved name
    }
    
    // Fallback to settings/general
    if (!turboSmsToken) {
      const generalDoc = await getDoc(doc(db, 'settings', 'general'));
      if (generalDoc.exists()) {
        const settings = generalDoc.data();
        turboSmsToken = settings.turboSmsToken || settings.smsApiToken;
        smsSender = settings.smsSender || settings.senderName || 'latiao_info'; // ✅ Fallback to approved name
      }
    }
    
    if (!turboSmsToken) {
      console.error('❌ TurboSMS API token not found in Firestore');
      showToast('Помилка налаштувань SMS. Зверніться до адміністратора.');
      getCodeBtn.innerHTML = originalText;
      getCodeBtn.disabled = false;
      return;
    }
    
    console.log('🔑 TurboSMS token found');
    console.log('📤 SMS Sender:', smsSender);
    
    // ========================================
    // STEP 3: Generate and Send SMS
    // ========================================
    generatedCode = generateCode();
    console.log('🔢 Generated code:', generatedCode);
    
    // ✅ CRITICAL: Clean phone number - TurboSMS requires NO '+' sign
    // Remove ALL non-digit characters: +380965661827 → 380965661827
    const purePhone = fullPhoneNumber.replace(/\D/g, '');
    console.log('📞 Original phone:', fullPhoneNumber);
    console.log('📞 Cleaned phone (no +):', purePhone);
    
    // ✅ TurboSMS API v2 Format: recipients MUST be array WITHOUT '+' sign
    const smsData = {
      recipients: [purePhone], // ✅ Array of pure digits
      sms: {
        sender: smsSender, // ✅ From settings or default 'Msg'
        text: `Ваш код: ${generatedCode}`
      }
    };
    
    console.log('🔍 Final SMS Payload:', JSON.stringify(smsData, null, 2));
    console.log('📤 Sending SMS via TurboSMS API v2...');
    
    const response = await fetch('https://api.turbosms.ua/message/send.json', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + turboSmsToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(smsData)
    });
    
    const result = await response.json();
    console.log('📨 TurboSMS Full Response:', JSON.stringify(result, null, 2));
    console.log('📨 Response Code:', result.response_code);
    console.log('📨 Response Status:', result.response_status);
    
    // Check for specific errors in response_result array
    if (result.response_result && Array.isArray(result.response_result)) {
      result.response_result.forEach((item, idx) => {
        if (item.error_code) {
          console.error(`❌ TurboSMS Error [${idx}]:`, item.error_code, item.error_message, item.phone);
        }
      });
    }
    
    if (result.response_code !== 0 && result.response_code !== 800 && result.response_code !== 801) {
      throw new Error(result.response_status || 'SMS sending failed');
    }
    
    // ========================================
    // STEP 4: Show Step 2 (OTP Input)
    // ========================================
    step1.classList.add('step-hidden');
    step1.classList.remove('step-visible');
    
    step2.classList.remove('step-hidden');
    step2.classList.add('step-visible', 'fade-in');
    
    // Update phone display
    if (phoneDisplay) {
      phoneDisplay.textContent = fullPhoneNumber.replace('+380', '+380 ').replace(/(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4');
    }
    
    // Reset button
    getCodeBtn.innerHTML = originalText;
    getCodeBtn.disabled = false;
    
    // Start timer
    startTimer(60);
    
    // Focus first OTP input
    setTimeout(() => {
      otpInputs[0].focus();
    }, 150);
    
    showToast('Код надіслано! 📱', 'success');
    
  } catch (error) {
    console.error('❌ Error in handleSendCode:', error);
    showToast(error.message || 'Помилка відправки коду. Спробуйте пізніше.');
    getCodeBtn.innerHTML = originalText;
    getCodeBtn.disabled = false;
  }
}

/**
 * Handle OTP verification
 */
async function handleVerifyCode() {
  const enteredCode = Array.from(otpInputs).map(i => i.value).join('');
  
  if (enteredCode.length !== 4) {
    showToast('Введіть 4-значний код');
    return;
  }
  
  // Show loading state
  loginBtn.disabled = true;
  loginBtn.innerHTML = `
    <svg class="animate-spin h-5 w-5 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  `;
  
  // Verify code
  if (enteredCode === generatedCode) {
    // ========================================
    // SUCCESS - Save session and redirect
    // ========================================
    console.log('✅ Code verified successfully!');
    
    loginBtn.innerHTML = '✓ Успішно!';
    loginBtn.classList.remove('bg-spicy');
    loginBtn.classList.add('bg-green-500');
    
    // Save user session to localStorage
    const sessionData = {
      ...customerData,
      phone: fullPhoneNumber,
      loginAt: new Date().toISOString()
    };
    
    localStorage.setItem('user_session', JSON.stringify(sessionData));
    
    // Also save phone for quick access
    localStorage.setItem('userPhone', fullPhoneNumber);
    
    showToast('Ви успішно увійшли! 🎉', 'success');
    
    // Log user activity (async, non-blocking)
    const userId = fullPhoneNumber.replace(/\+/g, '');
    logUserActivityFromLogin(userId, 'login');
    
    // Clear the generated code for security
    generatedCode = null;
    
    // Redirect to dashboard
    setTimeout(() => {
      window.location.href = './dashboard.html';
    }, 1500);
    
  } else {
    // ========================================
    // WRONG CODE
    // ========================================
    console.log('❌ Wrong code entered');
    
    showToast('Невірний код. Спробуйте ще раз.');
    
    // Shake animation
    otpInputs.forEach(input => {
      input.classList.add('shake');
      input.value = '';
      setTimeout(() => input.classList.remove('shake'), 400);
    });
    
    otpInputs[0].focus();
    resetLoginBtn();
  }
}

/**
 * Handle resend code
 */
async function handleResendCode() {
  if (resendAttempts >= MAX_RESEND_ATTEMPTS) {
    showToast('Вичерпано ліміт спроб. Спробуйте пізніше.');
    return;
  }
  
  resendAttempts++;
  resendBtn.disabled = true;
  resendBtn.textContent = 'Надсилаємо...';
  
  try {
    const firebase = await waitForFirebase();
    const { db, doc, getDoc } = firebase;
    
    // Get token and sender
    let turboSmsToken = null;
    let smsSender = 'latiao_info'; // ✅ Default to approved alpha-name
    
    const smsSettingsDoc = await getDoc(doc(db, 'settings', 'sms_settings'));
    if (smsSettingsDoc.exists()) {
      const settings = smsSettingsDoc.data();
      turboSmsToken = settings.turboSmsToken || settings.apiToken || settings.token;
      smsSender = settings.smsSender || settings.senderName || 'latiao_info'; // ✅ Fallback to approved name
    }
    
    if (!turboSmsToken) {
      const generalDoc = await getDoc(doc(db, 'settings', 'general'));
      if (generalDoc.exists()) {
        const settings = generalDoc.data();
        turboSmsToken = settings.turboSmsToken || settings.smsApiToken;
        smsSender = settings.smsSender || settings.senderName || 'latiao_info'; // ✅ Fallback to approved name
      }
    }
    
    if (!turboSmsToken) {
      throw new Error('SMS token not found');
    }
    
    // Generate new code
    generatedCode = generateCode();
    console.log('🔢 New code:', generatedCode);
    
    // ✅ Clean phone number - remove '+' sign
    const purePhone = fullPhoneNumber.replace(/\D/g, '');
    console.log('📞 Resend - Cleaned phone:', purePhone);
    
    const smsData = {
      recipients: [purePhone], // ✅ NO '+' sign
      sms: {
        sender: smsSender,
        text: `Ваш код: ${generatedCode}`
      }
    };
    
    console.log('🔍 Resend Payload:', JSON.stringify(smsData, null, 2));
    
    // Send SMS
    const response = await fetch('https://api.turbosms.ua/message/send.json', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + turboSmsToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(smsData)
    });
    
    const result = await response.json();
    console.log('📨 Resend Response:', JSON.stringify(result, null, 2));
    
    if (result.response_code !== 0 && result.response_code !== 800 && result.response_code !== 801) {
      throw new Error(result.response_status || 'SMS sending failed');
    }
    
    // Clear inputs and restart timer
    otpInputs.forEach(input => input.value = '');
    otpInputs[0].focus();
    resetLoginBtn();
    startTimer(60);
    
    showToast('Код надіслано повторно! 📱', 'success');
    
  } catch (error) {
    console.error('❌ Error resending code:', error);
    showToast('Помилка відправки коду');
  } finally {
    resendBtn.textContent = 'Надіслати код повторно';
    resendBtn.disabled = false;
  }
}

// ============================================
// EVENT LISTENERS
// ============================================

// Phone input formatting
phoneInput.addEventListener('input', (e) => {
  let value = e.target.value.replace(/\D/g, '');
  if (value.length > 9) value = value.slice(0, 9);
  
  // Format: XX XXX XX XX
  let formatted = '';
  if (value.length > 0) formatted += value.slice(0, 2);
  if (value.length > 2) formatted += ' ' + value.slice(2, 5);
  if (value.length > 5) formatted += ' ' + value.slice(5, 7);
  if (value.length > 7) formatted += ' ' + value.slice(7, 9);
  
  e.target.value = formatted;
  
  // Enable/disable button
  if (value.length === 9) {
    getCodeBtn.disabled = false;
    getCodeBtn.classList.remove('bg-gray-300');
    getCodeBtn.classList.add('bg-spicy', 'hover:bg-spicy-dark', 'hover:shadow-lg', 'hover:shadow-spicy/30');
  } else {
    getCodeBtn.disabled = true;
    getCodeBtn.classList.add('bg-gray-300');
    getCodeBtn.classList.remove('bg-spicy', 'hover:bg-spicy-dark', 'hover:shadow-lg', 'hover:shadow-spicy/30');
  }
});

// Enter key on phone input
phoneInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !getCodeBtn.disabled) {
    handleSendCode();
  }
});

// Get code button
getCodeBtn.addEventListener('click', handleSendCode);

// Back button
backBtn.addEventListener('click', () => {
  step2.classList.add('step-hidden');
  step2.classList.remove('step-visible');
  step1.classList.remove('step-hidden');
  step1.classList.add('step-visible', 'fade-in');
  
  clearInterval(timerInterval);
  otpInputs.forEach(input => input.value = '');
  resetLoginBtn();
  
  // Clear code for security
  generatedCode = null;
});

// OTP inputs
otpInputs.forEach((input, index) => {
  input.addEventListener('input', (e) => {
    const value = e.target.value.replace(/\D/g, '');
    e.target.value = value.slice(-1);
    
    if (value && index < otpInputs.length - 1) {
      otpInputs[index + 1].focus();
    }
    
    checkOtpComplete();
  });
  
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && !e.target.value && index > 0) {
      otpInputs[index - 1].focus();
    }
    
    // Enter key to submit
    if (e.key === 'Enter' && !loginBtn.disabled) {
      handleVerifyCode();
    }
  });
  
  input.addEventListener('paste', (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    paste.split('').forEach((char, i) => {
      if (otpInputs[i]) otpInputs[i].value = char;
    });
    checkOtpComplete();
    if (paste.length === 4) {
      otpInputs[3].focus();
    }
  });
});

// Login button
loginBtn.addEventListener('click', handleVerifyCode);

// Resend button
resendBtn.addEventListener('click', handleResendCode);

// ============================================
// BACKGROUND ANIMATION
// ============================================
function initBackgroundAnimation() {
  const container = document.getElementById('bg-animation');
  if (!container) return;
  
  const emojis = ['🌶️', '🔥'];
  const count = 28;
  
  for (let i = 0; i < count; i++) {
    const emoji = document.createElement('div');
    emoji.className = 'floating-emoji';
    emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    
    emoji.style.left = Math.random() * 100 + '%';
    emoji.style.bottom = '-50px';
    emoji.style.fontSize = (Math.random() * 2 + 1) + 'rem';
    emoji.style.opacity = (Math.random() * 0.3 + 0.2).toFixed(2);
    
    const duration = Math.random() * 10 + 15;
    const delay = Math.random() * 5;
    emoji.style.animation = `floatUp ${duration}s linear ${delay}s infinite`;
    
    container.appendChild(emoji);
  }
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  initBackgroundAnimation();
  
  // Check if already logged in
  const existingSession = localStorage.getItem('user_session');
  if (existingSession) {
    try {
      const session = JSON.parse(existingSession);
      if (session && session.phone) {
        console.log('🔐 Already logged in, redirecting...');
        window.location.href = './dashboard.html';
      }
    } catch (e) {
      localStorage.removeItem('user_session');
    }
  }
  
  // Focus phone input
  phoneInput.focus();
});

console.log('📱 Login module loaded (TurboSMS Direct)');