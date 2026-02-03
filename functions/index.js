const functions = require('firebase-functions');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onDocumentUpdated } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');
const fetch = require('node-fetch');
// 👇 Нові бібліотеки для адмінки
const express = require('express');
const basicAuth = require('basic-auth');
const path = require('path');

admin.initializeApp();

// const MONO_TOKEN = "m6veKEWDDwa6i0kh_3Ansgw";
const MONO_TOKEN = "m6veKEWDDwa6i0kh_3Ansgw";
const MY_WEBHOOK_URL = "https://handlemonowebhook-6bhm4jhyba-uc.a.run.app";
const MONO_API_URL = "https://api.monobank.ua/api/merchant/invoice/create";

function getSafeErrorMessage(error) {
  if (!error) return 'Unknown error';
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  return String(error);
}

// ═══════════════════════════════════════════════════════════════════════
// 📦 AUTOMATIC STOCK DEDUCTION SYSTEM
// Triggered by payment status changes in orders collection
// ═══════════════════════════════════════════════════════════════════════

/**
 * Deduct stock for all items in an order using Firestore Transactions
 * Ensures atomicity and prevents race conditions
 */
async function deductStockForOrder(orderId, orderData) {
  const db = admin.firestore();
  const results = {
    success: true,
    orderId,
    deductions: [],
    skipped: [],
    errors: [],
    totalDeducted: 0
  };

  const orderItems = orderData.items || [];
  
  if (orderItems.length === 0) {
    console.log(`ℹ️ Order ${orderId} has no items to deduct`);
    return results;
  }

  console.log(`📦 Starting stock deduction for order ${orderId} with ${orderItems.length} items`);

  for (const item of orderItems) {
    if (item.isGift) {
      console.log(`🎁 Skipping gift item: ${item.name}`);
      results.skipped.push({ name: item.name, reason: 'Gift item' });
      continue;
    }

    const sku = item.sku || item.article;
    const productId = item.id || item.productId;
    const quantityOrdered = Number(item.quantity) || 1;

    if (!productId && !sku) {
      results.errors.push({ name: item.name, error: 'Missing product ID and SKU' });
      continue;
    }

    try {
      let productRef, productDoc;

      if (productId) {
        productRef = db.collection('products').doc(productId);
        productDoc = await productRef.get();
      }

      if (!productDoc || !productDoc.exists) {
        if (sku) {
          const skuQuery = await db.collection('products').where('sku', '==', sku).limit(1).get();
          if (!skuQuery.empty) {
            productDoc = skuQuery.docs[0];
            productRef = productDoc.ref;
          }
        }
      }

      if (!productDoc || !productDoc.exists) {
        results.errors.push({ name: item.name, sku, productId, error: 'Product not found' });
        continue;
      }

      const deductionResult = await db.runTransaction(async (transaction) => {
        const freshProductDoc = await transaction.get(productRef);
        if (!freshProductDoc.exists) throw new Error('Product disappeared');

        const productData = freshProductDoc.data();
        const currentStock = Number(productData.stock) || 0;
        const productSku = productData.sku || sku;
        const productName = productData.name || item.name;
        const newStock = currentStock - quantityOrdered;

        if (newStock < 0) {
          console.warn(`⚠️ Stock going negative for ${productName}: ${currentStock} - ${quantityOrdered} = ${newStock}`);
        }

        transaction.update(productRef, {
          stock: newStock,
          updatedAt: new Date().toISOString(),
          lastStockUpdate: admin.firestore.FieldValue.serverTimestamp(),
          lastStockUpdateReason: `Order ${orderId}`
        });

        const stockLogRef = db.collection('stock_logs').doc();
        transaction.set(stockLogRef, {
          orderId,
          productId: productRef.id,
          sku: productSku,
          productName,
          action: 'deduct',
          quantityDeducted: quantityOrdered,
          stockBefore: currentStock,
          stockAfter: newStock,
          reason: `Order #${orderId.substring(0, 8).toUpperCase()}: Deducted ${quantityOrdered} of SKU ${productSku}`,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        return { productId: productRef.id, sku: productSku, productName, stockBefore: currentStock, stockAfter: newStock, quantityDeducted: quantityOrdered };
      });

      results.deductions.push(deductionResult);
      results.totalDeducted += quantityOrdered;
      console.log(`✅ Stock deducted: ${deductionResult.productName} (SKU: ${deductionResult.sku}): ${deductionResult.stockBefore} → ${deductionResult.stockAfter}`);

    } catch (error) {
      console.error(`❌ Failed to deduct stock for ${item.name}:`, getSafeErrorMessage(error));
      results.errors.push({ name: item.name, sku, productId, error: getSafeErrorMessage(error) });
      results.success = false;
    }
  }

  try {
    await db.collection('orders').doc(orderId).update({
      stockDeducted: true,
      stockDeductedAt: admin.firestore.FieldValue.serverTimestamp(),
      stockDeductionResults: {
        totalItems: orderItems.length,
        deducted: results.deductions.length,
        skipped: results.skipped.length,
        errors: results.errors.length
      }
    });
  } catch (updateError) {
    console.error(`❌ Failed to mark order as stock deducted:`, getSafeErrorMessage(updateError));
  }

  console.log(`📊 Stock deduction complete for order ${orderId}:`, {
    deducted: results.deductions.length,
    skipped: results.skipped.length,
    errors: results.errors.length
  });

  return results;
}

/**
 * Firestore Trigger: Auto-deduct stock when payment status changes to 'paid'
 */
exports.onOrderPaymentUpdate = onDocumentUpdated('orders/{orderId}', async (event) => {
  const orderId = event.params.orderId;
  const beforeData = event.data.before.data();
  const afterData = event.data.after.data();

  const paymentStatusBefore = beforeData.payment?.status || beforeData.status;
  const paymentStatusAfter = afterData.payment?.status || afterData.status;

  console.log(`📋 Order ${orderId} update:`, { paymentStatusBefore, paymentStatusAfter, stockDeducted: afterData.stockDeducted });

  const isPaidNow = paymentStatusAfter === 'paid';
  const wasNotPaidBefore = paymentStatusBefore !== 'paid';
  const notYetDeducted = !afterData.stockDeducted;

  if (isPaidNow && wasNotPaidBefore && notYetDeducted) {
    console.log(`💰 Payment confirmed for order ${orderId}. Initiating stock deduction...`);
    try {
      const result = await deductStockForOrder(orderId, afterData);
      console.log(`✅ Stock deduction completed for order ${orderId}`);
      return result;
    } catch (error) {
      console.error(`❌ Stock deduction failed for order ${orderId}:`, getSafeErrorMessage(error));
      await admin.firestore().collection('stock_logs').add({
        orderId,
        action: 'deduct_failed',
        error: getSafeErrorMessage(error),
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      throw error;
    }
  }

  return null;
});

/**
 * Manual stock deduction (for admin panel)
 */
exports.manualStockDeduction = functions.https.onCall(async (data, context) => {
  const orderId = data.orderId || (data.data && data.data.orderId);
  if (!orderId) throw new functions.https.HttpsError('invalid-argument', 'Order ID is required');

  const orderDoc = await admin.firestore().collection('orders').doc(orderId).get();
  if (!orderDoc.exists) throw new functions.https.HttpsError('not-found', 'Order not found');

  const orderData = orderDoc.data();
  if (orderData.stockDeducted) {
    return { success: false, message: 'Stock already deducted for this order' };
  }

  return await deductStockForOrder(orderId, orderData);
});

// 3. KEYCRM SYNC (INTERNAL HELPER)
async function syncToKeyCRM(orderId) {
  try {
    console.log(`🔗 Starting KeyCRM Sync for Order: ${orderId}`);

    if (!orderId) throw new Error('Order ID missing');

    // 1. Fetch Order Data
    const orderRef = admin.firestore().collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) throw new Error('Order not found');
    const orderData = orderDoc.data();

    // CHECK PAYMENT STATUS
    const paymentStatusOrder = orderData.payment?.status;
    if (paymentStatusOrder !== 'paid') {
      console.log(`⚠️ Skipping KeyCRM sync for unpaid order: ${orderId} (Status: ${paymentStatusOrder})`);
      return { success: false, reason: 'Order not paid' };
    }

    // 2. Fetch API Credentials securely
    const settingsDoc = await admin.firestore().collection('settings').doc('admin').get();
    if (!settingsDoc.exists) throw new Error('Admin settings not configured');

    const { keyCrmApiKey, keyCrmSourceId } = settingsDoc.data();

    if (!keyCrmApiKey) throw new Error('KeyCRM API Key is missing');

    // 3. Prepare Data for KeyCRM
    // Determine status
    let paymentStatus = 'paid';
    let paymentMethodId = 1; // COD by default

    const paymentMethod = orderData.payment?.method || '';
    if (paymentMethod === 'online' || paymentMethod === 'monobank') {
      paymentMethodId = 2; // Online
    }

    const items = (orderData.items || []).map(item => ({
      sku: item.sku || item.id || 'N/A',
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      discount: 0
    }));

    const isDeposit = orderData.payment?.type === 'deposit';
    const managerComment = isDeposit ? "ПРЕДОПЛАТА" : "Повна оплата";

    const keyCrmPayload = {
      source_id: keyCrmSourceId || 1,
      source_uuid: orderId,
      ordered_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      // manager_id: 3,
      // buyer_comment: orderData.customer?.telegram ? `Telegram: ${orderData.customer.telegram}` : '',
      buyer_comment: orderData.comment || '',
      manager_comment: orderData.promoCode
        ? `${managerComment}\n\nTelegram: ${orderData.customer.telegram}\nPromo: ${orderData.promoCode.code} (-${orderData.promoCode.discountAmount} грн)`
        : `${managerComment}\n\nTelegram: ${orderData.customer.telegram}`,
      buyer: {
        full_name: orderData.customer?.fullName,
        phone: orderData.customer?.phone,
        email: orderData.customer?.email || ''
      },
      shipping: {
        delivery_service_id: orderData.delivery?.method === 'Нова Пошта' ? 5 : 6, // 5=Nova, 6=Ukr (CHECK IDs IN KEYCRM!)
        shipping_service: orderData.delivery?.method,
        shipping_city: orderData.delivery?.city || '',
        shipping_address_city: orderData.delivery?.city || '',
        shipping_address: orderData.delivery?.address || '',
        shipping_address_country: "Ukraine",
        shipping_receive_point: orderData.delivery?.address || '',
        warehouse_ref: orderData.delivery?.warehouse || '',
        recipient_full_name: orderData.customer?.fullName,
        recipient_phone: orderData.customer?.phone,
        shipping_address_zip: orderData.delivery?.postcode || '',
        shipping_address_region: orderData.delivery?.region || ''
      },
      products: items,
      payments: [{
        payment_method_id: paymentMethodId,
        status: isDeposit ? "not_paid" : paymentStatus,
        amount: orderData.summary?.total || orderData.total
      }],
      discount: orderData.summary?.discountAmount || 0,
      total_price: orderData.summary?.total || orderData.total,
    };

    console.log('📦 KeyCRM Payload:', JSON.stringify(keyCrmPayload));

    // 4. Send to KeyCRM
    const response = await fetch('https://openapi.keycrm.app/v1/order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${keyCrmApiKey}`
      },
      body: JSON.stringify(keyCrmPayload)
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('❌ KeyCRM API Error:', responseData);
      throw new Error(`KeyCRM Error: ${JSON.stringify(responseData)}`);
    }

    console.log('✅ KeyCRM Success:', responseData);

    // 5. Update Order in Firestore
    await orderRef.update({
      keyCrmOrderId: responseData.id,
      keyCrmSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
      keyCrmSyncSuccess: true
    });

    return { success: true, keyCrmOrderId: responseData.id };

  } catch (error) {
    console.error("KeyCRM Sync Error:", getSafeErrorMessage(error));
    return { success: false, error: getSafeErrorMessage(error) };
  }
}

// EXPORT FOR CLIENT CALL (Manual Trigger)
exports.syncOrderToKeyCRM = functions.https.onCall(async (data, context) => {
  // Robust extraction of orderId trying multiple possible paths
  const orderId = data.orderId ||
    (data.data && data.data.orderId) ||
    (data.body && data.body.data && data.body.data.orderId);

  return await syncToKeyCRM(orderId);
});

// 1. СТВОРЕННЯ РАХУНКУ
exports.createMonoInvoice = functions.https.onCall(async (data, context) => {
  try {
    const orderId = data.orderId || (data.data && data.data.orderId);
    console.log(`Creating invoice for: ${orderId}`);

    if (!orderId) throw new functions.https.HttpsError('invalid-argument', 'Order ID missing');

    const orderRef = admin.firestore().collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) throw new functions.https.HttpsError('not-found', 'Order not found');

    const orderData = orderDoc.data();
    const totalAmount = orderData.summary?.total || orderData.total;

    if (!totalAmount) throw new functions.https.HttpsError('failed-precondition', 'Amount is 0');

    const paymentMethod = orderData.payment?.method || '';
    const isCOD = paymentMethod === 'Накладений платіж' ||
      paymentMethod === 'cod' ||
      paymentMethod.toLowerCase().includes('накладен');

    let invoiceAmount, paymentType, depositAmount, restAmount, description;

    if (isCOD) {
      invoiceAmount = 10000; // 100.00 UAH
      paymentType = 'deposit';
      depositAmount = 100;
      restAmount = totalAmount - 100;
      description = `Передоплата за замовлення #${orderId.substring(0, 8).toUpperCase()}`;
    } else {
      invoiceAmount = Math.round(totalAmount * 100);
      paymentType = 'full';
      depositAmount = null;
      restAmount = 0;
      description = `Оплата замовлення #${orderId.substring(0, 8).toUpperCase()}`;
    }

    const projectUrl = `https://${process.env.GCLOUD_PROJECT}.web.app`;

    const payload = {
      amount: invoiceAmount,
      ccy: 980,
      merchantPaymInfo: {
        reference: orderId,
        destination: description,
        comment: isCOD ? 'Передоплата 100 грн' : 'Повна оплата'
      },
      redirectUrl: `${projectUrl}/thank-you.html?orderId=${orderId}`,
      webHookUrl: MY_WEBHOOK_URL,
      validity: 3600
    };

    const response = await fetch(MONO_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Token': MONO_TOKEN },
      body: JSON.stringify(payload)
    });

    const responseData = await response.json();

    if (!response.ok || !responseData.invoiceId) {
      console.error("Mono Error:", JSON.stringify(responseData));
      throw new Error(responseData.errCode || 'Monobank Error');
    }

    const paymentUpdate = {
      'payment.invoiceId': responseData.invoiceId,
      'payment.pageUrl': responseData.pageUrl,
      'payment.status': 'pending',
      'payment.provider': 'Monobank',
      'payment.type': paymentType,
      'payment.amount': totalAmount,
      'payment.amountPaid': 0,
      'payment.amountDue': restAmount,
      'payment.createdAt': admin.firestore.FieldValue.serverTimestamp()
    };

    if (isCOD) {
      paymentUpdate['payment.depositAmount'] = depositAmount;
      paymentUpdate['payment.restAmount'] = restAmount;
    }

    await orderRef.update(paymentUpdate);
    return { success: true, pageUrl: responseData.pageUrl };

  } catch (error) {
    console.error("Create Invoice Error:", getSafeErrorMessage(error));
    throw new functions.https.HttpsError('internal', getSafeErrorMessage(error));
  }
});

// 2. ОБРОБКА ОПЛАТИ (WEBHOOK)
exports.handleMonoWebhook = functions.https.onRequest(async (req, res) => {
  try {
    const { invoiceId, status, modifiedDate } = req.body;
    if (!invoiceId) return res.status(200).send('OK');

    const snapshot = await admin.firestore().collection('orders')
      .where('payment.invoiceId', '==', invoiceId).get();

    if (snapshot.empty) return res.status(200).send('OK');

    const orderDoc = snapshot.docs[0];
    const currentStatus = orderDoc.data().payment?.status;

    if (status === 'success' && currentStatus !== 'paid') {
      const orderData = orderDoc.data();
      const paymentType = orderData.payment?.type || 'full';
      const totalAmount = orderData.summary?.total || orderData.total;

      let amountPaid = totalAmount;
      let amountDue = 0;
      let statusLabel = 'Сплачено';

      if (paymentType === 'deposit') {
        amountPaid = 100;
        amountDue = totalAmount - 100;
        statusLabel = 'Передоплата 100 грн';
      }

      await orderDoc.ref.update({
        'payment.status': 'paid',
        'payment.statusLabel': statusLabel,
        'payment.amountPaid': amountPaid,
        'payment.amountDue': amountDue,
        'payment.updatedAt': new Date(modifiedDate || Date.now()),
        'status': 'paid'
      });

      // ============================================
      // STOCK DEDUCTION IS HANDLED BY FIRESTORE TRIGGER
      // See: onOrderPaymentUpdate function
      // ============================================
      console.log(`✅ Payment marked as paid for order ${orderDoc.id}. Stock deduction will be triggered automatically.`);

      // TRIGGER KEYCRM ORDER SYNC
      await syncToKeyCRM(orderDoc.id);

    } else if (status === 'failure') {
      await orderDoc.ref.update({
        'payment.status': 'failure',
        'payment.statusLabel': 'Помилка оплати'
      });
    }
    res.status(200).send('OK');
  } catch (e) {
    console.error("Webhook Error:", getSafeErrorMessage(e));
    res.status(200).send('OK');
  }
});


const app = express();

const ADMIN_USER = "admin_system";
const ADMIN_PASS = "N$SKjTh%~=Tv42H&r3*!";

const authMiddleware = (req, res, next) => {
  const user = basicAuth(req);
  if (!user || user.name !== ADMIN_USER || user.pass !== ADMIN_PASS) {
    res.set("WWW-Authenticate", 'Basic realm="Admin Area"');
    return res.status(401).send("Доступ заборонено: Невірний логін або пароль.");
  }
  next();
};

app.use(authMiddleware);

app.get(/.*/, (req, res) => {
  const filePath = path.join(__dirname, "private", "admin.html");
  res.sendFile(filePath);
});

exports.adminPanel = functions.https.onRequest(app);

// ═══════════════════════════════════════════════════════════════════════
// 📦 KEYCRM PRODUCTS SYNC - Fetch products from KeyCRM API
// ═══════════════════════════════════════════════════════════════════════

/**
 * Core sync logic - fetches products from KeyCRM and updates Firestore
 * Can be called from manual trigger or scheduled function
 */
async function performProductSync() {
  try {
    console.log('🔗 Starting KeyCRM Products Sync...');

    // 1. Fetch API Key from Firestore settings
    const settingsDoc = await admin.firestore().collection('settings').doc('config').get();

    if (!settingsDoc.exists || !settingsDoc.data().keycrmApiKey) {
      throw new Error('API Key not found in settings');
    }

    const apiKey = settingsDoc.data().keycrmApiKey;
    console.log('✅ API Key loaded from settings');

    // 2. Fetch products with pagination from KeyCRM
    const allCrmProducts = [];
    let currentPage = 1;
    let hasMorePages = true;
    const limit = 50;

    do {
      const targetUrl = `https://openapi.keycrm.app/v1/offers?limit=${limit}&page=${currentPage}`;
      console.log(`📄 Fetching page ${currentPage}:`, targetUrl);

      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`📡 Page ${currentPage} response:`, response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error body:', errorText);
        throw new Error(`KeyCRM API error: ${response.status} ${response.statusText}`);
      }

      const pageData = await response.json();
      console.log(`📊 Page ${currentPage} data received`);

      const pageProducts = pageData.data || pageData.products || pageData || [];

      if (Array.isArray(pageProducts) && pageProducts.length > 0) {
        // DEBUG: Log first product to see structure
        if (currentPage === 1 && pageProducts.length > 0) {
          console.log('🔍 DEBUG: First product structure from KeyCRM:', JSON.stringify(pageProducts[0], null, 2));
        }

        allCrmProducts.push(...pageProducts);
        console.log(`✅ Page ${currentPage}: Added ${pageProducts.length} products (Total: ${allCrmProducts.length})`);

        hasMorePages = pageProducts.length === limit;
        currentPage++;
      } else {
        console.log(`🛑 Page ${currentPage}: No more data. Stopping pagination.`);
        hasMorePages = false;
      }

    } while (hasMorePages);

    console.log(`🎯 Total products fetched from KeyCRM: ${allCrmProducts.length} (${currentPage - 1} pages)`);

    if (allCrmProducts.length === 0) {
      return {
        success: true,
        message: 'No products found in KeyCRM',
        products: [], // Return empty array when no products found
        totalProducts: 0,
        totalPages: currentPage - 1,
        productsUpdated: 0
      };
    }

    // 3. Load Firebase products and match by SKU
    const firebaseSnapshot = await admin.firestore().collection('products').get();
    const firebaseProductsMap = new Map();

    firebaseSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.sku) {
        const normalizedSku = data.sku.trim().toLowerCase();
        firebaseProductsMap.set(normalizedSku, {
          id: doc.id,
          currentStock: data.stock || 0
        });
      }
    });

    console.log(`📊 Firebase products loaded: ${firebaseProductsMap.size}`);

    // 4. Match products and prepare updates
    const updates = [];
    const matched = [];
    const notFound = [];

    for (const crmProduct of allCrmProducts) {
      const crmSKU = crmProduct.sku || crmProduct.article || crmProduct.code;
      // CRITICAL: KeyCRM API doesn't have 'available' field!
      // Calculate: Available = Quantity (всього) - In Reserve (резерв)
      // Example: quantity=11, in_reserve=33 => available=-22 (sold more than in stock)
      const quantity = crmProduct.quantity || 0;
      const inReserve = crmProduct.in_reserve || 0;
      const crmStock = quantity - inReserve;

      if (!crmSKU) {
        console.warn('⚠️ CRM product missing SKU:', crmProduct);
        continue;
      }

      const normalizedCrmSku = crmSKU.trim().toLowerCase();
      const firebaseProduct = firebaseProductsMap.get(normalizedCrmSku);

      if (firebaseProduct) {
        const stockValue = parseInt(crmStock);
        updates.push({
          docId: firebaseProduct.id,
          sku: crmSKU,
          oldStock: firebaseProduct.currentStock,
          newStock: isNaN(stockValue) || stockValue < 0 ? 0 : stockValue
        });
        matched.push(crmSKU);
        console.log(`✅ Matched: SKU "${crmSKU}" → Stock: ${crmStock}`);
      } else {
        notFound.push(crmSKU);
        console.warn(`⚠️ SKU "${crmSKU}" found in KeyCRM but missing in Firebase`);
      }
    }

    console.log(`📊 Matching results: ${matched.length} matched, ${notFound.length} not found`);

    // 5. Batch update Firebase products
    if (updates.length > 0) {
      const batchSize = 500;
      let batchCount = 0;

      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = admin.firestore().batch();
        const chunk = updates.slice(i, i + batchSize);

        chunk.forEach(update => {
          const docRef = admin.firestore().collection('products').doc(update.docId);
          batch.update(docRef, {
            stock: update.newStock,
            updatedAt: new Date().toISOString(),
            lastSyncedFromCRM: new Date().toISOString()
          });
        });

        await batch.commit();
        batchCount++;
        console.log(`✅ Batch ${batchCount}/${Math.ceil(updates.length / batchSize)} committed (${chunk.length} updates)`);
      }

      console.log(`🎉 Sync completed! Updated ${updates.length} products`);
    }

    return {
      success: true,
      products: allCrmProducts, // Return products array for client-side processing
      totalProducts: allCrmProducts.length,
      totalPages: currentPage - 1,
      productsMatched: matched.length,
      productsUpdated: updates.length,
      productsNotFound: notFound.length,
      notFoundSKUs: notFound.slice(0, 10) // Return first 10 for logging
    };

  } catch (error) {
    console.error('❌ KeyCRM Products Sync failed:', getSafeErrorMessage(error));
    throw error;
  }
}

// Manual trigger (called from admin panel)
exports.syncProductsFromKeyCRM = functions.https.onCall(async (data, context) => {
  try {
    const result = await performProductSync();
    return result;
  } catch (error) {
    console.error('❌ Manual sync failed:', getSafeErrorMessage(error));
    throw new functions.https.HttpsError('internal', getSafeErrorMessage(error));
  }
});

// ⏰ AUTOMATIC HOURLY SYNC - Scheduled Cloud Function (v2)
// Runs every hour automatically to keep stock updated
exports.autoSyncProductsHourly = onSchedule('0 * * * *', async (event) => {
  console.log('⏰ Starting scheduled hourly product sync...');

  try {
    const result = await performProductSync();

    console.log('✅ Scheduled sync completed:', {
      totalProducts: result.totalProducts,
      productsUpdated: result.productsUpdated,
      productsNotFound: result.productsNotFound
    });

    // Log to Firestore for tracking
    await admin.firestore().collection('sync_logs').add({
      type: 'scheduled_hourly',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      result: result,
      success: true
    });

    return null;
  } catch (error) {
    console.error('❌ Scheduled sync failed:', getSafeErrorMessage(error));

    // Log error to Firestore
    await admin.firestore().collection('sync_logs').add({
      type: 'scheduled_hourly',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      error: getSafeErrorMessage(error),
      success: false
    });

    // Don't throw - let it retry on next schedule
    return null;
  }
});

// ═══════════════════════════════════════════════════════════════════════
// 🤖 AI CHAT AUTO-RESPONDER (Gemini 2.0 Flash)
// ═══════════════════════════════════════════════════════════════════════

const GEMINI_API_KEY = "AIzaSyA11Wu1XUxEXXeCz3t_NfOr0ygoEblvbhY";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

/**
 * 🤖 HTTP Trigger: Generate AI response for chat
 * Called by client-side chat widget when user sends a message
 */
exports.aiChatResponder = functions.https.onRequest(async (req, res) => {
  // CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).send('');
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  const { chatId, messageId, messageText } = req.body;

  if (!chatId || !messageText) {
    return res.status(400).json({ error: 'Missing chatId or messageText' });
  }

  console.log(`📨 AI request for chat ${chatId}:`, messageText.substring(0, 50));

  try {
    // Get AI settings
    const settingsDoc = await admin.firestore()
      .collection('settings')
      .doc('chat_config')
      .get();

    if (!settingsDoc.exists) {
      console.log('⚠️ No chat_config settings found');
      return res.status(200).json({ skipped: true, reason: 'no_settings' });
    }

    const settings = settingsDoc.data();
    const aiEnabled = settings.aiEnabled || settings.enabled || false;

    if (!aiEnabled) {
      console.log('🚫 AI is disabled in settings');
      return res.status(200).json({ skipped: true, reason: 'ai_disabled' });
    }

    // Get chat history for context
    const historySnap = await admin.firestore()
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .orderBy('timestamp', 'desc')
      .limit(6)
      .get();

    const history = [];
    historySnap.docs.reverse().forEach(doc => {
      const msg = doc.data();
      if (msg.text) {
        history.push({
          role: msg.sender === 'client' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      }
    });

    // Build Gemini request
    const systemPrompt = settings.aiSystemPrompt ||
      'Ти корисний асистент інтернет-магазину. Відповідай дружньо українською мовою.';

    console.log('📝 System prompt length:', systemPrompt.length);
    console.log('📝 System prompt preview:', systemPrompt.substring(0, 200) + '...');

    const requestBody = {
      contents: history,
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 2048,
        topP: 0.95
      }
    };

    console.log('🤖 Calling Gemini API...');

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API error:', response.status, errorText);
      return res.status(500).json({ error: 'Gemini API error' });
    }

    const data = await response.json();
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiText) {
      console.error('❌ No text in Gemini response');
      return res.status(500).json({ error: 'No AI response' });
    }

    console.log('✅ AI response:', aiText.substring(0, 100) + '...');

    // Save AI response
    await admin.firestore()
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .add({
        sender: 'ai',
        senderName: 'Перчик 🌶️',
        text: aiText,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        read: false,
        type: 'text'
      });

    // Update chat document
    await admin.firestore()
      .collection('chats')
      .doc(chatId)
      .update({
        lastMessage: aiText.substring(0, 100),
        lastMessageTime: admin.firestore.FieldValue.serverTimestamp()
      });

    console.log(`✅ AI responded to chat ${chatId}`);
    return res.status(200).json({ success: true, response: aiText });

  } catch (error) {
    console.error('❌ AI Chat Error:', getSafeErrorMessage(error));
    return res.status(500).json({ error: getSafeErrorMessage(error) });
  }
});

