// APPROVE ALLE VARER - Kjør i Console på hovedsiden
// Setter approved: true på ALLE varer i globalItems

async function approveAllItems() {
  console.log('✅ Setter approved: true på alle varer...\n');

  const allItems = await db.collection('globalItems').get();
  console.log(`📊 Totalt ${allItems.size} varer funnet`);

  let updated = 0;
  let alreadyApproved = 0;

  for (const doc of allItems.docs) {
    const data = doc.data();

    if (data.approved === true) {
      alreadyApproved++;
      continue;
    }

    // Oppdater til approved: true
    await doc.ref.update({ approved: true });
    updated++;

    if (updated % 100 === 0) {
      console.log(`  ✅ ${updated} varer approved...`);
    }
  }

  console.log(`\n✅ FERDIG!`);
  console.log(`✅ Nye approvals: ${updated}`);
  console.log(`⏭️  Allerede approved: ${alreadyApproved}`);
  console.log(`📊 Totalt: ${allItems.size} varer`);
  console.log(`\n🔄 Refresh admin-siden for å se alle varene!`);
}

approveAllItems();
