/**
 * ============================================
 * VALIDATION SCRIPT FOR CUSTOMER DEDUPLICATION
 * ============================================
 * 
 * Цей скрипт перевіряє правильність роботи системи дедуплікації клієнтів
 * та валідації номерів телефонів.
 */

// Імпорт утиліти (якщо працює в Node.js)
let PhoneUtils;
try {
  PhoneUtils = require('./phone-utils.js');
} catch (e) {
  // Browser environment
  if (typeof window !== 'undefined' && window.PhoneUtils) {
    PhoneUtils = window.PhoneUtils;
  } else {
    console.error('❌ PhoneUtils not available');
    process.exit(1);
  }
}

// ============================================
// TEST CASES
// ============================================

const testCases = [
  // Українські номери в різних форматах
  { input: '+380123456789', expected: '380123456789', description: 'Стандартний формат з +' },
  { input: '380123456789', expected: '380123456789', description: 'Без плюса' },
  { input: '0123456789', expected: '380123456789', description: 'З нулем на початку' },
  { input: '123456789', expected: '380123456789', description: 'Короткий мобільний' },
  { input: '+38 (012) 345-67-89', expected: '380123456789', description: 'З розділювачами' },
  { input: '+38 012 345 67 89', expected: '380123456789', description: 'З пробілами' },
  
  // Некоректні номери
  { input: '12345', expected: null, description: 'Надто короткий' },
  { input: '1234567890123456', expected: null, description: 'Надто довгий' },
  { input: '+1234567890', expected: null, description: 'Не український' },
  { input: '', expected: null, description: 'Порожній рядок' },
  { input: 'abc123', expected: null, description: 'Містить літери' },
  
  // Граничні випадки  
  { input: '0501234567', expected: '380501234567', description: 'Vodafone 10 цифр' },
  { input: '+380501234567', expected: '380501234567', description: 'Повний формат' }
];

// ============================================
// RUN TESTS
// ============================================

console.log('🧪 Запуск тестів нормалізації телефонів...\n');

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  const result = PhoneUtils.normalizePhone(testCase.input);
  const isValid = result === testCase.expected;
  
  if (isValid) {
    console.log(`✅ Test ${index + 1}: ${testCase.description}`);
    console.log(`   Input: "${testCase.input}" → Output: "${result}"`);
    passed++;
  } else {
    console.log(`❌ Test ${index + 1}: ${testCase.description}`);
    console.log(`   Input: "${testCase.input}"`);
    console.log(`   Expected: "${testCase.expected}"`);
    console.log(`   Got: "${result}"`);
    failed++;
  }
  console.log('');
});

// ============================================
// TEST VARIANTS GENERATION
// ============================================

console.log('🔍 Тестування генерації варіантів для пошуку...\n');

const testPhone = '380123456789';
const variants = PhoneUtils.getPhoneVariants(testPhone);

console.log(`📱 Для телефону: ${testPhone}`);
console.log('📋 Згенеровані варіанти:');
variants.forEach((variant, i) => {
  console.log(`   ${i + 1}. "${variant}"`);
});

// ============================================
// TEST FORMATTING
// ============================================

console.log('\n🎨 Тестування форматування для відображення...\n');

const formatTests = [
  '380123456789',
  '380501234567',
  '380671234567'
];

formatTests.forEach(phone => {
  const formatted = PhoneUtils.formatPhoneDisplay(phone);
  console.log(`📞 ${phone} → ${formatted}`);
});

// ============================================
// TEST VALIDATION
// ============================================

console.log('\n✅ Тестування валідації...\n');

const validationTests = [
  { input: '380123456789', shouldBeValid: true },
  { input: '380501234567', shouldBeValid: true },
  { input: '1234567890', shouldBeValid: false },
  { input: '38012345', shouldBeValid: false },
  { input: null, shouldBeValid: false }
];

validationTests.forEach(test => {
  const isValid = PhoneUtils.isValidUkrainianPhone(test.input);
  const result = isValid === test.shouldBeValid ? '✅' : '❌';
  console.log(`${result} \"${test.input}\" → ${isValid ? 'Валідний' : 'Невалідний'}`);
});

// ============================================
// RESULTS
// ============================================

console.log('\n' + '='.repeat(50));
console.log('📊 РЕЗУЛЬТАТИ ТЕСТУВАННЯ');
console.log('='.repeat(50));
console.log(`✅ Пройдено: ${passed}`);
console.log(`❌ Невдало: ${failed}`);
console.log(`📈 Успішність: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

if (failed === 0) {
  console.log('\n🎉 Всі тести пройшли успішно! Система готова до використання.');
} else {
  console.log('\n⚠️ Деякі тести не пройшли. Перевірте логіку нормалізації.');
}

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testCases,
    runTests: () => ({ passed, failed })
  };
}