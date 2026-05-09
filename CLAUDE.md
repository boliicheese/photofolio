# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**PhotoFolio** — portfolio personal de Bolivar Barrios, fotógrafo en Ciudad de Panamá. Sitio público con galería + área admin privada (single-user). Spec completa en `prompt.md`.

## Owner / Content

**Bolivar Barrios** — fotógrafo, Ciudad de Panamá.

**Hero tagline:** "Fotografía desde Panamá."

**Bio (About page, hardcoded en `views/about.ejs`):**
> Hace más de siete años empecé a tomar fotos sin más plan que el de mirar mejor. Con el tiempo se volvió una práctica constante: la forma más directa que encontré de ser creativo y de devolverle atención a lo que muchas veces pasa desapercibido.
>
> Mi trabajo se mueve entre el retrato, el paisaje, la fotografía de calle, los viajes y la naturaleza. También fotografío perros con regularidad — los míos y los que se cruzan en el camino. Busco una estética minimalista y natural: poca intervención, luz disponible, encuadre limpio. Que la imagen funcione por lo que hay, no por lo que se le agrega.
>
> Trabajo principalmente con una Sony α6700, complementada con iPhone 16 Pro Max e Insta360 X4 según lo que pida la escena.
>
> Si te interesa colaborar, encargar un retrato o conversar sobre un proyecto, escríbeme. Respondo personalmente.

**CTA About → Contact:** `[contacto →](#contact)` / `/contact`

## Architecture Decisions

### Stack
- **Backend:** Node.js (LTS) + Express, ES modules
- **Database:** PostgreSQL on RDS `db.t3.micro`; **Drizzle ORM** (no native binary — critical on t3.micro RAM), drizzle-kit for migrations
- **Storage:** AWS S3; pre-signed PUT URLs (never proxy image bytes through Node)
- **Image processing:** Sharp + mozjpeg; 4 files stored per photo (see S3 layout below)
- **Frontend:** EJS (SSR, SEO-friendly) + Vite for client JS/CSS bundle
- **Auth:** bcrypt cost ≥ 12 + express-session + connect-pg-simple (sessions in Postgres, no Redis)
- **Email:** AWS SES from EC2 (free tier)
- **Deployment:** EC2 `t3.micro` + PM2 + Nginx + Let's Encrypt (certbot)

### S3 File Layout Per Photo

```
photos/{uuid}/original.jpg   ← private (IAM only); full original, up to 10 MB
photos/{uuid}/thumb.jpg      ← public read; 400px long edge, JPEG q75
photos/{uuid}/medium.jpg     ← public read; 1200px long edge, JPEG q82
photos/{uuid}/full.jpg       ← public read; 2400px long edge, JPEG q85
```

**Important:** Originals are stored permanently (owner wants max quality). This changes the capacity math:
- ~10–13 MB per photo (original + 3 variants) → **~400–500 photos** before hitting 5 GB S3 cap
- This replaces the ~2,000-photo figure in the spec (which assumed no original storage)
- Bucket policy: public read applies to `photos/*/thumb.jpg`, `photos/*/medium.jpg`, `photos/*/full.jpg` only — never `photos/*/original.jpg`

**Upload flow:**
1. `POST /api/upload/presign` → server generates photo UUID, returns `{ presignedUrl, photoId }` for `photos/{uuid}/original.jpg`
2. Browser `PUT presignedUrl` with original directly to S3 (4 PUTs/photo total: 1 original + 3 variants)
3. `POST /api/upload/complete` with `{ photoId, metadata }` → server GETs original from S3, resizes with Sharp, PUTs 3 variants, saves DB row

### AWS Free-Tier Constraints (hard limits)
- **Compute:** 1× EC2 `t3.micro` + PM2 + Nginx — no ALB, no ECS, no App Runner
- **Database:** RDS `db.t3.micro` single-AZ — no Multi-AZ, no RDS Proxy
- **Storage:** S3 5 GB / 20k GET / 2k PUT per month. With original storage: ~400–500 photos capacity
- **Banned:** NAT Gateway, ALB as primary entry, Elastic IP on stopped instance, CloudWatch logs > 7 days
- Flag anything that breaks free tier with `⚠️ COST:`

### Confirmed Decisions (Phase 1)
| Decision | Choice | Reason |
|----------|--------|--------|
| HTTP framework | Express | Larger middleware ecosystem; Fastify's speed irrelevant at portfolio scale |
| ORM | Drizzle | Zero native binary, smallest RAM footprint on t3.micro |
| Image resize | Server-side (Sharp on EC2) | Spec requires mozjpeg; browser Canvas can't guarantee it |
| Frontend | EJS + Vite | SSR = SEO + simpler deployment; Vite only for JS/CSS bundle |
| Auth | Sessions (connect-pg-simple) | Instant revocation; no Redis needed; single admin user |
| Deployment | EC2 + PM2 + Nginx | Full control, transparent config, best docs |
| Original storage | Keep permanently | Owner wants max quality available |
| Featured photo | 1 shown in hero (`WHERE featured = true ORDER BY display_order LIMIT 1`) | No carousels per spec |
| display_order | Numeric field, edited manually in admin | Drag-and-drop is v2 |
| Collections | Schema + routes from day 1, UI optional in first deploy | Low cost, high future value |
| About page | Hardcoded in `views/about.ejs` | No CMS requirement in v1 |

## Design System
- **Photo-first** — UI chrome must not compete with images
- **Typography:** Fraunces (serif display) + Inter (sans UI/body), tight tracking on headlines
- **Colors:** #0E0E0E on #FAFAF7; one subtle accent; never pure #000/#FFF
- **Motion:** 200–300 ms ease-out fades only; no parallax, no carousels
- **Layout:** max 1280px (gallery/hero), 720px (text pages); responsive + mobile-first
- **Components:** fixed thin top nav, footer (social + copyright), lightbox (← → Esc)

## Commands

```bash
npm run dev       # Start dev server (nodemon)
npm run build     # Bundle client assets (Vite)
npm run migrate   # Run Drizzle migrations
npm run seed      # Seed admin user from ADMIN_EMAIL + ADMIN_PASSWORD env vars
```

## Environment Variables

See `.env.example`. In production on EC2, use IAM instance role — omit `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` from production env.

## Out of Scope (v1)

Multi-user accounts, e-commerce, watermarking, mobile apps, i18n, CloudFront (v1.5), WebP/AVIF (v2), drag-and-drop reordering (v2).
