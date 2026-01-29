/**
 * Dynamic Navigation Loader
 * Fetches pages from Firestore and populates header and footer navigation
 */

import { db } from './firebase-config.js';
import { collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

/**
 * Load and render dynamic categories menu
 */
async function loadCategoriesMenu() {
  try {
    // Query active categories from Firestore
    const categoriesRef = collection(db, 'categories');
    const q = query(categoriesRef, where('isActive', '==', true));
    const querySnapshot = await getDocs(q);

    // Desktop catalog menu
    const desktopMenu = document.getElementById('desktop-catalog-menu');
    const mobileContainer = document.getElementById('mobile-catalog-container');

    if (querySnapshot.empty) {
      if (desktopMenu) {
        desktopMenu.innerHTML = '<div class="px-4 py-3 text-gray-500 text-sm">Категорій немає</div>';
      }
      if (mobileContainer) {
        mobileContainer.innerHTML = '<li class="px-2 py-2 text-gray-500 text-sm">Категорій немає</li>';
      }
      return;
    }

    // Build desktop menu HTML
    let desktopHTML = '';
    let mobileHTML = '';

    querySnapshot.forEach((doc) => {
      const category = doc.data();
      
      // Desktop link
      desktopHTML += `
        <a href="category.html?slug=${category.slug}" 
           class="block px-4 py-2 hover:bg-orange-50 hover:text-spicy transition-colors text-gray-700 font-medium">
          ${category.name}
        </a>
      `;
      
      // Mobile link
      mobileHTML += `
        <li>
          <a href="category.html?slug=${category.slug}" 
             class="mobile-menu-link block py-2 text-lg font-medium text-gray-900 hover:text-spicy transition-colors">
            ${category.name}
          </a>
        </li>
      `;
    });

    // Add "All Products" link at the top
    const allProductsDesktop = '<a href="index.html#shop" class="block px-4 py-2 hover:bg-orange-50 hover:text-spicy transition-colors text-gray-700 font-semibold border-b border-gray-100">Всі товари</a>';
    const allProductsMobile = '<li><a href="index.html#shop" class="mobile-menu-link block py-2 text-lg font-semibold text-gray-900 hover:text-spicy transition-colors mb-1">Всі товари</a></li>';

    if (desktopMenu) {
      desktopMenu.innerHTML = allProductsDesktop + desktopHTML;
    }
    if (mobileContainer) {
      mobileContainer.innerHTML = allProductsMobile + mobileHTML;
      
      // Attach close menu listeners to all mobile catalog links
      attachMobileMenuCloseListeners();
    }

  } catch (error) {
    console.error('Error loading categories menu:', error);
    const desktopMenu = document.getElementById('desktop-catalog-menu');
    const mobileContainer = document.getElementById('mobile-catalog-container');
    
    if (desktopMenu) {
      desktopMenu.innerHTML = '<div class="px-4 py-3 text-red-500 text-sm">Помилка завантаження</div>';
    }
    if (mobileContainer) {
      mobileContainer.innerHTML = '<li class="px-2 py-2 text-red-500 text-sm">Помилка завантаження</li>';
    }
  }
}

/**
 * Load and render dynamic navigation links
 */
async function loadDynamicNavigation() {
  try {
    // Query active pages from Firestore
    const pagesRef = collection(db, 'pages');
    const q = query(pagesRef, where('isActive', '==', true));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log('No active pages found');
    }

    // Prepare arrays for different locations
    const headerPages = [];
    const footerPages = [];

    querySnapshot.forEach((doc) => {
      const pageData = doc.data();
      const page = {
        id: doc.id,
        title: pageData.title,
        slug: pageData.slug,
        location: pageData.location,
        footerSection: pageData.footerSection || 'client_info'
      };

      // Sort pages by location
      if (page.location === 'header' || page.location === 'both') {
        headerPages.push(page);
      }
      if (page.location === 'footer' || page.location === 'both') {
        footerPages.push(page);
      }
    });

    // Render navigation links
    renderHeaderNavigation(headerPages);
    renderMobileNavigation(headerPages);
    
    // Footer navigation is now handled exclusively by layout.js
    // Removed renderFooterNavigation() call to prevent double rendering

  } catch (error) {
    console.error('Error loading navigation:', error);
  }
}

/**
 * Render links in desktop header navigation
 */
function renderHeaderNavigation(pages) {
  // Use the same container as layout.js to avoid conflicts
  const headerNav = document.getElementById('desktop-pages-menu');
  
  if (!headerNav) {
    console.warn('Header navigation not found');
    return;
  }

  // Clear existing content to prevent duplicates
  headerNav.innerHTML = '';

  // Render page links
  pages.forEach(page => {
    const link = document.createElement('a');
    link.href = `page.html?slug=${page.slug}`;
    link.className = 'text-gray-600 hover:text-spicy transition-colors font-medium';
    link.textContent = page.title;
    headerNav.appendChild(link);
  });
}

/**
 * Render links in mobile menu navigation
 */
function renderMobileNavigation(pages) {
  const mobileContainer = document.getElementById('mobile-pages-container');
  
  if (!mobileContainer) {
    console.warn('Mobile pages container not found');
    return;
  }

  // Clear existing content
  mobileContainer.innerHTML = '';

  if (pages.length === 0) {
    mobileContainer.innerHTML = '<li class="px-2 py-2 text-gray-500 text-sm">Сторінок немає</li>';
    return;
  }

  pages.forEach(page => {
    const listItem = document.createElement('li');
    const link = document.createElement('a');
    link.href = `page.html?slug=${page.slug}`;
    link.className = 'mobile-menu-link block py-2 text-lg font-medium text-gray-900 hover:text-spicy transition-colors';
    link.textContent = page.title;
    listItem.appendChild(link);
    mobileContainer.appendChild(listItem);
  });

  // Attach close menu listeners to all mobile page links
  attachMobileMenuCloseListeners();
}

/**
 * Attach click listeners to mobile menu links to close menu
 */
function attachMobileMenuCloseListeners() {
  const mobileMenuLinks = document.querySelectorAll('.mobile-menu-link');
  const mobileMenu = document.getElementById('mobileMenu');
  const menuOverlay = document.getElementById('menuOverlay');
  
  mobileMenuLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (mobileMenu) mobileMenu.classList.remove('open');
      if (menuOverlay) menuOverlay.classList.remove('open');
      if (document.body) document.body.classList.remove('menu-open');
    });
  });
}

// ============================================
// FOOTER NAVIGATION REMOVED
// ============================================
// The renderFooterNavigation() function has been removed.
// Footer is now rendered EXCLUSIVELY by layout.js to prevent double rendering.
// This eliminates the "Client Info" column duplication bug.


// Initialize navigation when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    loadCategoriesMenu();
    loadDynamicNavigation();
  });
} else {
  loadCategoriesMenu();
  loadDynamicNavigation();
}

// Export only the navigation loaders (footer is handled by layout.js)
export { loadDynamicNavigation, loadCategoriesMenu };
