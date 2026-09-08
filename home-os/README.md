# Home OS

Een digitaal operating system voor het gezin. Home OS combineert een vaste
gezinsroutine (**Base**) met variabele gebeurtenissen (school, werk,
afspraken) en wekelijkse intenties (**Sunday Intentions**), en laat een
**Planning Engine** daar automatisch een haalbare weekplanning van maken —
inclusief conflictdetectie, materiaal-/boodschappenlogica en leerdoelen die
per week worden uitgewerkt tot concrete middagactiviteiten. Een chat-
**Assistent** (`/assistant`) zit er bovenop: praat er dingen naartoe zoals
"school is morgen afgelast" of "focus deze week op tandenpoetsen", en hij
zet dat om in een concreet voorstel dat je met één klik toepast.

## Snel starten

```bash
npm install
npx prisma migrate dev   # maakt prisma/dev.db aan en past het schema toe
npx prisma db seed       # laadt het voorbeeldgezin (Familie Eckenbach)
npm run dev
```

Open <http://localhost:3000>. De app opent direct op de weekplanning van de
lopende week.

Herstart de app? Draai `npx prisma db seed` opnieuw om alles terug te zetten
naar de schone demostate.

## Architectuur

```
src/
  lib/
    planning-engine/   Pure domain logic — GEEN afhankelijkheid van Prisma of UI.
                        generateWeekPlan(input) => { blocks, conflicts, deviations, unscheduled }
    ai/                Abstractielaag voor AI-taken, met mock-implementaties:
                        - document-parser.ts     (schoolkalender-extractie)
                        - intention-parser.ts    (zondagse vrije tekst -> gestructureerde items)
                        - agent.ts               (chat-assistent: NLU -> AgentReply)
                        - activity-suggester.ts  (activiteitideeën voor een onderwerp)
                        Allemaal achter een interface + factory-functie verstopt
                        (getDocumentParsingService / getIntentionParsingService /
                        getHomeAgentService / getActivitySuggesterService), zodat een
                        echte LLM-integratie later zonder UI-wijzigingen kan worden
                        aangesloten.
    themes/            Statische catalogus van culturele/seizoensgebonden thema's
                        (NL- en Spaanse feestdagen, seizoenen, Spaanse oogsttijden).
                        getThemesForRange/getUpcomingThemes berekenen wat er deze
                        week of binnenkort speelt; LearningActivity.themeKey koppelt
                        een leeractiviteit aan een thema (zie "Herfstcollage maken").
    data/              Data layer: vertaalt Prisma-rijen naar planning-engine input,
                        roept de engine aan, persisteert het resultaat (WeekPlan,
                        ScheduleBlock, Conflict, Deviation) en biedt read-modellen
                        voor de UI. Dit is de enige plek die de engine aanroept.
    ui/                Kleine presentatie-helpers (categoriekleuren, datumformattering).
  components/          Gedeelde React-componenten (navigatie, upload-widget).
  app/
    (parent)/          Oudermodus, met navigatie-sidebar: week, school, kinderen,
                        leren, taken, boodschappen, instellingen, activiteit-detail.
    kids/               Kindmodus — een bewust apart, vereenvoudigd layout zonder
                        oudernavigatie, met grote tap-targets.
    actions.ts          Alle server actions (mutaties) op één plek.
prisma/
  schema.prisma         Volledig datamodel (zie hieronder).
  seed.ts                Voorbeeldgezin: 1 ouder, 2 kinderen, schooljaar 2026-2027,
                          leerdoel "leren lezen en schrijven" met jaar/maand/week-
                          uitwerking, huishoudelijke taken, materialen/voorraad.
scripts/
  test-plan.ts           Genereert en print de weekplanning van de huidige week
                          (handig om de planning engine te debuggen zonder UI).
  test-intentions.ts      Test de zondagse-intentieflow end-to-end.
  e2e-check.ts            Playwright-smoketest die de belangrijkste flows doorklikt.
  screenshot.ts           Maakt een screenshot van een route (voor visuele QA).
```

### Belangrijk architectuurprincipe

De **planning engine** (`src/lib/planning-engine`) kent geen Prisma-types en
geen React — hij werkt uitsluitend met plain TypeScript in- en outputtypes.
De **data layer** (`src/lib/data`) is de enige laag die de engine aanroept en
resultaten wegschrijft. UI-componenten praten nooit rechtstreeks met de
engine of met Prisma. Dat maakt de engine zelfstandig testbaar (zie
`scripts/test-plan.ts`) en makkelijk te vervangen/uit te breiden zonder de
UI aan te raken.

## Datamodel (Prisma / SQLite)

Family, Parent, Child, RoutineTemplate, Routine (+ RoutineChild,
RoutineCompletion), Calendar, CalendarEvent, SchoolYear, SchoolEvent,
SchoolCalendarUpload, WorkProfile, WorkBlock, LearningGoal, LearningSkill
(hiërarchisch: year → month → week), LearningActivity (+
LearningActivityMaterial), ScheduledActivity, HouseholdTask (+
HouseholdTaskCompletion), Material, InventoryItem, ShoppingItem,
WeeklyIntention, WeekPlan, ScheduleBlock, Conflict, Deviation.

SQLite is gekozen voor snelle lokale ontwikkeling zonder externe
afhankelijkheden. Het schema gebruikt bewust geen SQLite-specifieke
features, dus overstappen naar Postgres is een kwestie van `provider`/`url`
aanpassen in `prisma/schema.prisma`, niet een herontwerp.

## Wat is (nog) gemockt?

- **AI-documentextractie** (`src/lib/ai/document-parser.ts`): de
  upload-flow werkt volledig (bestand kiezen, versturen, structured events
  terugkrijgen, opslaan als `SchoolEvent`), maar de extractie zelf is een
  deterministische mock. Een echte implementatie hoeft alleen de
  `DocumentParsingService`-interface te implementeren.
- **Sunday-intentions parsing** (`src/lib/ai/intention-parser.ts`): een
  kleine Nederlandstalige keyword/weekdag-parser, achter dezelfde soort
  abstractie. Herkent een vaste set trefwoorden (tandarts, boodschappen,
  strand, zwemles, werk(en), verjaardag, oudergesprek, bezoek, sport) en
  weekdagnamen; geen tijdsherkenning uit vrije tekst.
- **Assistent** (`src/lib/ai/agent.ts` + `src/lib/ai/activity-suggester.ts`):
  een regel-gebaseerde NLU die schoolafmeldingen, "focus deze week op X" en
  activiteiten-verzoeken herkent (incl. een "voor wie?"-vervolgvraag als er
  meerdere kinderen zijn), en een activiteitenbibliotheek die voor
  "tandenpoetsen" met curated content komt en voor elk ander onderwerp met
  plausibele generieke ideeën. Achter dezelfde soort interface + factory-
  functie (`getHomeAgentService`) — een echte implementatie zou hier de
  Claude Messages API met tool use aanroepen (elke `AgentActionType` wordt
  een tool-definitie) en dezelfde `AgentReply`-vorm teruggeven; de chat-UI
  en de actie-uitvoering (`src/lib/data/agent.ts`) hoeven dan niet te
  veranderen.
- **Authenticatie**: er is één gezin (`getPrimaryFamilyId`), geen
  login/sessiebeheer. Dat is bewust de enige plek die je hoeft aan te
  passen om echte multi-tenant auth (bv. NextAuth) aan te sluiten.
- **Werkprofielen**: aanmaken en actief zetten kan; het bewerken van
  losse werkblokken per profiel heeft nog geen UI (wel volledig in het
  datamodel aanwezig).

## Wat werkt volledig (getest)

Zie `scripts/test-plan.ts`, `scripts/test-intentions.ts` en
`scripts/e2e-check.ts` voor geautomatiseerde verificatie van:

- Weekplanning genereren uit Base + school + werk + huishouden + leerdoelen.
- Studiedag onderdrukt de schoolroutine; vrije ruimte (`Middag`) blijft
  altijd beschermd (protectie-ratio, standaard 35%).
- Conflictdetectie (bv. werk vs. oudergesprek) mét een concreet
  split-voorstel, dat je kunt accepteren (blokken worden daadwerkelijk
  gesplitst) of naast je neerleggen.
- Leeractiviteit afvinken → voortgang van het weekdoel én het jaardoel
  wordt herberekend.
- Ontbrekend materiaal voor een leeractiviteit komt automatisch op de
  boodschappenlijst, getimed op de eerstvolgende "boodschappen"-taak vóór
  de activiteit.
- Zondagse input (vrije tekst) → gestructureerde items → verwerkt in een
  nieuwe weekplanning, zichtbaar in "Deze week anders".
- Kindmodus toont alleen wat voor een kind relevant is (dagritme + eigen
  taak + eigen leeractiviteit — nooit werk/afspraken van een ouder), met
  één-tap afvinken.
- **"School afgelast" melden** (knop op de weekweergave): maakt direct een
  suppressing `SchoolEvent` aan voor die dag en herplant meteen — de
  schoolroutine verdwijnt, de leeractiviteit die voor die dag/kind gepland
  stond blijft gewoon staan (of schuift naar de vrijgekomen tijd), zonder
  dat je zelf iets hoeft te verplaatsen. Zie `scripts/e2e-cancel-school.ts`.
- **Thema's** (`lib/themes/catalog.ts`): Nederlandse en Spaanse feestdagen/
  tradities, de meteorologische seizoenen en Spaanse oogsttijden (vendimia,
  aceituna, sinaasappels) worden per week zichtbaar in het "Dit seizoen"-
  blok op de weekweergave, inclusief een "over N dagen"-melding voor wat
  eraan komt. Leeractiviteiten kunnen aan een thema gekoppeld worden
  (`LearningActivity.themeKey`) — het voorbeeldgezin heeft zo een
  herfst-geknutseld ("Herfstcollage maken") voor Milo, die ook meteen de
  material→boodschappenlijst-logica laat zien (lijm ontbreekt).
- **Assistent-gesprek** (`/assistant`, zie `scripts/test-agent.ts` en
  `scripts/e2e-assistant.ts`): "school is morgen afgelast" → voorstel →
  toepassen → schoolroutine weg, leeractiviteiten blijven staan. "Focus
  deze week op tandenpoetsen" → vraagt voor wie (bij >1 kind) → voorstel
  met 4 activiteiten → toepassen → leerdoel + activiteiten aangemaakt en
  ingepland, zichtbaar in de weekplanning en op `/learning`.

## Deployment

Standaard Next.js App Router app. Voor productie: zet `DATABASE_URL` op een
Postgres-connectiestring (bv. via Vercel Postgres of Neon), draai
`prisma migrate deploy`, en deploy zoals elke Next.js-app (Vercel is de
snelste weg).
