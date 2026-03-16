#!/usr/bin/env node

/**
 * Fjerner duplikate varer fra Firestore globalItems
 * Beholder kun én versjon av hver vare
 */

const admin = require('firebase-admin');

admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'handle-litt'
});

const db = admin.firestore();

async function removeDuplicates() {
    console.log('🔄 Fjerner duplikate varer fra Firestore...\n');

    // 1. Hent alle varer
    console.log('1️⃣ Henter alle varer fra Firestore...');
    const snapshot = await db.collection('globalItems').get();

    const items = new Map();
    snapshot.forEach(doc => {
        const data = doc.data();
        const name = data.name_no ? data.name_no.toLowerCase().trim() : '';

        if (!items.has(name)) {
            items.set(name, []);
        }
        items.get(name).push({
            id: doc.id,
            name_no: data.name_no,
            category: data.category,
            approved: data.approved,
            doc: doc
        });
    });

    console.log(\`   ✅ Lastet \${snapshot.size} varer\n\`);

    // 2. Finn duplikater
    console.log('2️⃣ Finner duplikater...');
    const duplicates = [];
    items.forEach((docs, name) => {
        if (docs.length > 1) {
            duplicates.push({ name, docs });
        }
    });

    console.log(\`   ⚠️  Fant \${duplicates.length} duplikate varenavn\n\`);

    if (duplicates.length === 0) {
        console.log('✅ Ingen duplikater å fjerne!');
        process.exit(0);
    }

    // 3. Vis duplikater
    console.log('3️⃣ Duplikate varer:');
    duplicates.forEach(dup => {
        console.log(\`   📦 "\${dup.name}" (\${dup.docs.length} kopier)\`);
    });

    // 4. Bekreft
    console.log(\`\n⚠️  Dette vil slette \${duplicates.reduce((sum, d) => sum + d.docs.length - 1, 0)} duplikater.\`);
    console.log('Trykk Ctrl+C for å avbryte, eller Enter for å fortsette...');

    await new Promise(resolve => {
        process.stdin.once('data', resolve);
    });

    // 5. Slett duplikater (behold første)
    console.log('\n4️⃣ Sletter duplikater...');

    const batch = db.batch();
    let batchCount = 0;
    let totalDeleted = 0;

    for (const dup of duplicates) {
        // Keep first, delete rest
        const docsToDelete = dup.docs.slice(1);

        for (const doc of docsToDelete) {
            const docRef = db.collection('globalItems').doc(doc.id);
            batch.delete(docRef);
            batchCount++;
            totalDeleted++;

            if (batchCount === 500) {
                await batch.commit();
                console.log(\`   \${totalDeleted} duplikater slettet...\`);
                batchCount = 0;
            }
        }
    }

    if (batchCount > 0) {
        await batch.commit();
    }

    console.log(\`\n✅ FERDIG!\`);
    console.log(\`🗑️  \${totalDeleted} duplikater fjernet\`);
    console.log(\`📊 \${snapshot.size - totalDeleted} unike varer gjenstår\`);
}

removeDuplicates()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('❌ Feil:', error);
        process.exit(1);
    });
