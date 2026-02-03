// ============================================
// REVIEW MODERATION - ENHANCED v2.0
// Date Management, Quick Edit, Modern UI
// ============================================

// Store current date picker state
let datePickerState = {
  reviewId: null,
  originalDate: null,
  selectedDate: null
}

// Store current quick edit state
let quickEditState = {
  reviewId: null,
  originalText: null
}

// ============================================
// RENDER MODERN PENDING REVIEWS
// ============================================

function renderModernPendingReviews() {
  const grid = document.getElementById('pending-reviews-grid')
  if (!grid) return
  
  if (pendingReviews.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full text-center py-16">
        <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i data-lucide="check-circle" class="w-10 h-10 text-green-500"></i>
        </div>
        <h3 class="text-lg font-semibold text-gray-700 mb-2">Все перевірено! 🎉</h3>
        <p class="text-gray-500">Немає нових відгуків на модерацію</p>
      </div>`
    lucide.createIcons()
    return
  }

  grid.innerHTML = pendingReviews.map(review => {
    const stars = '★'.repeat(review.rating || 0) + '☆'.repeat(5 - (review.rating || 0))
    const createdDate = review.createdAt?.toDate?.() || new Date()
    const dateStr = createdDate.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' })
    const timeStr = createdDate.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
    const relativeTime = formatRelativeTime(createdDate)
    
    const photos = review.photos || (review.photoUrl ? [review.photoUrl] : [])
    const hasPhotos = photos.length > 0
    
    const productName = review.productId && window.productsCache?.[review.productId]?.name 
      ? window.productsCache[review.productId].name 
      : null
    
    const normalizedPhone = normalizePhoneForLookup(review.phone)
    const foundCustomer = normalizedPhone ? reviewCustomersCache[normalizedPhone] : null

    return `
      <div class="review-card">
        <!-- Photo Gallery (if exists) -->
        ${hasPhotos ? `
          <div class="bg-gray-50 border-b border-gray-100 p-3">
            <div class="review-photo-gallery">
              ${photos.map((url, idx) => `
                <div class="relative flex-shrink-0 group">
                  <img 
                    src="${url}" 
                    alt="Review photo ${idx + 1}" 
                    class="h-32 w-32 object-cover rounded-lg cursor-pointer hover:opacity-75 transition"
                    onclick="openPhotoViewer('${url}')"
                    loading="lazy"
                  >
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-lg transition flex items-center justify-center">
                    <i data-lucide="eye" class="w-5 h-5 text-white"></i>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>` : ''}

        <!-- Card Header with Rating -->
        <div class="p-5 border-b border-gray-100">
          <div class="flex items-start justify-between mb-3">
            <div class="flex-1">
              <!-- Rating -->
              <div class="flex items-center gap-3 mb-2">
                <span class="text-2xl text-yellow-400">${stars}</span>
                <span class="text-xs font-semibold bg-yellow-50 text-yellow-700 px-2 py-1 rounded">
                  ${review.rating}/5
                </span>
                <span class="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs font-medium">
                  <i data-lucide="clock" class="w-3 h-3"></i>
                  На модерації
                </span>
              </div>
              
              <!-- Product Info -->
              ${productName ? `
                <div class="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded inline-block mb-2 flex items-center gap-1">
                  <i data-lucide="package" class="w-3 h-3"></i>
                  ${productName}
                </div>` : ''}
              
              <!-- Customer Name -->
              <div class="text-sm font-semibold text-gray-900 mb-1">${review.name || 'Анонім'}</div>
              
              <!-- Customer Info -->
              <div class="flex flex-col gap-1 text-xs text-gray-600">
                <div class="flex items-center gap-1">
                  <i data-lucide="phone" class="w-3 h-3"></i>
                  <span class="font-mono">${formatPhoneNumber(review.phone)}</span>
                </div>
                ${foundCustomer ? `
                  <div class="flex items-center gap-1 text-green-600 font-medium">
                    <i data-lucide="check-circle" class="w-3 h-3"></i>
                    Верифікований клієнт
                  </div>
                ` : `
                  <div class="flex items-center gap-1 text-gray-500">
                    <i data-lucide="help-circle" class="w-3 h-3"></i>
                    Не знайдено в базі даних
                  </div>
                `}
              </div>
            </div>
            
            <!-- Created Date (right aligned) -->
            <div class="text-right">
              <div class="text-xs font-medium text-gray-700">${dateStr}</div>
              <div class="text-xs text-gray-500">${timeStr}</div>
              <div class="text-xs text-blue-600 font-medium mt-1" title="${createdDate.toLocaleString('uk-UA')}">
                ${relativeTime}
              </div>
            </div>
          </div>
        </div>

        <!-- Card Content -->
        ${review.comment ? `
          <div class="p-5 border-b border-gray-100">
            <div class="text-sm text-gray-700 leading-relaxed line-clamp-3">
              ${review.comment}
            </div>
          </div>` : ''}

        <!-- Date Management Section -->
        <div class="p-4 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
          <div>
            <div class="text-xs font-medium text-blue-700 mb-0.5">📅 Дата публікації</div>
            <div class="text-xs text-blue-600">
              ${review.publishedAt 
                ? formatDateForDisplay(review.publishedAt.toDate?.() || new Date(review.publishedAt))
                : 'Не встановлено'}
            </div>
          </div>
          <button 
            onclick="openDatePickerModal('${review.id}', ${review.publishedAt ? `new Date('${review.publishedAt.toDate?.() || new Date(review.publishedAt)}')` : 'new Date()'})"
            class="px-3 py-1.5 bg-white hover:bg-blue-100 text-blue-700 font-medium rounded-lg transition text-xs flex items-center gap-1 border border-blue-200"
          >
            <i data-lucide="calendar" class="w-3 h-3"></i>
            Змінити
          </button>
        </div>

        <!-- Order Info Footer -->
        <div class="p-4 bg-gray-50 border-b border-gray-100">
          <div class="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div class="text-gray-600 font-medium mb-0.5">ID Замовлення</div>
              <div class="font-mono text-gray-900 bg-white px-2 py-1 rounded">
                ${review.orderId || 'N/A'}
              </div>
            </div>
            <div>
              <div class="text-gray-600 font-medium mb-0.5">ID Продукту</div>
              <div class="font-mono text-gray-900 bg-white px-2 py-1 rounded">
                ${review.productId || 'N/A'}
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="p-5 space-y-3">
          <!-- Primary Actions -->
          <div class="grid grid-cols-2 gap-2">
            <button 
              onclick="approveModernReview('${review.id}')"
              class="review-action-btn bg-green-500 hover:bg-green-600 text-white"
            >
              <i data-lucide="check" class="w-4 h-4"></i>
              <span>Опублікувати</span>
            </button>
            <button 
              onclick="deleteModernReview('${review.id}')"
              class="review-action-btn bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
            >
              <i data-lucide="trash-2" class="w-4 h-4"></i>
              <span>Видалити</span>
            </button>
          </div>

          <!-- Secondary Actions -->
          <div class="grid grid-cols-2 gap-2">
            <button 
              onclick="openQuickEditModal('${review.id}', '${review.name || 'Анонім'}', ${review.rating || 0}, '${(review.comment || '').replace(/'/g, "\\'")}' )"
              class="review-action-btn bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200"
            >
              <i data-lucide="edit-2" class="w-4 h-4"></i>
              <span>Редагувати</span>
            </button>
            ${foundCustomer ? `
              <label class="review-action-btn bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200 cursor-pointer">
                <input 
                  type="checkbox" 
                  ${review.verified ? 'checked' : ''} 
                  onchange="toggleModernVerified('${review.id}', this.checked)"
                  class="w-4 h-4 text-purple-600 rounded"
                  style="margin: 0; margin-right: 4px;"
                >
                <span>Верифікувати</span>
              </label>
            ` : ''}
          </div>
        </div>
      </div>`
  }).join('')
  
  lucide.createIcons()
}

// ============================================
// DATE PICKER MODAL FUNCTIONS
// ============================================

function openDatePickerModal(reviewId, currentDate = null) {
  const modal = document.getElementById('review-date-picker-modal')
  if (!modal) return

  const review = pendingReviews.find(r => r.id === reviewId)
  if (!review) return

  datePickerState.reviewId = reviewId
  datePickerState.originalDate = currentDate || review.publishedAt?.toDate?.() || review.createdAt?.toDate?.() || new Date()
  datePickerState.selectedDate = new Date(datePickerState.originalDate)

  // Set hidden input
  document.getElementById('review-date-picker-id').value = reviewId

  // Display current date
  document.getElementById('review-date-picker-current').textContent = 
    formatDateForDisplay(datePickerState.originalDate)

  // Initialize date/time inputs
  const dateParts = datePickerState.selectedDate.toISOString().split('T')
  document.getElementById('review-date-picker-date').value = dateParts[0]
  document.getElementById('review-date-picker-time').value = 
    datePickerState.selectedDate.toTimeString().slice(0, 5)

  updateDatePickerPreview()

  modal.classList.remove('hidden')
}

function closeDatePickerModal() {
  const modal = document.getElementById('review-date-picker-modal')
  if (modal) {
    modal.classList.add('hidden')
  }
  datePickerState = { reviewId: null, originalDate: null, selectedDate: null }
}

function updateDatePickerPreview() {
  const dateInput = document.getElementById('review-date-picker-date').value
  const timeInput = document.getElementById('review-date-picker-time').value

  if (!dateInput || !timeInput) return

  const [year, month, day] = dateInput.split('-')
  const [hours, minutes] = timeInput.split(':')

  datePickerState.selectedDate = new Date(year, month - 1, day, hours, minutes, 0)

  const preview = document.getElementById('review-date-picker-preview')
  preview.textContent = formatDateForDisplay(datePickerState.selectedDate)
}

function setDatePickerPreset(preset) {
  const now = new Date()
  let targetDate = new Date(now)

  switch (preset) {
    case 'now':
      targetDate = new Date(now)
      break
    case 'tomorrow':
      targetDate.setDate(targetDate.getDate() + 1)
      targetDate.setHours(9, 0, 0, 0)
      break
    case 'week':
      targetDate.setDate(targetDate.getDate() + 7)
      targetDate.setHours(9, 0, 0, 0)
      break
    case 'month':
      targetDate.setDate(targetDate.getDate() + 30)
      targetDate.setHours(9, 0, 0, 0)
      break
  }

  datePickerState.selectedDate = targetDate

  const dateParts = targetDate.toISOString().split('T')
  document.getElementById('review-date-picker-date').value = dateParts[0]
  document.getElementById('review-date-picker-time').value = 
    targetDate.toTimeString().slice(0, 5)

  updateDatePickerPreview()
}

async function saveDatePickerSelection() {
  const reviewId = datePickerState.reviewId
  const newDate = datePickerState.selectedDate

  if (!reviewId || !newDate) {
    showToast('Виберіть дату та час', 'error')
    return
  }

  // Validate date is not before creation date
  const review = pendingReviews.find(r => r.id === reviewId)
  if (review?.createdAt) {
    const createdDate = review.createdAt.toDate?.() || new Date(review.createdAt)
    if (newDate < createdDate) {
      showToast('Дата публікації не може бути раніше дати подання', 'error')
      return
    }
  }

  try {
    await updateDoc(doc(db, 'reviews', reviewId), {
      publishedAt: Timestamp.fromDate(newDate)
    })
    showToast(`Дату змінено на ${formatDateForDisplay(newDate)}`, 'success')
    closeDatePickerModal()
  } catch (error) {
    console.error('Error updating review date:', error)
    showToast('Помилка при збереженні дати', 'error')
  }
}

// ============================================
// QUICK EDIT MODAL FUNCTIONS
// ============================================

function openQuickEditModal(reviewId, customerName, rating, reviewText) {
  const modal = document.getElementById('review-quick-edit-modal')
  if (!modal) return

  quickEditState.reviewId = reviewId
  quickEditState.originalText = reviewText

  // Set form fields
  document.getElementById('review-quick-edit-id').value = reviewId
  document.getElementById('review-quick-edit-name').textContent = customerName
  document.getElementById('review-quick-edit-rating').textContent = '★'.repeat(rating) + '☆'.repeat(5 - rating)
  document.getElementById('review-quick-edit-text').value = reviewText || ''

  updateCharCount()

  modal.classList.remove('hidden')

  // Focus textarea
  setTimeout(() => {
    document.getElementById('review-quick-edit-text').focus()
  }, 100)
}

function closeQuickEditModal() {
  const modal = document.getElementById('review-quick-edit-modal')
  if (modal) {
    modal.classList.add('hidden')
  }
  quickEditState = { reviewId: null, originalText: null }
}

function updateCharCount() {
  const textarea = document.getElementById('review-quick-edit-text')
  const countEl = document.getElementById('review-quick-edit-char-count')
  countEl.textContent = `${textarea.value.length} символів`

  if (textarea.value.length > 2000) {
    countEl.classList.add('text-red-600')
  } else {
    countEl.classList.remove('text-red-600')
  }
}

async function saveQuickEdit() {
  const reviewId = quickEditState.reviewId
  const newText = document.getElementById('review-quick-edit-text').value

  if (!reviewId || !newText.trim()) {
    showToast('Введіть текст відгуку', 'error')
    return
  }

  if (newText.length > 5000) {
    showToast('Текст відгуку занадто довгий (макс 5000 символів)', 'error')
    return
  }

  try {
    await updateDoc(doc(db, 'reviews', reviewId), {
      comment: newText.trim(),
      updatedAt: serverTimestamp(),
      editedByModerator: true
    })
    showToast('Відгук успішно відредаговано', 'success')
    closeQuickEditModal()
  } catch (error) {
    console.error('Error updating review text:', error)
    showToast('Помилка при збереженні змін', 'error')
  }
}

// ============================================
// ACTION BUTTONS
// ============================================

window.approveModernReview = async function(reviewId) {
  const review = pendingReviews.find(r => r.id === reviewId)
  if (!review) return

  try {
    // Use custom date if set, otherwise current time
    const publishDate = review.publishedAt?.toDate?.() || new Date()

    await updateDoc(doc(db, 'reviews', reviewId), {
      status: 'approved',
      publishedAt: review.publishedAt || Timestamp.fromDate(publishDate),
      moderatedAt: serverTimestamp(),
      moderatorId: currentUser?.uid || 'unknown'
    })
    showToast('✓ Відгук опубліковано', 'success')
  } catch (error) {
    console.error('Error approving review:', error)
    showToast('Помилка публікації', 'error')
  }
}

window.deleteModernReview = async function(reviewId) {
  if (!confirm('Ви впевнені? Цю дію не можна скасувати.')) {
    return
  }

  try {
    // Option 1: Set status to rejected
    await updateDoc(doc(db, 'reviews', reviewId), {
      status: 'rejected',
      moderatedAt: serverTimestamp(),
      moderatorId: currentUser?.uid || 'unknown',
      rejectionReason: 'Deleted by moderator'
    })
    showToast('✗ Відгук видалено з модерації', 'success')

    // Option 2: Actually delete (if you prefer hard delete)
    // await deleteDoc(doc(db, 'reviews', reviewId))
  } catch (error) {
    console.error('Error deleting review:', error)
    showToast('Помилка видалення', 'error')
  }
}

window.toggleModernVerified = async function(reviewId, isVerified) {
  try {
    await updateDoc(doc(db, 'reviews', reviewId), {
      verified: isVerified,
      verifiedAt: isVerified ? serverTimestamp() : null
    })
    showToast(isVerified ? '✓ Позначено як верифікований' : '○ Верифікація знята', 'success')
  } catch (error) {
    console.error('Error toggling verified:', error)
    showToast('Помилка оновлення', 'error')
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatRelativeTime(date) {
  const now = new Date()
  const seconds = Math.floor((now - date) / 1000)
  
  if (seconds < 60) return 'щойно'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}хв тому`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}г тому`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}д тому`
  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `${weeks}т тому`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}м тому`
  const years = Math.floor(months / 12)
  return `${years}р тому`
}

function formatDateForDisplay(date) {
  if (!date) return 'Невідомо'
  const d = date instanceof Date ? date : new Date(date)
  
  const dateStr = d.toLocaleDateString('uk-UA', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  })
  const timeStr = d.toLocaleTimeString('uk-UA', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
  
  return `${dateStr}, ${timeStr}`
}

function formatPhoneNumber(phone) {
  if (!phone) return 'Не вказано'
  // Format: +38 (0XX) XXX-XX-XX
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 12 && cleaned.startsWith('38')) {
    return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 3)}${cleaned.slice(3, 5)}) ${cleaned.slice(5, 8)}-${cleaned.slice(8, 10)}-${cleaned.slice(10)}`
  }
  return phone
}

function normalizePhoneForLookup(phone) {
  if (!phone) return null
  return phone.replace(/[^\d]/g, '').trim()
}

function openPhotoViewer(photoUrl) {
  // Simple implementation - opens in new tab
  // For production, use a lightbox library
  window.open(photoUrl, '_blank')
  
  // Or use a modal lightbox instead:
  // const modal = document.createElement('div')
  // modal.innerHTML = `<img src="${photoUrl}" class="max-w-full max-h-full">`
  // // ... style and show modal
}

// ============================================
// INTEGRATION WITH EXISTING CODE
// ============================================

// Replace the old renderPendingReviews() call with new one
// In loadPendingReviews() function, change:
// renderPendingReviews() → renderModernPendingReviews()

// If using the old functions, map them to new ones:
window.approveReview = window.approveModernReview
window.rejectReview = window.deleteModernReview
window.toggleVerified = window.toggleModernVerified

// Export for use in HTML
window.openDatePickerModal = openDatePickerModal
window.closeDatePickerModal = closeDatePickerModal
window.setDatePickerPreset = setDatePickerPreset
window.saveDatePickerSelection = saveDatePickerSelection
window.openQuickEditModal = openQuickEditModal
window.closeQuickEditModal = closeQuickEditModal
window.updateCharCount = updateCharCount
window.saveQuickEdit = saveQuickEdit
window.openPhotoViewer = openPhotoViewer
