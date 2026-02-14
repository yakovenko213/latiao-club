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

// const MONO_TOKEN = "uouPODS5nvAT-h1MJcRYJ3QzL_QTJzQd47uWMPMlO9Ac";
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

    // Determine if this is a deposit (100 UAH) or full payment
    // Check both payment.type and amountPaid to ensure correct detection
    const paymentType = orderData.payment?.type;
    const amountPaid = orderData.payment?.amountPaid || 0;
    const totalAmount = orderData.summary?.total || orderData.total;

    // It's a deposit if:
    // 1. payment.type is explicitly 'deposit', OR
    // 2. amountPaid is 100 UAH (deposit amount)
    const isDeposit = paymentType === 'deposit' || (amountPaid > 0 && amountPaid === 100);
    const managerComment = isDeposit ? "ПРЕДОПЛАТА" : "Повна оплата";

    console.log(`💳 Payment Type Detection for Order ${orderId}:`, {
      paymentType,
      amountPaid,
      totalAmount,
      isDeposit,
      managerComment
    });

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

      // ============================================
      // 🪙 CASHBACK CREDITING SYSTEM
      // Award cashback after successful payment
      // ============================================
      try {
        // Prevent double-crediting
        if (orderData.cashbackAwarded) {
          console.log(`⚠️ Cashback already awarded for order ${orderDoc.id}, skipping...`);
        } else {
          console.log(`🪙 Starting cashback crediting for order ${orderDoc.id}...`);

          // 1. Get cashback percentage from config (default 8%)
          const configDoc = await admin.firestore().collection('config').doc('general_config').get();
          const cashbackPercent = configDoc.exists() ? (configDoc.data().cashbackPercent || 8) : 8;
          const isCashbackEnabled = configDoc.exists() ? (configDoc.data().isCashbackEnabled !== false) : true;

          if (!isCashbackEnabled) {
            console.log('🪙 Cashback system is disabled, skipping...');
          } else {
            // 2. Calculate earned cashback (percentage of total order amount)
            const earnedCashback = Math.floor(totalAmount * (cashbackPercent / 100));
            console.log(`🪙 Calculated cashback: ${earnedCashback} грн (${cashbackPercent}% of ${totalAmount} грн)`);

            if (earnedCashback <= 0) {
              console.log('🪙 Cashback amount is 0, skipping...');
            } else {
              // 3. Find user by phone number
              const customerPhone = orderData.customer?.phone || orderData.phone;
              if (!customerPhone) {
                console.log('⚠️ No customer phone found, cannot credit cashback');
              } else {
                // Normalize phone number
                const normalizePhone = (phone) => {
                  const digits = phone.replace(/\D/g, '');
                  if (digits.length === 10) return '+38' + digits;
                  if (digits.length === 12 && digits.startsWith('38')) return '+' + digits;
                  return phone;
                };

                const normalizedPhone = normalizePhone(customerPhone);
                console.log(`🪙 Looking up user by phone: ${normalizedPhone}`);

                const userRef = admin.firestore().collection('users').doc(normalizedPhone);
                const userDoc = await userRef.get();

                if (!userDoc.exists()) {
                  // Create new user document if doesn't exist
                  console.log(`🪙 Creating new user document for ${normalizedPhone}`);
                  await userRef.set({
                    phone: normalizedPhone,
                    name: orderData.customer?.fullName || '',
                    cashbackBalance: earnedCashback,
                    totalCashbackAwarded: earnedCashback,
                    totalCashbackSpent: 0,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                  });
                } else {
                  // Update existing user
                  console.log(`🪙 Updating existing user ${normalizedPhone}`);
                  await userRef.update({
                    cashbackBalance: admin.firestore.FieldValue.increment(earnedCashback),
                    totalCashbackAwarded: admin.firestore.FieldValue.increment(earnedCashback),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                  });
                }

                // 4. Create transaction record
                console.log(`🪙 Creating transaction record...`);
                await admin.firestore().collection('cashback_transactions').add({
                  userId: normalizedPhone,
                  userName: orderData.customer?.fullName || 'Клієнт',
                  amount: earnedCashback,
                  type: 'order_reward',
                  description: `Нараховано за замовлення #${orderDoc.id}`,
                  orderId: orderDoc.id,
                  createdAt: admin.firestore.FieldValue.serverTimestamp(),
                  status: 'completed'
                });

                // 5. Update order with cashback info
                console.log(`🪙 Updating order with cashback info...`);
                await orderDoc.ref.update({
                  cashbackAwarded: earnedCashback,
                  cashbackPercent: cashbackPercent,
                  cashbackCreditedAt: admin.firestore.FieldValue.serverTimestamp()
                });

                console.log(`✅ Cashback credited successfully: ${earnedCashback} грн to ${normalizedPhone}`);
              }
            }
          }
        }
      } catch (cashbackError) {
        console.error('❌ Error crediting cashback (non-blocking):', getSafeErrorMessage(cashbackError));
      }

      // TRIGGER KEYCRM ORDER SYNC
      await syncToKeyCRM(orderDoc.id);

    } else if (status === 'failure') {
      await orderDoc.ref.update({
        'payment.status': 'failure',
        'payment.statusLabel': 'Помилка оплати'
      });
    } else if (status === 'reversed') {
      // ============================================
      // TODO: FUTURE ENHANCEMENT - Handle Order Cancellation
      // ============================================
      // When an order is cancelled/reversed, cashback should be debited
      // Implementation steps:
      // 1. Check if cashback was awarded (orderData.cashbackAwarded)
      // 2. Deduct from user's cashbackBalance (if balance is sufficient)
      // 3. Create transaction record with type: 'order_cancellation'
      // 4. Update order status to 'cancelled'
      console.log('⚠️ Order reversed - cashback reversal not yet implemented');
      
      await orderDoc.ref.update({
        'payment.status': 'reversed',
        'payment.statusLabel': 'Скасовано',
        'status': 'cancelled'
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
  const startTime = new Date();
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔄 Starting KeyCRM Sync at:', startTime.toISOString());
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    console.log('🔗 Starting KeyCRM Products Sync...');

    // 1. Fetch API Key from Firestore settings
    console.log('📥 Fetching KeyCRM API Key from Firestore settings/config...');
    const settingsDoc = await admin.firestore().collection('settings').doc('config').get();

    if (!settingsDoc.exists) {
      const error = 'Settings document (settings/config) does not exist';
      console.error('❌', error);
      throw new Error(error);
    }

    const settingsData = settingsDoc.data();
    console.log('📄 Settings doc exists. Keys available:', Object.keys(settingsData || {}));

    if (!settingsData.keycrmApiKey) {
      const error = 'KeyCRM API Key not found in settings/config. Please add it in Settings > Інтеграції';
      console.error('❌', error);
      throw new Error(error);
    }

    const apiKey = settingsData.keycrmApiKey;
    console.log('✅ API Key loaded from settings (length:', apiKey.length, 'chars)');

    // 2. Fetch products with pagination from KeyCRM
    console.log('📦 Starting pagination fetch from KeyCRM API...');
    const allCrmProducts = [];
    let currentPage = 1;
    let hasMorePages = true;
    const limit = 50;

    do {
      const targetUrl = `https://openapi.keycrm.app/v1/offers?limit=${limit}&page=${currentPage}`;
      console.log(`📄 Fetching page ${currentPage}:`, targetUrl);

      try {
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
          throw new Error(`KeyCRM API error: ${response.status} ${response.statusText} - ${errorText}`);
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
      } catch (pageError) {
        console.error(`❌ Error fetching page ${currentPage}:`, getSafeErrorMessage(pageError));
        throw pageError;
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

    const endTime = new Date();
    const duration = endTime - startTime;
    console.log('✅ Sync finished at:', endTime.toISOString());
    console.log(`⏱️ Total sync duration: ${duration}ms (${(duration / 1000).toFixed(2)}s)`);

    return {
      success: true,
      products: allCrmProducts, // Return products array for client-side processing
      totalProducts: allCrmProducts.length,
      totalPages: currentPage - 1,
      productsMatched: matched.length,
      productsUpdated: updates.length,
      productsNotFound: notFound.length,
      notFoundSKUs: notFound.slice(0, 10), // Return first 10 for logging
      syncDuration: duration
    };

  } catch (error) {
    const errorMessage = getSafeErrorMessage(error);
    const errorStack = error.stack || 'No stack trace';

    console.error('❌ KeyCRM Products Sync failed:', errorMessage);
    console.error('📚 Stack trace:', errorStack);

    // ✅ TASK 1.4: Log error to dedicated Firestore collection
    try {
      await admin.firestore().collection('logs').doc('sync_errors').collection('errors').add({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        error: errorMessage,
        stack: errorStack,
        type: 'keycrm_sync_error',
        context: {
          function: 'performProductSync',
          stage: error.stage || 'unknown'
        }
      });
      console.log('📝 Error logged to Firestore logs/sync_errors');
    } catch (logError) {
      console.error('⚠️ Failed to log error to Firestore:', getSafeErrorMessage(logError));
    }

    throw error;
  }
}

// Manual trigger (called from admin panel)
exports.syncProductsFromKeyCRM = functions.https.onCall(async (data, context) => {
  try {
    const result = await performProductSync();

    // Update sync stats for admin panel display (same as scheduled sync)
    await admin.firestore().collection('settings').doc('stockSyncStats').set({
      lastSyncTimestamp: admin.firestore.FieldValue.serverTimestamp(),
      lastSyncResult: {
        success: true,
        totalProducts: result.totalProducts,
        productsUpdated: result.productsUpdated,
        productsNotFound: result.productsNotFound,
        productsMatched: result.productsMatched
      },
      lastSyncType: 'manual',
      nextScheduledSync: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    }, { merge: true });

    return result;
  } catch (error) {
    console.error('❌ Manual sync failed:', getSafeErrorMessage(error));

    // Update sync stats with error
    await admin.firestore().collection('settings').doc('stockSyncStats').set({
      lastSyncTimestamp: admin.firestore.FieldValue.serverTimestamp(),
      lastSyncResult: {
        success: false,
        error: getSafeErrorMessage(error)
      },
      lastSyncType: 'manual'
    }, { merge: true });

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

// ⏰ AUTOMATIC 30-MINUTE SYNC - Scheduled Cloud Function (v2)
// Runs every 30 minutes to keep stock freshly updated
// More frequent than hourly sync for better inventory accuracy
exports.scheduledStockSync = onSchedule({
  schedule: 'every 30 minutes',
  timeZone: 'Europe/Kiev',
  timeoutSeconds: 300,
  memory: '256MiB'
}, async (event) => {
  console.log('⏰ Starting scheduled 30-minute stock sync...');

  try {
    const result = await performProductSync();

    console.log('✅ Scheduled 30-min sync completed:', {
      totalProducts: result.totalProducts,
      productsUpdated: result.productsUpdated,
      productsNotFound: result.productsNotFound
    });

    // Update sync stats for admin panel display
    await admin.firestore().collection('settings').doc('stockSyncStats').set({
      lastSyncTimestamp: admin.firestore.FieldValue.serverTimestamp(),
      lastSyncResult: {
        success: true,
        totalProducts: result.totalProducts,
        productsUpdated: result.productsUpdated,
        productsNotFound: result.productsNotFound,
        productsMatched: result.productsMatched
      },
      nextScheduledSync: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    }, { merge: true });

    // Log to Firestore for tracking
    await admin.firestore().collection('sync_logs').add({
      type: 'scheduled_30min',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      result: result,
      success: true
    });

    return null;
  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ CRITICAL: Scheduled 30-min sync failed');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Error message:', getSafeErrorMessage(error));
    console.error('Error stack:', error.stack);

    // Log DETAILED error to dedicated collection for debugging
    try {
      await admin.firestore().collection('logs').doc('sync_errors').collection('errors').add({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        isoTimestamp: new Date().toISOString(),
        type: 'scheduled_30min_sync',
        errorMessage: getSafeErrorMessage(error),
        errorStack: error.stack || null,
        environment: 'cloud_function'
      });
      console.log('✅ Error logged to logs/sync_errors collection');
    } catch (logError) {
      console.error('⚠️ Failed to log error to Firestore:', getSafeErrorMessage(logError));
    }

    // Update sync stats with error
    await admin.firestore().collection('settings').doc('stockSyncStats').set({
      lastSyncTimestamp: admin.firestore.FieldValue.serverTimestamp(),
      lastSyncResult: {
        success: false,
        error: getSafeErrorMessage(error)
      },
      nextScheduledSync: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    }, { merge: true });

    // Log error to Firestore (backward compatibility)
    await admin.firestore().collection('sync_logs').add({
      type: 'scheduled_30min',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      error: getSafeErrorMessage(error),
      success: false
    });

    // Don't throw - let it retry on next schedule
    return null;
  }
});

// ═══════════════════════════════════════════════════════════════════════
// 📱 SCHEDULED SMS SENDER - TurboSMS Queue Processor
// Runs every 15 minutes to send scheduled SMS messages from sms_queue
// ═══════════════════════════════════════════════════════════════════════

/**
 * ⏰ Scheduled Cloud Function: Process SMS Queue
 * Runs every 15 minutes to check and send pending SMS messages
 */
exports.scheduledSmsSender = onSchedule({
  schedule: 'every 15 minutes',
  timeZone: 'Europe/Kiev',
  timeoutSeconds: 120,
  memory: '256MiB'
}, async (event) => {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📱 [SMS SCHEDULER] Starting scheduled SMS processor...');
  console.log('═══════════════════════════════════════════════════════════');

  const db = admin.firestore();
  const now = new Date();
  const results = {
    processed: 0,
    sent: 0,
    failed: 0,
    skippedOutsideHours: 0,
    errors: []
  };

  try {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 1: Get working hours from config/general_config
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    let workingHoursStart = 9;  // Default: 9:00
    let workingHoursEnd = 17;   // Default: 17:00

    try {
      const configDoc = await db.collection('config').doc('general_config').get();
      if (configDoc.exists) {
        const config = configDoc.data();
        if (config.smsWorkingHoursStart) {
          workingHoursStart = parseInt(config.smsWorkingHoursStart.split(':')[0]) || 9;
        }
        if (config.smsWorkingHoursEnd) {
          workingHoursEnd = parseInt(config.smsWorkingHoursEnd.split(':')[0]) || 17;
        }
        console.log(`📅 Working hours loaded from config: ${workingHoursStart}:00 - ${workingHoursEnd}:00`);
      }
    } catch (configError) {
      console.log('⚠️ Could not load working hours config, using defaults');
    }

    // Check if current time is within working hours
    const currentHour = now.getHours();
    const isWithinWorkingHours = currentHour >= workingHoursStart && currentHour < workingHoursEnd;
    
    console.log(`🕐 Current time: ${now.toLocaleTimeString('uk-UA')} (Hour: ${currentHour})`);
    console.log(`📅 Working hours: ${workingHoursStart}:00 - ${workingHoursEnd}:00`);
    console.log(`✅ Within working hours: ${isWithinWorkingHours}`);

    if (!isWithinWorkingHours) {
      console.log('⏰ Outside working hours - skipping SMS sending');
      console.log('═══════════════════════════════════════════════════════════');
      return null;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 2: Get TurboSMS credentials
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    let turboSmsToken = null;
    let senderName = 'Latiao';

    try {
      // Try settings/config first
      const settingsDoc = await db.collection('settings').doc('config').get();
      if (settingsDoc.exists) {
        const settings = settingsDoc.data();
        turboSmsToken = settings.turboSmsToken || settings.apiToken;
        senderName = settings.senderName || senderName;
      }
      
      // Fallback to config collection
      if (!turboSmsToken) {
        const configSnapshot = await db.collection('config').get();
        for (const doc of configSnapshot.docs) {
          const data = doc.data();
          if (data.turboSmsToken) {
            turboSmsToken = data.turboSmsToken;
            senderName = data.senderName || senderName;
            break;
          }
        }
      }
    } catch (credError) {
      console.error('❌ Failed to load TurboSMS credentials:', getSafeErrorMessage(credError));
    }

    if (!turboSmsToken) {
      console.error('❌ TurboSMS API token not found - cannot send SMS');
      await db.collection('sms_logs').add({
        type: 'scheduler_error',
        error: 'TurboSMS API token not found',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      return null;
    }

    console.log('🔑 TurboSMS credentials loaded');
    console.log('📝 Sender name:', senderName);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 3: Query pending SMS from queue
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const pendingQuery = await db.collection('sms_queue')
      .where('status', '==', 'pending')
      .where('scheduledTime', '<=', admin.firestore.Timestamp.fromDate(now))
      .limit(50)  // Process max 50 per run to avoid timeout
      .get();

    console.log(`📋 Found ${pendingQuery.size} pending SMS messages to process`);

    if (pendingQuery.empty) {
      console.log('✅ No pending SMS messages - nothing to do');
      console.log('═══════════════════════════════════════════════════════════');
      return null;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 4: Process each pending SMS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    for (const queueDoc of pendingQuery.docs) {
      results.processed++;
      const queueId = queueDoc.id;
      const queueData = queueDoc.data();

      console.log(`\n📤 Processing SMS #${results.processed}: ${queueId}`);
      console.log(`   📞 Phone: ${queueData.phoneNumber}`);
      console.log(`   📝 Type: ${queueData.type || 'review_request'}`);

      try {
        // Clean phone number for TurboSMS (remove + sign if present)
        let phone = queueData.phoneNumber;
        if (phone.startsWith('+')) {
          phone = phone.substring(1);
        }

        // Send SMS via TurboSMS API
        const response = await fetch('https://api.turbosms.ua/message/send.json', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${turboSmsToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            recipients: [phone],
            sms: {
              sender: senderName,
              text: queueData.messageText
            }
          })
        });

        const result = await response.json();
        console.log(`   📥 TurboSMS response: ${JSON.stringify(result)}`);

        // Check for success (TurboSMS uses various success codes)
        const isSuccess = (
          result.response_code === 0 ||
          result.response_code === '0' ||
          result.response_code === 801 ||
          result.response_code === '801' ||
          result.response_status === 'OK' ||
          result.response_status === 'SUCCESS' ||
          result.response_status === 'SUCCESS_MESSAGE_SENT'
        );

        if (isSuccess) {
          // ✅ SUCCESS - Update queue status
          await db.collection('sms_queue').doc(queueId).update({
            status: 'sent',
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            turboSmsResponse: result.response_status || 'OK',
            turboSmsMessageId: result.message_id || null
          });

          // Update related order if orderId exists
          if (queueData.orderId) {
            await db.collection('orders').doc(queueData.orderId).update({
              reviewRequestStatus: 'sent',
              reviewRequestSent: true,
              reviewRequestSentAt: admin.firestore.FieldValue.serverTimestamp(),
              reviewRequestMethod: 'turbosms-scheduled'
            });
          }

          results.sent++;
          console.log(`   ✅ SMS sent successfully`);

        } else {
          // ❌ FAILED - Mark as failed
          await db.collection('sms_queue').doc(queueId).update({
            status: 'failed',
            failedAt: admin.firestore.FieldValue.serverTimestamp(),
            error: result.response_status || 'Unknown TurboSMS error',
            turboSmsResponse: result
          });

          results.failed++;
          results.errors.push({
            queueId,
            phone: queueData.phoneNumber,
            error: result.response_status
          });
          console.log(`   ❌ SMS failed: ${result.response_status}`);
        }

      } catch (sendError) {
        // ❌ EXCEPTION - Mark as failed
        await db.collection('sms_queue').doc(queueId).update({
          status: 'failed',
          failedAt: admin.firestore.FieldValue.serverTimestamp(),
          error: getSafeErrorMessage(sendError)
        });

        results.failed++;
        results.errors.push({
          queueId,
          phone: queueData.phoneNumber,
          error: getSafeErrorMessage(sendError)
        });
        console.error(`   ❌ Exception: ${getSafeErrorMessage(sendError)}`);
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 5: Log results
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 SMS SCHEDULER RESULTS:');
    console.log(`   📋 Processed: ${results.processed}`);
    console.log(`   ✅ Sent: ${results.sent}`);
    console.log(`   ❌ Failed: ${results.failed}`);
    console.log('═══════════════════════════════════════════════════════════');

    // Log to Firestore
    await db.collection('sms_logs').add({
      type: 'scheduler_run',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      results: results,
      success: results.failed === 0
    });

    return null;

  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ CRITICAL: SMS Scheduler failed');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Error:', getSafeErrorMessage(error));

    await db.collection('sms_logs').add({
      type: 'scheduler_error',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      error: getSafeErrorMessage(error),
      success: false
    });

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


// ═══════════════════════════════════════════════════════════════════════
// 🛒 GOOGLE MERCHANT CENTER XML FEED
// Public HTTP endpoint for Google Shopping scheduled fetch
// ═══════════════════════════════════════════════════════════════════════

/**
 * Configuration for Google Merchant Feed
 */
const MERCHANT_CONFIG = {
  storeName: 'Latiao Club Store',
  storeUrl: 'https://latiao-snack.com.ua',
  storeDescription: 'Найкращі гострі снеки латіо з Китаю в Україні',
  brand: 'Latiao Snack',
  currency: 'UAH',
  condition: 'new',
  productPagePath: '/product.html?id='
};

/**
 * Escapes special XML characters
 */
function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Strips HTML tags from a string
 */
function stripHtml(html) {
  if (!html) return '';
  return String(html)
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Wraps content in CDATA for safe XML inclusion
 */
function wrapCDATA(content) {
  if (!content) return '<![CDATA[]]>';
  const escaped = String(content).replace(/]]>/g, ']]]]><![CDATA[>');
  return `<![CDATA[${escaped}]]>`;
}

/**
 * Generates XML for a single product item
 */
function generateProductXml(productId, product) {
  const title = product.name || product.title || 'Без назви';
  const description = stripHtml(product.description || product.shortDescription || title);
  const price = product.price || 0;
  const stock = product.stock ?? product.quantity ?? 1;
  const availability = stock > 0 ? 'in_stock' : 'out_of_stock';
  
  // Fallback placeholder image (hosted on your domain for reliability)
  const FALLBACK_IMAGE = 'https://latiao-snack.com.ua/images/placeholder-product.png';
  
  // Get all image URLs
  let allImages = [];
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    allImages = product.images.filter(img => img && typeof img === 'string');
  } else if (product.image) {
    allImages = [product.image];
  } else if (product.imageUrl) {
    allImages = [product.imageUrl];
  }
  
  // Process each image URL to ensure it's a valid absolute URL
  allImages = allImages.map(url => {
    if (!url) return null;
    url = String(url).trim();
    
    // Already a Firebase Storage URL - use as is
    if (url.includes('firebasestorage.googleapis.com')) {
      return url;
    }
    
    // Already absolute URL
    if (url.startsWith('https://') || url.startsWith('http://')) {
      return url;
    }
    
    // Relative URL - make absolute
    return MERCHANT_CONFIG.storeUrl + (url.startsWith('/') ? '' : '/') + url;
  }).filter(url => url !== null);
  
  // Get main image (or fallback)
  const mainImage = allImages.length > 0 ? allImages[0] : FALLBACK_IMAGE;
  
  // Get additional images (up to 10 as per Google spec)
  const additionalImages = allImages.slice(1, 11);
  
  const productLink = `${MERCHANT_CONFIG.storeUrl}${MERCHANT_CONFIG.productPagePath}${productId}`;
  const category = product.category || 'Снеки';
  const googleCategory = product.googleCategory || 'Food, Beverages & Tobacco > Food Items > Snack Foods';
  const sku = product.sku || productId;
  const gtin = product.gtin || product.barcode || '';
  
  // Sale price handling
  const isOnSale = product.isOnSale === true && product.originalPrice;
  const salePrice = isOnSale ? price : null;
  const regularPrice = isOnSale ? product.originalPrice : price;
  const weight = product.weight || product.weightGrams || '';
  
  // Build additional images XML
  let additionalImagesXml = '';
  additionalImages.forEach(imgUrl => {
    additionalImagesXml += `
    <g:additional_image_link>${wrapCDATA(imgUrl)}</g:additional_image_link>`;
  });

  return `  <item>
    <g:id>${escapeXml(productId)}</g:id>
    <g:title>${wrapCDATA(title)}</g:title>
    <g:description>${wrapCDATA(description)}</g:description>
    <g:link>${wrapCDATA(productLink)}</g:link>
    <g:image_link>${wrapCDATA(mainImage)}</g:image_link>${additionalImagesXml}
    <g:availability>${availability}</g:availability>
    <g:price>${regularPrice} ${MERCHANT_CONFIG.currency}</g:price>${salePrice ? `
    <g:sale_price>${salePrice} ${MERCHANT_CONFIG.currency}</g:sale_price>` : ''}
    <g:condition>${MERCHANT_CONFIG.condition}</g:condition>
    <g:brand>${escapeXml(MERCHANT_CONFIG.brand)}</g:brand>
    <g:mpn>${escapeXml(sku)}</g:mpn>${gtin ? `
    <g:gtin>${escapeXml(gtin)}</g:gtin>` : ''}
    <g:product_type>${wrapCDATA(category)}</g:product_type>
    <g:google_product_category>${escapeXml(googleCategory)}</g:google_product_category>${weight ? `
    <g:shipping_weight>${weight} g</g:shipping_weight>` : ''}
  </item>
`;
}


/**
 * HTTP Cloud Function: Google Merchant Center XML Feed
 * 
 * Public endpoint that generates XML feed on-the-fly from Firestore products.
 * Implements caching to reduce Firestore reads and costs.
 * 
 * URL: https://us-central1-my-magazin-81c96.cloudfunctions.net/getGoogleFeed
 * 
 * Usage in Google Merchant Center:
 * 1. Go to Products → Feeds → Add feed
 * 2. Select "Scheduled fetch"
 * 3. Paste the function URL
 * 4. Set fetch frequency (daily recommended)
 */
exports.getGoogleFeed = functions.https.onRequest(async (req, res) => {
    console.log('🛒 Google Merchant Feed requested');
    
    try {
      // Set caching headers - cache for 1 hour in CDN and browser
      // This prevents excessive Firestore reads when Google crawls frequently
      res.set('Cache-Control', 'public, max-age=3600, s-maxage=3600');
      res.set('Content-Type', 'application/xml; charset=utf-8');
      
      // Allow CORS for testing
      res.set('Access-Control-Allow-Origin', '*');
      
      if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'GET');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(204).send('');
      }
      
      // Fetch all products from Firestore
      const db = admin.firestore();
      const productsSnapshot = await db.collection('products').get();
      
      if (productsSnapshot.empty) {
        console.log('⚠️ No products found in Firestore');
        return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
<channel>
  <title>${escapeXml(MERCHANT_CONFIG.storeName)}</title>
  <link>${MERCHANT_CONFIG.storeUrl}</link>
  <description>No products available</description>
</channel>
</rss>`);
      }
      
      // Build XML header
      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
<channel>
  <title>${escapeXml(MERCHANT_CONFIG.storeName)}</title>
  <link>${MERCHANT_CONFIG.storeUrl}</link>
  <description>${escapeXml(MERCHANT_CONFIG.storeDescription)}</description>
`;
      
      let productCount = 0;
      let skippedCount = 0;
      
      // Process each product
      productsSnapshot.forEach(doc => {
        const product = doc.data();
        const productId = doc.id;
        
        // Skip hidden/inactive products
        if (product.isVisible === false || product.isActive === false) {
          skippedCount++;
          return;
        }
        
        // Skip products without price
        if (!product.price || product.price <= 0) {
          skippedCount++;
          return;
        }
        
        // Generate product XML
        xml += generateProductXml(productId, product);
        productCount++;
      });
      
      // Close XML
      xml += `</channel>
</rss>`;
      
      console.log(`✅ Generated feed with ${productCount} products (${skippedCount} skipped)`);
      
      return res.status(200).send(xml);
      
    } catch (error) {
      console.error('❌ Google Feed Error:', getSafeErrorMessage(error));
      
      // Return valid XML error response
      res.set('Content-Type', 'application/xml; charset=utf-8');
      return res.status(500).send(`<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
<channel>
  <title>Error</title>
  <description>Feed generation error: ${escapeXml(getSafeErrorMessage(error))}</description>
</channel>
</rss>`);
    }
  });
