import { eq, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, toiletSessions, minigameScores, InsertToiletSession, InsertMinigameScore } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── User helpers ─────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod", "passwordHash"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.salaryType !== undefined) { values.salaryType = user.salaryType; updateSet.salaryType = user.salaryType; }
    if (user.salaryAmount !== undefined) { values.salaryAmount = user.salaryAmount; updateSet.salaryAmount = user.salaryAmount; }
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserSalary(userId: number, salaryType: "hourly" | "yearly", salaryAmount: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ salaryType, salaryAmount, updatedAt: new Date() }).where(eq(users.id, userId));
}

export async function updateUserName(userId: number, name: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ name, updatedAt: new Date() }).where(eq(users.id, userId));
}

// ─── Toilet session helpers ───────────────────────────────────────────────────

export async function createToiletSession(session: InsertToiletSession) {
  const db = await getDb();
  if (!db) return;
  await db.insert(toiletSessions).values(session);
}

export async function getUserSessions(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(toiletSessions)
    .where(eq(toiletSessions.userId, userId))
    .orderBy(desc(toiletSessions.createdAt))
    .limit(limit);
}

export async function getSessionLeaderboard(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      userId: toiletSessions.userId,
      name: users.name,
      email: users.email,
      totalEarnings: sql<string>`SUM(${toiletSessions.earningsAmount})`,
      totalSessions: sql<number>`COUNT(${toiletSessions.id})`,
      totalSeconds: sql<number>`SUM(${toiletSessions.durationSeconds})`,
    })
    .from(toiletSessions)
    .innerJoin(users, eq(toiletSessions.userId, users.id))
    .groupBy(toiletSessions.userId, users.name, users.email)
    .orderBy(desc(sql`SUM(${toiletSessions.earningsAmount})`))
    .limit(limit);
}

// ─── Minigame score helpers ───────────────────────────────────────────────────

export async function submitMinigameScore(score: InsertMinigameScore) {
  const db = await getDb();
  if (!db) return;
  await db.insert(minigameScores).values(score);
}

export async function getMinigameLeaderboard(gameId: string, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      userId: minigameScores.userId,
      name: users.name,
      email: users.email,
      bestScore: sql<number>`MAX(${minigameScores.score})`,
      createdAt: sql<Date>`MAX(${minigameScores.createdAt})`,
    })
    .from(minigameScores)
    .innerJoin(users, eq(minigameScores.userId, users.id))
    .where(eq(minigameScores.gameId, gameId))
    .groupBy(minigameScores.userId, users.name, users.email)
    .orderBy(desc(sql`MAX(${minigameScores.score})`))
    .limit(limit);
}
