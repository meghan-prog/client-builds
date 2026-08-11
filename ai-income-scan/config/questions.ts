export interface AnswerOption {
  id: string;
  label: string;
}

export interface Question {
  id: string;
  text: string;
  options: AnswerOption[];
}

export const questions: Question[] = [
  {
    id: "q1",
    text: "Wat wil je vooral bereiken met AI?",
    options: [
      { id: "a", label: "Een extra inkomstenstroom naast mijn huidige werk" },
      { id: "b", label: "Een compleet nieuwe online business bouwen" },
      { id: "c", label: "Meer verdienen met wat ik al kan" },
      { id: "d", label: "Een schaalbaar bedrijf bouwen" },
    ],
  },
  {
    id: "q2",
    text: "Hoeveel tijd kun je hier gemiddeld per week aan besteden?",
    options: [
      { id: "a", label: "Minder dan 5 uur" },
      { id: "b", label: "5–10 uur" },
      { id: "c", label: "10–20 uur" },
      { id: "d", label: "20+ uur" },
    ],
  },
  {
    id: "q3",
    text: "Hoe voel je je over werken met klanten?",
    options: [
      { id: "a", label: "Ik vind klanten juist leuk" },
      { id: "b", label: "Ik kan ermee leven" },
      { id: "c", label: "Liever niet" },
      { id: "d", label: "Ik wil helemaal geen klanten" },
    ],
  },
  {
    id: "q4",
    text: "Heb je al een skill of expertise waar je geld mee verdient?",
    options: [
      { id: "a", label: "Ja, meerdere" },
      { id: "b", label: "Ja, één duidelijke skill" },
      { id: "c", label: "Een beetje" },
      { id: "d", label: "Nee, ik begin vanaf nul" },
    ],
  },
  {
    id: "q5",
    text: "Hoe belangrijk is terugkerende omzet voor jou?",
    options: [
      { id: "a", label: "Heel belangrijk" },
      { id: "b", label: "Best belangrijk" },
      { id: "c", label: "Niet zo belangrijk" },
      { id: "d", label: "Ik wil liever losse verkopen" },
    ],
  },
  {
    id: "q6",
    text: "Hoeveel wil je zelf zichtbaar zijn?",
    options: [
      { id: "a", label: "Ik vind zichtbaar zijn leuk" },
      { id: "b", label: "Ik kan het prima" },
      { id: "c", label: "Liever achter de schermen" },
      { id: "d", label: "Ik wil helemaal niet zichtbaar zijn" },
    ],
  },
  {
    id: "q7",
    text: "Wat lijkt je het leukst?",
    options: [
      { id: "a", label: "Een dienst verkopen" },
      { id: "b", label: "Een digitaal product verkopen" },
      { id: "c", label: "Bedrijven adviseren" },
      { id: "d", label: "Systemen bouwen" },
      { id: "e", label: "Content maken" },
      { id: "f", label: "Software verkopen" },
      { id: "g", label: "Ik heb geen idee" },
    ],
  },
  {
    id: "q8",
    text: "Hoe technisch ben je?",
    options: [
      { id: "a", label: "Ik ben technisch en vind het leuk" },
      { id: "b", label: "Ik kan prima met tools werken" },
      { id: "c", label: "Ik ben gemiddeld" },
      { id: "d", label: "Ik wil techniek zoveel mogelijk vermijden" },
    ],
  },
  {
    id: "q9",
    text: "Wat vind je belangrijker?",
    options: [
      { id: "a", label: "Snel mijn eerste inkomsten" },
      { id: "b", label: "Terugkerende inkomsten" },
      { id: "c", label: "Schaalbaarheid" },
      { id: "d", label: "Vrijheid" },
      { id: "e", label: "Een combinatie" },
    ],
  },
  {
    id: "q10",
    text: "Hoeveel risico wil je nemen?",
    options: [
      { id: "a", label: "Ik wil zo goedkoop mogelijk beginnen" },
      { id: "b", label: "Ik kan wat investeren" },
      { id: "c", label: "Ik wil investeren als het potentieel goed is" },
      { id: "d", label: "Ik wil serieus investeren in een business" },
    ],
  },
  {
    id: "q11",
    text: "Wat heb je liever?",
    options: [
      { id: "a", label: "Veel klanten met een kleiner abonnement" },
      { id: "b", label: "Minder klanten met een hogere prijs" },
      { id: "c", label: "Veel losse kopers" },
      { id: "d", label: "Een combinatie" },
    ],
  },
  {
    id: "q12",
    text: "Wat spreekt je het meest aan?",
    options: [
      { id: "a", label: "Een probleem oplossen voor bedrijven" },
      { id: "b", label: "Mijn kennis verkopen" },
      { id: "c", label: "Een product bouwen" },
      { id: "d", label: "Een systeem bouwen dat voor mij werkt" },
      { id: "e", label: "Een audience opbouwen" },
    ],
  },
  {
    id: "q13",
    text: "Hoe snel wil je starten?",
    options: [
      { id: "a", label: "Deze week" },
      { id: "b", label: "Deze maand" },
      { id: "c", label: "Binnen 3 maanden" },
      { id: "d", label: "Ik ben nog aan het oriënteren" },
    ],
  },
  {
    id: "q14",
    text: "Waar ben je momenteel het sterkst in?",
    options: [
      { id: "a", label: "Sales" },
      { id: "b", label: "Creativiteit/content" },
      { id: "c", label: "Expertise/advies" },
      { id: "d", label: "Organiseren/systemen" },
      { id: "e", label: "Technologie" },
      { id: "f", label: "Ik moet dit nog ontdekken" },
    ],
  },
  {
    id: "q15",
    text: "Wat zou je het liefst hebben over 12 maanden?",
    options: [
      { id: "a", label: "Een paar honderd euro extra per maand" },
      { id: "b", label: "€1.000–€3.000 extra per maand" },
      { id: "c", label: "€3.000–€10.000+ per maand" },
      { id: "d", label: "Een volledig nieuw bedrijf" },
    ],
  },
];
