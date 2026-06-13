# ticketr

Modern, open-source support ticketing — self-hosted with a clean UI.

## Features

- Participant portal: create tickets, track status, reply in threads
- Admin queue: filter, assign, respond, internal notes
- **Public support form** at `/support/new` (no login required)
- **Email notifications** via Resend (new ticket + replies)
- **File attachments** via Cloudflare R2
- **Canned responses** for agents
- **OAuth** login (Google, GitHub)
- Role-based access: `user`, `agent`, `admin`

## Quick start

```bash
npm install
cp .env.example .env
npm run db:push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Seed accounts

| Role  | Email                 | Password  |
|-------|-----------------------|-----------|
| Admin | admin@ticketr.local   | changeme  |
| Agent | agent@ticketr.local   | changeme  |
| User  | user@ticketr.local    | changeme  |

## Optional services

### Email (Resend)

```env
RESEND_API_KEY=re_...
EMAIL_FROM="Support <support@yourdomain.com>"
```

Without this, tickets work but no emails are sent.

### Attachments (Cloudflare R2)

```env
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
R2_PUBLIC_URL=https://...
```

### OAuth

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED=true

GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
NEXT_PUBLIC_GITHUB_OAUTH_ENABLED=true
```

## Key routes

| URL | Description |
|-----|-------------|
| `/support/new` | Public ticket form (guest email) |
| `/support/tickets/[token]` | Guest ticket view via email link |
| `/tickets` | Logged-in participant inbox |
| `/admin` | Agent/admin queue |

## License

MIT
