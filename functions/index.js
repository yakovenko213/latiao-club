const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');

admin.initializeApp();

// 👇 ВАШ ТОКЕН (Перевірте, чи він тут правильний!)
const MONO_TOKEN = "m6veKEWDDwa6i0kh_3Ansgw"; 

// 👇 ВАША ТОЧНА АДРЕСА ВЕБХУКА (З вашого терміналу)
// Це "двері", в які постукає Монобанк, коли гроші прийдуть
const MY_WEBHOOK_URL = "https://handlemonowebhook-6bhm4jhyba-uc.a.run.app";

const MONO_API_URL = "https://api.monobank.ua/api/merchant/invoice/create";

// Функція для безпечного тексту помилки
function getSafeErrorMessage(error) {
  if (!error) return 'Unknown error';
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  return String(error);
}

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

    // ============================================
    // DETERMINE PAYMENT TYPE FROM ORDER DATA
    // ============================================
    const paymentMethod = orderData.payment?.method || '';
    console.log(`Payment method from order: ${paymentMethod}`);
    
    // Check if it's COD (Cash on Delivery)
    const isCOD = paymentMethod === 'Накладений платіж' || 
                  paymentMethod === 'cod' || 
                  paymentMethod.toLowerCase().includes('накладен');
    
    let invoiceAmount; // Amount to charge via Monobank (in kopiykas)
    let paymentType; // 'deposit' or 'full'
    let depositAmount;
    let restAmount;
    let description;
    
    if (isCOD) {
      // ============================================
      // COD: 100 UAH PREPAYMENT (DEPOSIT)
      // ============================================
      invoiceAmount = 10000; // 100.00 UAH in kopiykas
      paymentType = 'deposit';
      depositAmount = 100;
      restAmount = totalAmount - 100;
      description = `Передоплата за замовлення #${orderId.substring(0, 8).toUpperCase()}`;
      console.log(`💰 COD Deposit: 100 UAH, Rest: ${restAmount} UAH, Total: ${totalAmount} UAH`);
    } else {
      // ============================================
      // ONLINE PAYMENT: FULL AMOUNT
      // ============================================
      invoiceAmount = Math.round(totalAmount * 100);
      paymentType = 'full';
      depositAmount = null;
      restAmount = 0;
      description = `Оплата замовлення #${orderId.substring(0, 8).toUpperCase()}`;
      console.log(`💳 Full Online Payment: ${totalAmount} UAH`);
    }

    // Отримуємо URL сайту динамічно або ставимо заглушку
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

    console.log('📤 Monobank request:', JSON.stringify(payload, null, 2));

    const response = await fetch(MONO_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Token': MONO_TOKEN },
      body: JSON.stringify(payload)
    });

    const responseData = await response.json();

    console.log('📥 Monobank response:', JSON.stringify(responseData, null, 2));

    if (!response.ok || !responseData.invoiceId) {
        console.error("Mono Error:", JSON.stringify(responseData));
        throw new Error(responseData.errCode || 'Monobank Error');
    }

    // ============================================
    // SAVE PAYMENT METADATA TO FIRESTORE
    // ============================================
    const paymentUpdate = {
      'payment.invoiceId': responseData.invoiceId,
      'payment.pageUrl': responseData.pageUrl,
      'payment.status': 'pending',
      'payment.provider': 'Monobank',
      'payment.type': paymentType, // 'deposit' or 'full'
      'payment.amount': totalAmount, // Total order amount
      'payment.amountPaid': 0, // Will be updated when payment succeeds
      'payment.amountDue': restAmount, // Remaining amount
      'payment.createdAt': admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Add deposit fields only if COD
    if (isCOD) {
      paymentUpdate['payment.depositAmount'] = depositAmount;
      paymentUpdate['payment.restAmount'] = restAmount;
    }
    
    await orderRef.update(paymentUpdate);

    console.log(`✅ Invoice created: ${responseData.invoiceId}`);
    console.log(`✅ Payment type: ${paymentType}, Deposit: ${depositAmount || 0}, Rest: ${restAmount}`);

    return { success: true, pageUrl: responseData.pageUrl };

  } catch (error) {
    console.error("Create Invoice Error:", getSafeErrorMessage(error));
    throw new functions.https.HttpsError('internal', getSafeErrorMessage(error));
  }
});

// 2. ОБРОБКА ОПЛАТИ (WEBHOOK)
exports.handleMonoWebhook = functions.https.onRequest(async (req, res) => {
    try {
        console.log("🔔 Webhook received:", JSON.stringify(req.body));
        
        const { invoiceId, status, modifiedDate } = req.body;

        if (!invoiceId) {
            console.log("No invoiceId in webhook");
            return res.status(200).send('OK');
        }

        // Шукаємо замовлення за ID рахунку
        const snapshot = await admin.firestore().collection('orders')
            .where('payment.invoiceId', '==', invoiceId).get();
        
        if (snapshot.empty) {
            console.log(`Order not found for invoice: ${invoiceId}`);
            return res.status(200).send('OK');
        }

        const orderDoc = snapshot.docs[0];
        const currentStatus = orderDoc.data().payment?.status;

        // Логіка оновлення статусів
        if (status === 'success' && currentStatus !== 'paid') {
            console.log(`✅ Payment CONFIRMED for order ${orderDoc.id}`);
            
            const orderData = orderDoc.data();
            const paymentType = orderData.payment?.type || 'full';
            const totalAmount = orderData.summary?.total || orderData.total;
            
            // Determine amounts based on payment type
            let amountPaid = totalAmount;
            let amountDue = 0;
            let statusLabel = 'Сплачено';
            
            if (paymentType === 'deposit') {
                amountPaid = 100;
                amountDue = totalAmount - 100;
                statusLabel = 'Передоплата 100 грн';
                console.log(`💰 Deposit confirmed: 100 UAH paid, ${amountDue} UAH remaining`);
            } else {
                console.log(`💳 Full payment confirmed: ${totalAmount} UAH`);
            }
            
            await orderDoc.ref.update({ 
                'payment.status': 'paid', // Статус для коду (зелена плашка)
                'payment.statusLabel': statusLabel, // Текст для людей
                'payment.amountPaid': amountPaid, // Actual amount paid
                'payment.amountDue': amountDue, // Remaining amount
                'payment.updatedAt': new Date(modifiedDate || Date.now()),
                'status': paymentType === 'deposit' ? 'paid' : 'paid' // Order status
            });
        } else if (status === 'failure') {
            console.log(`❌ Payment FAILED for order ${orderDoc.id}`);
            
            await orderDoc.ref.update({ 
                'payment.status': 'failure',
                'payment.statusLabel': 'Помилка оплати'
            });
        }

        res.status(200).send('OK');
    } catch (e) {
        console.error("Webhook Error:", getSafeErrorMessage(e));
        res.status(200).send('OK'); // Завжди відповідаємо ОК монобанку
    }
});