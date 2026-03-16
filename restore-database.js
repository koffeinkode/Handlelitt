// RESTORE SCRIPT - Kjør i Console på admin-siden
// Dette scriptet importerer alle varer fra lokal DATABASE til Firestore

async function restoreDatabase() {
  console.log('🔄 Starter restore av database...');

  // Sjekk først hvor mange som finnes nå
  const existingSnapshot = await db.collection('globalItems').get();
  console.log(`📊 Nåværende antall varer: ${existingSnapshot.size}`);

  const confirm = window.confirm(`Dette vil legge til varer fra lokal DATABASE.\n\nFortsette?`);
  if (!confirm) {
    console.log('❌ Avbrutt av bruker');
    return;
  }

  const DATABASE = {
    'Laktosefri/Glutenfri': [
      'laktosefri melk', 'laktosefri yoghurt', 'laktosefri smør', 'laktosefri rømme',
      'laktosefri ost', 'laktosefri fløte', 'laktosefri iskrem', 'laktosefri sjokolade',
      'glutenfri brød', 'glutenfri pasta', 'glutenfri mel', 'glutenfri kjeks',
      'glutenfri pizza', 'glutenfri müsli', 'glutenfri havregryn', 'glutenfri kaker',
      'vegansk melk', 'havrmelk', 'mandelmelk', 'sojamelk', 'kokosmelk',
      'vegansk ost', 'vegansk smør', 'vegansk yoghurt'
    ],
    'Frukt & Grønt': [
      'eple', 'banan', 'appelsin', 'pære', 'drue', 'kiwi', 'mango', 'ananas', 'melon', 'vannmelon',
      'sitron', 'lime', 'grapefrukt', 'klementiner', 'mandarin', 'persimmon', 'avokado', 'papaya',
      'gulrot', 'tomat', 'agurk', 'paprika', 'salat', 'isbergsalat', 'ruccola', 'spinat', 'grønnkål',
      'brokkoli', 'blomkål', 'løk', 'rødløk', 'hvitløk', 'ingefær', 'chili', 'squash', 'zucchini',
      'purre', 'selleri', 'kålrot', 'nepe', 'rødbete', 'hodekål', 'rosenkål', 'søtpotet', 'potet',
      'asparges', 'mais', 'erter', 'søtpotet', 'sopp', 'sjampinjong', 'østerssopp', 'kantarell'
    ],
    'Kjøtt & Fisk': [
      'kyllingfilet', 'kyllinglår', 'kyllingvinger', 'hel kylling', 'kalkunfilet', 'kalkun',
      'kjøttdeig', 'storfekjøtt', 'indrefilet', 'mørbrad', 'ytrefilet', 'entrecôte', 'storfefilet',
      'koteletter', 'svinekoteletter', 'lammekoteletter', 'pulled pork', 'flesk',
      'lammekjøtt', 'lammestek', 'reinsdyrskjøtt', 'elgkjøtt', 'pølser', 'grillpølser',
      'laks', 'ørret', 'torsk', 'sei', 'hyse', 'kveite', 'sild', 'reker',
      'krabbe', 'kongekrabbe', 'hummer', 'blåskjell', 'kamskjell', 'fiskeboller', 'fiskekaker', 'surimi'
    ],
    'Pålegg': [
      'servelat', 'salami', 'spekeskinke', 'kokt skinke', 'røkt kalkun', 'kalkunpålegg', 'roastbiff',
      'leverpostei', 'leverpostei med bacon', 'svineleverpostei', 'kalkunleverpostei', 'bacon',
      'makrell i tomat', 'sardiner i tomat', 'kaviar', 'rømmelaks', 'røkelaks', 'gravlaks',
      'ansjosfilet', 'tunfisksalat', 'rekesalat', 'eggesalat', 'kyllingsalat',
      'hummus', 'pesto', 'tapenade', 'pepperrot', 'sennep', 'agurksalat'
    ],
    'Meieri & Kjøl': [
      'melk', 'lettmelk', 'skummet melk', 'helmelk', 'ekstra lett melk', 'kulturmelk', 'kefir',
      'fløte', 'matfløte', 'kremfløte', 'piskefløte', 'crème fraiche', 'rømme', 'lett rømme', 'kesam',
      'yoghurt', 'gresk yoghurt', 'naturell yoghurt', 'fruktyhgurt',
      'ost', 'hvitost', 'gulost', 'norvegia', 'jarlsberg', 'cheddar', 'mozzarella', 'parmesan',
      'brie', 'camembert', 'feta', 'cottage cheese', 'kremost', 'smøreost', 'blåmuggost', 'geitost',
      'smør', 'margarin', 'bremykt', 'meierismør', 'lettmargarin',
      'egg', 'eggehvite', 'majones', 'aioli', 'remulade', 'chilimajones',
      'tofu'
    ],
    'Brød & Bakervarer': [
      'brød', 'loff', 'rundstykker', 'baguett', 'ciabatta', 'focaccia', 'grovbrød', 'kneippbrød',
      'byggbrød', 'havregrøt', 'havrebrød', 'pitabrød', 'tortilla', 'wraps',
      'tacoskjell', 'tacoskjell glutenfrie',
      'bagel', 'croissant', 'bolle', 'kanelboller', 'wienbrød', 'skolebrød', 'kaker', 'wienerbrød',
      'knekkebrød', 'kavring', 'kornkjeks', 'kjeks', 'riskjeks', 'havregrøtmel', 'müsli', 'frokostblanding',
      'cornflakes', 'havregryn', 'havregrynspudding', 'mandelskiver', 'mandelflak', 'sjokoladebiter', 'sjokoladedråper'
    ],
    'Tørrvarelager & Hermetikk': [
      'pasta', 'spaghetti', 'makaroni', 'penne', 'fusilli', 'lasagneplater', 'tortellini', 'ravioli',
      'nudler', 'risnudler', 'glassnudler', 'eggnudler', 'ramen',
      'ris', 'jasminris', 'basmatiris', 'risotto', 'parboiled ris', 'sushiris',
      'quinoa', 'bulgur', 'couscous',
      'linser', 'linser røde', 'linser grønne', 'linser brune',
      'mel', 'hvetemel', 'sammalt hvete', 'glutenfritt mel', 'mandelmel', 'siktet sammalt hvete',
      'sukker', 'melis', 'flormelis', 'brunt sukker', 'rørsukker', 'honning', 'sirup', 'agavesirup',
      'havsalt', 'bordsalt', 'pepper', 'paprika', 'karri', 'kanel', 'muskatnøtt', 'nellik',
      'bakepulver', 'natron', 'vaniljesukker', 'vaniljestang', 'gjær', 'tørrgjær', 'kakao',
      'hermetiske tomater', 'tomatpure', 'tomatketchup', 'hermetisk mais', 'hermetiske erter',
      'hermetiske kikerter', 'hermetiske bønner', 'hermetisk tunfisk', 'hermetisk makrell', 'hermetisk ananas',
      'kokosmelk', 'hermetisk kokosmelk',
      'pesto', 'tapenade', 'olivenolje', 'rapsolje', 'kokosolje', 'smørolje', 'solsikkeolje',
      'eddik', 'balsamicoeddik', 'rødvinseddik', 'eplesidereddik', 'soyasaus', 'fiskesaus', 'osterssaus',
      'buljong', 'kraft', 'hønsekraft', 'grønnsakskraft', 'biff', 'peanøttsmør', 'hazelnut spread', 'nutella',
      'syltetøy', 'jordbærsyltetøy', 'bringebærsyltetøy', 'aprikos syltetøy', 'appelsinmarmelade',
      'müslibarer', 'proteinbarer', 'nøtter', 'mandler', 'cashewnøtter', 'peanøtter', 'hasselnøtter',
      'rosiner', 'tørkede aprikoser', 'tørkede kranbær', 'tørket frukt'
    ],
    'Urter & Krydder': [
      'salt', 'pepper', 'basilikum', 'oregano', 'timian', 'rosmarin', 'persille', 'koriander',
      'dill', 'gressløk', 'mynta', 'salvie', 'estragon', 'laurbærblad', 'karri', 'karripasta',
      'kurkuma', 'spisskummen', 'koriafrø', 'chiliflak', 'chipotle', 'cayennepepper',
      'paprikapulver', 'søt paprika', 'røkt paprika', 'hvitløkspulver', 'løkpulver',
      'tacokrydder',
      'muskatnøtt', 'kardemomme', 'nellik', 'stjerneanis', 'kanel', 'vaniljesukker', 'ingefær',
      'sesamfrø', 'valmuefrø', 'solsikkefrø', 'gresskarkjerner', 'chiafrø', 'linfrø'
    ],
    'Husholdning & Rengjøring': [
      'oppvaskmiddel', 'oppvaskmaskinmiddel', 'oppvaskmaskin tabletter', 'oppvaskbørste', 'oppvaskklut',
      'tørk', 'rengjøring', 'allrens', 'såpe', 'såpepumpe', 'toalettpapir', 'dopapir', 'kjøkkenruller',
      'papirhåndkle', 'servietter', 'våtservietter', 'kluter', 'filler', 'svamp', 'skuresvamp',
      'skurepulver', 'klorin', 'klorkluter', 'desinfeksjon', 'gulvvask', 'vindusrens', 'glassrens',
      'badrens', 'kalkfjerner', 'universal rengjøringsmiddel', 'ovnsrens', 'komfyrrens',
      'tøyvask', 'vaskemiddel', 'flytende vaskemiddel', 'tøymykner', 'fargeark', 'vaskepulver',
      'såpeflak', 'flekktjerner', 'blekmiddel', 'uldvask',
      'tannkrem', 'tannbørste', 'tanntråd', 'munnvann',
      'søppelposer', 'matposer', 'fryseposer', 'brødposer', 'aluminiumsfolie', 'plastfolie', 'bakepapir'
    ]
  };

  let added = 0;
  let skipped = 0;

  console.log('📦 Importerer varer fra lokal DATABASE...');

  for (const [category, items] of Object.entries(DATABASE)) {
    console.log(`\n📂 ${category}:`);

    for (const itemNo of items) {
      try {
        // Sjekk om varen allerede finnes
        const existing = await db.collection('globalItems')
          .where('no', '==', itemNo)
          .where('category', '==', category)
          .get();

        if (existing.size > 0) {
          skipped++;
          continue;
        }

        // Legg til vare med RIKTIG struktur
        await db.collection('globalItems').add({
          no: itemNo,
          en: itemNo, // Bruk norsk som placeholder for engelsk
          category: category
        });

        added++;
        if (added % 10 === 0) {
          console.log(`  ✅ ${added} varer importert...`);
        }
      } catch (error) {
        console.error(`❌ Feil ved import av "${itemNo}":`, error);
      }
    }
  }

  console.log(`\n✅ FERDIG!`);
  console.log(`📊 ${added} nye varer lagt til`);
  console.log(`⏭️  ${skipped} eksisterte allerede`);
  console.log(`\n🔄 Refresh hovedsiden for å se endringene`);
}

restoreDatabase();
