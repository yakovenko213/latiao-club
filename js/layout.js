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
        <p class="inline-flex items-center gap-2">
          © 2026 Latiao Snack. Всі права захищені.
          <a href="/admin.html" title="Вхід для персоналу" class="text-gray-700 hover:text-spicy transition-colors">
            <i data-lucide="lock" class="w-4 h-4"></i>
          </a>
        </p>
      </div>
    </div>
  </footer>
`;

// HTML Template for Header, Mobile Menu, Cart Sidebar, Toast Container
const headerTemplate = `
  <!-- Toast Container -->
  <div id="toast-container" class="fixed top-4 right-4 z-[60] flex flex-col gap-2"></div>

  <!-- Header -->
  <header class="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md z-50 border-b border-gray-100">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16 lg:h-20">
        <a href="/index.html" class="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 70" class="h-10 md:h-12 w-auto" preserveAspectRatio="xMinYMid meet">
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
              <text x="198" y="46" font-family="Poppins, Inter, Manrope, Arial, sans-serif" font-size="36" font-weight="700" fill="#333333">Snack</text>
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
        <div class="flex items-center gap-1 sm:gap-2">
          <button disabled class="relative p-2 rounded-full text-gray-700 transition-colors cursor-not-allowed opacity-70 pointer-events-none" aria-label="User profile">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span class="absolute -top-1 -right-1 bg-yellow-100 text-yellow-800 text-xs font-medium px-1.5 py-0.5 rounded-full border border-yellow-200">Скоро</span>
          </button>
          <button onclick="window.openCart()" class="relative p-2 hover:bg-orange-50 rounded-full text-gray-700 hover:text-orange-500 transition-colors" aria-label="Open cart">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            <span id="cart-badge" class="absolute -top-1 -right-1 w-5 h-5 bg-spicy text-white text-xs font-bold rounded-full flex items-center justify-center hidden">0</span>
          </button>
          <button id="mobile-menu-btn" onclick="window.toggleMobileMenu()" class="lg:hidden p-2 hover:bg-orange-50 rounded-full text-gray-700 hover:text-orange-500 transition-colors z-50" aria-label="Toggle menu">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </header>

  <!-- Mobile Menu Overlay -->
  <div id="menu-overlay" onclick="window.toggleMobileMenu()" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] lg:hidden hidden transition-opacity duration-300"></div>

  <!-- Mobile Menu -->
  <div id="mobile-menu" class="fixed top-0 right-0 bottom-0 h-full w-80 max-w-[85vw] shadow-2xl z-[9999] overflow-hidden lg:hidden translate-x-full transition-transform duration-300 ease-in-out">
    <!-- Animated Background with Floating Emojis -->
    <div class="absolute inset-0 bg-gradient-to-br from-red-600 via-orange-600 to-red-700 overflow-hidden">
      <!-- Floating Chili Peppers and Flags -->
      <div class="floating-emojis">
        <span class="emoji-float" style="left: 10%; animation-delay: 0s; font-size: 2rem;">🌶️</span>
        <span class="emoji-float" style="left: 30%; animation-delay: 1s; font-size: 1.5rem;">🇨🇳</span>
        <span class="emoji-float" style="left: 50%; animation-delay: 2s; font-size: 2.5rem;">🌶️</span>
        <span class="emoji-float" style="left: 70%; animation-delay: 0.5s; font-size: 1.8rem;">🇨🇳</span>
        <span class="emoji-float" style="left: 85%; animation-delay: 1.5s; font-size: 2rem;">🌶️</span>
        <span class="emoji-float" style="left: 15%; animation-delay: 2.5s; font-size: 1.6rem;">🔥</span>
        <span class="emoji-float" style="left: 60%; animation-delay: 3s; font-size: 2.2rem;">🇨🇳</span>
        <span class="emoji-float" style="left: 40%; animation-delay: 1.8s; font-size: 1.7rem;">🌶️</span>
        <span class="emoji-float" style="left: 75%; animation-delay: 2.2s; font-size: 1.9rem;">🔥</span>
        <span class="emoji-float" style="left: 25%; animation-delay: 3.5s; font-size: 2.1rem;">🇨🇳</span>
      </div>
    </div>
    
    <!-- Content Overlay with Glassmorphism -->
    <div class="relative z-10 h-full overflow-y-auto backdrop-blur-sm bg-black/30">
      <div class="p-6">
        <div class="flex justify-end mb-8">
          <button onclick="window.toggleMobileMenu()" class="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full transition-colors" aria-label="Close menu">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <h2 class="text-3xl font-black text-white mb-8 drop-shadow-lg">🌶️ Меню</h2>
        <nav class="space-y-1">
          <div class="px-6 pb-4">
            <p class="text-xs font-bold text-orange-200 uppercase tracking-wider mb-3 drop-shadow">Каталог</p>
            <ul id="mobile-catalog-container" class="space-y-2">
              <li class="text-white/60 text-sm">Завантаження...</li>
            </ul>
          </div>
          <div class="px-6 pt-2 border-t border-white/20">
            <p class="text-xs font-bold text-orange-200 uppercase tracking-wider mb-3 mt-4 drop-shadow">Інфо</p>
            <ul id="mobile-pages-container" class="space-y-2">
              <li class="text-white/60 text-sm">Завантаження...</li>
            </ul>
          </div>
        </nav>
        <div class="mt-8 pt-8 border-t border-white/20">
          <p class="text-sm text-orange-200 mb-3 font-semibold drop-shadow">Зв'яжіться з нами</p>
          <div class="flex flex-col gap-3">
            <!-- Instagram Button -->
            <a href="https://instagram.com/latiao_snack" target="_blank" class="flex items-center gap-3 px-4 py-3 rounded-xl text-white shadow-md hover:opacity-90 transition-opacity" style="background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);">
              <svg class="h-6 w-6 fill-white flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              <span class="font-semibold">Підписатися на Instagram</span>
            </a>
            
            <!-- Telegram Button -->
            <a href="https://t.me/sales_latiao" target="_blank" class="flex items-center gap-3 px-4 py-3 rounded-xl text-white shadow-md hover:opacity-90 transition-opacity" style="background: #229ED9;">
              <svg class="h-6 w-6 fill-white flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 11.944 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
              <span class="font-semibold">Написати в Telegram</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>

  <style>
    /* Floating Emoji Animation */
    .floating-emojis {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }
    
    .emoji-float {
      position: absolute;
      bottom: -100px;
      animation: floatUp 15s infinite ease-in-out;
      opacity: 0.4;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
    }
    
    @keyframes floatUp {
      0% {
        transform: translateY(0) rotate(0deg);
        opacity: 0;
      }
      10% {
        opacity: 0.4;
      }
      90% {
        opacity: 0.4;
      }
      100% {
        transform: translateY(-120vh) rotate(360deg);
        opacity: 0;
      }
    }
    
    /* Enhanced Mobile Menu Links */
    .mobile-menu-link {
      display: block;
      padding: 0.875rem 1rem;
      font-size: 1rem;
      font-weight: 700;
      color: white;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border-radius: 0.75rem;
      transition: all 0.3s ease;
      border: 1px solid rgba(255, 255, 255, 0.2);
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }
    
    .mobile-menu-link:hover {
      background: rgba(255, 107, 0, 0.8);
      transform: translateX(5px);
      box-shadow: 0 4px 12px rgba(255, 107, 0, 0.4);
      border-color: rgba(255, 255, 255, 0.4);
    }
  </style>

  <!-- Cart Overlay -->
  <div id="cart-overlay" onclick="window.closeCart()" class="fixed inset-0 bg-black/50 z-[40] pointer-events-auto hidden transition-opacity"></div>

  <!-- Cart Sidebar -->
  <div id="cart-sidebar" class="fixed top-0 right-0 h-full w-full md:w-[500px] bg-white shadow-2xl z-[50] pointer-events-auto transform translate-x-full transition-transform duration-300 ease-in-out flex flex-col">
    <header class="sticky top-0 bg-white z-40 px-5 py-4 border-b border-gray-100">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-extrabold text-gray-900">Кошик</h1>
          <p class="text-sm text-gray-500 mt-0.5">Перевір замовлення перед оформленням</p>
        </div>
        <button onclick="window.closeCart()" class="close-btn w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </header>
    <main class="flex-1 overflow-y-auto pb-56">
      <div class="px-5 pt-4 space-y-3">
        <div id="min-order-notice" class="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 flex items-center gap-3 hidden">
          <span class="text-xl">⚠️</span>
          <p class="text-sm font-medium text-red-700">Мінімальна сума замовлення — 100 грн</p>
        </div>
        <div class="bg-green-50 border border-green-100 rounded-2xl px-4 py-3 flex items-center gap-3">
          <span class="text-xl">🚚</span>
          <p class="text-sm font-medium text-green-700">Безкоштовна доставка від 1 100 грн</p>
        </div>
        <div id="delivery-progress" class="bg-orange-50 border border-orange-100 rounded-2xl p-4 hidden">
          <div class="flex items-center justify-between mb-2">
            <p id="delivery-text" class="text-sm font-semibold text-gray-700"></p>
            <span id="delivery-amount" class="text-sm font-bold text-spicy"></span>
          </div>
          <div class="h-3 bg-orange-100 rounded-full overflow-hidden">
            <div id="delivery-bar" class="progress-bar-fill h-full bg-gradient-to-r from-spicy to-yellow-500 rounded-full" style="width: 0%"></div>
          </div>
        </div>
      </div>
      <div id="cart-items" class="px-5 pt-4 space-y-4 hidden"></div>
      <div id="empty-state" class="px-5 py-16 text-center">
        <div class="w-24 h-24 mx-auto mb-6 bg-orange-50 rounded-full flex items-center justify-center">
          <span class="text-5xl">🛍️</span>
        </div>
        <h2 class="text-xl font-bold text-gray-900 mb-2">Ваш кошик порожній</h2>
        <p class="text-gray-500 mb-6">Додайте смачні снеки до кошика</p>
        <button onclick="window.closeCart(); window.location.href='index.html#shop'" class="btn-press inline-flex items-center gap-2 bg-gradient-to-r from-spicy to-orange-500 text-white font-semibold px-6 py-3 rounded-2xl shadow-lg shadow-orange-200">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          Повернутися до покупок
        </button>
      </div>
    </main>
    <footer id="cart-summary" class="sticky bottom-0 bg-white border-t border-gray-100 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.1)] rounded-t-3xl z-40 hidden">
      <div class="px-5 py-4">
        <div class="space-y-2 mb-4">
          <div class="flex justify-between text-sm">
            <span class="text-gray-500"><span id="items-count">0</span> товарів</span>
            <span id="subtotal" class="font-medium text-gray-700">0 грн</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">Доставка</span>
            <span id="delivery-cost" class="font-medium text-gray-700">Від 70 грн</span>
          </div>
          <div class="h-px bg-gray-100 my-2"></div>
          <div class="flex justify-between">
            <span class="font-bold text-gray-900">Разом</span>
            <span id="total" class="text-xl font-extrabold text-spicy">0 грн</span>
          </div>
        </div>
        <button id="checkout-btn" onclick="window.checkout()" disabled class="btn-press w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed bg-gradient-to-r from-spicy to-orange-500 text-white shadow-lg shadow-orange-200">
          Оформити замовлення
        </button>
      </div>
    </footer>
  </div>
`;

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
    
    if (!giftsDoc.exists()) {
      console.log('ℹ️ Немає активних подарунків');
      return;
    }
    
    const giftsData = giftsDoc.data();
    const activeGiftIds = giftsData.activeGiftIds || [];
    
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
window.showToast = function(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast-enter px-4 py-3 rounded-2xl shadow-lg flex items-center gap-2 ${
    type === 'success' ? 'bg-gray-900 text-white' : 'bg-orange-500 text-white'
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

// Render cart UI
function renderCart() {
  const container = document.getElementById('cart-items');
  if (!container) return;
  
  if (window.cart.length === 0) {
    container.innerHTML = '';
    document.getElementById('empty-state')?.classList.remove('hidden');
    document.getElementById('cart-items')?.classList.add('hidden');
    document.getElementById('cart-summary')?.classList.add('hidden');
    document.getElementById('delivery-progress')?.classList.add('hidden');
    return;
  }
  
  document.getElementById('empty-state')?.classList.add('hidden');
  document.getElementById('cart-items')?.classList.remove('hidden');
  document.getElementById('cart-summary')?.classList.remove('hidden');
  document.getElementById('delivery-progress')?.classList.remove('hidden');
  
  container.innerHTML = window.cart.map((item, cartIndex) => {
    const qty = item.quantity || item.qty || 1;
    const imageUrl = item.image || item.imageUrl || 'https://placehold.co/100x100/fff3e8/ff6b00?text=Latiao';
    const isGift = item.isGift === true;
    
    return `
      <div class="cart-item-enter card-hover bg-white border border-gray-100 rounded-3xl p-4 shadow-sm ${isGift ? 'border-green-200 bg-green-50/30' : ''}" data-cart-index="${cartIndex}">
        ${isGift ? '<div class="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">🎁 Подарунок</div>' : ''}
        <div class="flex gap-4">
          <div class="w-20 h-20 flex-shrink-0 bg-orange-50 rounded-2xl overflow-hidden ${isGift ? 'ring-2 ring-green-400' : ''}">
            <img src="${imageUrl}" alt="${item.name}" class="w-full h-full object-cover">
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2">
              <div>
                <h3 class="font-bold text-gray-900 truncate">${item.name}</h3>
                ${isGift ? '<p class="text-xs text-green-600 font-semibold mt-0.5">🎁 Подарунок від Latiao Snack</p>' : `<p class="text-xs mt-0.5">${renderSpiciness(item.spiciness)}</p>`}
              </div>
              <button onclick="window.removeItemByIndex(${cartIndex})" class="btn-press flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>
            <div class="flex items-center justify-between mt-3">
              ${!isGift ? `
              <div class="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                <button onclick="window.updateQtyByIndex(${cartIndex}, -1)" class="qty-btn w-8 h-8 rounded-lg bg-white flex items-center justify-center font-bold text-gray-600 shadow-sm">−</button>
                <span class="w-8 text-center font-bold text-gray-900">${qty}</span>
                <button onclick="window.updateQtyByIndex(${cartIndex}, 1)" ${qty >= (item.stock || 999) ? 'disabled' : ''} class="qty-btn w-8 h-8 rounded-lg bg-white flex items-center justify-center font-bold text-gray-600 shadow-sm">+</button>
              </div>
              ` : `
              <div class="text-sm text-green-600 font-semibold">Безкоштовно</div>
              `}
              <div class="text-right">
                <p class="text-lg font-extrabold ${isGift ? 'text-green-600' : 'text-spicy'}">${isGift ? '0 грн' : (item.price * qty) + ' грн'}</p>
                ${qty > 1 && !isGift ? `<p class="text-xs text-gray-400">${item.price} грн/шт</p>` : ''}
              </div>
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
  
  // Update checkout button
  const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn) {
    if (window.cart.length === 0 || total < 100) {
      checkoutBtn.disabled = true;
    } else {
      checkoutBtn.disabled = false;
    }
  }
}

// Add product to cart
window.addToCart = function(product) {
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
};

// Update quantity (LEGACY - kept for backward compatibility)
window.updateQty = function(productId, delta) {
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
window.updateQtyByIndex = function(cartIndex, delta) {
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

// Remove item from cart (LEGACY - kept for backward compatibility)
window.removeItem = function(productId) {
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
window.removeItemByIndex = function(cartIndex) {
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

// Open cart
window.openCart = function() {
  const sidebar = document.getElementById('cart-sidebar');
  const overlay = document.getElementById('cart-overlay');
  
  if (sidebar && overlay) {
    sidebar.classList.remove('translate-x-full');
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
};

// Close cart
window.closeCart = function() {
  const sidebar = document.getElementById('cart-sidebar');
  const overlay = document.getElementById('cart-overlay');
  
  if (sidebar && overlay) {
    sidebar.classList.add('translate-x-full');
    overlay.classList.add('hidden');
    document.body.style.overflow = '';
  }
};

// Toggle mobile menu
window.toggleMobileMenu = function() {
  console.log('🍔 toggleMobileMenu called');
  
  const menu = document.getElementById('mobile-menu');
  const overlay = document.getElementById('menu-overlay');
  
  if (!menu || !overlay) {
    console.error('❌ Mobile menu elements not found!', { menu, overlay });
    return;
  }
  
  // Check if menu is currently CLOSED (translate-x-full means hidden/closed)
  const isClosed = menu.classList.contains('translate-x-full');
  
  console.log('📍 Menu state:', isClosed ? 'CLOSED' : 'OPEN');
  
  if (isClosed) {
    // Open the menu
    console.log('✅ Opening menu...');
    menu.classList.remove('translate-x-full');
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Prevent body scroll
  } else {
    // Close the menu
    console.log('✅ Closing menu...');
    menu.classList.add('translate-x-full');
    overlay.classList.add('hidden');
    document.body.style.overflow = ''; // Restore body scroll
  }
};

// Checkout
window.checkout = function() {
  const total = calculateTotal();
  if (total < 100) {
    window.showToast('Мінімальна сума — 100 грн', 'warning');
    return;
  }
  window.location.href = 'checkout.html';
};

// ============================================
// LOAD NAVIGATION (Categories + Pages)
// ============================================

let navigationCache = null; // Cache для швидкого завантаження
const CACHE_KEY = 'latiao_nav_timestamp'; // LocalStorage key to track when to invalidate cache

/**
 * Clear navigation cache - use this after deleting pages/categories
 */
window.clearNavigationCache = function() {
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
    
    // Wait for Firebase to be available
    let attempts = 0;
    while (!window.firebaseInit && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (!window.firebaseInit) {
      console.warn('⚠️ Firebase not available for navigation - using fallback');
      renderNavigationFallback();
      return;
    }

    const { db, collection, getDocs, query, where } = window.firebaseInit;
    
    // Паралельне завантаження категорій та сторінок
    const [categoriesSnap, pagesSnap] = await Promise.all([
      getDocs(query(collection(db, 'categories'), where('isActive', '==', true))),
      getDocs(query(collection(db, 'pages'), where('isActive', '==', true)))
    ]);
    
    const categories = categoriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const pages = pagesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Зберігаємо в кеш з timestamp
    navigationCache = { 
      categories, 
      pages,
      _timestamp: Date.now()
    };
    
    console.log(`✅ Завантажено: ${categories.length} категорій, ${pages.length} сторінок`);
    
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
  if (desktopPages && pages.length > 0) {
    const headerPages = pages.filter(p => p.location === 'header' || p.location === 'both');
    desktopPages.innerHTML = headerPages.map(page => 
      `<a href="/page.html?slug=${page.slug}" class="text-gray-600 hover:text-spicy transition-colors font-medium">${page.title}</a>`
    ).join('');
  }
  
  // === MOBILE CATALOG ===
  const mobileCatalog = document.getElementById('mobile-catalog-container');
  if (mobileCatalog && categories.length > 0) {
    mobileCatalog.innerHTML = categories.map(cat => 
      `<li><a href="/category.html?slug=${cat.slug}" class="mobile-menu-link">${cat.name}</a></li>`
    ).join('');
  } else if (mobileCatalog) {
    mobileCatalog.innerHTML = '<li class="text-white/60 text-sm">Категорій немає</li>';
  }
  
  // === MOBILE PAGES ===
  const mobilePages = document.getElementById('mobile-pages-container');
  if (mobilePages && pages.length > 0) {
    const headerPages = pages.filter(p => p.location === 'header' || p.location === 'both');
    mobilePages.innerHTML = headerPages.map(page => 
      `<li><a href="/page.html?slug=${page.slug}" class="mobile-menu-link">${page.title}</a></li>`
    ).join('');
  }
  
  // Reinit Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function renderNavigationFallback() {
  // Fallback якщо Firebase не завантажився
  const desktopCatalog = document.getElementById('desktop-catalog-menu');
  const mobileCatalog = document.getElementById('mobile-catalog-container');
  const mobilePages = document.getElementById('mobile-pages-container');
  
  if (desktopCatalog) {
    desktopCatalog.innerHTML = '<div class="px-4 py-3 text-gray-400 text-sm">Помилка завантаження</div>';
  }
  
  if (mobileCatalog) {
    mobileCatalog.innerHTML = '<li class="text-gray-400 text-sm">Помилка завантаження</li>';
  }
  
  if (mobilePages) {
    mobilePages.innerHTML = '<li class="text-gray-400 text-sm">Помилка завантаження</li>';
  }
}

// ============================================
// MAIN EXPORT FUNCTION
// ============================================

export function loadLayout() {
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
  
  // Mark layout as loaded
  document.body.setAttribute('data-layout-loaded', 'true');
  
  console.log('✅ Layout HTML вставлено');
  
  // Initialize Lucide icons if available
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
    console.log('✅ Lucide іконки ініціалізовані');
  }
  
  // Render cart and update badges
  renderCart();
  updateBadges();
  
  // Render footer if placeholder exists
  renderFooter();
  
  // Load navigation (async, non-blocking)
  loadNavigation();
  
  // Fetch and inject gifts into cart (async)
  fetchAndInjectGifts();
  
  // Add event listeners for mobile menu links
  setTimeout(() => {
    document.querySelectorAll('.mobile-menu-link').forEach(link => {
      link.addEventListener('click', () => {
        window.toggleMobileMenu();
      });
    });
    
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
    // Wait for Firebase to be available
    let attempts = 0;
    while (!window.firebaseInit && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (!window.firebaseInit) {
      console.warn('⚠️ Firebase not available for footer - skipping dynamic content');
      return;
    }

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
      console.log('✅ Footer categories loaded');
    } else {
      console.log('ℹ️ No active categories found for footer');
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
// AUTO-LOAD LAYOUT
// ============================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadLayout);
} else {
  // DOM already loaded
  loadLayout();
}