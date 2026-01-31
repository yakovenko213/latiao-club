// ============================================
// DARK MODE MODULE - Premium Theme Switcher
// ============================================
// Features:
// - localStorage persistence
// - System preference detection
// - Smooth transitions
// - Tailwind CSS class strategy

(function() {
  'use strict';

  // ============================================
  // CONFIGURATION
  // ============================================
  const STORAGE_KEY = 'latiao-theme';
  const DARK_CLASS = 'dark';
  const TRANSITION_DURATION = 300; // ms

  // ============================================
  // CORE FUNCTIONS
  // ============================================

  /**
   * Get the current theme from localStorage or system preference
   */
  function getStoredTheme() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  /**
   * Apply theme to document
   */
  function applyTheme(theme) {
    const html = document.documentElement;
    
    if (theme === 'dark') {
      html.classList.add(DARK_CLASS);
    } else {
      html.classList.remove(DARK_CLASS);
    }
    
    // Update toggle button state
    updateToggleButton(theme);
    
    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
  }

  /**
   * Save theme to localStorage
   */
  function saveTheme(theme) {
    localStorage.setItem(STORAGE_KEY, theme);
  }

  /**
   * Toggle between light and dark themes
   */
  function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.classList.contains(DARK_CLASS);
    const newTheme = isDark ? 'light' : 'dark';
    
    // Add transition class for smooth animation
    html.classList.add('theme-transitioning');
    
    applyTheme(newTheme);
    saveTheme(newTheme);
    
    // Remove transition class after animation
    setTimeout(() => {
      html.classList.remove('theme-transitioning');
    }, TRANSITION_DURATION);
  }

  /**
   * Update toggle button icons
   */
  function updateToggleButton(theme) {
    const sunIcon = document.getElementById('theme-sun-icon');
    const moonIcon = document.getElementById('theme-moon-icon');
    
    if (!sunIcon || !moonIcon) return;
    
    if (theme === 'dark') {
      sunIcon.classList.remove('opacity-0', 'rotate-90', 'scale-0');
      sunIcon.classList.add('opacity-100', 'rotate-0', 'scale-100');
      moonIcon.classList.remove('opacity-100', 'rotate-0', 'scale-100');
      moonIcon.classList.add('opacity-0', '-rotate-90', 'scale-0');
    } else {
      sunIcon.classList.remove('opacity-100', 'rotate-0', 'scale-100');
      sunIcon.classList.add('opacity-0', 'rotate-90', 'scale-0');
      moonIcon.classList.remove('opacity-0', '-rotate-90', 'scale-0');
      moonIcon.classList.add('opacity-100', 'rotate-0', 'scale-100');
    }
  }

  /**
   * Create and inject the toggle button HTML
   */
  function createToggleButton() {
    const currentTheme = getStoredTheme();
    const isDark = currentTheme === 'dark';
    
    return `
      <button 
        id="theme-toggle" 
        onclick="window.darkMode.toggle()"
        class="relative w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-all duration-300 group"
        aria-label="Перемкнути тему"
        title="Перемкнути тему"
      >
        <!-- Sun Icon (shown in dark mode) -->
        <svg 
          id="theme-sun-icon"
          class="w-5 h-5 text-amber-500 absolute transition-all duration-300 ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-0'}"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
        </svg>
        
        <!-- Moon Icon (shown in light mode) -->
        <svg 
          id="theme-moon-icon"
          class="w-5 h-5 text-indigo-600 dark:text-indigo-400 absolute transition-all duration-300 ${isDark ? 'opacity-0 -rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
        </svg>
        
        <!-- Hover ring effect -->
        <span class="absolute inset-0 rounded-xl ring-2 ring-transparent group-hover:ring-spicy/20 transition-all duration-300"></span>
      </button>
    `;
  }

  /**
   * Inject toggle button into header
   */
  function injectToggleButton() {
    // Skip if already exists
    if (document.getElementById('theme-toggle')) return;
    
    // Find the header actions container - look for the user profile button
    const userProfileBtn = document.getElementById('user-profile-btn');
    if (userProfileBtn) {
      const toggleButton = document.createElement('button');
      toggleButton.id = 'theme-toggle';
      toggleButton.onclick = () => window.darkMode.toggle();
      toggleButton.className = 'relative p-2 hover:bg-orange-50 dark:hover:bg-gray-700 rounded-full text-gray-700 dark:text-gray-200 hover:text-orange-500 transition-colors';
      toggleButton.setAttribute('aria-label', 'Перемкнути тему');
      toggleButton.setAttribute('title', 'Перемкнути тему');
      
      const currentTheme = getStoredTheme();
      const isDark = currentTheme === 'dark';
      
      toggleButton.innerHTML = `
        <!-- Sun Icon (shown in dark mode - click for light) -->
        <svg 
          id="theme-sun-icon"
          class="w-6 h-6 text-amber-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-0'}"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
        </svg>
        
        <!-- Moon Icon (shown in light mode - click for dark) -->
        <svg 
          id="theme-moon-icon"
          class="w-6 h-6 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${isDark ? 'opacity-0 -rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
        </svg>
        
        <!-- Spacer for sizing -->
        <span class="w-6 h-6 block opacity-0">
          <svg class="w-6 h-6" viewBox="0 0 24 24"></svg>
        </span>
      `;
      
      // Insert before user profile button
      userProfileBtn.parentNode.insertBefore(toggleButton, userProfileBtn);
      console.log('✅ Dark mode toggle injected');
      return;
    }
    
    // Fallback: try to find any header actions container
    const header = document.querySelector('header');
    if (header) {
      const actionsContainer = header.querySelector('.flex.items-center.gap-1, .flex.items-center.gap-2');
      if (actionsContainer && !document.getElementById('theme-toggle')) {
        const currentTheme = getStoredTheme();
        const isDark = currentTheme === 'dark';
        
        const toggleWrapper = document.createElement('div');
        toggleWrapper.innerHTML = createToggleButton();
        actionsContainer.insertBefore(toggleWrapper.firstElementChild, actionsContainer.firstChild);
        console.log('✅ Dark mode toggle injected (fallback)');
      }
    }
  }

  /**
   * Add CSS transitions for theme switching
   */
  function addTransitionStyles() {
    if (document.getElementById('dark-mode-transitions')) return;
    
    const style = document.createElement('style');
    style.id = 'dark-mode-transitions';
    style.textContent = `
      /* Smooth theme transitions */
      html.theme-transitioning,
      html.theme-transitioning *,
      html.theme-transitioning *::before,
      html.theme-transitioning *::after {
        transition: background-color ${TRANSITION_DURATION}ms ease,
                    border-color ${TRANSITION_DURATION}ms ease,
                    color ${TRANSITION_DURATION}ms ease,
                    fill ${TRANSITION_DURATION}ms ease,
                    stroke ${TRANSITION_DURATION}ms ease,
                    box-shadow ${TRANSITION_DURATION}ms ease !important;
      }
      
      /* Dark mode base styles */
      html.dark {
        color-scheme: dark;
      }
      
      html.dark body {
        background-color: #111827;
        color: #f3f4f6;
      }
      
      /* Dark mode component overrides */
      html.dark .bg-white {
        background-color: #1f2937 !important;
      }
      
      html.dark .bg-gray-50 {
        background-color: #111827 !important;
      }
      
      html.dark .bg-gray-100 {
        background-color: #1f2937 !important;
      }
      
      html.dark .text-gray-900 {
        color: #f3f4f6 !important;
      }
      
      html.dark .text-gray-800 {
        color: #e5e7eb !important;
      }
      
      html.dark .text-gray-700 {
        color: #d1d5db !important;
      }
      
      html.dark .text-gray-600 {
        color: #9ca3af !important;
      }
      
      html.dark .text-gray-500 {
        color: #9ca3af !important;
      }
      
      html.dark .border-gray-100 {
        border-color: #374151 !important;
      }
      
      html.dark .border-gray-200 {
        border-color: #374151 !important;
      }
      
      html.dark .border-gray-300 {
        border-color: #4b5563 !important;
      }
      
      /* Header dark mode */
      html.dark header {
        background-color: rgba(17, 24, 39, 0.95) !important;
        border-color: #374151 !important;
      }
      
      /* Cards dark mode */
      html.dark .card-hover,
      html.dark [class*="rounded-2xl"][class*="shadow"] {
        background-color: #1f2937 !important;
        border-color: #374151 !important;
      }
      
      /* Inputs dark mode */
      html.dark input,
      html.dark textarea,
      html.dark select {
        background-color: #374151 !important;
        border-color: #4b5563 !important;
        color: #f3f4f6 !important;
      }
      
      html.dark input::placeholder,
      html.dark textarea::placeholder {
        color: #9ca3af !important;
      }
      
      /* Modals and overlays */
      html.dark .bg-white\\/95,
      html.dark [class*="bg-white"][class*="backdrop"] {
        background-color: rgba(31, 41, 55, 0.95) !important;
      }
      
      /* Dropdown menus */
      html.dark [class*="shadow-xl"][class*="rounded-xl"] {
        background-color: #1f2937 !important;
        border-color: #374151 !important;
      }
      
      /* Skeleton loader dark mode */
      html.dark .page-skeleton {
        background: #111827 !important;
      }
      
      html.dark .skeleton-header {
        background: #1f2937 !important;
        border-color: #374151 !important;
      }
      
      html.dark .skeleton-logo,
      html.dark .skeleton-nav-item,
      html.dark [style*="shimmer"] {
        background: linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%) !important;
        background-size: 200% 100% !important;
      }
      
      /* Footer dark mode */
      html.dark footer {
        background-color: #030712 !important;
      }
      
      /* Mobile menu dark mode */
      html.dark .mobile-menu {
        background-color: #1f2937 !important;
      }
      
      /* Cart sidebar dark mode */
      html.dark #cart-sidebar {
        background-color: #1f2937 !important;
      }
      
      html.dark #cart-sidebar header {
        background-color: #1f2937 !important;
        border-color: #374151 !important;
      }
      
      html.dark #cart-sidebar footer,
      html.dark #cart-summary {
        background-color: #1f2937 !important;
        border-color: #374151 !important;
      }
      
      /* Cart notice boxes */
      html.dark #cart-sidebar .bg-green-50 {
        background-color: rgba(22, 101, 52, 0.3) !important;
        border-color: #166534 !important;
      }
      
      html.dark #cart-sidebar .bg-green-50 .text-green-700 {
        color: #86efac !important;
      }
      
      html.dark #cart-sidebar .bg-red-50,
      html.dark #min-order-notice {
        background-color: rgba(153, 27, 27, 0.3) !important;
        border-color: #991b1b !important;
      }
      
      html.dark #cart-sidebar .bg-red-50 .text-red-700,
      html.dark #min-order-notice .text-red-700 {
        color: #fca5a5 !important;
      }
      
      html.dark #cart-sidebar .bg-orange-50,
      html.dark #delivery-progress {
        background-color: rgba(154, 52, 18, 0.3) !important;
        border-color: #9a3412 !important;
      }
      
      html.dark #cart-sidebar .bg-orange-100 {
        background-color: rgba(154, 52, 18, 0.5) !important;
      }
      
      /* Empty cart state */
      html.dark #empty-state .bg-orange-50 {
        background-color: rgba(154, 52, 18, 0.3) !important;
      }
      
      /* Cart item cards */
      html.dark #cart-items > div {
        background-color: #374151 !important;
        border-color: #4b5563 !important;
      }
      
      /* Close button */
      html.dark #cart-sidebar .close-btn,
      html.dark #cart-sidebar .bg-gray-100 {
        background-color: #374151 !important;
        color: #d1d5db !important;
      }
      
      /* Cart summary divider */
      html.dark #cart-sidebar .bg-gray-100.h-px,
      html.dark #cart-sidebar .h-px.bg-gray-100 {
        background-color: #4b5563 !important;
      }
      
      /* Disabled checkout button */
      html.dark #checkout-btn:disabled {
        background: #374151 !important;
        color: #6b7280 !important;
      }
      
      /* Shadow adjustments */
      html.dark #cart-sidebar {
        box-shadow: -10px 0 40px rgba(0, 0, 0, 0.5) !important;
      }
      
      html.dark #cart-summary {
        box-shadow: 0 -10px 40px -10px rgba(0, 0, 0, 0.5) !important;
      }
      
      /* Review section dark mode */
      html.dark #reviews-section .bg-white {
        background-color: #1f2937 !important;
      }
      
      html.dark #review-modal > div:last-child {
        background-color: #1f2937 !important;
      }
      
      /* Product cards */
      html.dark .product-card,
      html.dark [class*="product"] .bg-white {
        background-color: #1f2937 !important;
      }
      
      /* Tab content - only for product page tabs with bg-white */
      html.dark .tab-content.bg-white {
        background-color: #1f2937 !important;
        border-color: #374151 !important;
      }
      
      /* Preserve spicy/brand colors */
      html.dark .text-spicy,
      html.dark .bg-spicy,
      html.dark .fire-gradient,
      html.dark [class*="from-spicy"],
      html.dark [class*="to-flame"] {
        /* Keep brand colors intact */
      }
      
      /* "Why Choose Latiao" section - gradient backgrounds */
      html.dark .bg-gradient-to-b.from-white,
      html.dark [class*="bg-gradient-to-b"][class*="from-white"] {
        background: #111827 !important;
      }
      
      /* Gradient cards in "Why Choose" section */
      html.dark [class*="bg-gradient-to-br"][class*="from-white"] {
        background: linear-gradient(to bottom right, #1f2937, #111827) !important;
      }
      
      html.dark [class*="bg-gradient-to-br"][class*="from-orange-100"] {
        background: linear-gradient(to bottom right, #78350f, #1f2937) !important;
      }
      
      /* Card borders in dark mode */
      html.dark [class*="border-blue-100"],
      html.dark [class*="border-purple-100"],
      html.dark [class*="border-emerald-100"],
      html.dark [class*="border-cyan-100"],
      html.dark [class*="border-green-200"],
      html.dark [class*="border-pink-100"],
      html.dark [class*="border-amber-100"] {
        border-color: #374151 !important;
      }
      
      /* Special highlight card */
      html.dark [class*="border-spicy"] {
        border-color: #ea580c !important;
      }
      
      /* Arrival date message (Очікуємо поставку) */
      html.dark #arrival-date-message,
      html.dark [class*="from-blue-50"][class*="to-indigo-50"] {
        background: linear-gradient(to bottom right, rgba(30, 58, 138, 0.3), rgba(67, 56, 202, 0.3)) !important;
        border-color: #3b82f6 !important;
      }
      
      html.dark #arrival-date-message .text-gray-700 {
        color: #e0e7ff !important;
      }
      
      /* Shipping status block */
      html.dark #shipping-container,
      html.dark [class*="from-green-50"][class*="to-emerald-50"] {
        background: linear-gradient(to right, rgba(22, 101, 52, 0.3), rgba(6, 78, 59, 0.3)) !important;
        border-color: #22c55e !important;
      }
      
      html.dark #shipping-container .text-green-800,
      html.dark .text-green-800 {
        color: #86efac !important;
      }
      
      html.dark #shipping-container .text-green-600,
      html.dark .text-green-600 {
        color: #4ade80 !important;
      }
      
      /* Out of stock shipping message */
      html.dark #shipping-container[class*="from-orange-50"][class*="to-amber-50"],
      html.dark [class*="from-orange-50"][class*="to-amber-50"] {
        background: linear-gradient(to right, rgba(154, 52, 18, 0.3), rgba(146, 64, 14, 0.3)) !important;
        border-color: #f97316 !important;
      }
      
      html.dark #shipping-container .text-orange-800,
      html.dark .text-orange-800 {
        color: #fdba74 !important;
      }
      
      /* ============================================
         PRODUCT PAGE - FULL DARK MODE STYLES
         ============================================ */
      
      /* Product gallery container */
      html.dark .gallery-container,
      html.dark [class*="gallery-container"] {
        background-color: #1f2937 !important;
        border-color: #374151 !important;
      }
      
      /* Gallery gradient background */
      html.dark [class*="from-orange-50"][class*="to-red-50"] {
        background: linear-gradient(to bottom right, rgba(154, 52, 18, 0.2), rgba(153, 27, 27, 0.2)) !important;
      }
      
      /* Gallery navigation buttons */
      html.dark .gallery-nav {
        background-color: rgba(31, 41, 55, 0.9) !important;
        color: #f3f4f6 !important;
        border-color: #4b5563 !important;
      }
      
      /* Thumbnails */
      html.dark #thumbnails img {
        border-color: #4b5563 !important;
      }
      
      /* Product info section */
      html.dark #product-sku {
        color: #9ca3af !important;
      }
      
      html.dark #product-name {
        color: #f3f4f6 !important;
      }
      
      /* Spiciness level text */
      html.dark #spiciness-level {
        color: #9ca3af !important;
      }
      
      /* Old price and discount */
      html.dark #product-old-price {
        color: #6b7280 !important;
      }
      
      html.dark #product-discount {
        background-color: rgba(239, 68, 68, 0.2) !important;
      }
      
      /* View count text */
      html.dark #view-count {
        color: #9ca3af !important;
      }
      
      /* Quantity selector */
      html.dark #quantity-container {
        background-color: #374151 !important;
      }
      
      html.dark #quantity-container button {
        background-color: #4b5563 !important;
        color: #f3f4f6 !important;
      }
      
      html.dark #quantity-container button:hover {
        background-color: #6b7280 !important;
      }
      
      html.dark #quantity {
        color: #f3f4f6 !important;
      }
      
      /* Recommended products section */
      html.dark #recommended-products h2,
      html.dark .text-2xl.font-bold {
        color: #f3f4f6 !important;
      }
      
      /* Product detail tabs - only for product page */
      html.dark .tab-content.bg-white {
        background-color: #1f2937 !important;
        border-color: #374151 !important;
      }
      
      html.dark [onclick*="toggleTab"] {
        background-color: #1f2937 !important;
      }
      
      html.dark [onclick*="toggleTab"]:hover {
        background-color: #374151 !important;
      }
      
      html.dark [onclick*="toggleTab"] span.font-semibold {
        color: #f3f4f6 !important;
      }
      
      /* Tab icons containers */
      html.dark .bg-orange-50 {
        background-color: rgba(154, 52, 18, 0.3) !important;
      }
      
      html.dark .bg-blue-50 {
        background-color: rgba(30, 64, 175, 0.3) !important;
      }
      
      html.dark .bg-green-50 {
        background-color: rgba(22, 101, 52, 0.3) !important;
      }
      
      /* Tab content text */
      html.dark #tab-description-content,
      html.dark #specs-content,
      html.dark #ingredients-content {
        color: #d1d5db !important;
      }
      
      /* Mobile cart bar */
      html.dark #mobile-cart-bar {
        background-color: #1f2937 !important;
        border-color: #374151 !important;
      }
      
      /* Lightbox */
      html.dark .lightbox {
        background-color: rgba(0, 0, 0, 0.95) !important;
      }
      
      html.dark .lightbox-close,
      html.dark .lightbox-nav {
        background-color: rgba(31, 41, 55, 0.9) !important;
        color: #f3f4f6 !important;
      }
      
      /* Recommended product cards */
      html.dark #recommended-products > div {
        background-color: #1f2937 !important;
        border-color: #374151 !important;
      }
      
      /* Reviews section on product page */
      html.dark #reviews-section {
        background-color: #111827 !important;
      }
      
      html.dark #reviews-section > div {
        background-color: #1f2937 !important;
      }
      
      /* Review cards */
      html.dark .review-card,
      html.dark #reviews-section [class*="rounded-2xl"][class*="border"] {
        background-color: #1f2937 !important;
        border-color: #374151 !important;
      }
      
      /* Review modal */
      html.dark #review-modal {
        background-color: rgba(0, 0, 0, 0.8) !important;
      }
      
      html.dark #review-modal > div:last-child,
      html.dark #review-modal [class*="bg-white"] {
        background-color: #1f2937 !important;
        border-color: #374151 !important;
      }
      
      /* Star rating inputs */
      html.dark #review-modal input,
      html.dark #review-modal textarea {
        background-color: #374151 !important;
        border-color: #4b5563 !important;
        color: #f3f4f6 !important;
      }
      
      /* Photo lightbox in reviews */
      html.dark #photo-lightbox {
        background-color: rgba(0, 0, 0, 0.95) !important;
      }
      
      /* Badge/tags in reviews */
      html.dark [class*="bg-gray-100"] {
        background-color: #374151 !important;
      }
      
      /* Main content area */
      html.dark main {
        background-color: #111827 !important;
      }
      
      /* Breadcrumbs and navigation links */
      html.dark a.text-gray-500:hover,
      html.dark a.text-gray-600:hover {
        color: #fb923c !important;
      }
      
      /* ============================================
         REVIEWS SECTION - FULL DARK MODE STYLES
         ============================================ */
      
      /* Reviews main container */
      html.dark #reviews-section {
        background-color: transparent !important;
      }
      
      html.dark #reviews-section > div {
        background-color: #1f2937 !important;
        border-color: #374151 !important;
      }
      
      /* Reviews header */
      html.dark #reviews-section .bg-gradient-to-r.from-gray-50 {
        background: linear-gradient(to right, #374151, #1f2937) !important;
        border-color: #374151 !important;
      }
      
      html.dark #reviews-section h2 {
        color: #f3f4f6 !important;
      }
      
      html.dark #reviews-section .text-gray-400,
      html.dark #reviews-section .text-gray-500 {
        color: #9ca3af !important;
      }
      
      html.dark #reviews-section .text-gray-300 {
        color: #4b5563 !important;
      }
      
      /* Rating breakdown section */
      html.dark #reviews-section .bg-gray-50\\/70,
      html.dark #rating-breakdown {
        background-color: rgba(55, 65, 81, 0.5) !important;
      }
      
      /* Filter button */
      html.dark #filter-verified-btn {
        background-color: #374151 !important;
        border-color: #4b5563 !important;
        color: #d1d5db !important;
      }
      
      html.dark #filter-verified-btn:hover {
        background-color: #4b5563 !important;
        border-color: #6b7280 !important;
      }
      
      html.dark #filter-verified-btn.bg-emerald-50 {
        background-color: rgba(6, 78, 59, 0.4) !important;
        border-color: #059669 !important;
        color: #6ee7b7 !important;
      }
      
      /* Rating bars background */
      html.dark #rating-breakdown .bg-gray-200 {
        background-color: #374151 !important;
      }
      
      /* Reviews grid */
      html.dark #reviews-grid {
        background-color: transparent !important;
      }
      
      /* Individual review cards */
      html.dark #reviews-grid > div {
        background-color: #374151 !important;
        border-color: #4b5563 !important;
      }
      
      /* Review card text */
      html.dark #reviews-grid .text-gray-900 {
        color: #f3f4f6 !important;
      }
      
      html.dark #reviews-grid .text-gray-700 {
        color: #d1d5db !important;
      }
      
      html.dark #reviews-grid .text-gray-600 {
        color: #9ca3af !important;
      }
      
      /* Verified badge */
      html.dark #reviews-grid .bg-emerald-50 {
        background-color: rgba(6, 78, 59, 0.4) !important;
      }
      
      html.dark #reviews-grid .text-emerald-700 {
        color: #6ee7b7 !important;
      }
      
      /* Review tags */
      html.dark #reviews-grid .bg-orange-100 {
        background-color: rgba(154, 52, 18, 0.4) !important;
        color: #fdba74 !important;
      }
      
      html.dark #reviews-grid .bg-red-100 {
        background-color: rgba(153, 27, 27, 0.4) !important;
        color: #fca5a5 !important;
      }
      
      html.dark #reviews-grid .bg-green-100 {
        background-color: rgba(22, 101, 52, 0.4) !important;
        color: #86efac !important;
      }
      
      html.dark #reviews-grid .bg-blue-100 {
        background-color: rgba(30, 64, 175, 0.4) !important;
        color: #93c5fd !important;
      }
      
      html.dark #reviews-grid .bg-purple-100 {
        background-color: rgba(88, 28, 135, 0.4) !important;
        color: #d8b4fe !important;
      }
      
      /* Show more button */
      html.dark #show-more-container button {
        background-color: transparent !important;
        border-color: rgba(249, 115, 22, 0.3) !important;
      }
      
      html.dark #show-more-container button:hover {
        background-color: rgba(249, 115, 22, 0.1) !important;
        border-color: rgba(249, 115, 22, 0.5) !important;
      }
      
      /* Review modal */
      html.dark #review-modal > div {
        background-color: #1f2937 !important;
      }
      
      html.dark #review-modal .border-gray-100 {
        border-color: #374151 !important;
      }
      
      html.dark #review-modal h3 {
        color: #f3f4f6 !important;
      }
      
      html.dark #review-modal label {
        color: #d1d5db !important;
      }
      
      html.dark #review-modal .text-gray-400 {
        color: #9ca3af !important;
      }
      
      /* Modal close button */
      html.dark #review-modal .bg-gray-100 {
        background-color: #374151 !important;
        color: #d1d5db !important;
      }
      
      html.dark #review-modal .bg-gray-100:hover {
        background-color: #4b5563 !important;
      }
      
      /* Modal inputs */
      html.dark #review-modal input,
      html.dark #review-modal textarea {
        background-color: #374151 !important;
        border-color: #4b5563 !important;
        color: #f3f4f6 !important;
      }
      
      html.dark #review-modal input::placeholder,
      html.dark #review-modal textarea::placeholder {
        color: #9ca3af !important;
      }
      
      html.dark #review-modal input:focus,
      html.dark #review-modal textarea:focus {
        border-color: #f97316 !important;
      }
      
      /* Photo upload button */
      html.dark #photo-upload-container button {
        border-color: #4b5563 !important;
        color: #9ca3af !important;
      }
      
      html.dark #photo-upload-container button:hover {
        border-color: #f97316 !important;
        color: #f97316 !important;
        background-color: rgba(249, 115, 22, 0.1) !important;
      }
      
      /* Tags in modal */
      html.dark #tags-container button {
        background-color: #374151 !important;
        border-color: #4b5563 !important;
        color: #d1d5db !important;
      }
      
      html.dark #tags-container button:hover {
        background-color: #4b5563 !important;
      }
      
      html.dark #tags-container button.bg-orange-100 {
        background-color: rgba(154, 52, 18, 0.4) !important;
        border-color: #ea580c !important;
        color: #fdba74 !important;
      }
      
      /* Photo lightbox */
      html.dark #photo-lightbox {
        background-color: rgba(0, 0, 0, 0.98) !important;
      }
      
      /* Modal swipe handle */
      html.dark #review-modal .bg-gray-300 {
        background-color: #4b5563 !important;
      }
      
      /* Empty reviews state */
      html.dark #reviews-grid .text-center {
        color: #9ca3af !important;
      }
      
      /* Review photos thumbnails */
      html.dark .photo-item {
        border-color: #4b5563 !important;
      }
      
      /* ============================================
         CHAT WIDGET - FULL DARK MODE STYLES
         ============================================ */
      
      /* Chat window container */
      html.dark #chat-window {
        background-color: #1f2937 !important;
        border-color: #374151 !important;
      }
      
      /* Chat messages area */
      html.dark .chat-messages {
        background: linear-gradient(to bottom, #111827 0%, #1f2937 100%) !important;
      }
      
      html.dark .chat-messages::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2) !important;
      }
      
      html.dark .chat-messages::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.3) !important;
      }
      
      /* Welcome message */
      html.dark .chat-welcome {
        background-color: #374151 !important;
        border-color: #4b5563 !important;
      }
      
      html.dark .chat-welcome h4 {
        color: #f3f4f6 !important;
      }
      
      html.dark .chat-welcome p {
        color: #d1d5db !important;
      }
      
      html.dark .chat-welcome .cta {
        background: linear-gradient(135deg, rgba(154, 52, 18, 0.3) 0%, rgba(194, 65, 12, 0.3) 100%) !important;
        color: #fdba74 !important;
      }
      
      /* AI/Admin message bubbles */
      html.dark .chat-message.ai .message-bubble,
      html.dark .chat-message.admin .message-bubble {
        background: linear-gradient(135deg, #374151 0%, #4b5563 100%) !important;
        color: #f3f4f6 !important;
        border-color: #6b7280 !important;
      }
      
      /* Typing indicator */
      html.dark .typing-indicator .message-bubble {
        background: linear-gradient(135deg, rgba(154, 52, 18, 0.3) 0%, rgba(194, 65, 12, 0.3) 100%) !important;
        border-color: #ea580c !important;
      }
      
      html.dark .typing-label {
        color: #fdba74 !important;
      }
      
      html.dark .typing-indicator .typing-status {
        color: #fb923c !important;
      }
      
      /* Message time */
      html.dark .message-time {
        color: #9ca3af !important;
      }
      
      /* Chat input area */
      html.dark .chat-input-area {
        background-color: #1f2937 !important;
        border-color: #374151 !important;
      }
      
      html.dark .chat-input-container {
        background-color: #374151 !important;
        border-color: #4b5563 !important;
      }
      
      html.dark .chat-input {
        background-color: transparent !important;
        color: #f3f4f6 !important;
      }
      
      html.dark .chat-input::placeholder {
        color: #9ca3af !important;
      }
      
      /* Product cards in chat */
      html.dark .product-card-chat {
        background-color: #374151 !important;
        border-color: #4b5563 !important;
      }
      
      html.dark .product-card-chat h4,
      html.dark .product-card-chat .product-name {
        color: #f3f4f6 !important;
      }
      
      html.dark .product-card-chat .product-price {
        color: #fb923c !important;
      }
      
      /* Quick actions/buttons */
      html.dark .quick-action,
      html.dark .chat-quick-btn {
        background-color: #374151 !important;
        border-color: #4b5563 !important;
        color: #d1d5db !important;
      }
      
      html.dark .quick-action:hover,
      html.dark .chat-quick-btn:hover {
        background-color: #4b5563 !important;
        border-color: #6b7280 !important;
      }
      
      /* Chat floating button - keep visible on dark */
      html.dark #chat-toggle-btn {
        background: #1f2937 !important;
        border-color: #f97316 !important;
        box-shadow: 
          0 8px 24px rgba(0, 0, 0, 0.4),
          0 4px 8px rgba(249, 115, 22, 0.3),
          0 0 0 4px rgba(31, 41, 55, 0.9) !important;
      }
      
      /* Logo "Snack" text in header */
      html.dark .logo-snack-text {
        fill: #f3f4f6 !important;
      }
      
      /* ============================================
         CATEGORY PAGE - FILTERS DARK MODE
         ============================================ */
      
      /* Filters section container */
      html.dark .bg-gray-50.rounded-3xl {
        background-color: #374151 !important;
      }
      
      /* Filter toggle button */
      html.dark [onclick*="toggleFilterDrawer"].bg-white {
        background-color: #1f2937 !important;
        color: #f3f4f6 !important;
      }
      
      html.dark [onclick*="toggleFilterDrawer"].bg-white:hover {
        background-color: rgba(249, 115, 22, 0.2) !important;
      }
      
      /* Filter drawer panel */
      html.dark #filter-drawer,
      html.dark .filter-drawer {
        background-color: #1f2937 !important;
      }
      
      /* Filter drawer header */
      html.dark #filter-drawer h3 {
        color: #f3f4f6 !important;
      }
      
      /* Close button */
      html.dark #filter-drawer button[onclick*="toggleFilterDrawer"] {
        color: #d1d5db !important;
      }
      
      html.dark #filter-drawer button[onclick*="toggleFilterDrawer"]:hover {
        background-color: #374151 !important;
      }
      
      /* Filter section titles */
      html.dark #filter-drawer h4 {
        color: #e5e7eb !important;
      }
      
      /* Price inputs */
      html.dark #filter-price-min,
      html.dark #filter-price-max {
        background-color: #374151 !important;
        border-color: #4b5563 !important;
        color: #f3f4f6 !important;
      }
      
      html.dark #filter-price-min::placeholder,
      html.dark #filter-price-max::placeholder {
        color: #9ca3af !important;
      }
      
      html.dark #filter-price-min:focus,
      html.dark #filter-price-max:focus {
        border-color: #f97316 !important;
      }
      
      /* Spiciness filter labels */
      html.dark #filter-drawer label {
        color: #d1d5db !important;
      }
      
      html.dark #filter-drawer label:hover {
        background-color: #374151 !important;
      }
      
      html.dark #filter-drawer label span {
        color: #e5e7eb !important;
      }
      
      /* Checkboxes */
      html.dark .spiciness-filter {
        background-color: #374151 !important;
        border-color: #6b7280 !important;
      }
      
      /* Action buttons container */
      html.dark #filter-drawer .bg-white.sticky {
        background-color: #1f2937 !important;
        border-color: #374151 !important;
      }
      
      /* Reset button */
      html.dark #filter-drawer .bg-gray-100 {
        background-color: #374151 !important;
        color: #d1d5db !important;
      }
      
      html.dark #filter-drawer .bg-gray-100:hover {
        background-color: #4b5563 !important;
      }
      
      /* Products count text */
      html.dark .text-gray-600.font-medium {
        color: #d1d5db !important;
      }
      
      /* ============================================
         CHECKOUT PAGE - FULL DARK MODE STYLES
         ============================================ */
      
      /* Body background */
      html.dark .bg-gray-50 {
        background-color: #111827 !important;
      }
      
      /* Header */
      html.dark #checkout-container header,
      html.dark header.bg-white {
        background-color: #1f2937 !important;
      }
      
      /* Page title */
      html.dark h1.text-gray-900 {
        color: #f3f4f6 !important;
      }
      
      /* Back link */
      html.dark a.text-gray-500 {
        color: #9ca3af !important;
      }
      
      /* Cards/Sections */
      html.dark #checkout-container .bg-white,
      html.dark .bg-white.rounded-2xl,
      html.dark .bg-white.rounded-3xl {
        background-color: #1f2937 !important;
      }
      
      /* Section titles */
      html.dark #checkout-container h2.text-gray-900 {
        color: #f3f4f6 !important;
      }
      
      /* Step numbers */
      html.dark .bg-orange-100 {
        background-color: rgba(249, 115, 22, 0.2) !important;
      }
      
      /* Labels */
      html.dark #checkout-container label.text-gray-700,
      html.dark .text-sm.font-medium.text-gray-700 {
        color: #e5e7eb !important;
      }
      
      /* Inputs */
      html.dark #checkout-container input,
      html.dark #checkout-container select,
      html.dark #checkout-container textarea {
        background-color: #374151 !important;
        border-color: #4b5563 !important;
        color: #f3f4f6 !important;
      }
      
      html.dark #checkout-container input::placeholder,
      html.dark #checkout-container textarea::placeholder {
        color: #9ca3af !important;
      }
      
      html.dark #checkout-container input:focus,
      html.dark #checkout-container select:focus,
      html.dark #checkout-container textarea:focus {
        border-color: #f97316 !important;
        box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.2) !important;
      }
      
      /* Delivery cards */
      html.dark .card-select {
        background-color: #1f2937 !important;
        border-color: #4b5563 !important;
      }
      
      html.dark .card-select:hover {
        border-color: #6b7280 !important;
      }
      
      html.dark .card-select.selected {
        border-color: #f97316 !important;
        background: linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, #1f2937 100%) !important;
      }
      
      html.dark .card-select p.text-gray-900 {
        color: #f3f4f6 !important;
      }
      
      html.dark .card-select p.text-gray-500,
      html.dark .card-select .text-sm.text-gray-500 {
        color: #9ca3af !important;
      }
      
      /* Payment service logos (Visa, Mastercard, Apple Pay, Google Pay) */
      html.dark .card-select[data-payment="online"] img[alt="Visa"] {
        background-color: #ffffff !important;
        padding: 4px 8px !important;
        border-radius: 4px !important;
      }
      
      html.dark .card-select[data-payment="online"] img[alt="Mastercard"] {
        filter: brightness(1.1) !important;
      }
      
      html.dark .card-select[data-payment="online"] img[alt="Apple Pay"] {
        filter: brightness(0) invert(1) !important;
      }
      
      html.dark .card-select[data-payment="online"] svg[role="img"] path {
        fill: #e5e7eb !important;
      }
      
      /* Info notices (blue) */
      html.dark .bg-blue-50 {
        background-color: rgba(30, 64, 175, 0.2) !important;
        border-color: #3b82f6 !important;
      }
      
      html.dark .bg-blue-50 .text-blue-900,
      html.dark .bg-blue-50 .text-blue-800 {
        color: #93c5fd !important;
      }
      
      html.dark .bg-blue-50 .text-blue-600 {
        color: #60a5fa !important;
      }
      
      /* Dispatch badges */
      html.dark .bg-orange-50 {
        background-color: rgba(249, 115, 22, 0.2) !important;
      }
      
      html.dark .text-orange-800 {
        color: #fdba74 !important;
      }
      
      /* City autocomplete dropdown */
      html.dark #np-city-list {
        background-color: #1f2937 !important;
        border-color: #4b5563 !important;
      }
      
      html.dark #np-city-list li {
        color: #e5e7eb !important;
      }
      
      html.dark #np-city-list li:hover {
        background-color: #374151 !important;
      }
      
      /* Order summary sidebar */
      html.dark .bg-white.lg\\:sticky {
        background-color: #1f2937 !important;
      }
      
      /* Cart items */
      html.dark #checkout-container .text-gray-800 {
        color: #e5e7eb !important;
      }
      
      /* Prices and totals */
      html.dark #checkout-container .text-gray-600 {
        color: #9ca3af !important;
      }
      
      /* Dividers */
      html.dark #checkout-container .border-gray-100,
      html.dark #checkout-container .border-t {
        border-color: #374151 !important;
      }
      
      /* Free delivery notice */
      html.dark .bg-green-50 {
        background-color: rgba(22, 101, 52, 0.2) !important;
        border-color: #22c55e !important;
      }
      
      html.dark .bg-green-50 .text-green-700,
      html.dark .bg-green-50 .text-green-800 {
        color: #86efac !important;
      }
      
      /* Progress bar background */
      html.dark .bg-gray-100 {
        background-color: #374151 !important;
      }
      
      /* Testimonials/Trust section */
      html.dark .testimonial-card {
        background-color: #1f2937 !important;
        border-color: #374151 !important;
      }
      
      html.dark .testimonial-card .text-gray-700 {
        color: #d1d5db !important;
      }
      
      /* Sticky bar at bottom */
      html.dark .sticky-bar {
        background-color: #1f2937 !important;
        box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3) !important;
      }
      
      /* Promo code section */
      html.dark .bg-gradient-to-r.from-orange-50 {
        background: linear-gradient(to right, rgba(249, 115, 22, 0.15), rgba(234, 88, 12, 0.15)) !important;
      }
      
      /* Empty state messages */
      html.dark #checkout-container .text-gray-400 {
        color: #9ca3af !important;
      }
      
      /* Disabled button */
      html.dark .btn-primary:disabled {
        background: #374151 !important;
        color: #6b7280 !important;
      }
      
      /* Logo Snack text in checkout header */
      html.dark #checkout-container text[fill="#333333"],
      html.dark header text[fill="#333333"] {
        fill: #f3f4f6 !important;
      }
      
      /* Page title and subtitle */
      html.dark h1.text-gray-900 {
        color: #f3f4f6 !important;
      }
      
      html.dark .text-gray-500 {
        color: #9ca3af !important;
      }
      
      /* Back to cart link */
      html.dark a.text-gray-500:hover {
        color: #f97316 !important;
      }
      
      /* COD breakdown view - gradient backgrounds */
      html.dark #summary-deposit .bg-gradient-to-br {
        background: linear-gradient(to bottom right, rgba(249, 115, 22, 0.15), rgba(234, 179, 8, 0.1)) !important;
        border-color: #ea580c !important;
      }
      
      html.dark #summary-deposit .bg-red-50 {
        background-color: rgba(220, 38, 38, 0.15) !important;
      }
      
      html.dark #summary-deposit .text-red-900 {
        color: #fca5a5 !important;
      }
      
      html.dark #summary-deposit .text-red-600 {
        color: #f87171 !important;
      }
      
      html.dark #summary-deposit .border-orange-300 {
        border-color: #ea580c !important;
      }
      
      /* Order success message */
      html.dark #order-success-message .bg-gradient-to-br {
        background: linear-gradient(to bottom right, rgba(22, 101, 52, 0.2), rgba(6, 78, 59, 0.15)) !important;
        border-color: #22c55e !important;
      }
      
      html.dark #order-success-message .text-green-800 {
        color: #86efac !important;
      }
      
      html.dark #order-success-message .text-green-700 {
        color: #4ade80 !important;
      }
      
      html.dark #order-success-message .text-green-900 {
        color: #bbf7d0 !important;
      }
      
      /* Number badges (step indicators) */
      html.dark .bg-orange-100 {
        background-color: rgba(249, 115, 22, 0.2) !important;
      }
      
      /* Nova Poshta / Ukrposhta logos */
      html.dark .card-select[data-delivery] img {
        border-radius: 6px !important;
        background-color: #ffffff !important;
        padding: 2px !important;
      }
      
      /* Delivery icons background */
      html.dark .bg-blue-100 {
        background-color: rgba(59, 130, 246, 0.2) !important;
      }
      
      html.dark .bg-green-100 {
        background-color: rgba(34, 197, 94, 0.2) !important;
      }
      
      /* Promo apply button */
      html.dark #applyPromoBtn {
        background-color: #374151 !important;
      }
      
      html.dark #applyPromoBtn:hover {
        background-color: #4b5563 !important;
      }
      
      /* Orange delivery progress background */
      html.dark #checkout-container .bg-orange-50 {
        background-color: rgba(249, 115, 22, 0.15) !important;
      }
      
      html.dark .bg-gray-200 {
        background-color: #374151 !important;
      }
      
      /* Dispatch badge styling */
      html.dark [id^="dispatch-"] {
        background-color: rgba(249, 115, 22, 0.2) !important;
        border-color: rgba(249, 115, 22, 0.4) !important;
        color: #fdba74 !important;
      }
      
      /* Telegram input hint */
      html.dark .text-gray-400 {
        color: #6b7280 !important;
      }
      
      /* Promo code success/error messages */
      html.dark #promoMessage.text-green-600 {
        color: #4ade80 !important;
      }
      
      html.dark #promoMessage.text-red-600 {
        color: #f87171 !important;
      }
      
      /* COD restriction notice */
      html.dark #codRestriction {
        color: #fdba74 !important;
      }
      
      /* Product list items in order summary */
      html.dark #productsList .bg-gray-50 {
        background-color: #374151 !important;
      }
      
      html.dark #productsList img {
        border-radius: 8px !important;
      }

      /* ============================================
         AUTH PAGE - DARK MODE STYLES
         ============================================ */
      
      /* Auth page gradient background override */
      html.dark .bg-grid {
        background-image: none !important;
      }
      
      /* Auth page main card - only target the card containers, not all slide-up elements */
      html.dark .slide-up.bg-white {
        background-color: #1f2937 !important;
      }
      
      /* Auth page inputs */
      html.dark #phoneInput,
      html.dark .otp-input {
        background-color: #374151 !important;
        border-color: #4b5563 !important;
        color: #f3f4f6 !important;
      }
      
      html.dark #phoneInput:focus,
      html.dark .otp-input:focus {
        background-color: #1f2937 !important;
        border-color: #ef4444 !important;
      }
      
      html.dark #phoneInput::placeholder {
        color: #6b7280 !important;
      }
      
      /* Country code badge */
      html.dark .bg-gray-100.rounded-2xl {
        background-color: #374151 !important;
        border-color: #4b5563 !important;
        color: #d1d5db !important;
      }
      
      /* Auth page disabled buttons */
      html.dark #getCodeBtn:disabled,
      html.dark #loginBtn:disabled {
        background-color: #374151 !important;
        color: #6b7280 !important;
      }
      
      /* Auth page active buttons */
      html.dark #getCodeBtn:not(:disabled),
      html.dark #loginBtn:not(:disabled) {
        background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%) !important;
      }
      
      /* Timer badge */
      html.dark .bg-red-50 {
        background-color: rgba(220, 38, 38, 0.2) !important;
      }
      
      html.dark .text-red-600 {
        color: #f87171 !important;
      }
      
      /* OTP verification icon background */
      html.dark .bg-red-100 {
        background-color: rgba(220, 38, 38, 0.3) !important;
      }
      
      /* Back button hover */
      html.dark #backBtn:hover {
        background-color: rgba(220, 38, 38, 0.2) !important;
      }
      
      /* Benefits cards gradients */
      html.dark .from-blue-50 {
        --tw-gradient-from: rgba(59, 130, 246, 0.15) !important;
      }
      
      html.dark .from-green-50 {
        --tw-gradient-from: rgba(34, 197, 94, 0.15) !important;
      }
      
      html.dark .from-red-50 {
        --tw-gradient-from: rgba(239, 68, 68, 0.15) !important;
      }
      
      /* Benefits icons backgrounds */
      html.dark .bg-blue-100 {
        background-color: rgba(59, 130, 246, 0.3) !important;
      }
      
      html.dark .bg-green-100 {
        background-color: rgba(34, 197, 94, 0.3) !important;
      }
      
      /* Not found modal */
      html.dark #notFoundModal > div {
        background-color: #1f2937 !important;
      }

      /* ============================================
         THANK YOU PAGE - DARK MODE STYLES
         ============================================ */
      
      /* Order items list (dynamically generated) */
      html.dark #order-items-list > div {
        background-color: #374151 !important;
        border-color: #4b5563 !important;
      }
      
      html.dark #order-items-list .text-gray-900 {
        color: #f3f4f6 !important;
      }
      
      html.dark #order-items-list .text-gray-600 {
        color: #9ca3af !important;
      }
      
      html.dark #order-items-list .text-gray-500 {
        color: #9ca3af !important;
      }
      
      /* Product item cards on thank you page */
      html.dark #order-items-list .bg-gray-50 {
        background-color: #374151 !important;
      }
      
      html.dark #order-items-list .border-gray-100 {
        border-color: #4b5563 !important;
      }
      
      /* Thank you page - delivery logo background */
      html.dark #delivery-logo {
        background-color: #ffffff !important;
        padding: 2px 4px !important;
        border-radius: 4px !important;
      }
      
      /* Thank you page card hover */
      html.dark .card-hover:hover {
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.4) !important;
      }

      /* Shadow adjustments for dark mode */
      html.dark [class*="shadow-lg"],
      html.dark [class*="shadow-xl"],
      html.dark [class*="shadow-md"] {
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5) !important;
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * Listen for system theme changes
   */
  function watchSystemTheme() {
    if (!window.matchMedia) return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    mediaQuery.addEventListener('change', (e) => {
      // Only auto-switch if user hasn't set a preference
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  /**
   * Initialize dark mode
   */
  function init() {
    // Add transition styles
    addTransitionStyles();
    
    // Apply initial theme (before DOM is ready to prevent flash)
    const theme = getStoredTheme();
    applyTheme(theme);
    
    // Watch for system theme changes
    watchSystemTheme();
    
    // Wait for DOM to inject toggle button
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(injectToggleButton, 100);
      });
    } else {
      setTimeout(injectToggleButton, 100);
    }
    
    // Also try after layout.js loads header
    const observer = new MutationObserver((mutations, obs) => {
      const header = document.querySelector('header');
      if (header && !document.getElementById('theme-toggle')) {
        injectToggleButton();
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Stop observing after 5 seconds
    setTimeout(() => observer.disconnect(), 5000);
    
    console.log('🌙 Dark mode module initialized');
  }

  // ============================================
  // EXPORT PUBLIC API
  // ============================================
  window.darkMode = {
    toggle: toggleTheme,
    get: getStoredTheme,
    set: (theme) => {
      applyTheme(theme);
      saveTheme(theme);
    },
    init: init
  };

  // ============================================
  // AUTO-INITIALIZE
  // ============================================
  init();

})();
