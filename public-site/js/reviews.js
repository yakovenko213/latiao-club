// ============================================
// REVIEWS MODULE - Auto-Injecting Reviews Section
// ============================================
// Based on user's Option 2 design with Tailwind CSS, Photo Lightbox, and Star Ratings
// Auto-injects into product page and connects to Firebase

import { db, storage } from './firebase-init.js';
import { 
    collection, 
    addDoc, 
    getDocs,
    getDoc,
    doc,
    onSnapshot, 
    query, 
    where, 
    orderBy,
    serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { 
    ref, 
    uploadBytes, 
    getDownloadURL 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

// ============================================
// CONFIGURATION
// ============================================
const REVIEWS_COLLECTION = 'reviews';
const STORAGE_PATH = 'review_photos';
const MAX_PHOTOS = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// ============================================
// STATE
// ============================================
let currentProductId = null;
let reviews = [];
let visibleReviews = 4;
let filterVerified = false;
let selectedRating = 0;
let selectedTags = [];
let selectedPhotos = [];
let selectedPhotoFiles = [];
let currentLightboxPhotos = [];
let currentLightboxIndex = 0;
let unsubscribeReviews = null;

// Global visibility cache
let reviewsVisibilityCache = null;
let reviewsVisibilityCacheTime = null;
const CACHE_DURATION = 60000; // 1 minute cache

const availableTags = ["Смак", "Гострота", "Доставка", "Упаковка", "Якість"];
const tagColors = {
  "Смак": "bg-orange-100 text-orange-700 border-orange-200",
  "Гострота": "bg-red-100 text-red-700 border-red-200",
  "Доставка": "bg-green-100 text-green-700 border-green-200",
  "Упаковка": "bg-blue-100 text-blue-700 border-blue-200",
  "Якість": "bg-purple-100 text-purple-700 border-purple-200",
};

// ============================================
// HTML TEMPLATE
// ============================================
const getReviewsHTML = () => `
<!-- Reviews Section Styles -->
<style id="reviews-styles">
  /* Animations */
  @keyframes reviews-fade-in {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes reviews-scale-in {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  @keyframes reviews-slide-up {
    from { opacity: 0; transform: translateY(100%); }
    to { opacity: 1; transform: translateY(0); }
  }
  .reviews-animate-fade-in { animation: reviews-fade-in 0.6s ease-out forwards; }
  .reviews-animate-scale-in { animation: reviews-scale-in 0.2s ease-out forwards; }
  .reviews-animate-slide-up { animation: reviews-slide-up 0.3s ease-out forwards; }
  
  /* Hide scrollbar */
  .reviews-scrollbar-hide::-webkit-scrollbar { display: none; }
  .reviews-scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
  
  /* Star rating hover */
  .star-interactive:hover { transform: scale(1.1); }
  
  /* Photo hover */
  .photo-item:hover img { transform: scale(1.1); }
  .photo-item:hover .photo-overlay { opacity: 1; background-color: rgba(0,0,0,0.2); }
  .photo-item:hover .photo-icon { opacity: 1; }
  .photo-item:active { transform: scale(0.95); }
</style>

<!-- REVIEWS SECTION -->
<section id="reviews-section" class="mb-10 reviews-animate-fade-in mt-6">
  <div class="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
    
    <!-- Header -->
    <div class="p-4 sm:p-5 md:p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
      <div class="flex flex-col gap-4">
        <div>
          <h2 class="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            Відгуки покупців
          </h2>
          <!-- Stats -->
          <div class="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3">
            <div class="flex items-center gap-2">
              <!-- Average Stars -->
              <div id="average-stars" class="flex gap-0.5"></div>
              <span id="average-rating" class="text-xl sm:text-2xl font-bold text-gray-900">0.0</span>
              <span id="total-reviews-mobile" class="text-gray-400 text-sm sm:hidden">(0)</span>
            </div>
            <span class="hidden sm:block text-gray-300">|</span>
            <span id="total-reviews-desktop" class="hidden sm:block text-gray-500">0 відгуків</span>
            <span class="hidden sm:block text-gray-300">|</span>
            <span class="text-emerald-600 flex items-center gap-1 text-sm sm:text-base">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <span id="verified-count">0 верифікованих</span>
            </span>
          </div>
        </div>

        <!-- CTA Button -->
        <button
          onclick="window.reviewsModule.openReviewModal()"
          class="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-spicy to-spicy-dark text-white font-semibold px-5 sm:px-6 py-3 rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 active:scale-[0.98] transition-all duration-200"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Залишити відгук
        </button>
      </div>
    </div>

    <!-- Rating breakdown -->
    <div class="px-4 sm:px-5 md:px-6 py-3 sm:py-4 bg-gray-50/70 border-b border-gray-100">
      <div class="flex flex-col gap-3 sm:gap-4">
        <!-- Rating bars -->
        <div id="rating-breakdown" class="grid grid-cols-1 sm:grid-cols-5 gap-2 sm:gap-3"></div>
      </div>
    </div>

    <!-- Reviews grid -->
    <div class="p-4 sm:p-5 md:p-6">
      <div id="reviews-grid" class="grid gap-3 sm:gap-4 md:grid-cols-2">
        <!-- Loading state -->
        <div class="col-span-full text-center py-8 text-gray-500">
          <svg class="w-8 h-8 mx-auto mb-3 animate-spin text-spicy" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p>Завантаження відгуків...</p>
        </div>
      </div>

      <!-- Show more button -->
      <div id="show-more-container" class="mt-5 sm:mt-6 text-center hidden">
        <button
          onclick="window.reviewsModule.showMoreReviews()"
          class="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-spicy font-semibold hover:text-spicy-dark transition-colors px-6 py-2.5 sm:py-2 rounded-full border-2 border-spicy/20 hover:border-spicy/40 hover:bg-orange-50 active:scale-[0.98]"
        >
          <span id="show-more-text">Показати ще (0)</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</section>

<!-- REVIEW MODAL -->
<div id="review-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] hidden items-end sm:items-center justify-center sm:p-4 overflow-y-auto">
  <div class="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] sm:max-h-[85vh] sm:my-8 reviews-animate-slide-up sm:reviews-animate-scale-in overflow-hidden flex flex-col">
    
    <!-- Form State -->
    <div id="review-form-state" class="flex flex-col flex-1 overflow-hidden">
      <!-- Header -->
      <div class="bg-white border-b border-gray-100 p-4 sm:p-6 flex-shrink-0">
        <div class="sm:hidden w-10 h-1 bg-gray-300 rounded-full mx-auto mb-3"></div>
        <div class="flex items-center justify-between">
          <h3 class="text-lg sm:text-xl font-bold text-gray-900">Залишити відгук</h3>
          <button
            onclick="window.reviewsModule.closeReviewModal()"
            class="w-10 h-10 sm:w-9 sm:h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 active:bg-gray-300 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-4 sm:p-6 pt-0 sm:pt-0">
        <form id="review-form" class="space-y-4 sm:space-y-5 pt-4 sm:pt-5">
          <!-- Rating -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Ваша оцінка *</label>
            <div id="modal-stars" class="flex gap-1"></div>
            <input type="hidden" id="rating-input" value="0">
          </div>

          <!-- Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Ім'я *</label>
            <input
              type="text"
              id="name-input"
              placeholder="Ваше ім'я"
              required
              class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-spicy focus:ring-2 focus:ring-spicy/20 outline-none transition-all text-base"
            >
          </div>

          <!-- Phone -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Телефон (для верифікації)
              <span class="ml-1 sm:ml-2 text-xs text-gray-400 font-normal">не публікується</span>
            </label>
            <input
              type="tel"
              id="phone-input"
              placeholder="+380XXXXXXXXX"
              class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-spicy focus:ring-2 focus:ring-spicy/20 outline-none transition-all text-base"
            >
            <p class="mt-1.5 text-xs text-gray-400">
              Якщо ви робили замовлення з цим номером, відгук буде позначено як верифікований
            </p>
          </div>

          <!-- Review text -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Ваш відгук *</label>
            <textarea
              id="review-text-input"
              rows="3"
              placeholder="Поділіться вашими враженнями про товар..."
              required
              class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-spicy focus:ring-2 focus:ring-spicy/20 outline-none transition-all resize-none text-base"
            ></textarea>
          </div>

          <!-- Photo upload -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Додати фото
              <span class="ml-2 text-xs text-gray-400 font-normal">до 5 фото</span>
            </label>
            <div id="photo-upload-container" class="flex flex-wrap gap-2">
              <input type="file" id="photo-input" accept="image/*" multiple class="hidden">
              <button
                type="button"
                onclick="document.getElementById('photo-input').click()"
                class="w-14 h-14 sm:w-16 sm:h-16 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-spicy hover:text-spicy active:bg-orange-50 transition-colors"
              >
                <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                <span class="text-[10px] mt-0.5">Фото</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      <!-- Footer -->
      <div class="bg-white border-t border-gray-100 p-4 sm:p-6 pb-6 sm:pb-6 flex-shrink-0">
        <button
          type="submit"
          id="submit-review-btn"
          form="review-form"
          onclick="window.reviewsModule.submitReview(event)"
          class="w-full bg-gradient-to-r from-spicy to-spicy-dark text-white font-bold py-3.5 sm:py-3.5 rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-xl active:scale-[0.98] transition-all text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Надіслати відгук
        </button>
        <p class="text-xs text-center text-gray-400 mt-2">
          Відгук з'явиться після перевірки модератором
        </p>
      </div>
    </div>
    
    <!-- Success State (hidden by default) -->
    <div id="review-success-state" class="hidden flex-col items-center justify-center p-5 sm:p-8 text-center flex-1">
      <!-- Animated success icon container -->
      <div class="relative mb-4 sm:mb-6">
        <!-- Background glow -->
        <div class="absolute inset-0 bg-gradient-to-br from-green-400/30 to-emerald-500/30 rounded-full blur-2xl scale-150 animate-pulse"></div>
        <!-- Icon -->
        <div class="relative w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-green-50 to-emerald-100 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
          <img src="./images/success-icon.png" alt="Успіх" class="w-16 h-16 sm:w-20 sm:h-20 object-contain" onerror="this.outerHTML='<svg class=\\'w-12 h-12 sm:w-16 sm:h-16 text-green-500\\' fill=\\'none\\' stroke=\\'currentColor\\' viewBox=\\'0 0 24 24\\'><path stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\' stroke-width=\\'2.5\\' d=\\'M5 13l4 4L19 7\\'></path></svg>'">
        </div>
      </div>
      
      <!-- Title -->
      <h3 class="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
        Дякуємо за відгук! 🎉
      </h3>
      
      <!-- Description -->
      <p class="text-sm sm:text-base text-gray-600 mb-5 sm:mb-6 max-w-xs sm:max-w-sm leading-relaxed">
        Ми швиденько перевіримо ваш відгук та опублікуємо його на сайті
      </p>
      
      <!-- Decorative stars -->
      <div class="flex gap-1 mb-5 sm:mb-6">
        <span class="text-yellow-400 text-lg sm:text-xl">★</span>
        <span class="text-yellow-400 text-lg sm:text-xl">★</span>
        <span class="text-yellow-400 text-lg sm:text-xl">★</span>
        <span class="text-yellow-400 text-lg sm:text-xl">★</span>
        <span class="text-yellow-400 text-lg sm:text-xl">★</span>
      </div>
      
      <!-- Close button -->
      <button
        onclick="window.reviewsModule.closeReviewModal()"
        class="w-full sm:w-auto px-8 py-3.5 sm:py-3 bg-gradient-to-r from-spicy to-spicy-dark text-white font-bold rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 active:scale-[0.98] transition-all text-base"
      >
        Чудово!
      </button>
    </div>
    
  </div>
</div>

<!-- PHOTO LIGHTBOX -->
<div id="photo-lightbox" class="fixed inset-0 bg-black/95 z-[10000] hidden items-center justify-center">
  <!-- Close button -->
  <button
    onclick="window.reviewsModule.closeLightbox()"
    class="absolute top-3 right-3 sm:top-4 sm:right-4 w-11 h-11 sm:w-10 sm:h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 active:bg-white/30 transition-colors z-10"
  >
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  </button>
  
  <!-- Navigation buttons -->
  <button
    id="lightbox-prev"
    onclick="event.stopPropagation(); window.reviewsModule.navigateLightbox(-1)"
    class="hidden sm:flex absolute left-4 w-12 h-12 rounded-full bg-white/10 items-center justify-center text-white hover:bg-white/20 transition-colors"
  >
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
    </svg>
  </button>
  <button
    id="lightbox-next"
    onclick="event.stopPropagation(); window.reviewsModule.navigateLightbox(1)"
    class="hidden sm:flex absolute right-4 w-12 h-12 rounded-full bg-white/10 items-center justify-center text-white hover:bg-white/20 transition-colors"
  >
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
    </svg>
  </button>
  
  <!-- Image container -->
  <div class="lightbox-image-container" onclick="window.reviewsModule.closeLightbox()">
    <img
      id="lightbox-image"
      src=""
      alt="Review photo"
      class="max-w-[95vw] max-h-[80vh] sm:max-w-[90vw] sm:max-h-[90vh] object-contain rounded-lg select-none"
      onclick="event.stopPropagation()"
    >
  </div>
  
  <!-- Swipe hint -->
  <p id="lightbox-swipe-hint" class="sm:hidden absolute bottom-20 text-white/60 text-sm hidden">
    Свайпайте для перегляду
  </p>
  
  <!-- Pagination dots -->
  <div id="lightbox-dots" class="absolute bottom-6 flex gap-2"></div>
</div>
`;

// ============================================
// UTILITY FUNCTIONS
// ============================================

function getProductId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

function formatDate(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const months = ["січня", "лютого", "березня", "квітня", "травня", "червня", "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function createStarSVG(filled, size = "w-5 h-5") {
    return `<svg class="${size} ${filled ? 'text-amber-400' : 'text-gray-200'} transition-colors" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>`;
}

function renderStars(rating, size = "w-5 h-5") {
    return [1, 2, 3, 4, 5].map(star => createStarSVG(star <= rating, size)).join('');
}

function generateFileName(originalName) {
    const ext = originalName.split('.').pop();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}.${ext}`;
}

// ============================================
// INJECTION LOGIC
// ============================================

// Check if reviews should be displayed (with caching)
async function checkReviewsVisibility() {
    // Check cache first
    const now = Date.now();
    if (reviewsVisibilityCache !== null && reviewsVisibilityCacheTime && (now - reviewsVisibilityCacheTime) < CACHE_DURATION) {
        console.log('📦 Using cached reviews visibility:', reviewsVisibilityCache);
        return reviewsVisibilityCache;
    }

    try {
        const configDoc = await getDoc(doc(db, 'settings', 'general_config'));
        if (configDoc.exists()) {
            const data = configDoc.data();
            const isEnabled = data.isReviewsEnabled !== undefined ? data.isReviewsEnabled : true;
            
            // Update cache
            reviewsVisibilityCache = isEnabled;
            reviewsVisibilityCacheTime = now;
            
            console.log('✅ Reviews visibility fetched:', isEnabled);
            return isEnabled;
        } else {
            // Default to enabled if config doesn't exist
            reviewsVisibilityCache = true;
            reviewsVisibilityCacheTime = now;
            return true;
        }
    } catch (error) {
        console.error('❌ Error checking reviews visibility:', error);
        // Default to enabled on error
        return true;
    }
}

function injectReviewsSection() {
    // Prevent duplicate injection
    if (document.getElementById('reviews-section')) {
        console.log('⚠️ Reviews section already exists, skipping injection');
        return true;
    }
    
    // Find the parent section that contains all tabs (Опис, Характеристики, Склад)
    const tabIngredients = document.getElementById('tab-ingredients');
    if (tabIngredients) {
        const skladTab = tabIngredients.closest('.bg-white.rounded-2xl');
        if (skladTab) {
            const tabsContainer = skladTab.closest('.space-y-3');
            if (tabsContainer) {
                const section = tabsContainer.closest('section');
                if (section) {
                    section.insertAdjacentHTML('afterend', getReviewsHTML());
                    console.log('✅ Reviews section injected after product details section');
                    return true;
                }
            }
            skladTab.insertAdjacentHTML('afterend', getReviewsHTML());
            console.log('✅ Reviews section injected after Склад tab');
            return true;
        }
    }
    
    // Fallback: Find by text content
    const allButtons = document.querySelectorAll('button');
    for (const btn of allButtons) {
        const span = btn.querySelector('span');
        if (span && (span.textContent.includes('Склад') || span.textContent.includes('Характеристики'))) {
            const tabContainer = btn.closest('.bg-white.rounded-2xl');
            if (tabContainer) {
                const parentSection = tabContainer.closest('section');
                if (parentSection) {
                    parentSection.insertAdjacentHTML('afterend', getReviewsHTML());
                    console.log('✅ Reviews section injected');
                    return true;
                }
            }
        }
    }
    
    // Last resort: append to main content
    const mainContent = document.getElementById('main-content') || document.querySelector('main');
    if (mainContent) {
        mainContent.insertAdjacentHTML('beforeend', getReviewsHTML());
        console.log('⚠️ Reviews section appended to main content (fallback)');
        return true;
    }
    
    console.error('❌ Could not find injection point for reviews section');
    return false;
}

// ============================================
// FIREBASE INTEGRATION
// ============================================

function subscribeToReviews(productId) {
    // TASK 2: Force String Type Conversion (CRITICAL FIX)
    const productIdStr = String(productId).trim();
    
    // Enhanced Debug Logging
    console.log('\n========================================');
    console.log('🔍 FETCHING REVIEWS FOR PRODUCT PAGE');
    console.log('========================================');
    console.log('📝 Product ID (Original):', productId);
    console.log('📝 Product ID (Original Type):', typeof productId);
    console.log('📝 Current Product Page ID:', productIdStr);
    console.log('📝 Product ID Type (After String()):', typeof productIdStr);
    console.log('📝 Product ID Length:', productIdStr.length);
    console.log('📝 Product ID (JSON):', JSON.stringify(productIdStr));
    console.log('� Product ID Format:', productIdStr.length > 10 ? 'Firestore Doc ID ✅' : 'Short ID (SKU?) ⚠️');
    console.log('🔍 Query: productIds array-contains "' + productIdStr + '" AND status == "approved"');
    console.log('🔍 Expecting productIds array to contain this exact string!');
    console.log('========================================\n');
    
    if (unsubscribeReviews) {
        unsubscribeReviews();
    }
    
    // Validate productId
    if (!productIdStr || productIdStr === 'undefined' || productIdStr === 'null') {
        console.error('❌ Invalid productId:', productIdStr);
        renderEmptyState();
        return;
    }
    
    const reviewsRef = collection(db, REVIEWS_COLLECTION);
    
    // Try the new array-contains query first (for reviews from post-purchase links)
    const qArray = query(
        reviewsRef,
        where('productIds', 'array-contains', productIdStr),
        where('status', '==', 'approved'),
        orderBy('createdAt', 'desc')
    );
    
    unsubscribeReviews = onSnapshot(qArray, (snapshot) => {
        console.log('\n📊 ARRAY QUERY RESULTS:');
        console.log('📊 Total documents found:', snapshot.size);
        
        const arrayReviews = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            console.log('\n📄 Document ID:', doc.id);
            console.log('   - customerName:', data.customerName);
            console.log('   - name:', data.name);
            console.log('   - userName:', data.userName);
            console.log('   - author:', data.author);
            console.log('   - rating:', data.rating);
            console.log('   - status:', data.status);
            console.log('   - productIds:', data.productIds);
            console.log('   - productIds type:', typeof data.productIds);
            console.log('   - productIds is Array:', Array.isArray(data.productIds));
            
            // CRITICAL: Log each ID in the array to verify type and matching
            if (Array.isArray(data.productIds)) {
                console.log('   - productIds contents:');
                data.productIds.forEach((id, idx) => {
                    console.log(`      [${idx}] "${id}" (type: ${typeof id})`);
                });
                console.log(`   - Does it contain "${productIdStr}"?`, data.productIds.includes(productIdStr));
            }
            
            arrayReviews.push({ id: doc.id, ...data });
        });
        
        console.log('\n📦 Reviews with productIds array:', arrayReviews.length);
        
        // TASK 3: If no reviews found, fetch ALL approved reviews for debugging
        if (arrayReviews.length === 0) {
            console.warn('\n⚠️ NO REVIEWS FOUND! Fetching ALL approved reviews for debugging...');
            debugFetchAllReviews(productIdStr);
        }
        
        // Now fetch legacy reviews with single productId field
        fetchLegacyReviews(productIdStr, arrayReviews);
        
    }, (error) => {
        console.error('\n❌ ERROR IN ARRAY QUERY:');
        console.error('   - Error Code:', error.code);
        console.error('   - Error Message:', error.message);
        console.error('   - Full Error:', error);
        
        if (error.code === 'failed-precondition') {
            console.log('⚠️ Missing index for productIds. Falling back to simple fetch.');
            console.log('⚠️ Create index: https://console.firebase.google.com/project/_/firestore/indexes');
        }
        
        // Fallback to simple fetch
        fetchReviewsSimple(productIdStr);
    });
}

// TASK 3: Debug function to fetch ALL approved reviews and compare IDs
async function debugFetchAllReviews(searchingForId) {
    try {
        console.log('\n🔍 DEBUG: Fetching ALL approved reviews...');
        const reviewsRef = collection(db, REVIEWS_COLLECTION);
        const qAll = query(reviewsRef, where('status', '==', 'approved'));
        const snapshot = await getDocs(qAll);
        
        console.log('📊 Total approved reviews in database:', snapshot.size);
        console.log('🎯 We are searching for Product ID:', searchingForId);
        console.log('🎯 Search ID type:', typeof searchingForId);
        console.log('🎯 Search ID length:', searchingForId.length);
        console.log('🎯 Search ID format:', searchingForId.length > 10 ? 'Firestore Doc ID ✅' : 'Short ID ⚠️');
        console.log('\n📋 All approved reviews productIds:');
        
        snapshot.forEach((doc, index) => {
            const data = doc.data();
            console.log(`\n[${index + 1}] Review ID: ${doc.id}`);
            console.log('   - Customer:', data.customerName);
            console.log('   - productIds:', data.productIds);
            console.log('   - productIds type:', typeof data.productIds);
            console.log('   - is Array:', Array.isArray(data.productIds));
            
            if (Array.isArray(data.productIds)) {
                console.log('   - Array contents:');
                data.productIds.forEach((id, idx) => {
                    const matches = id === searchingForId;
                    const idFormat = id.length > 10 ? 'Firestore ID' : 'Short ID';
                    console.log(`      [${idx}] "${id}" (type: ${typeof id}, length: ${id.length}, format: ${idFormat}) ${matches ? '✅ MATCH!' : '❌ no match'}`);
                });
            } else if (data.productId) {
                // Legacy format
                const idFormat = data.productId.length > 10 ? 'Firestore ID' : 'Short ID';
                console.log('   - Legacy productId:', data.productId, '(type:', typeof data.productId, 'length:', data.productId.length, 'format:', idFormat + ')');
                console.log('   - Matches search?', data.productId === searchingForId ? '✅ YES' : '❌ NO');
            }
        });
        
        console.log('\n========================================\n');
    } catch (error) {
        console.error('❌ Error in debug fetch:', error);
    }
}

// Helper function to fetch legacy reviews and merge with new ones
async function fetchLegacyReviews(productId, arrayReviews = []) {
    try {
        console.log('\n🔄 FETCHING LEGACY REVIEWS...');
        console.log('🔍 Query: productId == "' + productId + '" AND status == "approved"');
        
        const reviewsRef = collection(db, REVIEWS_COLLECTION);
        const qLegacy = query(
            reviewsRef,
            where('productId', '==', productId),
            where('status', '==', 'approved'),
            orderBy('createdAt', 'desc')
        );
        
        const snapshot = await getDocs(qLegacy);
        console.log('📊 Legacy query results:', snapshot.size);
        
        const legacyReviews = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            console.log('\n📄 Legacy Document ID:', doc.id);
            console.log('   - customerName:', data.customerName);
            console.log('   - name:', data.name);
            console.log('   - userName:', data.userName);
            console.log('   - author:', data.author);
            console.log('   - rating:', data.rating);
            console.log('   - status:', data.status);
            console.log('   - productId:', data.productId);
            console.log('   - productId type:', typeof data.productId);
            
            legacyReviews.push({ id: doc.id, ...data });
        });
        
        console.log('\n📝 Legacy reviews found:', legacyReviews.length);
        
        // TASK 2: Merge and deduplicate
        const allReviews = [...arrayReviews, ...legacyReviews];
        const uniqueReviews = [];
        const seenIds = new Set();
        
        for (const review of allReviews) {
            if (!seenIds.has(review.id)) {
                seenIds.add(review.id);
                uniqueReviews.push(review);
            }
        }
        
        // Sort by date (newest first)
        uniqueReviews.sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(0);
            const dateB = b.createdAt?.toDate?.() || new Date(0);
            return dateB - dateA;
        });
        
        reviews = uniqueReviews;
        console.log('\n✅ FINAL RESULT:');
        console.log('   - Array-based reviews:', arrayReviews.length);
        console.log('   - Legacy reviews:', legacyReviews.length);
        console.log('   - Total unique reviews:', reviews.length);
        console.log('========================================\n');
        
        renderAll();
        
    } catch (error) {
        console.error('\n❌ ERROR IN LEGACY FETCH:');
        console.error('   - Error Code:', error.code);
        console.error('   - Error Message:', error.message);
        console.error('   - Full Error:', error);
        
        // If legacy query fails, just use array reviews
        reviews = arrayReviews;
        console.log('⚠️ Using only array-based reviews:', reviews.length);
        console.log('========================================\n');
        renderAll();
    }
}

async function fetchReviewsSimple(productId) {
    // TASK 2: Force String Type Conversion
    const productIdStr = String(productId).trim();
    
    console.log('\n🔄 SIMPLE FETCH MODE (FALLBACK)');
    console.log('🔍 Product ID:', productIdStr);
    console.log('🔍 Product ID Type:', typeof productIdStr);
    console.log('🔍 Query Params: status == "approved"');
    
    try {
        const reviewsRef = collection(db, REVIEWS_COLLECTION);
        const allReviews = [];
        
        // TASK 2: Fetch both legacy and new format reviews
        
        // 1. Try to fetch reviews with productIds array (new format)
        console.log('\n📦 Attempting array-contains query...');
        try {
            const qArray = query(
                reviewsRef,
                where('productIds', 'array-contains', productIdStr),
                where('status', '==', 'approved')
            );
            const snapshotArray = await getDocs(qArray);
            console.log('📊 Array query results:', snapshotArray.size);
            
            snapshotArray.forEach(doc => {
                const data = doc.data();
                console.log('\n📄 Array Doc ID:', doc.id);
                console.log('   - customerName:', data.customerName);
                console.log('   - name:', data.name);
                console.log('   - userName:', data.userName);
                console.log('   - author:', data.author);
                console.log('   - productIds:', data.productIds);
                console.log('   - productIds type:', typeof data.productIds);
                console.log('   - is Array:', Array.isArray(data.productIds));
                console.log('   - status:', data.status);
                
                allReviews.push({ id: doc.id, ...data });
            });
            console.log('✅ Array-based reviews added:', snapshotArray.size);
        } catch (arrayError) {
            console.error('❌ Array query failed:');
            console.error('   - Code:', arrayError.code);
            console.error('   - Message:', arrayError.message);
        }
        
        // 2. Fetch reviews with single productId (legacy format)
        console.log('\n📝 Attempting legacy productId query...');
        try {
            const qLegacy = query(
                reviewsRef,
                where('productId', '==', productIdStr),
                where('status', '==', 'approved')
            );
            const snapshotLegacy = await getDocs(qLegacy);
            console.log('📊 Legacy query results:', snapshotLegacy.size);
            
            snapshotLegacy.forEach(doc => {
                const data = doc.data();
                console.log('\n📄 Legacy Doc ID:', doc.id);
                console.log('   - customerName:', data.customerName);
                console.log('   - name:', data.name);
                console.log('   - userName:', data.userName);
                console.log('   - author:', data.author);
                console.log('   - productId:', data.productId);
                console.log('   - productId type:', typeof data.productId);
                console.log('   - status:', data.status);
                
                allReviews.push({ id: doc.id, ...data });
            });
            console.log('✅ Legacy reviews added:', snapshotLegacy.size);
        } catch (legacyError) {
            console.error('❌ Legacy query failed:');
            console.error('   - Code:', legacyError.code);
            console.error('   - Message:', legacyError.message);
        }
        
        // Deduplicate by review ID
        const uniqueReviews = [];
        const seenIds = new Set();
        for (const review of allReviews) {
            if (!seenIds.has(review.id)) {
                seenIds.add(review.id);
                uniqueReviews.push(review);
            }
        }
        
        // Sort by date
        uniqueReviews.sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(0);
            const dateB = b.createdAt?.toDate?.() || new Date(0);
            return dateB - dateA;
        });
        
        reviews = uniqueReviews;
        console.log('\n✅ SIMPLE FETCH FINAL RESULT:');
        console.log('   - Total unique reviews:', reviews.length);
        console.log('========================================\n');
        
        renderAll();
    } catch (error) {
        console.error('\n❌ FATAL ERROR IN SIMPLE FETCH:');
        console.error('   - Error:', error);
        console.log('========================================\n');
        renderEmptyState();
    }
}

async function uploadPhotos(files, productId) {
    const urls = [];
    
    for (const file of files) {
        if (file.size > MAX_FILE_SIZE) {
            console.warn(`⚠️ File ${file.name} exceeds size limit, skipping`);
            continue;
        }
        
        const fileName = generateFileName(file.name);
        const storagePath = `${STORAGE_PATH}/${productId}/${fileName}`;
        const storageRef = ref(storage, storagePath);
        
        try {
            const snapshot = await uploadBytes(storageRef, file);
            const url = await getDownloadURL(snapshot.ref);
            urls.push(url);
            console.log(`✅ Uploaded: ${fileName}`);
        } catch (error) {
            console.error(`❌ Failed to upload ${file.name}:`, error);
        }
    }
    
    return urls;
}

// ============================================
// RENDER FUNCTIONS
// ============================================

function renderAll() {
    console.log('📝 Rendering reviews:', reviews.length, 'reviews');
    console.log('🔍 Reviews isVerified status:', reviews.map(r => ({ name: r.userName, isVerified: r.isVerified })));
    renderAverageStars();
    renderTotalReviews();
    renderRatingBreakdown();
    renderReviews();
}

function renderEmptyState() {
    const container = document.getElementById('reviews-grid');
    if (container) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
                <p class="text-gray-500 font-medium">Ще немає відгуків</p>
                <p class="text-gray-400 text-sm mt-1">Будьте першим, хто залишить відгук!</p>
            </div>
        `;
    }
}

function renderAverageStars() {
    if (reviews.length === 0) {
        document.getElementById('average-stars').innerHTML = renderStars(0, "w-5 h-5");
        document.getElementById('average-rating').textContent = "0.0";
        return;
    }
    const avg = reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length;
    document.getElementById('average-stars').innerHTML = renderStars(Math.round(avg), "w-5 h-5");
    document.getElementById('average-rating').textContent = avg.toFixed(1);
}

function renderTotalReviews() {
    const total = reviews.length;
    const verified = reviews.filter(r => r.isVerified).length;
    document.getElementById('total-reviews-mobile').textContent = `(${total})`;
    document.getElementById('total-reviews-desktop').textContent = `${total} відгуків`;
    document.getElementById('verified-count').textContent = `${verified} верифікованих`;
}

function renderRatingBreakdown() {
    const container = document.getElementById('rating-breakdown');
    if (!container) return;
    
    const total = reviews.length || 1;
    
    container.innerHTML = [5, 4, 3, 2, 1].map(stars => {
        const count = reviews.filter(r => (r.rating || 5) === stars).length;
        const percentage = (count / total) * 100;
        return `
            <div class="flex items-center gap-2">
                <span class="text-sm text-gray-500 w-3">${stars}</span>
                <svg class="w-4 h-4 text-amber-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <div class="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden min-w-[60px]">
                    <div class="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500" style="width: ${percentage}%"></div>
                </div>
                <span class="text-xs text-gray-400 w-4 text-right">${count}</span>
            </div>
        `;
    }).join('');
}

// ============================================
// HELPER: Format Display Name
// ============================================
/**
 * Formats full name to "FirstName L." format
 * Examples:
 *   "Руслан Яковенко" → "Руслан Я."
 *   "Марія" → "Марія"
 *   null/undefined → "Покупець"
 */
function formatDisplayName(fullName) {
    if (!fullName || fullName.trim() === '') {
        return 'Покупець';
    }
    
    const parts = fullName.trim().split(/\s+/);
    
    // If only one word (first name only)
    if (parts.length === 1) {
        return parts[0];
    }
    
    // First name + Last initial with dot
    const firstName = parts[0];
    const lastInitial = parts[1].charAt(0).toUpperCase() + '.';
    
    return `${firstName} ${lastInitial}`;
}

function renderReviewCard(review) {
    const photos = review.photos || [];
    const photosHTML = photos.length > 0 ? `
        <div class="flex gap-2 mb-3 overflow-x-auto pb-1 -mx-1 px-1 reviews-scrollbar-hide">
            ${photos.map((photo, index) => `
                <button
                    onclick="window.reviewsModule.openLightbox(${JSON.stringify(photos).replace(/"/g, '&quot;')}, ${index})"
                    class="photo-item relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg sm:rounded-xl overflow-hidden transition-transform"
                >
                    <img src="${photo}" alt="Фото ${index + 1}" class="w-full h-full object-cover transition-transform duration-300">
                    <div class="photo-overlay absolute inset-0 opacity-0 transition-all flex items-center justify-center">
                        <svg class="photo-icon w-5 h-5 sm:w-6 sm:h-6 text-white opacity-0 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                    </div>
                    ${index === 2 && photos.length > 3 ? `
                        <div class="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span class="text-white font-bold text-sm">+${photos.length - 3}</span>
                        </div>
                    ` : ''}
                </button>
            `).join('')}
        </div>
    ` : '';

    const tags = review.tags || [];
    const tagsHTML = tags.length > 0 ? `
        <div class="flex flex-wrap gap-1.5 sm:gap-2">
            ${tags.map(tag => `
                <span class="text-xs font-medium px-2.5 py-1 rounded-full border ${tagColors[tag] || 'bg-gray-100 text-gray-600 border-gray-200'}">
                    ${tag}
                </span>
            `).join('')}
        </div>
    ` : '';

    const verifiedBadgeCompact = review.isVerified ? `
        <span class="sm:hidden inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white" title="Верифікований покупець">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
        </span>
    ` : '';

    const verifiedBadgeFull = review.isVerified ? `
        <span class="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            Верифіковано
        </span>
    ` : '';

    // Get customer name from multiple possible fields
    const rawName = review.customerName || review.name || review.userName || review.author;
    
    // Debug logging to see what data we have
    console.log('🔍 Review name data:', {
        reviewId: review.id,
        customerName: review.customerName,
        name: review.name,
        userName: review.userName,
        author: review.author,
        rawName: rawName,
        formatted: formatDisplayName(rawName)
    });
    
    const userName = formatDisplayName(rawName);

    return `
        <div class="bg-white rounded-2xl p-4 sm:p-5 shadow-md border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-300">
            <!-- Header -->
            <div class="flex flex-col xs:flex-row xs:items-start xs:justify-between gap-2 xs:gap-0 mb-3">
                <div class="flex items-center gap-2.5 sm:gap-3">
                    <div class="relative flex-shrink-0">
                        <div class="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-spicy to-flame flex items-center justify-center text-white font-bold text-sm shadow-md">
                            ${userName.charAt(0).toUpperCase()}
                        </div>
                        ${review.isVerified ? `
                            <div class="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-4 h-4 sm:w-5 sm:h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white">
                                <svg class="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                </svg>
                            </div>
                        ` : ''}
                    </div>
                    <div class="min-w-0">
                        <div class="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <p class="font-semibold text-gray-900 text-sm sm:text-base truncate">${userName}</p>
                            ${verifiedBadgeCompact}
                            ${verifiedBadgeFull}
                        </div>
                        <p class="text-[11px] sm:text-xs text-gray-400">${formatDate(review.createdAt || review.date)}</p>
                    </div>
                </div>
                <div class="flex items-center gap-2 xs:ml-0 ml-12">
                    <div class="flex gap-0.5">${renderStars(review.rating || 5, "w-4 h-4")}</div>
                </div>
            </div>

            <p class="text-gray-600 text-sm leading-relaxed mb-3">${review.text || ''}</p>

            ${review.adminReply ? `
                <div class="mb-3 p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100">
                    <div class="flex items-center gap-2 mb-2">
                        <div class="w-6 h-6 rounded-full bg-spicy flex items-center justify-center">
                            <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <span class="text-sm font-semibold text-spicy">Менеджер Latiao Snack</span>
                        <span class="text-xs text-gray-400">відповідь</span>
                    </div>
                    <p class="text-gray-700 text-sm leading-relaxed pl-8">${review.adminReply}</p>
                </div>
            ` : ''}

            ${photosHTML}
            ${tagsHTML}
        </div>
    `;
}

function renderReviews() {
    const container = document.getElementById('reviews-grid');
    if (!container) return;
    
    const filteredReviews = filterVerified ? reviews.filter(r => r.isVerified) : reviews;
    
    if (filteredReviews.length === 0) {
        renderEmptyState();
        document.getElementById('show-more-container')?.classList.add('hidden');
        return;
    }
    
    const reviewsToShow = filteredReviews.slice(0, visibleReviews);
    container.innerHTML = reviewsToShow.map(review => renderReviewCard(review)).join('');
    
    // Show/hide "show more" button
    const showMoreContainer = document.getElementById('show-more-container');
    const remaining = filteredReviews.length - visibleReviews;
    if (remaining > 0) {
        showMoreContainer?.classList.remove('hidden');
        const showMoreText = document.getElementById('show-more-text');
        if (showMoreText) showMoreText.textContent = `Показати ще (${remaining})`;
    } else {
        showMoreContainer?.classList.add('hidden');
    }
}

function renderModalStars() {
    const container = document.getElementById('modal-stars');
    if (!container) return;
    
    container.innerHTML = [1, 2, 3, 4, 5].map(star => `
        <button
            type="button"
            onmouseenter="window.reviewsModule.previewRating(${star})"
            onmouseleave="window.reviewsModule.previewRating(0)"
            onclick="window.reviewsModule.setRating(${star})"
            class="star-interactive cursor-pointer transition-transform p-1"
        >
            <svg class="w-7 h-7 ${star <= selectedRating ? 'text-amber-400' : 'text-gray-200'} transition-colors" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        </button>
    `).join('');
}

function renderTags() {
    const container = document.getElementById('tags-container');
    if (!container) return;
    
    container.innerHTML = availableTags.map(tag => `
        <button
            type="button"
            onclick="window.reviewsModule.toggleTag('${tag}')"
            class="px-3 py-1.5 rounded-full border-2 text-sm transition-all ${
                selectedTags.includes(tag)
                    ? 'border-spicy text-spicy bg-orange-50'
                    : 'border-gray-200 text-gray-600 hover:border-spicy hover:text-spicy hover:bg-orange-50'
            }"
        >
            ${tag}
        </button>
    `).join('');
}

function renderPhotoUploads() {
    const container = document.getElementById('photo-upload-container');
    if (!container) return;
    
    const photosHTML = selectedPhotos.map((photo, index) => `
        <div class="relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden group">
            <img src="${photo}" alt="" class="w-full h-full object-cover">
            <button
                type="button"
                onclick="window.reviewsModule.removePhoto(${index})"
                class="absolute inset-0 bg-black/50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    `).join('');
    
    const uploadBtnHTML = selectedPhotos.length < MAX_PHOTOS ? `
        <button
            type="button"
            onclick="document.getElementById('photo-input').click()"
            class="w-14 h-14 sm:w-16 sm:h-16 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-spicy hover:text-spicy active:bg-orange-50 transition-colors"
        >
            <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span class="text-[10px] mt-0.5">Фото</span>
        </button>
    ` : '';
    
    container.innerHTML = `
        <input type="file" id="photo-input" accept="image/*" multiple class="hidden">
        ${photosHTML}
        ${uploadBtnHTML}
    `;
    
    // Re-attach event listener
    document.getElementById('photo-input')?.addEventListener('change', handlePhotoSelect);
}

// ============================================
// EVENT HANDLERS
// ============================================

function toggleVerifiedFilter() {
    filterVerified = !filterVerified;
    visibleReviews = 4;
    
    const btn = document.getElementById('filter-verified-btn');
    if (btn) {
        if (filterVerified) {
            btn.className = 'w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-full text-sm font-medium transition-all bg-emerald-100 text-emerald-700 border-2 border-emerald-300';
        } else {
            btn.className = 'w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-full text-sm font-medium transition-all bg-white text-gray-600 border-2 border-gray-200 hover:border-gray-300 active:bg-gray-50';
        }
    }
    
    renderReviews();
}

function showMoreReviews() {
    const filteredReviews = filterVerified ? reviews.filter(r => r.isVerified) : reviews;
    visibleReviews = Math.min(visibleReviews + 4, filteredReviews.length);
    renderReviews();
}

function openReviewModal() {
    const modal = document.getElementById('review-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
        renderModalStars();
        renderTags();
        
        // Attach photo input listener
        document.getElementById('photo-input')?.addEventListener('change', handlePhotoSelect);
    }
}

function closeReviewModal() {
    const modal = document.getElementById('review-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.style.overflow = '';
        
        // Reset form
        selectedRating = 0;
        selectedTags = [];
        selectedPhotos = [];
        selectedPhotoFiles = [];
        document.getElementById('review-form')?.reset();
        
        // Reset states - show form, hide success
        document.getElementById('review-form-state')?.classList.remove('hidden');
        const successState = document.getElementById('review-success-state');
        if (successState) {
            successState.classList.add('hidden');
            successState.classList.remove('flex');
        }
    }
}

function previewRating(rating) {
    if (rating === 0) rating = selectedRating;
    const stars = document.querySelectorAll('#modal-stars button svg');
    stars.forEach((star, index) => {
        star.classList.toggle('text-amber-400', index < rating);
        star.classList.toggle('text-gray-200', index >= rating);
    });
}

function setRating(rating) {
    selectedRating = rating;
    const ratingInput = document.getElementById('rating-input');
    if (ratingInput) ratingInput.value = rating;
    renderModalStars();
}

function toggleTag(tag) {
    if (selectedTags.includes(tag)) {
        selectedTags = selectedTags.filter(t => t !== tag);
    } else {
        selectedTags.push(tag);
    }
    renderTags();
}

function handlePhotoSelect(event) {
    const files = Array.from(event.target.files);
    const maxPhotos = MAX_PHOTOS - selectedPhotos.length;
    
    files.slice(0, maxPhotos).forEach(file => {
        if (file.size > MAX_FILE_SIZE) {
            console.warn(`File ${file.name} is too large`);
            return;
        }
        
        selectedPhotoFiles.push(file);
        
        const reader = new FileReader();
        reader.onload = (e) => {
            selectedPhotos.push(e.target.result);
            renderPhotoUploads();
        };
        reader.readAsDataURL(file);
    });
}

function removePhoto(index) {
    selectedPhotos.splice(index, 1);
    selectedPhotoFiles.splice(index, 1);
    renderPhotoUploads();
}

async function submitReview(event) {
    event.preventDefault();
    
    const submitBtn = document.getElementById('submit-review-btn');
    const originalText = submitBtn?.textContent;
    
    try {
        const name = document.getElementById('name-input')?.value?.trim();
        const phone = document.getElementById('phone-input')?.value?.trim();
        const text = document.getElementById('review-text-input')?.value?.trim();
        
        if (!name || !text || selectedRating === 0) {
            alert('Будь ласка, заповніть всі обов\'язкові поля та поставте оцінку');
            return;
        }
        
        // Disable button and show loading
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <svg class="w-5 h-5 animate-spin mx-auto" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            `;
        }
        
        // Upload photos if any
        let photoUrls = [];
        if (selectedPhotoFiles.length > 0) {
            photoUrls = await uploadPhotos(selectedPhotoFiles, currentProductId);
        }
        
        // Create review document
        const reviewData = {
            productId: currentProductId,
            userName: name,
            phone: phone || null,
            text: text,
            rating: selectedRating,
            tags: selectedTags,
            photos: photoUrls,
            isVerified: false,
            status: 'pending',
            createdAt: serverTimestamp()
        };
        
        // Save to Firestore
        await addDoc(collection(db, REVIEWS_COLLECTION), reviewData);
        
        console.log('✅ Review submitted successfully');
        
        // Show success state
        document.getElementById('review-form-state').classList.add('hidden');
        document.getElementById('review-success-state').classList.remove('hidden');
        document.getElementById('review-success-state').classList.add('flex');
        
    } catch (error) {
        console.error('❌ Error submitting review:', error);
        alert('Помилка при надсиланні відгуку. Спробуйте ще раз.');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText || 'Надіслати відгук';
        }
    }
}

// ============================================
// LIGHTBOX
// ============================================

function openLightbox(photos, index) {
    currentLightboxPhotos = photos;
    currentLightboxIndex = index;
    
    const lightbox = document.getElementById('photo-lightbox');
    if (lightbox) {
        lightbox.classList.remove('hidden');
        lightbox.classList.add('flex');
        document.body.style.overflow = 'hidden';
        
        updateLightbox();
        
        // Show/hide navigation
        const nav = photos.length > 1;
        const prevBtn = document.getElementById('lightbox-prev');
        const nextBtn = document.getElementById('lightbox-next');
        const swipeHint = document.getElementById('lightbox-swipe-hint');
        
        if (prevBtn) prevBtn.style.display = nav ? '' : 'none';
        if (nextBtn) nextBtn.style.display = nav ? '' : 'none';
        if (swipeHint) swipeHint.classList.toggle('hidden', !nav);
    }
}

function closeLightbox() {
    const lightbox = document.getElementById('photo-lightbox');
    if (lightbox) {
        lightbox.classList.add('hidden');
        lightbox.classList.remove('flex');
        document.body.style.overflow = '';
    }
}

function navigateLightbox(direction) {
    currentLightboxIndex = (currentLightboxIndex + direction + currentLightboxPhotos.length) % currentLightboxPhotos.length;
    updateLightbox();
}

function updateLightbox() {
    const img = document.getElementById('lightbox-image');
    if (img) img.src = currentLightboxPhotos[currentLightboxIndex];
    
    // Update dots
    const dotsContainer = document.getElementById('lightbox-dots');
    if (dotsContainer && currentLightboxPhotos.length > 1) {
        dotsContainer.innerHTML = currentLightboxPhotos.map((_, i) => `
            <button
                onclick="event.stopPropagation(); window.reviewsModule.setLightboxIndex(${i})"
                class="h-2 rounded-full transition-all ${i === currentLightboxIndex ? 'bg-white w-6' : 'bg-white/50 w-2'}"
            ></button>
        `).join('');
    } else if (dotsContainer) {
        dotsContainer.innerHTML = '';
    }
}

function setLightboxIndex(index) {
    currentLightboxIndex = index;
    updateLightbox();
}

// ============================================
// INITIALIZATION
// ============================================

async function initReviews() {
    currentProductId = getProductId();
    
    if (!currentProductId) {
        console.warn('⚠️ Reviews: No product ID found in URL');
        return;
    }
    
    console.log('🔍 Reviews: Initializing for product:', currentProductId);
    
    // Check if reviews are globally enabled
    const isEnabled = await checkReviewsVisibility();
    if (!isEnabled) {
        console.log('🚫 Reviews section is disabled globally. Skipping injection.');
        return;
    }
    
    const injected = injectReviewsSection();
    if (!injected) return;
    
    // Subscribe to reviews
    subscribeToReviews(currentProductId);
    
    // Setup keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeReviewModal();
            closeLightbox();
        }
        if (e.key === 'ArrowLeft') navigateLightbox(-1);
        if (e.key === 'ArrowRight') navigateLightbox(1);
    });
    
    // Setup touch support for lightbox
    setTimeout(() => {
        const lightboxImage = document.getElementById('lightbox-image');
        if (lightboxImage) {
            let touchStartX = 0;
            lightboxImage.addEventListener('touchstart', (e) => {
                touchStartX = e.touches[0].clientX;
            });
            lightboxImage.addEventListener('touchend', (e) => {
                const touchEndX = e.changedTouches[0].clientX;
                const diff = touchStartX - touchEndX;
                if (Math.abs(diff) > 50) {
                    navigateLightbox(diff > 0 ? 1 : -1);
                }
            });
        }
    }, 100);
    
    console.log('✅ Reviews module initialized');
}

// ============================================
// EXPORT PUBLIC API
// ============================================

window.reviewsModule = {
    openReviewModal,
    closeReviewModal,
    previewRating,
    setRating,
    toggleTag,
    removePhoto,
    submitReview,
    toggleVerifiedFilter,
    showMoreReviews,
    openLightbox,
    closeLightbox,
    navigateLightbox,
    setLightboxIndex
};

// ============================================
// AUTO-START
// ============================================

function waitForPage() {
    const mainContent = document.getElementById('main-content');
    
    if (mainContent && !mainContent.classList.contains('hidden')) {
        initReviews();
    } else {
        const observer = new MutationObserver((mutations, obs) => {
            const mainContent = document.getElementById('main-content');
            if (mainContent && !mainContent.classList.contains('hidden')) {
                obs.disconnect();
                setTimeout(initReviews, 100);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class']
        });
        
        setTimeout(() => {
            observer.disconnect();
            initReviews();
        }, 5000);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForPage);
} else {
    waitForPage();
}

export { initReviews };
