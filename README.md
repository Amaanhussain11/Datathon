# MERN Monorepo (Frontend & Backend)

This repository contains a minimal MERN stack with separate `Frontend/` (Vite + React) and `Backend/` (Express + Mongoose).

## Structure
- Frontend/ — Vite React app
- Backend/ — Express API server with MongoDB via Mongoose

## Prerequisites
- Node.js 18+
- npm or yarn or pnpm
- MongoDB running locally or a connection URI

## Backend Setup
```bash
cp Backend/.env.example Backend/.env
# edit Backend/.env if needed (MONGO_URI, PORT, CORS_ORIGIN, JWT_SECRET)
cd Backend && npm install
npm run dev
# Server at http://localhost:5000
```

## Frontend Setup
```bash
cp Frontend/.env.example Frontend/.env
# edit Frontend/.env if needed (VITE_API_URL)
cd Frontend && npm install
npm run dev
# App at http://localhost:5173
```

The Vite dev server proxies requests starting with `/api` to `VITE_API_URL`.

## Test the stack
- Open http://localhost:5173 to see the frontend.
- Backend health: GET http://localhost:5000/api/health
- Auth endpoints:
  - POST http://localhost:5000/api/auth/register { name, email, password }
  - POST http://localhost:5000/api/auth/login { email, password }

## Scripts
- Backend: `npm run dev` uses nodemon, `npm start` runs node.
- Frontend: `npm run dev` runs Vite, `npm run build` builds, `npm run preview` serves build.

## Notes
- Update CORS and proxy settings if ports change.
- Use `JWT_SECRET` in production and a real database connection string.
