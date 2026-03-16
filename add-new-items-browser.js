// Kjør dette scriptet i nettleserens console på admin-siden
// 1. Åpne https://handle-litt.web.app/admin.html
// 2. Logg inn
// 3. Åpne Developer Console (Cmd+Option+J på Mac)
// 4. Kopier og lim inn hele denne filen i console
// 5. Trykk Enter

async function addNewItems() {
  console.log('🔍 Legger til nye varer i Firestore...');

  const newItems = [
    // Tørrvarelager & Hermetikk
    { name_no: 'quinoa', name_en: 'quinoa', category: 'Tørrvarelager & Hermetikk' },
    { name_no: 'bulgur', name_en: 'bulgur', category: 'Tørrvarelager & Hermetikk' },
    { name_no: 'couscous', name_en: 'couscous', category: 'Tørrvarelager & Hermetikk' },
    { name_no: 'linser', name_en: 'lentils', category: 'Tørrvarelager & Hermetikk' },
    { name_no: 'linser røde', name_en: 'red lentils', category: 'Tørrvarelager & Hermetikk' },
    { name_no: 'linser grønne', name_en: 'green lentils', category: 'Tørrvarelager & Hermetikk' },
    { name_no: 'linser brune', name_en: 'brown lentils', category: 'Tørrvarelager & Hermetikk' },
    { name_no: 'nudler', name_en: 'noodles', category: 'Tørrvarelager & Hermetikk' },
    { name_no: 'risnudler', name_en: 'rice noodles', category: 'Tørrvarelager & Hermetikk' },
    { name_no: 'glassnudler', name_en: 'glass noodles', category: 'Tørrvarelager & Hermetikk' },
    { name_no: 'eggnudler', name_en: 'egg noodles', category: 'Tørrvarelager & Hermetikk' },
    { name_no: 'ramen', name_en: 'ramen', category: 'Tørrvarelager & Hermetikk' },

    // Brød & Bakervarer
    { name_no: 'tacoskjell', name_en: 'taco shells', category: 'Brød & Bakervarer' },
    { name_no: 'tacoskjell glutenfrie', name_en: 'gluten free taco shells', category: 'Brød & Bakervarer' },

    // Urter & Krydder
    { name_no: 'tacokrydder', name_en: 'taco seasoning', category: 'Urter & Krydder' },

    // Husholdning & Rengjøring
    { name_no: 'tannkrem', name_en: 'toothpaste', category: 'Husholdning & Rengjøring' },
    { name_no: 'tannbørste', name_en: 'toothbrush', category: 'Husholdning & Rengjøring' },
    { name_no: 'tanntråd', name_en: 'dental floss', category: 'Husholdning & Rengjøring' },
    { name_no: 'munnvann', name_en: 'mouthwash', category: 'Husholdning & Rengjøring' },

    // Meieri & Kjøl (tofu)
    { name_no: 'tofu', name_en: 'tofu', category: 'Meieri & Kjøl' }
  ];

  let added = 0;
  let skipped = 0;

  for (const item of newItems) {
    try {
      // Sjekk om varen allerede finnes
      const existingQuery = await db.collection('globalItems')
        .where('name_no', '==', item.name_no)
        .where('category', '==', item.category)
        .get();

      if (existingQuery.size > 0) {
        console.log(`⏭️  "${item.name_no}" finnes allerede - hopper over`);
        skipped++;
        continue;
      }

      // Legg til ny vare
      await db.collection('globalItems').add(item);
      console.log(`✅ La til: "${item.name_no}" i ${item.category}`);
      added++;
    } catch (error) {
      console.error(`❌ Feil ved adding "${item.name_no}":`, error);
    }
  }

  console.log(`\n✅ Ferdig! ${added} nye varer lagt til, ${skipped} eksisterte allerede.`);
  console.log('🔄 Last inn siden på nytt for å se endringene.');
}

// Kjør funksjonen
addNewItems();
