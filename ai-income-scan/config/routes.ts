export type RouteId =
  | "agency"
  | "arbitrage"
  | "digital-products"
  | "consulting"
  | "automation"
  | "personalised-products"
  | "affiliate";

export interface RouteExample {
  title: string;
  description: string;
}

export interface Route {
  id: RouteId;
  name: string;
  shortDescription: string;
  description: string;
  example: RouteExample;
  firstStep: string;
}

export const routes: Record<RouteId, Route> = {
  agency: {
    id: "agency",
    name: "AI Agency",
    shortDescription:
      "Verkoop AI-oplossingen aan bedrijven en verdien via maandelijkse abonnementen.",
    description:
      "Met een AI Agency verkoop je AI-powered oplossingen aan bedrijven. Je gebruikt bestaande technologie en systemen om een concreet probleem op te lossen en verkoopt dit als een dienst, vaak op maandbasis.",
    example: {
      title: "AI Lead Follow-Up",
      description:
        "Een bedrijf betaalt bijvoorbeeld een vast maandbedrag voor een systeem dat nieuwe leads automatisch opvolgt en richting een afspraak begeleidt.",
    },
    firstStep:
      "Kies één type bedrijf met een probleem dat regelmatig terugkomt en waarvoor een maandelijkse oplossing logisch is.",
  },
  arbitrage: {
    id: "arbitrage",
    name: "AI Arbitrage",
    shortDescription:
      "Verkoop AI-powered diensten en gebruik AI/software om de uitvoering schaalbaar te maken.",
    description:
      "Bij AI Arbitrage verkoop je een dienst die je zelf (deels) met AI uitvoert. Je vraagt een normale dienstprijs, maar gebruikt AI-tools om sneller en met minder uren te leveren dan traditioneel — waardoor je marge groeit zonder dat de klant iets anders krijgt dan een goed resultaat.",
    example: {
      title: "AI Content Uitvoeringsdienst",
      description:
        "Je verkoopt bijvoorbeeld maandelijkse content-productie aan een klant, en gebruikt AI-tools om het merendeel van het werk in een fractie van de tijd te produceren.",
    },
    firstStep:
      "Kies één dienst die je nu al zou kunnen leveren, en zoek uit welk deel van het werk AI voor jou kan versnellen.",
  },
  "digital-products": {
    id: "digital-products",
    name: "AI Digital Products",
    shortDescription:
      "Gebruik AI om digitale producten te creëren, verbeteren en verkopen.",
    description:
      "Met AI Digital Products gebruik je AI om digitale producten sneller en beter te maken — denk aan templates, guides, tools of media — en verkoop je deze los, zonder dat je per klant tijd hoeft te leveren.",
    example: {
      title: "Kant-en-klare Template Bundel",
      description:
        "Je bouwt bijvoorbeeld een bundel templates met behulp van AI, en verkoopt deze eenmalig aan iedereen die het probleem herkent dat de bundel oplost.",
    },
    firstStep:
      "Bepaal welk terugkerend probleem je met één goed digitaal product kunt oplossen, en schets de eerste versie.",
  },
  consulting: {
    id: "consulting",
    name: "AI Consulting",
    shortDescription:
      "Gebruik je expertise gecombineerd met AI om bedrijven of professionals te helpen.",
    description:
      "Bij AI Consulting combineer je je bestaande kennis en ervaring met AI om bedrijven of professionals verder te helpen. Je verkoopt geen uitvoering, maar inzicht, strategie en advies — met AI als versneller van jouw expertise.",
    example: {
      title: "AI-Strategie Traject",
      description:
        "Je begeleidt bijvoorbeeld een bedrijf bij het in kaart brengen waar AI in hun processen waarde kan toevoegen, en adviseert over de te nemen stappen.",
    },
    firstStep:
      "Kies één type klant waar je door ervaring al veel van weet, en bepaal welk vraagstuk zij het vaakst hebben.",
  },
  automation: {
    id: "automation",
    name: "AI Automation",
    shortDescription:
      "Bouw AI-workflows en automatiseringen die bedrijven tijd en werk besparen.",
    description:
      "Met AI Automation bouw je workflows en systemen die terugkerende taken bij bedrijven automatiseren met behulp van AI. Je levert geen handmatige dienst, maar een werkend systeem dat op de achtergrond blijft draaien.",
    example: {
      title: "Automatische Klantopvolging",
      description:
        "Je bouwt bijvoorbeeld een workflow die inkomende aanvragen automatisch categoriseert, beantwoordt of doorstuurt naar de juiste persoon.",
    },
    firstStep:
      "Zoek één terugkerende, tijdrovende taak bij een bedrijf en schets hoe een eenvoudige automatisering die zou kunnen overnemen.",
  },
  "personalised-products": {
    id: "personalised-products",
    name: "AI Personalised Products",
    shortDescription:
      "Bouw AI-producten die zich aanpassen aan de input en situatie van iedere klant.",
    description:
      "Met AI Personalised Products bouw je een product of tool die met behulp van AI meebeweegt met de input van iedere gebruiker — waardoor het resultaat voor iedere klant net anders en persoonlijk aanvoelt, zonder dat jij het handmatig hoeft aan te passen.",
    example: {
      title: "Gepersonaliseerde Adviestool",
      description:
        "Denk bijvoorbeeld aan een tool die op basis van de antwoorden van een gebruiker automatisch een op maat gemaakt advies of plan genereert.",
    },
    firstStep:
      "Bepaal welke input van een klant automatisch tot een ander, persoonlijk resultaat zou moeten leiden, en schets de eerste simpele versie.",
  },
  affiliate: {
    id: "affiliate",
    name: "AI Affiliate Business",
    shortDescription:
      "Gebruik AI om content, recommendations of nicheplatforms te bouwen en verdien via affiliate inkomsten.",
    description:
      "Bij een AI Affiliate Business gebruik je AI om sneller en consistenter content, recommendations of een nicheplatform te bouwen, en verdien je aan de doorverwijzingen naar producten of diensten van anderen — zonder zelf klanten te bedienen.",
    example: {
      title: "Niche Content Platform",
      description:
        "Je bouwt bijvoorbeeld met AI-ondersteuning een reeks content rond één duidelijke niche, en verdient aan de aanbevolen producten of tools die daarbij aansluiten.",
    },
    firstStep:
      "Kies één niche waar je oprecht interesse in hebt, en bepaal welk soort content of aanbevelingen daar het meeste waarde toevoegen.",
  },
};

export const routeList: Route[] = Object.values(routes);
