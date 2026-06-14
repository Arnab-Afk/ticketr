# Deploy ticketr on Vercel

Production URL: **https://ticketr.ideahackathon.com**

## 1. Database (Azure PostgreSQL)

A separate database **`ticketr`** exists on the same server as `idea_hackathon`:

```text
Host: ideahackathon.postgres.database.azure.com
Database: ticketr
User: idea_hackathon
SSL: require
```

**Vercel env var** (encode `@` in password as `%40`):

```env
DATABASE_URL=postgresql://idea_hackathon:YOUR_PASSWORD@ideahackathon.postgres.database.azure.com:5432/ticketr?sslmode=require
```

Schema is applied via Prisma. After first deploy, seed once from your machine:

```bash
DATABASE_URL="postgresql://..." npx prisma db seed
```

### Azure firewall

Allow Vercel to reach Postgres:

- Azure Portal → PostgreSQL server → **Networking**
- Enable **Allow public access**
- Add rule for Vercel egress IPs, or temporarily `0.0.0.0`–`255.255.255.255` for hackathon (tighten later)

---

## 2. Vercel project setup

1. Import the **ticketr** repo (root directory = repo root, not `idea2.0/ticketr` if split)
2. Framework: **Next.js** (auto-detected)
3. Build command: `npm run build` (default)
4. Install command: `npm install` (runs `postinstall` → `prisma generate`)

### Custom domain

Vercel → Settings → Domains → add `ticketr.ideahackathon.com`

---

## 3. Environment variables (Vercel → Settings → Environment Variables)

### Required

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | `postgresql://idea_hackathon:...@ideahackathon.postgres.database.azure.com:5432/ticketr?sslmode=require` |
| `AUTH_SECRET` | Random 32+ chars (`openssl rand -base64 32`) |
| `AUTH_URL` | `https://ticketr.ideahackathon.com` |
| `NEXT_PUBLIC_APP_URL` | `https://ticketr.ideahackathon.com` |
| `ZEPTO_API_KEY` | ZeptoMail send token |
| `ZEPTO_FROM_ADDRESS` | `ticketr@ideahackathon.com` |
| `ZEPTO_FROM_NAME` | `ticketr` |

### R2 attachments (same bucket as iDEA hackathon site)

Copy the **same values** from your iDEA Vercel project:

| Variable | Notes |
|----------|--------|
| `R2_ACCOUNT_ID` | Same as idea |
| `R2_ACCESS_KEY_ID` | Same as idea |
| `R2_SECRET_ACCESS_KEY` | Same as idea |
| `R2_BUCKET_NAME` | Same as idea |
| `R2_PUBLIC_URL` | Same CDN/public URL as idea |
| `R2_KEY_PREFIX` | `ticketr/attachments` (default — keeps files separate from `avatars/`) |

### Optional

| Variable | Value |
|----------|--------|
| `TICKETR_NAME` | `ticketr` |
| `ZEPTO_API_URL` | Only if using India DC |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth |
| `NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED` | `true` |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | OAuth |
| `NEXT_PUBLIC_GITHUB_OAUTH_ENABLED` | `true` |

---

## 4. iDEA site integration

On **ideahackathon.com** (idea repo), set:

```env
TICKETR_URL=https://ticketr.ideahackathon.com
NEXT_PUBLIC_TICKETR_URL=https://ticketr.ideahackathon.com
```

The floating widget proxies ticket creation to ticketr.

---

## 5. Deploy checklist

- [ ] All env vars set on Vercel (Production)
- [ ] Custom domain + SSL active
- [ ] Azure Postgres firewall allows Vercel
- [ ] `npx prisma db seed` run once against production DB
- [ ] Test: create ticket on ticketr + via idea widget
- [ ] Test: email receipt (ZeptoMail)
- [ ] Test: file attachment upload (R2)

---

## 6. Demo accounts (after seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@ticketr.local | changeme |
| Agent | agent@ticketr.local | changeme |
| User | user@ticketr.local | changeme |

Change passwords after hackathon if needed.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails on Prisma | Ensure `postinstall` runs; check `DATABASE_URL` is set for Production |
| DB connection timeout | Azure firewall / SSL `?sslmode=require` |
| Login redirect loop | `AUTH_URL` must match domain exactly |
| Emails not sent | Verify Zepto domain + `ticketr@ideahackathon.com` |
| Upload 503 | Set all `R2_*` vars; same bucket as idea is fine |
| Widget "Support unavailable" on idea | `TICKETR_URL` + ticketr deployed and reachable |
