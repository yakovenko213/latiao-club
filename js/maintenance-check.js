// ============================================
// MAINTENANCE MODE CHECK MODULE
// ============================================
// This module checks if the site is in maintenance mode
// and displays a "Under Maintenance" screen if needed.
// Import this FIRST on all public pages to prevent flashing.

import { db } from './firebase-init.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

/**
 * Check if maintenance mode is active.
 * ADMIN BYPASS: Admins (marked in localStorage) can view the site with a warning badge.
 * Regular users see the maintenance screen.
 */
export async function checkMaintenanceMode() {
    try {
        console.log('🔍 Checking maintenance mode...');
        const globalDoc = await getDoc(doc(db, 'settings', 'global'));
        const isMaintenanceMode = globalDoc.exists() && globalDoc.data().isMaintenance === true;
        
        // Check if current user is an admin (marked in localStorage)
        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        
        if (isMaintenanceMode && !isAdmin) {
            // BLOCK SITE FOR REGULAR USERS
            console.log('🚧 MAINTENANCE MODE ACTIVE - Blocking site for public users');
            renderMaintenanceScreen();
            throw new Error('MAINTENANCE_MODE_ACTIVE');
            
        } else if (isMaintenanceMode && isAdmin) {
            // ALLOW ACCESS FOR ADMINS WITH WARNING
            console.warn('⚠️ Maintenance Mode is ON, but you have Admin access.');
            showAdminMaintenanceBadge();
            
        } else {
            // NORMAL MODE
            console.log('✅ Site is operational - proceeding with normal load');
        }
        
    } catch (error) {
        if (error.message === 'MAINTENANCE_MODE_ACTIVE') {
            // Expected - maintenance mode is on, stop everything
            return;
        }
        // Unexpected error - log but allow site to load (fail-safe)
        console.error('⚠️ Error checking maintenance mode:', error);
    }
}

/**
 * Render the maintenance screen (blocks entire site)
 */
function renderMaintenanceScreen() {
    document.body.innerHTML = `
        <div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
            <div class="max-w-2xl w-full text-center space-y-8 animate-fade-in">
                <!-- Icon/Image -->
                <div class="flex justify-center mb-8">
                    <img 
                        src="./oops.png" 
                        alt="Oops, technical works" 
                        class="w-64 max-w-md"
                    />
                </div>
                
                <!-- Title -->
                <h1 class="text-4xl md:text-5xl font-black text-white leading-tight">
                    🚧 Сайт на технічному обслуговуванні
                </h1>
                
                <!-- Message -->
                <p class="text-xl text-gray-300 leading-relaxed">
                    Ми оновлюємося, щоб стати кращими!<br>
                    Повернемось зовсім скоро.
                </p>
                
                <!-- Socials (Optional) -->
                <div class="flex justify-center gap-6 pt-8">
                    <a 
                        href="https://instagram.com/latiao.club" 
                        target="_blank"
                        class="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full font-semibold hover:scale-105 transition-transform shadow-lg"
                    >
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z"/>
                        </svg>
                        Instagram
                    </a>
                    <a 
                        href="https://t.me/latiao_club" 
                        target="_blank"
                        class="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full font-semibold hover:scale-105 transition-transform shadow-lg"
                    >
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                        </svg>
                        Telegram
                    </a>
                </div>
                
                <!-- Footer Note -->
                <p class="text-sm text-gray-500 pt-8">
                    Будь ласка, зв'яжіться з нами в соцмережах для термінових питань
                </p>
            </div>
        </div>
        
        <!-- Fade-in Animation -->
        <style>
            @keyframes fade-in {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in {
                animation: fade-in 0.8s ease-out;
            }
        </style>
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
    badge.className = 'fixed bottom-4 right-4 z-50 bg-red-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-pulse';
    badge.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        <span class="text-sm font-semibold">🔧 Режим: Технічні роботи (Ви бачите сайт як Адмін)</span>
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
