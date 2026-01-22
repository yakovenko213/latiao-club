// ============================================
// BULK IMAGE UPLOAD BY SKU - Standalone Module
// ============================================
// This file should be imported in admin.js or included as a module

/**
 * Opens the Bulk Image Upload modal
 */
window.openBulkImageUploadModal = function() {
    const modal = document.getElementById('bulk-image-upload-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        
        // Reset UI
        document.getElementById('bulkImageInput').value = '';
        document.getElementById('file-count').textContent = '';
        document.getElementById('upload-progress-section').classList.add('hidden');
        document.getElementById('log-console').innerHTML = '<div class="text-gray-400 text-center py-4">Логи з\'являться тут після початку завантаження...</div>';
        document.getElementById('start-bulk-upload-btn').disabled = false;
        
        console.log('📸 Bulk Image Upload modal opened');
    }
};

/**
 * Closes the Bulk Image Upload modal
 */
window.closeBulkImageUploadModal = function() {
    const modal = document.getElementById('bulk-image-upload-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        console.log('✅ Bulk Image Upload modal closed');
    }
};

/**
 * Logs a message to the console UI
 * @param {string} message - The message to log
 * @param {string} type - 'success', 'error', 'warning', 'info'
 */
function logToConsole(message, type = 'info') {
    const logConsole = document.getElementById('log-console');
    if (!logConsole) return;
    
    // Remove placeholder if exists
    const placeholder = logConsole.querySelector('.text-gray-400');
    if (placeholder) placeholder.remove();
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: '📝'
    };
    
    const colors = {
        success: 'text-green-600',
        error: 'text-red-600',
        warning: 'text-yellow-600',
        info: 'text-blue-600'
    };
    
    const logEntry = document.createElement('div');
    logEntry.className = `${colors[type]} py-1`;
    logEntry.textContent = `${icons[type]} ${message}`;
    
    logConsole.appendChild(logEntry);
    
    // Auto-scroll to bottom
    logConsole.scrollTop = logConsole.scrollHeight;
}

/**
 * Updates the progress bar
 * @param {number} current - Current progress
 * @param {number} total - Total items
 */
function updateProgress(current, total) {
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const progressSection = document.getElementById('upload-progress-section');
    
    if (progressSection) progressSection.classList.remove('hidden');
    
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
    
    if (progressBar) progressBar.style.width = `${percentage}%`;
    if (progressText) progressText.textContent = `${current} / ${total}`;
}

/**
 * Extracts SKU from filename (removes extension)
 * @param {string} filename - e.g., "9840.jpg"
 * @returns {string} - e.g., "9840"
 */
function extractSkuFromFilename(filename) {
    // Remove file extension (.jpg, .png, .jpeg, .webp, etc.)
    return filename.replace(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i, '');
}

/**
 * Finds a product by SKU (as STRING)
 * REQUIRES: db, collection, query, where, limit, getDocs from parent scope
 * @param {string} sku - The SKU to search for (e.g., "9840")
 * @returns {Promise<{id: string, data: object} | null>} - Product doc or null
 */
async function findProductBySku(sku) {
    try {
        // Access global Firebase instances from admin.js
        const { db, collection, query, where, limit, getDocs } = window.firebaseInstances;
        
        // CRITICAL: Query using STRING comparison (not parseInt)
        const q = query(
            collection(db, 'products'),
            where('sku', '==', sku),  // Keep as string!
            limit(1)
        );
        
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            return null;
        }
        
        const productDoc = snapshot.docs[0];
        return {
            id: productDoc.id,
            data: productDoc.data()
        };
    } catch (error) {
        console.error(`❌ Error finding product with SKU="${sku}":`, error);
        throw error;
    }
}

/**
 * Uploads a single image to Firebase Storage and updates Firestore
 * @param {File} file - The image file
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function uploadSingleImage(file) {
    try {
        const filename = file.name;
        const sku = extractSkuFromFilename(filename);
        
        logToConsole(`Обробка файлу: ${filename} (SKU: "${sku}")`, 'info');
        
        // Step 1: Find product by SKU
        const product = await findProductBySku(sku);
        
        if (!product) {
            const msg = `Товар не знайдено для SKU="${sku}"`;
            logToConsole(`${filename} → ${msg}`, 'error');
            return { success: false, message: msg };
        }
        
        logToConsole(`Знайдено товар: ${product.data.name || 'Без назви'} (ID: ${product.id})`, 'success');
        
        // Step 2: Upload image to Firebase Storage
        const { storage, ref, uploadBytes, getDownloadURL, doc, updateDoc, serverTimestamp } = window.firebaseInstances;
        
        const storageRef = ref(storage, `product_images/${filename}`);
        
        logToConsole(`Завантаження в Storage: product_images/${filename}...`, 'info');
        const snapshot = await uploadBytes(storageRef, file);
        
        // Step 3: Get download URL
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        logToConsole(`Отримано URL: ${downloadURL.substring(0, 50)}...`, 'info');
        
        // Step 4: Update Firestore document
        const productRef = doc(window.firebaseInstances.db, 'products', product.id);
        await updateDoc(productRef, {
            image: downloadURL,
            updatedAt: serverTimestamp()
        });
        
        const successMsg = `${filename} → Оновлено! (${product.data.name})`;
        logToConsole(successMsg, 'success');
        
        return { success: true, message: successMsg };
        
    } catch (error) {
        const errorMsg = `${file.name} → Помилка: ${error.message}`;
        logToConsole(errorMsg, 'error');
        console.error('❌ Upload error:', error);
        return { success: false, message: errorMsg };
    }
}

/**
 * Process files with concurrency limit (max 5 at a time)
 * @param {FileList} files - The files to upload
 * @param {number} concurrency - Max parallel uploads (default: 5)
 */
async function processBulkUpload(files, concurrency = 5) {
    const fileArray = Array.from(files);
    const total = fileArray.length;
    let current = 0;
    let successCount = 0;
    let errorCount = 0;
    
    logToConsole(`Початок обробки: ${total} файлів (макс. ${concurrency} одночасно)`, 'info');
    updateProgress(0, total);
    
    // Process files in batches
    const results = [];
    
    for (let i = 0; i < fileArray.length; i += concurrency) {
        const batch = fileArray.slice(i, Math.min(i + concurrency, fileArray.length));
        
        // Process batch in parallel
        const batchResults = await Promise.all(
            batch.map(file => uploadSingleImage(file))
        );
        
        results.push(...batchResults);
        
        // Update progress
        current += batch.length;
        updateProgress(current, total);
        
        // Count successes/errors
        batchResults.forEach(result => {
            if (result.success) successCount++;
            else errorCount++;
        });
        
        logToConsole(`Оброблено батч: ${current}/${total} (успіх: ${successCount}, помилки: ${errorCount})`, 'info');
    }
    
    // Final summary
    const summaryMsg = `🎉 Завершено! Успішно: ${successCount} | Помилки: ${errorCount} | Всього: ${total}`;
    logToConsole(summaryMsg, successCount > 0 ? 'success' : 'warning');
    
    return {
        total,
        successCount,
        errorCount,
        results
    };
}

/**
 * Main handler for Bulk Image Upload
 */
window.handleBulkImageUpload = async function() {
    try {
        const fileInput = document.getElementById('bulkImageInput');
        const files = fileInput.files;
        
        if (!files || files.length === 0) {
            alert('⚠️ Будь ласка, виберіть хоча б один файл');
            return;
        }
        
        // Disable button during upload
        const uploadBtn = document.getElementById('start-bulk-upload-btn');
        if (uploadBtn) {
            uploadBtn.disabled = true;
            uploadBtn.textContent = '⏳ Завантаження...';
        }
        
        // Clear previous logs
        document.getElementById('log-console').innerHTML = '';
        
        // Start processing
        const result = await processBulkUpload(files, 5); // Max 5 concurrent uploads
        
        // Show summary alert
        const summaryText = `✅ Масове завантаження завершено!\n\n` +
            `Успішно оновлено: ${result.successCount} товарів\n` +
            `Помилки: ${result.errorCount}\n` +
            `Всього файлів: ${result.total}`;
        
        alert(summaryText);
        
        // Re-enable button
        if (uploadBtn) {
            uploadBtn.disabled = false;
            uploadBtn.textContent = '🚀 Почати завантаження';
        }
        
        // Reload products if any were updated
        if (result.successCount > 0 && typeof window.loadProducts === 'function') {
            logToConsole('Оновлення списку товарів...', 'info');
            await window.loadProducts();
        }
        
    } catch (error) {
        console.error('❌ Bulk upload error:', error);
        alert(`❌ Помилка завантаження: ${error.message}`);
        
        const uploadBtn = document.getElementById('start-bulk-upload-btn');
        if (uploadBtn) {
            uploadBtn.disabled = false;
            uploadBtn.textContent = '🚀 Почати завантаження';
        }
    }
};

// File input change handler - show file count
document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('bulkImageInput');
    const fileCountDiv = document.getElementById('file-count');
    
    if (fileInput && fileCountDiv) {
        fileInput.addEventListener('change', function(e) {
            const count = e.target.files.length;
            if (count > 0) {
                fileCountDiv.textContent = `📁 Вибрано файлів: ${count}`;
                fileCountDiv.className = 'mt-2 text-sm font-semibold text-blue-600';
            } else {
                fileCountDiv.textContent = '';
            }
        });
    }
});

console.log('✅ Bulk Image Upload module loaded');
