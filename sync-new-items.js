#!/usr/bin/env node

/**
 * SIKKERT SCRIPT: Synkroniserer nye varer fra DATABASE til Firestore
 *
 * Gjør:
 * - Leser DATABASE fra index.html
 * - Sjekker hvilke varer som allerede finnes i Firestore
 * - Legger kun til NYE varer som mangler
 *
 * Gjør IKKE:
 * - Sletter ALDRI eksisterende varer
 * - Endrer IKKE eksisterende varer
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'handle-litt'
});

const db = admin.firestore();

async function syncNewItems() {
    console.log('🔄 Synkroniserer nye varer fra DATABASE til Firestore...\n');

    // 1. Les DATABASE fra index.html
    console.log('1️⃣ Leser DATABASE fra index.html...');
    const indexPath = path.join(__dirname, 'index.html');
    const indexContent = fs.readFileSync(indexPath, 'utf8');

    // Extract DATABASE from index.html (Norwegian version)
    const databaseMatch = indexContent.match(/const DATABASE = \{([\s\S]*?)\n        \};/);
    if (!databaseMatch) {
        console.error('❌ Kunne ikke finne DATABASE i index.html');
        process.exit(1);
    }

    // Parse DATABASE (simple eval approach - works for our use case)
    let DATABASE;
    try {
        eval('DATABASE = {' + databaseMatch[1] + '};');
    } catch (error) {
        console.error('❌ Kunne ikke parse DATABASE:', error);
        process.exit(1);
    }

    // Extract DATABASE_EN (English version)
    const databaseEnMatch = indexContent.match(/const DATABASE_EN = \{([\s\S]*?)\n        \};/);
    let DATABASE_EN;
    if (databaseEnMatch) {
        try {
            eval('DATABASE_EN = {' + databaseEnMatch[1] + '};');
        } catch (error) {
            console.warn('⚠️ Kunne ikke parse DATABASE_EN, fortsetter uten engelsk...');
        }
    }

    // 2. Hent eksisterende varer fra Firestore
    console.log('2️⃣ Henter eksisterende varer fra Firestore...');
    const existingItemsSnapshot = await db.collection('globalItems').get();
    const existingItems = new Set();

    existingItemsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.name_no) {
            existingItems.add(data.name_no.toLowerCase().trim());
        }
    });

    console.log(`   ✅ Fant ${existingItems.size} eksisterende varer i Firestore\n`);

    // 3. Finn nye varer som mangler
    console.log('3️⃣ Sjekker hvilke varer som mangler...');
    const newItems = [];

    for (const [category, items] of Object.entries(DATABASE)) {
        for (const itemName of items) {
            const normalizedName = itemName.toLowerCase().trim();

            if (!existingItems.has(normalizedName)) {
                // Find English name if available
                let englishName = null;
                if (DATABASE_EN && DATABASE_EN[category]) {
                    const indexInCategory = items.indexOf(itemName);
                    if (indexInCategory !== -1 && DATABASE_EN[category][indexInCategory]) {
                        englishName = DATABASE_EN[category][indexInCategory];
                    }
                }

                newItems.push({
                    name_no: itemName,
                    name_en: englishName,
                    category: category,
                    approved: true
                });
            }
        }
    }

    console.log(`   🆕 Fant ${newItems.length} nye varer som skal legges til\n`);

    if (newItems.length === 0) {
        console.log('✅ Ingen nye varer å legge til. Firestore er oppdatert!');
        process.exit(0);
    }

    // 4. Legg til nye varer
    console.log('4️⃣ Legger til nye varer i Firestore...');

    const batch = db.batch();
    let batchCount = 0;
    let totalAdded = 0;

    for (const item of newItems) {
        const docRef = db.collection('globalItems').doc();
        batch.set(docRef, item);
        batchCount++;
        totalAdded++;

        // Firestore batch limit is 500 operations
        if (batchCount === 500) {
            await batch.commit();
            console.log(`   ${totalAdded}/${newItems.length} lagt til...`);
            batchCount = 0;
        }
    }

    // Commit remaining items
    if (batchCount > 0) {
        await batch.commit();
    }

    console.log(`\n✅ FERDIG!`);
    console.log(`➕ ${totalAdded} nye varer lagt til`);
    console.log(`📊 Totalt ${existingItems.size + totalAdded} varer i Firestore nå`);
    console.log(`\n🔒 Ingen eksisterende varer ble slettet eller endret`);
    console.log(`\n🔄 Refresh appen for å se de nye varene!`);
}

syncNewItems()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('❌ Feil:', error);
        process.exit(1);
    });
