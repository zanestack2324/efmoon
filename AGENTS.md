# EF MOON — Project Settings

## Project
- **Name**: EF MOON — The Moonite Era
- **Domain**: https://ef-moon.vercel.app
- **Git Root**: C:\Users\Windows\Desktop\WEBSITES\EF MOON
- **Type**: Static site with admin backend

## Tech Stack
- **Frontend**: Vanilla HTML/CSS/JS (single-page, all inline in index.html)
- **Animations**: GSAP 3.12.5 + ScrollTrigger (CDN)
- **Fonts**: Anton, Bebas Neue, Lato (Google Fonts, non-blocking load)
- **Backend**: Node.js + Express (for local dev + Vercel serverless functions)
- **Database**: JSON files (local) / Vercel KV (production) via storage adapter
- **Auth**: JWT (jsonwebtoken) + bcryptjs
- **File Uploads**: Local /uploads/ (dev) or Vercel Blob (production)
- **Deployment**: Vercel (static + serverless functions)

## Commands
- **Start dev server**: `npm start` (Express on port 5500)
- **Deploy production**: `vercel --prod` (from project root)

## Project Structure
```
EF MOON/
├── AGENTS.md
├── .env.example
├── index.html              # Main site (all inline)
├── privacy-policy.html
├── admin/
│   ├── index.html          # Admin login page
│   ├── dashboard.html      # Admin dashboard
│   ├── css/style.css       # Admin styles
│   └── js/app.js           # Admin JS (API calls)
├── api/
│   ├── index.js            # Vercel entry point
│   ├── auth.js             # Auth routes (login, verify)
│   ├── content.js          # Content CRUD routes
│   └── upload.js           # File upload route
├── lib/
│   └── storage.js          # Storage adapter (JSON local / KV Vercel)
├── data/                   # JSON data files (auto-created)
├── uploads/                # Uploaded files (local only)
├── server.js               # Express server (dev)
├── vercel.json             # Vercel deployment config
├── package.json            # Dependencies
└── *.png, *.mp4, *.mp3     # Static assets
```

## Production Storage Setup
To make admin data persist on Vercel:
1. Go to https://vercel.com/dashboard/stores
2. Create a **KV Store** (Redis) — Hobby plan includes 30MB free
3. Link it to the ef-moon project
4. Redeploy (KV env vars are auto-injected)
5. For file uploads, also create a **Blob Store**

The `lib/storage.js` auto-detects KV env vars and uses them. Falls back to JSON files otherwise.

## Admin Access
- **URL**: /admin/index.html
- **Default Login**: admin / moonite2026 (change after first login)
- **Manages**: Bio, Music tracks, Tour dates, Merch, File uploads, Site settings
