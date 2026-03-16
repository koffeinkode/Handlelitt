// FULL RESTORE SCRIPT - Kjør i Console på HOVEDSIDEN (ikke admin)
// 1. Åpne https://handle-litt.web.app (HOVEDSIDEN)
// 2. Logg inn
// 3. Åpne Developer Console (Cmd+Option+J)
// 4. Kopier og lim inn hele denne filen i console
// 5. Trykk Enter

async function fullRestore() {
  console.log('🔄 Full restore av ALLE varer fra DATABASE...');

  // DATABASE er allerede lastet på hovedsiden!
  if (typeof DATABASE === 'undefined') {
    console.error('❌ FEIL: DATABASE er ikke lastet. Sørg for at du er på HOVEDSIDEN (ikke admin)!');
    return;
  }

  // Sjekk nåværende antall
  const existingSnapshot = await db.collection('globalItems').get();
  console.log(`📊 Nåværende antall varer i Firestore: ${existingSnapshot.size}`);

  const categoryCount = Object.keys(DATABASE).length;
  let totalItems = 0;
  for (const items of Object.values(DATABASE)) {
    totalItems += items.length;
  }
  console.log(`📦 DATABASE inneholder ${categoryCount} kategorier med ${totalItems} varer totalt`);

  const confirm = window.confirm(`Dette vil restore alle manglende varer fra DATABASE (${totalItems} varer) til Firestore.\n\nNåværende: ${existingSnapshot.size} varer\nForventet etter restore: ~${totalItems} varer\n\nFortsette?`);
  if (!confirm) {
    console.log('❌ Avbrutt av bruker');
    return;
  }

  let added = 0;
  let skipped = 0;

  console.log('\n📦 Starter restore...\n');

  for (const [category, items] of Object.entries(DATABASE)) {
    console.log(`📂 ${category}: ${items.length} varer`);

    for (const itemNo of items) {
      try {
        // Sjekk om varen allerede finnes
        const existing = await db.collection('globalItems')
          .where('no', '==', itemNo)
          .where('category', '==', category)
          .get();

        if (existing.size > 0) {
          skipped++;
          continue;
        }

        // Legg til vare med RIKTIG struktur
        await db.collection('globalItems').add({
          no: itemNo,
          en: itemNo, // Bruk norsk som placeholder for engelsk
          category: category
        });

        added++;
        if (added % 50 === 0) {
          console.log(`  ✅ ${added} varer restored...`);
        }
      } catch (error) {
        console.error(`❌ Feil ved restore av "${itemNo}":`, error);
      }
    }
  }

  console.log(`\n✅ FERDIG!`);
  console.log(`📊 ${added} nye varer lagt til`);
  console.log(`⏭️  ${skipped} eksisterte allerede`);
  console.log(`📈 Totalt antall varer nå: ${existingSnapshot.size + added}`);
  console.log(`\n🔄 Refresh siden for å laste inn den nye cachen!`);
}

fullRestore();
