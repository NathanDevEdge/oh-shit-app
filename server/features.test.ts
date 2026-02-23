import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

// Mock the db module so tests don't need a real database
vi.mock("./db", () => ({
  getUserByEmail: vi.fn(),
  getUserById: vi.fn(),
  upsertUser: vi.fn(),
  updateUserSalary: vi.fn(),
  updateUserName: vi.fn(),
  createToiletSession: vi.fn(),
  getUserSessions: vi.fn(),
  getSessionLeaderboard: vi.fn(),
  submitMinigameScore: vi.fn(),
  getMinigameLeaderboard: vi.fn(),
  getUserPersonalBests: vi.fn(),
}));

import * as db from "./db";

type SetCookieCall = { name: string; value: string; options: Record<string, unknown> };
type ClearCookieCall = { name: string; options: Record<string, unknown> };

function createPublicCtx() {
  const setCookies: SetCookieCall[] = [];
  const clearedCookies: ClearCookieCall[] = [];
  const ctx: TrpcContext = {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      cookie: (name: string, value: string, options: Record<string, unknown>) => {
        setCookies.push({ name, value, options });
      },
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as unknown as TrpcContext["res"],
  };
  return { ctx, setCookies, clearedCookies };
}

function createAuthCtx(userId = 1) {
  const { ctx, setCookies } = createPublicCtx();
  ctx.user = {
    id: userId,
    openId: "email_test123",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "email",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return { ctx, setCookies };
}

describe("auth.register", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws CONFLICT if email already exists", async () => {
    vi.mocked(db.getUserByEmail).mockResolvedValue({
      id: 1, openId: "x", email: "exists@test.com", name: null,
      passwordHash: "hash", salaryType: "hourly", salaryAmount: "0",
      loginMethod: "email", role: "user",
      createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
    });
    const { ctx } = createPublicCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.auth.register({ email: "exists@test.com", password: "password123", name: "Test" })
    ).rejects.toThrow("already exists");
  });

  it("creates user and sets session cookie on success", async () => {
    vi.mocked(db.getUserByEmail)
      .mockResolvedValueOnce(undefined) // first call: check existing
      .mockResolvedValueOnce({          // second call: fetch after insert
        id: 42, openId: "email_newuser", email: "new@test.com", name: "New User",
        passwordHash: "hash", salaryType: "hourly", salaryAmount: "50",
        loginMethod: "email", role: "user",
        createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
      });
    vi.mocked(db.upsertUser).mockResolvedValue(undefined);
    const { ctx, setCookies } = createPublicCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.register({
      email: "new@test.com", password: "password123", name: "New User",
    });
    expect(result.success).toBe(true);
    expect(result.user.email).toBe("new@test.com");
    expect(setCookies).toHaveLength(1);
    expect(setCookies[0]?.name).toBe(COOKIE_NAME);
  });
});

describe("auth.login", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws UNAUTHORIZED for unknown email", async () => {
    vi.mocked(db.getUserByEmail).mockResolvedValue(undefined);
    const { ctx } = createPublicCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.auth.login({ email: "nobody@test.com", password: "pass" })
    ).rejects.toThrow("Invalid email or password");
  });
});

describe("auth.logout", () => {
  it("clears the session cookie", async () => {
    const { ctx, clearedCookies } = createPublicCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({ maxAge: -1 });
  });
});

describe("sessions.save", () => {
  beforeEach(() => vi.clearAllMocks());

  it("saves a session for authenticated user", async () => {
    vi.mocked(db.createToiletSession).mockResolvedValue(undefined);
    const { ctx } = createAuthCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.sessions.save({ durationSeconds: 120, earningsAmount: "0.0500" });
    expect(result.success).toBe(true);
    expect(db.createToiletSession).toHaveBeenCalledWith({
      userId: 1, durationSeconds: 120, earningsAmount: "0.0500",
    });
  });
});

describe("sessions.leaderboard", () => {
  it("returns leaderboard data", async () => {
    vi.mocked(db.getSessionLeaderboard).mockResolvedValue([
      { userId: 1, name: "Alice", email: "alice@test.com", totalEarnings: "12.50", totalSessions: 5, totalSeconds: 600 },
    ]);
    const { ctx } = createPublicCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.sessions.leaderboard();
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("Alice");
  });
});

describe("minigames.submitScore", () => {
  beforeEach(() => vi.clearAllMocks());

  it("submits a minigame score for authenticated user", async () => {
    vi.mocked(db.submitMinigameScore).mockResolvedValue(undefined);
    const { ctx } = createAuthCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.minigames.submitScore({ gameId: "clog", score: 150 });
    expect(result.success).toBe(true);
    expect(db.submitMinigameScore).toHaveBeenCalledWith({ userId: 1, gameId: "clog", score: 150 });
  });

  it("accepts pipe_panic gameId", async () => {
    const { ctx } = createAuthCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.minigames.submitScore({ gameId: "pipe_panic", score: 42 });
    expect(result.success).toBe(true);
    expect(db.submitMinigameScore).toHaveBeenCalledWith({ userId: 1, gameId: "pipe_panic", score: 42 });
  });

  it("rejects invalid gameId", async () => {
    const { ctx } = createAuthCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.minigames.submitScore({ gameId: "invalid" as "clog", score: 100 })
    ).rejects.toThrow();
  });
});

describe("minigames.leaderboard", () => {
  it("returns leaderboard for a specific game", async () => {
    vi.mocked(db.getMinigameLeaderboard).mockResolvedValue([
      { userId: 2, name: "Bob", email: "bob@test.com", bestScore: 200, createdAt: new Date() },
    ]);
    const { ctx } = createPublicCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.minigames.leaderboard({ gameId: "toss" });
    expect(result).toHaveLength(1);
    expect(result[0]?.bestScore).toBe(200);
    expect(db.getMinigameLeaderboard).toHaveBeenCalledWith("toss", 50);
  });
});

describe("minigames.personalBests", () => {
  it("returns personal bests for the authenticated user", async () => {
    vi.mocked(db.getUserPersonalBests).mockResolvedValue({ clog: 120, toss: 8, pipe_panic: 15 });
    const { ctx } = createAuthCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.minigames.personalBests();
    expect(result).toEqual({ clog: 120, toss: 8, pipe_panic: 15 });
    expect(db.getUserPersonalBests).toHaveBeenCalledWith(1);
  });
});
