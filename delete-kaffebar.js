// Script for å slette Kaffebar/Kafeer-kategorien og alle varer i den
const admin = require('firebase-admin');

// Initialiser med service account
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'handle-litt'
});

const db = admin.firestore();

async function deleteKaffebar() {
  console.log('Sletter Kaffebar/Kafeer-kategorien og alle relaterte varer...');

  // 1. Slett alle varer i Kaffebar/Kafeer-kategorien
  console.log('Søker etter varer i Kaffebar/Kafeer...');
  const itemsSnapshot = await db.collection('globalItems')
    .where('category', '==', 'Kaffebar/Kafeer')
    .get();

  console.log(`Fant ${itemsSnapshot.size} varer i Kaffebar/Kafeer`);

  if (itemsSnapshot.size > 0) {
    const batch = db.batch();
    itemsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log(`✅ Slettet ${itemsSnapshot.size} varer`);
  }

  // 2. Slett Kaffebar/Kafeer-kategorien
  console.log('Søker etter Kaffebar/Kafeer-kategorien...');
  const categoriesSnapshot = await db.collection('globalCategories')
    .where('name_no', '==', 'Kaffebar/Kafeer')
    .get();

  console.log(`Fant ${categoriesSnapshot.size} kategori(er)`);

  if (categoriesSnapshot.size > 0) {
    const batch = db.batch();
    categoriesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log(`✅ Slettet ${categoriesSnapshot.size} kategori(er)`);
  }

  console.log('✅ Ferdig!');
}

deleteKaffebar()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Feil:', error);
    process.exit(1);
  });
