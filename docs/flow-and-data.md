# DM Session Manager — Flow & Data

Diagrams are in **Mermaid (`.mermaid`)** files in this folder. Open them in Mermaid Live Editor, VS Code with a Mermaid extension, or any tool that supports `.mermaid` files.

| Diagram | File |
|--------|------|
| Application flow (user journey) | [application-flow.mermaid](./application-flow.mermaid) |
| Data flow (high level) | [data-flow-high-level.mermaid](./data-flow-high-level.mermaid) |
| Data flow (Firestore collections) | [data-flow-firestore.mermaid](./data-flow-firestore.mermaid) |
| Server read path | [server-read-path.mermaid](./server-read-path.mermaid) |
| Server write path (Server Action) | [server-write-path.mermaid](./server-write-path.mermaid) |
| Auth flow (magic link → session cookie → join) | [auth-flow.mermaid](./auth-flow.mermaid) |

---

## Summary

| Layer | Responsibility |
|-------|----------------|
| **Middleware** | Protects `/campaigns`, `/app`, and `/player`; redirects to `/login` if no session cookie. `/join` is public. |
| **getSessionUser()** | Reads session cookie, verifies via Admin Auth; used in Server Components and Server Actions. |
| **Server Actions** | requireUser → requireOwnedCampaign (DM writes) or token validation (joinCampaign). |
| **Server Components** | getSessionUser → adminDb() → Firestore reads → render. DM sees full data; player views omit `privateNotes`. |
| **Access control** | DM: `userId == user.uid`. Player: `uid in campaign.playerUserIds` (enforced in Firestore rules via `isPlayerInCampaign()`). |
| **Invite flow** | DM copies `/join/[campaignId]?token=[inviteToken]`. Player signs in, `joinCampaign()` creates a `players` doc and appends `uid` to `campaign.playerUserIds`. |
| **Player portal** | `/player/dashboard` shows campaigns and characters. Player-only accounts auto-redirect from `/app/dashboard`. |
| **Global DM views** | `/app/npcs`, `/app/locations`, `/app/players`, `/app/factions` show entities across all campaigns with campaign badge links. |
| **Factions** | Same dual-collection pattern as NPCs/Locations: global `factions` library + `campaign_factions` junction. Manually created (not auto-seeded from sessions). |
| **Firestore** | `campaigns` (inviteToken, playerUserIds), `sessions/threads/players/campaign_npcs/campaign_locations/campaign_factions` (by campaignId), `npc_mentions/location_visits/poll_responses` (by sessionId), `npcs/locations/factions` (global library by userId). |
| **Share flow** | Public `/share/[sessionId]` uses `shareToken` on the session doc — no auth required, public highlights only. |
