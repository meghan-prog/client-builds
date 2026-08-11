export const siteConfig = {
  metaTitle: "AI Income Scan — Welke AI-income route past bij jou?",
  metaDescription:
    "Ontdek in een paar minuten welke manier om met AI online inkomen op te bouwen het beste bij jou past.",

  brandName: "AI INCOME SCAN",

  landing: {
    heroTitle: "Welke AI-income route past bij jou?",
    heroSubheadline:
      "AI kan veel meer zijn dan een tool om sneller te werken. Ontdek in een paar minuten welke manier om met AI online inkomen op te bouwen het beste bij jou past.",
    ctaLabel: "Doe de gratis AI Income Scan",
    ctaMeta: "± 3 minuten · Gratis · Direct je persoonlijke resultaat",
    problemHeadline: "Je weet dat je iets met AI moet doen.\nMaar wat?",
    problemCopy:
      "AI verandert hoe we werken, ondernemen en geld verdienen. Maar “iets met AI doen” is geen businessmodel. De vraag is: wat past bij jou?",
    problemExamples: [
      "Wil je diensten verkopen?",
      "Wil je digitale producten bouwen?",
      "Wil je een recurring-revenue business?",
    ],
    problemClosing: "De scan helpt je kiezen.",
  },

  academy: {
    name: "AI INCOME ACADEMY",
    price: "€497",
    // Configureerbare placeholder — later te vervangen door de echte checkout/salespagina.
    url:
      process.env.NEXT_PUBLIC_ACADEMY_URL ||
      "https://example.com/ai-income-academy",
    ctaHeadline: "Wil je deze route daadwerkelijk bouwen?",
    ctaCopy:
      "Je weet nu welke AI-income route het beste bij jou past. In AI Income Academy leer je hoe je van deze route een echte online inkomstenstroom maakt — van businessmodel en aanbod tot lancering en eerste verkopen.",
    includes: [
      "AI Income Scan",
      "7 AI-income modellen",
      "Persoonlijke route",
      "Concrete roadmap",
      "Business-building frameworks",
      "Templates",
      "AI prompts",
      "Praktische implementatie",
    ],
    ctaButtonLabel: "Start AI Income Academy",
  },

  // Zet op false om de scan direct het resultaat te laten tonen zonder
  // naam/e-mail te vragen.
  leadCapture: {
    enabled: process.env.NEXT_PUBLIC_LEAD_CAPTURE_ENABLED !== "false",
    headline: "Waar mogen we jouw persoonlijke AI-income resultaat naartoe sturen?",
    ctaLabel: "Bekijk mijn resultaat",
  },

  disclaimer:
    "De genoemde bedragen zijn voorbeelden ter illustratie en geen garantie op inkomen of resultaat.",
};

export type SiteConfig = typeof siteConfig;
