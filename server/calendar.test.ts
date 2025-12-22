import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

// Mock the database module
vi.mock("./db", () => ({
  getCalendarConnections: vi.fn().mockResolvedValue([]),
  getCalendarConnection: vi.fn().mockResolvedValue(undefined),
  createCalendarConnection: vi.fn().mockResolvedValue(1),
  updateCalendarConnection: vi.fn().mockResolvedValue(undefined),
  deleteCalendarConnection: vi.fn().mockResolvedValue(undefined),
  getEvents: vi.fn().mockResolvedValue([]),
  getEvent: vi.fn().mockResolvedValue(undefined),
  createEvent: vi.fn().mockResolvedValue(1),
  updateEvent: vi.fn().mockResolvedValue(undefined),
  deleteEvent: vi.fn().mockResolvedValue(undefined),
  createSyncLog: vi.fn().mockResolvedValue(1),
  updateSyncLog: vi.fn().mockResolvedValue(undefined),
  getSyncLogs: vi.fn().mockResolvedValue([]),
}));

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("Calendar Connections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists calendar connections for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.connections.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("creates a new calendar connection", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.connections.create({
      provider: "google",
      calendarName: "My Google Calendar",
      color: "#4285F4",
    });

    expect(result).toHaveProperty("id");
    expect(result.id).toBe(1);
  });

  it("updates a calendar connection", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.connections.update({
      id: 1,
      syncDirection: "bidirectional",
      color: "#FF3B30",
    });

    expect(result).toEqual({ success: true });
  });

  it("deletes a calendar connection", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.connections.delete({ id: 1 });
    expect(result).toEqual({ success: true });
  });
});

describe("Events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists events for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.events.list({
      startTime: Date.now(),
      endTime: Date.now() + 86400000,
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it("creates a new event", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const now = Date.now();
    const result = await caller.events.create({
      title: "Test Meeting",
      description: "A test meeting",
      startTime: now,
      endTime: now + 3600000,
      isAllDay: false,
      color: "#007AFF",
    });

    expect(result).toHaveProperty("id");
    expect(result.id).toBe(1);
  });

  it("updates an event", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.events.update({
      id: 1,
      title: "Updated Meeting",
    });

    expect(result).toEqual({ success: true });
  });

  it("deletes an event", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.events.delete({ id: 1 });
    expect(result).toEqual({ success: true });
  });

  it("rejects event creation without title", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const now = Date.now();
    await expect(
      caller.events.create({
        title: "",
        startTime: now,
        endTime: now + 3600000,
      })
    ).rejects.toThrow();
  });
});

describe("Sync Operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retrieves sync logs", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.sync.logs({ limit: 10 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("triggers sync for all connections", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.sync.trigger({});
    expect(result).toHaveProperty("results");
    expect(Array.isArray(result.results)).toBe(true);
  });
});

describe("Auth", () => {
  it("returns user for authenticated context", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.email).toBe("test@example.com");
  });

  it("returns null for unauthenticated context", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});
