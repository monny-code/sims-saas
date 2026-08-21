# SIMS

A production-style School Information Management System starter built with React + TypeScript on the frontend and Express + TypeScript on the backend. The project is now structured around Supabase-first data access while staying easy to run locally in demo mode.

## Features

- Responsive SaaS-style dashboard
- Authentication with JWT and RBAC hooks
- Multi-tenant aware backend structure
- Landing page for public marketing site
- Mock payment and notification abstractions for development
- Supabase-ready data layer with graceful demo fallback
- Modular project structure for future phase-based feature growth

## Stack

- Frontend: React, Vite, TypeScript, Tailwind CSS, React Router, TanStack Query, Recharts
- Backend: Node.js, Express, TypeScript, Zod, JWT, Helmet, CORS, rate limiting
- Database: Supabase Postgres
- Local fallback: in-memory demo data when Supabase is not configured

## Quick start

1. Install dependencies:
   npm install
2. Copy the backend env file:
   cp .env.example .env
3. Copy the frontend env file:
   cp frontend/.env.example frontend/.env
4. Add your Supabase project values to the `.env` and `frontend/.env` files.
5. Start the project:
   npm run dev
6. Open the frontend at http://localhost:5173

## Netlify + Render + Supabase deployment

This project is prepared for a three-part deployment:

- Frontend: Netlify
- Backend: Render
- Database: Supabase

### Netlify frontend setup

1. Import the repo into Netlify.
2. Set the build command to:
   npm install && npm run build --workspace frontend
3. Set the publish directory to:
   frontend/dist
4. Add environment variables in Netlify:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_BASE_URL=https://your-render-backend-url.onrender.com/api/v1`

### Render backend setup

1. Import the repo into Render.
2. Use the included `render.yaml` config as the starting point.
3. Set environment variables:
   - `PORT=10000`
   - `JWT_SECRET`
   - `CORS_ORIGIN=https://your-netlify-app.netlify.app`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_JWKS_URL`
4. Start the service.

### Supabase setup

1. Create the schema from `supabase/schema.sql` in the Supabase SQL editor.
2. Keep the app in `Supabase-first` mode by setting both the frontend and backend env values.

## Supabase setup

To connect the app to a live Supabase project:

1. Create a Supabase project.
2. Copy the project URL and service keys from the Supabase dashboard.
3. Add these to the backend `.env` file:
   - `SUPABASE_URL=https://your-project.supabase.co`
   - `SUPABASE_ANON_KEY=your-anon-key`
   - `SUPABASE_SERVICE_ROLE_KEY=your-service-role-key`
4. Add these to `frontend/.env`:
   - `VITE_SUPABASE_URL=https://your-project.supabase.co`
   - `VITE_SUPABASE_ANON_KEY=your-anon-key`
5. Open the Supabase SQL editor and run the schema defined in `supabase/schema.sql`.
6. Restart the app.

The app will automatically use Supabase when credentials are present; otherwise it falls back to the local demo data so development stays stable.

## Project structure

- `backend/` — Express API and business logic
- `frontend/` — React UI
- `docker-compose.yml` — local infra wrapper

## Default demo login

The backend seeds a development user for testing:

- Email: `admin@example.com`
- Password: `Password123!`

Remember to change credentials before production use.

## Environment variables

See `.env.example` and `frontend/.env.example` for the required keys.

## Notes

This starter focuses on the foundation and architecture required by the specification. Additional domain modules can be added progressively as the project evolves.
