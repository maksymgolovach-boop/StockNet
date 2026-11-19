# Stocknet — B2B producer marketplace (front-end)

React + TypeScript (strict) + Vite + Tailwind v4. No backend: a typed mock database and a promise-based service layer stand in for the API.

## Setup

Requires **Node.js 20.19+ or 22.12+** (Vite 8). `.nvmrc` pins Node 22 for nvm / fnm users.

```bash
npm install
npm run dev        # http://localhost:5173
npm run check      # type-check + lint + format check + locale coverage + mock-data validation + search, deal, storage and component tests
npm run test:components  # component tests only (Vitest + Testing Library); add --watch while working
npm run format     # format all files with Prettier (Tailwind classes are sorted too)
npm run test:e2e   # browser tests against the production build (first time: npx playwright install chromium)
npm run build      # type-check and production build
```

Code style is enforced by Prettier (`.prettierrc.json`) and oxlint. VS Code suggests both extensions (`.vscode/extensions.json`); turn on "Format on Save". Generated mock data in `src/mocks` is not formatted, so each record stays on one line.

GitHub Actions (`.github/workflows/check.yml`) runs `npm run check`, `npm run build` and the browser tests on every push and pull request. If a browser test fails there, its trace is attached to the run (open it with `npx playwright show-trace`).

### Tests

- `npm run check` covers the logic without a browser: search (`scripts/test-search.ts`), deal and lot rules (`test-deals.ts`), saved-data validation (`test-storage.ts`), plus translation coverage and mock-data validation.
- `npm run test:components` renders single components in jsdom with Vitest and Testing Library and drives them like a user: the search box (suggestions, keyboard, recent searches, "/" shortcut), tabs, price tiers, the language switcher and the account chip. Tests sit next to their component as `*.test.tsx`; `src/test/render.tsx` wraps a component in the router and data fetching. It is part of `npm run check`.
- `npm run test:e2e` runs Playwright tests from `e2e/` in Chromium against `vite preview`: every page renders, search and filters, the quote → order flow, chat, the lot form, language switching, crash screens and corrupted saved data, phone and desktop widths (no sideways scrolling), the header at 768–1920 px in every language (`header.spec.ts`), accessibility (axe-core, light and dark) and the dev-menu switch. Photo and map hosts are blocked in the tests, so they do not depend on the internet. Ids of demo records used by the tests are listed in `e2e/fixtures.ts`.

### Running the demo without internet

- **Fonts** are bundled, so they always work.
- **Product photos** load from Pexels and Unsplash. Run `npm run photos:download` once on a computer with internet access: it saves every photo of the catalogue in two widths (about 300 files, 320 px and 800 px) into `src/assets/photos`. Photos found there are used instead of the online ones, in `npm run dev` and in builds. Commit the folder if the whole team and the published demo should have them. Without it, a photo that cannot load shows the category icon.
- **Map tiles** come from OpenStreetMap and cannot be bundled. Offline, the map shows a plain grid with the pins; the result list still works.

### Public demo (GitHub Pages)

`.github/workflows/deploy.yml` publishes the demo after every push to `main`, at `https://<owner>.github.io/<repository>/`. A repository admin has to switch it on once: **Settings → Pages → Source → GitHub Actions**. Until then the workflow finishes with a notice and publishes nothing.

The app can be served from a sub-folder: set `BASE_PATH` when building (`BASE_PATH=/StockNet/ npm run build`). The deploy workflow does this and copies `index.html` to `404.html`, so deep links such as `/product/pr-214` open the app.

The demo runs against a fixed date (**16 Oct 2026**, `src/shared/lib/dates.ts`) so expiry badges, document states and deal timelines stay coherent with the mock data.

Fonts (Fraunces, IBM Plex Sans and Mono) are bundled with the app (`@fontsource` packages, imported in `src/index.css`), so nothing loads from Google Fonts. Storage falls back to memory when `localStorage` is unavailable.

## Folder structure

```
src/
  app/                 App, router, layout (header, mobile nav, footer), shell pages
  config/              Registries — the only place to extend the platform
    categories/        CategoryConfig per root category + tree resolver
    currencies.ts      Currency registry (EUR, USD, RON)
    languages.ts       Language registry (en, de, ro) → locale files
    units.ts           Units, dimensions, imperial equivalents
    certifications.ts  Certifications and standards
    cities.ts          Cities for addresses, warehouses and the location pickers
  domain/              Business rules as plain functions: deal steps, lot maths, pricing, trust score, search engine
  features/            Feature modules: search, map, product, producer, trust, lots (+ stock), chat,
                       deals, rfq, partners, recommendations, dashboard, settings, home, i18n, currency, dev
  locales/             en.json, de.json, ro.json
  mocks/               Seeded generators: producers, buyers, catalog templates, deals, reviews, threads
                       (370 products and 129 producers in total, of which 223 products and 80 producers are in the active industries; catalog/extra.ts adds 100 products, mostly fruit & vegetables,
                       farm machinery and fertilizers & crop protection, about 85% sold by lot; regional.ts adds
                       100 producers in 100 different towns across Romania, Hungary and Bulgaria, one product each)
  services/            API layer (mockRequest, catalog, search + recommendations, deals, lots, chat transport, FX)
                       + TanStack Query hooks, the logged-in company (session.ts), demo controls (devStore.ts)
  shared/              UI primitives, hooks, libs (geo, storage, random, dates)
  types/models.ts      Domain model
scripts/               check-case.ts, check-locales.ts, validate-mocks.ts, test-search.ts, test-deals.ts, test-storage.ts, download-photos.ts
e2e/                   Playwright browser tests (see Tests)
src/test/              Component-test setup and render helper (tests themselves sit next to their components)
```

### Layers

Each folder may only import from the folders below it:

```
features, app      screens: get their data from services
services           the API: the only code that touches the mock data
mocks              generated demo data
domain             business rules: plain functions, no React, no data fetching
config, shared,    foundation
types
```

`npm run lint` fails on an import that breaks this (`no-restricted-imports` in `.oxlintrc.json`). When the real back-end arrives, `src/mocks` is deleted and only `src/services` changes; screens and business rules stay as they are.

## Active industries

The site currently shows three industries: Agricultural Machinery, Fertilizers & Crop Protection, and Fruits & Vegetables. The list lives in `src/config/scope.ts` (`ACTIVE_ROOT_CATEGORIES`). All other categories (dairy, meat, metals, cables, concrete, aggregates, timber, plastics) remain in the code and mock data, but are hidden everywhere: menus, search, filters, map, deals, chats, partners and category URLs. Products, producers, deals, reviews and chats of hidden industries are filtered out when the mock database is built (`inScope` in `src/mocks/index.ts`). To show an industry again, add its slug to the list.

## Add a category

1. Create a `CategoryConfig` (see `src/config/categories/industrial.ts`): `perishable`, `allowedUnits`, `attributes` (number / enum / boolean / text, each with `filterable`), `certifications`, `logistics`, and the subcategory tree. Subcategories can override logistics (e.g. ready-mix concrete: 45 km / 1.5 h).
2. Append it to `CATEGORY_CONFIGS` in `src/config/categories/index.ts`.
3. Add translation keys to every locale: `categories.<slug>` for each node, `categoryBlurb.<root>`, `attributes.<key>` and `enums.<key>.<option>` for enums with `display: 'translate'`.
4. If the icon is new, register it in `src/features/categories/CategoryIcon.tsx`.

`npm run check:locales` fails if any config-driven key is missing.

## Add a language

1. Add `src/locales/<code>.json` (copy `en.json`; use the plural suffixes `Intl.PluralRules` gives that language).
2. Add one entry to `LANGUAGES` in `src/config/languages.ts` (native name, Intl locale, default currency, and a `load` function that imports the file).

Only the active language is downloaded before the first render; the others follow once the browser is idle (and immediately when the user switches). Missing keys fall back to English and log a dev warning.

## Add a currency

Add one entry to `CURRENCIES` in `src/config/currencies.ts` (code, decimals, mock rate from EUR) and its name under `currency.<CODE>` in each locale.

## Replace the mocks with a real API

Each service in `src/services` is an interface plus a mock implementation built on `mockRequest()`. Implement the same interface with `fetch` and swap the export. Real-time chat goes through `ChatTransport` (`chatTransport.ts`): implement `connect / send / markRead / openThread` over a WebSocket and change the exported `chatTransport`. Browser persistence of demo edits (`mocks/lotStorage.ts`, `mocks/dealStorage.ts`) disappears once a server owns the data. Query keys and hooks in `services/queries.ts` stay unchanged. FX rates come through the `FxProvider` interface in `fxService.ts`.

## Search

- Matching (`src/domain/search/searchIndex.ts`) is diacritic-insensitive and folds ß→ss, ×→x, ²→2 and decimal commas, so "otel" finds "oțel", "Strasse" finds "Straße" and "3x2.5 mm2" finds "3×2,5 mm²".
- Words with digits (specs and grades like `NPK 16-16-16`, `FAO 380`, `20-20-20`) must match exactly. Other words fall back to fuzzy matching for typos ("tractr" → tractor).
- Filters, facets and sorting are pure functions in `engine.ts`, called by `services/searchService.ts`.
- All search state lives in the URL:

| Param | Meaning |
|---|---|
| `q` | text query |
| `/category/:slug` | category (path) |
| `country`, `cert` | comma lists |
| `radius` | km from your location (0–1000) |
| `pmin`, `pmax`, `punit` | price range in display currency, optional per-unit normalisation |
| `moq`, `rating`, `stock=1`, `delivery=1` | order filters |
| `ver`, `trust`, `partners=1`, `validcerts=1` | trust filters |
| `exp` (`lt7`/`lt30`/`gt30`), `lead` (`immediate`/`lt1w`/`lt1m`/`made_to_order`) | time filters |
| `a.<attribute>` | spec filters: `a.qualityClass=extra,class_i`, `a.enginePowerHp=80..150`, `a.organic=1` |
| `sort`, `view=grid`, `limit` | sorting, view, page size |

## Map (Booking-style)

- **Desktop:** List view is a split layout (results + sticky map). Map view fills the page with a floating results panel. Grid view hides the map.
- **Mobile:** a floating "Map" button opens a full-screen map with a snapping card carousel. Swiping selects the pin, and tapping a pin scrolls to its card.
- **Pins:** one per producer, labelled with the cheapest matching price in your currency ("€790 / t", "3.900 lei / t"), with "from" and a count when several products match. Pins show states (hover, selected, visited, saved ♥, past partner, verified ✓). Clusters show the count and the lowest price.
- **Sync:** hovering a card highlights its pin (or its cluster), and hovering a pin highlights the cards. Selecting a pin scrolls the list to it and opens a popup card.
- **Area search:** "Search as I move the map", or pan and press "Search this area". The list narrows to the visible bounds (`b=` in the URL) while pins stay visible everywhere. "Reset map" and the "Map area" chip clear it.
- **URL:** `view=map`, `c=lat,lng`, `z=zoom`, `b=south,west,north,east`, `move=1`.
- **Overlays:** your location and the radius filter circle (up to 1000 km). The circle grows and shrinks smoothly when the radius changes, and the map glides to the new results; both are instant with reduced motion.
- **User-controlled view:** the map fits the results once, then keeps wherever you panned or zoomed, even when filters change. "Reset map" fits everything again.
- **Performance:** icons are memoised by content; hover, selected and visited are CSS classes on the existing element. Leaflet and markercluster load lazily in their own chunk.
- **Accessibility:** pins are focusable buttons with a full label, Enter/Space opens the popup and Esc closes it. The list remains the accessible equivalent of the map.
- **Offline / sandbox:** if OpenStreetMap tiles can't load, a neutral grid and a notice are shown, and pins and interactions keep working.

## Product & producer pages, trust layer

- **Product page** (`/product/:id`): gallery, translatable description, specs from the category config, certifications, a document center, a sticky purchase box with volume price tiers, the seller's trust card, reviews of the product and similar products.
- **Producer page** (`/producer/:id?tab=`): overview, products, trust & documents, reviews, and "Your history". The history tab appears only when you have deals with that producer.
- **Trust score:** click any trust pill to see all seven factors, each with its rule, weight, sub-score, raw value and points. Weights live in `TRUST_WEIGHTS`.
- **Documents:** valid, expiring soon (60 days or less) and expired, with warnings. Downloads are UI-only in this demo.
- **Privacy:** public profiles show only aggregate numbers. Counterparties and amounts appear only to the parties of a deal, and reference customers only when they opted in.
- **Reviews:** only from completed deals. Filter by stars (click a distribution bar), photos or producer reply; sort, mark as helpful, report.
- **Report:** listings, users and reviews, with reason-specific options (demo only, nothing is sent).

## Chat

- **Routes:** `/messages` (list) and `/messages/:threadId`. Two panes on desktop, a single pane with a back button on mobile.
- **Start chat:** "Contact producer" on product, producer and map cards links to `/messages?producer=<id>&product=<id>`. This opens the existing thread with that partner, or creates one and pins the product.
- **Realtime:** `src/services/chatTransport.ts` defines `ChatTransport` (`connect`, `send`, `markRead`, `openThread`). The mock simulates a WebSocket in memory: after you send a message, the partner reads it (✓ turns into ✓✓), types, then replies in their own language with translations attached. To use a real server, implement the same interface over a socket and change the exported `chatTransport`.
- **App-wide connection:** `useChatConnection` (mounted in the app shell) writes events into the query cache, so the header badge, thread list and open conversation stay live. `useChat(threadId)` handles messages, sending, typing and read receipts.
- **Features:** unread badges, day separators, read receipts, typing indicator, a safety notice, a pinned product/deal card, quick-reply templates (different for buyer and producer), attachments (UI only, images preview locally), and a per-message "Translate" button labelled as machine translation.
- **Partner panel:** collapsible (remembered) on wide screens, a drawer on smaller ones. It shows the trust summary (the producer's score when you buy, the buyer's payment reliability when you sell), your private history with that partner, and "Create quote request".
- **Demo note:** new messages live in memory and reset when the page reloads.


## Lots (sale by lot)

- **Two sale modes per listing:** by measure (unit price tiers and MOQ) and/or by lot (`product.saleModes`). Each category declares `lots: { allowedSaleModes, lotTypes, requiresExpiry, requiresBatch, requiresCertificate }`; the form, validation and filters read it, so a new category needs no UI changes.
- **Lot model** (`Lot` in `src/types/models.ts`): lot/batch number, type, content (`40 coils × 500 m`), weight/volume, price per lot plus optional tiers by number of lots, stock count, divisibility (indivisible, or splittable in steps with a minimum), condition, production and expiry dates **per lot**, documents **per lot**, and its own warehouse location.
- **Maths** (`src/domain/lotMath.ts`): lot size in the listing unit (via content, item size, weight or volume), approximate normalized price for comparison, status (available / reserved / sold / expired / paused / archived), quantity rules.
- **Buyers:** "Lot" badge and lot line on cards and map popups, pins show "€2,400 / lot", clusters show the lowest per-unit price only when units match. Product page: lot table, selection in the URL (`?lot=`), quantity in lots with indivisible/divisible messaging, lot tiers and total. Filters: sale mode, lot price, lot size (when a category is selected), lots available, indivisible only, condition, production dates (`mode`, `lprice`, `lsize`, `lots`, `indiv`, `lcond`, `prod`). Sorts: lot price and price per unit. The home page "Deals" block shows surplus and clearance lots.
- **Stock (sell):** `/stock` ("Stock & lots") manages the producer identity's lots (`p01`): stats, status filters, create/edit (react-hook-form + zod), duplicate, stock +/−, pause/resume, archive/restore, "Add lot" from your product page. Lots in confirmed, undelivered deals count as reserved. Edits are saved in the browser (`sy-lots`); "Reset lots" in the dev menu restores the mock data.
- **Deals and reviews:** lot line items store lot ID, lot number and type; reviews of those deals show the lot number. The quote form (next phase) receives `?product=&lot=&lots=`.

## Deals, quote requests, disputes, partners

- **`/deals`**: table (cards on mobile) with ID, partner, products (lot items marked), total in the deal currency plus the converted amount, status and last update. URL filters: status chips, partner, category, created date range, amount range (display currency), transaction currency, text search (ID, partner, product, lot number) and sort. Summary cards (deals, volume, active, average, on-time). **Export CSV** downloads the filtered list client-side (UTF-8 with BOM; comma in English, semicolon in German/Romanian for Excel).
- **`/deals/:id`**: timeline with timestamps and actor, line items (lots show lot number and type), converted total, delivery terms, notes and attachments, documents (generated as the deal progresses; UI only), linked chat. Actions depend on your side in the deal and its status (`src/features/deals/dealRules.ts`): as the producer you send a quote, dispatch and mark delivered; as the buyer you accept, negotiate, cancel (with confirmation), confirm receipt and close. **Reorder** pre-fills a new request. **Open dispute** (from order confirmation to 30 days after delivery) records reason, affected items and their lot numbers, description, desired resolution and evidence; the buyer can mark it resolved. Completed deals show a review form (5 criteria); the review updates the producer's rating and trust score.
- **Lots and deals**: accepting a quote reserves the lots (it fails if a lot no longer has enough unreserved stock); delivery takes them out of stock. Lots stay reserved while an undelivered deal is disputed.
- **Disputes**: only the buyer can mark a dispute resolved; the deal then returns to the status it had before the dispute (e.g. "In delivery"), so it can still be delivered and closed.
- **Your own listings**: the company cannot request quotes from or chat with its own producer identity. On your own products, producer page and map pins, the quote and contact buttons are replaced by a link to Stock & lots.
- **`/deals/new`** (quote request): one producer, items by measure or by lot (with MOQ and lot rules), delivery address, Incoterm, requested date, notes and attachments. Pre-filled from `?product=&lot=&lots=`, `?producer=` or `?reorder=<dealId>`. It creates a deal in "Quote request", posts the request in the chat thread, and the mock producer answers with a quote about 6 seconds later (pushed live to open pages). If the page is reloaded before that, the reply is scheduled again on start-up.
- **`/partners`**: one card per counterparty: first and last deal, deals, volume, average rating given as a buyer (or received as a seller), on-time rate, disputes, active/dormant, quarterly volume bars, favorite, tag and private notes, plus "Request new quote", "Message" and "View deals".
- **Persistence**: new deals, status changes, disputes, reviews, partner notes and the threads they create are saved in the browser (`sy-deals`). "Reset lots & deals" in the dev menu restores the mock data.

## Recommendations, nearby, dashboard, settings

- **Recommended for you** (home and dashboard, scored for your buyer identity): `searchService.recommend` scores every listing on recent searches, saved items, preferred categories, typical order value, location/delivery, past partners and deals, required certifications and verification. Each card shows its strongest reason ("Because you searched for…", "You've bought from this producer 5 times", "Popular with contractors like you"). **Tune my recommendations** (drawer on home, section in settings) changes categories, volume range, certifications, "prefer verified" and "prefer past partners"; the list re-ranks immediately.
- **Producers near you**: the 8 closest producers to your location, with distance and "delivers to you"; the location can be changed in place (city/postcode list or browser geolocation).
- **Home Deals**: tabs for surplus/clearance lots and near-expiry perishables.
- **`/dashboard`**: one company view with your open quote requests (buying), incoming requests (selling), "waiting for you" deals, active deals, orders to ship, unread messages, saved items, stock alerts (low, expiring, paused, sold-out lots), conversations, recommendations and recent searches.
- **`/settings`**: language, currency (or follow the language), units, theme, location and preferred radius, notifications (stored, no e-mails in the demo), privacy (show reference customers on the public profile, allow being listed as a reference customer, public deal count), recommendation tuning, reset of demo data. Everything saves automatically.

## Accessibility and performance

- Every page was scanned with axe-core (WCAG 2.1 A/AA) in light and dark mode: no violations. Contrast pairs were checked with a script (all text ≥ 4.5:1).
- Keyboard: skip link, "/" focuses search, combobox and tab patterns, focus trap and focus return in modals, drawers and popovers, Esc closes them; map pins are focusable and the list is the map's accessible equivalent; charts have a screen-reader table.
- `prefers-reduced-motion` disables animations and smooth scrolling.
- No page scrolls sideways (checked at 360, 390, 768, 1024 and 1280 px).
- The header decides what fits in its top row instead of using fixed breakpoints, because menu labels differ in length per language (`src/app/layout/useHeaderFit.ts`). The search box keeps at least 288 px on desktop; when room runs out the company name goes first (avatar only, name in its tooltip), then the menu labels (icons with tooltips; the labels stay for screen readers). Pickers and menu items never shrink or wrap. Horizontally scrolling tables are `relative`, so screen-reader-only content inside them cannot widen the page.

## Error handling

The app should never show a blank page:

- **Saved data is checked when it is read.** Lots, deals, reviews, threads and partner notes saved in the browser (`sy-lots`, `sy-deals`) are replayed only if each record still has the expected shape (`src/shared/lib/shape.ts`); anything else is skipped. Preferences fall back to defaults field by field. If the replay still fails, the saved edits are dropped and the mock data is rebuilt.
- **Crash screen.** A page that throws while rendering, or whose code fails to load, shows a message with Reload, Home and "Reset demo data" inside the normal layout, so the header keeps working (`src/app/CrashScreen.tsx`, route `errorElement`s in `src/app/router.tsx`). An `ErrorBoundary` around the whole app covers everything outside the router.
- **Start-up fallback.** `src/main.tsx` loads the app with a dynamic import; if that fails before React renders, a plain-HTML message offers to reset the saved data (`src/app/startupError.ts`).
- Code splitting: home and search load first; every other page, the map (Leaflet), the form library and the inactive languages load on demand (see `src/app/router.tsx`, `src/config/languages.ts`). `vite.config.ts` adds preload hints for the app's start-up files, so they download in parallel, and groups the build into a few files (libraries, icons, shared code) instead of dozens of tiny ones; the library file keeps its name between deployments, so returning visitors keep it cached.
- `index.html` shows the logo from the first paint until the app has loaded (measured on slow 4G: logo at about 0.8 s instead of a blank page until 2.3 s).
- Number, price and date formatters are created once per locale and option set and then reused (`src/shared/lib/intlCache.ts`); creating one costs about 0.1 ms and a results page formats hundreds of values.

## Assumptions

- One company, Câmpia Moldovei Agro (a farming group and distributor in Iași), is "you". It buys as buyer `b07` and sells as producer `p01` (Cooperativa Agricolă Țara Bârsei), with one inbox, deal list, partner list and dashboard. The Stock & lots page and the company's own producer page say which name it sells under. The dev menu shows both identities read-only. There is no authentication. Saved demo settings from an older version (dev menu, saved items, recent searches, recommendation categories) are reset automatically.
- Product photos for agricultural machinery, fruit & vegetables and fertilizers & crop protection are free Pexels and Unsplash stock photos (`src/mocks/photos.ts`), loaded from images.pexels.com and images.unsplash.com; fertilizers show large stocks (big bags, pallets, bulk piles) and matched by product type; they are illustrative only. Other categories, and any photo that fails to load (e.g. offline), show the neutral category placeholder.
- All companies, prices, documents and reviews are fictional. Exchange rates are fixed mock values; prices are indicative and converted for display only, while quotes and deals stay in their transaction currency.
- "Today" is fixed at 16 Oct 2026 so expiry, document and deal states stay consistent. Distances are straight-line (road distance is approximated for time-limited deliveries).
- Machine translation, file uploads and downloads, e-mail notifications and payments are simulated. The mock producer answers new quote requests automatically after a few seconds.
- Demo edits (lots, deals, disputes, reviews, partner notes, preferences) are stored in this browser only; chat messages typed in the demo reset on reload.
- A quote request goes to one producer; a deal has one transaction currency (the first item's listing currency).

## Suggested next steps

1. Backend and auth: real API behind the existing service interfaces, multi-user accounts and company roles (buyer, seller, admin), server-side search and pagination.
2. Real-time: WebSocket implementation of `ChatTransport`, push notifications and e-mail digests from the stored preferences.
3. Documents: real uploads with virus scanning, signed URLs, certificate verification workflow, PDF generation for quotes, order confirmations and invoices.
4. Payments and logistics: escrow or invoicing integration, freight quotes, delivery tracking feeding the deal timeline.
5. Trust and moderation: verification back-office, dispute mediation tools, review moderation and report handling.
6. Data quality: live FX and commodity indices (LME), geocoding for any address, road-distance routing.
7. Performance: split the mock catalogue out of the main bundle once the API exists (languages already load on demand).
8. Testing: component tests for the forms (quote request, lot editor), the deal timeline and chat; visual regression screenshots. (Playwright flows, axe checks in CI and the first component tests are in place.)

## Dev menu

Always available with `npm run dev`. In a published build it is hidden; open any page with `?dev=1` to show it (remembered in that browser) and `?dev=0` to hide it again.

Bottom-left button: shows the logged-in company with its buyer and producer identities (read-only), simulate API errors (exercises error states), change API latency (exercises skeletons), reset preferences.
