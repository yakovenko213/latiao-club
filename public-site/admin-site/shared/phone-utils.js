/**
 * ============================================
 * CENTRALIZED PHONE NUMBER UTILITY
 * ============================================
 * 
 * Цей модуль забезпечує єдиний стандарт для нормалізації номерів телефонів
 * у всьому проекті щоб запобігти дублікатам клієнтів.
 * 
 * @author Senior Backend Developer
 * @description Централізована утиліта для роботи з номерами телефонів
 */

/**
 * Нормалізує номер телефону до стандартного формату
 * 
 * @param {string} rawPhone - Необроблений номер телефону
 * @returns {string|null} - Нормалізований номер (38XXXXXXXXXX) або null якщо невалідний
 */
function normalizePhone(rawPhone) {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return null;
  }
  
  // Видаляємо всі нецифрові символи
  let digits = rawPhone.replace(/\D/g, '');
  
  if (!digits) {
    return null;
  }
  
  // Українські номери: приводимо до формату 38XXXXXXXXXX
  if (digits.startsWith('380')) {
    // Вже в правильному форматі
    return digits.length === 12 ? digits : null;
  } else if (digits.startsWith('38') && digits.length === 12) {
    // Може бути 38XXXXXXXXXX без 0 після 38
    return digits;
  } else if (digits.startsWith('0')) {
    // Locale format: 0XXXXXXXXX -> 38XXXXXXXXXX
    if (digits.length === 10) {
      return '38' + digits;
    }
  } else if (!digits.startsWith('38') && digits.length === 9) {
    // Mobile without prefix: XXXXXXXXX -> 380XXXXXXXXX
    return '380' + digits;
  }
  
  // Відхиляємо неукраїнські номери (не починаються з 38 і не відповідають форматам вище)
  if (!digits.startsWith('38') && digits.length >= 10) {
    return null;
  }
  
  // Якщо довжина не підходить, повертаємо null
  if (digits.length < 9 || digits.length > 13) {
    return null;
  }
  
  // Default: припускаємо що це українській номер
  if (digits.length === 10 && digits.startsWith('0')) {
    return '38' + digits;
  }
  
  return digits;
}

/**
 * Форматує нормалізований номер для відображення: +38 (0XX) XXX-XX-XX
 * 
 * @param {string} normalizedPhone - Нормалізований номер (38XXXXXXXXXX)
 * @returns {string} - Відформатований номер для показу
 */
function formatPhoneDisplay(normalizedPhone) {
  if (!normalizedPhone || normalizedPhone.length !== 12) {
    return normalizedPhone || '';
  }
  
  // 380XXXXXXXXX -> +38 (0XX) XXX-XX-XX
  const countryCode = normalizedPhone.slice(0, 2); // 38
  const operatorCode = normalizedPhone.slice(3, 5); // XX
  const part1 = normalizedPhone.slice(5, 8); // XXX
  const part2 = normalizedPhone.slice(8, 10); // XX
  const part3 = normalizedPhone.slice(10, 12); // XX
  
  return `+${countryCode} (0${operatorCode}) ${part1}-${part2}-${part3}`;
}

/**
 * Генерує всі можливі варіанти написання телефону для пошуку в базі
 * Використовується для знаходження дублікатів в існуючих даних
 * 
 * @param {string} normalizedPhone - Нормалізований номер (38XXXXXXXXXX)
 * @returns {string[]} - Масив всіх можливих варіантів
 */
function getPhoneVariants(normalizedPhone) {
  if (!normalizedPhone) return [];
  
  const variants = new Set();
  
  // Основний нормалізований формат
  variants.add(normalizedPhone); // 380123456789
  
  // З плюсом
  variants.add('+' + normalizedPhone); // +380123456789
  
  // Без 38, з 0 на початку  
  if (normalizedPhone.startsWith('38')) {
    const withZero = '0' + normalizedPhone.slice(2); // 0123456789
    variants.add(withZero);
    variants.add('+38' + withZero.slice(1)); // +38123456789
  }
  
  // Мобільний без префіксів (рідко але буває)
  if (normalizedPhone.startsWith('380')) {
    variants.add(normalizedPhone.slice(3)); // 123456789
  }
  
  return Array.from(variants);
}

/**
 * Валідує чи є номер телефону валідним українським номером
 * 
 * @param {string} phone - Номер телефону (в будь-якому форматі)
 * @returns {boolean} - true якщо номер валідний
 */
function isValidUkrainianPhone(phone) {
  const normalized = normalizePhone(phone);
  if (!normalized) return false;
  
  // Перевіряємо чи це український номер
  if (!normalized.startsWith('38')) return false;
  
  // Перевіряємо довжину (38XXXXXXXXXX = 12 символів)
  if (normalized.length !== 12) return false;
  
  // Перевіряємо валідні українські оператори (починаються з 0XX форматі)
  const operatorPrefix = normalized.slice(2, 4);
  const validPrefixes = [
    '09', '05', '06', '09', '09', '09', '09', '09', '09', '09',
    '50', '66', '95', '99', // Vodafone
    '67', '68', '96', '97', '98', // Kyivstar  
    '63', '73', '93', // lifecell
    '91', '92', '94', // Utel, PEOPLEnet
  ];
  
  // Спрощена перевірка - якщо починається з 0 то ОК
  return operatorPrefix.startsWith('0') || validPrefixes.includes(operatorPrefix);
}

/**
 * Створює customer ID із нормалізованого телефону
 * 
 * @param {string} phone - Вхідний номер телефону
 * @returns {string|null} - ID клієнта для використання в Firestore
 */
function createCustomerId(phone) {
  const normalized = normalizePhone(phone);
  if (!normalized || !isValidUkrainianPhone(normalized)) {
    return null;
  }
  return normalized; // Використовуємо нормалізований телефон як ID
}

/**
 * Порівнює два номери телефону на ідентичність (незалежно від форматування)
 * 
 * @param {string} phone1 - Перший номер
 * @param {string} phone2 - Другий номер
 * @returns {boolean} - true якщо номери ідентичні
 */
function phonesMatch(phone1, phone2) {
  const norm1 = normalizePhone(phone1);
  const norm2 = normalizePhone(phone2);
  
  return norm1 && norm2 && norm1 === norm2;
}

// ============================================
// EXPORT FOR NODE.JS AND BROWSER
// ============================================

if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = {
    normalizePhone,
    formatPhoneDisplay,
    getPhoneVariants,
    isValidUkrainianPhone,
    createCustomerId,
    phonesMatch
  };
} else if (typeof window !== 'undefined') {
  // Browser environment
  window.PhoneUtils = {
    normalizePhone,
    formatPhoneDisplay,
    getPhoneVariants,
    isValidUkrainianPhone,
    createCustomerId,
    phonesMatch
  };
}