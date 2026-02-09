# Dawayir Masafaty MVP (الرحلة — دواير)

## Overview
An Arabic-language React web application for exploring relationships and personal boundaries. Built with React 18, TypeScript, Vite, Tailwind CSS, and Zustand for state management. Features optional Gemini AI integration and Supabase backend.

## Recent Changes
- 2026-02-09: Initial Replit setup — configured Vite dev server on port 5000, set up workflow, configured static deployment.

## Project Architecture
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS v4
- **State**: Zustand
- **AI**: Optional Google Gemini integration (via dev proxy in vite.config.ts)
- **Backend**: Optional Supabase (auth, database, admin)
- **Analytics**: Vercel Analytics & Speed Insights (optional)
- **PWA**: Service worker via vite-plugin-pwa

## Key Files
- `vite.config.ts` — Vite config with Gemini dev proxy middleware
- `src/App.tsx` — Main app component
- `src/main.tsx` — Entry point
- `index.html` — HTML template (RTL, Arabic)
- `.env.local.example` — Environment variable reference

## Environment Variables
All optional:
- `GEMINI_API_KEY` — Google Gemini AI key (server-side, used by dev proxy)
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — Supabase connection
- `VITE_GA_MEASUREMENT_ID` — Google Analytics

## Running
- Dev: `npm run dev` (port 5000)
- Build: `npm run build` (output to `dist/`)
- Deployment: Static site from `dist/`
