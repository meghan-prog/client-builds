# AI Income Scan — MVP

Zelfstandige, production-ready assessment die bezoekers helpt ontdekken welke
AI-income route het beste bij hen past, en ze doorstuurt naar **AI Income
Academy (€497)** als enige commerciële CTA.

Geen account, geen login, geen checkout, geen dashboard — alleen de scan en
het resultaat.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Supabase/Postgres (optioneel — de scan werkt ook zonder database, er wordt
  dan alleen niets opgeslagen)
- Vercel-ready

## Content-architectuur

Alles wat je waarschijnlijk wilt aanpassen staat in `/config`, niet verspreid
over componenten:

- `config/routes.ts` — de 7 AI-income routes (naam, uitleg, voorbeeld, eerste stap)
- `config/questions.ts` — de 15 vragen + antwoorden
- `config/scoring.ts` — puntentoekenning per antwoord per route + de "waarom
  dit bij je past"-teksten
- `config/site.ts` — Academy-naam/prijs/URL, landingspagina-copy, lead-capture
  aan/uit

## Lokaal draaien

```bash
npm install
cp .env.example .env.local   # vul in wat je hebt, of laat leeg voor lokale dev
npm run dev
```

Zonder Supabase-variabelen werkt de volledige scan-flow gewoon (scoring is
100% client-side), er wordt alleen niets opgeslagen en toont `/admin` geen
data.

## Supabase opzetten

1. Maak een Supabase-project aan.
2. Voer `supabase/schema.sql` uit in de SQL editor (tabellen: `scans`,
   `leads`, `events`).
3. Zet in je environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only, nooit in de browser gebruikt)

Alle database-writes gebeuren server-side via de service role key vanuit de
API routes — RLS staat aan en blokkeert directe toegang vanuit de browser.

## Admin

`/admin` toont scans gestart/afgerond, resultaten per route, leads, Academy
CTA-clicks en conversies. Beveiligd met HTTP Basic Auth via:

- `ADMIN_USER`
- `ADMIN_PASSWORD`

Zonder deze twee variabelen blijft `/admin` op slot (503) in plaats van open
te staan.

## Academy CTA

De enige commerciële bestemming. URL en prijs zijn centraal configureerbaar
in `config/site.ts` via:

- `NEXT_PUBLIC_ACADEMY_URL` — placeholder-URL, later te vervangen door de
  echte salespagina/checkout
- prijs (`€497`) en "inclusief"-lijst staan hardcoded in `site.ts` — pas daar
  aan zodra dat verandert

## Analytics

`lib/analytics.ts` stuurt events naar onze eigen `/api/event` (voor
`/admin`) en, indien aanwezig, door naar `window.gtag` / `window.fbq` zodat
je later GA4 of Meta Pixel kunt koppelen zonder code te wijzigen. Getrackte
events: `landing_view`, `scan_started`, `question_answered`,
`scan_completed`, `result_viewed`, `lead_submitted`, `academy_cta_clicked`,
`result_shared`.

## Deployen (Cloudflare)

Dit is geen statische site zoals de andere projecten in deze repo (Corporetta,
winst.ai) — die worden met `wrangler pages deploy` als kale HTML-map
gehost. Deze app heeft server-functionaliteit nodig (API routes, admin
Basic Auth), dus die draait als **Cloudflare Worker** via de
[`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare) adapter
(al geïnstalleerd, zie `wrangler.jsonc` en `open-next.config.ts`).

**Eenmalig, lokaal:**

```bash
npx wrangler login
```

**Let op het verschil tussen build-time en runtime env vars:**

- Alles dat met `NEXT_PUBLIC_` begint (`NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_ACADEMY_URL`, `NEXT_PUBLIC_LEAD_CAPTURE_ENABLED`) wordt door
  Next.js tijdens `next build` in de client-bundle gebakken. Die moeten dus
  in een `.env.local` staan (kopieer `.env.example`) **vóórdat** je
  `npm run cf:deploy` draait — zetten in `wrangler.jsonc` is voor deze drie
  te laat.
- Server-only vars (`SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_USER`,
  `ADMIN_PASSWORD`) worden pas op het moment zelf door de Worker gelezen, dus
  die horen thuis in Wrangler, niet in `.env.local`.

**Server-only secrets zetten** (niet in `wrangler.jsonc` — die staat in git):

```bash
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put ADMIN_PASSWORD
```

**Server-only, niet-geheime var** zet je wél in `wrangler.jsonc` onder `"vars"`:

```jsonc
"vars": {
  "ADMIN_USER": "admin"
}
```

**Deployen:**

```bash
npm run cf:deploy
```

Dit bouwt de Next.js-app, bundelt 'm met OpenNext naar een Worker, en
deployt met Wrangler. Lokaal een keer preview draaien op de echte
Workers-runtime kan met `npm run cf:preview`.

Het domein staat al klaar in `wrangler.jsonc` (`aiincomescan.winst.ai` —
`scan.winst.ai` was al in gebruik door Corporetta). Omdat `winst.ai` al in
hetzelfde Cloudflare-account zit, provisioned Wrangler de DNS voor dat
custom domain automatisch bij de eerste deploy. Wil je een andere naam,
pas dan `routes` in `wrangler.jsonc` aan vóór je deployt.

Er staat bewust nog geen GitHub Action die automatisch deployt bij een
push — dat voegen we toe zodra je een keer handmatig hebt gedeployd en
tevreden bent met het resultaat.

### Alternatief: Vercel

De app is standaard Next.js, dus Vercel werkt ook zonder aanpassingen:
importeer `ai-income-scan/` als project, zet dezelfde environment variables
(zonder de Wrangler-secrets-stap), en deploy.

## Wat bewust niet gebouwd is (V2+)

Academy-dashboard/content, Stripe-checkout, AI-advisor, community,
subscriptions, tool-directory, gamification, mobiele app.

## Bekend punt

`next` bundelt intern een iets oudere `sharp`/`postcss`; `npm audit` meldt
dit als high-severity. Dit zijn Next.js' eigen bundled dependencies (o.a.
voor image optimization, hier niet gebruikt) — een volledige fix vereist een
major-upgrade naar Next 16 (React 19). Voor deze MVP bewust niet meegenomen
om geen onnodig risico op breaking changes te introduceren; iets om later
bewust te plannen.
