// Activity idea generation — abstraction layer, same pattern as the other
// services in this folder: a deterministic mock today, swappable later for a
// real LLM call (e.g. Claude generating age-appropriate activity ideas from
// the topic + child's age) without any caller needing to change, since
// everyone only depends on the `ActivitySuggesterService` interface below.

export interface SuggestedActivity {
  title: string;
  icon: string;
  durationMinutes: number;
  prepMinutes: number;
  instructions: string[];
  materials: string[]; // material names — matched/created against the Material catalog
  difficulty: "makkelijk" | "gemiddeld" | "uitdagend";
}

export interface ActivitySuggestInput {
  topic: string;
  ageRangeMin: number;
  ageRangeMax: number;
  count: number;
}

export interface ActivitySuggesterService {
  suggest(input: ActivitySuggestInput): Promise<SuggestedActivity[]>;
}

// Curated, higher-quality content for common everyday-skill topics, matched
// by substring rather than an exact key so phrasing like "tanden leren
// poetsen" still finds the "tandenpoetsen" set. Anything not matched here
// still gets a plausible set of ideas from the generic template generator
// below, so the agent never dead-ends on an unfamiliar topic — it just gets
// less specific.
const CURATED: Record<string, SuggestedActivity[]> = {
  tandenpoetsen: [
    {
      title: "Tandenpoets-lied",
      icon: "🎵",
      durationMinutes: 5,
      prepMinutes: 0,
      instructions: [
        "Kies samen een liedje van ongeveer 2 minuten.",
        "Zet het aan zodra het poetsen begint.",
        "Poets mee op de maat van de muziek.",
        "Eindig met een grote tandpasta-grijns in de spiegel.",
      ],
      materials: ["spiegel"],
      difficulty: "makkelijk",
    },
    {
      title: "Tandenteller",
      icon: "🦷",
      durationMinutes: 5,
      prepMinutes: 0,
      instructions: [
        "Tel samen hardop tot 10 bij elke rij tanden.",
        "Eerst boven, dan onder, dan links en rechts.",
        "Wissel steeds wie er telt.",
        "Plak een sticker op de poetskalender na afloop.",
      ],
      materials: ["stickervel"],
      difficulty: "makkelijk",
    },
    {
      title: "Zandloper-race",
      icon: "⏳",
      durationMinutes: 5,
      prepMinutes: 0,
      instructions: [
        "Zet de tandenpoets-zandloper (2 minuten) neer.",
        "Race tegen het zand: poets zo lang als het loopt.",
        "Kijk samen of alle zandkorrels beneden zijn als je klaar bent.",
        "Vier het als je het net op tijd haalt.",
      ],
      materials: ["zandloper"],
      difficulty: "makkelijk",
    },
    {
      title: "Plaquejacht",
      icon: "🔍",
      durationMinutes: 8,
      prepMinutes: 2,
      instructions: [
        "Kauw samen op een plaque-tablet na het eten.",
        "Zoek in de spiegel naar de roze/paarse plekjes.",
        "Poets precies die plekjes extra goed schoon.",
        "Controleer samen of alles weer wit is.",
      ],
      materials: ["plaque-tabletten", "spiegel"],
      difficulty: "gemiddeld",
    },
  ],
};

function normalizeTopic(topic: string): string {
  return topic
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

const GENERIC_TEMPLATES: Omit<SuggestedActivity, "materials">[] = [
  {
    title: "{topic}-zoektocht",
    icon: "🔎",
    durationMinutes: 15,
    prepMinutes: 5,
    instructions: [
      "Verstop een paar aanwijzingen die samen met {topic} te maken hebben.",
      "Laat het kind ze een voor een zoeken.",
      "Bespreek bij elke vondst kort waar het om gaat.",
      "Sluit af met een klein applaus of high five.",
    ],
    difficulty: "makkelijk",
  },
  {
    title: "{topic}-spel",
    icon: "🎲",
    durationMinutes: 15,
    prepMinutes: 0,
    instructions: [
      "Verzin samen 3 korte opdrachten rond {topic}.",
      "Doe ze om de beurt, spelenderwijs.",
      "Vier elk gelukt onderdeel.",
      "Herhaal het spel de volgende keer met een variatie.",
    ],
    difficulty: "makkelijk",
  },
  {
    title: "Samen oefenen: {topic}",
    icon: "🌟",
    durationMinutes: 10,
    prepMinutes: 0,
    instructions: [
      "Doe {topic} voor terwijl je hardop vertelt wat je doet.",
      "Laat het kind het daarna zelf proberen.",
      "Help alleen waar nodig, laat de rest zelf gaan.",
      "Benoem specifiek wat er goed ging.",
    ],
    difficulty: "makkelijk",
  },
];

export class MockActivitySuggesterService implements ActivitySuggesterService {
  async suggest(input: ActivitySuggestInput): Promise<SuggestedActivity[]> {
    await new Promise((resolve) => setTimeout(resolve, 400));

    const key = normalizeTopic(input.topic);
    const curated = key.includes("tand") && key.includes("poets") ? CURATED.tandenpoetsen : undefined;
    if (curated) return curated.slice(0, input.count);

    return GENERIC_TEMPLATES.slice(0, input.count).map((t) => ({
      ...t,
      title: t.title.replace(/\{topic\}/g, input.topic),
      instructions: t.instructions.map((s) => s.replace(/\{topic\}/g, input.topic)),
      materials: [],
    }));
  }
}

export function getActivitySuggesterService(): ActivitySuggesterService {
  return new MockActivitySuggesterService();
}
