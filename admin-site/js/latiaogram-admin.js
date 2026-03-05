/**
 * Latiaogram Moderation Module
 * Manages user-generated content from the Latiaogram social media feed
 * Uses global Firebase objects from admin.js
 */

class LatiaoGramModeration {
  constructor(db, storage) {
    this.db = db;
    this.storage = storage;
    this.unsubscribe = null;
    this.posts = [];
  }

  /**
   * Initialize moderation panel and start listening to posts
   */
  async loadLatiaogramModeration() {
    console.log('🔄 [LatiaoGRAM] Loading moderation panel...');
    
    try {
      this.showLoadingState();
      
      // Check if Firebase is properly initialized
      if (!this.db) {
        throw new Error('Firebase database not initialized');
      }
      
      console.log('📡 [LatiaoGRAM] Creating Firestore query using globals from admin.js...');
      
      // Create real-time listener for latiaogram posts
      // Use global Firebase functions from admin.js
      const postsQuery = window.query(
        window.collection(this.db, 'latiaogram_feed'), 
        window.orderBy('createdAt', 'desc')
      );
      
      console.log('👂 [LatiaoGRAM] Setting up onSnapshot listener...');
      
      this.unsubscribe = window.onSnapshot(postsQuery, (snapshot) => {
        console.log(`📊 [LatiaoGRAM] Received ${snapshot.docs.length} posts from Firestore`);
        
        this.posts = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          console.log(`📝 [LatiaoGRAM] Post: ${doc.id} - ${data.nickname || 'No nickname'}`);
          
          this.posts.push({
            id: doc.id,
            ...data
          });
        });
        
        console.log(`✅ [LatiaoGRAM] Total posts processed: ${this.posts.length}`);
        this.renderModerationTable();
      }, (error) => {
        console.error('❌ [LatiaoGRAM] Firestore listener error:', error);
        this.showErrorState(`Помилка Firestore: ${error.message}`);
      });
      
    } catch (error) {
      console.error('❌ [LatiaoGRAM] Error loading moderation:', error);
      this.showErrorState(`Помилка завантаження: ${error.message}`);
    }
  }

  /**
   * Render the moderation table with all posts
   */
  renderModerationTable() {
    console.log('🎨 [LatiaoGRAM] Rendering moderation table...');
    
    const container = document.getElementById('latiaogram-moderation-content');
    if (!container) {
      console.error('❌ [LatiaoGRAM] Container not found: latiaogram-moderation-content');
      return;
    }

    console.log(`📊 [LatiaoGRAM] Rendering ${this.posts.length} posts`);

    if (this.posts.length === 0) {
      console.log('📭 [LatiaoGRAM] No posts to display, showing empty state');
      container.innerHTML = `
        <div class="text-center py-12">
          <div class="w-16 h-16 mx-auto mb-4 text-gray-400">
            📸
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Поки немає постів</h3>
          <p class="text-gray-500">Пости з'являться тут коли користувачі почнуть публікувати фото</p>
        </div>
      `;
      return;
    }

    console.log('🏗️ [LatiaoGRAM] Building table HTML...');

    const tableHTML = `
      <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Фото</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Нікнейм</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Опис</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Лайки</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Видимість</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дії</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              ${this.posts.map(post => this.renderPostRow(post)).join('')}
            </tbody>
          </table>
        </div>
        <div class="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
          Всього постів: ${this.posts.length}
        </div>
      </div>
    `;

    container.innerHTML = tableHTML;
    this.attachEventListeners();
    
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    
    console.log('✅ [LatiaoGRAM] Table rendered successfully!');
  }

  /**
   * Render individual post row
   */
  renderPostRow(post) {
    const formatDate = (timestamp) => {
      if (!timestamp) return 'Невідомо';
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return new Intl.DateTimeFormat('uk-UA', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    };

    const isVisible = post.isVisible !== false; // Default to true if not set
    
    return `
      <tr class="hover:bg-gray-50" data-post-id="${post.id}">
        <td class="px-4 py-4">
          <img 
            src="${post.imageUrl}" 
            alt="Post image"
            class="w-12 h-12 rounded-lg object-cover cursor-pointer border border-gray-200 hover:ring-2 hover:ring-pink-500 transition-all"
            onclick="window.latiaogramMod.openImageModal('${post.imageUrl}')"
          />
        </td>
        <td class="px-4 py-4">
          <div class="text-sm font-medium text-gray-900">${this.escapeHtml(post.nickname || 'Анонім')}</div>
        </td>
        <td class="px-4 py-4">
          <div class="text-sm text-gray-900 max-w-xs truncate" title="${this.escapeHtml(post.caption || '')}">
            ${this.escapeHtml(post.caption || 'Без опису')}
          </div>
        </td>
        <td class="px-4 py-4">
          <div class="flex items-center text-sm text-gray-900">
            <span class="text-red-500 mr-1">❤️</span>
            ${post.likes || 0}
          </div>
        </td>
        <td class="px-4 py-4">
          <div class="text-sm text-gray-900">${formatDate(post.createdAt)}</div>
        </td>
        <td class="px-4 py-4">
          <label class="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              ${isVisible ? 'checked' : ''} 
              class="sr-only peer visibility-toggle"
              data-post-id="${post.id}"
            />
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
          </label>
        </td>
        <td class="px-4 py-4">
          <div class="flex space-x-2">
            <button 
              onclick="window.latiaogramMod.openEditModal('${post.id}')"
              class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              ✏️ Редагувати
            </button>
            <button 
              onclick="window.latiaogramMod.confirmDelete('${post.id}', '${this.escapeHtml(post.nickname || 'Анонім')}')"
              class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              🗑️ Видалити
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  /**
   * Attach event listeners to interactive elements
   */
  attachEventListeners() {
    // Visibility toggle listeners
    document.querySelectorAll('.visibility-toggle').forEach(toggle => {
      toggle.addEventListener('change', (e) => {
        const postId = e.target.dataset.postId;
        const isVisible = e.target.checked;
        this.toggleVisibility(postId, isVisible);
      });
    });
  }

  /**
   * Toggle post visibility
   */
  async toggleVisibility(postId, isVisible) {
    try {
      const postRef = window.doc(this.db, 'latiaogram_feed', postId);
      await window.updateDoc(postRef, { isVisible });
      
      this.showToast(
        isVisible ? 'Пост тепер видимий для всіх' : 'Пост приховано від користувачів', 
        'success'
      );
    } catch (error) {
      console.error('Error updating visibility:', error);
      this.showToast('Помилка при зміні видимості', 'error');
      // Revert toggle
      const toggle = document.querySelector(`[data-post-id="${postId}"]`);
      if (toggle) toggle.checked = !isVisible;
    }
  }

  /**
   * Confirm post deletion
   */
  confirmDelete(postId, nickname) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-lg max-w-md w-full p-6">
        <div class="flex items-center mb-4">
          <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
            <span class="text-2xl">⚠️</span>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Видалити пост?</h3>
            <p class="text-sm text-gray-500">Автор: ${this.escapeHtml(nickname)}</p>
          </div>
        </div>
        <p class="text-gray-700 mb-6">
          Ця дія незворотна. Пост і зображення будуть видалені назавжди.
        </p>
        <div class="flex gap-3 justify-end">
          <button 
            onclick="this.closest('.fixed').remove()"
            class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Скасувати
          </button>
          <button 
            onclick="window.latiaogramMod.deletePost('${postId}'); this.closest('.fixed').remove();"
            class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Видалити
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  /**
   * Delete post permanently
   */
  async deletePost(postId) {
    try {
      const post = this.posts.find(p => p.id === postId);
      if (!post) {
        throw new Error('Post not found');
      }

      // Delete image from storage if it's not base64
      if (post.imageUrl && post.imageUrl.startsWith('https://')) {
        try {
          const imageRef = window.ref(this.storage, post.imageUrl);
          await window.deleteObject(imageRef);
        } catch (storageError) {
          console.warn('Could not delete image from storage:', storageError);
          // Continue with post deletion even if image deletion fails
        }
      }

      // Delete post document
      const postRef = window.doc(this.db, 'latiaogram_feed', postId);
      await window.deleteDoc(postRef);
      
      this.showToast('Пост успішно видалено', 'success');
    } catch (error) {
      console.error('Error deleting post:', error);
      this.showToast('Помилка при видаленні поста', 'error');
    }
  }

  /**
   * Open edit modal for post
   */
  openEditModal(postId) {
    const post = this.posts.find(p => p.id === postId);
    if (!post) {
      this.showToast('Пост не знайдено', 'error');
      return;
    }

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.id = 'edit-post-modal';
    
    modal.innerHTML = `
      <div class="bg-white rounded-lg max-w-md w-full mx-4" onclick="event.stopPropagation()">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">Редагувати пост</h3>
        </div>
        
        <div class="px-6 py-4 space-y-4">
          <!-- Post Image -->
          <div class="flex justify-center">
            <img 
              src="${post.imageUrl}" 
              alt="Post image"
              class="w-20 h-20 rounded-lg object-cover border border-gray-200"
            />
          </div>
          
          <!-- Nickname Field -->
          <div>
            <label for="edit-nickname" class="block text-sm font-medium text-gray-700 mb-1">Нікнейм</label>
            <input 
              type="text" 
              id="edit-nickname" 
              value="${this.escapeHtml(post.nickname || '')}"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="Введіть нікнейм"
              maxlength="30"
            />
          </div>
          
          <!-- Description Field -->
          <div>
            <label for="edit-caption" class="block text-sm font-medium text-gray-700 mb-1">Опис</label>
            <textarea 
              id="edit-caption" 
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
              placeholder="Введіть опис"
              maxlength="200"
            >${this.escapeHtml(post.caption || '')}</textarea>
            <div class="text-xs text-gray-500 mt-1 text-right">
              <span id="caption-count">${(post.caption || '').length}</span>/200
            </div>
          </div>
        </div>
        
        <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3 rounded-b-lg">
          <button 
            onclick="document.getElementById('edit-post-modal').remove()"
            class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
          >
            Скасувати
          </button>
          <button 
            onclick="window.latiaogramMod.savePostEdit('${postId}')"
            class="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
          >
            Зберегти зміни
          </button>
        </div>
      </div>
    `;
    
    // Close on backdrop click
    modal.onclick = () => modal.remove();
    
    document.body.appendChild(modal);
    
    // Character counter for caption
    const captionField = document.getElementById('edit-caption');
    const captionCounter = document.getElementById('caption-count');
    
    captionField.addEventListener('input', () => {
      captionCounter.textContent = captionField.value.length;
    });
    
    // Focus on nickname field
    setTimeout(() => {
      document.getElementById('edit-nickname').focus();
    }, 100);
  }
  
  /**
   * Save edited post data
   */
  async savePostEdit(postId) {
    try {
      const nickname = document.getElementById('edit-nickname').value.trim();
      const caption = document.getElementById('edit-caption').value.trim();
      
      // Validation
      if (!nickname) {
        this.showToast('Нікнейм не може бути порожнім', 'error');
        return;
      }
      
      if (nickname.length > 30) {
        this.showToast('Нікнейм не може бути довшим за 30 символів', 'error');
        return;
      }
      
      if (caption.length > 200) {
        this.showToast('Опис не може бути довшим за 200 символів', 'error');
        return;
      }
      
      // Update in Firestore
      const postRef = window.doc(this.db, 'latiaogram_feed', postId);
      const updateData = {
        nickname: nickname,
        caption: caption,
        updatedAt: window.serverTimestamp()
      };
      
      await window.updateDoc(postRef, updateData);
      
      // Close modal and show success
      document.getElementById('edit-post-modal').remove();
      this.showToast('Пост успішно оновлено!', 'success');
      
      console.log(`✅ [LatiaoGRAM] Post ${postId} updated:`, updateData);
      
    } catch (error) {
      console.error('❌ [LatiaoGRAM] Error updating post:', error);
      this.showToast('Помилка при збереженні змін', 'error');
    }
  }

  /**
   * Open image modal
   */
  openImageModal(imageUrl) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4';
    modal.onclick = () => modal.remove();
    
    modal.innerHTML = `
      <div class="relative max-w-4xl max-h-full">
        <button 
          onclick="this.closest('.fixed').remove()"
          class="absolute -top-10 right-0 text-white text-2xl hover:text-gray-300"
        >
          ✕
        </button>
        <img 
          src="${imageUrl}" 
          alt="Full size image"
          class="max-w-full max-h-full object-contain rounded-lg"
        />
      </div>
    `;
    
    document.body.appendChild(modal);
  }

  /**
   * Show loading state
   */
  showLoadingState() {
    const container = document.getElementById('latiaogram-moderation-content');
    if (!container) return;
    
    container.innerHTML = `
      <div class="text-center py-12">
        <div class="inline-block animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full mb-4"></div>
        <p class="text-gray-500">Завантаження постів...</p>
      </div>
    `;
  }

  /**
   * Show error state
   */
  showErrorState(message) {
    console.error('💥 [LatiaoGRAM] Showing error state:', message);
    
    const container = document.getElementById('latiaogram-moderation-content');
    if (!container) return;
    
    container.innerHTML = `
      <div class="text-center py-12">
        <div class="w-16 h-16 mx-auto mb-4 text-red-400">
          ⚠️
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Помилка завантаження</h3>
        <p class="text-gray-500 mb-4">${message}</p>
        <div class="space-y-2">
          <button 
            onclick="window.latiaogramMod.loadLatiaogramModeration()"
            class="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
          >
            Спробувати знову
          </button>
          <br>
          <button 
            onclick="console.log('🔍 [DEBUG] Firebase status:', {db: !!window.latiaogramMod?.db, storage: !!window.latiaogramMod?.storage})"
            class="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400 transition-colors"
          >
            Перевірити підключення
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
    
    toast.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-x-full`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.remove('translate-x-full'), 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
      toast.classList.add('translate-x-full');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Clean up listeners
   */
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}

// Export for use in admin panel
window.LatiaoGramModeration = LatiaoGramModeration;

export default LatiaoGramModeration;