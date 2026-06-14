# ticketr

Modern, open-source support ticketing — self-hosted with a clean UI.

## Features

- Participant portal: create tickets, track status, reply in threads
- Admin queue: filter, assign, respond, internal notes
- **Public support form** at `/support/new` (no login required)
- **Email notifications** via ZeptoMail (new ticket + replies)
- **File attachments** via Cloudflare R2
- **Canned responses** for agents
- **OAuth** login (Google, GitHub)
- Role-based access: `user`, `agent`, `admin`

## Quick start

### Docker (recommended)

```bash
cp .env.example .env
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000). The database is seeded on first run.

### Local development

Requires PostgreSQL. Start only the database with Docker:

```bash
docker compose up postgres -d
cp .env.example .env
# Set DATABASE_URL=postgresql://ticketr:ticketr@localhost:5432/ticketr
npm install
npm run db:push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

See **[deploy/vercel.md](deploy/vercel.md)** for production setup on `ticketr.ideahackathon.com` (Azure Postgres, ZeptoMail, shared R2 with iDEA).

## Deploy to Azure (containers)

See **[deploy/azure.md](deploy/azure.md)** for Container Apps + PostgreSQL + ACR step-by-step instructions.

## Seed accounts

| Role  | Email                 | Password  |
|-------|-----------------------|-----------|
| Admin | admin@ticketr.local   | changeme  |
| Agent | agent@ticketr.local   | changeme  |
| User  | user@ticketr.local    | changeme  |

## Optional services

### Email (ZeptoMail)

```env
ZEPTO_API_KEY=your_send_mail_token
ZEPTO_FROM_ADDRESS=support@yourdomain.com
# India data center (optional; default is api.zeptomail.com)
ZEPTO_API_URL=https://api.zeptomail.in/v1.1/email
```

Without this, tickets work but no emails are sent.

Email HTML templates live in `emails/` and are rendered via `lib/email-templates.ts`.

| Template | Trigger |
|----------|---------|
| `ticket-created` | New ticket submitted |
| `ticket-reply` | New message on a thread |
| `staff-new-ticket` | New ticket (staff notification) |
| `ticket-in-progress` | Status → in progress |
| `ticket-waiting-on-user` | Status → waiting on user (follow-up) |
| `ticket-resolved` | Status → resolved |
| `ticket-closed` | Status → closed |
| `ticket-reopened` | Status → open from resolved/closed |
| `ticket-assigned` | Agent assigned (customer) |
| `ticket-priority-changed` | Priority updated (customer) |
| `ticket-staff-assigned` | Agent assigned (staff) |
| `ticket-staff-priority` | High/urgent escalation (staff) |

Status/assignment/priority emails share `receipt-layout.html` (config in `lib/email-receipt.ts`).

Preview all templates in a browser:

```bash
npm run email:previews
```

Send a test email:

```bash
npm run email:test -- ticket-created you@example.com
npm run email:test -- ticket-reply you@example.com
npm run email:test -- ticket-waiting-on-user you@example.com
```

Check email status: `GET /api/health` returns `"email": "configured"` or `"disabled"`.

Email failures are logged but **do not block** ticket creation, replies, or status updates.

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
