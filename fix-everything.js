// FIKSER ALT I ÉN OPERASJON - Kjør i Console på hovedsiden
// 1. Fjerner duplikater
// 2. Legger til quinoa, tacokrydder, linser røde, tofu

async function fixEverything() {
  console.log('🔧 Fikser alt...\n');

  // STEG 1: Fjern duplikater
  console.log('1️⃣ Fjerner duplikater...');
  const allItems = await db.collection('globalItems').get();
  console.log(`   Nåværende: ${allItems.size} varer`);

  const itemMap = new Map();
  allItems.forEach(doc => {
    const data = doc.data();
    const key = `${data.no}|||${data.category}`;
    if (!itemMap.has(key)) {
      itemMap.set(key, []);
    }
    itemMap.get(key).push(doc.id);
  });

  let deleted = 0;
  for (const [key, docIds] of itemMap.entries()) {
    if (docIds.length > 1) {
      // Slett alle unntatt første
      for (let i = 1; i < docIds.length; i++) {
        await db.collection('globalItems').doc(docIds[i]).delete();
        deleted++;
      }
    }
  }
  console.log(`   ✅ Fjernet ${deleted} duplikater`);
  console.log(`   📊 Gjenstående: ${allItems.size - deleted} varer\n`);

  // STEG 2: Legg til de 4 viktige varene
  console.log('2️⃣ Legger til quinoa, tacokrydder, linser røde, tofu...');

  const itemsToAdd = [
    { no: 'quinoa', en: 'quinoa', category: 'Tørrvarelager & Hermetikk' },
    { no: 'tacokrydder', en: 'taco seasoning', category: 'Urter & Krydder' },
    { no: 'linser røde', en: 'red lentils', category: 'Tørrvarelager & Hermetikk' },
    { no: 'tofu', en: 'tofu', category: 'Meieri & Kjøl' }
  ];

  let added = 0;
  for (const item of itemsToAdd) {
    // Sjekk om den finnes
    const existing = await db.collection('globalItems')
      .where('no', '==', item.no)
      .where('category', '==', item.category)
      .get();

    if (existing.size === 0) {
      await db.collection('globalItems').add(item);
      console.log(`   ✅ La til: ${item.no}`);
      added++;
    } else {
      console.log(`   ⏭️  ${item.no} finnes allerede`);
    }
  }

  console.log(`\n✅ FERDIG!`);
  console.log(`🗑️  Duplikater fjernet: ${deleted}`);
  console.log(`➕ Nye varer lagt til: ${added}`);
  console.log(`\n🔄 REFRESH SIDEN NÅ for å laste inn endringene!`);
}

fixEverything();
