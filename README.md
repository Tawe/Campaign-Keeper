# Campaign Keeper

Campaign Keeper is a full-featured campaign management tool for tabletop RPG Dungeon Masters. It combines session journaling, world-building (NPCs, locations, factions, events), scheduling, and a player portal into a single app.

## Stack

- **Next.js 15** App Router with React Server Components and Server Actions
- **TypeScript** throughout
- **Firebase** — Firestore (database) + Firebase Auth (magic-link sign-in)
- **Firebase Admin SDK** for all server-side reads and writes
- **Resend** for transactional email (session invites + reminders)
- **Private S3** bucket for portrait images (NPC, player, location, event, character)
- **Tailwind CSS** + shadcn/ui primitives
- **Bun** as package manager and test runner

## Features

### Authentication
- Magic-link email sign-in via Firebase Auth
- 5-day session cookies managed server-side
- Auth middleware protects `/campaigns`, `/app`, and `/player` route prefixes

### DM Workspace (`/campaigns/[campaignId]/`)

**Sessions**
- Session notes with public recap and DM-only private notes
- Public share links with per-session tokens (rotatable / disableable)
- Player feedback form on public recap pages
- In-game date tracking via custom campaign calendar

**NPCs**
- Global NPC library + per-campaign junction docs
- Per-character class array (`NpcClass[]`), race, alignment, status, disposition, faction affiliations
- Portrait images served through authenticated routes
- Campaign-scoped last scene, public info, and private notes
- Mention tracking per session; linked events section

**Locations**
- Global library + per-campaign junction docs
- Hierarchical parent/sublocation structure
- Portrait images, terrain tags
- Visit history, NPCs currently "at" location (via `lastScene`)
- Breadcrumb chain navigation; linked events section

**Factions**
- Global library (type, alignment, founded) + per-campaign junction docs (status, influence, leaders, allegiances, enemies, member count, home base)
- Live member roster via `factionNames array-contains` query
- Linked events section

**Players**
- Campaign player roster with optional link to a real Firebase Auth account (`playerUserId`)
- Per-character sheet: name, class, race, level, stats link, portrait image
- Invite link (`/join/[campaignId]?token=...`) — public join page, no manual entry
- `playerUserIds[]` array on campaign doc drives Firestore security rules

**Events**
- Global event library + per-campaign junction docs
- In-game start/end dates with custom calendar integration
- Associations: linked NPCs, Location, Factions, Sessions
- Events appear in the calendar view alongside sessions

**Calendar**
- Fully custom calendar definition per campaign: month names, day counts, weekday names, year label
- In-game date picker on session and event forms
- Month-grid calendar view with session and event pills
- Contiguous year navigation (±1) with jump-to-year input
- Calendar import: copy a definition from another campaign
- Player portal mirrors the same view (player-visible sessions only)

**Schedule**
- Create upcoming scheduled sessions with date, time, title, and player-facing notes
- "Send Invites" emails all players with a Resend email containing three one-click RSVP buttons
- Token-based RSVP — players respond without logging in via `/rsvp/[token]`
- Players can revisit the RSVP link at any time to update their response or add a message
- Attendance summary: ✓ attending / ? maybe / ✗ can't make it / • pending
- Set a campaign cadence description and auto-reminder window (N days before)
- Reminder emails sent automatically via `/api/cron/send-reminders` (Bearer-protected)
- Firebase Cloud Function (`functions/src/scheduledReminders.ts`) calls the cron endpoint daily

**Search**
- Full-text search across NPCs, locations, and factions within a campaign

### Global DM Vault (`/app/`)

- `/app/npcs` — all NPCs across all campaigns, with per-campaign status and disposition badges
- `/app/locations` — all locations, with per-campaign visit counts
- `/app/factions` — all factions, with per-campaign status and influence badges
- `/app/players` — all players across all campaigns

### Player Portal (`/player/`)

- `/player/dashboard` — all joined campaigns and characters
- Per-campaign view: session recaps, visible NPCs and locations
- Profile editor: update character names, classes, levels, stats links, and per-character portraits
- RSVP page (`/rsvp/[token]`) — public, no login needed; shows session info, three status buttons, optional message field

## Data Model

Two-layer Firestore structure:

| Layer | Collections | Purpose |
|-------|-------------|---------|
| Global library | `npcs`, `locations`, `factions`, `events` | Intrinsic/historical data, owned by DM |
| Campaign junction | `campaign_npcs`, `campaign_locations`, `campaign_factions`, `campaign_events` | Dynamic/timeline fields per campaign |
| Core | `campaigns`, `sessions`, `players`, `threads` | Campaign management |
| Scheduling | `scheduled_sessions`, `attendance` | Session scheduling + RSVP |
| Supporting | `calendars`, `poll_responses`, `npc_mentions`, `location_visits` | Calendar definitions, tracking |

Firestore security rules use an `isPlayerInCampaign()` helper that checks `campaign.playerUserIds[]`. All server-side writes use the Admin SDK and bypass client rules.

Compound query indexes are defined in `firestore.indexes.json`.

## Portrait Storage

Portraits are stored in a private S3 bucket and served through authenticated Next.js API routes:

| Kind | Object key | Route |
|------|-----------|-------|
| NPC | `portraits/npc/<npcId>/<uuid>.ext` | `/api/portraits/npc/[npcId]` |
| Player | `portraits/player/<playerId>/<uuid>.ext` | `/api/portraits/player/[playerId]` |
| Location | `portraits/location/<locationId>/<uuid>.ext` | `/api/portraits/location/[locationId]` |
| Event | `portraits/event/<eventId>/<uuid>.ext` | `/api/portraits/event/[eventId]` |
| Character | `portraits/character/<charId>/<uuid>.ext` | `/api/portraits/character/[playerId]/[charId]` |

Recommended bucket settings: block all public access, bucket owner enforced, default encryption enabled, IAM limited to `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject` on `portraits/*`.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```env
# Firebase client-side (safe to expose)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Firebase Admin — paste service account JSON as a single-line string
# Not needed when NEXT_PUBLIC_FIREBASE_EMULATOR=true
FIREBASE_SERVICE_ACCOUNT=

# Firebase Emulator — set to "true" for local development
NEXT_PUBLIC_FIREBASE_EMULATOR=true

# Email — Resend (https://resend.com)
RESEND_API_KEY=re_...
RESEND_FROM_ADDRESS=noreply@yourdomain.com

# Cron endpoint secret
CRON_SECRET=

# Private S3 bucket for portraits
CAMPAIGN_KEEPER_AWS_REGION=
CAMPAIGN_KEEPER_AWS_ACCESS_KEY_ID=
CAMPAIGN_KEEPER_AWS_SECRET_ACCESS_KEY=
CAMPAIGN_KEEPER_AWS_SESSION_TOKEN=   # optional
CAMPAIGN_KEEPER_S3_BUCKET=
CAMPAIGN_KEEPER_S3_ENDPOINT=         # optional (non-AWS S3-compatible)
CAMPAIGN_KEEPER_S3_FORCE_PATH_STYLE=false
```

## Local Development

```bash
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

With `NEXT_PUBLIC_FIREBASE_EMULATOR=true`, the app connects to the local Firebase Emulator Suite instead of production. `FIREBASE_SERVICE_ACCOUNT` is not required in emulator mode.

## Scripts

```bash
bun run dev       # development server
bun run build     # production build
bun run start     # production server
bun run lint      # ESLint
bun test          # Bun test runner
```

## Firestore Deployment

Deploy security rules and indexes:

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

## Scheduling Cron (Firebase Cloud Function)

The auto-reminder function lives in `functions/`. To deploy:

```bash
cd functions
npm install
firebase functions:config:set app.url="https://yourdomain.com" app.cron_secret="<your-secret>"
firebase deploy --only functions
```

The function calls `GET /api/cron/send-reminders` with `Authorization: Bearer <CRON_SECRET>` once every 24 hours.

## Deployment Checklist

1. Set all production environment variables (no `NEXT_PUBLIC_FIREBASE_EMULATOR`).
2. Deploy Firestore rules and indexes.
3. Verify Firebase Auth, Firestore, and S3 access in the deployed environment.
4. Confirm portrait upload, replacement, and deletion work end-to-end.
5. Confirm the `/rsvp/[token]` route is not behind any auth middleware.
6. Set `CRON_SECRET` and `RESEND_API_KEY`, then smoke-test invite + reminder emails.
7. Deploy the Firebase Cloud Function for daily auto-reminders.
