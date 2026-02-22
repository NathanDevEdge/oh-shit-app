import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  salaryType: mysqlEnum("salaryType", ["hourly", "yearly"]).default("hourly").notNull(),
  salaryAmount: decimal("salaryAmount", { precision: 10, scale: 2 }).default("0"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Toilet sessions — each time someone sits on the throne and earns money.
 */
export const toiletSessions = mysqlTable("toilet_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  durationSeconds: int("durationSeconds").notNull(),
  earningsAmount: decimal("earningsAmount", { precision: 10, scale: 4 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ToiletSession = typeof toiletSessions.$inferSelect;
export type InsertToiletSession = typeof toiletSessions.$inferInsert;

/**
 * Minigame scores — top scores per game per user.
 */
export const minigameScores = mysqlTable("minigame_scores", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  gameId: varchar("gameId", { length: 64 }).notNull(), // 'clog' | 'toss'
  score: int("score").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MinigameScore = typeof minigameScores.$inferSelect;
export type InsertMinigameScore = typeof minigameScores.$inferInsert;