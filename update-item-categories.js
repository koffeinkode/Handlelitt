#!/usr/bin/env node

/**
 * Oppdaterer kategorier for eksisterende varer i Firestore
 *
 * Gjør:
 * - Leser DATABASE fra index.html (kilde til sannhet)
 * - Finner varer i Firestore som har feil kategori
 * - Oppdaterer kategorien til riktig verdi
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'handle-litt'
});

const db = admin.firestore();

async function updateItemCategories() {
    console.log('🔄 Oppdaterer varekategorier i Firestore...\n');

    // 1. Les DATABASE fra index.html
    console.log('1️⃣ Leser DATABASE fra index.html...');
    const indexPath = path.join(__dirname, 'index.html');
    const indexContent = fs.readFileSync(indexPath, 'utf8');

    // Extract DATABASE from index.html
    const databaseMatch = indexContent.match(/const DATABASE = \{([\s\S]*?)\n        \};/);
    if (!databaseMatch) {
        console.error('❌ Kunne ikke finne DATABASE i index.html');
        process.exit(1);
    }

    let DATABASE;
    try {
        eval('DATABASE = {' + databaseMatch[1] + '};');
    } catch (error) {
        console.error('❌ Kunne ikke parse DATABASE:', error);
        process.exit(1);
    }

    // Build a map of item name -> correct category
    const correctCategories = new Map();
    for (const [category, items] of Object.entries(DATABASE)) {
        for (const itemName of items) {
            const normalizedName = itemName.toLowerCase().trim();
            correctCategories.set(normalizedName, category);
        }
    }

    console.log(`   ✅ Lastet ${correctCategories.size} varer fra DATABASE\n`);

    // 2. Hent alle varer fra Firestore
    console.log('2️⃣ Henter eksisterende varer fra Firestore...');
    const itemsSnapshot = await db.collection('globalItems').get();

    const updates = [];
    itemsSnapshot.forEach(doc => {
        const data = doc.data();
        if (!data.name_no) return;

        const normalizedName = data.name_no.toLowerCase().trim();
        const correctCategory = correctCategories.get(normalizedName);

        // Hvis varen finnes i DATABASE og har feil kategori
        if (correctCategory && data.category !== correctCategory) {
            updates.push({
                id: doc.id,
                name: data.name_no,
                oldCategory: data.category,
                newCategory: correctCategory
            });
        }
    });

    console.log(`   📊 Fant ${itemsSnapshot.size} varer i Firestore`);
    console.log(`   🔧 ${updates.length} varer trenger kategori-oppdatering\n`);

    if (updates.length === 0) {
        console.log('✅ Ingen varer trenger oppdatering. Alt er synkronisert!');
        process.exit(0);
    }

    // 3. Vis hvilke varer som vil bli oppdatert
    console.log('3️⃣ Varer som vil bli oppdatert:');
    updates.forEach(u => {
        console.log(`   📦 "${u.name}": ${u.oldCategory} → ${u.newCategory}`);
    });

    // 4. Bekreft før oppdatering
    console.log(`\n⚠️  ADVARSEL: Dette vil oppdatere ${updates.length} varer i Firestore.`);
    console.log('Trykk Ctrl+C for å avbryte, eller Enter for å fortsette...');

    // Wait for user confirmation (in production you might want to skip this)
    await new Promise(resolve => {
        process.stdin.once('data', resolve);
    });

    // 5. Oppdater varer i batches
    console.log('\n4️⃣ Oppdaterer varer...');

    const batch = db.batch();
    let batchCount = 0;
    let totalUpdated = 0;

    for (const update of updates) {
        const docRef = db.collection('globalItems').doc(update.id);
        batch.update(docRef, {
            category: update.newCategory,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        batchCount++;
        totalUpdated++;

        // Firestore batch limit is 500 operations
        if (batchCount === 500) {
            await batch.commit();
            console.log(`   ${totalUpdated}/${updates.length} oppdatert...`);
            batchCount = 0;
        }
    }

    // Commit remaining updates
    if (batchCount > 0) {
        await batch.commit();
    }

    console.log(`\n✅ FERDIG!`);
    console.log(`🔧 ${totalUpdated} varer oppdatert`);
    console.log(`\n🔄 Refresh appen og tøm cache for å se endringene!`);
}

updateItemCategories()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('❌ Feil:', error);
        process.exit(1);
    });
