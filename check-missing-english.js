const admin = require('firebase-admin');
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'handle-litt'
});

const db = admin.firestore();

async function checkMissingEnglish() {
  try {
    const snapshot = await db.collection('globalItems').get();
    console.log(`\n📦 Sjekker ${snapshot.size} varer...\n`);

    let missingCount = 0;
    let sameAsNorwegian = 0;
    const missingList = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const nameNo = data.name_no;
      const nameEn = data.name_en;

      if (!nameEn || nameEn.trim() === '') {
        missingList.push(nameNo);
        missingCount++;
      } else if (nameEn === nameNo) {
        sameAsNorwegian++;
      }
    }

    if (missingList.length > 0) {
      console.log('❌ Varer som mangler engelsk:');
      missingList.forEach(name => console.log(`   - ${name}`));
      console.log('');
    }

    console.log(`✅ Resultat:`);
    console.log(`   Mangler engelsk: ${missingCount}`);
    console.log(`   Samme som norsk: ${sameAsNorwegian}`);
    console.log(`   Korrekt: ${snapshot.size - missingCount - sameAsNorwegian}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Feil:', error);
    process.exit(1);
  }
}

checkMissingEnglish();
