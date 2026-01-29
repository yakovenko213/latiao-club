const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');
// 👇 Нові бібліотеки для адмінки
const express = require('express');
const basicAuth = require('basic-auth');
const path = require('path');

admin.initializeApp();

// const MONO_TOKEN = "m6veKEWDDwa6i0kh_3Ansgw";
const MONO_TOKEN = "uouPODS5nvAT-h1MJcRYJ3QzL_QTJzQd47uWMPMlO9Ac";
const MY_WEBHOOK_URL = "https://handlemonowebhook-6bhm4jhyba-uc.a.run.app";
const MONO_API_URL = "https://api.monobank.ua/api/merchant/invoice/create";

function getSafeErrorMessage(error) {
  if (!error) return 'Unknown error';
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  return String(error);
}

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

      // TRIGGER KEYCRM SYNC
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