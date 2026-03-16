// RESTORE MED KORREKT STRUKTUR - Kjør i Console på HOVEDSIDEN
// Legger BARE til varer, sletter INGENTING!
// Bruker DATABASE som allerede er lastet på hovedsiden

async function restoreCorrectStructure() {
  console.log('📦 Restore med KORREKT struktur (name_no/name_en)...\n');

  // DATABASE er allerede lastet på hovedsiden!
  if (typeof DATABASE === 'undefined') {
    console.error('❌ FEIL: DATABASE er ikke lastet. Må kjøres på HOVEDSIDEN!');
    return;
  }

  const categoryCount = Object.keys(DATABASE).length;
  let totalInDatabase = 0;
  for (const items of Object.values(DATABASE)) {
    totalInDatabase += items.length;
  }
  console.log(`📦 DATABASE: ${categoryCount} kategorier, ${totalInDatabase} varer totalt`);

  // Sjekk nåværende antall
  const existing = await db.collection('globalItems').get();
  console.log(`📊 Nåværende i Firestore: ${existing.size} varer\n`);

  const confirm = window.confirm(`Restore alle varer fra DATABASE?\n\nDATABASE: ${totalInDatabase} varer\nNåværende: ${existing.size} varer\n\n⚠️ Sletter INGENTING - legger bare til manglende varer!`);
  if (!confirm) {
    console.log('❌ Avbrutt');
    return;
  }

  let added = 0;
  let skipped = 0;

  console.log('📦 Starter restore...\n');

  for (const [category, items] of Object.entries(DATABASE)) {
    console.log(`📂 ${category}: ${items.length} varer`);

    for (const itemNo of items) {
      try {
        // Sjekk om varen finnes (med KORREKT felt: name_no)
        const exists = await db.collection('globalItems')
          .where('name_no', '==', itemNo)
          .where('category', '==', category)
          .get();

        if (exists.size > 0) {
          skipped++;
          continue;
        }

        // Legg til med KORREKT struktur: name_no, name_en, approved
        await db.collection('globalItems').add({
          name_no: itemNo,
          name_en: itemNo, // Bruk norsk som engelsk for nå
          category: category,
          approved: true
        });

        added++;
        if (added % 100 === 0) {
          console.log(`  ✅ ${added} varer lagt til...`);
        }
      } catch (error) {
        console.error(`❌ Feil ved "${itemNo}":`, error);
      }
    }
  }

  const final = await db.collection('globalItems').get();
  console.log(`\n✅ FERDIG!`);
  console.log(`➕ ${added} varer lagt til`);
  console.log(`⏭️  ${skipped} fantes allerede`);
  console.log(`📊 TOTALT NÅ: ${final.size} varer`);
  console.log(`\n🔄 Refresh admin og hovedsiden for å se alle varene!`);
}

restoreCorrectStructure();
