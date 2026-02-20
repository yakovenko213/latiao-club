// ============================================
// CRM COLUMNS SETUP SCRIPT
// ============================================
// Run this in the browser console on the admin panel
// to create initial CRM columns in Firestore
// ============================================

(async function setupCRMColumns() {
    console.log('🚀 Setting up CRM columns...');
    
    // Wait for Firebase
    if (!window.firebaseInit || !window.firebaseInit.db) {
        console.error('❌ Firebase not initialized. Please run this on the admin panel.');
        return;
    }
    
    const { db, collection, setDoc, doc } = window.firebaseInit;
    
    // Define default CRM columns
    const defaultColumns = [
        {
            id: 'new_lead',
            name: 'Новий лід',
            description: 'Нові покинуті кошики, потребують першого контакту',
            color: '#3b82f6',  // Blue
            order: 0
        },
        {
            id: 'contacted',
            name: 'Контакт встановлено',
            description: 'Зв\'язалися з клієнтом, очікуємо відповіді',
            color: '#8b5cf6',  // Purple
            order: 1
        },
        {
            id: 'negotiation',
            name: 'Переговори',
            description: 'Активні переговори з клієнтом',
            color: '#f59e0b',  // Amber
            order: 2
        },
        {
            id: 'ready_to_order',
            name: 'Готовий замовити',
            description: 'Клієнт готовий оформити замовлення',
            color: '#06b6d4',  // Cyan
            order: 3
        },
        {
            id: 'converted',
            name: 'Конверсія',
            description: 'Замовлення створено успішно',
            color: '#10b981',  // Green
            order: 4
        },
        {
            id: 'not_interested',
            name: 'Не зацікавлений',
            description: 'Клієнт відмовився від покупки',
            color: '#ef4444',  // Red
            order: 5
        }
    ];
    
    try {
        // Create each column
        for (const column of defaultColumns) {
            const columnRef = doc(collection(db, 'crm_columns'), column.id);
            await setDoc(columnRef, {
                name: column.name,
                description: column.description,
                color: column.color,
                order: column.order,
                created_at: new Date()
            });
            
            console.log(`✅ Created column: ${column.name}`);
        }
        
        console.log('');
        console.log('============================================');
        console.log('✅ CRM COLUMNS SETUP COMPLETE!');
        console.log('============================================');
        console.log('');
        console.log('📊 Created columns:');
        defaultColumns.forEach(col => {
            console.log(`   ${col.order + 1}. ${col.name} (${col.id})`);
        });
        console.log('');
        console.log('🎯 Next steps:');
        console.log('   1. Navigate to: Незавершені замовлення → CRM');
        console.log('   2. Verify columns appear on the Kanban board');
        console.log('   3. Add crm_status to abandoned_carts documents to populate cards');
        console.log('');
        console.log('💡 To assign a cart to a column, update the document:');
        console.log('   db.collection("abandoned_carts").doc("CART_ID").update({');
        console.log('     crm_status: "new_lead"  // Use column ID');
        console.log('   })');
        console.log('');
        
    } catch (error) {
        console.error('❌ Error creating columns:', error);
    }
})();
