// ============================================
// PROMOTIONAL POP-UP MANAGER
// Client-side script for displaying promotional pop-ups
// ============================================

(function() {
    'use strict';

    let activePopups = [];
    let displayedPopups = new Set(); // Track shown popups in this session

    // Initialize popup manager
    async function initPopupManager() {
        try {
            // Wait for Firebase to be ready (check window.firebaseInit)
            if (typeof window.firebaseInit === 'undefined' || !window.firebaseInit.db) {
                console.warn('⚠️ Firebase not initialized, retrying in 500ms...');
                setTimeout(initPopupManager, 500);
                return;
            }

            // Get Firebase references from window
            const { db, collection, getDocs, query, where } = window.firebaseInit;

            console.log('🎯 Initializing popup manager...');

            // Fetch active popups from Firestore
            const snapshot = await getDocs(query(
                collection(db, 'popups'),
                where('isActive', '==', true)
            ));

            activePopups = [];
            snapshot.forEach(doc => {
                const popupData = { id: doc.id, ...doc.data() };
                activePopups.push(popupData);
                console.log('📢 Found active popup:', {
                    id: doc.id,
                    title: popupData.title,
                    triggerType: popupData.triggerType,
                    isActive: popupData.isActive
                });
            });

            console.log(`✅ Loaded ${activePopups.length} active popups`, activePopups);

            if (activePopups.length === 0) {
                console.log('ℹ️ No active popups found');
                return;
            }

            // Sort by trigger priority (exit_intent > scroll > idle_cart > timer)
            activePopups.sort((a, b) => {
                const priority = { exit_intent: 4, scroll: 3, idle_cart: 2, timer: 1 };
                return (priority[b.triggerType] || 0) - (priority[a.triggerType] || 0);
            });

            console.log('📋 Sorted popups by priority:', activePopups.map(p => `${p.triggerType}: ${p.title}`));

            // Set up triggers for each popup
            activePopups.forEach(popup => {
                if (shouldShowPopup(popup)) {
                    console.log(`✨ Setting up trigger for: ${popup.title}`);
                    setupPopupTrigger(popup);
                } else {
                    console.log(`⏭️ Skipping popup (already shown): ${popup.title}`);
                }
            });

        } catch (error) {
            console.error('❌ Error initializing popup manager:', error);
            console.error('Error details:', error.message, error.stack);
        }
    }

    // Check if popup should be shown based on frequency rules
    function shouldShowPopup(popup) {
        const popupId = popup.id;
        const frequency = popup.frequency || 'always';

        switch (frequency) {
            case 'always':
                // Always show if not already displayed in this session
                return !displayedPopups.has(popupId);

            case 'once_per_session':
                // Check sessionStorage
                const sessionKey = `popup_shown_session_${popupId}`;
                if (sessionStorage.getItem(sessionKey)) {
                    console.log(`⏭️ Popup ${popupId} already shown this session`);
                    return false;
                }
                return true;

            case 'once_lifetime':
                // Check localStorage
                const lifetimeKey = `popup_shown_lifetime_${popupId}`;
                if (localStorage.getItem(lifetimeKey)) {
                    console.log(`⏭️ Popup ${popupId} already shown (lifetime)`);
                    return false;
                }
                return true;

            default:
                return true;
        }
    }

    // Set up trigger for popup
    function setupPopupTrigger(popup) {
        const triggerType = popup.triggerType || 'timer';
        const triggerValue = popup.triggerValue || 5;

        console.log(`🎯 Setting up ${triggerType} trigger for popup: ${popup.title}`);

        switch (triggerType) {
            case 'timer':
                setTimeout(() => {
                    showPopup(popup);
                }, triggerValue * 1000);
                break;

            case 'scroll': {
                let scrollTriggered = false;
                const handleScroll = () => {
                    if (scrollTriggered) return;
                    const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
                    if (scrollPercent >= triggerValue) {
                        scrollTriggered = true;
                        showPopup(popup);
                        window.removeEventListener('scroll', handleScroll);
                    }
                };
                window.addEventListener('scroll', handleScroll);
                break;
            }

            case 'exit_intent': {
                let exitTriggered = false;
                const handleMouseLeave = (e) => {
                    if (exitTriggered) return;
                    if (e.clientY <= 0) {
                        exitTriggered = true;
                        showPopup(popup);
                        document.removeEventListener('mouseleave', handleMouseLeave);
                    }
                };
                document.addEventListener('mouseleave', handleMouseLeave);
                break;
            }

            case 'idle_cart': {
                // Idle Cart trigger - Enhanced with detailed logging
                let idleTimer = null;
                let lastCartState = null;
                const idleTime = popup.idleTime || 60; // seconds
                const minCartValue = popup.minCartValue || 0;

                console.log(`🛒 Idle Cart Setup:`, {
                    idleTime: `${idleTime}s`,
                    minCartValue: `${minCartValue} грн`,
                    popupTitle: popup.title
                });

                function getCart() {
                    try {
                        const cartRaw = localStorage.getItem('latiao_cart');
                        if (!cartRaw) return null;
                        const cart = JSON.parse(cartRaw);
                        if (!Array.isArray(cart)) return null;
                        return cart;
                    } catch (e) {
                        console.error('❌ Error reading cart:', e);
                        return null;
                    }
                }

                function getCartTotal(cart) {
                    if (!cart) return 0;
                    return cart.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
                }

                function startIdleTimer() {
                    if (idleTimer) {
                        console.log('⏸️ Timer already running, skipping...');
                        return;
                    }
                    
                    idleTimer = setTimeout(() => {
                        console.log('🚀 BOOM! Showing Idle Cart popup now.');
                        showPopup(popup);
                    }, idleTime * 1000);
                    
                    console.log(`⏳ Starting timer for ${idleTime} seconds...`);
                }

                function cancelIdleTimer() {
                    if (idleTimer) {
                        clearTimeout(idleTimer);
                        idleTimer = null;
                        console.log('🛑 Idle Cart timer cancelled');
                    }
                }

                function cartWatcher() {
                    const cart = getCart();
                    const cartTotal = getCartTotal(cart);
                    const hasItems = cart && cart.length > 0;
                    const meetsValue = cartTotal >= minCartValue;

                    console.log(`🛒 Cart Check:`, {
                        hasItems,
                        cartTotal: `${cartTotal} грн`,
                        minRequired: `${minCartValue} грн`,
                        meetsValue,
                        itemsCount: cart ? cart.length : 0
                    });

                    if (hasItems && meetsValue) {
                        console.log(`✅ Cart Value: ${cartTotal}, Min Required: ${minCartValue} -> Condition Met`);
                        if (!idleTimer) {
                            startIdleTimer();
                        }
                    } else {
                        if (!hasItems) {
                            console.log('⚠️ No items in cart, timer not started');
                        } else if (!meetsValue) {
                            console.log(`⚠️ Cart value too low (${cartTotal} < ${minCartValue}), timer not started`);
                        }
                        cancelIdleTimer();
                    }
                    lastCartState = JSON.stringify(cart);
                }

                // Watch for cart changes via storage event
                window.addEventListener('storage', (e) => {
                    if (e.key === 'latiao_cart') {
                        console.log('📦 Cart changed (storage event)');
                        cartWatcher();
                    }
                });

                // Also poll every 2s in case storage event doesn't fire
                const pollInterval = setInterval(() => {
                    const cart = getCart();
                    const state = JSON.stringify(cart);
                    if (state !== lastCartState) {
                        console.log('📦 Cart changed (polling detected)');
                        cartWatcher();
                    }
                }, 2000);

                // Cancel timer on checkout (order placed)
                window.addEventListener('orderPlaced', () => {
                    console.log('✅ Order placed - cancelling idle cart timer');
                    cancelIdleTimer();
                    clearInterval(pollInterval);
                });

                // Initial check on page load
                console.log('🔍 Running initial cart check...');
                cartWatcher();
                break;
            }

            default:
                console.warn(`⚠️ Unknown trigger type: ${triggerType}`);
        }
    }

    // Display the popup modal
    function showPopup(popup) {
        if (displayedPopups.has(popup.id)) {
            console.log(`⏭️ Popup ${popup.id} already displayed in this session`);
            return;
        }

        console.log(`🎉 SHOWING POPUP NOW: "${popup.title}"`);
        console.log('Popup details:', {
            id: popup.id,
            title: popup.title,
            triggerType: popup.triggerType,
            frequency: popup.frequency
        });
        
        displayedPopups.add(popup.id);

        // Create modal HTML with premium design
        const modal = document.createElement('div');
        modal.id = `popup-modal-${popup.id}`;
        modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4';
        modal.style.animation = 'fadeIn 0.3s ease-out';

        const hasImage = popup.imageUrl && popup.imageUrl.trim() !== '';
        const hasButton = popup.buttonText && popup.buttonText.trim() !== '';

        modal.innerHTML = `
            <div class="relative bg-white rounded-2xl w-full max-w-md mx-4 shadow-2xl overflow-hidden transform transition-all" style="animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)">
                
                <!-- Close Button - Top Right Corner -->
                <button onclick="closePopup('${popup.id}')" class="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-gray-100 transition-all duration-200 group">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400 group-hover:text-gray-600 transition-colors">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                ${hasImage ? `
                    <!-- Hero Image Banner -->
                    <div class="relative w-full h-56 bg-gradient-to-br from-orange-50 to-orange-100 overflow-hidden">
                        <img src="${popup.imageUrl}" 
                             alt="${escapeHtml(popup.title)}" 
                             class="w-full h-full object-cover"
                             loading="lazy">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </div>
                ` : ''}
                
                <!-- Content Section -->
                <div class="p-8 text-center">
                    
                    <!-- Title -->
                    <h2 class="text-2xl md:text-3xl font-bold text-gray-800 mb-4 leading-tight">
                        ${escapeHtml(popup.title)}
                    </h2>
                    
                    <!-- Description -->
                    <p class="text-gray-600 text-base leading-relaxed mb-6 whitespace-pre-wrap max-w-sm mx-auto">
                        ${escapeHtml(popup.content)}
                    </p>
                    
                    <!-- CTA Buttons -->
                    ${hasButton ? `
                        <div class="flex flex-col gap-3">
                            ${popup.buttonLink ? `
                                <a href="${popup.buttonLink}" 
                                   class="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-orange-600 hover:to-red-600 transform hover:scale-105 hover:shadow-xl transition-all duration-300 inline-block text-center">
                                    ${escapeHtml(popup.buttonText)}
                                </a>
                            ` : `
                                <button onclick="closePopup('${popup.id}')" 
                                        class="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-orange-600 hover:to-red-600 transform hover:scale-105 hover:shadow-xl transition-all duration-300">
                                    ${escapeHtml(popup.buttonText)}
                                </button>
                            `}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        // Append to body
        document.body.appendChild(modal);
        console.log('✅ Modal appended to DOM');

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        // Mark as shown based on frequency
        markPopupAsShown(popup);
    }

    // Close popup modal
    window.closePopup = function(popupId) {
        const modal = document.getElementById(`popup-modal-${popupId}`);
        if (modal) {
            // Fade out animation
            modal.style.animation = 'fadeOut 0.2s ease-out';
            setTimeout(() => {
                modal.remove();
                // Re-enable body scroll if no other popups
                if (!document.querySelector('[id^="popup-modal-"]')) {
                    document.body.style.overflow = '';
                }
            }, 200);
        }
    };

    // Mark popup as shown in storage
    function markPopupAsShown(popup) {
        const popupId = popup.id;
        const frequency = popup.frequency || 'always';

        switch (frequency) {
            case 'once_per_session':
                sessionStorage.setItem(`popup_shown_session_${popupId}`, 'true');
                console.log(`📝 Marked popup ${popupId} as shown (session)`);
                break;

            case 'once_lifetime':
                localStorage.setItem(`popup_shown_lifetime_${popupId}`, 'true');
                console.log(`📝 Marked popup ${popupId} as shown (lifetime)`);
                break;

            case 'always':
                // No storage needed
                break;
        }
    }

    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Add CSS animations with enhanced effects
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { 
                opacity: 0; 
            }
            to { 
                opacity: 1; 
            }
        }
        @keyframes fadeOut {
            from { 
                opacity: 1; 
            }
            to { 
                opacity: 0; 
            }
        }
        @keyframes scaleIn {
            from { 
                transform: scale(0.95) translateY(10px); 
                opacity: 0; 
            }
            to { 
                transform: scale(1) translateY(0); 
                opacity: 1; 
            }
        }
        
        /* Mobile responsive adjustments */
        @media (max-width: 640px) {
            [id^="popup-modal-"] > div {
                max-width: calc(100vw - 2rem);
                margin: 0 1rem;
            }
        }
    `;
    document.head.appendChild(style);

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPopupManager);
    } else {
        // DOM already loaded
        initPopupManager();
    }

})();
