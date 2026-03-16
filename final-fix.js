// FINAL FIX - Rydder opp og legger til alt riktig
// Kjør i Console på hovedsiden

async function finalFix() {
  console.log('🔧 FINAL FIX - Rydder opp alt...\n');

  // STEG 1: Slett alle varer med FEIL struktur (no/en i stedet for name_no/name_en)
  console.log('1️⃣ Sletter varer med feil struktur...');
  const allItems = await db.collection('globalItems').get();

  let deletedWrong = 0;
  for (const doc of allItems.docs) {
    const data = doc.data();
    // Hvis den har 'no' eller 'en' felt (feil struktur), slett den
    if (data.hasOwnProperty('no') || data.hasOwnProperty('en')) {
      await doc.ref.delete();
      deletedWrong++;
    }
  }
  console.log(`   ✅ Slettet ${deletedWrong} varer med feil struktur\n`);

  // STEG 2: Sjekk hvor mange varer som er igjen
  const remaining = await db.collection('globalItems').get();
  console.log(`   📊 ${remaining.size} varer gjenstår\n`);

  // STEG 3: Fjern duplikater (samme name_no + category)
  console.log('2️⃣ Fjerner duplikater...');
  const itemMap = new Map();
  const remainingSnapshot = await db.collection('globalItems').get();

  remainingSnapshot.forEach(doc => {
    const data = doc.data();
    const key = `${data.name_no}|||${data.category}`;
    if (!itemMap.has(key)) {
      itemMap.set(key, []);
    }
    itemMap.get(key).push(doc.id);
  });

  let deletedDupes = 0;
  for (const [key, docIds] of itemMap.entries()) {
    if (docIds.length > 1) {
      // Slett alle unntatt første
      for (let i = 1; i < docIds.length; i++) {
        await db.collection('globalItems').doc(docIds[i]).delete();
        deletedDupes++;
      }
    }
  }
  console.log(`   ✅ Fjernet ${deletedDupes} duplikater\n`);

  // STEG 4: Approve alle eksisterende varer
  console.log('3️⃣ Approver alle eksisterende varer...');
  const toApprove = await db.collection('globalItems').get();
  let approved = 0;
  for (const doc of toApprove.docs) {
    const data = doc.data();
    if (data.approved !== true) {
      await doc.ref.update({ approved: true });
      approved++;
    }
  }
  console.log(`   ✅ Approved ${approved} varer\n`);

  // STEG 5: Legg til de 4 viktige varene med RIKTIG struktur
  console.log('4️⃣ Legger til quinoa, tacokrydder, linser røde, tofu...');
  const itemsToAdd = [
    { name_no: 'quinoa', name_en: 'quinoa', category: 'Tørrvarelager & Hermetikk' },
    { name_no: 'tacokrydder', name_en: 'taco seasoning', category: 'Urter & Krydder' },
    { name_no: 'linser røde', name_en: 'red lentils', category: 'Tørrvarelager & Hermetikk' },
    { name_no: 'tofu', name_en: 'tofu', category: 'Meieri & Kjøl' }
  ];

  let added = 0;
  for (const item of itemsToAdd) {
    const existing = await db.collection('globalItems')
      .where('name_no', '==', item.name_no)
      .where('category', '==', item.category)
      .get();

    if (existing.size === 0) {
      await db.collection('globalItems').add({
        ...item,
        approved: true
      });
      console.log(`   ✅ La til: ${item.name_no}`);
      added++;
    } else {
      console.log(`   ⏭️  ${item.name_no} finnes allerede`);
    }
  }

  // STEG 6: Rapport
  const final = await db.collection('globalItems').get();
  console.log(`\n✅ FERDIG!`);
  console.log(`🗑️  Slettet ${deletedWrong} varer med feil struktur`);
  console.log(`🗑️  Slettet ${deletedDupes} duplikater`);
  console.log(`✅ Approved ${approved} varer`);
  console.log(`➕ La til ${added} nye varer`);
  console.log(`\n📊 TOTALT: ${final.size} varer i Firestore`);
  console.log(`\n🔄 REFRESH admin-siden og hovedsiden for å se endringene!`);
  console.log(`\nTest quinoa: Skriv "quinoa" i søkefeltet på hovedsiden`);
}

finalFix();
