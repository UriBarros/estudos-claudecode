// @vitest-environment node
import { test, expect, vi, beforeEach } from "vitest";
import { SignJWT } from "jose";

// Mock server-only so it doesn't throw outside Next.js
vi.mock("server-only", () => ({}));

// Mock next/headers cookies()
const mockSet = vi.fn();
const mockGet = vi.fn();
const mockDelete = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(() =>
    Promise.resolve({ set: mockSet, get: mockGet, delete: mockDelete })
  ),
}));

const { createSession, getSession } = await import("@/lib/auth");

const JWT_SECRET = new TextEncoder().encode("development-secret-key");

async function makeToken(payload: object, expiresIn = "7d") {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expiresIn)
    .setIssuedAt()
    .sign(JWT_SECRET);
}

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.JWT_SECRET;
  process.env.NODE_ENV = "test";
});

// ─── createSession ────────────────────────────────────────────────────────────

test("createSession: sets auth-token cookie", async () => {
  await createSession("user-1", "user@example.com");
  expect(mockSet).toHaveBeenCalledOnce();
  expect(mockSet.mock.calls[0][0]).toBe("auth-token");
});

test("createSession: JWT contains userId and email", async () => {
  await createSession("user-1", "user@example.com");
  const [, token] = mockSet.mock.calls[0];
  const { jwtVerify } = await import("jose");
  const { payload } = await jwtVerify(token, JWT_SECRET);
  expect(payload.userId).toBe("user-1");
  expect(payload.email).toBe("user@example.com");
});

test("createSession: JWT expiry is ~7 days", async () => {
  const before = Date.now();
  await createSession("user-1", "user@example.com");
  const after = Date.now();
  const [, token] = mockSet.mock.calls[0];
  const { jwtVerify } = await import("jose");
  const { payload } = await jwtVerify(token, JWT_SECRET);
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  expect(payload.exp! * 1000).toBeGreaterThanOrEqual(before + sevenDaysMs - 1000);
  expect(payload.exp! * 1000).toBeLessThanOrEqual(after + sevenDaysMs + 1000);
});

test("createSession: cookie options have httpOnly, sameSite lax, path /", async () => {
  await createSession("user-1", "user@example.com");
  const [, , options] = mockSet.mock.calls[0];
  expect(options.httpOnly).toBe(true);
  expect(options.sameSite).toBe("lax");
  expect(options.path).toBe("/");
});

test("createSession: cookie is not secure outside production", async () => {
  process.env.NODE_ENV = "test";
  await createSession("user-1", "user@example.com");
  const [, , options] = mockSet.mock.calls[0];
  expect(options.secure).toBe(false);
});

test("createSession: cookie is secure in production", async () => {
  process.env.NODE_ENV = "production";
  await createSession("user-1", "user@example.com");
  const [, , options] = mockSet.mock.calls[0];
  expect(options.secure).toBe(true);
});

test("createSession: cookie expires ~7 days from now", async () => {
  const before = Date.now();
  await createSession("user-1", "user@example.com");
  const after = Date.now();
  const [, , options] = mockSet.mock.calls[0];
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  expect(options.expires.getTime()).toBeGreaterThanOrEqual(before + sevenDaysMs - 1000);
  expect(options.expires.getTime()).toBeLessThanOrEqual(after + sevenDaysMs + 1000);
});

// ─── getSession ───────────────────────────────────────────────────────────────

test("getSession: returns null when no cookie is present", async () => {
  mockGet.mockReturnValue(undefined);
  const session = await getSession();
  expect(session).toBeNull();
});

test("getSession: returns the session payload for a valid token", async () => {
  const token = await makeToken({ userId: "user-1", email: "user@example.com" });
  mockGet.mockReturnValue({ value: token });

  const session = await getSession();

  expect(session).not.toBeNull();
  expect(session!.userId).toBe("user-1");
  expect(session!.email).toBe("user@example.com");
});

test("getSession: returns null for a tampered token", async () => {
  const token = await makeToken({ userId: "user-1", email: "user@example.com" });
  mockGet.mockReturnValue({ value: token + "tampered" });

  const session = await getSession();

  expect(session).toBeNull();
});

test("getSession: returns null for an expired token", async () => {
  const token = await makeToken(
    { userId: "user-1", email: "user@example.com" },
    "-1s" // already expired
  );
  mockGet.mockReturnValue({ value: token });

  const session = await getSession();

  expect(session).toBeNull();
});

test("getSession: reads the auth-token cookie by name", async () => {
  mockGet.mockReturnValue(undefined);
  await getSession();
  expect(mockGet).toHaveBeenCalledWith("auth-token");
});
