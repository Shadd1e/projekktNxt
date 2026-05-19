# Projekkt — Environment Variables Reference
# ─────────────────────────────────────────────────────────────────────────────
# This project does NOT use .env files in production.
# Set these directly in:
#   • Vercel  → Project → Settings → Environment Variables
#   • Railway → Your service → Variables tab
#
# Variables marked [BOTH] must be set in BOTH Vercel and Railway with the
# SAME value. Variables marked [VERCEL] go only in Vercel. [RAILWAY] only Railway.
# ─────────────────────────────────────────────────────────────────────────────

# ── Database ──────────────────────────────────────────────────────────────────
# [VERCEL] Railway provides this automatically inside Railway services,
# but Vercel needs it to reach your Railway Postgres instance.
DATABASE_URL=postgresql://user:password@host.railway.app:5432/railway

# ── Auth ─────────────────────────────────────────────────────────────────────
# [VERCEL] Generate: openssl rand -hex 32
JWT_SECRET=replace_with_64_char_hex_string

# ── Brevo (email) ─────────────────────────────────────────────────────────────
# [VERCEL]
BREVO_API_KEY=xkeysib-...
FROM_EMAIL=noreply@shaddies.space
FROM_NAME=Projekkt

# ── Flutterwave ───────────────────────────────────────────────────────────────
# [VERCEL]
# Get from: dashboard.flutterwave.com → Settings → API Keys
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-...
FLUTTERWAVE_SECRET_KEY=FLWSECK-...

# [VERCEL] ← THIS ONE WAS MISSING — add it now
# Get from: dashboard.flutterwave.com → Settings → Webhooks
# Set webhook URL to: https://projekkt.shaddies.space/api/payment/webhook
# Then copy the "Secret Hash" value here.
FLUTTERWAVE_SECRET_HASH=your_flutterwave_webhook_secret_hash

# ── Python microservice ───────────────────────────────────────────────────────
# [VERCEL] Public Railway URL of the Python service
PYTHON_SERVICE_URL=https://your-python-service.up.railway.app

# [BOTH] Shared secret between Next.js (Vercel) and Python (Railway).
# Generate: openssl rand -hex 32  — use the SAME value in both.
INTERNAL_API_SECRET=replace_with_64_char_hex_string

# ── App URL ───────────────────────────────────────────────────────────────────
# [VERCEL] Your production domain (used in email links and payment redirects)
NEXT_PUBLIC_APP_URL=https://projekkt.shaddies.space

# ─────────────────────────────────────────────────────────────────────────────
# Python service (Railway) — set these in the Railway Variables tab
# ─────────────────────────────────────────────────────────────────────────────

# [RAILWAY] console.anthropic.com → API Keys
ANTHROPIC_API_KEY=sk-ant-...

# [RAILWAY] platform.deepseek.com → API Keys
DEEPSEEK_API_KEY=sk-...

# [RAILWAY] brave.com/search/api (free tier: 2,000 queries/month)
BRAVE_API_KEY=BSA...

# [RAILWAY] Same value as INTERNAL_API_SECRET above
INTERNAL_API_SECRET=replace_with_64_char_hex_string
