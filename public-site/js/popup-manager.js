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
        
        // Track view in Firestore
        trackPopupEvent(popup.id, 'view');

        // Create modal HTML with premium design
        const modal = document.createElement('div');
        modal.id = `popup-modal-${popup.id}`;
        modal.className = 'fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm';
        modal.style.animation = 'fadeIn 0.3s ease-out';
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                window.closePopup(popup.id, true);
            }
        });

        const hasImage = popup.imageUrl && popup.imageUrl.trim() !== '';
        const hasButton = popup.buttonText && popup.buttonText.trim() !== '';

        modal.innerHTML = `
            <div class="relative flex flex-col bg-white rounded-2xl w-full max-w-[90vw] sm:max-w-md max-h-[90vh] shadow-2xl overflow-hidden mx-auto" 
                 style="animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)">
                
                <!-- Close Button - White Circle Over Image -->
                <button onclick="closePopup('${popup.id}', true)" 
                        class="absolute top-3 right-3 z-30 w-11 h-11 flex items-center justify-center rounded-full bg-white shadow-xl hover:shadow-2xl transition-all duration-200 group"
                        style="min-width: 44px; min-height: 44px;"
                        aria-label="Закрити">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-gray-700 group-hover:text-gray-900 transition-colors">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                ${hasImage ? `
                    <!-- Hero Image Banner - Full Width Top -->
                    <div class="relative w-full h-48 max-h-[200px] flex-shrink-0 bg-gradient-to-br from-orange-50 to-orange-100 overflow-hidden">
                        <img src="${popup.imageUrl}" 
                             alt="${escapeHtml(popup.title)}" 
                             class="w-full h-full object-cover object-center"
                             loading="lazy"
                             onerror="this.style.display='none'">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                    </div>
                ` : ''}
                
                <!-- Content Section - Perfectly Centered -->
                <div class="flex-1 overflow-y-auto px-6 py-5">
                    <div class="w-full max-w-full mx-auto space-y-4 text-center">
                        
                        <!-- Title - Bold & Clear -->
                        <h2 class="text-xl sm:text-2xl font-bold text-gray-900 leading-tight m-0 p-0">
                            ${escapeHtml(popup.title)}
                        </h2>
                        
                        <!-- Description - Muted & Readable -->
                        <p class="text-sm sm:text-base text-gray-600 leading-relaxed whitespace-pre-wrap m-0 p-0">
                            ${escapeHtml(popup.content)}
                        </p>
                    </div>
                </div>
                
                <!-- Footer with CTA Button - Full Width on Mobile -->
                ${hasButton ? `
                    <div class="flex-shrink-0 px-6 pb-6 pt-2">
                        ${popup.buttonLink ? `
                            <a href="${popup.buttonLink}" 
                               onclick="trackPopupClick('${popup.id}')"
                               class="popup-cta-btn block w-full bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-4 rounded-xl font-semibold text-base text-center
                                      hover:from-orange-600 hover:to-red-600 hover:scale-[1.02] hover:shadow-2xl
                                      active:scale-[0.98] transition-all duration-300 shadow-lg m-0">
                                ${escapeHtml(popup.buttonText)}
                            </a>
                        ` : `
                            <button onclick="closePopup('${popup.id}', false, true)" 
                                    class="popup-cta-btn w-full bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-4 rounded-xl font-semibold text-base
                                           hover:from-orange-600 hover:to-red-600 hover:scale-[1.02] hover:shadow-2xl
                                           active:scale-[0.98] transition-all duration-300 shadow-lg m-0">
                                ${escapeHtml(popup.buttonText)}
                            </button>
                        `}
                    </div>
                ` : ''}
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
    window.closePopup = function(popupId, trackClose = false, trackClick = false) {
        const modal = document.getElementById(`popup-modal-${popupId}`);
        if (modal) {
            // Track close or click event
            if (trackClose) {
                trackPopupEvent(popupId, 'close');
            }
            if (trackClick) {
                trackPopupEvent(popupId, 'click');
            }
            
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
    
    // Track popup click (for links)
    window.trackPopupClick = function(popupId) {
        trackPopupEvent(popupId, 'click');
    };
    
    // Track popup events to Firestore
    async function trackPopupEvent(popupId, eventType) {
        try {
            if (!window.firebaseInit) {
                console.warn('⚠️ Firebase not available for popup tracking');
                return;
            }
            
            // Prevent duplicate view tracking in same session
            if (eventType === 'view') {
                const viewKey = `popup_view_tracked_${popupId}`;
                if (sessionStorage.getItem(viewKey)) {
                    console.log(`⏭️ View already tracked for popup ${popupId} in this session`);
                    return;
                }
                sessionStorage.setItem(viewKey, 'true');
            }
            
            const { db, doc, updateDoc, increment } = window.firebaseInit;
            
            const field = eventType === 'view' ? 'viewsCount' 
                        : eventType === 'click' ? 'clicksCount' 
                        : 'closeCount';
            
            await updateDoc(doc(db, 'popups', popupId), {
                [field]: increment(1)
            });
            
            console.log(`📊 Tracked popup ${eventType}: ${popupId}`);
        } catch (error) {
            // Silent fail - don't break popup functionality for tracking errors
            console.warn(`⚠️ Error tracking popup ${eventType} (popup still works):`, error.message);
        }
    }

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
        @keyframes ctaPulse {
            0%, 100% { 
                box-shadow: 0 4px 14px rgba(251, 146, 60, 0.4); 
            }
            50% { 
                box-shadow: 0 6px 20px rgba(251, 146, 60, 0.6), 0 0 0 3px rgba(251, 146, 60, 0.1); 
            }
        }
        
        /* CTA Button Pulse Animation */
        .popup-cta-btn {
            animation: ctaPulse 2s ease-in-out infinite;
        }
        
        .popup-cta-btn:hover {
            animation: none;
        }
        
        /* Mobile responsive adjustments - Perfect Centering */
        @media (max-width: 640px) {
            [id^="popup-modal-"] > div {
                max-width: 90vw;
                margin-left: auto;
                margin-right: auto;
            }
            
            /* Remove any default margins/padding that might cause shifts */
            [id^="popup-modal-"] h2,
            [id^="popup-modal-"] p {
                margin: 0;
                padding: 0;
                text-align: center;
            }
            
            /* Optimize content spacing on mobile */
            [id^="popup-modal-"] .flex-1 {
                min-height: 0;
            }
            
            /* Ensure proper image aspect ratio on mobile */
            [id^="popup-modal-"] img {
                object-position: center;
                display: block;
                width: 100%;
            }
            
            /* Full-width button on mobile */
            [id^="popup-modal-"] .popup-cta-btn {
                width: 100%;
                display: block;
                text-align: center;
            }
        }
        
        /* Ensure text is always centered */
        [id^="popup-modal-"] .text-center {
            text-align: center !important;
        }
        
        [id^="popup-modal-"] .text-center * {
            margin-left: auto !important;
            margin-right: auto !important;
        }
        
        /* Smooth scrolling for content */
        [id^="popup-modal-"] .overflow-y-auto {
            -webkit-overflow-scrolling: touch;
            scroll-behavior: smooth;
        }
        
        /* Premium backdrop blur effect */
        [id^="popup-modal-"] {
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
        }
        
        /* Ensure modal is perfectly centered */
        [id^="popup-modal-"] {
            display: flex;
            align-items: center;
            justify-content: center;
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
