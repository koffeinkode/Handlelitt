// STEG 1: SLETT ALT
// Kjør i Console på hovedsiden

async function deleteAll() {
  const all = await db.collection('globalItems').get();
  console.log(`Sletter ${all.size} varer...`);

  const confirm = window.confirm(`Slette ALLE ${all.size} varer?`);
  if (!confirm) {
    console.log('Avbrutt');
    return;
  }

  let deleted = 0;
  for (const doc of all.docs) {
    await doc.ref.delete();
    deleted++;
    if (deleted % 100 === 0) {
      console.log(`${deleted} slettet...`);
    }
  }

  console.log(`✅ ${deleted} varer slettet. Firestore er tom.`);
  console.log('Kjør nå steg 2: 2-restore-all.js');
}

deleteAll();
