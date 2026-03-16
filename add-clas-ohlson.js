const admin = require('firebase-admin');
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'handle-litt'
});

const db = admin.firestore();

async function addClasOhlsonCategory() {
  try {
    // Check if Clas Ohlson already exists
    const existing = await db.collection('globalCategories')
      .where('name_no', '==', 'Clas Ohlson')
      .get();

    if (!existing.empty) {
      console.log('✅ Clas Ohlson finnes allerede i databasen');
      process.exit(0);
    }

    // Get the highest order number
    const categories = await db.collection('globalCategories')
      .orderBy('order', 'desc')
      .limit(1)
      .get();

    const nextOrder = categories.empty ? 0 : categories.docs[0].data().order + 1;

    // Add Clas Ohlson category
    await db.collection('globalCategories').add({
      name_no: 'Clas Ohlson',
      name_en: 'Clas Ohlson',
      emoji: '🔧',
      order: nextOrder,
      approved: true
    });

    console.log('✅ Clas Ohlson-kategorien er lagt til!');
    console.log(`   Order: ${nextOrder}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Feil:', error);
    process.exit(1);
  }
}

addClasOhlsonCategory();
