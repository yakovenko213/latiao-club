// ============================================
// BULK IMAGE UPLOAD BY SKU - Core Logic
// ============================================
// This file contains the upload logic that works with UI injected by admin.js

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
        
        window.logToBulkConsole(`Обробка файлу: ${filename} (SKU: "${sku}")`, 'info');
        
        // Step 1: Find product by SKU
        const product = await findProductBySku(sku);
        
        if (!product) {
            const msg = `Товар не знайдено для SKU="${sku}"`;
            window.logToBulkConsole(`${filename} → ${msg}`, 'error');
            return { success: false, message: msg };
        }
        
        window.logToBulkConsole(`Знайдено товар: ${product.data.name || 'Без назви'} (ID: ${product.id})`, 'success');
        
        // Step 2: Upload image to Firebase Storage
        const { storage, ref, uploadBytes, getDownloadURL, doc, updateDoc, serverTimestamp } = window.firebaseInstances;
        
        const storageRef = ref(storage, `product_images/${filename}`);
        
        window.logToBulkConsole(`Завантаження в Storage: product_images/${filename}...`, 'info');
        const snapshot = await uploadBytes(storageRef, file);
        
        // Step 3: Get download URL
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        window.logToBulkConsole(`Отримано URL: ${downloadURL.substring(0, 50)}...`, 'info');
        
        // Step 4: Update Firestore document
        const productRef = doc(window.firebaseInstances.db, 'products', product.id);
        await updateDoc(productRef, {
            image: downloadURL,
            updatedAt: serverTimestamp()
        });
        
        const successMsg = `${filename} → Оновлено! (${product.data.name})`;
        window.logToBulkConsole(successMsg, 'success');
        
        return { success: true, message: successMsg };
        
    } catch (error) {
        const errorMsg = `${file.name} → Помилка: ${error.message}`;
        window.logToBulkConsole(errorMsg, 'error');
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
    
    window.logToBulkConsole(`Початок обробки: ${total} файлів (макс. ${concurrency} одночасно)`, 'info');
    window.updateBulkProgress(0, total);
    
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
        window.updateBulkProgress(current, total);
        
        // Count successes/errors
        batchResults.forEach(result => {
            if (result.success) successCount++;
            else errorCount++;
        });
        
        window.logToBulkConsole(`Оброблено батч: ${current}/${total} (успіх: ${successCount}, помилки: ${errorCount})`, 'info');
    }
    
    // Final summary
    const summaryMsg = `🎉 Завершено! Успішно: ${successCount} | Помилки: ${errorCount} | Всього: ${total}`;
    window.logToBulkConsole(summaryMsg, successCount > 0 ? 'success' : 'warning');
    
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
        const uploadBtn = document.getElementById('bulkStartUploadBtn');
        if (uploadBtn) {
            uploadBtn.disabled = true;
            uploadBtn.textContent = '⏳ Завантаження...';
        }
        
        // Clear previous logs
        const logConsole = document.getElementById('bulkLogConsole');
        if (logConsole) logConsole.innerHTML = '';
        
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
            window.logToBulkConsole('Оновлення списку товарів...', 'info');
            await window.loadProducts();
        }
        
    } catch (error) {
        console.error('❌ Bulk upload error:', error);
        alert(`❌ Помилка завантаження: ${error.message}`);
        
        const uploadBtn = document.getElementById('bulkStartUploadBtn');
        if (uploadBtn) {
            uploadBtn.disabled = false;
            uploadBtn.textContent = '🚀 Почати завантаження';
        }
    }
};

console.log('✅ Bulk Image Upload module loaded');
