# Gesprekscoach

Werkend prototype van een live AI-gesprekscoach, geïnspireerd op [ConversationPilot.ai](https://www.conversationpilot.ai/) maar getraind/gepromot voor Nederlandstalige verkoop- en sollicitatiegesprekken. Gepositioneerd als product van Winst.ai (zelfde design system als `winst/index.html`).

## Hoe het werkt

- **Live transcriptie** — gebeurt volledig client-side via de browser Web Speech API (`nl-NL`). Werkt in Chrome/Edge; er wordt geen audio verzonden of opgeslagen, alleen de tekst.
- **Live coaching-tips** (`functions/api/coach.js`) — stuurt elke ~8 seconden een rollend venster van het transcript naar Claude (via de Anthropic Messages API, met tool-calling voor gestructureerde output) en toont: de beste volgende vraag, een bezwaar-tip, het koopsignaal en een live scorecard (luisteren/structuur/tempo).
- **Eindverslag** (`functions/api/summary.js`) — genereert bij het stoppen van het gesprek een samenvatting, volgende stappen, CRM-klare notities en een concept follow-up e-mail.

Beide functions zijn Cloudflare Pages Functions en draaien server-side, zodat de Anthropic API-key nooit in de browser terechtkomt.

## Setup na deploy

De GitHub Actions workflow (`.github/workflows/deploy-gesprekscoach.yml`) deployt de site, maar zet **geen** API-key — die hoort niet in git. Zet 'm eenmalig als secret op het Cloudflare Pages project:

```bash
npx wrangler pages secret put ANTHROPIC_API_KEY --project-name=gesprekscoach
```

Optioneel: `ANTHROPIC_MODEL` als env var zetten om een ander/nieuwer model te gebruiken dan de default (`claude-sonnet-4-5-20250929`).

Zonder deze secret werkt de live demo (transcript + start/stop) gewoon, maar geven `/api/coach` en `/api/summary` een `500`-foutmelding — dat is zichtbaar in de UI ("controleer de serverconfiguratie").

## Lokaal testen

```bash
cd gesprekscoach
npx wrangler pages dev . --binding ANTHROPIC_API_KEY=sk-ant-...
```

## Nog niet gebouwd (scope voor een volgende iteratie)

- Video-engagement-signalen (High/Moderate/Low/Attention Shift/Camera Off) zoals het origineel op videobellen toont — vereist camera-toegang + beeldanalyse.
- Native integratie in Zoom/Meet/Teams (het origineel werkt als overlay tijdens een callmeeting); dit prototype is een losstaande demo-pagina waarin je zelf spreekt of het gesprek naspeelt.
- Opslag van gesprekken/verslagen (nu is alles sessie-gebonden, niets wordt bewaard).
