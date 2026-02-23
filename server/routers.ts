import { z } from "zod";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import { SignJWT } from "jose";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  getUserByEmail,
  getUserById,
  upsertUser,
  updateUserSalary,
  updateUserName,
  createToiletSession,
  getUserSessions,
  getSessionLeaderboard,
  submitMinigameScore,
  getMinigameLeaderboard,
  getUserPersonalBests,
} from "./db";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret-change-me");

async function createSessionToken(userId: number, openId: string): Promise<string> {
  return new SignJWT({ sub: openId, userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);
}

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),

    register: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(1),
        salaryType: z.enum(["hourly", "yearly"]).default("hourly"),
        salaryAmount: z.string().default("0"),
      }))
      .mutation(async ({ input, ctx }) => {
        const existing = await getUserByEmail(input.email);
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists." });
        }
        const passwordHash = await bcrypt.hash(input.password, 12);
        const openId = `email_${nanoid(16)}`;
        await upsertUser({
          openId,
          email: input.email,
          name: input.name,
          passwordHash,
          salaryType: input.salaryType,
          salaryAmount: input.salaryAmount,
          loginMethod: "email",
          lastSignedIn: new Date(),
        });
        const user = await getUserByEmail(input.email);
        if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create account." });
        const token = await createSessionToken(user.id, user.openId);
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });
        return { success: true, user: { id: user.id, email: user.email, name: user.name, salaryType: user.salaryType, salaryAmount: user.salaryAmount } };
      }),

    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await getUserByEmail(input.email);
        if (!user || !user.passwordHash) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password." });
        }
        const valid = await bcrypt.compare(input.password, user.passwordHash);
        if (!valid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password." });
        }
        const token = await createSessionToken(user.id, user.openId);
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });
        return { success: true, user: { id: user.id, email: user.email, name: user.name, salaryType: user.salaryType, salaryAmount: user.salaryAmount } };
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const user = await getUserById(ctx.user.id);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });
      return { id: user.id, email: user.email, name: user.name, salaryType: user.salaryType, salaryAmount: user.salaryAmount };
    }),

    updateSalary: protectedProcedure
      .input(z.object({
        salaryType: z.enum(["hourly", "yearly"]),
        salaryAmount: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        await updateUserSalary(ctx.user.id, input.salaryType, input.salaryAmount);
        return { success: true };
      }),

    updateName: protectedProcedure
      .input(z.object({ name: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        await updateUserName(ctx.user.id, input.name);
        return { success: true };
      }),
  }),

  sessions: router({
    save: protectedProcedure
      .input(z.object({
        durationSeconds: z.number().int().positive(),
        earningsAmount: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        await createToiletSession({
          userId: ctx.user.id,
          durationSeconds: input.durationSeconds,
          earningsAmount: input.earningsAmount,
        });
        return { success: true };
      }),

    myHistory: protectedProcedure.query(async ({ ctx }) => {
      return getUserSessions(ctx.user.id, 20);
    }),

    leaderboard: publicProcedure.query(async () => {
      return getSessionLeaderboard(50);
    }),
  }),

  minigames: router({
    submitScore: protectedProcedure
      .input(z.object({
        gameId: z.enum(["clog", "toss", "pipe_panic"]),
        score: z.number().int().nonnegative(),
      }))
      .mutation(async ({ input, ctx }) => {
        await submitMinigameScore({
          userId: ctx.user.id,
          gameId: input.gameId,
          score: input.score,
        });
        return { success: true };
      }),

    leaderboard: publicProcedure
      .input(z.object({ gameId: z.enum(["clog", "toss", "pipe_panic"]) }))
      .query(async ({ input }) => {
        return getMinigameLeaderboard(input.gameId, 50);
      }),

    personalBests: protectedProcedure.query(async ({ ctx }) => {
      return getUserPersonalBests(ctx.user.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
