import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { SyncEngine } from "./services/syncEngine";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Calendar Connections
  connections: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getCalendarConnections(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getCalendarConnection(input.id, ctx.user.id);
      }),

    create: protectedProcedure
      .input(z.object({
        provider: z.enum(['google', 'apple', 'notion']),
        calendarName: z.string().optional(),
        color: z.string().optional(),
        syncDirection: z.enum(['none', 'pull', 'push', 'bidirectional']).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createCalendarConnection({
          userId: ctx.user.id,
          provider: input.provider,
          calendarName: input.calendarName,
          color: input.color || '#007AFF',
          syncDirection: input.syncDirection || 'bidirectional',
          isConnected: false,
        });
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        isConnected: z.boolean().optional(),
        syncDirection: z.enum(['none', 'pull', 'push', 'bidirectional']).optional(),
        calendarName: z.string().optional(),
        color: z.string().optional(),
        accessToken: z.string().optional(),
        refreshToken: z.string().optional(),
        tokenExpiresAt: z.number().optional(),
        caldavUrl: z.string().optional(),
        caldavUsername: z.string().optional(),
        caldavPassword: z.string().optional(),
        notionDatabaseId: z.string().optional(),
        notionAccessToken: z.string().optional(),
        calendarId: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        await db.updateCalendarConnection(id, ctx.user.id, updates);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteCalendarConnection(input.id, ctx.user.id);
        return { success: true };
      }),

    // Connect to Google Calendar
    connectGoogle: protectedProcedure
      .input(z.object({
        connectionId: z.number(),
        accessToken: z.string(),
        refreshToken: z.string().optional(),
        expiresAt: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateCalendarConnection(input.connectionId, ctx.user.id, {
          isConnected: true,
          accessToken: input.accessToken,
          refreshToken: input.refreshToken,
          tokenExpiresAt: input.expiresAt,
          lastSyncAt: new Date(),
        });
        return { success: true };
      }),

    // Connect to Apple Calendar (CalDAV)
    connectApple: protectedProcedure
      .input(z.object({
        connectionId: z.number(),
        caldavUrl: z.string(),
        username: z.string(),
        password: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateCalendarConnection(input.connectionId, ctx.user.id, {
          isConnected: true,
          caldavUrl: input.caldavUrl,
          caldavUsername: input.username,
          caldavPassword: input.password,
          lastSyncAt: new Date(),
        });
        return { success: true };
      }),

    // Connect to Notion
    connectNotion: protectedProcedure
      .input(z.object({
        connectionId: z.number(),
        accessToken: z.string(),
        databaseId: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateCalendarConnection(input.connectionId, ctx.user.id, {
          isConnected: true,
          notionAccessToken: input.accessToken,
          notionDatabaseId: input.databaseId,
          lastSyncAt: new Date(),
        });
        return { success: true };
      }),
  }),

  // Events
  events: router({
    list: protectedProcedure
      .input(z.object({
        startTime: z.number().optional(),
        endTime: z.number().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        return db.getEvents(ctx.user.id, input?.startTime, input?.endTime);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getEvent(input.id, ctx.user.id);
      }),

    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        location: z.string().optional(),
        startTime: z.number(),
        endTime: z.number(),
        isAllDay: z.boolean().optional(),
        color: z.string().optional(),
        recurrenceRule: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createEvent({
          userId: ctx.user.id,
          title: input.title,
          description: input.description,
          location: input.location,
          startTime: input.startTime,
          endTime: input.endTime,
          isAllDay: input.isAllDay || false,
          color: input.color || '#007AFF',
          recurrenceRule: input.recurrenceRule,
          source: 'local',
          syncStatus: 'pending',
        });
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        location: z.string().optional(),
        startTime: z.number().optional(),
        endTime: z.number().optional(),
        isAllDay: z.boolean().optional(),
        color: z.string().optional(),
        recurrenceRule: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        await db.updateEvent(id, ctx.user.id, { ...updates, syncStatus: 'pending' });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteEvent(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // Sync operations
  sync: router({
    logs: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        return db.getSyncLogs(ctx.user.id, input?.limit || 20);
      }),

    trigger: protectedProcedure
      .input(z.object({
        connectionId: z.number().optional(),
      }).optional())
      .mutation(async ({ ctx, input }) => {
        const syncEngine = new SyncEngine(ctx.user.id);
        
        if (input?.connectionId) {
          const connection = await db.getCalendarConnection(input.connectionId, ctx.user.id);
          if (!connection) {
            throw new Error('Connection not found');
          }
          const result = await syncEngine.syncConnection(connection);
          return { results: [result] };
        } else {
          const results = await syncEngine.syncAll();
          return { results };
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
