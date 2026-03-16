const admin = require('firebase-admin');
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'handle-litt'
});

const db = admin.firestore();

async function testEnglishSearch() {
  try {
    console.log('\n🔍 Testing English search...\n');

    // Test items
    const testItems = ['carrot', 'tomato', 'milk', 'bread', 'apple', 'banana', 'chicken'];

    // Load items from Firestore
    const itemsSnapshot = await db.collection('globalItems')
      .where('approved', '==', true)
      .get();

    const globalItemsCache = {};
    itemsSnapshot.forEach(doc => {
      const data = doc.data();
      if (!globalItemsCache[data.category]) {
        globalItemsCache[data.category] = [];
      }
      globalItemsCache[data.category].push({
        no: data.name_no,
        en: data.name_en
      });
    });

    console.log(`📦 Loaded ${itemsSnapshot.size} items from Firestore\n`);

    // Test search for each item
    for (const searchTerm of testItems) {
      const normalized = searchTerm.toLowerCase();
      let found = false;
      let foundItem = null;
      let foundCategory = null;

      for (const [category, items] of Object.entries(globalItemsCache)) {
        for (const itemData of items) {
          const enName = (itemData.en || '').toLowerCase();
          if (enName === normalized || enName.includes(normalized) || normalized.includes(enName)) {
            found = true;
            foundItem = itemData;
            foundCategory = category;
            break;
          }
        }
        if (found) break;
      }

      if (found) {
        console.log(`✅ "${searchTerm}" → Found: NO="${foundItem.no}" / EN="${foundItem.en}" (${foundCategory})`);
      } else {
        console.log(`❌ "${searchTerm}" → NOT FOUND`);

        // Try to find with partial match
        console.log(`   Searching for partial matches...`);
        let partialMatches = [];
        for (const [category, items] of Object.entries(globalItemsCache)) {
          for (const itemData of items) {
            const enName = (itemData.en || '').toLowerCase();
            if (enName.includes(searchTerm) || searchTerm.includes(enName)) {
              partialMatches.push(`${itemData.en} (${category})`);
            }
          }
        }
        if (partialMatches.length > 0) {
          console.log(`   Partial matches: ${partialMatches.slice(0, 5).join(', ')}`);
        }
      }
    }

    console.log('\n✅ Test complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testEnglishSearch();
