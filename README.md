# 🔐 Cryptography Hunt

> A real-time competitive cipher-cracking platform with live leaderboards, anti-cheat tab-switch detection, and a hacker-themed UI.

**[Live Demo →](https://cryptography-kits.vercel.app)**

---

## What is this?

Cryptography Hunt is a timed competition platform where teams race to decrypt cipher challenges — Caesar, Vigenère, Affine, Playfair, Polybius, Morse, Grille, and C code output analysis. Think capture-the-flag, but for classical cryptography.

Teams register, get approved by an admin, and then compete across multiple rounds with answer-chained questions (each answer unlocks the next). Scores update live across all connected clients via WebSockets. Switch tabs and the anti-cheat system catches you — 3 violations and you're locked out.

### Key Features

- **8 cipher types** — text-based and image-based challenges (Grille cipher uses overlay patterns)
- **Real-time leaderboard** — Socket.io pushes score updates to all clients instantly
- **Anti-cheat system** — `visibilitychange` API detects tab switches; 3 strikes = lockout
- **Admin dashboard** — round control, question CRUD, team approval, live monitoring, CSV export
- **Answer chaining** — each question's answer connects to the next in a chain
- **Bomb timer** — per-round countdown with auto-submission

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, React Router 7, Framer Motion, Tailwind CSS 3 |
| **Backend** | Node.js, Express 4, Socket.io 4 |
| **Database** | MongoDB Atlas (Mongoose 8 ODM) |
| **Auth** | JWT (jsonwebtoken) with 8h expiry, bcryptjs password hashing |
| **Media** | Cloudinary (image-based cipher challenges) |
| **Security** | Helmet, express-rate-limit, express-mongo-sanitize, HPP |
| **Logging** | Winston, Morgan |
| **Deployment** | Vercel (frontend), Render (backend) |

## Architecture

```
client/ (React SPA)          server/ (Express API)
┌─────────────────┐          ┌──────────────────────┐
│  AuthContext     │◄──JWT──►│  authMiddleware       │
│  SocketContext   │◄──WS───►│  socketHandler        │
│  useAntiCheat    │──emit──►│  ViolationLog model   │
│  Pages/          │         │  Routes: auth, team,  │
│    Dashboard     │         │    admin, leaderboard, │
│    Leaderboard   │         │    questionManager     │
│    Admin/*       │         │  Models: Team, Round,  │
└─────────────────┘         │    Question, Admin     │
                            └──────────┬─────────────┘
                                       │
                              MongoDB Atlas + Cloudinary
```

## Getting Started

### Prerequisites

- Node.js ≥ 18
- MongoDB Atlas cluster (or local MongoDB)
- Cloudinary account (for image-based challenges)

### 1. Clone

```bash
git clone https://github.com/sandeep-9654/crypto.git
cd crypto
```

### 2. Backend Setup

```bash
cd server
npm install
```

Create `server/.env` from the example:

```bash
cp .env.example .env
```

Fill in your values:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/cryptohunt_db
JWT_SECRET=<64+ char random string>
JWT_EXPIRES_IN=8h
CLIENT_URL=http://localhost:3000
CLOUDINARY_CLOUD_NAME=<your_cloud_name>
CLOUDINARY_API_KEY=<your_api_key>
CLOUDINARY_API_SECRET=<your_api_secret>
ADMIN_SETUP_KEY=<your_admin_key>
QMGR_ROUTE_TOKEN=<your_qmgr_token>
API_QM_PREFIX=v2/sys/qm
```

Seed the database with admin account and sample rounds:

```bash
npm run seed
```

> Default admin: `admin` / `admin@crypto2025` — **change this in production**.

Start the server:

```bash
npm run dev   # runs on port 5000
```

### 3. Frontend Setup

```bash
cd client
npm install
```

The API base URL is configured in `src/utils/api.js`. For local development, it defaults to `http://localhost:5000/api`.

```bash
npm start   # runs on port 3000
```

### 4. Access

| URL | What |
|---|---|
| `http://localhost:3000` | Team portal (register → login → compete) |
| `http://localhost:3000/admin/login` | Admin dashboard |
| `http://localhost:3000/leaderboard` | Public leaderboard |

## Deployment

- **Frontend** → [Vercel](https://vercel.com): Set Root Directory to `client/`, framework to Create React App
- **Backend** → [Render](https://render.com): Uses the included `render.yaml` blueprint. Set env vars in the Render dashboard.

## Project Structure

```
crypto/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/      # Reusable UI (MatrixRain, GlitchText, BombTimer, etc.)
│   │   ├── context/         # AuthContext, SocketContext
│   │   ├── guards/          # Route guards (AdminRoute, TeamRoute)
│   │   ├── hooks/           # useAntiCheat, useSocket, useQuestionManager
│   │   ├── pages/           # Dashboard, Landing, Register, Login, admin/*
│   │   └── utils/           # Axios API client
│   └── vercel.json          # Vercel deployment config
├── server/                  # Express backend
│   ├── config/              # App configuration
│   ├── controllers/         # Route handlers
│   ├── middleware/           # Auth, rate limiting, sanitization
│   ├── models/              # Mongoose schemas
│   ├── routes/              # Express routers
│   ├── socket/              # Socket.io event handlers
│   ├── utils/               # Cloudinary, CSV export, logger
│   ├── seed.js              # Database seeder
│   └── server.js            # Entry point
└── render.yaml              # Render deployment blueprint
```

## License

MIT
