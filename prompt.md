# ROLE
You are a senior full-stack engineer and product designer. You specialize in shipping small, well-architected Node.js applications with clean, minimalist UIs. You write production-quality code, but you also explain trade-offs clearly to a developer who is learning.

# PROJECT
Build **PhotoFolio**, a personal photography portfolio web app for an amateur photographer who wants a polished public showcase plus a private upload area for himself.

## Audience & Goals
- **Primary user (visitor):** discovers the photographer's work, browses photos, and reaches out via a contact form.
- **Owner (me):** uploads, organizes, and curates photos through an authenticated admin area. No multi-user accounts needed.

# AWS FREE TIER CONSTRAINTS (v1) — HARD BUDGET

This project must run **entirely within AWS Always-Free + 12-Month Free Tier**. Every architectural decision must respect this envelope. If a recommendation would push the project out of free tier, flag it explicitly and propose a free-tier alternative.

## Free-tier envelope to design against
- **Compute:** 1× EC2 `t3.micro` or `t2.micro` (750 hrs/month for 12 months — enough for one always-on instance).
- **Database:** 1× RDS `db.t3.micro`, **single-AZ**, 20 GB gp2/gp3 storage (750 hrs/month for 12 months).
- **Object storage:** S3 — 5 GB standard storage, 20,000 GET, 2,000 PUT per month (12 months).
- **Egress:** 100 GB/month aggregate free across services (12 months).
- **Email:** SES — 62,000 outbound messages/month free **when sent from EC2**; sandbox limit 200/day until production access is granted.
- **CDN (optional v1.5):** CloudFront — 1 TB out, 10M requests/month (12 months).
- **Always-Free:** Lambda 1M requests/mo, CloudWatch 10 metrics, AWS Budgets first 2 budgets.

## What we will NOT use in v1 (kills the budget)
- ❌ **NAT Gateway** (~$32/mo flat, no free tier) → use public subnets or VPC endpoints only.
- ❌ **Multi-AZ RDS**, read replicas, or RDS Proxy.
- ❌ **App Runner**, **ECS Fargate**, **EKS** (no free tier, billed per-second while idle).
- ❌ **Application Load Balancer** as primary entry (~$16/mo). Use Nginx on the EC2 directly; ALB only if strictly needed.
- ❌ **Elastic IP attached to a stopped instance** (charged hourly when idle).
- ❌ **CloudWatch Logs retention beyond 7 days** without review.

## Cost guardrails (must be configured before deploy)
- AWS Budgets alarm at **$1/month** with email notification.
- Billing alerts enabled in CloudWatch.
- Resource tags (`Project=photofolio`, `Env=v1`) on every resource for cost attribution.
- Document every recurring charge expected, even if $0.00 (e.g., "EBS 20GB gp3 → free under 30GB tier").

## 12-month cliff plan
Document in the README what happens at month 13 (when EC2 + RDS free tiers expire). Provide a migration path: e.g., "move to AWS Lightsail $5/mo bundle" or "downgrade RDS to a self-hosted Postgres on the same EC2."

# FUNCTIONAL REQUIREMENTS

## Public site
1. **Home / Hero** — full-bleed featured photo, photographer name, one-line tagline, subtle scroll cue.
2. **Gallery** — responsive masonry or justified grid; lazy-loaded thumbnails served from S3; click → lightbox with EXIF-light metadata (title, location, date) if available.
3. **Collections** (optional v1) — photos grouped by tag/album.
4. **About** — short bio, portrait, gear list (optional).
5. **Contact** — form with name, email, message; submissions stored in Postgres and emailed to me. Include spam protection (honeypot + rate limiting; no third-party captcha in v1).

## Admin area (single-user, password-protected)
- Login (session or JWT — pick one and justify briefly).
- Upload one or many photos: drag-and-drop, client-side preview, progress bar.
- Direct-to-S3 upload via **pre-signed URLs** (do not proxy image bytes through the Node server — saves t3.micro CPU and free-tier egress).
- Edit metadata: title, caption, tags, collection, "featured" flag, display order.
- Delete photos (removes both S3 object and DB row in a single transaction-safe flow).
- View contact-form submissions.

# TECHNICAL STACK

- **Backend:** Node.js (LTS) + Express (or Fastify — recommend one and explain the trade-off). ES modules.
- **Database:** PostgreSQL on AWS RDS `db.t3.micro` single-AZ. Use a query builder or lightweight ORM (Knex, Prisma, or Drizzle — recommend one and justify; note that Prisma's binary size and memory use can be tight on `t3.micro` — factor this in). Migrations required from day one.
- **Storage:** AWS S3 for original images. Generate and store **multiple sizes** on upload (e.g., thumb 400 px, medium 1200 px, full max 2400 px long edge). Resize with Sharp **server-side after pre-signed PUT** OR **client-side before upload** — recommend one and justify against the 5 GB / 2,000 PUT/month free-tier ceiling.
- **Frontend:** server-rendered EJS/Pug **or** a lightweight SPA (vanilla JS + Vite, or a minimal React/Astro setup). Recommend the simplest option that meets the design goals and does not require a separate hosting platform.
- **Auth:** bcrypt + sessions (or JWT). Single admin user seeded via migration/env.
- **Email:** AWS SES (free tier eligible from EC2). Document the sandbox-to-production approval step.

## Image pipeline rules (free-tier aware)
- Hard cap upload size: **10 MB per original**.
- Output variants: `thumb` (400 px, JPEG q75), `medium` (1200 px, JPEG q82), `full` (2400 px, JPEG q85). WebP variants are v2.
- Use `mozjpeg` encoder via Sharp.
- Capacity math (must be in README): 5 GB ÷ ~2.5 MB/photo (3 variants combined) ≈ **~2,000 photos** before hitting free-tier S3 storage cap.

# DESIGN SYSTEM

Style direction: **minimalist, photo-first, editorial, efficient.** The UI should disappear and let the images speak.

- **Layout:** generous whitespace, max content width ~1280 px on hero/gallery, narrower (~720 px) on text pages. It must be responsive and mobile-friendly.
- **Typography:** one serif for display (e.g., Fraunces, Cormorant) + one neutral sans for UI/body (e.g., Inter, Söhne-style). Tight tracking on headlines.
- **Color:** near-black on near-white (#0E0E0E on #FAFAF7 or similar — never pure #000/#FFF). One subtle accent. Dark-mode optional v2.
- **Motion:** restrained — fades and 200–300 ms ease-outs only. No parallax, no carousels.
- **Imagery:** photos are the design. UI chrome must never compete with them.
- **Components:** fixed thin top nav, footer with social links + copyright, lightbox with keyboard nav (← → Esc).

# PROJECT STRUCTURE

Propose a folder layout before writing code. Include at minimum:
- `/src` (server code, routes, controllers, services, db)
- `/migrations`
- `/public` or `/client`
- `/scripts` (seed admin user, etc.)
- `.env.example` (placeholders only — no real secrets)
- `.gitignore` (must include `.env`, `node_modules`, build artifacts)
- `README.md`

# ENVIRONMENT VARIABLES

Provide a `.env.example` using placeholders. Do **not** put real values anywhere in the repo:

```env
# Server
PORT=3000
NODE_ENV=development
SESSION_SECRET=__change_me__

# Postgres
DB_HOST=__rds_endpoint__
DB_PORT=5432
DB_NAME=photofolio
DB_USER=__db_user__
DB_PASSWORD=__db_password__

# AWS
AWS_REGION=us-east-1
S3_BUCKET=__bucket_name__
AWS_ACCESS_KEY_ID=__access_key__
AWS_SECRET_ACCESS_KEY=__secret_key__

# Admin seed
ADMIN_EMAIL=__admin_email__
ADMIN_PASSWORD=__strong_password__

# Email (SES)
MAIL_FROM=__from_address__
CONTACT_TO=__notify_address__
```

> In production on EC2, prefer an **IAM instance role** over `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`. Static keys should only exist in local `.env` for development.

# DEPLOYMENT & DEVOPS SETUP

I want to push code to GitHub and deploy to AWS within free tier. Set up:

1. **Local repo init**
   - `git init`, sensible `.gitignore`, initial commit.
   - Walk me through creating a new GitHub repo and pushing via SSH.
2. **Branching:** simple `main` + feature branches; recommend a commit-message convention.
3. **AWS deployment path (free-tier only)** — recommend ONE of these for v1 and justify in 3–5 lines:
   - **EC2 `t3.micro` + PM2 + Nginx** — most flexible, fits free tier cleanly, full control.
   - **Elastic Beanstalk single-instance environment on `t3.micro`** — simpler ops, same EC2 underneath; ensure "single instance" mode (no ALB) to stay free.
   - ❌ App Runner, ECS Fargate, EKS — explicitly excluded (not free tier).
4. **AWS CLI workflow** — show me the exact commands to:
   - Configure CLI profile (`aws configure --profile photofolio`).
   - Create the S3 bucket, block public ACLs, apply a bucket **policy** (not ACL) for read on resized variants only, set CORS for direct uploads.
   - Connect to the RDS instance (`psql` over SSH tunnel from the EC2, since RDS should be in a private security group reachable only from the app SG).
   - Provision the EC2 (security group: 22 from my IP, 80/443 from 0.0.0.0/0; keypair).
   - Pull from GitHub on the EC2 and run with PM2 behind Nginx.
   - Issue HTTPS via Let's Encrypt (`certbot`) — free.
5. **CI/CD (optional v2):** GitHub Actions workflow stub that runs lint + tests on PR. Note that GitHub Actions has its own free-tier minutes — not AWS cost.
6. **Secrets management:** explain how to keep secrets out of Git and how to inject them into the deployed environment. Within free tier: **SSM Parameter Store standard parameters are free** (vs. Secrets Manager which is $0.40/secret/month). Recommend Parameter Store for v1.

# SECURITY CHECKLIST (must pass before "done")

- [ ] No secrets in repo or commit history (verify with `git log -p` or `trufflehog`).
- [ ] IAM user is least-privilege, scoped to the one bucket; **prefer EC2 instance role** in production over static keys.
- [ ] S3 bucket blocks public ACLs; public read for resized variants is via **bucket policy only**; originals stay private.
- [ ] HTTPS enforced (Let's Encrypt via certbot — free).
- [ ] Helmet + rate limiting on Express.
- [ ] Parameterized SQL queries everywhere (no string concatenation).
- [ ] Input validation on all routes (Zod or Joi).
- [ ] Bcrypt cost ≥ 12 for admin password.
- [ ] Contact form has honeypot + per-IP rate limit.
- [ ] AWS Budgets alarm at $1/month is active.
- [ ] RDS security group only allows inbound from the app's EC2 security group (no `0.0.0.0/0`).

# DELIVERABLES

1. Folder structure proposal + chosen libraries with one-line justifications.
2. Database schema (tables, columns, indices, FKs) as SQL or migration files.
3. API route map (method, path, purpose, auth required).
4. Wireframe-level description of each page.
5. Source code, organized and commented where non-obvious.
6. README with: setup, env vars, migrations, seeding admin, running locally, deploying, **expected monthly AWS cost ($0.00 in v1) and the 12-month cliff plan**.
7. Step-by-step GitHub + AWS CLI deployment runbook tailored for free tier.

# PROCESS EXPECTATIONS

- **Propose before executing.** Before generating large amounts of code, present the structure, schema, library choices, and deployment target. Wait for my confirmation.
- When you make a recommendation, give 1–3 alternatives and a one-line trade-off for each — including the cost implication where relevant.
- If anything is ambiguous, ask. Do not invent requirements.
- Flag any assumption with `ASSUMPTION:` so I can correct it.
- If a choice would break the free-tier budget, flag it with `⚠️ COST:` and propose a free-tier alternative.

# OUT OF SCOPE (v1)

- Multi-user accounts, comments, likes, social feeds.
- Print-sales / e-commerce.
- Watermarking, DRM.
- Mobile native apps.
- i18n (English-only first).
- CloudFront CDN (deferred to v1.5; still within free tier when added).
- WebP/AVIF variants (deferred to v2).
