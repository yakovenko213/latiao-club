/**
 * LATIAO SNACK - Review System Utilities
 * =====================================
 * 
 * This module provides utility functions for the personalized review system.
 * Use this in both the review page and admin panel for consistency.
 * 
 * Features:
 * - Generate personalized review links
 * - Format order data for review display
 * - Template tag replacement for SMS messages
 * - Review submission helpers
 */

class ReviewSystem {
  /**
   * Configuration - Update these values for your domain
   */
  static CONFIG = {
    domain: 'https://latiao-snack.com.ua',
    reviewPath: '/review',
    firebaseConfig: {
      apiKey: "AIzaSyDyQvItRyL4IKl9NmEItswwPOEiKAbWkMw",
      authDomain: "my-magazin-81c96.firebaseapp.com",
      projectId: "my-magazin-81c96",
      storageBucket: "my-magazin-81c96.firebasestorage.app",
      messagingSenderId: "129061757346",
      appId: "1:129061757346:web:3e7bc5838cc5f7bda992fb"
    }
  }

  /**
   * Generate a personalized review link for an order
   * 
   * @param {string} orderId - The Firebase document ID of the order
   * @param {Object} options - Optional configuration
   * @param {string} options.domain - Custom domain (defaults to CONFIG.domain)
   * @param {string} options.path - Custom path (defaults to CONFIG.reviewPath)
   * @returns {string} The complete review URL with orderId parameter
   * 
   * @example
   * const link = ReviewSystem.generateReviewLink('order123');
   * // Returns: https://latiao-snack.com.ua/review?orderId=order123
   */
  static generateReviewLink(orderId, options = {}) {
    if (!orderId) {
      console.error('❌ ReviewSystem.generateReviewLink: orderId is required')
      return null
    }

    const domain = options.domain || this.CONFIG.domain
    const path = options.path || this.CONFIG.reviewPath

    return `${domain}${path}?orderId=${encodeURIComponent(orderId)}`
  }

  /**
   * Format order data for display in review modal
   * 
   * @param {Object} orderData - Order document from Firestore
   * @returns {Object} Formatted order data with defaults
   * 
   * @example
   * const formatted = ReviewSystem.formatOrderData(orderDoc.data());
   * console.log(formatted.customerName, formatted.items);
   */
  static formatOrderData(orderData) {
    if (!orderData) return null

    return {
      id: orderData.id,
      orderNumber: orderData.orderNumber || 'N/A',
      customerName: orderData.customer?.fullName || 'Клієнт',
      customerPhone: orderData.customer?.phone || '',
      items: Array.isArray(orderData.items) ? orderData.items : [],
      createdAt: orderData.createdAt,
      totalPrice: orderData.totalPrice || 0
    }
  }

  /**
   * Replace template tags in SMS message with order data
   * 
   * Supported tags:
   * - {customer_name} → First name of customer
   * - {order_id} → Short order number
   * - {product_list} → Formatted list of products
   * - {review_link} → Personalized review URL
   * 
   * @param {string} template - Template string with tags
   * @param {Object} order - Order object from Firestore
   * @returns {string} Message with tags replaced
   * 
   * @example
   * const template = "Привіт, {customer_name}! Залишити відгук: {review_link}";
   * const message = ReviewSystem.replaceSmsTemplateTags(template, orderData);
   */
  static replaceSmsTemplateTags(template, order) {
    if (!template || !order) {
      console.error('❌ ReviewSystem.replaceSmsTemplateTags: template and order are required')
      return template
    }

    const customerName = order.customer?.fullName?.split(' ')[0] || 'Шановний клієнте'
    const orderId = order.orderNumber || order.id?.slice(0, 8) || '#0000'
    const fullOrderId = order.id

    // Format product list
    const productList = (order.items || []).map(item => {
      const name = item.name || item.title || 'Товар'
      const article = item.article || item.sku || '0000'
      const quantity = item.quantity || 1
      return `• (арт:${article}) ${name} ×${quantity}`
    }).join('\n')

    // Generate review link
    const reviewLink = this.generateReviewLink(fullOrderId)

    // Replace all tags
    return template
      .replace(/{customer_name}/g, customerName)
      .replace(/{order_id}/g, orderId)
      .replace(/{product_list}/g, productList)
      .replace(/{review_link}/g, reviewLink)
  }

  /**
   * Validate review form data before submission
   * 
   * @param {Object} formData - Form data object
   * @param {string} formData.phoneNumber - Customer phone number
   * @param {number} formData.rating - Star rating (1-5)
   * @param {string} formData.reviewText - Review text content
   * @returns {Object} { valid: boolean, errors: string[] }
   * 
   * @example
   * const validation = ReviewSystem.validateReviewForm(formData);
   * if (!validation.valid) {
   *   validation.errors.forEach(error => console.error(error));
   * }
   */
  static validateReviewForm(formData) {
    const errors = []

    if (!formData.phoneNumber || formData.phoneNumber.trim().length === 0) {
      errors.push('Номер телефону обов\'язковий')
    }

    if (!formData.rating || formData.rating < 1 || formData.rating > 5) {
      errors.push('Оцінка повинна бути від 1 до 5 зірок')
    }

    if (!formData.reviewText || formData.reviewText.trim().length < 20) {
      errors.push('Відгук повинен містити щонайменше 20 символів')
    }

    if (formData.reviewText && formData.reviewText.length > 5000) {
      errors.push('Відгук не може перевищувати 5000 символів')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Get rating emoji based on star count
   * 
   * @param {number} rating - Rating (1-5)
   * @returns {string} Descriptive text with emoji
   */
  static getRatingEmoji(rating) {
    const ratings = {
      1: 'Жахливо 😞',
      2: 'Погано 😕',
      3: 'Нормально 😐',
      4: 'Добре! 🙂',
      5: 'Чудово! ⭐⭐⭐⭐⭐'
    }
    return ratings[rating] || 'Невідома оцінка'
  }

  /**
   * Format phone number for display
   * 
   * @param {string} phone - Phone number (any format)
   * @returns {string} Formatted phone number
   */
  static formatPhoneNumber(phone) {
    if (!phone) return ''
    
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '')
    
    // If it's a Ukrainian number
    if (digits.length >= 10) {
      const last = digits.slice(-10)
      return `+38 (${last.slice(0, 3)}) ${last.slice(3, 6)}-${last.slice(6)}`
    }
    
    return phone
  }

  /**
   * Check if an order is eligible for review request
   * 
   * @param {Object} order - Order object from Firestore
   * @param {Object} options - Options for eligibility check
   * @param {number} options.minDaysAgo - Minimum days since order (default: 0)
   * @param {number} options.maxDaysAgo - Maximum days since order (default: 90)
   * @returns {boolean} true if eligible for review request
   */
  static isOrderEligibleForReview(order, options = {}) {
    const minDaysAgo = options.minDaysAgo || 0
    const maxDaysAgo = options.maxDaysAgo || 90

    // Check if order exists
    if (!order || !order.id) return false

    // Check if order is completed/delivered
    const status = order.status || ''
    if (!['delivered', 'completed', 'finished'].includes(status.toLowerCase())) {
      return false
    }

    // Check if review already submitted
    if (order.reviewSubmittedAt || order.reviewId) {
      return false
    }

    // Check if within the review window (e.g., 0-90 days after delivery)
    if (order.deliveredAt || order.createdAt) {
      const orderDate = new Date(
        order.deliveredAt?.toDate?.() || 
        order.createdAt?.toDate?.() || 
        order.deliveredAt || 
        order.createdAt
      )
      const now = new Date()
      const daysAgo = (now - orderDate) / (1000 * 60 * 60 * 24)

      if (daysAgo < minDaysAgo || daysAgo > maxDaysAgo) {
        return false
      }
    }

    return true
  }

  /**
   * Create a review data object for Firestore
   * 
   * @param {Object} data - Review form data
   * @param {string} data.orderId - Associated order ID
   * @param {number} data.rating - Star rating (1-5)
   * @param {string} data.text - Review text
   * @param {string} data.phoneNumber - Customer phone
   * @param {string} data.photoUrl - Optional photo URL
   * @returns {Object} Review object ready for Firestore
   */
  static createReviewObject(data) {
    return {
      orderId: data.orderId,
      phoneNumber: data.phoneNumber,
      rating: parseInt(data.rating),
      text: data.text.trim(),
      status: 'pending', // Always pending for moderation
      source: 'personalized_review_link',
      photoUrl: data.photoUrl || null,
      customerName: data.customerName || null,
      createdAt: new Date(),
      // Metadata for admin panel
      ip: null, // Set by admin panel if needed
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null
    }
  }

  /**
   * Generate a summary of an order for review preview
   * 
   * @param {Object} order - Order object
   * @returns {string} Formatted order summary
   */
  static generateOrderSummary(order) {
    if (!order) return ''

    const lines = [
      `Замовлення #${order.orderNumber || order.id.slice(0, 8)}`,
      `Дата: ${order.createdAt ? new Date(order.createdAt.toDate?.() || order.createdAt).toLocaleDateString('uk-UA') : 'N/A'}`,
      `Сума: ₴${order.totalPrice || 0}`,
      '',
      'Товари:'
    ]

    if (order.items && Array.isArray(order.items)) {
      order.items.forEach(item => {
        lines.push(`  • ${item.name || item.title} (×${item.quantity || 1})`)
      })
    }

    return lines.join('\n')
  }
}

// Export for use in both browser and Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ReviewSystem
}

if (typeof window !== 'undefined') {
  window.ReviewSystem = ReviewSystem
}
