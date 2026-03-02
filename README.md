# Campaign Keeper

Campaign Keeper is a lightweight campaign journal for tabletop RPGs. It helps a DM keep session notes, recap links, NPCs, players, locations, open threads, and post-session feedback in one place.

## Stack

- Next.js 16
- React 19
- Firebase Auth
- Firestore via `firebase-admin`
- Private S3 bucket for NPC and player portraits
- Tailwind + shadcn/ui primitives

## Features

- Magic-link sign-in with Firebase Auth
- Campaign dashboard with sessions, NPCs, players, locations, and open threads
- Public player recap links with rotatable/disableable share tokens
- DM-only notes and reflections kept separate from player-safe recap content
- NPC and player portraits stored in private S3 and served through authenticated app routes
- Session feedback form on shared recap pages

## Environment

Client-side Firebase config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_FIREBASE_EMULATOR=false
```

Server-side config:

```env
FIREBASE_SERVICE_ACCOUNT=
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET=
```

Optional S3 settings:

```env
AWS_SESSION_TOKEN=
S3_ENDPOINT=
S3_FORCE_PATH_STYLE=false
```

Notes:

- `FIREBASE_SERVICE_ACCOUNT` should be the full service account JSON compressed into a single line.
- Portrait uploads are written server-side to S3 and then served back through app routes, so the bucket should stay private.
- `DISABLE_AUTH=true` is only honored outside production and is meant for local development only.

Use [`/Users/johnmunn/Documents/projects/dm-session-manager/.env.example`](/Users/johnmunn/Documents/projects/dm-session-manager/.env.example) as the starting template.

## Local Development

Install dependencies:

```bash
npm install
```

Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test
```

`npm run test` uses `bun test`, so Bun needs to be installed if you want to run the test suite.

## Storage

Portraits are stored under private S3 object keys like:

- `portraits/player/<playerId>/<uuid>.jpg`
- `portraits/npc/<npcId>/<uuid>.jpg`

Recommended bucket setup:

- block all public access
- bucket owner enforced
- default encryption enabled
- IAM limited to `s3:GetObject`, `s3:PutObject`, and `s3:DeleteObject` on `portraits/*`

## Deploy Notes

Before deploying:

1. Set all production env vars.
2. Make sure `DISABLE_AUTH` is unset.
3. Verify Firebase Auth and Firestore access are working in the deployed environment.
4. Verify portrait upload, replacement, and deletion against your S3 bucket.
5. Smoke-test public recap links, link rotation/disable, and the feedback form.

## Weekend Scope

This project was built as a weekend challenge piece. The current implementation is intended to be solid and demoable, not fully production-hardened. The main follow-on improvements would be image normalization/moderation, stronger public-form abuse controls, and broader automated test coverage.
