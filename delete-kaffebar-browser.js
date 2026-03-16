// Kjør dette scriptet i nettleserens console på admin-siden
// 1. Åpne https://handle-litt.web.app/admin.html
// 2. Logg inn
// 3. Åpne Developer Console (Cmd+Option+J på Mac)
// 4. Kopier og lim inn hele denne filen i console
// 5. Trykk Enter

async function deleteKaffebarCategory() {
  console.log('🗑️ Sletter Kaffebar/Kafeer-kategorien og alle relaterte varer...');

  try {
    // 1. Slett alle varer i Kaffebar/Kafeer-kategorien
    console.log('📦 Søker etter varer i Kaffebar/Kafeer...');
    const itemsSnapshot = await db.collection('globalItems')
      .where('category', '==', 'Kaffebar/Kafeer')
      .get();

    console.log(`Fant ${itemsSnapshot.size} varer i Kaffebar/Kafeer`);

    if (itemsSnapshot.size > 0) {
      const batch = db.batch();
      itemsSnapshot.docs.forEach(doc => {
        console.log(`  - Sletter vare: ${doc.data().name_no}`);
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log(`✅ Slettet ${itemsSnapshot.size} varer`);
    } else {
      console.log('ℹ️ Ingen varer å slette');
    }

    // 2. Slett Kaffebar/Kafeer-kategorien
    console.log('📁 Søker etter Kaffebar/Kafeer-kategorien...');
    const categoriesSnapshot = await db.collection('globalCategories')
      .where('name_no', '==', 'Kaffebar/Kafeer')
      .get();

    console.log(`Fant ${categoriesSnapshot.size} kategori(er)`);

    if (categoriesSnapshot.size > 0) {
      const batch = db.batch();
      categoriesSnapshot.docs.forEach(doc => {
        console.log(`  - Sletter kategori: ${doc.data().name_no}`);
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log(`✅ Slettet ${categoriesSnapshot.size} kategori(er)`);
    } else {
      console.log('ℹ️ Ingen kategorier å slette');
    }

    console.log('✅ Ferdig! Kaffebar/Kafeer er slettet fra Firestore');

  } catch (error) {
    console.error('❌ Feil:', error);
  }
}

// Kjør funksjonen
deleteKaffebarCategory();
