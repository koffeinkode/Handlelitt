// STEG 2: LEGG TIL ALLE VARER
// Kjør i Console på HOVEDSIDEN (der DATABASE er lastet)

async function restoreAll() {
  if (typeof DATABASE === 'undefined') {
    console.error('FEIL: Må kjøres på hovedsiden, ikke admin!');
    return;
  }

  let total = 0;
  for (const items of Object.values(DATABASE)) {
    total += items.length;
  }

  console.log(`Legger til ${total} varer fra DATABASE...`);

  const confirm = window.confirm(`Legge til ${total} varer?`);
  if (!confirm) {
    console.log('Avbrutt');
    return;
  }

  let added = 0;

  for (const [category, items] of Object.entries(DATABASE)) {
    for (const item of items) {
      await db.collection('globalItems').add({
        name_no: item,
        name_en: item,
        category: category,
        approved: true
      });

      added++;
      if (added % 100 === 0) {
        console.log(`${added}/${total} lagt til...`);
      }
    }
  }

  console.log(`✅ ${added} varer lagt til i Firestore.`);
  console.log('Refresh admin-siden for å se dem.');
}

restoreAll();
