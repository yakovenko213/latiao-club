// ============================================
// MAINTENANCE MODE CHECK MODULE
// ============================================
// This module checks if the site is in maintenance mode
// and displays a "Under Maintenance" screen if needed.
// Import this FIRST on all public pages to prevent flashing.

import { db, auth } from './firebase-init.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Admin email for bypass - update this to your admin email
const ADMIN_EMAIL = 'admin@modernshop.com';

// Secret bypass key - add ?bypass=latiao2024 to URL to access during maintenance
const BYPASS_KEY = 'latiao2024';

/**
 * Check if bypass key is in URL
 */
function hasBypassKey() {
    const urlParams = new URLSearchParams(window.location.search);
    const bypassParam = urlParams.get('bypass');
    if (bypassParam === BYPASS_KEY) {
        // Store in sessionStorage so you don't need to add it to every page
        sessionStorage.setItem('maintenanceBypass', 'true');
        console.log('🔑 Bypass key accepted - storing in session');
        return true;
    }
    // Check if already bypassed in this session
    if (sessionStorage.getItem('maintenanceBypass') === 'true') {
        console.log('🔑 Bypass active from session');
        return true;
    }
    return false;
}

/**
 * Check if user is admin through multiple methods:
 * 1. Firestore document check (isAdmin field)
 * 2. Email check against ADMIN_EMAIL
 * 3. localStorage fallback
 */
async function isUserAdmin(user) {
    if (!user) return false;
    
    try {
        // Check 1: Email match (fastest)
        if (user.email === ADMIN_EMAIL) {
            console.log('✅ Admin detected by email:', user.email);
            return true;
        }
        
        // Check 2: localStorage fallback (for offline/quick access)
        const localAdminFlag = localStorage.getItem('isAdmin');
        if (localAdminFlag === 'true') {
            console.log('✅ Admin detected from localStorage');
            return true;
        }
        
        // Check 3: Firestore check (most reliable for role-based access)
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists() && userDocSnap.data().isAdmin === true) {
            console.log('✅ Admin detected from Firestore');
            localStorage.setItem('isAdmin', 'true'); // Cache for next time
            return true;
        }
        
        return false;
        
    } catch (error) {
        console.warn('⚠️ Error checking admin status:', error);
        // Fallback: if Firestore fails, trust localStorage
        return localStorage.getItem('isAdmin') === 'true';
    }
}

/**
 * Check if maintenance mode is active.
 * FAIL-SAFE: Always reveals page even if errors occur.
 * INSTANT ADMIN CHECK: Checks auth.currentUser synchronously before async operations.
 */
export async function checkMaintenanceMode() {
    try {
        console.log('🔍 Checking maintenance mode...');
        
        // ⚡ INSTANT ADMIN CHECK (Synchronous - No Waiting!)
        // If user is already logged in as admin, bypass immediately
        if (auth && auth.currentUser) {
            const currentEmail = auth.currentUser.email;
            if (currentEmail === ADMIN_EMAIL) {
                console.log('⚡ INSTANT ADMIN DETECTED:', currentEmail);
                console.log('🔑 Admin bypass activated - skipping all maintenance checks');
                localStorage.setItem('isAdmin', 'true');
                sessionStorage.setItem('maintenanceBypass', 'true');
                
                // Show admin badge and reveal site immediately
                try {
                    showAdminMaintenanceBadge();
                } catch (e) {
                    console.warn('Badge display failed, continuing...', e);
                }
                
                revealPage();
                return;
            }
        }
        
        // Quick check: URL bypass key (fastest)
        if (hasBypassKey()) {
            console.log('🔑 Bypass key detected - allowing access');
            try {
                showAdminMaintenanceBadge();
            } catch (e) {
                console.warn('Badge display failed, continuing...', e);
            }
            revealPage();
            return;
        }
        
        // Step 1: Get maintenance status from Firestore (with timeout)
        let isMaintenanceMode = false;
        try {
            const globalDoc = await Promise.race([
                getDoc(doc(db, 'settings', 'global')),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), 3000))
            ]);
            isMaintenanceMode = globalDoc.exists() && globalDoc.data().isMaintenance === true;
        } catch (firestoreError) {
            console.warn('⚠️ Firestore check failed, assuming no maintenance:', firestoreError.message);
            // FAIL-SAFE: If Firestore fails, allow access (better than blocking)
            revealPage();
            return;
        }
        
        if (!isMaintenanceMode) {
            // NORMAL MODE - No maintenance, reveal site immediately
            revealPage();
            return;
        }
        
        // Step 2: Maintenance is ON - Wait for Auth to determine if user is admin
        console.log('⏳ Maintenance Mode detected - waiting for auth state...');
        
        const currentUser = await waitForAuthState();
        
        // Step 3: Check if user is admin (multiple methods)
        const adminAccess = await isUserAdmin(currentUser);
        
        if (adminAccess) {
            // ALLOW ACCESS FOR ADMIN WITH WARNING BADGE
            console.warn('⚠️ Maintenance Mode is ON, but you have Admin access.');
            try {
                showAdminMaintenanceBadge();
            } catch (e) {
                console.warn('Badge display failed, continuing...', e);
            }
            revealPage(); // Reveal site for admin
            
        } else {
            // BLOCK SITE FOR REGULAR USERS
            console.log('🚧 MAINTENANCE MODE ACTIVE - Blocking site for public users');
            try {
                renderMaintenanceScreen();
            } catch (e) {
                console.error('Failed to render maintenance screen:', e);
            }
            revealPage(); // Reveal maintenance screen
            throw new Error('MAINTENANCE_MODE_ACTIVE');
        }
        
    } catch (error) {
        if (error.message === 'MAINTENANCE_MODE_ACTIVE') {
            // Expected - maintenance mode is on, stop everything
            return;
        }
        // FAIL-SAFE: Unexpected error - log but ALWAYS reveal page
        console.error('⚠️ Critical error in maintenance check - FAILING OPEN (allowing access):', error);
        
        // Force reveal page even on error
        try {
            revealPage();
        } catch (revealError) {
            // Last resort: manual reveal
            console.error('Even revealPage failed - forcing manual reveal:', revealError);
            if (document.body) {
                document.body.style.visibility = 'visible';
                document.body.style.opacity = '1';
            }
        }
    }
}

/**
 * Wait for Firebase Auth state to be determined.
 * Returns the current user or null if not authenticated.
 * Timeout after 3 seconds to prevent infinite waiting.
 */
function waitForAuthState() {
    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            console.warn('⏱️ Auth check timed out after 3 seconds - assuming not admin');
            resolve(null);
        }, 3000);
        
        const unsubscribe = auth.onAuthStateChanged((user) => {
            clearTimeout(timeout);
            unsubscribe(); // Stop listening after first result
            console.log('🔐 Auth state resolved:', user ? `Logged in as ${user.email}` : 'Not authenticated');
            resolve(user);
        });
    });
}

/**
 * Reveal the page with smooth fade-in after maintenance check
 * FAIL-SAFE: Catches all errors and forces visibility
 */
function revealPage() {
    try {
        // Remove the anti-flash style to make body visible
        if (document.body) {
            document.body.style.visibility = 'visible';
            document.body.style.opacity = '1';
        }
        
        // Optionally remove the inline style tag from head
        const antiFlashStyle = document.getElementById('anti-flash-style');
        if (antiFlashStyle) {
            antiFlashStyle.remove();
        }
        
        console.log('✨ Page revealed successfully');
    } catch (error) {
        // ULTIMATE FAIL-SAFE: Force visibility even if everything fails
        console.error('revealPage error - forcing visibility:', error);
        try {
            if (document.body) {
                document.body.setAttribute('style', 'visibility: visible !important; opacity: 1 !important;');
            }
        } catch (ultimateError) {
            console.error('CRITICAL: Cannot reveal page:', ultimateError);
        }
    }
}

/**
 * Render the maintenance screen (blocks entire site)
 * FAIL-SAFE: Wrapped in try-catch to prevent crashes
 */
function renderMaintenanceScreen() {
    try {
        if (!document.body) {
            console.error('Cannot render maintenance screen - document.body not available');
            return;
        }
        
        document.body.innerHTML = `
        <!-- CSS Animations for Flying Peppers -->
        <style>
            @keyframes fade-in {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in {
                animation: fade-in 0.8s ease-out;
            }
            
            /* Floating Pepper Animation */
            @keyframes float-pepper {
                0%, 100% { 
                    transform: translateY(0px) translateX(0px) rotate(0deg); 
                }
                25% { 
                    transform: translateY(-20px) translateX(10px) rotate(5deg); 
                }
                50% { 
                    transform: translateY(-40px) translateX(-10px) rotate(-5deg); 
                }
                75% { 
                    transform: translateY(-20px) translateX(5px) rotate(3deg); 
                }
            }
            
            @keyframes float-pepper-reverse {
                0%, 100% { 
                    transform: translateY(0px) translateX(0px) rotate(0deg); 
                }
                25% { 
                    transform: translateY(20px) translateX(-10px) rotate(-5deg); 
                }
                50% { 
                    transform: translateY(40px) translateX(10px) rotate(5deg); 
                }
                75% { 
                    transform: translateY(20px) translateX(-5px) rotate(-3deg); 
                }
            }
            
            .pepper-float {
                animation: float-pepper 8s ease-in-out infinite;
                opacity: 0.15;
            }
            
            .pepper-float-reverse {
                animation: float-pepper-reverse 10s ease-in-out infinite;
                opacity: 0.12;
            }
        </style>
        
        <div class="min-h-screen bg-white relative flex items-center justify-center px-4 overflow-hidden">
            <!-- Flying Peppers Background Layer -->
            <div class="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <!-- Row 1 - Top -->
                <img src="https://cdn-icons-png.flaticon.com/512/2921/2921829.png" 
                     class="pepper-float absolute w-12 h-12" 
                     style="top: 5%; left: 10%; animation-delay: 0s;" alt="">
                <img src="https://cdn-icons-png.flaticon.com/512/2921/2921829.png" 
                     class="pepper-float-reverse absolute w-16 h-16" 
                     style="top: 8%; left: 75%; animation-delay: 1.5s;" alt="">
                <img src="https://cdn-icons-png.flaticon.com/512/2921/2921829.png" 
                     class="pepper-float absolute w-10 h-10" 
                     style="top: 12%; left: 45%; animation-delay: 3s;" alt="">
                
                <!-- Row 2 - Upper Middle -->
                <img src="https://cdn-icons-png.flaticon.com/512/2921/2921829.png" 
                     class="pepper-float-reverse absolute w-14 h-14" 
                     style="top: 25%; left: 5%; animation-delay: 2s;" alt="">
                <img src="https://cdn-icons-png.flaticon.com/512/2921/2921829.png" 
                     class="pepper-float absolute w-12 h-12" 
                     style="top: 28%; left: 85%; animation-delay: 4s;" alt="">
                <img src="https://cdn-icons-png.flaticon.com/512/2921/2921829.png" 
                     class="pepper-float-reverse absolute w-11 h-11" 
                     style="top: 32%; left: 60%; animation-delay: 1s;" alt="">
                
                <!-- Row 3 - Middle -->
                <img src="https://cdn-icons-png.flaticon.com/512/2921/2921829.png" 
                     class="pepper-float absolute w-13 h-13" 
                     style="top: 48%; left: 15%; animation-delay: 3.5s;" alt="">
                <img src="https://cdn-icons-png.flaticon.com/512/2921/2921829.png" 
                     class="pepper-float-reverse absolute w-15 h-15" 
                     style="top: 52%; left: 90%; animation-delay: 2.5s;" alt="">
                
                <!-- Row 4 - Lower Middle -->
                <img src="https://cdn-icons-png.flaticon.com/512/2921/2921829.png" 
                     class="pepper-float absolute w-12 h-12" 
                     style="top: 68%; left: 8%; animation-delay: 1.2s;" alt="">
                <img src="https://cdn-icons-png.flaticon.com/512/2921/2921829.png" 
                     class="pepper-float-reverse absolute w-14 h-14" 
                     style="top: 65%; left: 70%; animation-delay: 4.5s;" alt="">
                <img src="https://cdn-icons-png.flaticon.com/512/2921/2921829.png" 
                     class="pepper-float absolute w-11 h-11" 
                     style="top: 72%; left: 40%; animation-delay: 0.5s;" alt="">
                
                <!-- Row 5 - Bottom -->
                <img src="https://cdn-icons-png.flaticon.com/512/2921/2921829.png" 
                     class="pepper-float-reverse absolute w-16 h-16" 
                     style="top: 85%; left: 20%; animation-delay: 3.8s;" alt="">
                <img src="https://cdn-icons-png.flaticon.com/512/2921/2921829.png" 
                     class="pepper-float absolute w-13 h-13" 
                     style="top: 88%; left: 80%; animation-delay: 2.2s;" alt="">
                <img src="https://cdn-icons-png.flaticon.com/512/2921/2921829.png" 
                     class="pepper-float-reverse absolute w-12 h-12" 
                     style="top: 92%; left: 55%; animation-delay: 1.8s;" alt="">
            </div>
            
            <!-- Main Content (Above Peppers) -->
            <div class="max-w-2xl w-full text-center space-y-8 animate-fade-in relative z-10">
                <!-- Icon/Image -->
                <div class="flex justify-center mb-8">
                    <img 
                        src="./oops.png" 
                        alt="Oops, technical works" 
                        class="w-64 max-w-md"
                    />
                </div>
                
                <!-- Title -->
                <h1 class="text-4xl md:text-5xl font-black text-gray-900 leading-tight">
                    🚧 Сайт на технічному обслуговуванні
                </h1>
                
                <!-- Message -->
                <p class="text-xl text-gray-600 leading-relaxed">
                    Ми оновлюємося, щоб стати кращими!<br>
                    Повернемось зовсім скоро.
                </p>
                
                <!-- Instagram Button (Prominent & Centered) -->
                <div class="flex justify-center pt-8">
                    <a 
                        href="https://instagram.com/latiao_snack" 
                        target="_blank"
                        class="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-600 text-white rounded-full text-xl font-bold hover:scale-110 hover:shadow-2xl transition-all duration-300 shadow-lg"
                    >
                        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                        <span>Instagram</span>
                    </a>
                </div>
                
                <!-- Footer Note -->
                <p class="text-sm text-gray-500 pt-8">
                    Зв'яжіться з нами в Instagram для термінових питань
                </p>
            </div>
        </div>
    `;
    } catch (error) {
        console.error('Failed to render maintenance screen:', error);
        // Don't throw - let the page continue
    }
}

/**
 * Show prominent banner for admins when maintenance mode is ON
 */
function showAdminMaintenanceBadge() {
    // Prevent duplicate badges
    if (document.getElementById('admin-maintenance-badge')) return;
    
    const banner = document.createElement('div');
    banner.id = 'admin-maintenance-badge';
    banner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 999999;
        background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
        color: white;
        padding: 12px 20px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        animation: slideDown 0.5s ease-out;
    `;
    
    banner.innerHTML = `
        <style>
            @keyframes slideDown {
                from { transform: translateY(-100%); }
                to { transform: translateY(0); }
            }
            @keyframes warningPulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
            #admin-maintenance-icon {
                animation: warningPulse 2s ease-in-out infinite;
            }
        </style>
        <div style="max-width: 1400px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 16px;">
            <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                <span id="admin-maintenance-icon" style="font-size: 24px;">⚠️</span>
                <div>
                    <div style="font-weight: 700; font-size: 16px; margin-bottom: 2px;">
                        Режим технічних робіт увімкнено
                    </div>
                    <div style="font-size: 13px; opacity: 0.95;">
                        Сайт зараз бачите тільки ви (Адміністратор). Відвідувачі бачать екран обслуговування.
                    </div>
                </div>
            </div>
            <button 
                onclick="if(confirm('Не забудьте вимкнути режим технічних робіт в адмін-панелі після завершення тестування!')) { this.parentElement.parentElement.style.display = 'none'; }"
                style="
                    background: rgba(255, 255, 255, 0.2);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    color: white;
                    padding: 8px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 600;
                    transition: all 0.2s;
                    white-space: nowrap;
                "
                onmouseover="this.style.background='rgba(255, 255, 255, 0.3)'"
                onmouseout="this.style.background='rgba(255, 255, 255, 0.2)'"
            >
                Зрозуміло ✓
            </button>
        </div>
    `;
    
    // Insert banner into body (after it's loaded)
    if (document.body) {
        document.body.appendChild(banner);
        // Push content down to avoid overlap
        document.body.style.paddingTop = '80px';
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            document.body.appendChild(banner);
            document.body.style.paddingTop = '80px';
        });
    }
    
    console.log('🔴 Admin banner displayed - Maintenance Mode is ON but bypassed for admin');
}

// Auto-run check on import (top-level await)
await checkMaintenanceMode();
