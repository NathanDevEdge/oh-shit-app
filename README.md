# 💩 Turd Earnings

> *Track how much you earn on the throne.*

Turd Earnings is a full-stack web app that calculates how much money you make while sitting on the toilet at work, based on your real salary. Compete with friends on a live global leaderboard, kill time with three browser minigames, and discover just how valuable your bathroom breaks really are.

**Live site:** [https://oh-shit-app.manus.space](https://oh-shit-app.manus.space)

---

## Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
- [App Pages](#app-pages)
- [Minigames](#minigames)
- [Leaderboards](#leaderboards)
- [Tech Stack](#tech-stack)
- [Local Development](#local-development)
- [Database Schema](#database-schema)
- [Project Structure](#project-structure)

---

## Features

| Feature | Description |
|---|---|
| **Email Auth** | Register and log in with email and password — no third-party sign-in required |
| **Toilet Timer** | Start a session when you sit down, stop it when you're done — earnings calculated in real time |
| **Session History** | Every session is saved to the database and shown on your Dashboard |
| **Global Leaderboard** | Compete with all users across toilet earnings and all three minigames |
| **3 Minigames** | Clog-A-Mole, Paper Toss, and Pipe Panic — all with DB-backed leaderboards |
| **Personal Best Badges** | Every game over screen shows your PB and flags when you beat it |
| **Minigames Hub** | A dedicated hub page showing all three games with your personal best on each card |
| **Persistent Timer** | The toilet timer keeps running even when you navigate to a minigame |
| **Streak Multipliers** | Clog-A-Mole rewards consecutive hits with 2x, 3x, and 4x score multipliers |
| **Profile Management** | Update your display name, salary type (hourly/yearly), and salary amount at any time |
| **Admin Dashboard** | Overview of all users and activity for the app owner |

---

## Getting Started

### 1. Register an Account

Visit the app and click the **Register** tab on the login screen. Fill in:

- **Display Name** — this is what appears on the leaderboard
- **Email Address**
- **Password** (minimum 6 characters)
- **Salary Type** — choose Hourly ($/hr) or Yearly ($/yr)
- **Amount** — your salary figure

Click **Create Account** to enter the Throne Room.

### 2. Start a Toilet Session

Navigate to the **Gotta Go** (Timer) page from the bottom navigation bar. Press **Start Session** when you sit down. The timer counts up in real time and displays your earnings as they accumulate based on your salary.

When you're done, press **Done — Save Session**. Your session is saved to the database and contributes to your leaderboard total.

> **Tip:** You can navigate away to play a minigame while the timer is running — it keeps going in the background and a live banner on every game page reminds you it's active.

### 3. Play a Minigame

While the timer is running, tap **🎮 Play a Minigame** on the Timer page to go to the Minigames Hub. Pick a game — your toilet timer keeps running in the background. Scores are saved to the leaderboard automatically when the game ends.

### 4. Check Your Stats

The **Home** (Dashboard) page shows your total lifetime earnings, total time on the throne, number of sessions, and a history of your last 10 sessions.

---

## App Pages

### Home (Dashboard)

Your personal stats hub. Displays total earnings, total time on the throne, session count, and a scrollable list of recent sessions with date, duration, and earnings per session.

### Gotta Go (Timer)

The core feature of the app. A large timer counts up from zero. Your per-second earnings rate is calculated from your salary and displayed live. A **🎮 Play a Minigame** button is available while the timer is running, linking to the Minigames Hub.

### Games (Minigames Hub)

A hub page showing all three minigames as interactive cards. Each card displays the game name, a short description, a gameplay tip, and your personal best score. Tap any card to jump straight into that game.

### Ranks (Leaderboard)

Four tabs of competitive glory:

- **Toilet Timer** — ranked by total lifetime earnings across all sessions
- **Clog-A-Mole** — ranked by personal best score
- **Paper Toss** — ranked by personal best score
- **Pipe Panic** — ranked by personal best score

### Profile

Update your display name, salary type (hourly or yearly), and salary amount. Changes take effect immediately on the timer.

### Admin Dashboard

Accessible at `/admin`. Provides the app owner with an overview of registered users and activity. Not shown in the navigation for standard users.

---

## Minigames

All three minigames are accessible from the **Games** tab in the bottom navigation or from the Timer page. The toilet timer continues running in the background while you play, and a live banner shows the current elapsed time on every game page.

Every game over screen shows:
- Your final score
- A gold **"🏆 New Personal Best!"** badge if you beat your previous best
- Your previous best score (if you didn't beat it)
- Buttons to **Play Again**, **View Leaderboard**, or **Back to Timer**

### 🪠 Clog-A-Mole

A whack-a-mole style game on a 3×3 toilet grid. Tap the poops before they disappear. Avoid the rubber ducks — hitting one costs a life. Build consecutive hit streaks to unlock score multipliers:

| Streak | Multiplier |
|--------|-----------|
| 4 hits in a row | 2x |
| 7 hits in a row | 3x |
| 10 hits in a row | 4x |

Missing a poop or hitting a duck resets the streak to 1x. The game speeds up progressively as your score climbs. You have 3 lives (shown as 🧻 icons).

### 🧻 Paper Toss

A physics-based drag-to-throw game inspired by the classic mobile game.

**How to play:**

1. Press **Start Game** to begin.
2. **Click and drag** the paper ball (or use your finger on mobile) toward the toilet at the top of the screen.
3. Release to launch. A dotted trajectory line shows your predicted path as you drag.
4. Land the ball in the toilet bowl to score a point.
5. Miss three times and the game is over.

**Wind system:** After each successful toss, the wind changes direction and strength. The wind indicator shows current conditions:

| Label | Effect |
|---|---|
| Calm | Negligible drift |
| Breezy | Slight curve |
| Windy | Noticeable push — aim to compensate |
| Stormy | Strong drift — shown in red |

Wind intensity increases progressively with your score, making higher scores genuinely harder to achieve.

### 💩 Pipe Panic

A Flappy Bird-style game set in a sewer. Tap, click, or press Space/↑ to flap your turd through an endless series of sewer pipes. The pipes get faster and spawn more frequently as your score climbs. You have 3 lives — hit a pipe and you lose one. Survive as long as possible.

---

## Leaderboards

All leaderboard data is stored in the database and shared across all users in real time. No need to be on the same device or browser — everyone competes together.

- **Toilet Timer leaderboard** aggregates total earnings across all saved sessions per user.
- **Minigame leaderboards** track each user's all-time best score per game. Only the highest score per user is shown — not every attempt.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS 4 + custom CSS variables |
| Routing | Wouter |
| API | tRPC 11 (end-to-end type-safe) |
| Backend | Express 4 + Node.js |
| Database | MySQL / TiDB via Drizzle ORM |
| Auth | Custom email/password with JWT session cookies (bcryptjs + jose) |
| UI Components | shadcn/ui, Radix UI, Lucide React |
| Minigame Rendering | HTML5 Canvas API |
| Testing | Vitest (12 tests) |
| Hosting | Manus (full-stack, persistent) |

---

## Local Development

### Prerequisites

- Node.js 22+
- pnpm 10+
- A MySQL or TiDB database

### Setup

```bash
# Clone the repository
git clone https://github.com/NathanDevEdge/oh-shit-app.git
cd oh-shit-app

# Install dependencies
pnpm install

# Set up environment variables
# You need: DATABASE_URL, JWT_SECRET
# See .env.example or the Manus Secrets panel for reference

# Push the database schema
pnpm db:push

# Start the development server
pnpm dev
```

The app will be available at `http://localhost:3000`.

### Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start the development server with hot reload |
| `pnpm build` | Build the production bundle |
| `pnpm start` | Run the production build |
| `pnpm test` | Run all Vitest unit tests |
| `pnpm db:push` | Generate and apply database migrations |
| `pnpm check` | TypeScript type check (no emit) |
| `pnpm format` | Format all files with Prettier |

---

## Database Schema

### `users`
Stores registered accounts.

| Column | Type | Description |
|--------|------|-------------|
| id | int PK | Auto-increment primary key |
| email | varchar | Unique email address |
| passwordHash | text | bcrypt-hashed password |
| name | text | Display name shown on leaderboard |
| salaryType | enum | `hourly` or `yearly` |
| salaryAmount | decimal | Salary value |
| role | enum | `user` or `admin` |
| createdAt | timestamp | Account creation time |
| updatedAt | timestamp | Last update time |
| lastSignedIn | timestamp | Last login time |

### `toilet_sessions`
Records each completed toilet session.

| Column | Type | Description |
|--------|------|-------------|
| id | int PK | Auto-increment primary key |
| userId | int FK | References `users.id` |
| durationSeconds | int | Session length in seconds |
| earningsAmount | decimal | Money earned during session |
| createdAt | timestamp | When the session was saved |

### `minigame_scores`
Stores every minigame score submission.

| Column | Type | Description |
|--------|------|-------------|
| id | int PK | Auto-increment primary key |
| userId | int FK | References `users.id` |
| gameId | enum | `clog`, `toss`, or `pipe_panic` |
| score | int | Score achieved |
| createdAt | timestamp | When the score was submitted |

---

## Project Structure

```
client/
  src/
    pages/              ← All page components
      Login.tsx         ← Register / sign-in screen
      Dashboard.tsx     ← Personal stats and session history
      Timer.tsx         ← Toilet timer with real-time earnings
      MinigamesHub.tsx  ← Hub page showing all 3 games + personal bests
      MinigameClog.tsx  ← Clog-A-Mole canvas game
      MinigameToss.tsx  ← Paper Toss canvas game
      MinigamePipePanic.tsx ← Pipe Panic canvas game
      Leaderboard.tsx   ← 4-tab leaderboard
      Profile.tsx       ← Edit name and salary
      AdminDashboard.tsx← Admin-only user overview
    components/
      BottomNav.tsx     ← 5-tab bottom navigation bar
    lib/trpc.ts         ← tRPC client binding
    App.tsx             ← Routes and layout
    index.css           ← Global styles and CSS variables
drizzle/
  schema.ts             ← Database table definitions
  migrations/           ← Auto-generated migration files
server/
  routers.ts            ← All tRPC procedures (auth, profile, sessions, minigames)
  db.ts                 ← Database query helpers
  features.test.ts      ← Vitest tests for all procedures
  _core/                ← Framework plumbing (OAuth, context, Vite bridge)
shared/
  const.ts              ← Shared constants
```

---

## API Procedures (tRPC)

| Namespace | Procedure | Auth | Description |
|-----------|-----------|------|-------------|
| `auth` | `register` | Public | Create account with email, password, name, salary |
| `auth` | `login` | Public | Sign in and receive session cookie |
| `auth` | `logout` | Public | Clear session cookie |
| `auth` | `me` | Public | Get current user from session |
| `profile` | `get` | Protected | Get current user's profile |
| `profile` | `updateSalary` | Protected | Update salary type and amount |
| `profile` | `updateName` | Protected | Update display name |
| `sessions` | `save` | Protected | Save a completed toilet session |
| `sessions` | `myHistory` | Protected | Get last 10 sessions for current user |
| `sessions` | `leaderboard` | Public | Get all-time earnings leaderboard |
| `minigames` | `submitScore` | Protected | Submit a minigame score |
| `minigames` | `leaderboard` | Public | Get top scores for a specific game |
| `minigames` | `personalBests` | Protected | Get current user's best score per game |

---

*Built with 💩 and a healthy disregard for productivity.*
