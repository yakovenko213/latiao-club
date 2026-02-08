// ============================================
// FORCE INITIALIZE STATISTICS DATA
// Copy and paste this into Browser Console (F12)
// Run ONCE in Admin Panel to fix missing fields
// ============================================

async function forceInitStats() {
  console.log('🚀 Starting Force Initialization...');
  
  // Check if Firebase is loaded
  if (!window.firebaseInit || !window.firebaseInit.db) {
    console.error('❌ Firebase not loaded! Open Admin Panel and try again.');
    alert('❌ Firebase not loaded! Make sure you are on the Admin Panel page.');
    return;
  }
  
  // Check authentication (multiple methods)
  let userEmail = 'Unknown';
  if (window.firebaseInit.auth?.currentUser) {
    userEmail = window.firebaseInit.auth.currentUser.email;
    console.log('✅ Authenticated as:', userEmail);
  } else if (window.auth?.currentUser) {
    userEmail = window.auth.currentUser.email;
    console.log('✅ Authenticated as:', userEmail);
  } else {
    console.warn('⚠️ Cannot verify authentication, but proceeding anyway.');
    console.warn('⚠️ If you get permission errors, make sure you are logged in as admin.');
  }
  
  // Extract Firebase functions
  const db = window.firebaseInit.db || window.db;
  const collection = window.firebaseInit.collection || window.collection;
  const getDocs = window.firebaseInit.getDocs || window.getDocs;
  const doc = window.firebaseInit.doc || window.doc;
  const setDoc = window.firebaseInit.setDoc || window.setDoc;
  
  if (!db || !collection || !getDocs || !doc || !setDoc) {
    console.error('❌ Missing Firebase functions!', {
      db: !!db,
      collection: !!collection,
      getDocs: !!getDocs,
      doc: !!doc,
      setDoc: !!setDoc
    });
    alert('❌ Firebase functions not available!');
    return;
  }
  
  try {
    let totalUpdated = 0;
    
    // ============================================
    // STEP 1: Initialize Categories viewCount
    // ============================================
    console.log('\n📂 Step 1: Processing categories...');
    const categoriesSnap = await getDocs(collection(db, 'categories'));
    console.log(`Found ${categoriesSnap.size} categories`);
    
    let batch1Count = 0;
    
    for (const docSnap of categoriesSnap.docs) {
      const data = docSnap.data();
      if (data.viewCount === undefined || data.viewCount === null) {
        try {
          await setDoc(doc(db, 'categories', docSnap.id), {
            viewCount: 0,
            lastViewed: null
          }, { merge: true });
          batch1Count++;
          console.log(`  ✅ Updated: categories/${docSnap.id} → viewCount: 0`);
        } catch (e) {
          console.error(`  ❌ Failed: categories/${docSnap.id}:`, e.message);
        }
      } else {
        console.log(`  ⏭️  Skip: categories/${docSnap.id} (already has viewCount: ${data.viewCount})`);
      }
    }
    
    console.log(`✅ Updated ${batch1Count} categories`);
    totalUpdated += batch1Count;
    
    // ============================================
    // STEP 2: Initialize Pages viewCount
    // ============================================
    console.log('\n📄 Step 2: Processing pages...');
    const pagesSnap = await getDocs(collection(db, 'pages'));
    console.log(`Found ${pagesSnap.size} pages`);
    
    let batch2Count = 0;
    
    for (const docSnap of pagesSnap.docs) {
      const data = docSnap.data();
      if (data.viewCount === undefined || data.viewCount === null) {
        try {
          await setDoc(doc(db, 'pages', docSnap.id), {
            viewCount: 0,
            lastViewed: null
          }, { merge: true });
          batch2Count++;
          console.log(`  ✅ Updated: pages/${docSnap.id} → viewCount: 0`);
        } catch (e) {
          console.error(`  ❌ Failed: pages/${docSnap.id}:`, e.message);
        }
      } else {
        console.log(`  ⏭️  Skip: pages/${docSnap.id} (already has viewCount: ${data.viewCount})`);
      }
    }
    
    console.log(`✅ Updated ${batch2Count} pages`);
    totalUpdated += batch2Count;
    
    // ============================================
    // STEP 3: Initialize Analytics Sessions
    // ============================================
    console.log('\n📊 Step 3: Processing analytics_sessions...');
    const sessionsSnap = await getDocs(collection(db, 'analytics_sessions'));
    console.log(`Found ${sessionsSnap.size} sessions`);
    
    let batch3Count = 0;
    
    for (const docSnap of sessionsSnap.docs) {
      const data = docSnap.data();
      const needsUpdate = !data.city || !data.region || 
                          data.city === '' || data.region === '';
      
      if (needsUpdate) {
        try {
          await setDoc(doc(db, 'analytics_sessions', docSnap.id), {
            city: data.city || 'Невідомо',
            region: data.region || 'Невідомо'
          }, { merge: true });
          batch3Count++;
          console.log(`  ✅ Updated: sessions/${docSnap.id} → city/region: Невідомо`);
        } catch (e) {
          console.error(`  ❌ Failed: sessions/${docSnap.id}:`, e.message);
        }
      }
    }
    
    console.log(`✅ Updated ${batch3Count} sessions`);
    totalUpdated += batch3Count;
    
    // ============================================
    // SUMMARY
    // ============================================
    console.log('\n' + '='.repeat(50));
    console.log('✅ DATA REFRESHED!');
    console.log('='.repeat(50));
    console.log(`📊 Total documents updated: ${totalUpdated}`);
    console.log(`📂 Categories: ${categoriesSnap.size} (checked)`);
    console.log(`📄 Pages: ${pagesSnap.size} (checked)`);
    console.log(`📊 Sessions: ${sessionsSnap.size} (checked)`);
    console.log('='.repeat(50));
    
    alert(
      `✅ DATA REFRESHED!\n\n` +
      `Updated ${totalUpdated} documents\n\n` +
      `Categories: ${categoriesSnap.size}\n` +
      `Pages: ${pagesSnap.size}\n` +
      `Sessions: ${sessionsSnap.size}\n\n` +
      `Refresh the page to see updated statistics.`
    );
    
    return {
      success: true,
      totalUpdated,
      categories: categoriesSnap.size,
      pages: pagesSnap.size,
      sessions: sessionsSnap.size
    };
    
  } catch (error) {
    console.error('❌ Error during initialization:', error);
    alert(`❌ Error: ${error.message}\n\nCheck console for details.`);
    return { success: false, error: error.message };
  }
}

// Auto-execute information
console.log('%c📊 FORCE INIT STATS LOADED', 'color: #4CAF50; font-size: 16px; font-weight: bold;');
console.log('%c⚠️ IMPORTANT: You must be logged in as admin!', 'color: #FF9800; font-size: 14px; font-weight: bold;');
console.log('%cRun: forceInitStats()', 'color: #2196F3; font-size: 14px;');
console.log('This will initialize all missing viewCount and city/region fields.');

// Return the function so it can be called
forceInitStats;
