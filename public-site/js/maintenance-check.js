// ============================================
// MAINTENANCE MODE CHECK MODULE
// ============================================
// This module checks if the site is in maintenance mode
// and displays a "Under Maintenance" screen if needed.
// Import this FIRST on all public pages to prevent flashing.

import { db, auth } from './firebase-init.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Admin email for bypass (change to your actual admin email)
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
 * ADMIN BYPASS: Waits for Firebase Auth to confirm if user is admin.
 * Regular users see the maintenance screen, admins get access with a badge.
 */
export async function checkMaintenanceMode() {
    try {
        console.log('🔍 Checking maintenance mode...');
        
        // Quick check: URL bypass key (fastest)
        if (hasBypassKey()) {
            console.log('🔑 Bypass key detected - allowing access');
            showAdminMaintenanceBadge();
            revealPage();
            return;
        }
        
        // Step 1: Get maintenance status from Firestore
        const globalDoc = await getDoc(doc(db, 'settings', 'global'));
        const isMaintenanceMode = globalDoc.exists() && globalDoc.data().isMaintenance === true;
        
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
            showAdminMaintenanceBadge();
            revealPage(); // Reveal site for admin
            
        } else {
            // BLOCK SITE FOR REGULAR USERS
            console.log('🚧 MAINTENANCE MODE ACTIVE - Blocking site for public users');
            renderMaintenanceScreen();
            revealPage(); // Reveal maintenance screen
            throw new Error('MAINTENANCE_MODE_ACTIVE');
        }
        
    } catch (error) {
        if (error.message === 'MAINTENANCE_MODE_ACTIVE') {
            // Expected - maintenance mode is on, stop everything
            return;
        }
        // Unexpected error - log but allow site to load (fail-safe)
        console.error('⚠️ Error checking maintenance mode:', error);
        revealPage(); // Reveal site even on error (fail-safe)
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
 * Removes the anti-flash hiding and smoothly reveals content
 */
function revealPage() {
    // Remove the anti-flash style to make body visible
    document.body.style.visibility = 'visible';
    document.body.style.opacity = '1';
    
    // Optionally remove the inline style tag from head
    const antiFlashStyle = document.getElementById('anti-flash-style');
    if (antiFlashStyle) {
        antiFlashStyle.remove();
    }
}

/**
 * Render the maintenance screen (blocks entire site)
 */
function renderMaintenanceScreen() {
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
}

/**
 * Show floating badge for admins when maintenance mode is ON
 */
function showAdminMaintenanceBadge() {
    // Prevent duplicate badges
    if (document.getElementById('admin-maintenance-badge')) return;
    
    const badge = document.createElement('div');
    badge.id = 'admin-maintenance-badge';
    badge.className = 'fixed bottom-4 right-4 z-50 bg-red-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 animate-pulse';
    badge.innerHTML = `
        <svg class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        <div class="flex flex-col gap-1">
            <span class="text-sm font-bold">🔧 Режим: Технічні роботи</span>
            <span class="text-xs opacity-90">Ви маєте права адміністратора</span>
        </div>
    `;
    
    // Insert badge into body (after it's loaded)
    if (document.body) {
        document.body.appendChild(badge);
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            document.body.appendChild(badge);
        });
    }
    
    console.log('🔴 Admin badge displayed - Maintenance Mode is ON but bypassed');
}

// Auto-run check on import (top-level await)
await checkMaintenanceMode();
