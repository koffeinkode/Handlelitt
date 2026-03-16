// Script for å slette duplikater via Firebase Admin SDK (ingen quota-limits)
const admin = require('firebase-admin');

// Initialiser med service account (trenger credentials)
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'handle-litt'
});

const db = admin.firestore();

// Finn duplikater basert på name_no + category
async function findDuplicates() {
  const snapshot = await db.collection('globalItems').get();
  const items = [];

  snapshot.forEach(doc => {
    items.push({ id: doc.id, ...doc.data() });
  });

  const duplicateMap = new Map();

  items.forEach(item => {
    const key = `${item.name_no}|${item.category}`;
    if (!duplicateMap.has(key)) {
      duplicateMap.set(key, []);
    }
    duplicateMap.get(key).push(item);
  });

  const duplicates = [];
  duplicateMap.forEach((items, key) => {
    if (items.length > 1) {
      // Behold første, slett resten
      for (let i = 1; i < items.length; i++) {
        duplicates.push(items[i].id);
      }
    }
  });

  return duplicates;
}

async function deleteDuplicates() {
  console.log('Finner duplikater...');
  const duplicateIds = await findDuplicates();

  console.log(`Fant ${duplicateIds.length} duplikater å slette`);

  if (duplicateIds.length === 0) {
    console.log('Ingen duplikater funnet!');
    return;
  }

  // Admin SDK kan slette mange uten quota-limits
  const batch = db.batch();
  duplicateIds.forEach(id => {
    batch.delete(db.collection('globalItems').doc(id));
  });

  console.log('Sletter...');
  await batch.commit();
  console.log('✅ Ferdig! Slettet', duplicateIds.length, 'duplikater');
}

deleteDuplicates()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Feil:', error);
    process.exit(1);
  });
