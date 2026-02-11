/**
 * ============================================
 * CHILI PEPPER HUNT - Visual Renderer
 * ============================================
 * 
 * Creates and manages pepper visual elements
 * with animations, click handlers, and effects.
 * 
 * @module PepperRenderer
 */

class PepperRenderer {
  constructor(gameInstance) {
    this.game = gameInstance;
    this.soundEnabled = true;
    this.injectStyles();
  }

  /**
   * Inject CSS styles for peppers
   */
  injectStyles() {
    const style = document.createElement('style');
    style.id = 'pepper-hunt-styles';
    style.textContent = `
      .chili-pepper {
        display: inline-block !important;
        font-size: 24px;
        cursor: pointer;
        position: relative;
        animation: pepperFloat 3s ease-in-out infinite;
        filter: drop-shadow(0 0 8px rgba(255, 107, 0, 0.6));
        transition: all 0.3s ease;
        user-select: none;
        z-index: 9999 !important;
        opacity: 1 !important;
        visibility: visible !important;
      }

      .chili-pepper:hover {
        transform: scale(1.3) rotate(15deg);
        filter: drop-shadow(0 0 15px rgba(255, 107, 0, 0.9));
      }

      .chili-pepper.golden {
        animation: pepperShine 2s ease-in-out infinite, pepperFloat 3s ease-in-out infinite;
        filter: drop-shadow(0 0 12px rgba(255, 215, 0, 0.8));
      }

      .chili-pepper.golden:hover {
        filter: drop-shadow(0 0 20px rgba(255, 215, 0, 1));
      }

      .chili-pepper.found {
        animation: pepperCollect 0.8s ease forwards;
        pointer-events: none;
      }

      @keyframes pepperFloat {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-10px) rotate(5deg); }
      }

      @keyframes pepperShine {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }

      @keyframes pepperCollect {
        0% {
          transform: scale(1) rotate(0deg);
          opacity: 1;
        }
        50% {
          transform: scale(1.5) rotate(360deg);
          opacity: 1;
        }
        100% {
          transform: scale(0) rotate(720deg);
          opacity: 0;
        }
      }

      @keyframes pepperPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }

      /* Pepper notification toast */
      .pepper-toast {
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #ff6b00 0%, #ff8533 100%);
        color: white;
        padding: 15px 25px;
        border-radius: 12px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        z-index: 99998;
        animation: toastSlideIn 0.4s ease, toastSlideOut 0.4s ease 2.6s;
        font-size: 16px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 10px;
      }

      @keyframes toastSlideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes toastSlideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }

      /* Hidden pepper indicator (optional) */
      .pepper-indicator {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 50px;
        font-size: 14px;
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .pepper-indicator .progress-bar {
        width: 100px;
        height: 6px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 3px;
        overflow: hidden;
      }

      .pepper-indicator .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #ff6b00 0%, #ff8533 100%);
        transition: width 0.3s ease;
      }
    `;
    
    if (!document.getElementById('pepper-hunt-styles')) {
      document.head.appendChild(style);
    }
  }

  /**
   * Create a pepper element
   */
  createPepper(pepperId, isGolden = false) {
    const pepper = document.createElement('span');
    pepper.className = `chili-pepper${isGolden ? ' golden' : ''}`;
    pepper.setAttribute('data-pepper-id', pepperId);
    pepper.textContent = '🌶️';
    pepper.title = isGolden ? '✨ Золотий перчик! ✨' : 'Перчик! Натисни щоб зібрати';

    // Add click handler
    pepper.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await this.handlePepperClick(pepperId, pepper, isGolden);
    });

    return pepper;
  }

  /**
   * Handle pepper click
   */
  async handlePepperClick(pepperId, element, isGolden) {
    // Mark as found in game state
    const success = await this.game.foundPepper(pepperId, isGolden);
    
    if (!success) return;

    // Add found class for animation
    element.classList.add('found');

    // Play sound effect
    if (this.soundEnabled) {
      this.playCollectSound();
    }

    // Show toast notification
    this.showToast(pepperId, isGolden);

    // Remove element after animation
    setTimeout(() => {
      element.remove();
    }, 800);

    // Update progress indicator if present
    this.updateProgressIndicator();
  }

  /**
   * Play collect sound (optional)
   */
  playCollectSound() {
    try {
      // Create simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.log('Sound playback not available');
    }
  }

  /**
   * Show toast notification
   */
  showToast(pepperId, isGolden) {
    const progress = this.game.getProgress();
    
    const toast = document.createElement('div');
    toast.className = 'pepper-toast';
    toast.innerHTML = `
      <span style="font-size: 24px;">${isGolden ? '✨🌶️' : '🌶️'}</span>
      <div>
        <div style="font-weight: bold;">${isGolden ? 'Золотий перчик!' : 'Перчик знайдено!'}</div>
        <div style="font-size: 13px; opacity: 0.9;">Прогрес: ${progress.found}/8</div>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  /**
   * Insert pepper into element
   */
  insertPepperInto(selector, pepperId, isGolden = false, insertPosition = 'append') {
    console.log(`🎨 [RENDER #${pepperId}] Attempting to insert pepper...`, {
      selector,
      pepperId,
      isGolden,
      insertPosition
    });
    
    const target = document.querySelector(selector);
    if (!target) {
      console.warn(`❌ [RENDER #${pepperId}] Target not found: ${selector}`);
      return null;
    }

    console.log(`✅ [RENDER #${pepperId}] Target element found`);

    // Check if should show this pepper
    const context = { productId: this.getCurrentProductId() };
    const shouldShow = this.game.shouldShowPepper(pepperId, context);
    
    if (!shouldShow) {
      console.log(`⚠️ [RENDER #${pepperId}] Pepper should not show (already found or wrong product)`);
      return null;
    }

    console.log(`✅ [RENDER #${pepperId}] Pepper cleared to show, creating element...`);
    
    const pepper = this.createPepper(pepperId, isGolden);
    
    switch (insertPosition) {
      case 'prepend':
        target.prepend(pepper);
        break;
      case 'before':
        target.parentNode.insertBefore(pepper, target);
        break;
      case 'after':
        target.parentNode.insertBefore(pepper, target.nextSibling);
        break;
      default:
        target.appendChild(pepper);
    }

    console.log(`🎉 [RENDER #${pepperId}] Pepper successfully inserted into ${selector}`);
    return pepper;
  }

  /**
   * Get current product ID (for dynamic peppers on product pages)
   */
  getCurrentProductId() {
    try {
      // Check URL for product ID
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('id') || urlParams.get('productId');
    } catch (error) {
      return null;
    }
  }

  /**
   * Create and show progress indicator
   */
  showProgressIndicator() {
    if (document.querySelector('.pepper-indicator')) return;

    const progress = this.game.getProgress();
    
    const indicator = document.createElement('div');
    indicator.className = 'pepper-indicator';
    indicator.innerHTML = `
      <span>🌶️</span>
      <span>${progress.found}/8</span>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${progress.percentage}%"></div>
      </div>
    `;
    
    document.body.appendChild(indicator);
  }

  /**
   * Update progress indicator
   */
  updateProgressIndicator() {
    const indicator = document.querySelector('.pepper-indicator');
    if (!indicator) return;

    const progress = this.game.getProgress();
    const countSpan = indicator.querySelector('span:nth-child(2)');
    const fill = indicator.querySelector('.progress-fill');
    
    if (countSpan) countSpan.textContent = `${progress.found}/8`;
    if (fill) fill.style.width = `${progress.percentage}%`;
  }

  /**
   * Hide progress indicator
   */
  hideProgressIndicator() {
    const indicator = document.querySelector('.pepper-indicator');
    if (indicator) indicator.remove();
  }
}

// Make renderer globally available
window.pepperRenderer = null;

export default PepperRenderer;
