// ============================================
// LATIAO SNACK - Centralized Layout Manager
// Оптимізовано для швидкого завантаження
// USES WINDOW.FIREBASEINIT - NO IMPORTS
// ============================================

// HTML Template for Footer
const footerTemplate = `
  <footer id="contact" class="bg-gray-900 text-white py-12 lg:py-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Logo and Description Section -->
      <div class="mb-12">
        <div class="footer-logo mb-6 text-center">
          <a href="/index.html" class="inline-block">
            <span class="text-4xl lg:text-5xl font-black tracking-tight" style="background: linear-gradient(135deg, #FF4D4F 0%, #FFD54F 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; text-shadow: 0 2px 8px rgba(255, 77, 79, 0.3);">Latiao Snack</span>
          </a>
        </div>
        
        <p class="footer-description text-center max-w-xl mx-auto mt-5 mb-6 text-sm leading-relaxed text-white">
          Latiao Snack — український бренд, який першим зробив латяо популярним в Україні. Ми обираємо тільки перевірених виробників, маємо сертифікати якості й піклуємось про кожну посилку. Смак, якому довіряють тисячі клієнтів 🇺🇦
        </p>
      </div>
      
      <!-- 3 Column Navigation Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        
        <!-- Column 1: Catalog -->
        <div>
          <h4 class="font-semibold text-lg mb-4 text-white">Каталог</h4>
          <ul id="footer-catalog-links" class="space-y-3">
            <!-- Categories will be loaded dynamically -->
          </ul>
        </div>
        
        <!-- Column 2: Client Info -->
        <div>
          <h4 class="font-semibold text-lg mb-4 text-white">Інформація для клієнта</h4>
          <ul id="footer-client-info-links" class="space-y-3">
            <!-- Client info pages will be loaded dynamically -->
          </ul>
        </div>
        
        <!-- Column 3: Contacts -->
        <div>
          <h4 class="font-semibold text-lg mb-4 text-white">Контакти</h4>
          <ul class="space-y-3">
            <li class="flex items-start gap-2">
              <i data-lucide="phone" class="w-4 h-4 text-spicy flex-shrink-0 mt-1"></i>
              <a href="tel:+380965661827" class="text-gray-400 hover:text-red-500 transition-colors">+380 96 566 18 27</a>
            </li>
            <li class="flex items-start gap-2">
              <i data-lucide="mail" class="w-4 h-4 text-spicy flex-shrink-0 mt-1"></i>
              <a href="mailto:latiaosnack@gmail.com" class="text-gray-400 hover:text-red-500 transition-colors break-all">latiaosnack@gmail.com</a>
            </li>
            <li class="flex items-start gap-2">
              <i data-lucide="map-pin" class="w-4 h-4 text-spicy flex-shrink-0 mt-1"></i>
              <span class="text-gray-400">с. Тарасівка, Фастівський р-н, Київська обл., 08165</span>
            </li>
            <li class="flex items-center gap-4 mt-6 pt-4 border-t border-gray-800">
              <svg class="h-8 w-auto fill-current text-gray-400 hover:text-white transition-colors" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" title="Visa">
                <path d="M9.112 8.262L5.97 15.758H3.92L2.374 9.775c-.094-.368-.175-.503-.461-.658C1.447 8.864.677 8.627 0 8.479l.046-.217h3.3a.904.904 0 01.894.764l.817 4.338 2.018-5.102zm8.033 5.049c.008-1.979-2.736-2.088-2.717-2.972.006-.269.262-.555.822-.628a3.66 3.66 0 011.913.336l.34-1.59a5.207 5.207 0 00-1.814-.333c-1.917 0-3.266 1.02-3.278 2.479-.012 1.079.963 1.68 1.698 2.04.756.367 1.01.603 1.006.931-.005.504-.602.725-1.16.734-.975.015-1.54-.263-1.992-.473l-.351 1.642c.453.208 1.289.39 2.156.398 2.037 0 3.37-1.006 3.377-2.564m5.061 2.447H24l-1.565-7.496h-1.656a.883.883 0 00-.826.55l-2.909 6.946h2.036l.405-1.12h2.488zm-2.163-2.656l1.02-2.815.588 2.815zm-8.16-4.84l-1.603 7.496H8.34l1.605-7.496z"/>
              </svg>
              <svg class="h-8 w-auto fill-current text-gray-400 hover:text-white transition-colors" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" title="Mastercard">
                <path d="M11.343 18.031c.058.049.12.098.181.146-1.177.783-2.59 1.238-4.107 1.238C3.32 19.416 0 16.096 0 12c0-4.095 3.32-7.416 7.416-7.416 1.518 0 2.931.456 4.105 1.238-.06.051-.12.098-.165.15C9.6 7.489 8.595 9.688 8.595 12c0 2.311 1.001 4.51 2.748 6.031zm5.241-13.447c-1.52 0-2.931.456-4.105 1.238.06.051.12.098.165.15C14.4 7.489 15.405 9.688 15.405 12c0 2.31-1.001 4.507-2.748 6.031-.058.049-.12.098-.181.146 1.177.783 2.588 1.238 4.107 1.238C20.68 19.416 24 16.096 24 12c0-4.094-3.32-7.416-7.416-7.416zM12 6.174c-.096.075-.189.15-.28.231C10.156 7.764 9.169 9.765 9.169 12c0 2.236.987 4.236 2.551 5.595.09.08.185.158.28.232.096-.074.189-.152.28-.232 1.563-1.359 2.551-3.359 2.551-5.595 0-2.235-.987-4.236-2.551-5.595-.09-.08-.184-.156-.28-.231z"/>
              </svg>
              <svg class="h-8 w-auto fill-current text-gray-400 hover:text-white transition-colors" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" title="Apple Pay">
                <path d="M2.15 4.318a42.16 42.16 0 0 0-.454.003c-.15.005-.303.013-.452.04a1.44 1.44 0 0 0-1.06.772c-.07.138-.114.278-.14.43-.028.148-.037.3-.04.45A10.2 10.2 0 0 0 0 6.222v11.557c0 .07.002.138.003.207.004.15.013.303.04.452.027.15.072.291.142.429a1.436 1.436 0 0 0 .63.63c.138.07.278.115.43.142.148.027.3.036.45.04l.208.003h20.194l.207-.003c.15-.004.303-.013.452-.04.15-.027.291-.071.428-.141a1.432 1.432 0 0 0 .631-.631c.07-.138.115-.278.141-.43.027-.148.036-.3.04-.45.002-.07.003-.138.003-.208l.001-.246V6.221c0-.07-.002-.138-.004-.207a2.995 2.995 0 0 0-.04-.452 1.446 1.446 0 0 0-1.2-1.201 3.022 3.022 0 0 0-.452-.04 10.448 10.448 0 0 0-.453-.003zm0 .512h19.942c.066 0 .131.002.197.003.115.004.25.01.375.032.109.02.2.05.287.094a.927.927 0 0 1 .407.407.997.997 0 0 1 .094.288c.022.123.028.258.031.374.002.065.003.13.003.197v11.552c0 .065 0 .13-.003.196-.003.115-.009.25-.032.375a.927.927 0 0 1-.5.693 1.002 1.002 0 0 1-.286.094 2.598 2.598 0 0 1-.373.032l-.2.003H1.906c-.066 0-.133-.002-.196-.003a2.61 2.61 0 0 1-.375-.032c-.109-.02-.2-.05-.288-.094a.918.918 0 0 1-.406-.407 1.006 1.006 0 0 1-.094-.288 2.531 2.531 0 0 1-.032-.373 9.588 9.588 0 0 1-.002-.197V6.224c0-.065 0-.131.002-.197.004-.114.01-.248.032-.375.02-.108.05-.199.094-.287a.925.925 0 0 1 .407-.406 1.03 1.03 0 0 1 .287-.094c.125-.022.26-.029.375-.032.065-.002.131-.002.196-.003zm4.71 3.7c-.3.016-.668.199-.88.456-.191.22-.36.58-.316.918.338.03.675-.169.888-.418.205-.258.345-.603.308-.955zm2.207.42v5.493h.852v-1.877h1.18c1.078 0 1.835-.739 1.835-1.812 0-1.07-.742-1.805-1.808-1.805zm.852.719h.982c.739 0 1.161.396 1.161 1.089 0 .692-.422 1.092-1.164 1.092h-.979zm-3.154.3c-.45.01-.83.28-1.05.28-.235 0-.593-.264-.981-.257a1.446 1.446 0 0 0-1.23.747c-.527.908-.139 2.255.374 2.995.249.366.549.769.944.754.373-.014.52-.242.973-.242.454 0 .586.242.98.235.41-.007.667-.366.915-.733.286-.417.403-.82.41-.841-.007-.008-.79-.308-.797-1.209-.008-.754.615-1.113.644-1.135-.352-.52-.9-.578-1.09-.593a1.123 1.123 0 0 0-.092-.002zm8.204.397c-.99 0-1.606.533-1.652 1.256h.777c.072-.358.369-.586.845-.586.502 0 .803.266.803.711v.309l-1.097.064c-.951.054-1.488.484-1.488 1.184 0 .72.548 1.207 1.332 1.207.526 0 1.032-.281 1.264-.727h.019v.659h.788v-2.76c0-.803-.62-1.317-1.591-1.317zm1.94.072l1.446 4.009c0 .003-.073.24-.073.247-.125.41-.33.571-.711.571-.069 0-.206 0-.267-.015v.666c.06.011.267.019.335.019.83 0 1.226-.312 1.568-1.283l1.5-4.214h-.868l-1.012 3.259h-.015l-1.013-3.26zm-1.167 2.189v.316c0 .521-.45.917-1.024.917-.442 0-.731-.228-.731-.579 0-.342.278-.56.769-.593z"/>
              </svg>
              <svg class="h-8 w-auto fill-current text-gray-400 hover:text-white transition-colors" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" title="Google Pay">
                <path d="M3.963 7.235A3.963 3.963 0 00.422 9.419a3.963 3.963 0 000 3.559 3.963 3.963 0 003.541 2.184c1.07 0 1.97-.352 2.627-.957.748-.69 1.18-1.71 1.18-2.916a4.722 4.722 0 00-.07-.806H3.964v1.526h2.14a1.835 1.835 0 01-.79 1.205c-.356.241-.814.379-1.35.379-1.034 0-1.911-.697-2.225-1.636a2.375 2.375 0 010-1.517c.314-.94 1.191-1.636 2.225-1.636a2.152 2.152 0 011.52.594l1.132-1.13a3.808 3.808 0 00-2.652-1.033zm6.501.55v6.9h.886V11.89h1.465c.603 0 1.11-.196 1.522-.588a1.911 1.911 0 00.635-1.464 1.92 1.92 0 00-.635-1.456 2.125 2.125 0 00-1.522-.598zm2.427.85a1.156 1.156 0 01.823.365 1.176 1.176 0 010 1.686 1.171 1.171 0 01-.877.357H11.35V8.635h1.487a1.156 1.156 0 01.054 0zm4.124 1.175c-.842 0-1.477.308-1.907.925l.781.491c.288-.417.68-.626 1.175-.626a1.255 1.255 0 01.856.323 1.009 1.009 0 01.366.785v.202c-.34-.193-.774-.289-1.3-.289-.617 0-1.11.145-1.479.434-.37.288-.554.677-.554 1.165a1.476 1.476 0 00.525 1.156c.35.308.785.463 1.305.463.61 0 1.098-.27 1.465-.81h.038v.655h.848v-2.909c0-.61-.19-1.09-.568-1.44-.38-.35-.896-.525-1.551-.525zm2.263.154l1.946 4.422-1.098 2.38h.915L24 9.963h-.965l-1.368 3.391h-.02l-1.406-3.39zm-2.146 2.368c.494 0 .88.11 1.156.33 0 .372-.147.696-.44.973a1.413 1.413 0 01-.997.414 1.081 1.081 0 01-.69-.232.708.708 0 01-.293-.578c0-.257.12-.47.363-.647.24-.173.54-.26.9-.26Z"/>
              </svg>
            </li>
          </ul>
        </div>
        
      </div>
      <div class="border-t border-gray-800 pt-8 text-center text-gray-500">
        <p>
          © 2026 Latiao Snack. Всі права захищені.
        </p>
      </div>
    </div>
  </footer>
`;

// HTML Template for Header, Mobile Menu, Cart Sidebar, Toast Container
const headerTemplate = `
  <!-- Announcement Bar - Pepper Hunt Game -->
  <div id="announcement-bar" 
       class="fixed top-0 left-0 right-0 z-[55] bg-gradient-to-r from-red-600 via-orange-500 to-red-600 text-white 
              text-[11px] xs:text-xs sm:text-sm py-1.5 sm:py-2 pl-3 pr-8 sm:px-4 text-center
              transition-all duration-300 hover:from-red-500 hover:via-orange-400 hover:to-red-500
              flex items-center justify-center gap-0.5 xs:gap-1 sm:gap-2
              animate-[gradient-shift_3s_ease_infinite]"
       style="background-size: 200% 100%; display: none;">
    <style>
      @keyframes gradient-shift {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }
      @keyframes pepper-pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.2); }
      }
      .pepper-pulse { animation: pepper-pulse 1s ease-in-out infinite; }
    </style>
    <span class="whitespace-nowrap pepper-pulse">🔥</span>
    <span class="font-bold truncate sm:whitespace-normal" id="announcement-text">Квест: Знайди 8 перчиків — отримай Латяо безкоштовно та 2000 грн!</span>
    <span class="whitespace-nowrap pepper-pulse" style="animation-delay: 0.5s;">🌶️</span>
    <button onclick="window.openPepperGameModal()" 
       class="font-black px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full transition-all ml-0.5 sm:ml-2 whitespace-nowrap flex-shrink-0 uppercase text-xs border border-white/40 hover:scale-105 active:scale-95">
      ОТРИМАТИ
    </button>
    <button onclick="window.closeAnnouncementBar()" 
            class="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 p-1.5 sm:p-1 rounded-full 
                   hover:bg-white/20 active:bg-white/30 transition-colors duration-200"
            aria-label="Закрити">
      <svg class="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
    </button>
  </div>

  <!-- Pepper Hunt Game Modal -->
  <div id="pepper-game-modal" 
       class="fixed inset-0 z-[9999] hidden"
       onclick="event.target === this && window.closePepperGameModal()">
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
    <div class="relative min-h-screen flex items-center justify-center p-4">
      <div class="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
           onclick="event.stopPropagation()">
        
        <!-- Shimmer Animation Styles -->
        <style>
          @keyframes shimmer {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
          }
          .golden-shimmer {
            background: linear-gradient(
              90deg,
              rgba(255, 215, 0, 0.05) 0%,
              rgba(255, 215, 0, 0.15) 25%,
              rgba(255, 223, 0, 0.25) 50%,
              rgba(255, 215, 0, 0.15) 75%,
              rgba(255, 215, 0, 0.05) 100%
            );
            background-size: 200% 100%;
            animation: shimmer 3s ease-in-out infinite;
          }
          .golden-border {
            border: 2px solid rgba(255, 215, 0, 0.6);
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.3), inset 0 0 20px rgba(255, 215, 0, 0.1);
          }
        </style>
        
        <!-- Close Button -->
        <button onclick="window.closePepperGameModal()" 
                class="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 hover:bg-white shadow-lg hover:shadow-xl transition-all hover:rotate-90"
                aria-label="Закрити">
          <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
        
        <!-- Modal Content -->
        <div id="pepper-game-modal-content" class="overflow-hidden">
          <!-- Hero Image - Full Width, No Padding -->
          <div class="w-full h-64 sm:h-80 overflow-hidden">
            <img src="./images/peppers-promo-banner.jpg" 
                 alt="Pepper Hunt Game" 
                 class="w-full h-full object-cover"
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <!-- Fallback if image not found -->
            <div class="w-full h-full bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 hidden items-center justify-center">
              <div class="text-center text-white">
                <div class="text-6xl mb-4">🌶️🔥🌶️</div>
                <h2 class="text-4xl font-black">PEPPER HUNT</h2>
              </div>
            </div>
          </div>
          
          <!-- Content Section with Padding -->
          <div class="p-6 sm:p-8">
            <!-- Title -->
            <h1 class="text-2xl sm:text-3xl font-black text-center text-gray-900 mb-4">
              Збирай перчики по сайту – отримуй смачні подарунки! 🔥
            </h1>
            
            <!-- Instructions -->
            <div class="bg-gray-50 rounded-xl p-4 sm:p-6 mb-6">
              <p class="text-sm sm:text-base text-gray-700 leading-relaxed text-center">
                На нашому сайті розкидано <span class="font-bold text-orange-600">9 перчиків</span>. 
                Вони ховаються скрізь: на сторінках товарів 🖼️, при оформленні замовлення 📦, 
                в описах та найнеочікуваніших місцях! 👀
              </p>
            </div>
            
            <!-- Goal Section -->
            <div class="space-y-4 mb-6">
              <!-- Regular Goal -->
              <div class="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 rounded-xl p-4">
                <div class="flex items-start gap-3">
                  <span class="text-3xl flex-shrink-0">🎯</span>
                  <div>
                    <p class="text-base sm:text-lg font-bold text-gray-900">
                      Знайди 8 перчиків – отримай пачку Латяо БЕЗКОШТОВНО
                    </p>
                  </div>
                </div>
              </div>
              
              <!-- Golden Reward - Special -->
              <div class="golden-shimmer golden-border rounded-xl p-5 relative overflow-hidden">
                <div class="absolute top-0 right-0 text-6xl opacity-10">✨</div>
                <div class="absolute bottom-0 left-0 text-6xl opacity-10">💎</div>
                <div class="relative z-10">
                  <div class="flex items-start gap-3">
                    <span class="text-4xl flex-shrink-0 animate-pulse">🏆</span>
                    <div>
                      <p class="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 mb-1">
                        ЗОЛОТИЙ ДЖЕКПОТ!
                      </p>
                      <p class="text-base sm:text-lg font-bold text-gray-900">
                        Знайди ЗОЛОТИЙ 9-й перчик – отримай ЩЕ 3 ПАЧКИ ЛАТЯО і 2000 грн бонусів на покупки! 💸
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Registration Form -->
            <div class="bg-white border-2 border-gray-200 rounded-xl p-5 sm:p-6 mb-6">
              <h3 class="text-lg font-bold text-gray-900 mb-3 text-center">
                Залиште ваші контакти, щоб ми знали, куди відправити ваші призи після завершення квесту:
              </h3>
              
              <form id="pepper-game-registration-form" class="space-y-4">
                <!-- Phone Input -->
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">
                    Номер телефону <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                      </svg>
                    </div>
                    <input type="tel" 
                           id="player-phone" 
                           name="phone"
                           placeholder="+380 XX XXX XX XX" 
                           required
                           class="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all text-gray-900 placeholder-gray-400"
                           pattern="^\\+?[0-9]{10,15}$">
                  </div>
                </div>
                
                <!-- Telegram Input -->
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">
                    Telegram (нікнейм) <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <i data-lucide="message-circle" class="w-5 h-5 text-gray-400"></i>
                    </div>
                    <input type="text" 
                           id="player-telegram" 
                           name="telegram"
                           placeholder="@username" 
                           required
                           class="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all text-gray-900 placeholder-gray-400"
                           pattern="^@?[a-zA-Z0-9_]{5,32}$">
                  </div>
                </div>
                
                <!-- Error Message -->
                <div id="form-error-message" class="hidden bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                </div>
                
                <!-- Success Message -->
                <div id="form-success-message" class="hidden bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                  ✅ Реєстрацію завершено! Розпочинайте полювання!
                </div>
              </form>
            </div>
            
            <!-- CTA Button -->
            <button onclick="window.startPepperHuntGame()" 
                    type="button"
                    class="w-full bg-gradient-to-r from-red-600 via-orange-500 to-red-600 text-white font-black text-lg sm:text-xl py-4 rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 active:scale-95 transition-all uppercase tracking-wide">
              🎮 ПОЧАТИ ГРУ 🌶️
            </button>
            
            <!-- Footer Note -->
            <p class="text-xs text-gray-500 text-center mt-4">
              * Призи надаються після успішного завершення квесту та підтвердження контактів
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Toast Container -->
  <div id="toast-container" class="fixed top-8 sm:top-12 right-4 z-[60] flex flex-col gap-2"></div>

  <!-- Header -->
  <header id="main-header" class="fixed top-[24px] sm:top-[36px] left-0 right-0 bg-white/95 backdrop-blur-md z-50 border-b border-gray-100 dark:bg-gray-900/95 dark:border-gray-800">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center h-16 lg:h-20">
        
        <!-- Mobile: Hamburger Button (Left) - Always first element -->
        <div class="flex items-center lg:hidden mr-2">
          <button id="mobile-menu-btn" onclick="window.openSideMenu()" class="p-2 hover:bg-orange-50 rounded-full text-gray-700 hover:text-orange-500 transition-colors" aria-label="Open menu">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
        </div>
        
        <!-- Logo (Takes remaining space and centers itself, static on desktop) -->
        <a href="/index.html" class="flex items-center flex-1 justify-center lg:justify-start lg:flex-none">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 70" width="360" height="70" class="h-10 md:h-12 w-auto" preserveAspectRatio="xMinYMid meet">
            <defs>
              <linearGradient id="flameGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stop-color="#FF4D4F"/>
                <stop offset="50%" stop-color="#FF6B4F"/>
                <stop offset="100%" stop-color="#FFD54F"/>
              </linearGradient>
              <linearGradient id="shineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#FF4D4F" stop-opacity="1"/>
                <stop offset="45%" stop-color="#FF4D4F" stop-opacity="1"/>
                <stop offset="50%" stop-color="#FFD54F" stop-opacity="1"/>
                <stop offset="55%" stop-color="#FF4D4F" stop-opacity="1"/>
                <stop offset="100%" stop-color="#FF4D4F" stop-opacity="1"/>
                <animate attributeName="x1" values="-100%;100%" dur="2s" repeatCount="indefinite"/>
                <animate attributeName="x2" values="0%;200%" dur="2s" repeatCount="indefinite"/>
              </linearGradient>
            </defs>
            <g opacity="0">
              <animate attributeName="opacity" from="0" to="1" dur="0.6s" fill="freeze"/>
              <g transform="translate(20, 10)">
                <path d="M25 48C25 48 10 38 10 26C10 18 15 12 20 8C20 8 18 16 22 20C26 24 30 18 30 18C30 18 35 24 35 32C35 38 30 42 30 42C30 42 38 36 38 26C38 16 30 6 25 2C25 2 40 12 40 28C40 40 32 48 25 48Z" fill="url(#flameGradient)">
                  <animate attributeName="d" values="M25 48C25 48 10 38 10 26C10 18 15 12 20 8C20 8 18 16 22 20C26 24 30 18 30 18C30 18 35 24 35 32C35 38 30 42 30 42C30 42 38 36 38 26C38 16 30 6 25 2C25 2 40 12 40 28C40 40 32 48 25 48Z;M25 48C25 48 8 38 8 26C8 18 14 10 20 6C20 6 16 14 21 19C25 23 31 16 31 16C31 16 37 22 37 31C37 37 31 43 31 43C31 43 40 35 40 25C40 15 31 5 25 1C25 1 42 11 42 27C42 39 33 48 25 48Z;M25 48C25 48 10 38 10 26C10 18 15 12 20 8C20 8 18 16 22 20C26 24 30 18 30 18C30 18 35 24 35 32C35 38 30 42 30 42C30 42 38 36 38 26C38 16 30 6 25 2C25 2 40 12 40 28C40 40 32 48 25 48Z" dur="1.5s" repeatCount="indefinite"/>
                </path>
                <path d="M25 46C25 46 16 40 16 32C16 26 20 22 24 20C24 20 22 26 25 28C28 30 30 26 30 26C30 26 34 30 34 36C34 42 28 46 25 46Z" fill="#FFD54F" opacity="0.9">
                  <animate attributeName="opacity" values="0.9;0.7;0.9" dur="1s" repeatCount="indefinite"/>
                </path>
              </g>
              <text x="70" y="46" font-family="Poppins, Inter, Manrope, Arial, sans-serif" font-size="36" font-weight="700" fill="url(#shineGradient)">Latiao</text>
              <text x="198" y="46" font-family="Poppins, Inter, Manrope, Arial, sans-serif" font-size="36" font-weight="700" fill="#333333" class="logo-snack-text">Snack</text>
              <circle cx="320" cy="20" r="4" fill="#FF4D4F">
                <animate attributeName="opacity" values="1;0.5;1" dur="1.2s" repeatCount="indefinite"/>
              </circle>
              <circle cx="332" cy="28" r="3" fill="#FFD54F">
                <animate attributeName="opacity" values="0.7;1;0.7" dur="1s" repeatCount="indefinite" begin="0.3s"/>
              </circle>
              <circle cx="340" cy="18" r="2.5" fill="#FF4D4F">
                <animate attributeName="opacity" values="0.8;0.4;0.8" dur="1.4s" repeatCount="indefinite" begin="0.6s"/>
              </circle>
            </g>
          </svg>
        </a>
        
        <!-- Desktop Navigation (Hidden on mobile) -->
        <nav class="hidden lg:flex items-center gap-8">
          <div class="relative group">
            <button class="text-gray-600 hover:text-spicy transition-colors font-medium flex items-center gap-1">
              Каталог
              <svg class="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
            <div id="desktop-catalog-menu" class="absolute top-full left-0 w-56 bg-white shadow-xl rounded-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-50 border border-gray-100">
              <div class="px-4 py-3 text-gray-500 text-sm">Завантаження...</div>
            </div>
          </div>
          <div id="desktop-pages-menu" class="flex items-center gap-8">
            <!-- Pages будуть завантажені динамічно -->
          </div>
        </nav>
        
        <!-- Spacer for desktop to push action buttons right -->
        <div class="hidden lg:flex flex-1"></div>
        
        <!-- Action Buttons (Right side) -->
        <div class="flex items-center gap-1 sm:gap-2 ml-2">
          <!-- Favorites Button: Hidden on mobile, visible on desktop (lg+) -->
          <a href="/favorites.html" id="favorites-btn" class="hidden lg:flex relative p-2 hover:bg-orange-50 rounded-full text-gray-700 hover:text-orange-500 transition-colors cursor-pointer" aria-label="Favorites">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
            <span id="favorites-badge" class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center hidden">0</span>
          </a>
          <!-- Account Icon: Hidden on mobile, visible on desktop (lg+) -->
          <a href="./login.html" id="user-profile-btn" class="hidden lg:flex relative p-2 hover:bg-orange-50 rounded-full text-gray-700 hover:text-orange-500 transition-colors cursor-pointer" aria-label="User profile">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </a>
          <!-- Cart Button: Always visible -->
          <button onclick="window.openCart()" class="relative p-2 hover:bg-orange-50 rounded-full text-gray-700 hover:text-orange-500 transition-colors" aria-label="Open cart">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            <span id="cart-badge" class="absolute -top-1 -right-1 w-5 h-5 bg-spicy text-white text-xs font-bold rounded-full flex items-center justify-center hidden">0</span>
          </button>
        </div>
      </div>
    </div>
  </header>

  <!-- Mobile Menu Overlay -->
  <div id="menu-overlay" onclick="window.closeSideMenu()" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] lg:hidden hidden transition-opacity duration-300"></div>

  <!-- Mobile Side Navigation Drawer (Left) -->
  <div id="mobile-menu" class="fixed top-0 left-0 bottom-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-[9999] lg:hidden -translate-x-full transition-transform duration-300 ease-in-out flex flex-col">
    
    <!-- Header Section -->
    <div class="flex items-center justify-between p-5 border-b border-gray-100">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-spicy to-fire flex items-center justify-center">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </div>
        <div>
          <h2 class="text-lg font-bold text-gray-900">Меню</h2>
          <p class="text-xs text-gray-500">Latiao Snack</p>
        </div>
      </div>
      <button onclick="window.closeSideMenu()" class="p-2 hover:bg-gray-100 rounded-full transition-colors" aria-label="Close menu">
        <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <!-- Scrollable Content -->
    <div class="flex-1 overflow-y-auto">
      <nav class="p-4 space-y-6">
        
        <!-- Account Section -->
        <div>
          <a href="login.html" onclick="window.closeSideMenu()" class="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-spicy to-fire text-white rounded-xl hover:shadow-lg transition-shadow">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5 mr-3">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span class="font-semibold">Особистий кабінет</span>
          </a>
        </div>

        <!-- Favorites Section -->
        <div class="pt-4 border-t border-gray-100">
          <a href="/favorites.html" onclick="window.closeSideMenu()" id="mobile-favorites-link" class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-orange-50 transition-colors group relative">
            <svg class="w-6 h-6 text-red-500" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
            <div class="flex-1">
              <p class="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">Мої улюблені</p>
              <p class="text-xs text-gray-500">Обрані товари</p>
            </div>
            <span id="mobile-favorites-badge" class="hidden w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">0</span>
          </a>
        </div>

        <!-- Categories Section -->
        <div>
          <h3 class="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Каталог</h3>
          <ul id="mobile-catalog-container" class="space-y-1">
            <li class="text-gray-400 text-sm px-4">Завантаження...</li>
          </ul>
        </div>

        <!-- Info Pages Section -->
        <div class="pt-4 border-t border-gray-100">
          <h3 class="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Інформація</h3>
          <ul id="mobile-pages-container" class="space-y-1">
            <li class="text-gray-400 text-sm px-4">Завантаження...</li>
          </ul>
        </div>

        <!-- Social Links Section -->
        <div class="pt-4 border-t border-gray-100">
          <h3 class="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Ми в соцмережах</h3>
          <div class="space-y-2 px-4">
            <!-- Instagram -->
            <a href="https://instagram.com/latiao_snack" target="_blank" onclick="window.closeSideMenu()" class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors group">
              <div class="w-10 h-10 rounded-full flex items-center justify-center" style="background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);">
                <svg class="w-5 h-5 fill-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </div>
              <div class="flex-1">
                <p class="font-semibold text-gray-900 group-hover:text-spicy transition-colors">Instagram</p>
                <p class="text-xs text-gray-500">@latiao_snack</p>
              </div>
            </a>

            <!-- Telegram -->
            <a href="https://t.me/sales_latiao" target="_blank" onclick="window.closeSideMenu()" class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors group">
              <div class="w-10 h-10 rounded-full bg-[#229ED9] flex items-center justify-center">
                <svg class="w-5 h-5 fill-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 11.944 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </div>
              <div class="flex-1">
                <p class="font-semibold text-gray-900 group-hover:text-spicy transition-colors">Telegram</p>
                <p class="text-xs text-gray-500">Написати нам</p>
              </div>
            </a>
          </div>
        </div>

      </nav>
    </div>

    <!-- Footer Section -->
    <div class="p-4 border-t border-gray-100 bg-gray-50">
      <div class="flex items-center justify-between text-xs text-gray-500">
        <span>© 2026 Latiao Snack</span>
        <a href="tel:+380965661827" class="flex items-center gap-1 hover:text-spicy transition-colors">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
          </svg>
          <span>+380 96 566 18 27</span>
        </a>
      </div>
    </div>
  </div>

  <style>
    /* Mobile Menu Link Styles */
    .mobile-menu-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      font-size: 0.9375rem;
      font-weight: 600;
      color: #374151;
      background: white;
      border-radius: 0.75rem;
      transition: all 0.2s ease;
    }
    
    .mobile-menu-link:hover {
      background: #FFF7ED;
      color: #ff6b00;
      transform: translateX(4px);
    }
    
    .mobile-menu-link svg,
    .mobile-menu-link img {
      width: 1.5rem;
      height: 1.5rem;
      flex-shrink: 0;
    }
    
    .mobile-menu-link img {
      object-fit: contain;
    }
    
    /* Staggered Cart Item Animation */
    @keyframes cartItemFadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .cart-item-enter {
      animation: cartItemFadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      opacity: 0;
    }
    
    /* Price Update Animation */
    @keyframes priceUpdate {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
    
    .price-update {
      animation: priceUpdate 0.3s ease-out;
    }
    
    /* Empty State Fade */
    #empty-state {
      transition: opacity 0.3s ease-in-out;
    }
    
    #cart-items {
      transition: opacity 0.3s ease-in-out;
    }
    
    /* Special Offer Scrollbar */
    .scrollbar-thin {
      scrollbar-width: thin;
    }
    
    .scrollbar-thin::-webkit-scrollbar {
      height: 6px;
    }
    
    .scrollbar-thin::-webkit-scrollbar-track {
      background: #fff3e8;
      border-radius: 3px;
    }
    
    .scrollbar-thin::-webkit-scrollbar-thumb {
      background: #fb923c;
      border-radius: 3px;
    }
    
    .scrollbar-thin::-webkit-scrollbar-thumb:hover {
      background: #f97316;
    }
  </style>

  <!-- Cart Overlay -->
  <div id="cart-overlay" onclick="window.closeCart()" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80] pointer-events-none hidden opacity-0 transition-all duration-300"></div>

  <!-- Cart Sidebar -->
  <div id="cart-sidebar" class="fixed top-0 right-0 h-full w-full md:w-[500px] bg-white shadow-2xl z-[85] pointer-events-none transform translate-x-full transition-all duration-500 flex flex-col" style="transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);">
    <header class="sticky top-0 bg-white z-40 px-5 py-4 border-b border-gray-100">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900">Кошик</h1>
          <p class="text-xs text-gray-500 mt-0.5">Перевір замовлення перед оформленням</p>
        </div>
        <button onclick="window.closeCart()" class="text-gray-400 hover:text-gray-600 transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </header>
    <main class="flex-1 overflow-y-auto pb-48">
      <div class="px-5 pt-4 space-y-3">
        <div id="min-order-notice" class="bg-red-50 border border-red-100 rounded-xl px-3 py-2 flex items-center gap-2 hidden">
          <span class="text-base">⚠️</span>
          <p class="text-xs font-medium text-red-700">Мінімальна сума замовлення — 100 грн</p>
        </div>
        <div class="bg-green-50 border border-green-100 rounded-xl px-3 py-2 flex items-center gap-2">
          <span class="text-base">🚚</span>
          <p class="text-xs font-medium text-green-700">Безкоштовна доставка від 1 100 грн</p>
        </div>
        <div id="delivery-progress" class="bg-orange-50 border border-orange-100 rounded-xl p-3 hidden">
          <div class="flex items-center justify-between mb-1.5">
            <p id="delivery-text" class="text-xs font-semibold text-gray-700"></p>
            <span id="delivery-amount" class="text-xs font-bold text-spicy"></span>
          </div>
          <div class="h-1.5 bg-orange-100 rounded-full overflow-hidden">
            <div id="delivery-bar" class="progress-bar-fill h-full bg-gradient-to-r from-spicy to-yellow-500 rounded-full transition-all duration-500 ease-out" style="width: 0%"></div>
          </div>
        </div>
      </div>
      <div id="cart-items" class="px-5 pt-4 pb-4 space-y-3 hidden"></div>
      <div id="empty-state" class="px-5 py-16 text-center opacity-0">
        <div class="w-24 h-24 mx-auto mb-6 bg-orange-50 rounded-full flex items-center justify-center transition-transform duration-300 hover:scale-110">
          <span class="text-5xl">🛍️</span>
        </div>
        <h2 class="text-xl font-bold text-gray-900 mb-2">Ваш кошик порожній</h2>
        <p class="text-gray-500 mb-6">Додайте смачні снеки до кошика</p>
        <button onclick="window.closeCart(); window.location.href='index.html#shop'" class="btn-press inline-flex items-center gap-2 bg-gradient-to-r from-spicy to-orange-500 text-white font-semibold px-6 py-3 rounded-2xl shadow-lg shadow-orange-200 active:scale-95 transition-transform">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          Повернутися до покупок
        </button>
      </div>
    </main>
    <footer id="cart-summary" class="sticky bottom-0 bg-white border-t border-gray-100 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.1)] z-40 hidden">
      <div class="px-5 py-4">
        <div class="space-y-2 mb-3">
          <div class="flex justify-between text-sm">
            <span class="text-gray-600"><span id="items-count">0</span> товарів</span>
            <span id="subtotal" class="font-extrabold text-orange-600 transition-all duration-300">0 грн</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Доставка</span>
            <span id="delivery-cost" class="font-semibold text-gray-600 transition-all duration-300">Від 70 грн</span>
          </div>
        </div>
        
        <!-- Yellow Cashback Badge -->
        <div id="cart-cashback-badge" class="bg-amber-50 border border-amber-100 rounded-xl py-1.5 px-3 mb-2 hidden">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-1.5">
              <svg class="w-4 h-4 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/>
              </svg>
              <span class="text-xs font-medium text-amber-900">Ваш кешбек за це замовлення:</span>
            </div>
            <span id="cart-cashback-value" class="text-xs font-bold text-amber-600">+0 грн</span>
          </div>
        </div>
        
        <!-- Integrated Total Button -->
        <button id="checkout-btn" onclick="window.checkout()" disabled class="btn-press w-full rounded-xl font-bold text-sm transition-all duration-300 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg hover:from-orange-600 hover:to-orange-700 hover:shadow-xl active:scale-98 py-3.5">
          <span class="flex justify-between w-full px-4">
            <span>Оформити замовлення</span>
            <span id="checkout-total" class="transition-all duration-300">0 грн</span>
          </span>
        </button>
      </div>
    </footer>
  </div>

`;

// ============================================
// STOCK VERIFICATION SYSTEM
// Fetches real-time stock from Firestore
// ============================================

/**
 * Get actual stock from Firestore products collection
 * @param {string} productId - The product ID
 * @returns {Promise<number|null>} - Available stock or null if error
 */
async function getProductStockFromFirestore(productId) {
  try {
    // Wait for Firebase to be ready
    let attempts = 0;
    while (!window.firebaseInit && attempts < 20) {
      await new Promise(r => setTimeout(r, 100));
      attempts++;
    }

    if (!window.firebaseInit) {
      console.warn('🔍 Stock check: Firebase not ready');
      return null;
    }

    const { db, doc, getDoc } = window.firebaseInit;
    if (!db || !doc || !getDoc) {
      console.warn('🔍 Stock check: Missing Firestore functions');
      return null;
    }

    const productRef = doc(db, 'products', productId);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
      console.warn(`🔍 Stock check: Product ${productId} not found`);
      return null;
    }

    const productData = productSnap.data();
    const stock = productData.available_stock ?? productData.stock ?? null;
    
    console.log(`✅ Stock check for ${productId}: ${stock}`);
    return stock;

  } catch (error) {
    console.error('❌ Stock check failed:', error);
    return null;
  }
}

/**
 * Validate and adjust cart quantities on page load
 * Auto-fixes quantities that exceed current stock
 */
async function validateCartStockOnLoad() {
  if (window.cart.length === 0) return;

  console.log('🔍 Validating cart stock...');
  let adjustmentsMade = false;
  
  for (const item of window.cart) {
    // Skip gifts
    if (item.isGift === true) continue;
    
    // Skip items without ID
    if (!item.id) continue;
    
    const currentQty = item.quantity || item.qty || 1;
    const actualStock = await getProductStockFromFirestore(item.id);
    
    if (actualStock === null) continue;
    
    // Update local stock cache
    item.stock = actualStock;
    
    // Auto-adjust if quantity exceeds stock
    if (currentQty > actualStock) {
      if ('quantity' in item) {
        item.quantity = actualStock;
      } else {
        item.qty = actualStock;
      }
      adjustmentsMade = true;
      console.log(`⚠️ Adjusted ${item.name}: ${currentQty} → ${actualStock}`);
    }
  }
  
  if (adjustmentsMade) {
    saveCart();
    renderCart();
    window.showToast('Кількість деяких товарів змінено згідно наявності', 'warning');
  } else {
    console.log('✅ Cart stock validation complete - no adjustments needed');
  }
}

// ============================================
// GLOBAL CART STATE & FUNCTIONS
// ============================================

// Initialize cart from localStorage
window.cart = JSON.parse(localStorage.getItem('latiao_cart') || '[]');

// Save cart to localStorage
function saveCart() {
  localStorage.setItem('latiao_cart', JSON.stringify(window.cart));
  updateBadges();
}

// ============================================
// AUTO-INJECT GIFTS INTO CART
// ============================================
async function fetchAndInjectGifts() {
  try {
    // Wait for Firebase to be available
    let attempts = 0;
    while (!window.firebaseInit && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (!window.firebaseInit) {
      console.warn('⚠️ Firebase not available for gifts - skipping');
      return;
    }

    const { db, doc, getDoc, collection, getDocs, query, where } = window.firebaseInit;

    // Завантаження активних подарунків з Firestore
    const giftsDocRef = doc(db, 'settings', 'global_gifts');
    const giftsDoc = await getDoc(giftsDocRef);

    // Get active gift IDs (empty array if no document or no gifts)
    const activeGiftIds = giftsDoc.exists() ? (giftsDoc.data().activeGiftIds || []) : [];
    
    // ВАЖЛИВО: Видалити подарунки з кошика, які більше не активні
    const staleGifts = window.cart.filter(item => 
      item.isGift === true && !activeGiftIds.includes(item.id)
    );
    
    if (staleGifts.length > 0) {
      console.log(`🗑️ Видаляємо ${staleGifts.length} неактивних подарунків з кошика`);
      window.cart = window.cart.filter(item => 
        !(item.isGift === true && !activeGiftIds.includes(item.id))
      );
      saveCart();
      renderCart();
    }

    if (activeGiftIds.length === 0) {
      console.log('ℹ️ Список подарунків порожній');
      return;
    }

    // Завантаження продуктів для подарунків
    const productsRef = collection(db, 'products');
    const productsQuery = query(productsRef, where('__name__', 'in', activeGiftIds));
    const productsSnapshot = await getDocs(productsQuery);

    let giftsAdded = 0;

    productsSnapshot.forEach((docSnap) => {
      const product = { id: docSnap.id, ...docSnap.data() };

      // Перевірка: чи вже є цей подарунок у кошику?
      const existingGift = window.cart.find(item => item.id === product.id && item.isGift === true);

      if (!existingGift) {
        // Додаємо подарунок в кошик
        window.cart.push({
          id: product.id,
          sku: product.sku, // Add SKU for KeyCRM sync
          name: product.name,
          price: 0, // Подарунок безкоштовний!
          image: product.imageUrl || product.image,
          stock: product.stock || 999,
          spiciness: product.spiciness || 0,
          quantity: 1,
          isGift: true // Спеціальна ознака подарунка
        });
        giftsAdded++;
      }
    });

    if (giftsAdded > 0) {
      saveCart();
      renderCart();
      console.log(`🎁 Додано ${giftsAdded} подарунків у кошик`);
    } else {
      console.log('✅ Всі подарунки вже в кошику');
    }

  } catch (error) {
    console.error('❌ Помилка завантаження подарунків:', error);
  }
}

// Calculate total price
function calculateTotal() {
  return window.cart.reduce((sum, item) => sum + (item.price * (item.quantity || item.qty || 1)), 0);
}

// Calculate total items count
function calculateItemsCount() {
  return window.cart.reduce((sum, item) => sum + (item.quantity || item.qty || 1), 0);
}

// Render spiciness level
function renderSpiciness(level) {
  return '🌶️'.repeat(level || 0);
}

// Show toast notification
window.showToast = function (message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast-enter px-4 py-3 rounded-2xl shadow-lg flex items-center gap-2 ${type === 'success' ? 'bg-gray-900 text-white' : 'bg-orange-500 text-white'
    }`;

  const icon = type === 'success' ? '✓' : '⚠️';
  toast.innerHTML = `<span>${icon}</span><span class="text-sm font-medium">${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove('toast-enter');
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
};

// Update cart badge
function updateBadges() {
  const badge = document.getElementById('cart-badge');
  const itemsCount = calculateItemsCount();

  if (badge) {
    badge.textContent = itemsCount;
    if (itemsCount > 0) {
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }
}

// Update favorites badge
function updateFavoritesBadge() {
  try {
    const favorites = localStorage.getItem('latiao_favorites');
    const count = favorites ? JSON.parse(favorites).length : 0;
    
    const desktopBadge = document.getElementById('favorites-badge');
    const mobileBadge = document.getElementById('mobile-favorites-badge');
    
    [desktopBadge, mobileBadge].forEach(badge => {
      if (badge) {
        badge.textContent = count;
        if (count > 0) {
          badge.classList.remove('hidden');
        } else {
          badge.classList.add('hidden');
        }
      }
    });
  } catch (error) {
    console.error('Error updating favorites badge:', error);
  }
}

// Expose globally for favorites.js
window.updateFavoritesCounter = updateFavoritesBadge;

// Highlight active page in mobile menu
function highlightActivePage() {
  try {
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop() || 'index.html';
    
    // Highlight favorites link if on favorites page
    const favoritesLink = document.getElementById('mobile-favorites-link');
    if (favoritesLink && (currentPage === 'favorites.html' || currentPath.includes('/favorites.html'))) {
      favoritesLink.classList.add('bg-orange-50');
      favoritesLink.classList.add('border-2');
      favoritesLink.classList.add('border-orange-200');
      const textElement = favoritesLink.querySelector('p.font-semibold');
      if (textElement) {
        textElement.classList.add('text-orange-600');
        textElement.classList.remove('text-gray-900');
      }
    }
    
    // Add active state for other menu items
    document.querySelectorAll('.mobile-menu-link').forEach(link => {
      const href = link.getAttribute('href');
      if (href && (href === currentPage || href === `/${currentPage}` || currentPath.includes(href))) {
        link.classList.add('bg-orange-50');
        link.classList.add('border-2');
        link.classList.add('border-orange-200');
      }
    });
  } catch (error) {
    console.warn('⚠️ Error highlighting active page:', error);
  }
}

// Render cart UI
function renderCart() {
  const container = document.getElementById('cart-items');
  const emptyState = document.getElementById('empty-state');
  const cartSummary = document.getElementById('cart-summary');
  const deliveryProgress = document.getElementById('delivery-progress');
  
  if (!container) return;

  if (window.cart.length === 0) {
    container.innerHTML = '';
    // Smooth cross-fade to empty state (skip animation if cart-items was already hidden)
    const isInitialEmpty = container.classList.contains('hidden');
    
    if (isInitialEmpty) {
      // First load with empty cart - show immediately
      container.classList.add('hidden');
      cartSummary?.classList.add('hidden');
      deliveryProgress?.classList.add('hidden');
      emptyState?.classList.remove('hidden');
      emptyState?.classList.add('opacity-100');
    } else {
      // Transition from full cart to empty
      if (container) container.classList.add('opacity-0');
      setTimeout(() => {
        container.classList.add('hidden');
        cartSummary?.classList.add('hidden');
        deliveryProgress?.classList.add('hidden');
        emptyState?.classList.remove('hidden');
        setTimeout(() => emptyState?.classList.add('opacity-100'), 50);
      }, 300);
    }
    return;
  }

  // Smooth cross-fade from empty state to cart items
  if (emptyState && !emptyState.classList.contains('hidden')) {
    emptyState.classList.remove('opacity-100');
    emptyState.classList.add('opacity-0');
    setTimeout(() => {
      emptyState.classList.add('hidden');
      container.classList.remove('hidden', 'opacity-0');
      cartSummary?.classList.remove('hidden');
      deliveryProgress?.classList.remove('hidden');
      setTimeout(() => container.classList.add('opacity-100'), 50);
    }, 300);
  } else {
    container.classList.remove('hidden', 'opacity-0');
    container.classList.add('opacity-100');
    cartSummary?.classList.remove('hidden');
    deliveryProgress?.classList.remove('hidden');
  }

  container.innerHTML = window.cart.map((item, cartIndex) => {
    const qty = item.quantity || item.qty || 1;
    const imageUrl = item.image || item.imageUrl || 'https://placehold.co/100x100/fff3e8/ff6b00?text=Latiao';
    const isGift = item.isGift === true;
    const stock = item.stock || 999;
    const isAtLimit = qty >= stock;
    const isLowStock = stock <= 5 && stock > 0;

    return `
      <div class="cart-item-enter bg-white border-b border-gray-100 p-2 last:border-b-0 hover:bg-gray-50 transition-all duration-200" data-cart-index="${cartIndex}" style="animation-delay: ${cartIndex * 50}ms;">
        <div class="flex gap-4">
          <div class="w-16 h-16 flex-shrink-0 bg-orange-50 rounded-lg overflow-hidden ${isGift ? 'ring-2 ring-green-400' : ''} transition-transform duration-200 hover:scale-105">
            <img src="${imageUrl}" alt="${item.name}" class="w-full h-full object-cover">
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2 mb-2">
              <h3 class="text-sm font-semibold text-gray-900 line-clamp-2">${item.name}</h3>
              <p class="item-price w-20 text-right text-sm font-extrabold flex-shrink-0 transition-all duration-300 ${isGift ? 'text-green-600' : 'text-orange-600'}">${isGift ? 'Безкоштовно' : (item.price * qty) + ' ₴'}</p>
            </div>
            ${isGift ? '<p class="text-[10px] text-green-600 font-semibold mb-1">🎁 Подарунок від Latiao Snack</p>' : `<p class="text-[10px] text-gray-500 mb-1">${renderSpiciness(item.spiciness)}</p>`}
            <div class="flex items-center justify-between">
              ${!isGift ? `
              <div class="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                <button onclick="window.updateQtyByIndex(${cartIndex}, -1)" class="qty-btn w-7 h-7 rounded-md bg-white flex items-center justify-center text-xs font-bold text-gray-600 hover:bg-gray-50 active:scale-90 transition-all duration-150">−</button>
                <span class="qty-display w-7 text-center text-xs font-bold text-gray-900 transition-all duration-300">${qty}</span>
                <button onclick="window.updateQtyByIndex(${cartIndex}, 1)" ${isAtLimit ? 'disabled' : ''} class="qty-btn w-7 h-7 rounded-md bg-white flex items-center justify-center text-xs font-bold text-gray-600 hover:bg-gray-50 active:scale-90 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed">+</button>
              </div>
              ` : '<div></div>'}
              <button onclick="window.removeItemByIndex(${cartIndex})" class="btn-press text-gray-400 hover:text-red-500 active:scale-90 transition-all duration-150">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  updateCartUI();
}

// Update cart UI (totals, delivery progress, etc.)
function updateCartUI() {
  const total = calculateTotal();
  const itemsCount = calculateItemsCount();

  // Update summary
  const itemsCountEl = document.getElementById('items-count');
  const subtotalEl = document.getElementById('subtotal');
  const totalEl = document.getElementById('total');

  if (itemsCountEl) itemsCountEl.textContent = itemsCount;
  if (subtotalEl) subtotalEl.textContent = `${total} грн`;
  if (totalEl) totalEl.textContent = `${total} грн`;

  // Update delivery cost
  const deliveryCost = document.getElementById('delivery-cost');
  if (deliveryCost) {
    if (total >= 1100) {
      deliveryCost.textContent = 'Безкоштовно';
      deliveryCost.classList.add('text-green-600');
      deliveryCost.classList.remove('text-gray-700');
    } else {
      deliveryCost.textContent = 'Від 70 грн';
      deliveryCost.classList.remove('text-green-600');
      deliveryCost.classList.add('text-gray-700');
    }
  }

  // Update minimum order notice
  const minNotice = document.getElementById('min-order-notice');
  if (minNotice) {
    if (total >= 100 || window.cart.length === 0) {
      minNotice.classList.add('hidden');
    } else {
      minNotice.classList.remove('hidden');
    }
  }

  // Update delivery progress
  const progressPercent = Math.min((total / 1100) * 100, 100);
  const deliveryBar = document.getElementById('delivery-bar');
  if (deliveryBar) deliveryBar.style.width = `${progressPercent}%`;

  const deliveryText = document.getElementById('delivery-text');
  const deliveryAmount = document.getElementById('delivery-amount');

  if (deliveryText && deliveryAmount) {
    if (total >= 1100) {
      deliveryText.textContent = '🎉 У вас безкоштовна доставка!';
      deliveryAmount.textContent = '';
    } else {
      const remaining = 1100 - total;
      deliveryText.textContent = 'До безкоштовної доставки';
      deliveryAmount.textContent = `${remaining} грн`;
    }
  }

  // Update yellow cashback badge
  const cashbackBadge = document.getElementById('cart-cashback-badge');
  const cashbackValue = document.getElementById('cart-cashback-value');
  
  if (cashbackBadge && cashbackValue) {
    // Check if cashback is enabled and cart has items
    const cashbackEnabled = window.cashbackEnabled !== false; // Default true if not set
    const hasItems = window.cart.length > 0;
    
    if (cashbackEnabled && hasItems && total > 0) {
      // Calculate cashback
      const cashbackPercent = window.cashbackPercent || 8; // Default 8%
      let cashback = Math.floor(total * (cashbackPercent / 100));
      
      // Apply max earn limit if set
      if (window.cashbackMaxEarnLimit && cashback > window.cashbackMaxEarnLimit) {
        cashback = window.cashbackMaxEarnLimit;
      }
      
      // Update display
      cashbackValue.textContent = `+${cashback} грн`;
      cashbackBadge.classList.remove('hidden');
    } else {
      // Hide if disabled or cart empty
      cashbackBadge.classList.add('hidden');
    }
  }

  // Update checkout button with integrated total
  const checkoutBtn = document.getElementById('checkout-btn');
  const checkoutTotal = document.getElementById('checkout-total');
  
  if (checkoutBtn) {
    if (window.cart.length === 0 || total < 100) {
      checkoutBtn.disabled = true;
    } else {
      checkoutBtn.disabled = false;
    }
  }
  
  if (checkoutTotal) {
    checkoutTotal.textContent = `${total} грн`;
  }
}

// Animate price changes for smooth visual feedback
function animatePriceChanges() {
  // Animate all item prices
  const itemPrices = document.querySelectorAll('.item-price');
  itemPrices.forEach(price => {
    price.classList.remove('price-update');
    void price.offsetWidth; // Trigger reflow
    price.classList.add('price-update');
  });
  
  // Animate subtotal
  const subtotal = document.getElementById('subtotal');
  if (subtotal) {
    subtotal.classList.remove('price-update');
    void subtotal.offsetWidth;
    subtotal.classList.add('price-update');
  }
  
  // Animate checkout total
  const checkoutTotal = document.getElementById('checkout-total');
  if (checkoutTotal) {
    checkoutTotal.classList.remove('price-update');
    void checkoutTotal.offsetWidth;
    checkoutTotal.classList.add('price-update');
  }
  
  // Animate quantity displays
  const qtyDisplays = document.querySelectorAll('.qty-display');
  qtyDisplays.forEach(qty => {
    qty.classList.remove('price-update');
    void qty.offsetWidth;
    qty.classList.add('price-update');
  });
}

// ============================================
// ANALYTICS: Track Add to Cart Events
// Fire-and-Forget write to Firestore
// ============================================

// Get or generate unique session ID for analytics
function getOrGenerateSessionId() {
  // Priority 1: User phone (logged-in user)
  const userPhone = localStorage.getItem('userPhone');
  if (userPhone) {
    return `phone_${userPhone}`;
  }

  // Priority 2: Existing anonymous session ID
  let anonId = localStorage.getItem('anon_session_id');
  if (anonId) {
    return anonId;
  }

  // Priority 3: Generate new anonymous session ID
  anonId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  localStorage.setItem('anon_session_id', anonId);
  return anonId;
}

// ============================================
// ANALYTICS: Session Tracking (Visitors)
// Track unique visitors + heartbeat for "Online Now"
// ============================================
window.trackSessionStart = async function () {
  try {
    let attempts = 0;
    while (!window.firebaseInit && attempts < 30) {
      await new Promise(r => setTimeout(r, 100));
      attempts++;
    }

    if (!window.firebaseInit) {
      console.warn('📊 Session: Firebase not ready');
      return;
    }

    const { db, doc, setDoc, serverTimestamp } = window.firebaseInit;
    if (!db || !doc || !setDoc) {
      console.warn('📊 Session: Missing Firestore functions');
      return;
    }

    const sessionId = getOrGenerateSessionId();
    const sessionRef = doc(db, 'analytics_sessions', sessionId);

    await setDoc(sessionRef, {
      sessionId: sessionId,
      lastSeen: serverTimestamp(),
      device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      firstVisit: serverTimestamp(),
      pageUrl: window.location.href,
      referrer: document.referrer || 'direct',
      userAgent: navigator.userAgent, // 💻 Device detection
      platform: navigator.platform || 'unknown',
      screenWidth: window.screen.width,
      screenHeight: window.screen.height
    }, { merge: true }); // merge: true - update lastSeen, keep firstVisit

    // Setup heartbeat every 5 minutes to track "online now"
    setInterval(async () => {
      try {
        await setDoc(sessionRef, { lastSeen: serverTimestamp() }, { merge: true });
        console.log('💓 Heartbeat sent');
      } catch (e) {
        console.warn('💓 Heartbeat failed:', e.message);
      }
    }, 5 * 60 * 1000); // Every 5 minutes

  } catch (e) {
    console.error('📊 Session tracking failed:', e.message);
  }
};

// ============================================
// ANALYTICS: Checkout Visit Tracking
// Track when users reach the checkout page
// ============================================
window.trackCheckoutVisit = async function () {
  try {
    let attempts = 0;
    while (!window.firebaseInit && attempts < 30) {
      await new Promise(r => setTimeout(r, 100));
      attempts++;
    }

    if (!window.firebaseInit) {
      console.warn('📊 Checkout: Firebase not ready');
      return;
    }

    const { db, doc, setDoc, serverTimestamp } = window.firebaseInit;
    if (!db || !doc || !setDoc) {
      console.warn('📊 Checkout: Missing Firestore functions');
      return;
    }

    const sessionId = getOrGenerateSessionId();
    // Use session ID as doc ID so each user has only one checkout record
    const checkoutRef = doc(db, 'analytics_checkout_events', sessionId);

    await setDoc(checkoutRef, {
      sessionId: sessionId,
      reachedCheckout: true,
      lastVisit: serverTimestamp()
    }, { merge: true });

    console.log('📊 Checkout visit tracked:', sessionId);

  } catch (e) {
    console.error('📊 Checkout tracking failed:', e.message);
  }
};

window.trackAddToCart = async function (product, source) {
  // source: 'category' | 'product' | 'homepage' | 'repeat_order'
  console.log('📊 trackAddToCart called:', { product: product?.name, source });

  try {
    // Wait for Firebase to be ready
    let attempts = 0;
    while (!window.firebaseInit && attempts < 30) {
      await new Promise(r => setTimeout(r, 100));
      attempts++;
    }

    if (!window.firebaseInit) {
      console.warn('📊 Analytics: Firebase not ready after 30 attempts');
      return;
    }

    console.log('📊 Firebase ready, preparing to write...');

    const { db, collection, addDoc, serverTimestamp } = window.firebaseInit;

    if (!db || !collection || !addDoc) {
      console.warn('📊 Analytics: Missing Firestore functions', { db: !!db, collection: !!collection, addDoc: !!addDoc });
      return;
    }

    // Get unique session identifier
    const userSessionId = getOrGenerateSessionId();

    const docData = {
      productId: product.id || product.productId || 'unknown',
      productName: product.name || product.title || 'Unknown',
      price: product.price || 0,
      quantity: product.quantity || product.qty || 1,
      source: source,
      userSessionId: userSessionId, // UNIQUE SESSION TRACKING
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent.substring(0, 200),
      device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
    };

    console.log('📊 Writing to analytics_cart_adds:', docData);

    const docRef = await addDoc(collection(db, 'analytics_cart_adds'), docData);

    console.log(`📊 Analytics SUCCESS: Item added from "${source}" tracked. DocID: ${docRef.id}`);
  } catch (e) {
    // Non-blocking - don't affect user experience
    console.error('📊 Analytics FAILED:', e.code, e.message, e);
  }
};

// Add product to cart
window.addToCart = async function (product, source = null) {
  // ============================================
  // TRACK FIRST ITEM TIME (for cart-to-checkout analytics)
  // ============================================
  const isFirstItemInCart = window.cart.length === 0;
  
  if (isFirstItemInCart && !localStorage.getItem('cart_started_at')) {
    localStorage.setItem('cart_started_at', Date.now().toString());
    console.log('⏱️ Cart started - timestamp saved');
    
    // ============================================
    // 📊 TRACK TIME TO THINK (first view → add to cart)
    // ============================================
    try {
      const firstProductView = localStorage.getItem('first_product_view');
      if (firstProductView && window.firebaseInit) {
        const timeToThinkMs = Date.now() - parseInt(firstProductView);
        const timeToThinkSeconds = Math.round(timeToThinkMs / 100) / 10; // Round to 1 decimal
        
        // Only track if reasonable time (1 second to 24 hours)
        if (timeToThinkSeconds >= 1 && timeToThinkSeconds <= 86400) {
          const { db, collection, addDoc, serverTimestamp } = window.firebaseInit;
          
          await addDoc(collection(db, 'analytics_timings'), {
            type: 'time_to_cart_add',
            durationSeconds: timeToThinkSeconds,
            productId: product.id || null,
            productName: product.name || null,
            source: source || 'unknown',
            timestamp: serverTimestamp(),
            device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
          });
          
          console.log('⏱️ Time to think tracked:', timeToThinkSeconds, 'seconds');
        }
        
        // Clear the first view timestamp after tracking
        localStorage.removeItem('first_product_view');
      }
    } catch (trackingError) {
      console.error('⏱️ Failed to track time to think:', trackingError.message);
      // Non-blocking - continue with cart addition
    }
  }

  // REFINED LOGIC: Check by ID + isGift status
  // This allows GIFT and PAID versions of the same product to coexist
  const productIsGift = product.isGift === true;

  const existingItem = window.cart.find(item =>
    item.id === product.id &&
    (item.isGift === true) === productIsGift
  );

  if (existingItem) {
    // Found matching item (same ID and same gift status) - increment quantity
    const currentQty = existingItem.quantity || existingItem.qty || 1;
    const addQty = product.quantity || product.qty || 1;
    const newQty = currentQty + addQty;

    // ============================================
    // 🔥 STOCK LIMIT CHECK - Verify with Firestore
    // ============================================
    if (product.id && !productIsGift) {
      const actualStock = await getProductStockFromFirestore(product.id);
      if (actualStock !== null) {
        product.stock = actualStock;
        existingItem.stock = actualStock;
        
        if (newQty > actualStock) {
          window.showToast(`На складі лише ${actualStock} шт`, 'warning');
          if ('quantity' in existingItem) {
            existingItem.quantity = actualStock;
          } else {
            existingItem.qty = actualStock;
          }
          saveCart();
          renderCart();
          window.openCart();
          return;
        }
      }
    }

    if (newQty > (product.stock || 999)) {
      window.showToast(`На складі лише ${product.stock || 999}`, 'warning');
      if ('quantity' in existingItem) {
        existingItem.quantity = product.stock || 999;
      } else {
        existingItem.qty = product.stock || 999;
      }
    } else {
      if ('quantity' in existingItem) {
        existingItem.quantity = newQty;
      } else {
        existingItem.qty = newQty;
      }
    }
  } else {
    // No matching item - add as new entry
    window.cart.push({
      ...product,
      quantity: product.quantity || product.qty || 1,
      isGift: productIsGift // Ensure boolean
    });
  }

  saveCart();
  renderCart();
  window.openCart();
  window.showToast(`${product.name} додано в кошик!`);

  // Track analytics (fire-and-forget, non-blocking)
  if (source && window.trackAddToCart) {
    window.trackAddToCart(product, source);
  }

  // 🎯 Track for personalization (non-blocking)
  try {
    if (window.LatiaoRecommendations && window.LatiaoRecommendations.trackCartAdd) {
      const productCategory = product.category || product.categories?.[0] || 'latiao';
      window.LatiaoRecommendations.trackCartAdd(product.id, product.price, productCategory);
    }
  } catch (e) {
    // Silent fail - personalization is non-critical
  }
};

// Update quantity (LEGACY - kept for backward compatibility)
window.updateQty = function (productId, delta) {
  const item = window.cart.find(i => i.id === productId);
  if (!item) return;

  // Заборонити зміну кількості подарунків
  if (item.isGift === true) {
    window.showToast('Кількість подарунків не можна змінити', 'warning');
    return;
  }

  const currentQty = item.quantity || item.qty || 1;
  const newQty = currentQty + delta;

  if (newQty < 1) {
    window.removeItem(productId);
    return;
  }

  if (newQty > (item.stock || 999)) {
    window.showToast('Досягнуто максимальну кількість', 'warning');
    return;
  }

  if ('quantity' in item) {
    item.quantity = newQty;
  } else {
    item.qty = newQty;
  }

  saveCart();
  renderCart();
};

// Update quantity by cart index (NEW - supports multiple entries of same product)
window.updateQtyByIndex = async function (cartIndex, delta) {
  if (cartIndex < 0 || cartIndex >= window.cart.length) return;

  const item = window.cart[cartIndex];

  // Заборонити зміну кількості подарунків
  if (item.isGift === true) {
    window.showToast('Кількість подарунків не можна змінити', 'warning');
    return;
  }

  const currentQty = item.quantity || item.qty || 1;
  const newQty = currentQty + delta;

  if (newQty < 1) {
    window.removeItemByIndex(cartIndex);
    return;
  }

  // ============================================
  // 🔥 STOCK LIMIT CHECK - Real-time Firestore Verification
  // ============================================
  if (delta > 0 && item.id) {
    // Only check stock when INCREASING quantity
    const actualStock = await getProductStockFromFirestore(item.id);
    
    if (actualStock !== null && newQty > actualStock) {
      window.showToast(`Максимальна кількість у наявності: ${actualStock}`, 'warning');
      
      // Update item stock to reflect actual availability
      item.stock = actualStock;
      
      // Adjust quantity to maximum available if needed
      if (currentQty > actualStock) {
        if ('quantity' in item) {
          item.quantity = actualStock;
        } else {
          item.qty = actualStock;
        }
        saveCart();
        renderCart();
        window.showToast(`Кількість автоматично змінено до ${actualStock}`, 'warning');
      }
      
      return;
    }
    
    // Update local stock cache with fresh data
    if (actualStock !== null) {
      item.stock = actualStock;
    }
  }

  if (newQty > (item.stock || 999)) {
    window.showToast(`Максимальна кількість у наявності: ${item.stock || 999}`, 'warning');
    return;
  }

  if ('quantity' in item) {
    item.quantity = newQty;
  } else {
    item.qty = newQty;
  }

  saveCart();
  renderCart();
  
  // Trigger smooth price animations
  setTimeout(() => animatePriceChanges(), 50);
};

// Remove item from cart (LEGACY - kept for backward compatibility)
window.removeItem = function (productId) {
  const item = window.cart.find(i => i.id === productId);
  if (!item) return;

  const element = document.querySelector(`[data-id="${productId}"]`);
  if (element) {
    element.classList.remove('cart-item-enter');
    element.classList.add('cart-item-exit');

    setTimeout(() => {
      window.cart = window.cart.filter(i => i.id !== productId);
      saveCart();
      renderCart();
      window.showToast(`${item.name} видалено`);
    }, 280);
  }
};

// Remove item by cart index (NEW - supports multiple entries of same product)
window.removeItemByIndex = function (cartIndex) {
  if (cartIndex < 0 || cartIndex >= window.cart.length) return;

  const item = window.cart[cartIndex];
  const element = document.querySelector(`[data-cart-index="${cartIndex}"]`);

  if (element) {
    element.classList.remove('cart-item-enter');
    element.classList.add('cart-item-exit');

    setTimeout(() => {
      window.cart.splice(cartIndex, 1);
      saveCart();
      renderCart();
      window.showToast(`${item.name} видалено`);
    }, 280);
  }
};

// Open cart (with mutual exclusion)
window.openCart = async function () {
  // Close mobile menu if open (mutual exclusion)
  const mobileMenu = document.getElementById('mobile-menu');
  const menuOverlay = document.getElementById('menu-overlay');
  if (mobileMenu && !mobileMenu.classList.contains('-translate-x-full')) {
    window.closeSideMenu();
  }
  
  const sidebar = document.getElementById('cart-sidebar');
  const overlay = document.getElementById('cart-overlay');
  const supportWidget = document.getElementById('support-widget');

  if (sidebar && overlay) {
    sidebar.classList.remove('translate-x-full');
    sidebar.classList.remove('pointer-events-none'); // ✅ Enable interactions
    overlay.classList.remove('hidden');
    overlay.classList.remove('opacity-0');
    overlay.classList.add('pointer-events-auto'); // ✅ Enable overlay clicks
    document.body.style.overflow = 'hidden';

    // Hide support widget with smooth transition
    if (supportWidget) {
      supportWidget.classList.add('opacity-0', 'pointer-events-none', 'scale-90');
      setTimeout(() => supportWidget.classList.add('hidden'), 200);
    }
    
    // ============================================
    // 🔥 VALIDATE STOCK ON CART OPEN
    // Auto-adjust quantities if stock changed
    // ============================================
    await validateCartStockOnLoad();
  }
};

// Close cart
window.closeCart = function () {
  const sidebar = document.getElementById('cart-sidebar');
  const overlay = document.getElementById('cart-overlay');
  const supportWidget = document.getElementById('support-widget');

  if (sidebar && overlay) {
    sidebar.classList.add('translate-x-full');
    sidebar.classList.add('pointer-events-none'); // ✅ Disable interactions
    overlay.classList.add('hidden');
    overlay.classList.add('opacity-0');
    overlay.classList.remove('pointer-events-auto'); // ✅ Disable overlay clicks
    document.body.style.overflow = '';

    // Show support widget with smooth transition
    if (supportWidget) {
      supportWidget.classList.remove('hidden');
      setTimeout(() => {
        supportWidget.classList.remove('opacity-0', 'pointer-events-none', 'scale-90');
      }, 10);
    }
  }
};

// ============================================
// ANNOUNCEMENT BAR - Close & LocalStorage
// ============================================
const ANNOUNCEMENT_STORAGE_KEY = 'pepper-hunt-bar-closed-2026';

window.closeAnnouncementBar = function() {
  const bar = document.getElementById('announcement-bar');
  const header = document.getElementById('main-header');
  const toastContainer = document.getElementById('toast-container');
  
  if (bar) {
    bar.style.transition = 'all 0.3s ease-out';
    bar.style.opacity = '0';
    bar.style.transform = 'translateY(-100%)';
    setTimeout(() => {
      bar.style.display = 'none';
      // Move header to top
      if (header) {
        header.style.top = '0';
      }
      // Move toast container
      if (toastContainer) {
        toastContainer.style.top = '1rem';
      }
    }, 300);
    localStorage.setItem(ANNOUNCEMENT_STORAGE_KEY, 'true');
  }
};

// ============================================
// PEPPER GAME MODAL - Open & Close
// ============================================
window.openPepperGameModal = function() {
  const modal = document.getElementById('pepper-game-modal');
  if (modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    console.log('🌶️ Pepper Game Modal opened');
    
    // Initialize Lucide icons in modal
    if (typeof lucide !== 'undefined') {
      setTimeout(() => {
        lucide.createIcons();
      }, 50);
    }
    
    // Add ESC key listener
    document.addEventListener('keydown', handleModalEscape);
  }
};

window.closePepperGameModal = function() {
  const modal = document.getElementById('pepper-game-modal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    console.log('🌶️ Pepper Game Modal closed');
    
    // Remove ESC key listener
    document.removeEventListener('keydown', handleModalEscape);
  }
};

function handleModalEscape(event) {
  if (event.key === 'Escape') {
    window.closePepperGameModal();
  }
}

// ============================================
// PEPPER HUNT GAME - Start & Registration
// ============================================
window.startPepperHuntGame = async function() {
  console.log('🎮 Starting Pepper Hunt Game registration...');
  
  const form = document.getElementById('pepper-game-registration-form');
  const phoneInput = document.getElementById('player-phone');
  const telegramInput = document.getElementById('player-telegram');
  const errorMessage = document.getElementById('form-error-message');
  const successMessage = document.getElementById('form-success-message');
  
  // Hide previous messages
  if (errorMessage) errorMessage.classList.add('hidden');
  if (successMessage) successMessage.classList.add('hidden');
  
  // Validate form
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  
  const phone = phoneInput.value.trim();
  const telegram = telegramInput.value.trim();
  
  // Additional validation
  if (!phone || phone.length < 10) {
    showFormError('Будь ласка, введіть коректний номер телефону');
    return;
  }
  
  if (!telegram || telegram.length < 3) {
    showFormError('Будь ласка, введіть ваш Telegram нікнейм');
    return;
  }
  
  // Normalize telegram (add @ if missing)
  const normalizedTelegram = telegram.startsWith('@') ? telegram : '@' + telegram;
  
  const playerData = {
    phone: phone,
    telegram: normalizedTelegram,
    registeredAt: new Date().toISOString(),
    foundPeppers: [],
    completedAt: null,
    status: 'active'
  };
  
  try {
    // Save to localStorage first (immediate backup)
    localStorage.setItem('pepperHunt_playerData', JSON.stringify(playerData));
    console.log('✅ Player data saved to localStorage');
    
    // Try to save to Firestore
    try {
      await waitForFirebaseInLayout();
      
      const { getFirestore, collection, addDoc, serverTimestamp } = 
        await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
      
      const db = window.db || getFirestore(window.firebaseApp);
      
      const firestoreData = {
        ...playerData,
        registeredAt: serverTimestamp(),
        userAgent: navigator.userAgent,
        referrer: document.referrer || 'direct'
      };
      
      const docRef = await addDoc(collection(db, 'game_players'), firestoreData);
      console.log('✅ Player registered in Firestore:', docRef.id);
      
      // Save document ID for later updates
      localStorage.setItem('pepperHunt_playerId', docRef.id);
      
    } catch (firestoreError) {
      console.warn('⚠️ Could not save to Firestore, using localStorage only:', firestoreError);
    }
    
    // Show success message
    if (successMessage) {
      successMessage.classList.remove('hidden');
    }
    
    // Show toast notification
    if (typeof window.showToast === 'function') {
      window.showToast('✅ Реєстрацію завершено! Розпочинайте пошук перчиків! 🌶️', 'success');
    }
    
    // Close modal after short delay
    setTimeout(() => {
      window.closePepperGameModal();
      
      // Scroll to FAQ section if on homepage (where first pepper is)
      const path = window.location.pathname;
      const isHomePage = path === '/' || path === '/index.html' || path.endsWith('/index.html') || path === '';
      
      if (isHomePage) {
        const faqSection = document.querySelector('#faq, [id*="faq"], .faq-section');
        if (faqSection) {
          setTimeout(() => {
            faqSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 500);
        }
      }
    }, 2000);
    
  } catch (error) {
    console.error('❌ Error registering player:', error);
    showFormError('Помилка реєстрації. Спробуйте ще раз або зверніться до підтримки.');
  }
};

// Helper function to show form errors
function showFormError(message) {
  const errorMessage = document.getElementById('form-error-message');
  if (errorMessage) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    
    // Scroll to error
    errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

// Initialize announcement bar visibility based on game config
async function initAnnouncementBar() {
  const bar = document.getElementById('announcement-bar');
  const header = document.getElementById('main-header');
  const toastContainer = document.getElementById('toast-container');
  const announcementText = document.getElementById('announcement-text');
  
  // Check if we're on the homepage
  const path = window.location.pathname;
  const isHomePage = path === '/' || path === '/index.html' || path.endsWith('/index.html') || path === '';
  
  // Always hide if not homepage
  if (!isHomePage) {
    if (bar) bar.style.display = 'none';
    if (header) header.style.top = '0';
    if (toastContainer) toastContainer.style.top = '1rem';
    return;
  }
  
  // Check if user closed it before
  if (localStorage.getItem(ANNOUNCEMENT_STORAGE_KEY) === 'true') {
    if (bar) bar.style.display = 'none';
    if (header) header.style.top = '0';
    if (toastContainer) toastContainer.style.top = '1rem';
    return;
  }
  
  // Setup real-time listener for game configuration
  try {
    // Wait for Firebase to be ready
    await waitForFirebaseInLayout();
    
    const { getFirestore, doc, onSnapshot } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    const db = window.db || getFirestore(window.firebaseApp);
    const configRef = doc(db, 'settings', 'peppersGameConfig');
    
    console.log('👂 [TOP BAR] Setting up real-time listener for game config...');
    
    // Setup real-time listener
    onSnapshot(configRef, (snapshot) => {
      let isGameEnabled = false;
      let foundPeppersCount = 0;
      
      // Get found peppers from localStorage
      try {
        const stored = localStorage.getItem('pepperHunt_foundPeppers');
        foundPeppersCount = stored ? JSON.parse(stored).length : 0;
      } catch (e) {
        console.log('Error reading found peppers:', e);
      }
      
      if (snapshot.exists()) {
        isGameEnabled = snapshot.data().isEnabled || false;
        console.log('🔔 [TOP BAR] Real-time update received - Game is:', isGameEnabled ? '🟢 ENABLED' : '🔴 DISABLED');
      } else {
        console.warn('⚠️ [TOP BAR] Config document does not exist');
        isGameEnabled = false;
      }
      
      // Update window.pepperGameConfig for other components
      if (!window.pepperGameConfig) {
        window.pepperGameConfig = {};
      }
      window.pepperGameConfig.isEnabled = isGameEnabled;
      window.pepperGameConfig.loaded = true;
      
      // Dispatch event for other listeners
      window.dispatchEvent(new CustomEvent('pepperGameConfigChanged', { 
        detail: { isEnabled: isGameEnabled } 
      }));
      
      // Update bar content based on progress
      if (foundPeppersCount >= 8) {
        // All peppers found!
        if (announcementText) {
          announcementText.textContent = '🎉 Вітаємо! Ти знайшов усі перчики! Твій приз чекає.';
        }
        if (bar) {
          bar.style.display = 'flex';
          if (header) header.style.top = '24px';
          if (toastContainer) toastContainer.style.top = '3rem';
        }
        console.log('🎉 [TOP BAR] All peppers found! Showing completion message.');
      } else if (isGameEnabled) {
        // Game is active, show normal message
        if (bar) {
          bar.style.display = 'flex';
          if (header) header.style.top = '24px';
          if (toastContainer) toastContainer.style.top = '3rem';
        }
        console.log('✅ [TOP BAR] Bar visible - game is enabled');
      } else {
        // Game is disabled - HIDE COMPLETELY
        if (bar) {
          bar.style.display = 'none';
        }
        if (header) {
          header.style.top = '0';
        }
        if (toastContainer) {
          toastContainer.style.top = '1rem';
        }
        console.log('⚠️ [TOP BAR] Bar hidden - game is disabled');
      }
    }, (error) => {
      console.error('❌ [TOP BAR] Error in real-time listener:', error);
      // On error, hide the bar
      if (bar) bar.style.display = 'none';
      if (header) header.style.top = '0';
      if (toastContainer) toastContainer.style.top = '1rem';
    });
    
  } catch (error) {
    console.error('❌ [TOP BAR] Error setting up listener:', error);
    // On error, hide the bar
    if (bar) bar.style.display = 'none';
    if (header) header.style.top = '0';
    if (toastContainer) toastContainer.style.top = '1rem';
  }
}

// Helper function to wait for Firebase
function waitForFirebaseInLayout(timeout = 10000) {
  return new Promise((resolve, reject) => {
    if (window.firebaseApp || window.db) {
      resolve();
      return;
    }
    
    const startTime = Date.now();
    let resolved = false;
    
    const firebaseListener = () => {
      if (!resolved) {
        resolved = true;
        clearInterval(pollInterval);
        resolve();
      }
    };
    window.addEventListener('firebaseReady', firebaseListener, { once: true });
    
    const pollInterval = setInterval(() => {
      if (window.firebaseApp || window.db) {
        if (!resolved) {
          resolved = true;
          window.removeEventListener('firebaseReady', firebaseListener);
          clearInterval(pollInterval);
          resolve();
        }
      } else if (Date.now() - startTime > timeout) {
        if (!resolved) {
          resolved = true;
          window.removeEventListener('firebaseReady', firebaseListener);
          clearInterval(pollInterval);
          reject(new Error('Firebase timeout'));
        }
      }
    }, 100);
  });
}

// Open mobile side menu (from left)
window.openSideMenu = function () {
  console.log('🍔 openSideMenu called');

  const menu = document.getElementById('mobile-menu');
  const overlay = document.getElementById('menu-overlay');

  if (!menu || !overlay) {
    console.error('❌ Mobile menu elements not found!', { menu, overlay });
    return;
  }

  // Close cart if open (mutual exclusion)
  const cartSidebar = document.getElementById('cart-sidebar');
  if (cartSidebar && !cartSidebar.classList.contains('translate-x-full')) {
    window.closeCart();
  }
  
  // Open the menu (slide from left)
  console.log('✅ Opening side menu...');
  menu.classList.remove('-translate-x-full');
  overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden'; // Prevent body scroll
  document.body.classList.add('overflow-hidden');
};

// Close mobile side menu
window.closeSideMenu = function () {
  console.log('🍔 closeSideMenu called');

  const menu = document.getElementById('mobile-menu');
  const overlay = document.getElementById('menu-overlay');

  if (!menu || !overlay) {
    console.error('❌ Mobile menu elements not found!', { menu, overlay });
    return;
  }

  // Close the menu (slide to left)
  console.log('✅ Closing side menu...');
  menu.classList.add('-translate-x-full');
  overlay.classList.add('hidden');
  document.body.style.overflow = ''; // Restore body scroll
  document.body.classList.remove('overflow-hidden');
};

// Toggle mobile menu (kept for backward compatibility)
window.toggleMobileMenu = function () {
  console.log('🍔 toggleMobileMenu called (legacy)');
  
  const menu = document.getElementById('mobile-menu');
  if (!menu) return;
  
  const isClosed = menu.classList.contains('-translate-x-full');
  
  if (isClosed) {
    window.openSideMenu();
  } else {
    window.closeSideMenu();
  }
};

// Checkout
window.checkout = async function () {
  const total = calculateTotal();
  if (total < 100) {
    window.showToast('Мінімальна сума — 100 грн', 'warning');
    return;
  }

  // Save checkout start time for tracking checkout duration
  localStorage.setItem('checkout_load_time', Date.now().toString());

  // NOTE: cart_started_at is NOT cleared here - it's needed for full_cycle tracking
  // which happens on successful order completion (checkout.html → submitOrder)

  window.location.href = 'checkout.html';
};

// ============================================
// FIREBASE READY STATE HELPER
// ============================================

/**
 * Wait for Firebase to be fully initialized and accessible
 * @param {number} timeout - Maximum time to wait in milliseconds (default: 3000)
 * @returns {Promise<boolean>} - Resolves to true if Firebase is ready, false if timeout
 */
window.waitForFirebase = function(timeout = 3000) {
  console.log('⏳ Waiting for Firebase to initialize...');
  
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    // Check immediately first
    if (window.firebaseInit && window.firebaseInit.db) {
      console.log('✅ Firebase already initialized');
      resolve(true);
      return;
    }
    
    // Poll every 50ms
    const checkInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      
      if (window.firebaseInit && window.firebaseInit.db) {
        clearInterval(checkInterval);
        console.log(`✅ Firebase ready after ${elapsed}ms`);
        resolve(true);
      } else if (elapsed >= timeout) {
        clearInterval(checkInterval);
        console.warn(`⚠️ Firebase timeout after ${timeout}ms - using fallback`);
        resolve(false);
      }
    }, 50);
  });
};

// ============================================
// LOAD NAVIGATION (Categories + Pages)
// ============================================

let navigationCache = null; // Cache для швидкого завантаження
const CACHE_KEY = 'latiao_nav_timestamp'; // LocalStorage key to track when to invalidate cache

// ============================================
// STATIC NAVIGATION LINKS (Consolidated)
// ============================================
const STATIC_NAV_LINKS = [
  {
    title: 'Про нас',
    href: '/about.html',
    mobileIcon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5 text-gray-500 mr-3"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>'
  },
  {
    title: 'Доставка та оплата',
    href: '/delivery-payment.html',
    mobileIcon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5 text-gray-500 mr-3"><path d="M14 19V7a2 2 0 0 0-2-2H9"/><path d="M15 19H9"/><path d="M19 19h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62L18.3 9.38a1 1 0 0 0-.78-.38H14"/><path d="M2 13v5a1 1 0 0 0 1 1h2"/><path d="M4 3 2.15 5.15a.495.495 0 0 0 .35.86h2.15a.47.47 0 0 1 .35.86L3 9.02"/><circle cx="17" cy="19" r="2"/><circle cx="7" cy="19" r="2"/></svg>'
  },
  {
    title: 'Обмін та повернення',
    href: '/returns.html',
    mobileIcon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5 text-gray-500 mr-3"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>'
  },
  {
    title: 'Кешбек',
    href: '/cashback.html',
    mobileIcon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5 text-gray-500 mr-3"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>'
  }
];

/**
 * Clear navigation cache - use this after deleting pages/categories
 */
window.clearNavigationCache = function () {
  console.log('🗑️ Очищення кешу навігації');
  navigationCache = null;
  // Update timestamp in localStorage to force all tabs/pages to reload
  localStorage.setItem(CACHE_KEY, Date.now().toString());
  // Force reload from Firebase
  loadNavigation();
};

/**
 * Check if cache is stale based on localStorage timestamp
 */
function isCacheStale() {
  const lastUpdate = localStorage.getItem(CACHE_KEY);
  const cacheTime = navigationCache?._timestamp || 0;
  return lastUpdate && parseInt(lastUpdate) > cacheTime;
}

async function loadNavigation() {
  // Якщо вже є кеш І він не застарів - використовуємо його
  if (navigationCache && !isCacheStale()) {
    console.log('📦 Використовуємо кешоване меню');
    renderNavigation(navigationCache);
    return;
  }

  // Якщо кеш застарів - очищуємо його
  if (isCacheStale()) {
    console.log('⚠️ Кеш застарів, завантажуємо свіжі дані');
    navigationCache = null;
  }

  try {
    console.log('🔄 Завантаження меню з Firebase...');

    // Wait for Firebase with 3-second timeout
    const isFirebaseReady = await window.waitForFirebase(3000);

    if (!isFirebaseReady || !window.firebaseInit) {
      console.warn('⚠️ Firebase not available for navigation - using fallback');
      renderNavigationFallback();
      return;
    }

    console.log('✅ Firebase ready - injecting navigation');

    const { db, collection, getDocs, query, where, orderBy } = window.firebaseInit;

    // Паралельне завантаження категорій та сторінок
    const [categoriesSnap, pagesSnap] = await Promise.all([
      getDocs(query(collection(db, 'categories'), where('isActive', '==', true))),
      getDocs(query(collection(db, 'pages'), where('isActive', '==', true)))
    ]);

    const categories = categoriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Сортування сторінок на клієнті за sortOrder (працює без складних індексів)
    const pages = pagesSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));

    // Зберігаємо в кеш з timestamp
    navigationCache = {
      categories,
      pages,
      _timestamp: Date.now()
    };

    renderNavigation(navigationCache);

  } catch (error) {
    console.error('❌ Помилка завантаження меню:', error);
    renderNavigationFallback();
  }
}

function renderNavigation({ categories, pages }) {
  // === DESKTOP CATALOG MENU ===
  const desktopCatalog = document.getElementById('desktop-catalog-menu');
  if (desktopCatalog && categories.length > 0) {
    desktopCatalog.innerHTML = categories.map(cat =>
      `<a href="/category.html?slug=${cat.slug}" class="block px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-500 transition-colors rounded-lg">
        ${cat.name}
      </a>`
    ).join('');
  } else if (desktopCatalog) {
    desktopCatalog.innerHTML = '<div class="px-4 py-3 text-gray-400 text-sm">Категорій немає</div>';
  }

  // === DESKTOP PAGES MENU ===
  const desktopPages = document.getElementById('desktop-pages-menu');
  if (desktopPages) {
    let desktopPagesHTML = '';
    
    // Add Firebase-loaded pages
    if (pages.length > 0) {
      const headerPages = pages.filter(p => p.location === 'header' || p.location === 'both');
      desktopPagesHTML = headerPages.map(page =>
        `<a href="/page.html?slug=${page.slug}" class="desktop-nav-link text-gray-600 hover:text-spicy transition-colors font-medium">${page.title}</a>`
      ).join('');
    }
    
    // Add static links (always visible) - using consolidated constant
    desktopPagesHTML += STATIC_NAV_LINKS.map(link =>
      `<a href="${link.href}" class="desktop-nav-link text-gray-600 hover:text-spicy transition-colors font-medium">${link.title}</a>`
    ).join('');
    
    desktopPages.innerHTML = desktopPagesHTML;
  }

  // === MOBILE CATALOG ===
  const mobileCatalog = document.getElementById('mobile-catalog-container');
  if (mobileCatalog && categories.length > 0) {
    // Map category icons by name - PNG images for visual appeal
    const categoryIcons = {
      'Усі товари': '<img src="/images/icons/icon-all.png" alt="Усі товари" class="w-6 h-6 object-contain group-hover:scale-110 transition-transform" loading="lazy">',
      'Сушені крабики': '<img src="/images/icons/icon-crab.png" alt="Сушені крабики" class="w-6 h-6 object-contain group-hover:scale-110 transition-transform" loading="lazy">',
      'Гостре латяо': '<img src="/images/icons/icon-spicy.png" alt="Гостре латяо" class="w-6 h-6 object-contain group-hover:scale-110 transition-transform" loading="lazy">',
      'Негостре латяо': '<img src="/images/icons/icon-spicy.png" alt="Негостре латяо" class="w-6 h-6 object-contain group-hover:scale-110 transition-transform" loading="lazy">',
      'Помірно гостре латяо': '<img src="/images/icons/icon-spicy.png" alt="Помірно гостре латяо" class="w-6 h-6 object-contain group-hover:scale-110 transition-transform" loading="lazy">',
      'Локшина Buldak': '<img src="/images/icons/icon-spicy.png" alt="Локшина Buldak" class="w-6 h-6 object-contain group-hover:scale-110 transition-transform" loading="lazy">',
      'Снеки': '<img src="/images/icons/icon-snacks.png" alt="Снеки" class="w-6 h-6 object-contain group-hover:scale-110 transition-transform" loading="lazy">',
      'Напої': '<img src="/images/icons/icon-drinks.png" alt="Напої" class="w-6 h-6 object-contain group-hover:scale-110 transition-transform" loading="lazy">',
      'Солодощі': '<img src="/images/icons/icon-sweets.png" alt="Солодощі" class="w-6 h-6 object-contain group-hover:scale-110 transition-transform" loading="lazy">',
      'Соуси': '<img src="/images/icons/icon-sauce.png" alt="Соуси" class="w-6 h-6 object-contain group-hover:scale-110 transition-transform" loading="lazy">'
    };
    
    mobileCatalog.innerHTML = categories.map(cat => {
      const icon = categoryIcons[cat.name] || '<img src="/images/icons/icon-default.png" alt="' + cat.name + '" class="w-6 h-6 object-contain group-hover:scale-110 transition-transform" loading="lazy">';
      return `<li><a href="/category.html?slug=${cat.slug}" onclick="window.closeSideMenu()" class="mobile-menu-link group">${icon}<span>${cat.name}</span></a></li>`;
    }).join('');
  } else if (mobileCatalog) {
    mobileCatalog.innerHTML = '<li class="text-gray-400 text-sm px-4">Категорій немає</li>';
  }

  // === MOBILE PAGES ===
  const mobilePages = document.getElementById('mobile-pages-container');
  if (mobilePages) {
    let mobilePagesHTML = '';
    
    // Map page icons by common titles - Direct SVG for reliability
    const pageIcons = {
      'Доставка': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5 text-gray-500 mr-3 lucide lucide-truck-electric"><path d="M14 19V7a2 2 0 0 0-2-2H9"/><path d="M15 19H9"/><path d="M19 19h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62L18.3 9.38a1 1 0 0 0-.78-.38H14"/><path d="M2 13v5a1 1 0 0 0 1 1h2"/><path d="M4 3 2.15 5.15a.495.495 0 0 0 .35.86h2.15a.47.47 0 0 1 .35.86L3 9.02"/><circle cx="17" cy="19" r="2"/><circle cx="7" cy="19" r="2"/></svg>',
      'Про нас': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5 text-gray-500 mr-3 lucide lucide-component"><path d="M15.536 11.293a1 1 0 0 0 0 1.414l2.376 2.377a1 1 0 0 0 1.414 0l2.377-2.377a1 1 0 0 0 0-1.414l-2.377-2.377a1 1 0 0 0-1.414 0z"/><path d="M2.297 11.293a1 1 0 0 0 0 1.414l2.377 2.377a1 1 0 0 0 1.414 0l2.377-2.377a1 1 0 0 0 0-1.414L6.088 8.916a1 1 0 0 0-1.414 0z"/><path d="M8.916 17.912a1 1 0 0 0 0 1.415l2.377 2.376a1 1 0 0 0 1.414 0l2.377-2.376a1 1 0 0 0 0-1.415l-2.377-2.376a1 1 0 0 0-1.414 0z"/><path d="M8.916 4.674a1 1 0 0 0 0 1.414l2.377 2.376a1 1 0 0 0 1.414 0l2.377-2.376a1 1 0 0 0 0-1.414l-2.377-2.377a1 1 0 0 0-1.414 0z"/></svg>',
      'Обмін': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5 text-gray-500 mr-3 lucide lucide-info"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
      'Оплата': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5 text-gray-500 mr-3"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>',
      'Контакти': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5 text-gray-500 mr-3"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>'
    };
    
    // Add Firebase-loaded pages
    if (pages.length > 0) {
      const headerPages = pages.filter(p => p.location === 'header' || p.location === 'both');
      mobilePagesHTML = headerPages.map(page => {
        // Try to match icon by partial title match
        let icon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5 text-gray-500 mr-3"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>';
        for (const [key, svg] of Object.entries(pageIcons)) {
          if (page.title.includes(key)) {
            icon = svg;
            break;
          }
        }
        return `<li><a href="/page.html?slug=${page.slug}" onclick="window.closeSideMenu()" class="mobile-menu-link mobile-nav-link group">${icon}<span>${page.title}</span></a></li>`;
      }).join('');
    }
    
    // Add static links (always visible) - using consolidated constant
    mobilePagesHTML += STATIC_NAV_LINKS.map(link =>
      `<li><a href="${link.href}" onclick="window.closeSideMenu()" class="mobile-menu-link mobile-nav-link group">${link.mobileIcon}<span>${link.title}</span></a></li>`
    ).join('');
    
    mobilePages.innerHTML = mobilePagesHTML;
  }

  // Reinit Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  // Update active navigation state
  updateActiveNavigation();
}

function renderNavigationFallback() {
  // Fallback якщо Firebase не завантажився
  const desktopCatalog = document.getElementById('desktop-catalog-menu');
  const desktopPages = document.getElementById('desktop-pages-menu');
  const mobileCatalog = document.getElementById('mobile-catalog-container');
  const mobilePages = document.getElementById('mobile-pages-container');

  if (desktopCatalog) {
    desktopCatalog.innerHTML = '<div class="px-4 py-3 text-gray-400 text-sm">Помилка завантаження</div>';
  }

  // Show static links in desktop nav even if Firebase failed - using consolidated constant
  if (desktopPages) {
    desktopPages.innerHTML = STATIC_NAV_LINKS.map(link =>
      `<a href="${link.href}" class="desktop-nav-link text-gray-600 hover:text-spicy transition-colors font-medium">${link.title}</a>`
    ).join('');
  }

  if (mobileCatalog) {
    mobileCatalog.innerHTML = '<li class="text-gray-400 text-sm">Помилка завантаження</li>';
  }

  // Show static links in mobile nav even if Firebase failed - using consolidated constant
  if (mobilePages) {
    mobilePages.innerHTML = STATIC_NAV_LINKS.map(link =>
      `<li><a href="${link.href}" onclick="window.closeSideMenu()" class="mobile-menu-link mobile-nav-link group">${link.mobileIcon}<span>${link.title}</span></a></li>`
    ).join('');
  }
  
  // Update active navigation state
  updateActiveNavigation();
}

// Update active navigation state based on current page
function updateActiveNavigation() {
  const currentPath = window.location.pathname;
  
  // Desktop navigation links
  const desktopLinks = document.querySelectorAll('.desktop-nav-link');
  desktopLinks.forEach(link => {
    const linkPath = new URL(link.href, window.location.origin).pathname;
    if (linkPath === currentPath) {
      link.classList.remove('text-gray-600');
      link.classList.add('text-spicy', 'font-bold');
    } else {
      link.classList.remove('text-spicy', 'font-bold');
      link.classList.add('text-gray-600');
    }
  });
  
  // Mobile navigation links
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');
  mobileLinks.forEach(link => {
    const linkPath = new URL(link.href, window.location.origin).pathname;
    if (linkPath === currentPath) {
      link.classList.add('bg-orange-50');
      const span = link.querySelector('span');
      if (span) {
        span.classList.add('text-spicy', 'font-bold');
      }
    } else {
      link.classList.remove('bg-orange-50');
      const span = link.querySelector('span');
      if (span) {
        span.classList.remove('text-spicy', 'font-bold');
      }
    }
  });
}

// ============================================
// USER SESSION CHECK (Firebase Auth + localStorage)
// ============================================

/**
 * Check if user is logged in via Firebase Auth OR localStorage session
 * Updates the profile button link accordingly
 */
async function checkUserSession() {
  const profileBtn = document.getElementById('user-profile-btn');
  if (!profileBtn) return;

  // First, check localStorage session (custom SMS login)
  const localSession = localStorage.getItem('user_session');
  if (localSession) {
    try {
      const session = JSON.parse(localSession);
      if (session && (session.phone || session.id)) {
        console.log('👤 User logged in via SMS (localStorage)');
        profileBtn.href = './dashboard.html';
        profileBtn.title = 'Мій кабінет';
        // Add logged-in indicator
        profileBtn.classList.add('text-spicy');
        profileBtn.classList.remove('text-gray-700');
        return true;
      }
    } catch (e) {
      console.warn('⚠️ Invalid localStorage session, clearing...');
      localStorage.removeItem('user_session');
    }
  }

  // Then, check Firebase Auth
  try {
    // Wait for Firebase to be available
    let attempts = 0;
    while (!window.firebaseInit && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (window.firebaseInit && window.firebaseInit.auth) {
      const { auth } = window.firebaseInit;

      // Check current user synchronously first
      if (auth.currentUser) {
        console.log('👤 User logged in via Firebase Auth');
        profileBtn.href = './dashboard.html';
        profileBtn.title = 'Мій кабінет';
        profileBtn.classList.add('text-spicy');
        profileBtn.classList.remove('text-gray-700');
        return true;
      }

      // Also listen for auth state changes (async)
      auth.onAuthStateChanged((user) => {
        if (user) {
          console.log('👤 Firebase Auth state changed: logged in');
          profileBtn.href = './dashboard.html';
          profileBtn.title = 'Мій кабінет';
          profileBtn.classList.add('text-spicy');
          profileBtn.classList.remove('text-gray-700');
        } else if (!localStorage.getItem('user_session')) {
          // Only reset if no localStorage session either
          profileBtn.href = './login.html';
          profileBtn.title = 'Увійти';
          profileBtn.classList.remove('text-spicy');
          profileBtn.classList.add('text-gray-700');
        }
      });
    }
  } catch (error) {
    console.warn('⚠️ Error checking Firebase Auth:', error);
  }

  // Default: not logged in
  profileBtn.href = './login.html';
  profileBtn.title = 'Увійти';
  return false;
}

// Expose function globally for use in other scripts
window.checkUserSession = checkUserSession;

// ============================================
// MAIN EXPORT FUNCTION
// ============================================

export async function loadLayout() {
  // Prevent duplicate layout injection
  if (document.body.hasAttribute('data-layout-loaded')) {
    console.log('✅ Layout вже завантажений');
    return;
  }

  console.log('🚀 Завантаження Layout...');

  // Remove any existing layout elements (anti-duplicate)
  const existingElements = [
    'toast-container',
    'cart-overlay',
    'cart-sidebar',
    'mobile-menu',
    'menu-overlay'
  ];

  existingElements.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      console.log(`🗑️ Видалення дубліката: #${id}`);
      el.remove();
    }
  });

  // Remove existing header if present
  const existingHeader = document.querySelector('header[class*="fixed"]');
  if (existingHeader) {
    console.log('🗑️ Видалення дубліката header');
    existingHeader.remove();
  }

  // Inject header template at the start of body
  document.body.insertAdjacentHTML('afterbegin', headerTemplate);

  // Initialize announcement bar with real-time listener
  // The onSnapshot inside will automatically update when admin changes the toggle
  initAnnouncementBar();

  // Mark layout as loaded
  document.body.setAttribute('data-layout-loaded', 'true');

  console.log('✅ Layout HTML вставлено');
  
  // Verify mobile menu was injected
  const mobileMenuCheck = document.getElementById('mobile-menu');
  const favoritesLinkCheck = document.getElementById('mobile-favorites-link');
  if (mobileMenuCheck) {
    console.log('✅ Mobile menu успішно створено');
  } else {
    console.error('❌ Mobile menu НЕ знайдено!');
  }
  if (favoritesLinkCheck) {
    console.log('✅ Favorites link у mobile menu знайдено');
  } else {
    console.warn('⚠️ Favorites link у mobile menu НЕ знайдено');
  }

  // Initialize Lucide icons if available
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
    console.log('✅ Lucide іконки ініціалізовані');
  }

  // Render cart and update badges
  renderCart();
  updateBadges();
  updateFavoritesBadge();

  // Render footer if placeholder exists
  renderFooter();

  // Wait for Firebase before loading navigation
  console.log('⏳ Preparing to load navigation...');
  const isFirebaseReady = await window.waitForFirebase(3000);
  
  if (isFirebaseReady) {
    console.log('✅ Firebase ready - injecting layout');
    await loadNavigation();
  } else {
    console.warn('⚠️ Firebase timeout - showing fallback navigation');
    renderNavigationFallback();
  }

  // Check user session and update profile button (async)
  checkUserSession();

  // Fetch and inject gifts into cart (async)
  fetchAndInjectGifts();

  // Add event listeners for mobile menu links
  setTimeout(() => {
    document.querySelectorAll('.mobile-menu-link').forEach(link => {
      link.addEventListener('click', () => {
        window.closeSideMenu();
      });
    });

    // Highlight active page in mobile menu
    highlightActivePage();

    // Re-init Lucide icons after small delay to ensure all DOM is ready
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }, 100);

  console.log('✅ Layout повністю готовий');
}

// ============================================
// RENDER FOOTER
// ============================================
async function renderFooter() {
  const footerPlaceholder = document.getElementById('footer-placeholder');
  if (footerPlaceholder) {
    footerPlaceholder.innerHTML = footerTemplate;
    console.log('✅ Footer відрендерено');

    // Re-initialize Lucide icons for footer
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    // Load dynamic footer navigation (categories and pages)
    await loadFooterDynamicContent();
  }
}

// ============================================
// LOAD FOOTER DYNAMIC CONTENT
// ============================================
async function loadFooterDynamicContent() {
  try {
    console.log('⏳ Loading footer content...');
    
    // Wait for Firebase with 3-second timeout
    const isFirebaseReady = await window.waitForFirebase(3000);

    if (!isFirebaseReady || !window.firebaseInit) {
      console.warn('⚠️ Firebase not available for footer - skipping dynamic content');
      return;
    }
    
    console.log('✅ Firebase ready - loading footer content');

    const { db, collection, query, where, getDocs } = window.firebaseInit;

    // Find footer link containers by ID
    const catalogList = document.getElementById('footer-catalog-links');
    const clientInfoList = document.getElementById('footer-client-info-links');

    if (!catalogList || !clientInfoList) {
      console.warn('⚠️ Footer navigation lists not found');
      return;
    }

    // Clear existing content
    catalogList.innerHTML = '';
    clientInfoList.innerHTML = '';

    // ===== COLUMN 1: Fetch and render CATEGORIES =====
    const categoriesRef = collection(db, 'categories');
    const categoriesQuery = query(categoriesRef, where('isActive', '==', true));
    const categoriesSnapshot = await getDocs(categoriesQuery);

    if (!categoriesSnapshot.empty) {
      categoriesSnapshot.forEach((doc) => {
        const category = doc.data();
        const listItem = document.createElement('li');
        const link = document.createElement('a');
        link.href = `/category.html?slug=${category.slug}`;
        link.className = 'text-gray-400 hover:text-red-500 transition-colors';
        link.textContent = category.name;
        listItem.appendChild(link);
        catalogList.appendChild(listItem);
      });
    }

    // ===== COLUMN 2: Fetch and render PAGES with footerSection='client_info' =====
    const pagesRef = collection(db, 'pages');
    const pagesQuery = query(pagesRef, where('isActive', '==', true));
    const pagesSnapshot = await getDocs(pagesQuery);

    const clientInfoPages = [];
    pagesSnapshot.forEach((doc) => {
      const page = { id: doc.id, ...doc.data() };
      if (page.footerSection === 'client_info') {
        clientInfoPages.push(page);
      }
    });

    if (clientInfoPages.length > 0) {
      clientInfoPages.forEach(page => {
        const listItem = document.createElement('li');
        const link = document.createElement('a');
        link.href = `/page.html?slug=${page.slug}`;
        link.className = 'text-gray-400 hover:text-red-500 transition-colors';
        link.textContent = page.title;
        listItem.appendChild(link);
        clientInfoList.appendChild(listItem);
      });
      console.log('✅ Footer client info pages loaded');
    } else {
      console.log('ℹ️ No client info pages found for footer');
    }

    // Add static links to footer - using consolidated constant in correct order
    STATIC_NAV_LINKS.forEach(link => {
      const listItem = document.createElement('li');
      const anchor = document.createElement('a');
      anchor.href = link.href;
      anchor.className = 'text-gray-400 hover:text-red-500 transition-colors';
      anchor.textContent = link.title;
      listItem.appendChild(anchor);
      clientInfoList.appendChild(listItem);
    });

    // Add social media icons after client info links
    const socialMediaItem = document.createElement('li');
    socialMediaItem.className = 'flex items-center gap-5 mt-6';
    socialMediaItem.innerHTML = `
      <a href="https://instagram.com/latiao_snack" target="_blank" class="hover:opacity-80 transition-opacity">
        <svg class="h-8 w-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="instaGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#f09433"/>
              <stop offset="25%" stop-color="#e6683c"/>
              <stop offset="50%" stop-color="#dc2743"/>
              <stop offset="75%" stop-color="#cc2366"/>
              <stop offset="100%" stop-color="#bc1888"/>
            </linearGradient>
          </defs>
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" fill="url(#instaGrad)"/>
        </svg>
      </a>
      <a href="https://t.me/latiao_snack" target="_blank" class="hover:opacity-80 transition-opacity">
        <svg class="h-8 w-8 text-[#229ED9] fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 11.944 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
      </a>
      <a href="https://www.tiktok.com/@latiao_snack" target="_blank" class="hover:opacity-80 transition-opacity">
        <svg class="h-8 w-8 fill-white hover:opacity-80 transition-opacity" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <title>TikTok</title>
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
        </svg>
      </a>
    `;
    clientInfoList.appendChild(socialMediaItem);

    console.log('✅ Footer social media icons added');

  } catch (error) {
    console.error('❌ Error loading footer dynamic content:', error);
  }
}


// ============================================
// AUTO-LOAD LAYOUT + START SESSION TRACKING
// ============================================

async function initPage() {
  await loadLayout();
  // Track visitor session (fire-and-forget)
  if (typeof window.trackSessionStart === 'function') {
    window.trackSessionStart();
  }
  
  // Add global escape key listener for mobile menu
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      const menu = document.getElementById('mobile-menu');
      if (menu && !menu.classList.contains('-translate-x-full')) {
        window.closeSideMenu();
      }
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPage);
} else {
  // DOM already loaded
  initPage();
}