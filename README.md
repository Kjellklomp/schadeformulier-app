# Schadeformulier Snelinvuller

Webapp die het Europees schadeformulier na een auto-ongeluk sneller helpt invullen:

- **Rijbewijs / kenteken / verzekeringsbewijs uitlezen** via AI-vision (foto → automatisch ingevulde velden)
- **Live RDW-check** van het kenteken tegen de RDW open-data
- **Toedracht inspreken of typen**, samengevat en gestructureerd door AI
- **QR-samensessie**: de tegenpartij vult zijn kant (Voertuig B) in vanaf zijn eigen telefoon
- **AI-conflictcheck** tussen beide verklaringen zodra ze allebei binnen zijn
- **Automatisch ingevuld PDF-schadeformulier**, gegenereerd in de browser met pdf-lib op basis van het echte lege formulier

Gebouwd als prototype ter validatie — zie de disclaimers in de app zelf (vak 15, handtekeningen, etc.).

## Techstack

- **Next.js 16** (App Router) · **TypeScript** · **Tailwind CSS v4**
- **Anthropic API** (`@anthropic-ai/sdk`) — uitsluitend server-side via `app/api/vision/route.ts`; de API-key komt nooit in de browser
- **Upstash Redis** (`@upstash/redis`) voor de QR-sessie-opslag (TTL 24 uur), via `app/api/session/[id]/route.ts`
- **RDW open data** en **pdf-lib** — volledig client-side, geen API-key nodig
- **lucide-react** voor iconen, **qrcode** voor de (client-side gegenereerde) QR-code

## Lokaal draaien

```bash
npm install
cp .env.example .env.local
# vul .env.local in, zie hieronder
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Omgevingsvariabelen

Zie [.env.example](.env.example) voor de volledige lijst. Kort samengevat:

| Variabele | Nodig voor | Waar vandaan |
|---|---|---|
| `ANTHROPIC_API_KEY` | Alle AI-vision-calls (OCR, toedracht-analyse, conflictcheck) | [console.anthropic.com](https://console.anthropic.com) |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | QR-samen-invullen-sessie | Upstash-database (rechtstreeks, of via de Vercel-integratie hieronder) |

Zonder `ANTHROPIC_API_KEY` werkt de app verder gewoon (alle velden zijn ook handmatig in te vullen), maar geven de OCR/analyse-knoppen een duidelijke foutmelding in plaats van resultaat. Hetzelfde geldt voor de QR-sessie zonder Redis-config.

De RDW-check en het invullen van de PDF hebben geen van beide omgevingsvariabelen nodig — die draaien volledig client-side.

## Deployen op Vercel

1. **Push naar GitHub** en importeer het project in [Vercel](https://vercel.com/new).
2. **Voeg een Redis-integratie toe**: in het Vercel-project → *Storage* / *Integrations* → *Marketplace* → zoek **Redis** (Upstash) → koppel aan dit project. Vercel zet dan automatisch de juiste omgevingsvariabelen klaar (`UPSTASH_REDIS_REST_URL`/`_TOKEN`, of de oudere `KV_REST_API_URL`/`_TOKEN`-namen — de app accepteert beide).
3. **Zet `ANTHROPIC_API_KEY`** onder *Project Settings → Environment Variables*.
4. **Deploy.** De AI-route en de sessie-route draaien als Vercel Functions; de rest is statisch/edge-vriendelijk.

Na deployen: test de volledige flow één keer end-to-end (inclusief de QR-link vanaf een tweede toestel) voordat je de app aan echte gebruikers geeft.

## Projectstructuur

```
app/
  api/vision/route.ts        server-side Anthropic-call (OCR, analyse, conflictcheck)
  api/session/[id]/route.ts  server-side QR-sessie (Upstash Redis, GET = pollen, POST = tegenpartij verstuurt)
  page.tsx                   Suspense-wrapper (nodig voor useSearchParams)
components/
  AppShell.tsx               state, routing tussen stappen, conflictcheck-orkestratie
  Step*.tsx                  de vijf wizard-stappen + de tegenpartij-flow (PartnerFlow.tsx)
lib/
  buildFilledPdf.ts          vult reference/schadeformulier-leeg.pdf met pdf-lib
  pdfFieldCoords.ts          coördinaten van elk veld/vakje op het echte formulier
  situationSketch.ts         canvas-gebaseerde AI-situatieschets (vak 13)
  kv.ts / session.ts         Redis-config en sessie-ID-generatie
public/
  schadeformulier-leeg.pdf   het echte lege Europees schadeformulier (bron: reference/)
reference/
  prototype.html             oorspronkelijk Claude.ai-prototype, ter referentie
```

## Bekende beperkingen

- Vak 15 (handtekeningen van beide bestuurders) moet nog steeds fysiek of via een aparte handtekenwidget — dat kan wettelijk niet worden overgeslagen.
- De AI-gegenereerde situatieschets is een concept ter illustratie, geen juridisch bindende tekening — altijd samen controleren.
- Sessiecodes voor de QR-flow zijn niet geauthenticeerd; wie de code/link kent kan de sessie invullen. Ze verlopen na 24 uur.
