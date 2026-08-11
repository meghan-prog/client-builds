import { RouteId } from "./routes";

/**
 * Puntentoekenning per antwoord, per route. Key = "<questionId>.<optionId>".
 * Alles staat hier centraal — pas dit bestand aan om de matching-logica
 * te wijzigen, nergens anders.
 */
export const scoringMap: Record<string, Partial<Record<RouteId, number>>> = {
  // Q1 — Wat wil je vooral bereiken met AI?
  "q1.a": { arbitrage: 2, affiliate: 1, "digital-products": 1 },
  "q1.b": { "digital-products": 2, "personalised-products": 2, automation: 1 },
  "q1.c": { consulting: 2, arbitrage: 2, agency: 1 },
  "q1.d": { agency: 2, automation: 2, "personalised-products": 2 },

  // Q2 — Tijd per week
  "q2.a": { affiliate: 2, "digital-products": 1, arbitrage: 1 },
  "q2.b": { arbitrage: 1, "digital-products": 1, affiliate: 1 },
  "q2.c": { agency: 1, consulting: 1, automation: 1 },
  "q2.d": { agency: 2, automation: 2, consulting: 2, "personalised-products": 1 },

  // Q3 — Werken met klanten
  "q3.a": { agency: 3, consulting: 3, arbitrage: 2 },
  "q3.b": { agency: 1, consulting: 1, automation: 1 },
  "q3.c": { "digital-products": 2, "personalised-products": 1, affiliate: 1 },
  "q3.d": { "digital-products": 3, affiliate: 3, "personalised-products": 2 },

  // Q4 — Bestaande skill/expertise
  "q4.a": { consulting: 2, arbitrage: 2, agency: 1 },
  "q4.b": { consulting: 2, arbitrage: 2 },
  "q4.c": { "digital-products": 1, automation: 1 },
  "q4.d": { "digital-products": 1, affiliate: 1, "personalised-products": 1 },

  // Q5 — Belang recurring omzet
  "q5.a": { agency: 3, automation: 3, consulting: 1 },
  "q5.b": { agency: 1, automation: 1 },
  "q5.c": { "digital-products": 1, affiliate: 1 },
  "q5.d": { "digital-products": 2, affiliate: 2, arbitrage: 1 },

  // Q6 — Zichtbaarheid
  "q6.a": { consulting: 2, affiliate: 2, "digital-products": 1 },
  "q6.b": { agency: 1, consulting: 1, "digital-products": 1 },
  "q6.c": { automation: 2, agency: 1, arbitrage: 1 },
  "q6.d": { automation: 3, "personalised-products": 2, arbitrage: 1 },

  // Q7 — Wat lijkt je het leukst?
  "q7.a": { arbitrage: 3, agency: 1 },
  "q7.b": { "digital-products": 3 },
  "q7.c": { consulting: 3 },
  "q7.d": { automation: 3 },
  "q7.e": { affiliate: 3, "digital-products": 1 },
  "q7.f": { "personalised-products": 3, automation: 1 },
  "q7.g": {},

  // Q8 — Hoe technisch ben je?
  "q8.a": { automation: 3, "personalised-products": 2 },
  "q8.b": { agency: 1, arbitrage: 1, automation: 1 },
  "q8.c": { consulting: 1, "digital-products": 1 },
  "q8.d": { consulting: 2, affiliate: 1, arbitrage: 1 },

  // Q9 — Wat vind je belangrijker?
  "q9.a": { arbitrage: 3 },
  "q9.b": { agency: 2, automation: 2 },
  "q9.c": { "digital-products": 2, "personalised-products": 2 },
  "q9.d": { affiliate: 2, "digital-products": 1 },
  "q9.e": { agency: 1, automation: 1, "digital-products": 1 },

  // Q10 — Risicobereidheid
  "q10.a": { arbitrage: 2, affiliate: 2 },
  "q10.b": { "digital-products": 1, consulting: 1 },
  "q10.c": { agency: 2, automation: 2 },
  "q10.d": { agency: 2, "personalised-products": 2, automation: 1 },

  // Q11 — Klantvoorkeur
  "q11.a": { automation: 2, "digital-products": 1 },
  "q11.b": { consulting: 3, agency: 1 },
  "q11.c": { "digital-products": 2, affiliate: 2 },
  "q11.d": { agency: 1, arbitrage: 1 },

  // Q12 — Wat spreekt je het meest aan?
  "q12.a": { agency: 2, automation: 2, consulting: 1 },
  "q12.b": { consulting: 3, "digital-products": 1 },
  "q12.c": { "digital-products": 2, "personalised-products": 2 },
  "q12.d": { automation: 3, "personalised-products": 1 },
  "q12.e": { affiliate: 3, "digital-products": 1 },

  // Q13 — Hoe snel wil je starten?
  "q13.a": { arbitrage: 2, affiliate: 1 },
  "q13.b": { agency: 1, "digital-products": 1, consulting: 1 },
  "q13.c": { automation: 1, "personalised-products": 1 },
  "q13.d": {},

  // Q14 — Waar ben je sterkst in?
  "q14.a": { agency: 2, consulting: 1, arbitrage: 1 },
  "q14.b": { affiliate: 3, "digital-products": 2 },
  "q14.c": { consulting: 3 },
  "q14.d": { automation: 3, agency: 1 },
  "q14.e": { automation: 2, "personalised-products": 3 },
  "q14.f": {},

  // Q15 — Doel over 12 maanden
  "q15.a": { affiliate: 1, "digital-products": 1 },
  "q15.b": { arbitrage: 1, "digital-products": 1, agency: 1 },
  "q15.c": { agency: 2, consulting: 2, automation: 1 },
  "q15.d": { "personalised-products": 2, "digital-products": 1, automation: 1 },
};

/**
 * Korte, neutraal geformuleerde reden per antwoord — gebruikt op de
 * resultaatpagina om te verklaren "waarom dit bij je past". We tonen de
 * reasons van de antwoorden die het meest hebben bijgedragen aan de
 * winnende route.
 */
export const reasonsMap: Record<string, string> = {
  "q1.a": "Je zoekt een extra inkomstenstroom naast wat je al doet.",
  "q1.b": "Je wilt een volledig nieuwe online business bouwen.",
  "q1.c": "Je wilt meer verdienen met wat je al kunt.",
  "q1.d": "Je hebt een schaalbaar bedrijf voor ogen.",
  "q2.a": "Je hebt beperkte tijd per week beschikbaar, dus lichte overhead past bij je.",
  "q2.b": "Je hebt een paar uur per week te besteden.",
  "q2.c": "Je kunt er serieus tijd insteken.",
  "q2.d": "Je kunt hier fulltime aandacht aan geven.",
  "q3.a": "Je gaf aan dat je klanten juist leuk vindt.",
  "q3.b": "Je kunt prima met klantcontact omgaan.",
  "q3.c": "Je hebt liever geen intensief klantcontact.",
  "q3.d": "Je wilt het liefst helemaal geen directe klanten.",
  "q4.a": "Je hebt meerdere skills waar je al geld mee verdient.",
  "q4.b": "Je hebt één duidelijke skill om op te bouwen.",
  "q4.c": "Je hebt al een beetje relevante ervaring.",
  "q4.d": "Je begint vanaf nul, en dat past prima bij deze route.",
  "q5.a": "Terugkerende omzet is heel belangrijk voor je.",
  "q5.b": "Terugkerende omzet is best belangrijk voor je.",
  "q5.c": "Terugkerende omzet is voor jou minder een prioriteit.",
  "q5.d": "Je hebt liever losse verkopen dan abonnementen.",
  "q6.a": "Je vindt zichtbaar zijn juist leuk.",
  "q6.b": "Je kunt prima zichtbaar zijn als dat nodig is.",
  "q6.c": "Je werkt liever achter de schermen.",
  "q6.d": "Je wilt het liefst helemaal niet zichtbaar hoeven zijn.",
  "q7.a": "Een dienst verkopen spreekt je het meest aan.",
  "q7.b": "Een digitaal product verkopen spreekt je het meest aan.",
  "q7.c": "Bedrijven adviseren spreekt je het meest aan.",
  "q7.d": "Systemen bouwen spreekt je het meest aan.",
  "q7.e": "Content maken spreekt je het meest aan.",
  "q7.f": "Software verkopen spreekt je het meest aan.",
  "q7.g": "Je bent nog aan het ontdekken wat je het leukst vindt — deze route geeft een logisch startpunt.",
  "q8.a": "Je bent technisch en vindt dat leuk om te gebruiken.",
  "q8.b": "Je werkt prima met tools en software.",
  "q8.c": "Je bent gemiddeld technisch onderlegd.",
  "q8.d": "Je wilt techniek zoveel mogelijk vermijden.",
  "q9.a": "Snel je eerste inkomsten is voor jou het belangrijkst.",
  "q9.b": "Terugkerende inkomsten zijn voor jou het belangrijkst.",
  "q9.c": "Schaalbaarheid is voor jou het belangrijkst.",
  "q9.d": "Vrijheid is voor jou het belangrijkst.",
  "q9.e": "Je zoekt een combinatie van meerdere voordelen.",
  "q10.a": "Je wilt zo goedkoop mogelijk beginnen.",
  "q10.b": "Je kunt een beetje investeren om te starten.",
  "q10.c": "Je wilt investeren als het potentieel goed genoeg is.",
  "q10.d": "Je wilt serieus investeren in een business.",
  "q11.a": "Je hebt liever veel klanten met een kleiner bedrag per klant.",
  "q11.b": "Je hebt liever minder klanten tegen een hogere prijs.",
  "q11.c": "Je hebt liever veel losse kopers.",
  "q11.d": "Je staat open voor een combinatie van verdienmodellen.",
  "q12.a": "Het oplossen van een probleem voor bedrijven spreekt je aan.",
  "q12.b": "Je kennis verkopen spreekt je aan.",
  "q12.c": "Een product bouwen spreekt je aan.",
  "q12.d": "Een systeem bouwen dat voor je werkt spreekt je aan.",
  "q12.e": "Een audience opbouwen spreekt je aan.",
  "q13.a": "Je wilt deze week nog beginnen.",
  "q13.b": "Je wilt deze maand beginnen.",
  "q13.c": "Je wilt binnen drie maanden beginnen.",
  "q13.d": "Je oriënteert nog, en dat geeft ruimte om bewust te kiezen.",
  "q14.a": "Sales is waar je nu al sterk in bent.",
  "q14.b": "Creativiteit en content maken is waar je nu al sterk in bent.",
  "q14.c": "Expertise en advies geven is waar je nu al sterk in bent.",
  "q14.d": "Organiseren en systemen bouwen is waar je nu al sterk in bent.",
  "q14.e": "Technologie is waar je nu al sterk in bent.",
  "q14.f": "Je bent nog aan het ontdekken waar je sterk in bent.",
  "q15.a": "Je zoekt een paar honderd euro extra per maand.",
  "q15.b": "Je hebt €1.000–€3.000 extra per maand voor ogen.",
  "q15.c": "Je hebt €3.000–€10.000+ per maand voor ogen.",
  "q15.d": "Je hebt een volledig nieuw bedrijf voor ogen.",
};
