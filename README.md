# SaveBite — Hyperlocal Food Deals & Meal Rescue Platform

SaveBite connects local restaurants, cafes, and bakeries with customers seeking quality meals at unbeatable prices (in Indian Rupees ₹ / INR), preventing food waste and fostering sustainable neighborhood dining.

UI/UX faithfully implemented from the **Google Stitch** design system.

---

## 📁 Monorepo Architecture

```
Project/
├── package.json                 # Root monorepo workspace configuration
├── .gitignore
├── .env.example                 # Root environment template
├── client/                      # React + Vite + TypeScript Frontend
│   ├── index.html               # Plus Jakarta Sans & Inter font links
│   ├── package.json
│   ├── tailwind.config.js       # Stitch tokens (Colors, Typography, Spacing)
│   ├── vite.config.ts
│   ├── .env.example             # Client Firebase environment template
│   └── src/
│       ├── assets/              # SaveBite SVG logo
│       ├── config/              # Firebase Client SDK setup
│       ├── types/               # TypeScript interfaces (INR deals, orders, users)
│       ├── index.css            # Tailwind directives & safe-area styles
│       ├── App.tsx              # Phase 1 Verification Screen
│       └── main.tsx
└── server/                      # Node.js + Express + TypeScript Backend
    ├── package.json
    ├── tsconfig.json
    ├── .env.example             # Supabase & Firebase Admin environment template
    ├── prisma/
    │   └── schema.prisma        # Supabase PostgreSQL schema definition
    └── src/
        ├── config/              # Environment, Prisma DB, Firebase Admin, Supabase
        ├── middlewares/         # JWT verification & centralized error handler
        ├── routes/              # Express route definitions & health check
        ├── app.ts               # Express application instance
        └── server.ts            # HTTP server listener
```

---

## 🚀 Running the Project

### 1. Install Dependencies
In the root directory, run:
```bash
npm install
```
This will automatically install dependencies for both the `client` and `server` workspaces.

### 2. Configure Environment Variables
Copy `.env.example` to `.env` in both `client/` and `server/`:
```bash
# In client/
cp client/.env.example client/.env

# In server/
cp server/.env.example server/.env
```

### 3. Generate Prisma Client
```bash
npm run prisma:generate --workspace=server
```

### 4. Run Development Servers
To run both frontend and backend concurrently:
```bash
npm run dev:client
npm run dev:server
```
* **Frontend**: [http://localhost:5173](http://localhost:5173)
* **Backend API**: [http://localhost:5000](http://localhost:5000)
* **API Health Check**: [http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health)
