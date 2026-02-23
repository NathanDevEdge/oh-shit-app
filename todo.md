# Oh Shit App TODO

## Database & Auth
- [x] Design DB schema: users (with password hash), toilet_sessions, minigame_scores
- [x] Run pnpm db:push to create tables
- [x] Build auth API routes: register, login, logout (email + password, no OAuth)
- [x] Update Login page to be a proper register/login screen

## Leaderboard
- [x] Build session leaderboard API (top earners from toilet timer)
- [x] Build minigame leaderboard API (top scores per game)
- [x] Update Leaderboard page to read from DB instead of localStorage
- [x] Update Dashboard to save sessions to DB

## Timer Fix
- [x] Fix timer so it persists across page navigation (keeps running when going to minigames)

## App Wiring
- [x] Update App.tsx to restore all routes with auth guard
- [x] Update BottomNav to work with new auth
- [x] Update Profile page to read from DB user

## Tests
- [x] Write vitest tests for all new tRPC procedures (10 tests passing)

## New Features (Round 3)
- [x] Add display name field to registration form (required at signup)
- [x] Rebuild Paper Toss as physics drag-to-throw game (toilet target, wind, progressive difficulty)
- [x] Fix Paper Toss: larger grab hitbox + ensure throw always has enough power to reach toilet

## New Features (Round 4)
- [x] Add streak multiplier to Clog-A-Mole (consecutive hits = 2x/3x score)
- [x] Add game over screen to Clog-A-Mole (Play Again, View Leaderboard, Back to Timer)
- [x] Add game over screen to Paper Toss (Play Again, View Leaderboard, Back to Timer)

## New Features (Round 5)
- [x] Build Pipe Panic core mechanics (Flappy Bird-style, turd character, sewer pipes, tap-to-flap, lives, leaderboard)
- [x] Add Pipe Panic route to App.tsx and nav entry to BottomNav / minigame hub
- [x] Add "pipe_panic" game ID to minigame score submission on server
