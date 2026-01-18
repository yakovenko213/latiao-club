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
            // Wait for Firebase to be ready
            if (typeof db === 'undefined') {
                console.warn('⚠️ Firebase not initialized, retrying...');
                setTimeout(initPopupManager, 1000);
                return;
            }

            console.log('🎯 Initializing popup manager...');

            // Fetch active popups from Firestore
            const snapshot = await getDocs(query(
                collection(db, 'popups'),
                where('isActive', '==', true)
            ));

            activePopups = [];
            snapshot.forEach(doc => {
                activePopups.push({ id: doc.id, ...doc.data() });
            });

            console.log(`✅ Loaded ${activePopups.length} active popups`);

            if (activePopups.length === 0) {
                return;
            }

            // Sort by trigger priority (exit_intent > scroll > timer)
            activePopups.sort((a, b) => {
                const priority = { exit_intent: 3, scroll: 2, timer: 1 };
                return (priority[b.triggerType] || 0) - (priority[a.triggerType] || 0);
            });

            // Set up triggers for each popup
            activePopups.forEach(popup => {
                if (shouldShowPopup(popup)) {
                    setupPopupTrigger(popup);
                }
            });

        } catch (error) {
            console.error('❌ Error initializing popup manager:', error);
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
                // Show after X seconds
                setTimeout(() => {
                    showPopup(popup);
                }, triggerValue * 1000);
                break;

            case 'scroll':
                // Show when user scrolls X% of page
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

            case 'exit_intent':
                // Show when mouse leaves viewport (exit intent)
                let exitTriggered = false;
                const handleMouseLeave = (e) => {
                    if (exitTriggered) return;

                    // Trigger only when mouse leaves from top of viewport
                    if (e.clientY <= 0) {
                        exitTriggered = true;
                        showPopup(popup);
                        document.removeEventListener('mouseleave', handleMouseLeave);
                    }
                };
                document.addEventListener('mouseleave', handleMouseLeave);
                break;

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

        console.log(`🎉 Showing popup: ${popup.title}`);
        displayedPopups.add(popup.id);

        // Create modal HTML
        const modal = document.createElement('div');
        modal.id = `popup-modal-${popup.id}`;
        modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in';
        modal.style.animation = 'fadeIn 0.3s ease-out';

        const hasImage = popup.imageUrl && popup.imageUrl.trim() !== '';
        const hasButton = popup.buttonText && popup.buttonText.trim() !== '';

        modal.innerHTML = `
            <div class="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-scale-in" style="animation: scaleIn 0.3s ease-out">
                ${hasImage ? `
                    <div class="relative h-48 bg-gradient-to-br from-orange-100 to-orange-50">
                        <img src="${popup.imageUrl}" alt="${escapeHtml(popup.title)}" class="w-full h-full object-cover">
                    </div>
                ` : ''}
                
                <div class="p-6">
                    <div class="flex items-start justify-between gap-4 mb-4">
                        <h2 class="text-2xl font-bold text-gray-900">${escapeHtml(popup.title)}</h2>
                        <button onclick="closePopup('${popup.id}')" class="flex-shrink-0 p-1 hover:bg-gray-100 rounded-full transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400 hover:text-gray-600">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    
                    <p class="text-gray-600 mb-6 whitespace-pre-wrap">${escapeHtml(popup.content)}</p>
                    
                    <div class="flex gap-3">
                        ${hasButton && popup.buttonLink ? `
                            <a href="${popup.buttonLink}" class="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all text-center shadow-lg hover:shadow-xl">
                                ${escapeHtml(popup.buttonText)}
                            </a>
                        ` : hasButton ? `
                            <button onclick="closePopup('${popup.id}')" class="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl">
                                ${escapeHtml(popup.buttonText)}
                            </button>
                        ` : ''}
                        
                        <button onclick="closePopup('${popup.id}')" class="px-6 py-3 text-gray-600 hover:text-gray-900 font-medium transition-colors">
                            Закрити
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Append to body
        document.body.appendChild(modal);

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

    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        @keyframes scaleIn {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
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
