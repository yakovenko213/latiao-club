// ============================================
// GLOBAL BLACKLIST SECURITY SYSTEM
// ============================================
// Checks if current user is blacklisted and blocks site access

(async function() {
    'use strict';
    
    // ============================================
    // CONFIGURATION
    // ============================================
    const CACHE_KEY = 'latiao_blacklist_check';
    const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
    const DEBUG_MODE = false; // Set to true for debugging
    
    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    
    function log(message, data = null) {
        if (DEBUG_MODE) {
            console.log(`🛡️ [BLACKLIST]: ${message}`, data || '');
        }
    }
    
    // Get current user identification from various localStorage sources
    function getCurrentUserPhone() {
        try {
            // Method 1: Direct userPhone storage
            const userPhone = localStorage.getItem('userPhone');
            if (userPhone) {
                log('Found user phone (method 1):', userPhone);
                return userPhone.replace(/\D/g, ''); // Remove non-digits
            }
            
            // Method 2: User session data
            const userSession = localStorage.getItem('user_session');
            if (userSession) {
                const userData = JSON.parse(userSession);
                if (userData && userData.phone) {
                    log('Found user phone (method 2):', userData.phone);
                    return userData.phone.replace(/\D/g, '');
                }
            }
            
            // Method 3: Checkout phone data
            const checkoutPhone = localStorage.getItem('latiao_checkout_phone');
            if (checkoutPhone) {
                log('Found user phone (method 3):', checkoutPhone);
                return checkoutPhone.replace(/\D/g, '');
            }
            
            // Method 4: Check for any phone-like data in localStorage
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                
                // Look for phone-like patterns
                if (key.toLowerCase().includes('phone') || key.toLowerCase().includes('tel')) {
                    const cleanPhone = value.replace(/\D/g, '');
                    if (cleanPhone.length >= 10 && cleanPhone.length <= 15) {
                        log('Found user phone (method 4):', cleanPhone);
                        return cleanPhone;
                    }
                }
            }
            
            log('No user phone found in localStorage');
            return null;
        } catch (error) {
            log('Error getting user phone:', error);
            return null;
        }
    }
    
    // Check cache for previous blacklist result
    function getCachedBlacklistResult(phone) {
        try {
            const cached = localStorage.getItem(`${CACHE_KEY}_${phone}`);
            if (!cached) return null;
            
            const cacheData = JSON.parse(cached);
            const now = Date.now();
            
            if (now - cacheData.timestamp > CACHE_DURATION) {
                localStorage.removeItem(`${CACHE_KEY}_${phone}`);
                log('Cache expired for phone:', phone);
                return null;
            }
            
            log('Using cached blacklist result for phone:', phone, cacheData.blocked);
            return cacheData.blocked;
        } catch (error) {
            log('Error reading cache:', error);
            return null;
        }
    }
    
    // Save blacklist result to cache
    function setCachedBlacklistResult(phone, blocked) {
        try {
            const cacheData = {
                blocked: blocked,
                timestamp: Date.now()
            };
            localStorage.setItem(`${CACHE_KEY}_${phone}`, JSON.stringify(cacheData));
            log('Cached blacklist result for phone:', phone, blocked);
        } catch (error) {
            log('Error saving cache:', error);
        }
    }
    
    // ============================================
    // FIRESTORE BLACKLIST CHECK
    // ============================================
    
    async function checkBlacklistInFirestore(phone) {
        try {
            log('Checking blacklist in Firestore for phone:', phone);
            
            // Dynamic Firebase imports to avoid blocking page load
            const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
            const { getFirestore, doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            // Firebase config (same as firebase-init.js)
            const firebaseConfig = {
                apiKey: "AIzaSyDyQvItRyL4IKl9NmEItswwPOEiKAbWkMw",
                authDomain: "my-magazin-81c96.firebaseapp.com",
                projectId: "my-magazin-81c96",
                storageBucket: "my-magazin-81c96.firebasestorage.app",
                messagingSenderId: "129061757346",
                appId: "1:129061757346:web:3e7bc5838cc5f7bda992fb"
            };
            
            // Initialize Firebase
            const app = initializeApp(firebaseConfig);
            const db = getFirestore(app);
            
            // Check blacklist document
            const blacklistDoc = await getDoc(doc(db, 'blacklist', phone));
            const blocked = blacklistDoc.exists() && blacklistDoc.data().blocked === true;
            
            log('Firestore blacklist check result:', phone, blocked);
            
            // Cache the result
            setCachedBlacklistResult(phone, blocked);
            
            return blocked;
        } catch (error) {
            log('Error checking Firestore blacklist:', error);
            // In case of error, assume not blocked to avoid false positives
            return false;
        }
    }
    
    // ============================================
    // ACCESS DENIED SCREEN
    // ============================================
    
    function showAccessDeniedScreen() {
        log('Showing access denied screen');
        
        // Replace entire body content
        document.body.innerHTML = `
            <div id="access-denied-overlay" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: linear-gradient(135deg, #1a1a1a 0%, #2d0a1e 50%, #1a1a1a 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 999999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                text-align: center;
                color: white;
                padding: 20px;
                box-sizing: border-box;
                overflow: hidden;
            ">
                <div style="
                    max-width: 600px;
                    width: 100%;
                    padding: 60px 40px;
                    background: rgba(30, 30, 30, 0.95);
                    border-radius: 20px;
                    border: 2px solid rgba(220, 38, 127, 0.3);
                    box-shadow: 
                        0 25px 50px rgba(0, 0, 0, 0.5),
                        0 0 100px rgba(220, 38, 127, 0.1);
                    backdrop-filter: blur(10px);
                    animation: fadeInScale 0.6s ease-out;
                ">
                    <!-- Lock Icon -->
                    <div style="
                        font-size: 80px;
                        color: #dc267f;
                        margin-bottom: 30px;
                        text-shadow: 0 0 30px rgba(220, 38, 127, 0.5);
                        animation: pulse 2s infinite;
                    ">🔒</div>
                    
                    <!-- Header -->
                    <h1 style="
                        font-size: 32px;
                        font-weight: 700;
                        margin: 0 0 20px 0;
                        color: #ffffff;
                        text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
                        line-height: 1.2;
                    ">Доступ до сайту обмежено</h1>
                    
                    <!-- Message -->
                    <p style="
                        font-size: 18px;
                        line-height: 1.6;
                        color: #e0e0e0;
                        margin: 0 0 40px 0;
                        text-align: left;
                        background: rgba(40, 40, 40, 0.6);
                        padding: 25px;
                        border-radius: 12px;
                        border-left: 4px solid #dc267f;
                    ">
                        Ваш доступ до ресурсу <strong style="color: #ff6b35;">Latiao Snack</strong> заблоkovано через порушення правил використання або за рішенням адміністрації.
                        <br><br>
                        Якщо ви вважаєте це помилкою — зв'яжіться з підтримкою.
                    </p>
                    
                    <!-- Contact Info -->
                    <div style="
                        background: rgba(220, 38, 127, 0.1);
                        border: 1px solid rgba(220, 38, 127, 0.3);
                        border-radius: 12px;
                        padding: 20px;
                        margin-bottom: 30px;
                    ">
                        <h3 style="
                            font-size: 16px;
                            font-weight: 600;
                            margin: 0 0 15px 0;
                            color: #dc267f;
                        ">📞 Служба підтримки</h3>
                        <p style="
                            margin: 0;
                            font-size: 14px;
                            color: #b0b0b0;
                            line-height: 1.4;
                        ">
                            Telegram: <a href="https://t.me/latiao_support" style="color: #dc267f; text-decoration: none;">@latiao_support</a><br>
                            Email: support@latiao-snack.com.ua
                        </p>
                    </div>
                    
                    <!-- Footer -->
                    <div style="
                        font-size: 12px;
                        color: #808080;
                        border-top: 1px solid rgba(255, 255, 255, 0.1);
                        padding-top: 20px;
                        margin-top: 20px;
                    ">
                        © ${new Date().getFullYear()} Latiao Snack. Всі права захищені.
                    </div>
                </div>
                
                <!-- Background Animation -->
                <div style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-image: 
                        radial-gradient(circle at 20% 80%, rgba(220, 38, 127, 0.1) 0%, transparent 50%),
                        radial-gradient(circle at 80% 20%, rgba(255, 107, 53, 0.1) 0%, transparent 50%);
                    z-index: -1;
                    animation: backgroundPulse 4s ease-in-out infinite alternate;
                "></div>
            </div>
            
            <style>
                @keyframes fadeInScale {
                    from {
                        opacity: 0;
                        transform: scale(0.9) translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
                
                @keyframes pulse {
                    0%, 100% {
                        transform: scale(1);
                        opacity: 1;
                    }
                    50% {
                        transform: scale(1.05);
                        opacity: 0.8;
                    }
                }
                
                @keyframes backgroundPulse {
                    0% {
                        opacity: 0.3;
                    }
                    100% {
                        opacity: 0.6;
                    }
                }
                
                /* Prevent scrolling and interactions */
                html, body {
                    overflow: hidden !important;
                    height: 100vh !important;
                    margin: 0 !important;
                    padding: 0 !important;
                }
                
                /* Hide all other content */
                body > *:not(#access-denied-overlay) {
                    display: none !important;
                }
            </style>
        `;
        
        // Disable all interactions
        document.addEventListener('contextmenu', e => e.preventDefault());
        document.addEventListener('keydown', e => e.preventDefault());
        document.addEventListener('selectstart', e => e.preventDefault());
        
        // Block navigation attempts
        window.addEventListener('beforeunload', (e) => {
            e.preventDefault();
            e.returnValue = '';
        });
    }
    
    // ============================================
    // MAIN BLACKLIST CHECK FUNCTION
    // ============================================
    
    async function performBlacklistCheck() {
        try {
            log('Starting blacklist security check...');
            
            // Get current user phone
            const userPhone = getCurrentUserPhone();
            if (!userPhone) {
                log('No user phone found - allowing access');
                return; // No user identified, allow access
            }
            
            log('Checking blacklist for phone:', userPhone);
            
            // Check cache first
            const cachedResult = getCachedBlacklistResult(userPhone);
            if (cachedResult !== null) {
                if (cachedResult === true) {
                    showAccessDeniedScreen();
                    return;
                } else {
                    log('User not blocked (cached)');
                    return;
                }
            }
            
            // Check Firestore
            const isBlocked = await checkBlacklistInFirestore(userPhone);
            if (isBlocked) {
                showAccessDeniedScreen();
            } else {
                log('User not blocked (Firestore)');
            }
            
        } catch (error) {
            log('Error in blacklist check:', error);
            // In case of error, allow access to avoid false positives
        }
    }
    
    // ============================================
    // INITIALIZATION
    // ============================================
    
    // Run immediately if DOM is already loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', performBlacklistCheck);
    } else {
        performBlacklistCheck();
    }
    
    // ============================================
    // TESTING UTILITIES (Console Only)
    // ============================================
    
    // Expose testing functions to global window (only in debug mode)
    if (DEBUG_MODE) {
        window.testBlacklistSystem = {
            checkCurrentUser: getCurrentUserPhone,
            forceBlacklistCheck: performBlacklistCheck,
            showAccessDenied: showAccessDeniedScreen,
            clearCache: () => {
                const keys = Object.keys(localStorage);
                keys.forEach(key => {
                    if (key.startsWith(CACHE_KEY)) {
                        localStorage.removeItem(key);
                        log('Cleared cache key:', key);
                    }
                });
            }
        };
        
        log('🔧 Testing utilities available at window.testBlacklistSystem');
    }
})();