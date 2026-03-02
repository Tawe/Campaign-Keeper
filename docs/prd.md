DM’s Ledger – Spec Doc (v0.1)

Summary

DM’s Ledger is a lightweight session-memory app for tabletop RPG groups. It helps a DM capture what matters in 2–3 minutes after a session, then generates:
	•	a player-safe recap
	•	a DM-only “truth + hooks” view
	•	a simple list of open threads and NPCs mentioned

The product goal is continuity without homework.

⸻

Goals
	•	Reduce “what happened last time?” friction.
	•	Keep campaign continuity even with irregular schedules.
	•	Make it easy to share a clean recap with players while keeping secrets private.
	•	Keep scope small enough to build in a weekend.

Non-Goals
	•	Full wiki / worldbuilding database
	•	Encounter building, maps, initiative tracking
	•	Rules automation (5e, PF2e, etc.)
	•	Deep character sheet integration

⸻

Target Users

Primary
	•	DMs running recurring campaigns who need fast session notes + recap generation.

Secondary
	•	Players who want a consistent recap and reminder of NPCs / threads.

⸻

Core Concepts & Definitions
	•	Campaign: A single ongoing game with a title and participants.
	•	Session: A dated log entry for one play session.
	•	Public vs Private: Each note can be marked Player-visible (public) or DM-only (private).
	•	Entity: Optional structured items mentioned in sessions:
	•	NPC
	•	Location
	•	Faction
	•	Quest/Thread (open loop)

⸻

MVP Feature Set (Weekend Build)

1) Campaign Setup
	•	Create campaign: name, optional system tag (e.g., 5e), optional cover color/icon.
	•	Add participants (names only, optional).

Acceptance criteria
	•	Can create and open a campaign from a list.
	•	Campaign persists (local-first or backend).

2) Session Capture (Fast)

A “Post-session” screen optimized for speed:
	•	Session date (default today)
	•	Title (optional, e.g., “The Black Road Ambush”)
	•	Highlights (public): 3 bullet slots (add more if needed)
	•	DM Notes (private): freeform text
	•	Open Threads:
	•	add one-liners (e.g., “Who hired the assassin?”)
	•	status: Open / Resolved
	•	NPC Mentions:
	•	quick add: name + tag (ally/enemy/unknown) + note (optional)

Acceptance criteria
	•	DM can create a session in under 2 minutes.
	•	Notes can be saved without filling every field.
	•	Public and private content are clearly separated in UI.

3) Recap Generator (Simple Rules-Based)

Generate two outputs from the session:
	•	Player Recap: public highlights + public threads + public NPC mentions
	•	DM Recap: everything + a “DM-only hooks” section

No AI required for MVP—just deterministic formatting.

Acceptance criteria
	•	“Copy recap” button for each view.
	•	Player recap never includes DM-only notes.

4) Campaign Dashboard

A campaign home with:
	•	Latest session recap
	•	List of sessions (reverse chronological)
	•	Open Threads list (across sessions)
	•	NPC index (unique NPCs with last-mentioned date)

Acceptance criteria
	•	Threads aggregate across sessions.
	•	NPC list shows last mention.

5) Export / Share (MVP)
	•	Copy to clipboard (Markdown)
	•	Optional: “Print view” (CSS print styles)

Acceptance criteria
	•	Player recap exports cleanly to Discord/Slack.
	•	Print view fits 1–2 pages.

⸻

“Should-Have” Enhancements (If Time Allows)
	•	Tagging: session tags (travel, combat, politics)
	•	Search: quick search across sessions/NPCs/threads
	•	Pinned canon: a short campaign “truths so far” section
	•	Attachments: link fields (handouts, images, maps URLs)
	•	Player view link: read-only page (if backend exists)

⸻

UX Requirements

Design Principles
	•	Frictionless capture > completeness
	•	Public/private separation must be obvious
	•	Readable output is the product (the recap is what gets shared)

Key Screens
	1.	Campaign List
	2.	Campaign Dashboard
	3.	New Session (fast form)
	4.	Session Detail (tabs: Player / DM)
	5.	NPC Detail (mentions over time)
	6.	Thread Detail (history + resolve)

⸻

Data Model (Backend-agnostic)

Campaign
	•	id
	•	name
	•	system (optional)
	•	participants: string[]
	•	createdAt, updatedAt

Session
	•	id
	•	campaignId
	•	date
	•	title (optional)
	•	publicHighlights: string[]
	•	privateNotes: string
	•	createdAt, updatedAt

Thread (Quest/Hook)
	•	id
	•	campaignId
	•	sessionId (origin)
	•	text
	•	visibility: public|private
	•	status: open|resolved
	•	resolvedAt (optional)

NPC
	•	id
	•	campaignId
	•	name
	•	disposition: ally|enemy|neutral|unknown (optional)
	•	notes (optional)

NPCMention
	•	id
	•	npcId
	•	sessionId
	•	visibility: public|private
	•	note (optional)

⸻

Permissions & Privacy

MVP assumption

Single DM user (no auth) OR single device local-first.

Rules
	•	Player recap must only include:
	•	publicHighlights
	•	public threads
	•	public NPC mentions
	•	DM view includes everything.

⸻

Technical Approach (Two Options)

Option A: Local-first (fastest weekend build)
	•	Next.js + IndexedDB (via Dexie) or LocalStorage (if small)
	•	Export via clipboard + print CSS

Pros: no auth, no deployment complexity
Cons: no sharing link across devices

Option B: Hosted (still weekend-feasible)
	•	Next.js + Supabase (Postgres)
	•	Simple email magic link auth (optional)
	•	Public “player recap” share links per session (optional)

Pros: shareable, durable
Cons: auth + data security overhead

⸻

Success Metrics (Simple)
	•	Time to log a session: < 2 minutes
	•	DM can produce a shareable recap in < 10 seconds
	•	Campaign dashboard shows open threads clearly
	•	Zero incidents of private notes appearing in player recap

⸻

Out of Scope (Future Ideas)
	•	AI rewrite / “recap in your voice”
	•	Timeline view
	•	Integrations: Discord bot, Obsidian sync
	•	Multi-DM collaboration and per-player permissions
	•	Full entity graph + relationship mapping

⸻

Build Plan (Weekend-Friendly)

Day 1
	•	Data model + storage
	•	Campaign creation + dashboard skeleton
	•	New session form + save

Day 2
	•	Session detail + recap formatting
	•	Thread/NPC aggregation
	•	Export + print view polish



