// ============================================
// SEED ANALYTICS_SESSIONS COLLECTION
// ============================================
// Quick script to add test geography data if collection is empty

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function seedAnalytics() {
  try {
    console.log('🌍 Checking analytics_sessions collection...');
    
    const snapshot = await db.collection('analytics_sessions').limit(1).get();
    
    if (!snapshot.empty) {
      console.log('✅ Collection already has data, skipping seed');
      process.exit(0);
    }
    
    console.log('📝 Collection is empty, adding test data...');
    
    const testData = [
      {
        city: 'Київ',
        region: 'Київська область',
        country: 'Ukraine',
        countryCode: 'UA',
        deviceType: 'desktop',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        trackedBy: 'seed-script'
      },
      {
        city: 'Львів',
        region: 'Львівська область',
        country: 'Ukraine',
        countryCode: 'UA',
        deviceType: 'mobile',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        trackedBy: 'seed-script'
      },
      {
        city: 'Одеса',
        region: 'Одеська область',
        country: 'Ukraine',
        countryCode: 'UA',
        deviceType: 'mobile',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        trackedBy: 'seed-script'
      },
      {
        city: 'Київ',
        region: 'Київська область',
        country: 'Ukraine',
        countryCode: 'UA',
        deviceType: 'mobile',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        trackedBy: 'seed-script'
      },
      {
        city: 'Харків',
        region: 'Харківська область',
        country: 'Ukraine',
        countryCode: 'UA',
        deviceType: 'desktop',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        trackedBy: 'seed-script'
      }
    ];
    
    const batch = db.batch();
    
    testData.forEach(data => {
      const docRef = db.collection('analytics_sessions').doc();
      batch.set(docRef, data);
    });
    
    await batch.commit();
    
    console.log(`✅ Added ${testData.length} test geography sessions`);
    console.log('🌍 Cities: Київ (x2), Львів, Одеса, Харків');
    console.log('📊 Regions: Київська область (x2), Львівська, Одеська, Харківська');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error seeding analytics:', error);
    process.exit(1);
  }
}

seedAnalytics();
