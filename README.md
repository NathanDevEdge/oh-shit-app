# 💩 Turd Earnings

> **Track how much you earn on the throne.**

Turd Earnings is a fun, social web app that calculates how much money you make while sitting on the toilet — based on your real salary. Compete with friends on the global leaderboard, kill time with built-in minigames, and discover just how valuable your bathroom breaks really are.

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

---

## Features

| Feature | Description |
|---|---|
| **Email Auth** | Register and log in with email and password — no third-party sign-in required |
| **Toilet Timer** | Start a session when you sit down, stop it when you're done — earnings calculated in real time |
| **Global Leaderboard** | See who earns the most on the throne across all users |
| **Minigames** | Two games to play while you wait: Clog-A-Mole and Paper Toss |
| **Minigame Leaderboards** | Separate high-score boards for each minigame |
| **Persistent Timer** | The toilet timer keeps running even when you navigate to a minigame |
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

Navigate to the **Gotta Go** (Timer) page from the bottom navigation bar. Press **Start Session** when you sit down. The timer will count up in real time and display your earnings as they accumulate based on your salary.

When you're done, press **Stop Session**. Your session is automatically saved to the database and contributes to your leaderboard total.

> **Tip:** You can navigate away to play a minigame while the timer is running — it will keep going in the background and a banner will remind you it's active.

### 3. Check Your Stats

The **Home** (Dashboard) page shows your total lifetime earnings, total time spent on the throne, number of sessions, and a history of your recent sessions.

---

## App Pages

### Home (Dashboard)

Your personal stats hub. Displays:

- Total earnings across all sessions
- Total time spent on the throne
- Number of sessions recorded
- A scrollable list of recent sessions with date, duration, and earnings per session

### Gotta Go (Timer)

The core feature of the app. A large timer counts up from zero. Your per-second earnings rate is calculated from your salary and displayed live. Buttons to start and stop the session are front and centre. Quick-access buttons to both minigames are also available here so you can jump in without stopping the timer.

### Ranks (Leaderboard)

Three tabs of competitive glory:

- **Toilet Timer** — ranked by total lifetime earnings across all sessions
- **Clog-A-Mole** — ranked by personal best score in the whack-a-mole game
- **Paper Toss** — ranked by personal best score in the toss game

### Profile

Update your account details at any time:

- Change your display name
- Switch between hourly and yearly salary
- Update your salary amount

Changes take effect immediately and are reflected in future session calculations.

### Admin Dashboard

Accessible at `/admin`. Provides the app owner with an overview of registered users and overall activity. Standard users are not shown this page in the navigation.

---

## Minigames

Both minigames are accessible from the Timer page. The toilet timer continues running in the background while you play, and a live banner at the top of each game shows the current elapsed time.

### Clog-A-Mole

A whack-a-mole style game where you tap or click on the targets as they appear. The game gets progressively faster as your score increases. Your best score is saved to the leaderboard automatically when the game ends.

### Paper Toss

A physics-based drag-to-throw game inspired by the classic mobile game.

**How to play:**

1. Press **Start Game** to begin.
2. **Click and drag** the paper ball (or use your finger on mobile) in the direction you want to throw — drag away from the toilet to aim toward it.
3. Release to launch. A dotted trajectory line shows your predicted path as you drag.
4. Land the ball in the toilet bowl to score a point.
5. Miss three times and the game is over — your score is submitted to the leaderboard.

**Wind system:** After each successful toss, the wind changes direction and strength. The wind indicator at the top shows the current conditions:

| Label | Strength | Effect |
|---|---|---|
| Calm | 0–0.3 | Negligible drift |
| Breezy | 0.3–1.2 | Slight curve |
| Windy | 1.2–2.2 | Noticeable push — aim to compensate |
| Stormy | 2.2+ | Strong drift — shown in red |

**Progressive difficulty:** The maximum possible wind strength increases with your score, making higher scores genuinely harder to achieve.

---

## Leaderboards

All leaderboard data is stored in the database and is shared across all users in real time. There is no need to be on the same device or browser — everyone competes together.

- **Toilet Timer leaderboard** aggregates total earnings across all saved sessions per user.
- **Minigame leaderboards** track each user's personal best score for that game. Only the best score per user is shown — not every attempt.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Tailwind CSS 4, Wouter (routing) |
| Backend | Node.js, Express 4, tRPC 11 |
| Database | MySQL (via Drizzle ORM) |
| Auth | Custom email/password auth with JWT session cookies (bcryptjs + jose) |
| UI Components | shadcn/ui, Radix UI, Lucide React |
| Minigame Rendering | HTML5 Canvas API |
| Hosting | Manus (full-stack, persistent) |

---

## Local Development

### Prerequisites

- Node.js 22+
- pnpm 10+
- A MySQL database (connection string in `.env`)

### Setup

```bash
# Clone the repository
git clone https://github.com/NathanDevEdge/oh-shit-app.git
cd oh-shit-app

# Install dependencies
pnpm install

# Set up environment variables
# Add DATABASE_URL and JWT_SECRET to your environment
# (see .env.example or platform secrets for reference)

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
| `pnpm test` | Run all vitest unit tests |
| `pnpm db:push` | Generate and run database migrations |

---

## Database Schema

The app uses three database tables:

**`users`** — stores registered accounts with hashed passwords, display name, salary info (type and amount), and role (`user` or `admin`).

**`toilet_sessions`** — records each completed toilet session with duration in seconds and earnings amount, linked to a user by ID.

**`minigame_scores`** — stores every score submission per game per user. The leaderboard query uses `MAX(score)` to show only each user's personal best per game.

---

*Built with 💩 and a lot of free time.*
