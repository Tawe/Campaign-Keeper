# DM's Ledger — Project Overview

## What It Is

DM's Ledger is a session-memory app for tabletop RPG Dungeon Masters. After each session, the DM spends 2–3 minutes logging what happened. The app then generates a clean, shareable player recap while keeping DM-only secrets private, and builds up a living reference of the campaign's NPCs, locations, players, and open threads over time.

**Core goal:** continuity without homework.

---

## Who It's For

- **Primary:** DMs running recurring campaigns who need fast session notes and a shareable recap.
- **Secondary:** Players who want a consistent summary and a record of NPCs and threads they've encountered.

---

## Key Features

### Campaigns
- Create and manage multiple campaigns, each with a name, game system, and player roster.
- Campaign dashboard shows recent sessions, open threads, NPC index, locations, and players at a glance.
- Delete a campaign (with confirmation).

### Sessions
- Log a session quickly: date, title, highlights, DM notes, tags, open threads, characters, NPCs, loot, and locations visited.
- Every field is optional — fill in what matters, skip the rest.
- Edit or delete any session.
- **Public vs. private split:** highlights and threads can be marked player-visible or DM-only. The same session generates two different outputs.

### Recap Generator
- **Player recap:** public highlights + public threads + public NPC mentions. Never leaks DM-only content.
- **DM recap:** everything — all notes, private threads, full NPC context.
- Share links: each session has a public share URL (`/share/[sessionId]`) that shows only the player-safe recap. No login required for viewers.

### NPCs
- Auto-created when mentioned in a session note — no manual setup needed.
- Case-insensitive deduplication: "Mira" and "mira" are the same NPC.
- Each NPC tracks:
  - **Disposition:** ally / enemy / neutral / unknown
  - **Status:** current state (alive, captured, dead…), auto-populated from the most recent session's NPC status field
  - **Last scene:** where they were last encountered, auto-populated from the session's location data
  - **What players know:** public-facing notes, editable inline
  - **DM notes:** private notes, editable inline (amber styling)
  - **Appearances:** full list of sessions they appeared in, with per-appearance notes and visibility
- NPC hub page (`/npcs`) shows all NPCs sorted by last mentioned date, with disposition badge and current status.

### Locations
- Auto-created when added to a session's "Locations visited" list.
- Each location tracks:
  - **What players know:** public notes, editable inline
  - **DM notes:** private notes, editable inline
  - **Sessions:** chronological list of sessions where the location was visited
- Location hub page (`/locations`) shows all locations sorted by most recently visited.
- Autocomplete on the session form pulls from existing locations.

### Players & Characters
- Player roster: each player has a real name and one or more characters (name, class, race, level).
- Players are seeded automatically when creating a campaign (from the participants list).
- Each character tracks session history: every session they appeared in, with their status at end of that session.
- Character names autocomplete in the session form; new session forms pre-populate with all known characters.
- Player detail page (`/players/[playerId]`) shows per-character session history, mirroring the NPC appearances pattern.

### Open Threads
- One-liners added to a session: "Who hired the assassin?" — each marked public or DM-only.
- Threads aggregate across all sessions on the campaign dashboard.
- Individual thread pages allow resolving and tracking history.

### DM Reflection
- A separate tab on the session form for post-session self-review: plot advancement, key events, player engagement, combat difficulty, pacing notes, and next-session prep.
- Entirely DM-only — never included in player output.

### Player Feedback (Polls)
- Each session has a public poll link players can fill out anonymously.
- Ratings (1–5), what they liked, what could improve, what they're looking forward to.
- DM sees aggregated results on the session detail page.

### Search
- Full-text search across sessions (title, highlights, tags), open threads, and NPCs within a campaign.

---

## Data Model

All data is stored in Firestore flat collections. Every document carries `userId` for ownership and `campaignId` for scoping.

| Collection | Purpose |
|---|---|
| `campaigns` | Campaign metadata |
| `sessions` | Session notes, characters, NPC statuses, loot, locations |
| `threads` | Open threads, one per session source |
| `npcs` | NPC records with disposition, status, last scene, notes |
| `npc_mentions` | Denormalized NPC appearances per session (for fast queries) |
| `locations` | Location records with public/DM notes |
| `location_visits` | Denormalized location appearances per session |
| `players` | Player records with character arrays |
| `poll_responses` | Anonymous player feedback per session |

**Key design decisions:**
- NPC and location mentions are denormalized (name/disposition stored on mention docs) to avoid N+1 fetches on the dashboard and recap.
- NPC `status` and `lastScene` are stored on the NPC doc and auto-updated on session save, gated by a `lastSeenDate` comparison so editing older sessions never overwrites data from newer ones.
- Character–session matching is by `nameLower` (case-insensitive string match) — no foreign key required.

---

## Technical Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Runtime | Bun 1.3.10 |
| Styling | Tailwind CSS v4, shadcn/ui |
| Auth | Firebase Auth — email magic link (passwordless) |
| Database | Firestore (Firebase) |
| Server logic | Next.js Server Actions + Server Components |
| Admin SDK | firebase-admin (server-side only) |
| Client SDK | firebase (client-side auth callback only) |

**Auth flow:** User enters email → receives magic link → `/auth/callback` completes sign-in → Firebase Admin creates an HttpOnly session cookie. Middleware verifies the cookie on every request.

---

## Running Locally

### Prerequisites
- Bun installed (`curl -fsSL https://bun.sh/install | bash`)
- Firebase CLI installed (`npm install -g firebase-tools`)
- Firebase project created (or use the emulator)

### With the Firebase Emulator (recommended for development)

1. `firebase login`
2. `firebase emulators:start` (from project root)
3. Create `.env.local`:
   ```
   NEXT_PUBLIC_FIREBASE_EMULATOR=true
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-dms-ledger
   NEXT_PUBLIC_FIREBASE_API_KEY=fake-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=localhost
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```
4. `bun dev`
5. Magic link emails appear at `http://localhost:4000/auth` (Emulator UI)

### For Production

1. Create a Firebase project, enable Firestore and Email Link sign-in.
2. Add `FIREBASE_SERVICE_ACCOUNT` env var (single-line JSON of service account key).
3. Add `NEXT_PUBLIC_FIREBASE_*` client-side vars.
4. Add your production URL to Firebase Auth authorized domains and action URL settings.
5. Deploy Firestore security rules: `firebase deploy --only firestore:rules`
6. Deploy to Vercel or any Node.js host.

---

## Route Map

```
/                                      Campaign list (home)
/campaigns/new                         Create campaign
/campaigns/[id]                        Campaign dashboard
/campaigns/[id]/sessions/new           Log a session
/campaigns/[id]/sessions/[id]          Session detail (recap + details)
/campaigns/[id]/sessions/[id]/edit     Edit session
/campaigns/[id]/npcs                   NPC hub
/campaigns/[id]/npcs/[id]              NPC detail
/campaigns/[id]/locations              Location hub
/campaigns/[id]/locations/[id]         Location detail
/campaigns/[id]/players                Player roster
/campaigns/[id]/players/new            Add player
/campaigns/[id]/players/[id]           Player detail (character session history)
/campaigns/[id]/players/[id]/edit      Edit player
/campaigns/[id]/threads/[id]           Thread detail
/campaigns/[id]/search                 Campaign-scoped search
/share/[sessionId]                     Public player recap (no login required)
/auth/login                            Sign-in page
/auth/callback                         Magic link completion
```
